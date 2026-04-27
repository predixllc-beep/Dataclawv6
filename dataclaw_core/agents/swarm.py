import asyncio
import logging
from typing import Dict, Any

from .betafish import BetaFishAgent
from .mirofish import MiroFishAgent

class AgentSwarm:
    """
    Orchestrates multiple agents, runs them in parallel, applies critique,
    and computes weighted consensus for final trading intent.
    """

    def __init__(self, provider):
        self.provider = provider
        self.logger = logging.getLogger(__name__)
        self.agents = {
            "betafish": BetaFishAgent(provider),
            "mirofish": MiroFishAgent(provider),
        }

    async def run_swarm(self, market_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run all agents concurrently, collect results, critique them, and return consensus.
        """
        try:
            # Run think() for all agents in parallel
            tasks = [agent.think(market_state) for agent in self.agents.values()]
            raw_outputs = await asyncio.gather(*tasks, return_exceptions=True)

            agent_outputs = {}
            valid_outputs = []

            for name, output in zip(self.agents.keys(), raw_outputs):
                if isinstance(output, Exception):
                    self.logger.error(f"Agent {name} failed: {output}")
                    continue
                # Run critique
                critique_result = await self.agents[name].critique(output)
                agent_outputs[name] = {"think": output, "critique": critique_result}
                valid_outputs.append((name, output, critique_result))

            # Simple weighted consensus (can be improved later)
            if not valid_outputs:
                return {"final_intent": None, "error": "All agents failed"}

            # Calculate average confidence and pick best reasoning
            total_conf = sum(out[1].get("intent", {}).get("confidence", 0) for out in valid_outputs)
            avg_conf = total_conf / len(valid_outputs) if valid_outputs else 0

            best = max(valid_outputs, key=lambda x: x[1].get("intent", {}).get("confidence", 0))

            final_intent = dict(best[1].get("intent", {}))
            final_intent["confidence"] = round(avg_conf, 2)

            return {
                "final_intent": final_intent,
                "agent_outputs": agent_outputs,
                "consensus_trace": f"Consensus from {len(valid_outputs)} agents, best from {best[0]}",
                "consensus_score": avg_conf
            }

        except Exception as e:
            self.logger.error(f"Swarm error: {e}")
            return {"error": str(e)}

    async def get_consensus(self, market_state: Dict[str, Any]) -> Dict[str, Any]:
        return await self.run_swarm(market_state)
