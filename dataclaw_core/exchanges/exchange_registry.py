import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ExchangeRegistry:
    """Manages active exchange connections for simultaneous multi-exchange routing."""
    
    def __init__(self):
        # By default we are aware of these, but they are technically 'loaded' dynamically
        self.supported_exchanges = ["Binance", "Bybit", "MEXC", "OKX", "Kraken"]
        self.active_adapters = {}
        
    def _init_ccxt_adapter(self, exchange_id: str, credentials: Dict[str, str]):
        """Initializes a ccxt instance (mocked for structural completeness)."""
        import ccxt
        ex_class = getattr(ccxt, exchange_id.lower(), None)
        if ex_class:
            return ex_class({
                'apiKey': credentials.get('apiKey'),
                'secret': credentials.get('secret'),
                'enableRateLimit': True,
            })
        return None

    def register_exchange(self, name: str, config: Dict[str, Any]):
        if name not in self.supported_exchanges:
            logger.warning(f"Exchange {name} is not officially supported, but adding anyway.")
        
        # In a real boot this initializes CCXT adapters.
        logger.info(f"Registered connection for exchange: {name}")
        self.active_adapters[name] = {
            "name": name,
            "status": "connected",
            "capabilities": config.get("capabilities", ["spot", "perp"]),
            "taker_fee": config.get("taker_fee", 0.0004),
            "maker_fee": config.get("maker_fee", 0.0002)
        }

    def get_available_exchanges(self):
        return self.active_adapters
