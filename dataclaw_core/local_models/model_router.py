import logging
import requests
import json
from typing import Dict, Any

from .model_registry import LocalModelRegistry
from .model_failover import ModelFailoverChain

logger = logging.getLogger(__name__)

class InferenceRouter:
    """Task-Aware Model Router for Local Inference.
    Eliminates dependency on paid APIs locally, delegating directly to Ollama/vLLM.
    """
    def __init__(self):
        self.registry = LocalModelRegistry()
        self.failover = ModelFailoverChain(self.registry)
        self.ollama_endpoint = "http://localhost:11434/api/generate"
        self.vllm_endpoint = "http://localhost:8000/v1/completions"

    def _call_ollama(self, model: str, prompt: str) -> str:
        payload = {"model": model, "prompt": prompt, "stream": False}
        try:
            response = requests.post(self.ollama_endpoint, json=payload, timeout=120)
            response.raise_for_status()
            return response.json().get("response", "")
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama inference failed for model {model}: {e}")
            raise

    def _call_vllm(self, model: str, prompt: str) -> str:
        payload = {"model": model, "prompt": prompt, "max_tokens": 1024}
        try:
            response = requests.post(self.vllm_endpoint, json=payload, timeout=120)
            response.raise_for_status()
            return response.json()["choices"][0]["text"]
        except requests.exceptions.RequestException as e:
            logger.error(f"vLLM inference failed for model {model}: {e}")
            raise

    def execute_inference(self, model_specs: dict, prompt: str) -> str:
        backend = model_specs.get("backend", "ollama")
        model_name = model_specs.get("model")
        
        logger.info(f"Executing local inference via {backend} on {model_name}")
        
        if backend == "vllm":
            return self._call_vllm(model_name, prompt)
        else:
            return self._call_ollama(model_name, prompt)
            
    def route_task(self, task_type: str, prompt: str) -> Dict[str, Any]:
        """Routes a task to the appropriate Mixture of Local Experts logic."""
        role_map = {
            "latency_critical": "low_latency",
            "reasoning": "reasoning",
            "coding": "signal_generation",
            "arbitration": "arbitration"
        }
        
        target_role = role_map.get(task_type, "low_latency")
        
        def execution_func(model_specs: dict):
            result = self.execute_inference(model_specs, prompt)
            return {"status": "success", "model_used": model_specs["model"], "raw_output": result}

        return self.failover.execute_with_failover(target_role, execution_func)
