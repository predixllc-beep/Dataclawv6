import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ModelRouter:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.primary = config.get("primary", "mistral")
        self.fallback = config.get("fallback", "deepseek")
        self.local_only = config.get("local_only", True)
        
    def route(self, task_type: str, prompt: str) -> str:
        """Routes task to appropriate model"""
        target_model = self.primary
        
        # Task aware selection
        if task_type == "reasoning":
            target_model = "deepseek"
        elif task_type == "coding":
            target_model = "codellama"
            
        logger.info(f"Routing task '{task_type}' to model: {target_model}")
        
        try:
            return self._execute_model(target_model, prompt)
        except Exception as e:
            logger.warning(f"Primary model {target_model} failed. Falling back to {self.fallback}")
            return self._execute_model(self.fallback, prompt)
            
    def _execute_model(self, model_name: str, prompt: str) -> str:
        # Simulate local model execution
        return f"[Simulated execution by {model_name}]: Response for '{prompt[:20]}...'"
