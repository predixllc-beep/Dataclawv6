import logging
from typing import List, Dict, Any

logger = logging.getLogger("Dataclaw.SwarmOrchestrator")

class AgentNode:
    def __init__(self, name: str, role: str = "generic", capabilities: List[str] = None, base_confidence: float = 0.5):
        self.name = name
        self.role = role
        self.capabilities = capabilities or []
        self.performance_history = []
        self.weight = base_confidence
        self.swarm_reference = None

    def register(self, swarm):
        """Register the agent with a SwarmOrchestrator."""
        self.swarm_reference = swarm

    def delegation(self, required_capability: str, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Delegate a task to another specialized agent in the swarm."""
        if not self.swarm_reference:
            logger.warning(f"{self.name} cannot delegate: No swarm reference connected.")
            return {"signal": "HOLD", "confidence": 0.0, "rationale": "No swarm connected for delegation"}
        return self.swarm_reference.request_delegation(self.name, required_capability, market_data)

    def delegate_task(self, required_capability: str, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Alias for backward compatibility"""
        return self.delegation(required_capability, market_data)

    def register_swarm(self, swarm):
        """Alias for backward compatibility"""
        self.register(swarm)

    def update_weight(self, outcome_score: float, regime_fit: float = 1.0):
        """
        Dynamically update agent weight based on historical performance and current regime fit.
        Maintains performance history safely.
        """
        self.performance_history.append(outcome_score)
        
        # Keep performance history bounded to avoid memory leaks
        if len(self.performance_history) > 100:
            self.performance_history.pop(0)

        # Exponential moving average of recent performance
        recent_perf = self.performance_history[-10:]
        ema_perf = sum(recent_perf) / max(len(recent_perf), 1)
        
        # Formula: weight = previous weight updated by moving average and regime constraints
        self.weight = min(1.0, max(0.01, self.weight * ema_perf * regime_fit))
        logger.info(f"Agent {self.name} updated weight: {self.weight:.3f} (EMA Perf: {ema_perf:.3f})")

    def get_signal(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Override in specific agents to return their independent signal."""
        return {"signal": "NEUTRAL", "confidence": 0.0, "rationale": "Base AgentNode logic"}


class SwarmOrchestrator:
    def __init__(self):
        self.agents: List[AgentNode] = []
        self.regime = "NORMAL"

    def register_agent(self, agent: AgentNode):
        self.agents.append(agent)
        agent.register_swarm(self)
        logger.info(f"Registered agent to swarm: {agent.name} (Role: {agent.role})")

    def request_delegation(self, from_agent: str, required_capability: str, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Routes a task from one agent to another based on capabilities and weight."""
        logger.info(f"Delegation request from {from_agent} for capability: {required_capability}")
        
        capable_agents = [a for a in self.agents if required_capability in a.capabilities and a.name != from_agent]
        if not capable_agents:
            logger.warning(f"No agents found for delegated task: {required_capability}")
            return {"signal": "HOLD", "confidence": 0.0, "rationale": "Delegation failed"}
        
        # Sort by active weight (base_confidence * performance)
        capable_agents.sort(key=lambda a: a.weight, reverse=True)
        best_agent = capable_agents[0]
        
        logger.info(f"Task delegated from {from_agent} to {best_agent.name}")
        return best_agent.get_signal(market_data)

    def get_system_status(self) -> Dict[str, Any]:
        """Retrieve current statuses of all agents and overall system health."""
        agent_statuses = []
        for agent in self.agents:
            agent_statuses.append({
                "name": agent.name,
                "role": agent.role,
                "capabilities": agent.capabilities,
                "base_confidence": agent.weight,
                "performance_history": agent.performance_history
            })
        
        system_health = {
            "regime": self.regime,
            "total_agents": len(self.agents),
            "agents": agent_statuses,
            "status": "HEALTHY" if len(self.agents) > 0 else "DEGRADED"
        }
        return system_health

    def update_regime(self, new_regime: str):
        self.regime = new_regime

    def orchestrate(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute Graph-based agent coordination and weighted consensus.
        """
        signals = []
        total_weight = 0.0
        weighted_bullish = 0.0
        weighted_bearish = 0.0

        for agent in self.agents:
            output = agent.get_signal(market_data)
            
            # Incorporate agent's local confidence and global assigned weight
            effective_weight = output["confidence"] * agent.weight
            total_weight += effective_weight

            if output["signal"] == "BUY":
                weighted_bullish += effective_weight
            elif output["signal"] == "SELL":
                weighted_bearish += effective_weight

        if total_weight == 0:
            return {"action": "HOLD", "consensus": 0.0}

        bull_ratio = weighted_bullish / total_weight
        bear_ratio = weighted_bearish / total_weight

        if bull_ratio > 0.6:
            return {"action": "BUY", "consensus": bull_ratio}
        elif bear_ratio > 0.6:
            return {"action": "SELL", "consensus": bear_ratio}
        
        return {"action": "HOLD", "consensus": max(bull_ratio, bear_ratio)}

class MetaGovernor:
    """
    Final supreme arbitration layer.
    """
    def __init__(self, swarm: SwarmOrchestrator):
        self.swarm = swarm

    def arbitrate(self, market_data: Dict[str, Any], guard_status: str) -> Dict[str, Any]:
        if guard_status in ["WAR_MODE_HEDGE", "FREEZE"]:
            logger.warning(f"MetaGovernor overriding swarm due to {guard_status}")
            return {"final_action": "HEDGE_OR_FREEZE", "override": True}
        
        swarm_decision = self.swarm.orchestrate(market_data)
        logger.info(f"MetaGovernor approved swarm decision: {swarm_decision}")
        return {"final_action": swarm_decision["action"], "override": False}
