import sqlite3
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class SettingsDB:
    """SQLite-backed database for persisting all system settings permanently."""
    def __init__(self, db_path: str = "/opt/dataclaw/settings.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS settings (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()
        except sqlite3.OperationalError:
            # Fallback for local testing without /opt/dataclaw directory
            self.db_path = "settings_local.db"
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS settings (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()
            logger.info("Using local fallback settings_local.db")

    def get_setting(self, key: str, default: Any = None) -> Any:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT value FROM settings WHERE key = ?", (key,))
            row = cursor.fetchone()
            if row:
                try:
                    return json.loads(row[0])
                except json.JSONDecodeError:
                    return row[0]
            return default

    def set_setting(self, key: str, value: Any):
        val_str = json.dumps(value) if isinstance(value, (dict, list, bool, int, float)) else str(value)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO settings (key, value, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            """, (key, val_str))
            conn.commit()

    def delete_setting(self, key: str):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM settings WHERE key = ?", (key,))
            conn.commit()

    def get_all_settings(self) -> Dict[str, Any]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT key, value FROM settings")
            result = {}
            for row in cursor.fetchall():
                try:
                    result[row[0]] = json.loads(row[1])
                except json.JSONDecodeError:
                    result[row[0]] = row[1]
            return result
