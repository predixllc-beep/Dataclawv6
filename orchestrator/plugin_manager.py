from agent_registry import registry
from policy_guard import validate_plugin
def add_api_agent(agent):
    validate_plugin(agent); registry.register(agent)
    return {'status':'installed','agent':agent.id}
