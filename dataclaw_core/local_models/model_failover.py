import logging
from typing import Any, Callable

logger = logging.getLogger(__name__)

class ModelFailoverChain:
    """Cascading failover: Primary -> Secondary -> Quantized -> Safe Mode"""
    
    def __init__(self, registry):
        self.registry = registry

    def execute_with_failover(self, primary_role: str, task_func: Callable[[dict], Any]) -> Any:
        primary_model = self.registry.get_model_for_role(primary_role)
        fallback_model = self.registry.models.get("fallback")
        
        # Build the cascade chain
        chain = [primary_model, fallback_model, "safe_mode"]
        
        for step in chain:
            if step == "safe_mode":
                logger.warning("Entering Rule-Engine Safe Mode execution. All AI inference failed.")
                return {
                    "status": "safe_mode", 
                    "signal": "HOLD", 
                    "confidence": 0.0, 
                    "reason": "All local models failed. Relying on baseline rules."
                }
            
            model_name = step["model"]
            try:
                logger.info(f"Attempting offline execution with {model_name} (Role: {step['role']})")
                return task_func(step)
            except Exception as e:
                logger.error(f"Model {model_name} failed: {e}. Cascading to next fallback in chain...")
                continue
