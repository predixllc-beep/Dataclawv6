import logging
from typing import Dict, Any
from dataclaw_core.super_core.swarm_orchestrator import AgentNode

logger = logging.getLogger(__name__)

class OnchainAgent(AgentNode):
    """
    Analyzes blockchain intelligence: wallet flow, large transfers, DEX activity,
    liquidation signals, and whale movements.
    """
    def __init__(self, name: str = "OnchainIntel"):
        super().__init__(name)
        self.role = "blockchain_analyst"
        self.capabilities = ["onchain", "whale_tracking", "dex_liquidity"]
        
    def get_signal(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process onchain data and return a signal matrix."""
        logger.info(f"{self.name} analyzing onchain patterns...")
        
        # In a fully connected build, this uses a nodes/DEX APIs (e.g. TheGraph, Etherscan API, or local node)
        onchain_state = market_data.get("onchain_metrics", {})
        whale_flow = onchain_state.get("whale_flow_usd", 0)
        dex_vol_change = onchain_state.get("dex_vol_24h_change", 0.0)
        
        signal = "NEUTRAL"
        confidence = 0.5
        rationale = "Onchain flow is balanced."

        if whale_flow > 10_000_000:  # > 10m USD inflows to exchanges or active sweeps
            signal = "BUY" if dex_vol_change > 0 else "SELL"
            confidence = 0.8
            rationale = f"Major whale activity detected ({whale_flow} USD flow) with volume divergence."
        elif whale_flow < -5_000_000:
            signal = "HOLD"
            confidence = 0.6
            rationale = "Whale accumulation withdrawn to cold storage."

        return {
            "signal": signal,
            "confidence": confidence,
            "rationale": rationale,
            "agent": self.name
        }
