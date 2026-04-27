import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SafetySystem:
    def __init__(self, mode: str = "paper"):
        self.mode = mode # 'paper', 'shadow', 'live', 'safe'
        self.kill_switch_engaged = False
        self.risk_limits = {
            "max_drawdown_pct": 15.0,
            "max_daily_loss_pct": 5.0,
            "max_position_size_usdt": 1000.0,
            "black_swan_drawdown_pct": 10.0
        }
        self.current_drawdown = 0.0
        self.daily_loss = 0.0
        
    def validate_execution(self, order: Dict[str, Any]) -> bool:
        """Validates if an order is safe to execute."""
        if self.kill_switch_engaged or self.mode == "safe":
            logger.warning("Execution blocked: Kill switch engaged or in Safe mode.")
            return False
            
        if self.current_drawdown > self.risk_limits["black_swan_drawdown_pct"]:
             logger.error("Execution blocked: Black swan drawdown limit breached.")
             self.engage_kill_switch("Black swan drawdown detected")
             return False

        if self.daily_loss > self.risk_limits["max_daily_loss_pct"]:
             logger.warning("Execution blocked: Max daily loss reached.")
             return False
             
        # Shadow mode just logs, doesn't execute live
        if self.mode == "shadow":
            logger.info("Shadow Mode: Transaction validated but not sent to live exchange.")
            return False # Return false to prevent actual execution, but log it as success in shadow DB
            
        return True

    def engage_kill_switch(self, reason: str):
        self.kill_switch_engaged = True
        self.mode = "safe"
        logger.critical(f"KILL SWITCH ENGAGED. Reason: {reason}. System halted.")
        
    def disengage_kill_switch(self):
        self.kill_switch_engaged = False
        logger.info("Kill switch disengaged. System restored.")
