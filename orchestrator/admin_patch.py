# merge into existing admin.py
from fastapi import APIRouter
from agent_registry import AgentConfig
from plugin_manager import add_api_agent
from repo_installer import install_repo
router=APIRouter()
@router.post('/agents/add/api')
async def api_agent(agent:AgentConfig): return add_api_agent(agent)
@router.post('/agents/add/repo')
async def repo_agent(repo_url:str): return install_repo(repo_url)
