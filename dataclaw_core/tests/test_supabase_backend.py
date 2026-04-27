import unittest
import json
import logging
from unittest.mock import MagicMock, patch

from dataclaw_core.backend.supabase_client import SupabaseCoreClient, OfflineFallbackQueue
from dataclaw_core.backend.persistence_service import SupabasePersistenceService
from dataclaw_core.backend.memory_layer import PgVectorMemory

class TestSupabaseBackend(unittest.TestCase):
    def setUp(self):
        self.sb = SupabaseCoreClient()
        self.sb.queue.db_path = "offline_queue_test.db"
        self.sb.queue._init_db()

    @patch("dataclaw_core.backend.supabase_client.create_client")
    def test_offline_fallback(self, mock_create):
        # Force offline mode
        self.sb.is_connected = False
        self.sb.client = None
        
        self.sb.insert("trade_history", {"symbol": "BTC/USDT", "side": "BUY"})
        
        pending = self.sb.queue.get_all()
        self.assertEqual(len(pending), 1)
        
        payload = json.loads(pending[0]["payload_json"])
        self.assertEqual(payload["symbol"], "BTC/USDT")
        
        # Clean up
        self.sb.queue.remove(pending[0]["id"])

    @patch("dataclaw_core.backend.supabase_client.create_client")
    def test_persistence_service_agent_config(self, mock_create):
        # Mocking active connection
        self.sb.is_connected = True
        mock_client = MagicMock()
        self.sb.client = mock_client
        
        svc = SupabasePersistenceService()
        svc.sb = self.sb
        
        # Insert
        svc.save_agent_config("Onyx", {"model": "llama-3"})
        mock_client.table().upsert.assert_called_once()
        
        # Get
        mock_table = mock_client.table()
        mock_res = MagicMock()
        mock_res.data = [{"config_json": {"model": "llama-3"}}]
        mock_table.select().eq().eq().execute.return_value = mock_res
        
        cfg = svc.get_agent_config("Onyx")
        self.assertEqual(cfg["model"], "llama-3")

    @patch("dataclaw_core.backend.supabase_client.create_client")
    def test_vector_memory_recall(self, mock_create):
        self.sb.is_connected = True
        self.sb.client = MagicMock()
        
        mem = PgVectorMemory()
        mem.sb = self.sb
        
        mock_res = MagicMock()
        mock_res.data = [
            {"id": "uuid1", "memory_text": "Market was very volatile", "metadata": {}, "similarity": 0.95}
        ]
        self.sb.client.rpc().execute.return_value = mock_res
        
        results = mem.recall_memory("Onyx", "How was the market?")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["similarity"], 0.95)

if __name__ == '__main__':
    unittest.main()
