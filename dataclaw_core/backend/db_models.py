from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class AgentConfigModel(BaseModel):
    name: str
    model: str
    config_json: Dict[str, Any] = Field(default_factory=dict)

class AgentMemoryModel(BaseModel):
    agent_name: str
    memory_text: str
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class TradeHistoryModel(BaseModel):
    symbol: str
    side: str
    size: float
    price: Optional[float] = None
    venue: str
    mode: str

class ExchangeConnectionModel(BaseModel):
    venue: str
    api_key_encrypted: str
    api_secret_encrypted: str
    is_active: bool = True

class PluginRegistryModel(BaseModel):
    plugin_name: str
    state_json: Dict[str, Any] = Field(default_factory=dict)

class SignalLogModel(BaseModel):
    agent_name: str
    symbol: str
    signal: str
    confidence: float
    rationale: Optional[str] = None
