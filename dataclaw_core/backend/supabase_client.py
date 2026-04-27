import os
import json
import sqlite3
import logging
import threading
from typing import Dict, Any, Optional

try:
    from supabase import create_client, Client
except ImportError:
    Client = Any

logger = logging.getLogger(__name__)

class OfflineFallbackQueue:
    """SQLite-backed queue to cache updates if Supabase is offline."""
    def __init__(self, db_path: str = "/opt/dataclaw/offline_queue.db"):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_db()

    def _init_db(self):
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS pending_mutations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        table_name TEXT NOT NULL,
                        operation TEXT NOT NULL,
                        payload_json TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
        except Exception as e:
            logger.warning(f"Using local buffer for queue due to: {e}")
            self.db_path = "offline_queue_local.db"
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS pending_mutations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        table_name TEXT NOT NULL,
                        operation TEXT NOT NULL,
                        payload_json TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)

    def push(self, table_name: str, operation: str, payload: dict):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "INSERT INTO pending_mutations (table_name, operation, payload_json) VALUES (?, ?, ?)",
                    (table_name, operation, json.dumps(payload))
                )
                conn.commit()

    def get_all(self):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("SELECT id, table_name, operation, payload_json FROM pending_mutations ORDER BY id ASC")
                return [dict(r) for r in cursor.fetchall()]

    def remove(self, id: int):
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("DELETE FROM pending_mutations WHERE id = ?", (id,))
                conn.commit()


class SupabaseCoreClient:
    """Singleton wrapper for the Supabase client with offline fallback."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseCoreClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
        self.force_offline = os.environ.get("FORCE_OFFLINE_MODE", "false").lower() == "true"
        self.client: Optional[Client] = None
        
        self.queue = OfflineFallbackQueue()
        self.is_connected = False

        if self.url and self.key and not self.force_offline:
            try:
                from supabase import create_client
                self.client = create_client(self.url, self.key)
                self.is_connected = True
                logger.info("Supabase client initialized successfully.")
                self.flush_offline_queue()
            except Exception as e:
                logger.error(f"Failed to connect to Supabase: {e}")
                self.is_connected = False
        else:
            logger.warning("Supabase credentials missing or FORCE_OFFLINE_MODE=true. Running strictly offline.")

    def flush_offline_queue(self):
        """Attempts to sync pending items from the sqlite queue to Supabase."""
        if not self.is_connected or not self.client:
            return
            
        pending = self.queue.get_all()
        if pending:
            logger.info(f"Flushing {len(pending)} cached operations to Supabase...")
            for item in pending:
                try:
                    payload = json.loads(item["payload_json"])
                    tbl = self.client.table(item["table_name"])
                    
                    if item["operation"] == "upsert":
                        tbl.upsert(payload).execute()
                    elif item["operation"] == "insert":
                        tbl.insert(payload).execute()
                        
                    # Remove on success
                    self.queue.remove(item["id"])
                except Exception as e:
                    logger.error(f"Failed to sync item {item['id']}: {e}")
                    # Stop flushing to maintain order
                    break

    def upsert(self, table_name: str, payload: dict):
        if self.is_connected and self.client:
            try:
                res = self.client.table(table_name).upsert(payload).execute()
                return res.data
            except Exception as e:
                logger.warning(f"Supabase upsert failed, caching offline: {e}")
                self.queue.push(table_name, "upsert", payload)
        else:
            self.queue.push(table_name, "upsert", payload)
            
    def insert(self, table_name: str, payload: dict):
        if self.is_connected and self.client:
            try:
                res = self.client.table(table_name).insert(payload).execute()
                return res.data
            except Exception as e:
                logger.warning(f"Supabase insert failed, caching offline: {e}")
                self.queue.push(table_name, "insert", payload)
        else:
            self.queue.push(table_name, "insert", payload)
            
    def get_realtime_channel(self, channel_name: str):
        if self.is_connected and self.client:
            return self.client.channel(channel_name)
        return None
