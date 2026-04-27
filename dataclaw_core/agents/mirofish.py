"""
MiroFish Agent Module for Dataclaw v4.

MiroFish specializes in sentiment analysis, macro conditions, and multi-timeframe 
trend correlations to identify trading opportunities and market regime changes.
"""

import json
import logging
import time
from typing import Dict, Any

from .base_agent import BaseAgent
from ..providers.model_router import ModelRouter

logger = logging.getLogger(__name__)

class MiroFishAgent(BaseAgent):
    """
    MiroFishAgent evaluates market sentiment, social media metrics, on-chain data,
    and macroeconomic indicators to generate high-confidence market directions.
    """

    def __init__(self, provider: ModelRouter):
        """
        Initializes the MiroFish agent.

        Args:
            provider (ModelRouter): The LLM inference provider.
        """
        super().__init__(name="MiroFish", role="Sentiment & Multi-Timeframe Analyst", provider=provider)

    async def get_system_prompt(self) -> str:
        """
        Overrides the base system prompt to inject MiroFish's specific persona.
        """
        base_prompt = await super().get_system_prompt()
        mirofish_prompt = (
            f"{base_prompt}\n\n"
            "You are an expert crypto sentiment and macro analyst. Analyze news sentiment, "
            "social media sentiment (X/Twitter), on-chain metrics, funding rates, and "
            "multi-timeframe correlations. Detect market regime changes and generate "
            "only high-confidence trading intents."
        )
        return mirofish_prompt

    async def think(self, market_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes market state focusing on sentiment and macro data to generate a trading intent.

        Args:
            market_state (Dict[str, Any]): Current market data containing keys such as
                sentiment_score, twitter_volume, news_impact, higher_timeframe_trend, etc.

        Returns:
            Dict[str, Any]: The formulated intent and decision trace.
        """
        logger.info(f"{self.name} is evaluating macro conditions and sentiment...")
        
        # Episodic Memory: Recall the last signal to check for sudden sentiment flips
        last_signal = self.load_from_memory("last_sentiment_signal")
        memory_context = ""
        if last_signal:
            memory_context = (
                f"\n\n--- PREVIOUS SENTIMENT CONTEXT ---\n"
                f"{json.dumps(last_signal, indent=2)}\n"
                f"Ensure consistency. If sentiment has shifted drastically, provide strong reasoning."
            )

        system_prompt = await self.get_system_prompt()
        state_str = json.dumps(market_state, indent=2)
        
        prompt = (
            f"INSTRUCTIONS:\n{system_prompt}\n\n"
            f"Review the provided market state focusing on sentiment_score, twitter_volume, "
            f"news_impact, higher_timeframe_trend, and funding_rate. Generate a precise "
            f"trading intent.{memory_context}\n\n"
            f"--- MARKET STATE ---\n{state_str}\n\n"
            f"Output must conform strictly to the required JSON schema."
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
                        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0, "description": "0.0 to 1.0 confidence score. Default to neutral for low confidence."},
                        "reasoning": {"type": "string", "description": "Concise justification based on sentiment and macro factors"},
                        "ttl": {"type": "integer", "description": "Time-to-live for this intent in seconds"}
                    },
                    "required": ["asset", "direction", "size_usd", "confidence", "reasoning", "ttl"]
                },
                "decision_trace": {
                    "type": "string",
                    "description": "Verbose internal monologue detailing sentiment analysis, macro metrics, and regime detection."
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
            self.save_to_memory("last_sentiment_signal", {
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
        Self-reflection on the generated sentiment signal.
        Checks for sentiment bias or extreme FOMO, adjusting the confidence score if needed.

        Args:
            own_output (Dict[str, Any]): The raw dictionary output from `think`.

        Returns:
            Dict[str, Any]: A dictionary containing the critique logic and adjusted confidence.
        """
        logger.info(f"{self.name} is beginning self-critique sequence to check for sentiment bias...")
        
        system_prompt = await self.get_system_prompt()
        system_prompt += (
            "\n\nSELF-CRITIQUE MODE: Ruthlessly evaluate your previous sentiment analysis. "
            "Identify sentiment bias, herd mentality, FOMO, or excessive pessimism. "
            "Penalize the confidence score if the signal overly relies on unreliable crowd emotion rather than solid macro indicators."
        )
        
        output_str = json.dumps(own_output, indent=2)
        
        prompt = (
            f"INSTRUCTIONS:\n{system_prompt}\n\n"
            f"Review the following signal intent and decision trace.\n\n"
            f"--- PREVIOUS SIGNAL ---\n{output_str}\n\n"
            f"Provide an adjusted confidence score (0.0 to 1.0), identify bias or weaknesses, and give suggestions."
        )

        response_schema = {
            "type": "object",
            "properties": {
                "adjusted_confidence": {
                    "type": "number", 
                    "minimum": 0.0, 
                    "maximum": 1.0,
                    "description": "Revised confidence score. Lower the original score if reasoning is emotionally biased."
                },
                "suggestion": {
                    "type": "string",
                    "description": "Actionable suggestion to filter the noise or hedge against sentiment traps."
                },
                "critique_trace": {
                    "type": "string",
                    "description": "Internal monologue exposing sentiment biases or market risks in the original thought process."
                }
            },
            "required": ["adjusted_confidence", "suggestion", "critique_trace"]
        }

        try:
            result = await self.provider.generate_structured(
                prompt=prompt,
                response_schema=response_schema,
                temperature=0.2
            )
            
            if "error" in result:
                raise ValueError(f"Provider returned an error: {result['error']}")
                
            # Maintain a rolling history of critiques
            critique_history = self.load_from_memory("mirofish_critique_history") or []
            critique_history.append({
                "timestamp": time.time(),
                "adjusted_confidence": result.get("adjusted_confidence"),
                "suggestion": result.get("suggestion")
            })
            self.save_to_memory("mirofish_critique_history", critique_history[-5:])

            new_conf = result.get('adjusted_confidence', 0.0)
            logger.debug(f"{self.name} critique completed. Adjusted Confidence: {new_conf:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"{self.name} encountered an error during critique(): {e}", exc_info=True)
            original_conf = own_output.get("intent", {}).get("confidence", 0.0)
            return {
                "adjusted_confidence": original_conf,
                "suggestion": "CRITIQUE ERROR: Unable to parse reflection. Proceed with caution.",
                "critique_trace": f"Critique subsystem failure: {str(e)}"
            }
