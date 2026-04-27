import unittest
from dataclaw_core.state.settings_db import SettingsDB
from dataclaw_core.state.persistent_store import PersistentStore
from dataclaw_core.core.mode_manager import ModeManager
from dataclaw_core.core.trade_mode_guard import TradeModeGuard
from dataclaw_core.exchanges.exchange_registry import ExchangeRegistry
from dataclaw_core.exchanges.smart_execution_router import SmartExecutionRouter
from dataclaw_core.agents.onchain_agent import OnchainAgent

class TestDataClawArchitecture(unittest.TestCase):
    def setUp(self):
        self.store = PersistentStore()
        self.store.db.db_path = "settings_test.db"
        self.store.db._init_db()
        self.store.save_trading_mode("paper") # Base mode

    def test_state_persistence_agents_and_plugins(self):
        # Agents
        self.store.save_agent_config("AlphaExecutor", {"model": "mistral-7b"})
        cfg = self.store.get_agent_config("AlphaExecutor")
        self.assertEqual(cfg["model"], "mistral-7b")
        
        # Plugins
        self.store.save_plugin_state("TestPlugin", {"active": True, "uri": "github.com/abc"})
        plugs = self.store.get_active_plugins()
        self.assertTrue(plugs["TestPlugin"]["active"])

    def test_mode_manager_switch_and_guards(self):
        manager = ModeManager()
        manager.store = self.store 
        
        # Switch to shadow
        manager.set_mode("shadow")
        self.assertEqual(manager.get_mode(), "shadow")
        
        # Safety guard for Live
        with self.assertRaises(PermissionError):
            manager.set_mode("live", confirmation=False)
            
        manager.set_mode("live", confirmation=True)
        self.assertEqual(manager.get_mode(), "live")

    def test_live_paper_safety_guard(self):
        manager = ModeManager()
        manager.store = self.store
        manager.set_mode("paper")
        
        guard = TradeModeGuard()
        guard.mode_manager = manager
        payload = {"symbol": "BTC/USDT", "side": "BUY"}
        
        self.assertFalse(guard.validate_execution(payload))
        manager.set_mode("live", confirmation=True)
        self.assertTrue(guard.validate_execution(payload))

    def test_multi_exchange_routing_and_failover(self):
        registry = ExchangeRegistry()
        registry.register_exchange("Binance", {"taker_fee": 0.0004})
        registry.register_exchange("OKX", {"taker_fee": 0.0002})
        
        router = SmartExecutionRouter(registry)
        # Force paper mode for safe simulations
        router.trade_guard.mode_manager.set_mode("paper")
        
        best = router._determine_best_venue("BTC/USDT")
        self.assertEqual(best, "OKX", "Smart routing should select lowest fee venue")
        
        execution_res = router.execute_order("BTC/USDT", "BUY", 0.5)
        self.assertEqual(execution_res["status"], "simulated")
        self.assertEqual(execution_res["venue"], "OKX")

    def test_onchain_agent_signals(self):
        agent = OnchainAgent()
        market_data_whale_in = {"onchain_metrics": {"whale_flow_usd": 15000000, "dex_vol_24h_change": 0.1}}
        signal = agent.get_signal(market_data_whale_in)
        self.assertEqual(signal["signal"], "BUY")
        self.assertGreaterEqual(signal["confidence"], 0.8)

if __name__ == '__main__':
    unittest.main()
