CORE_POLICY={'min_confidence':70,'auto_band':85}
def validate_plugin(agent):
    if agent.confidence_threshold<70:
        raise Exception('plugin confidence invalid')
    return True
