import logging
import json
from dataclaw_core.core.safety_system import SafetySystem

logger = logging.getLogger("AgentAllocationRegistry")

class AgentAllocationRegistry:
    """Intelligently matches incoming local models with system agents based on role and parameters."""
    
    def __init__(self, models_path="config/models.json"):
        self.models_path = models_path
        self.safety = SafetySystem(mode="strict")
        self.models = self._load_models()

    def _load_models(self):
        try:
            with open(self.models_path, "r") as f:
                data = json.load(f)
                return data.get("models", {})
        except Exception as e:
            logger.error(f"Failed to load local models from {self.models_path}: {e}")
            return {}

    def analyze_model_capabilities(self, model_definition: dict) -> dict:
        """Evaluates what agent a model fits best based on its params and type."""
        model_name = model_definition.get("model", "").lower()
        role_score = {
            "Onyx": 0,
            "OpenClaw": 0,
            "Mirofish": 0,
            "Betafish": 0
        }
        
        # Heuristics for capabilities
        if "deepseek" in model_name or "14b" in model_name or "70b" in model_name:
            role_score["Onyx"] += 50  # Reasoning
        
        if "coder" in model_name or "codellama" in model_name or "qwen-coder" in model_name:
            role_score["OpenClaw"] += 50 # Coding
            
        if "llama3" in model_name or "8b" in model_name:
            role_score["Mirofish"] += 50 # Speed / Arbitrage
            
        if "instruct" in model_name or "mistral" in model_name:
            role_score["Betafish"] += 50 # Swarm Coord
            
        # Select best agent
        best_agent = max(role_score, key=role_score.get)
        confidence = role_score[best_agent] + 30 # Simulated confidence
        
        return {
            "recommended_agent": best_agent,
            "confidence_threshold_met": confidence >= 70, # PolicyGuard logic
            "confidence_score": confidence
        }

    def allocate_model(self, agent_name: str, model_definition: dict):
        analysis = self.analyze_model_capabilities(model_definition)
        if not analysis["confidence_threshold_met"]:
            logger.warning(f"[PolicyGuard Error] Allocation rejected for {agent_name}. Confidence {analysis['confidence_score']}% is below the 70% threshold.")
            return False
            
        if agent_name != analysis["recommended_agent"]:
            logger.warning(f"Note: Model {model_definition['model']} was assigned to {agent_name}, but heuristics suggest it fits {analysis['recommended_agent']} better.")
            
        logger.info(f"Successfully allocated local model {model_definition['model']} to {agent_name} with {analysis['confidence_score']}% confidence.")
        self.models[agent_name] = model_definition
        # In a real system, we save it back to models.json here
        return True
