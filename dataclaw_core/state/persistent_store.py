import logging
from typing import Dict, Any, Optional
from dataclaw_core.backend.persistence_service import SupabasePersistenceService

logger = logging.getLogger(__name__)

class PersistentStore:
    """High-level API for interacting with persisted application state over Supabase."""
    
    def __init__(self):
        self.db = SupabasePersistenceService()
        
    def save_agent_config(self, agent_name: str, config: Dict[str, Any]):
        self.db.save_agent_config(agent_name, config)

    def get_agent_config(self, agent_name: str) -> Optional[Dict[str, Any]]:
        return self.db.get_agent_config(agent_name)
        
    def get_all_agents(self) -> Dict[str, Any]:
        # Would require full table fetch in Supabase
        res = self.db.sb.client.table("agent_configs").select("*").execute() if self.db.sb.is_connected else None
        if not res or not hasattr(res, "data"): return {}
        return {r["name"]: r["config_json"] for r in res.data}

    def save_exchange_config(self, exchange_config: Dict[str, Any]):
        for venue, attrs in exchange_config.items():
            if isinstance(attrs, dict) and "apiKey" in attrs:
                self.db.save_exchange_config(venue, attrs.get("apiKey", ""), attrs.get("secret", ""))

    def get_exchange_config(self) -> Dict[str, Any]:
        connections = self.db.load_exchange_connections()
        return {c["venue"]: {"apiKey": c["api_key_encrypted"], "secret": c["api_secret_encrypted"]} for c in connections}

    def save_trading_mode(self, mode: str):
        if mode not in ["paper", "shadow", "live"]:
            raise ValueError(f"Invalid trading mode: {mode}")
        # Cache globally in plugin registry or a strict settings table. Using plugin_registry shortcut
        self.db.save_plugin_state("system_trading_mode", {"mode": mode})

    def get_trading_mode(self) -> str:
        if self.db.sb.is_connected and self.db.sb.client:
            res = self.db.sb.client.table("plugin_registry").select("state_json").eq("plugin_name", "system_trading_mode").execute()
            if res.data and len(res.data) > 0:
                return res.data[0]["state_json"].get("mode", "paper")
        return "paper"
        
    def save_agent_memory(self, agent_name: str, key: str, value: Any):
        # Migrated to pgvector layer directly, omitting flat key-value here.
        pass

    def get_agent_memory(self, agent_name: str, key: str, default: Any = None) -> Any:
        return default
        
    def save_plugin_state(self, plugin_name: str, state: Dict[str, Any]):
        self.db.save_plugin_state(plugin_name, state)

    def get_active_plugins(self) -> Dict[str, Any]:
        res = self.db.sb.client.table("plugin_registry").select("*").execute() if self.db.sb.is_connected else None
        if not res or not hasattr(res, "data"): return {}
        return {r["plugin_name"]: r["state_json"] for r in res.data}

