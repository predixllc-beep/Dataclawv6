import logging
from typing import Dict, Any, Optional

from dataclaw_core.backend.supabase_client import SupabaseCoreClient

logger = logging.getLogger(__name__)

class SupabasePersistenceService:
    """Uses Supabase as the primary persistence backend."""
    
    def __init__(self):
        self.sb = SupabaseCoreClient()
        self.user_id = self._get_default_user_id()

    def _get_default_user_id(self):
        # In a fully authenticated environment, this would come from the JWT Context
        # Default UUID for headless local node (must match a seeded user in real usage, or be ignored by RLS if acting as service role)
        return "00000000-0000-0000-0000-000000000000"
        
    def save_agent_config(self, agent_name: str, config: Dict[str, Any]):
        payload = {
            "user_id": self.user_id,
            "name": agent_name,
            "model": config.get("model", "unknown"),
            "config_json": config
        }
        self.sb.upsert("agent_configs", payload)
        logger.info(f"Supabase: Persisted config for agent {agent_name}")

    def get_agent_config(self, agent_name: str) -> Optional[Dict[str, Any]]:
        if self.sb.is_connected and self.sb.client:
            res = self.sb.client.table("agent_configs").select("*").eq("name", agent_name).eq("user_id", self.user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0].get("config_json")
        # In real robust system, fall back to SQLite cache if disconnected.
        return None

    def save_exchange_config(self, venue: str, api_key: str, api_secret: str):
        payload = {
            "user_id": self.user_id,
            "venue": venue,
            "api_key_encrypted": api_key, # Use a KMS KMS encryption before this in prod.
            "api_secret_encrypted": api_secret
        }
        # In Supabase we should specify column conflict target if we use unique constraints
        self.sb.upsert("exchange_connections", payload)
        
    def load_exchange_connections(self):
        if self.sb.is_connected and self.sb.client:
            res = self.sb.client.table("exchange_connections").select("*").eq("user_id", self.user_id).eq("is_active", True).execute()
            return res.data
        return []

    def save_plugin_state(self, plugin_name: str, state: Dict[str, Any]):
        payload = {
            "user_id": self.user_id,
            "plugin_name": plugin_name,
            "state_json": state
        }
        self.sb.upsert("plugin_registry", payload)

    def log_trade(self, symbol: str, side: str, size: float, price: float, venue: str, mode: str):
        payload = {
            "user_id": self.user_id,
            "symbol": symbol,
            "side": side,
            "size": size,
            "price": price,
            "venue": venue,
            "mode": mode
        }
        self.sb.insert("trade_history", payload)

    def log_signal(self, agent_name: str, symbol: str, signal: str, confidence: float, rationale: str):
        payload = {
            "user_id": self.user_id,
            "agent_name": agent_name,
            "symbol": symbol,
            "signal": signal,
            "confidence": confidence,
            "rationale": rationale
        }
        self.sb.insert("signal_logs", payload)
