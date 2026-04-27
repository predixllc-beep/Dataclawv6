#!/bin/bash
echo "$(date) - Triggering SAFE MODE!" >> /opt/dataclaw/logs/failsafe.log
echo '{"safe_mode": true, "reason": "emergency trigger script invoked"}' > /opt/dataclaw/logs/system_state.json
# Optional: could kill docker-compose except for the essential fallback models
docker-compose pause agent_core
