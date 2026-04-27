import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class LocalModelRegistry:
    """Registry maintaining the local Mixture of Experts for different roles."""
    def __init__(self):
        # Default local offline stack with quantized models for edge execution
        self.models = {
            "fast_executor": {
                "model": "mistral:7b-instruct", 
                "role": "low_latency", 
                "backend": "ollama", 
                "quant": "4-bit"
            },
            "deep_reasoning": {
                "model": "deepseek-r1:latest", 
                "role": "reasoning", 
                "backend": "ollama", 
                "quant": "8-bit"
            },
            "quant_specialist": {
                "model": "codellama:7b", 
                "role": "signal_generation", 
                "backend": "ollama", 
                "quant": "4-bit"
            },
            "supervisor": {
                "model": "llama3:8b", 
                "role": "arbitration", 
                "backend": "ollama", 
                "quant": "4-bit"
            },
            "fallback": {
                "model": "tinydolphin:latest", 
                "role": "emergency", 
                "backend": "ollama", 
                "quant": "4-bit"
            }
        }

    def get_model_for_role(self, role: str) -> dict:
        """Automatically assigns the best registered local model per role."""
        for k, v in self.models.items():
            if v["role"] == role:
                return v
        return self.models["fallback"]

    def update_model(self, alias: str, new_model_config: Dict[str, Any]):
        """Allows hot-swapping models without restarting the system."""
        if alias in self.models:
            self.models[alias].update(new_model_config)
            logger.info(f"Hot-swapped model {alias} to {new_model_config.get('model')}")
        else:
            self.models[alias] = new_model_config
