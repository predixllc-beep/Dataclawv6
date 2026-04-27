from pydantic import BaseModel
from typing import List,Optional,Dict
class AgentConfig(BaseModel):
    id:str; name:str; source:str; role:str; model:str; prompt:str
    enabled:bool=True; risk_level:str="medium"; confidence_threshold:int=70
    api_endpoint:Optional[str]=None; repo_url:Optional[str]=None
    capabilities:List[str]=[]
class AgentRegistry:
    def __init__(self):
        self.agents={}
        self.bootstrap_core()
    def bootstrap_core(self):
        for a in [
            AgentConfig(id='openclaw',name='OpenClaw',source='core',role='executor',model='claude-haiku',prompt='Execution routing'),
            AgentConfig(id='mirofish',name='Mirofish',source='core',role='signal',model='claude-sonnet',prompt='Signal generation'),
            AgentConfig(id='betafish',name='Betafish',source='core',role='arbitrage',model='claude-sonnet',prompt='Arbitrage'),
            AgentConfig(id='onyx',name='Onyx',source='core',role='research',model='claude-opus',prompt='Research')
        ]: self.agents[a.id]=a
    def register(self,a): self.agents[a.id]=a
registry=AgentRegistry()
