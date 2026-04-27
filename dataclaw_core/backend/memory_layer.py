import logging
from typing import List, Dict, Any, Optional

from dataclaw_core.backend.supabase_client import SupabaseCoreClient

logger = logging.getLogger(__name__)

class PgVectorMemory:
    """Uses Supabase pgvector capabilities for semantic agent memory retrieval."""
    
    def __init__(self):
        self.sb = SupabaseCoreClient()
        self.user_id = "00000000-0000-0000-0000-000000000000"

    def _generate_embedding(self, text: str) -> List[float]:
        # Typically we'd call OpenAI or local Ollama embeddings endpoint here.
        # Stubbing out an embedding of dim 1536 (OpenAI standard)
        return [0.0] * 1536 

    def store_memory(self, agent_name: str, memory_text: str, metadata: dict = None):
        """Stores a contextual memory embedding directly to Supabase."""
        embedding = self._generate_embedding(memory_text)
        
        payload = {
            "user_id": self.user_id,
            "agent_name": agent_name,
            "memory_text": memory_text,
            "embedding": embedding,
            "metadata": metadata or {}
        }
        
        self.sb.insert("agent_memory", payload)
        logger.info(f"Agent '{agent_name}' memory committed to vector store.")

    def recall_memory(self, agent_name: str, query_text: str, match_count: int = 5, match_threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Recalls relevant contextual memory using pgvector similarity search."""
        if not self.sb.is_connected or not self.sb.client:
            logger.warning("Offline mode: vector recall unavailable.")
            return []
            
        query_embedding = self._generate_embedding(query_text)
        
        try:
            res = self.sb.client.rpc(
                "match_agent_memory",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": match_threshold,
                    "match_count": match_count,
                    "p_agent_name": agent_name,
                    "p_user_id": self.user_id
                }
            ).execute()
            
            return res.data if res.data else []
        except Exception as e:
            logger.error(f"Failed semantic memory recall: {e}")
            return []
