import time
import logging
import psutil
import json
from pathlib import Path
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Watchdog:
    def __init__(self):
        self.log_dir = Path("/opt/dataclaw/logs")
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.state_file = self.log_dir / "system_state.json"
        
    def check_memory(self):
        mem = psutil.virtual_memory()
        if mem.percent > 90:
            logger.error(f"CRITICAL: Memory footprint at {mem.percent}%. Triggering recovery.")
            self.trigger_safe_mode("Memory leak detected")

    def check_agent_health(self):
        # In a real environment, query Docker API or a local API endpoint on agent_core
        # to ensure agents are still updating heartbeats in the DB/memory.
        pass

    def check_model_load(self):
        # Check system load
        load = os.getloadavg()
        if load[0] > psutil.cpu_count() * 2:
            logger.warning("High CPU load detected. Inference queues may be backing up.")

    def trigger_safe_mode(self, reason):
        logger.critical(f"ENTERING SAFE MODE: {reason}")
        # Write state to instruct the main application to enter safe mode logic on next evaluation
        with open(self.state_file, 'w') as f:
            json.dump({"safe_mode": True, "reason": reason, "timestamp": time.time()}, f)

    def monitor_loop(self):
        logger.info("Watchdog Health Monitor started.")
        while True:
            try:
                self.check_memory()
                self.check_model_load()
                self.check_agent_health()
                time.sleep(60)
            except Exception as e:
                logger.error(f"Watchdog error: {e}")
                time.sleep(10)

if __name__ == "__main__":
    Watchdog().monitor_loop()
