import logging
from typing import Optional

from dataclaw_core.backend.supabase_client import SupabaseCoreClient

logger = logging.getLogger(__name__)

class SupabaseAuthLayer:
    """Handles authentication checks against Supabase."""
    
    def __init__(self):
        self.sb = SupabaseCoreClient()
        
    def verify_token(self, token: str) -> Optional[dict]:
        if not self.sb.is_connected or not self.sb.client:
            logger.warning("Auth offline or bypassed")
            return {"user_id": "00000000-0000-0000-0000-000000000000"}  # Offline bypass
            
        try:
            user = self.sb.client.auth.get_user(token)
            return user.user.model_dump()
        except Exception as e:
            logger.error(f"Auth verification failed: {e}")
            return None
