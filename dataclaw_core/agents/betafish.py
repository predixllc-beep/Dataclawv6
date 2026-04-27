"""
BetaFish Agent Module for Dataclaw v4.

BetaFish is responsible for generating high-confidence trading signals by analyzing 
technical patterns, volume profiles, and order flow imbalance.
"""

import json
import logging
import time
from typing import Dict, Any

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)

class BetaFishAgent(BaseAgent):
    """
    BetaFishAgent generates high-confidence trading signals based on technical analysis,
    order flow, volume profile, and momentum indicators.
    """

    def __init__(self, provider: Any):
        """
        Initializes the BetaFish agent.

        Args:
            provider: The LLM inference provider.
        """
        super().__init__(name="BetaFish", role="Signal Generator & Pattern Recognition", provider=provider)

    async def get_system_prompt(self) -> str:
        """
        Overrides the base system prompt to inject BetaFish's specific persona.
        """
        base_prompt = await super().get_system_prompt()
        betafish_prompt = (
            f"{base_prompt}\n\n"
            "You are an expert crypto trading AI specialized in technical patterns, order flow, "
            "volume profile, and momentum analysis. Generate only high-confidence trading intents. "
            "Reject low-quality signals and default to neutral if confidence is not substantial."
        )
        return betafish_prompt

    async def think(self, market_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes the market state to generate a trading intent.
        
        Args:
            market_state (Dict[str, Any]): Current market data including price, volume, 
                                           orderbook imbalance, funding rate, RSI, MACD, etc.

        Returns:
            Dict[str, Any]: The formulated intent and decision trace.
        """
        logger.info(f"{self.name} is evaluating market state to generate a signal...")
        
        # Episodic Memory: Recall the last signal to ensure contextual continuity
        last_signal = self.load_from_memory("last_generated_signal")
        memory_context = ""
        if last_signal:
            memory_context = (
                f"\n\n--- PREVIOUS SIGNAL CONTEXT ---\n"
                f"{json.dumps(last_signal, indent=2)}\n"
                f"Ensure consistency with your previous reasoning unless the market structure has clearly shifted."
            )

        system_prompt = await self.get_system_prompt()
        state_str = json.dumps(market_state, indent=2)
        
        prompt = (
            f"INSTRUCTIONS:\n{system_prompt}\n\n"
            f"Analyze the following market data. Assess price trends, volume, orderbook imbalances, "
            f"and indicators like RSI/MACD. Generate a strict trading signal/intent.{memory_context}\n\n"
            f"--- MARKET STATE ---\n{state_str}\n\n"
            f"Output must conform to the required JSON schema strictly."
        )

        response_schema = {
            "type": "object",
            "properties": {
                "intent": {
                    "type": "object",
                    "properties": {
                        "asset": {"type": "string", "description": "Ticker symbol, e.g., 'BTC-USD'"},
                        "direction": {"type": "string", "enum": ["long", "short", "neutral"]},
                        "size_usd": {"type": "number", "description": "Proposed position size in USD"},
                        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0, "description": "0.0 to 1.0 confidence score. Use neutral for low confidence."},
                        "reasoning": {"type": "string", "description": "Concise logical justification based on technical factors"},
                        "ttl": {"type": "integer", "description": "Time-to-live for this intent in seconds"}
                    },
                    "required": ["asset", "direction", "size_usd", "confidence", "reasoning", "ttl"]
                },
                "decision_trace": {
                    "type": "string",
                    "description": "Verbose internal monologue detailing the step-by-step technical and order flow analysis logic."
                }
            },
            "required": ["intent", "decision_trace"]
        }

        try:
            result = await self.provider.generate_structured(
                prompt=prompt,
                response_schema=response_schema,
                temperature=0.3
            )
            
            if "error" in result:
                raise ValueError(f"Provider returned an error: {result['error']}")
                
            # Memory Storage: Save successful signal to short-term memory
            self.save_to_memory("last_generated_signal", {
                "timestamp": time.time(),
                "intent": result.get("intent")
            })

            direction = result.get('intent', {}).get('direction', 'neutral')
            asset = result.get('intent', {}).get('asset', 'UNKNOWN')
            confidence = result.get('intent', {}).get('confidence', 0.0)
            
            logger.debug(f"{self.name} generated intent: {direction} on {asset} (Confidence: {confidence:.2f})")
            return result
            
        except Exception as e:
            logger.error(f"{self.name} encountered an error during think(): {e}", exc_info=True)
            # Graceful Fallback
            return {
                "intent": {
                    "asset": market_state.get("asset", "UNKNOWN"),
                    "direction": "neutral",
                    "size_usd": 0.0,
                    "confidence": 0.0,
                    "reasoning": f"Exception forced fallback: {str(e)}",
                    "ttl": 0
                },
                "decision_trace": "System protected fallback triggered due to LLM interface failure."
            }

    async def critique(self, own_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Self-reflection on the generated signal.
        Adjusts the confidence score, highlights weaknesses, and adds improvement suggestions.

        Args:
            own_output (Dict[str, Any]): The raw dictionary output from `think`.

        Returns:
            Dict[str, Any]: A dictionary containing the critique logic and adjusted confidence.
        """
        logger.info(f"{self.name} is beginning self-critique sequence...")
        
        system_prompt = await self.get_system_prompt()
        system_prompt += (
            "\n\nSELF-CRITIQUE MODE: Ruthlessly evaluate your previous signal. "
            "Identify confirmation bias, overconfidence, FOMO, or weak indicator confluence. "
            "Penalize the confidence score if flaws are found."
        )
        
        output_str = json.dumps(own_output, indent=2)
        
        prompt = (
            f"INSTRUCTIONS:\n{system_prompt}\n\n"
            f"Review the following signal intent and decision trace.\n\n"
            f"--- PREVIOUS SIGNAL ---\n{output_str}\n\n"
            f"Provide an adjusted confidence score (0.0 to 1.0), identify weaknesses, and give suggestions."
        )

        response_schema = {
            "type": "object",
            "properties": {
                "adjusted_confidence": {
                    "type": "number", 
                    "minimum": 0.0, 
                    "maximum": 1.0,
                    "description": "Revised confidence score. Lower the original score if reasoning is weak or risky."
                },
                "suggestion": {
                    "type": "string",
                    "description": "Concrete, actionable suggestion to mitigate risk or improve signal accuracy."
                },
                "critique_trace": {
                    "type": "string",
                    "description": "Internal monologue exposing the flaws, biases, or market risks in the original thought process."
                }
            },
            "required": ["adjusted_confidence", "suggestion", "critique_trace"]
        }

        try:
            result = await self.provider.generate_structured(
                prompt=prompt,
                response_schema=response_schema,
                temperature=0.2  # Low temperature for strict, analytical review
            )
            
            if "error" in result:
                raise ValueError(f"Provider returned an error: {result['error']}")
                
            # Maintain a rolling history of critiques
            critique_history = self.load_from_memory("critique_history") or []
            critique_history.append({
                "timestamp": time.time(),
                "adjusted_confidence": result.get("adjusted_confidence"),
                "suggestion": result.get("suggestion")
            })
            self.save_to_memory("critique_history", critique_history[-5:])

            new_conf = result.get('adjusted_confidence', 0.0)
            logger.debug(f"{self.name} critique completed. Adjusted Confidence: {new_conf:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"{self.name} encountered an error during critique(): {e}", exc_info=True)
            original_conf = own_output.get("intent", {}).get("confidence", 0.0)
            return {
                "adjusted_confidence": original_conf,
                "suggestion": "CRITIQUE ERROR: Unable to parse reflection. Proceed with extreme caution.",
                "critique_trace": f"Critique subsystem failure: {str(e)}"
            }
