import logging
from typing import Callable, Dict, List, Any

logger = logging.getLogger(__name__)

class CoreMemProtocol:
    """
    NEXUS Çekirdek Bellek Protokolü (CoreMem-Protocol)
    Redis yerine geçen, Patron ajanı tarafından yönetilen dahili Pub/Sub iletişim katmanı.
    Dış yazılımlara ihtiyaç duymayan, kendi içinde hafızayı ajanlar üzerinden yöneten yapı.
    """
    def __init__(self):
        self.channels: Dict[str, List[Callable]] = {}
        # Master Memory birimi
        self.master_shared_state: Dict[str, Any] = {
            "signals": [],
            "trades": [],
            "market_data": {},
            "active_tasks": {},
            "memory": []
        }
        logger.info("CoreMem-Protocol (Internal Event Bus) initialized on Patron Agent.")

    def subscribe(self, channel: str, callback: Callable):
        if channel not in self.channels:
            self.channels[channel] = []
        self.channels[channel].append(callback)
        logger.info(f"Subscribed to CoreMem channel: {channel}")

    def publish(self, channel: str, message: dict):
        # NASA - Akıllı Önbellek Denetimi
        self._nasa_cache_inspection(channel, message)
        
        if channel in self.channels:
            for callback in self.channels[channel]:
                try:
                    callback(message)
                except Exception as e:
                    logger.error(f"Error in CoreMem callback for {channel}: {e}")

    def emit_signal(self, signal: dict):
        self.master_shared_state["signals"].append(signal)
        self.publish("signals", signal)

    def emit_trade(self, trade: dict):
        self.master_shared_state["trades"].append(trade)
        self.publish("trades", trade)

    def emit_memory_update(self, update: dict):
        self.master_shared_state["memory"].append(update)
        self.publish("memory", update)

    def _nasa_cache_inspection(self, channel: str, message: dict):
        """
        NASA (Vault) - Akıllı Önbellek Denetleyicisi
        Hangi verinin kritik olduğunu ve hangisinin geçici olduğunu belirler.
        """
        is_critical = False
        if channel == "trades" and message.get("status") == "executed":
            is_critical = True
        elif channel == "signals" and message.get("confidence", 0) > 85:
            is_critical = True

        if is_critical:
            logger.info(f"[NASA Vault] {channel} data flagged as CRITICAL for Supabase sync.")
        else:
            logger.debug(f"[NASA Vault] {channel} data is temporary, keeping in RAM.")
