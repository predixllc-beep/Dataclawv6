import os
import yaml
import logging
from typing import Dict, Any, List

logger = logging.getLogger("Dataclaw.PluginLoader")

class PluginRegistry:
    def __init__(self):
        self.plugins = {}

    def discover_plugins(self, plugin_dir: str = "dataclaw_core/plugins"):
        """Auto-discover plugins at startup based on manifest files."""
        if not os.path.exists(plugin_dir):
            return

        for root, _, files in os.walk(plugin_dir):
            if "plugin.yaml" in files:
                manifest_path = os.path.join(root, "plugin.yaml")
                try:
                    with open(manifest_path, "r") as f:
                        manifest = yaml.safe_load(f)
                    
                    name = manifest.get("name")
                    if name:
                        self.plugins[name] = manifest
                        logger.info(f"Auto-registered plugin: {name} (Priority: {manifest.get('priority', 'low')})")
                except Exception as e:
                    logger.error(f"Failed to load plugin manifest at {manifest_path}: {e}")

    def load_strategy(self, name: str) -> Dict[str, Any]:
        if name in self.plugins:
            logger.info(f"Loading strategy components for {name}")
            return self.plugins[name]
        raise ValueError(f"Plugin {name} not found in registry.")

