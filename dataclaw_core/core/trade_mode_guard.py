import logging
from typing import Dict, Any
from dataclaw_core.core.mode_manager import ModeManager

logger = logging.getLogger(__name__)

class TradeModeGuard:
    """Interceptor that prevents real money execution unless LIVE mode is securely confirmed."""
    def __init__(self):
        self.mode_manager = ModeManager()

    def validate_execution(self, order_payload: Dict[str, Any]) -> bool:
        mode = self.mode_manager.get_mode()
        symbol = order_payload.get("symbol", "UNKNOWN")
        side = order_payload.get("side", "UNKNOWN")
        
        if mode == "paper":
            logger.info(f"[PAPER MODE] Simulated execution for {side} {symbol}. Real API not called.")
            return False
            
        elif mode == "shadow":
            logger.info(f"[SHADOW MODE] Logging intended real execution for {side} {symbol}, but blocking real API call.")
            # Record shadow intent to DB for analysis
            return False
            
        elif mode == "live":
            logger.warning(f"[LIVE MODE GUARDIAN] Approving REAL EXECUTION for {side} {symbol}!")
            return True
            
        else:
            logger.error(f"UNKNOWN MODE: {mode}. Blocking execution.")
            return False
