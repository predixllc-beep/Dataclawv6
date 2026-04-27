import logging
from typing import Dict, Any, List

logger = logging.getLogger("Dataclaw.EpisodicMemory")

class EpisodicMemory:
    """
    Event-driven memory layer for agents to learn from outcomes.
    """
    def __init__(self):
        self.trade_history = []
        self.error_memory = []
        self.strategy_performance = {}

    def record_trade(self, trade_event: Dict[str, Any]):
        """Logs trade execution and outcome."""
        self.trade_history.append(trade_event)
        
        strategy = trade_event.get("strategy")
        pnl = trade_event.get("pnl", 0.0)
        
        if strategy:
            if strategy not in self.strategy_performance:
                self.strategy_performance[strategy] = {"total_pnl": 0.0, "trades": 0}
            
            self.strategy_performance[strategy]["total_pnl"] += pnl
            self.strategy_performance[strategy]["trades"] += 1
            
        logger.info(f"Recorded trade episode: {trade_event['action']} -> PnL: {pnl}")

    def record_error(self, error_event: Dict[str, Any]):
        """Logs execution or systemic errors for self-healing analysis."""
        self.error_memory.append(error_event)
        logger.warning(f"Recorded error episode: {error_event}")

    def retrieve_strategy_stats(self, strategy: str) -> Dict[str, Any]:
        return self.strategy_performance.get(strategy, {"total_pnl": 0.0, "trades": 0})

    def feedback_loop(self) -> Dict[str, Any]:
        """Reinforcement feedback loop hook."""
        # This hook passes memory back to the StrategyMutator
        logger.info("Executing feedback loop for Strategy Mutator.")
        
        # Calculate overall success metrics
        total_pnl = sum(strat["total_pnl"] for strat in self.strategy_performance.values())
        successful_trades = len([t for t in self.trade_history if t.get("pnl", 0) > 0])
        total_trades = len(self.trade_history)
        win_rate = successful_trades / total_trades if total_trades > 0 else 0.0

        # Analyze errors
        error_count = len(self.error_memory)

        feedback_signal = {
            "total_pnl": total_pnl,
            "win_rate": win_rate,
            "error_count": error_count,
            "strategy_performance": self.strategy_performance,
            "recent_errors": self.error_memory[-5:] if error_count > 0 else [],
            "action": "MUTATE" if error_count > 5 or win_rate < 0.4 else "HOLD"
        }
        
        logger.info(f"Feedback Loop Signal generated: {feedback_signal['action']}")
        return feedback_signal
