import logging
from dataclaw_core.state.persistent_store import PersistentStore

logger = logging.getLogger(__name__)

class ModeManager:
    """Manages the current trading mode across the system."""
    VALID_MODES = {"paper", "shadow", "live"}

    def __init__(self):
        self.store = PersistentStore()
        self.current_mode = self.store.get_trading_mode()

    def set_mode(self, mode: str, confirmation: bool = False):
        mode = mode.lower()
        if mode not in self.VALID_MODES:
            raise ValueError(f"Invalid mode {mode}")

        if mode == "live" and not confirmation:
            raise PermissionError("Hard confirmation required to enter LIVE mode.")

        self.store.save_trading_mode(mode)
        self.current_mode = mode
        logger.warning(f"SYSTEM IS NOW IN {mode.upper()} MODE")
        return self.current_mode

    def get_mode(self) -> str:
        # Hot reload just in case UI changed it
        self.current_mode = self.store.get_trading_mode()
        return self.current_mode

    def is_live(self) -> bool:
        return self.get_mode() == "live"

    def is_shadow(self) -> bool:
        return self.get_mode() == "shadow"
