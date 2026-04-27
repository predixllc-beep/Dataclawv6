"""
Model Router for Dataclaw v4.

This module provides a unified interface for routing requests to various LLM providers:
- Gemini (Primary)
- Ollama (Local Fallback)
- OpenAI (Secondary Fallback)

Features:
- Graceful degradation: If primary fails, fallbacks are attempted.
- Retry mechanism with exponential backoff.
- Status and health monitoring.
"""

import os
import json
import time
import asyncio
import logging
from typing import Dict, Any, Optional

from dotenv import load_dotenv

# Try to use aiohttp if available for async HTTP requests, else fallback to standard library / asyncio wrap
try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False
    import requests

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("dataclaw_core.ModelRouter")

class ModelRouter:
    """
    Singleton Model Router for LLM access.
    Handles routing between Gemini, Ollama, and OpenAI with fallback logic.
    """
    
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ModelRouter, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        
        # State tracking
        self.active_provider = "gemini" if self.gemini_api_key else "ollama"
        self.latency_stats: dict[str, list[float]] = {
            "gemini": [],
            "ollama": [],
            "openai": []
        }
        self.health_status: dict[str, str] = {
            "gemini": "unknown",
            "ollama": "unknown",
            "openai": "unknown"
        }
        
        if not self.gemini_api_key:
            logger.warning("GEMINI_API_KEY not found. Defaulting active provider to Ollama.")
            
        self._initialized = True

    def get_status(self) -> dict:
        """
        Returns the current status of the model router, active model, latency stats, and health.
        """
        # Calculate average latency in ms
        avg_latency = {}
        for provider, stats in self.latency_stats.items():
            if stats:
                recent = stats[-10:]  # Last 10 calls
                avg_latency[provider] = sum(recent) / len(recent)
            else:
                avg_latency[provider] = 0.0

        status = {
            "active_provider": self.active_provider,
            "health_status": self.health_status,
            "average_latency_ms": avg_latency,
            "configured_providers": {
                "gemini": bool(self.gemini_api_key),
                "ollama": True,  # Assumed true as it's local
                "openai": bool(self.openai_api_key)
            }
        }
        return status

    async def _make_request(self, method: str, url: str, headers: dict = None, json_data: dict = None) -> Dict[str, Any]:
        """Helper to make HTTP request acting as cross-compatible fetch logic."""
        start_time = time.time()
        try:
            if HAS_AIOHTTP:
                async with aiohttp.ClientSession() as session:
                    async with session.request(method, url, headers=headers, json=json_data) as response:
                        response.raise_for_status()
                        result = await response.json()
                        return {"status": response.status, "data": result, "latency": time.time() - start_time}
            else:
                # Use requests in async context via thread
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: requests.request(method, url, headers=headers, json=json_data, timeout=30)
                )
                response.raise_for_status()
                result = response.json()
                return {"status": response.status_code, "data": result, "latency": time.time() - start_time}
        except Exception as e:
            logger.error(f"HTTP request failed: {e}")
            raise

    # ------------------- Provider Specific Callers -------------------

    async def _call_gemini(self, prompt: str, system_prompt: str = None, temperature: float = 0.7, max_tokens: int = 2048, model: str = "gemini-1.5-flash") -> str:
        """Make an API call to Google's Gemini."""
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_api_key}"
        headers = {"Content-Type": "application/json"}
        
        contents = []
        if system_prompt:
            # Send system prompt and user prompt combined as per minimal spec
            contents.append({
                "role": "user", 
                "parts": [{"text": f"System Instruction: {system_prompt}\n\nUser Request: {prompt}"}]
            })
        else:
            contents.append({"role": "user", "parts": [{"text": prompt}]})
            
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }
        
        res = await self._make_request("POST", url, headers=headers, json_data=payload)
        self.health_status["gemini"] = "healthy"
        self._record_latency("gemini", res["latency"])
        
        try:
            text_response = res["data"]["candidates"][0]["content"]["parts"][0]["text"]
            return text_response
        except (KeyError, IndexError):
            logger.error(f"Unexpected response format from Gemini: {res['data']}")
            raise ValueError("Invalid response format from Gemini")

    async def _call_ollama(self, prompt: str, system_prompt: str = None, temperature: float = 0.7, max_tokens: int = 2048, model: str = "llama3") -> str:
        """Make an API call to local Ollama instance."""
        url = f"{self.ollama_host}/api/generate"
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        if system_prompt:
            payload["system"] = system_prompt
            
        res = await self._make_request("POST", url, json_data=payload)
        self.health_status["ollama"] = "healthy"
        self._record_latency("ollama", res["latency"])
        
        try:
            return res["data"]["response"]
        except KeyError:
            logger.error(f"Unexpected response format from Ollama: {res['data']}")
            raise ValueError("Invalid response format from Ollama")

    async def _call_openai(self, prompt: str, system_prompt: str = None, temperature: float = 0.7, max_tokens: int = 2048, model: str = "gpt-4o-mini") -> str:
        """Make an API call to OpenAI implementation."""
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")
            
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
            
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        res = await self._make_request("POST", url, headers=headers, json_data=payload)
        self.health_status["openai"] = "healthy"
        self._record_latency("openai", res["latency"])
        
        try:
            return res["data"]["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            logger.error(f"Unexpected response format from OpenAI: {res['data']}")
            raise ValueError("Invalid response format from OpenAI")

    def _record_latency(self, provider: str, duration_sec: float):
        """Record the request latency in milliseconds for status reporting."""
        ms_latency = duration_sec * 1000.0
        self.latency_stats[provider].append(ms_latency)
        # Prevent unbounded growth
        if len(self.latency_stats[provider]) > 100:
            self.latency_stats[provider] = self.latency_stats[provider][-100:]

    # ------------------- High Level Generators -------------------

    async def generate(self, prompt: str, system_prompt: str = None, temperature: float = 0.7, max_tokens: int = 2048, model: str = None) -> str:
        """
        Generate text response from configured LLM providers.
        Implements fallback logic: Gemini -> Ollama -> OpenAI.
        Includes a retry mechanism (up to 3 times) per provider and handles rate limits via exponential backoff.
        
        Args:
            prompt (str): The user's input prompt.
            system_prompt (str, optional): The system prompt/instructions.
            temperature (float): The sampling temperature.
            max_tokens (int): Maximum generation tokens.
            model (str, optional): Specific model string, falls back to providers' default.
            
        Returns:
            str: Generated text response.
        """
        max_retries = 3
        # Evaluation order: Gemini (Primary), Ollama (Local fallback), OpenAI (Distant fallback)
        providers = ["gemini", "ollama", "openai"]
        
        for provider in providers:
            # Skip if API key is missing for protected services
            if provider == "gemini" and not self.gemini_api_key:
                logger.info("Skipping Gemini (no API key configured)")
                continue
            if provider == "openai" and not self.openai_api_key:
                logger.info("Skipping OpenAI (no API key configured)")
                continue

            retry_count = 0
            while retry_count < max_retries:
                try:
                    logger.info(f"Attempting generation with {provider} (Try {retry_count + 1}/{max_retries})")
                    
                    if provider == "gemini":
                        target_model = model if model else "gemini-1.5-flash"
                        result = await self._call_gemini(prompt, system_prompt, temperature, max_tokens, target_model)
                    elif provider == "ollama":
                        target_model = model if model else "llama3"
                        result = await self._call_ollama(prompt, system_prompt, temperature, max_tokens, target_model)
                    elif provider == "openai":
                        target_model = model if model else "gpt-4o-mini"
                        result = await self._call_openai(prompt, system_prompt, temperature, max_tokens, target_model)
                    else:
                        raise ValueError(f"Unknown provider: {provider}")
                        
                    self.active_provider = provider
                    return result
                    
                except Exception as e:
                    logger.error(f"Provider {provider} generation failed: {e}")
                    self.health_status[provider] = "failing"
                    retry_count += 1
                    
                    if retry_count < max_retries:
                        # Exponential backoff for rate limiting handling
                        backoff = 2 ** retry_count
                        logger.info(f"Retrying {provider} in {backoff} seconds...")
                        await asyncio.sleep(backoff)
                    else:
                        logger.error(f"Max retries ({max_retries}) reached for {provider}, falling back to next provider.")
                        break # Exits while loop, moves to next provider in for loop
                        
        logger.error("All providers failed to generate a response.")
        return "ERROR: All configured LLM providers failed to process the request."

    async def generate_structured(self, prompt: str, response_schema: dict, temperature: float = 0.3) -> dict:
        """
        Generates a structured JSON response enforcing the given schema.
        
        Args:
            prompt (str): User prompt.
            response_schema (dict): Expected JSON schema definition.
            temperature (float): Model temperature (default: 0.3, lower for stability).
            
        Returns:
            dict: The parsed JSON dictionary matching the requested schema as closely as possible.
        """
        sys_prompt = (
            "You are a structured data extraction AI. You MUST respond ONLY with valid JSON "
            "that matches the following schema:\n"
            f"{json.dumps(response_schema, indent=2)}\n"
            "Do NOT wrap the JSON in Markdown formatting (e.g. no ```json blocks). Return ONLY the raw JSON text."
        )
        
        response_text = await self.generate(
            prompt=prompt,
            system_prompt=sys_prompt,
            temperature=temperature
        )
        
        # Clean up markdown format if model ignored the instruction
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()
        
        try:
            parsed_json = json.loads(clean_text)
            return parsed_json
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse structured JSON. Output was: {clean_text[:100]}... Error: {e}")
            # If all providers fail to give valid JSON, fall back to an error summary representation.
            return {"error": "Failed to generate structured response", "raw_output": clean_text}
