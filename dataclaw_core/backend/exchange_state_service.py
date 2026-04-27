import logging
from typing import Dict, Any

from dataclaw_core.backend.supabase_client import SupabaseCoreClient

logger = logging.getLogger(__name__)

class ExchangeStateService:
    def __init__(self):
        self.sb = SupabaseCoreClient()
        self.user_id = "00000000-0000-0000-0000-000000000000"
        
    def save_venue_state(self, venue: str, state_data: Dict[str, Any]):
        """Persists the active routing and balancing states to the database."""
        payload = {
            "user_id": self.user_id,
            "venue": venue,
            "state_data": state_data
        }
        self.sb.upsert("exchange_states", payload)
        
    def load_venue_state(self, venue: str) -> Dict[str, Any]:
        """Loads persistent venue configuration and dynamic balances."""
        if self.sb.is_connected and self.sb.client:
            res = self.sb.client.table("exchange_states").select("state_data").eq("user_id", self.user_id).eq("venue", venue).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]["state_data"]
        return {}
