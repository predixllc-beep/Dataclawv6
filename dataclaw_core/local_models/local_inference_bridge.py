import json
import logging
import requests

logger = logging.getLogger("LocalInferenceBridge")

class LocalInferenceBridge:
    """Centralized bridge to route all LLM requests to local inference servers (Ollama/vLLM/NIM)."""
    
    def __init__(self, endpoint="http://localhost:11434/v1"):
        self.endpoint = endpoint

    def query(self, model: str, prompt: str, system_prompt: str = "") -> str:
        """Routes a prompt to the specified local model mimicking the OpenAI completion protocol."""
        headers = {
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
            
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": False
        }
        
        # Determine if it's Ollama or OpenAI compatible based on endpoint
        url = self.endpoint
        if "11434" in self.endpoint and "v1" not in self.endpoint:
             url = f"{self.endpoint}/api/chat"
             
        if "/v1" in url and "chat/completions" not in url:
            url = f"{url}/chat/completions"

        logger.info(f"Routing to Local LLM ({model}) via {url}")
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()
            
            # OpenAI compatible response
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
            # Native Ollama response
            elif "message" in data:
                return data["message"]["content"]
            else:
                return f"[LocalInferenceBridge Output]: {json.dumps(data)}"
        except Exception as e:
            logger.error(f"Failed to query {model} at {url}: {e}")
            return f"[LocalInferenceBridge Fallback]: Offline simulated response due to error: {e}"
