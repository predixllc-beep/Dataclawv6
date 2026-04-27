import logging
from typing import List, Dict, Any

from dataclaw_core.backend.supabase_client import SupabaseCoreClient

logger = logging.getLogger(__name__)

class VectorMemoryService:
    def __init__(self):
        self.sb = SupabaseCoreClient()
        self.user_id = "00000000-0000-0000-0000-000000000000"

    def store_memory(self, memory_text: str, embedding: List[float], metadata: Dict[str, Any]):
        """Stores a vector representation using pgvector in Supabase."""
        payload = {
            "user_id": self.user_id,
            "memory_text": memory_text,
            "agent_name": metadata.get("agent_name", "unknown"),
            "embedding": embedding,
            "metadata": metadata
        }
        self.sb.insert("agent_memory", payload)
        
    def search_similar(self, query_embedding: List[float], match_count: int = 5) -> List[Dict[str, Any]]:
        """Uses Supabase rpc call to utilize pgvector semantic search."""
        if self.sb.is_connected and self.sb.client:
            try:
                res = self.sb.client.rpc(
                    'match_agent_memory',
                    {'query_embedding': query_embedding, 'match_threshold': 0.7, 'match_count': match_count, 'p_agent_name': 'all', 'p_user_id': self.user_id}
                ).execute()
                return res.data if res.data else []
            except Exception as e:
                logger.error(f"Failed to search vector memory: {e}")
        return []
