import logging
from abc import ABC, abstractmethod
from typing import Dict, Any
from ..providers.model_router import ModelRouter

class BaseAgent(ABC):
    """Abstract base class for all Dataclaw agents."""

    def __init__(self, name: str, role: str, provider: ModelRouter):
        self.name = name
        self.role = role
        self.provider = provider
        self.logger = logging.getLogger(f"agent.{name.lower()}")
        self.memory: Dict[str, Any] = {}

    @abstractmethod
    async def think(self, market_state: Dict[str, Any]) -> Dict[str, Any]:
        """Generate trading intent from market_state."""
        pass

    @abstractmethod
    async def critique(self, own_output: Dict[str, Any]) -> Dict[str, Any]:
        """Self-critique the output and return improved version."""
        pass

    def save_to_memory(self, key: str, data: Dict[str, Any]):
        self.memory[key] = data
        self.logger.debug(f"[{self.name}] Saved to memory: {key}")

    def load_from_memory(self, key: str) -> Dict[str, Any]:
        return self.memory.get(key, {})

    def get_system_prompt(self) -> str:
        return f"You are an expert crypto trading agent with role: {self.role}. Always generate high-confidence trading intents only."
