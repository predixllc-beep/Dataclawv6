import logging
import sys
import time

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("Dataclaw.Main")

from dataclaw_core.core.model_router import ModelRouter
from dataclaw_core.core.safety_system import SafetySystem
from dataclaw_core.exchanges.smart_router import SmartExchangeRouter
from dataclaw_core.backend.core_mem import CoreMemProtocol
from dataclaw_core.backend.vector_memory import VectorMemoryService
from dataclaw_core.agents.swarm import AlphaHunter, RiskGuardian, ExecutionAgent, OnchainAgent, MetaGovernor
from dataclaw_core.plugins.plugin_loader import PluginRegistry

class DataclawOS:
    def __init__(self):
        logger.info("Initializing Dataclaw Autonomous Agent OS...")
        self.config = {
            "mode": "paper", # live, paper, shadow, safe
            "router_config": {"primary": "mistral", "fallback": "deepseek"},
            "exchanges": {"binance": {"enabled": True}, "mexc": {"enabled": True}}
        }
        
        # 1. Initialize Core Subsystems
        self.core_mem = CoreMemProtocol()
        self.memory = VectorMemoryService()
        self.router = ModelRouter(self.config["router_config"])
        self.safety = SafetySystem(mode=self.config["mode"])
        self.exchange_engine = SmartExchangeRouter(self.config["exchanges"])
        self.registry = PluginRegistry()

        # 2. Setup Swarm
        self.swarm = {
            "alpha": AlphaHunter(self.memory, self.core_mem),
            "risk": RiskGuardian(self.memory, self.core_mem),
            "execution": ExecutionAgent(self.memory, self.core_mem),
            "onchain": OnchainAgent(self.memory, self.core_mem),
            "governor": MetaGovernor(self.memory, self.core_mem)
        }

    def run(self):
        logger.info("Dataclaw OS actively monitoring...")
        
        try:
            # Main event loop (simulated)
            market_data = {"symbol": "BTC/USDT", "price": 94000, "volatility": "normal"}
            
            # Step 1: Discover
            alpha_signal = self.swarm["alpha"].process(market_data)
            onchain_signal = self.swarm["onchain"].process(market_data)
            
            # Step 2: Meta Governance
            decision = self.swarm["governor"].process([alpha_signal, onchain_signal])
            
            if decision["final_decision"] == "execute":
                # Step 3: Risk Evaluation
                risk_eval = self.swarm["risk"].process(alpha_signal)
                
                if risk_eval["approved"]:
                    # Step 4: Validate Safety
                    order = {"symbol": alpha_signal["symbol"], "direction": alpha_signal["direction"], "amount": 0.01}
                    if self.safety.validate_execution(order):
                        # Step 5: Route and Execute
                        exec_result = self.exchange_engine.execute_order(order)
                        self.swarm["execution"].process(exec_result) # Agent records outcome
                        self.core_mem.emit_trade(exec_result)
        except KeyboardInterrupt:
             logger.info("Shutting down Dataclaw OS.")
             sys.exit(0)
        except Exception as e:
             logger.error(f"Critical system failure: {e}")
             self.safety.engage_kill_switch(str(e))

if __name__ == '__main__':
    system = DataclawOS()
    system.run()
