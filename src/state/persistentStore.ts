import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface LocalModelConfig {
  id: string
  name: string
  source: string
  endpoint: string
  assignedTo: string[] // 'all', or array of agent IDs
}

export interface DecisionTrace {
  id: string
  timestamp: string
  asset: string
  type: 'LONG' | 'SHORT' | 'EXIT' | 'HOLD'
  confidence: number
  whyEntry: string
  whyLeverage: string
  whySize: string
  whyStop: string
  whyTarget: string
}

export interface AgentMemory {
  id: string
  timestamp: string
  content: string
}

export interface AgentPerformance {
  winRate: number
  totalTrades: number
  pnl: number
  sharpeRatio: number
  maxDrawdown: number
}

export interface AgentState {
  performance: AgentPerformance;
  memory: AgentMemory[];
  decisionLog: DecisionTrace[];
  health: number;
}

export interface AgentConfig {
  id: string
  name: string
  role: string
  enabled: boolean
  confidenceThreshold: number
  modelAssignmentType: 'default' | 'assigned'
  assignedModelId?: string
  state?: AgentState // Runtime extended state
}

interface AppState {
  mode: 'paper' | 'live' | 'shadow'
  activeExchange: 'binance' | 'mexc' | 'auto'
  agents: AgentConfig[]
  models: LocalModelConfig[]
  killSwitchEngaged: boolean
  
  setMode: (mode: 'paper' | 'live' | 'shadow') => void
  setActiveExchange: (exchange: 'binance' | 'mexc' | 'auto') => void
  setKillSwitch: (state: boolean) => void
  updateAgent: (id: string, updates: Partial<AgentConfig>) => void
  addAgent: (agent: AgentConfig) => void
  addModel: (model: LocalModelConfig) => void
  removeModel: (id: string) => void
  assignModelToAgent: (agentId: string, modelId: string) => void
}

const generateMockAgentState = (): AgentState => ({
  performance: {
    winRate: 55 + Math.random() * 20,
    totalTrades: 10 + Math.floor(Math.random() * 50),
    pnl: (Math.random() * 10000) - 2000,
    sharpeRatio: 1.2 + Math.random() * 2,
    maxDrawdown: (Math.random() * 15) * -1
  },
  memory: [
    { id: Math.random().toString(36).substring(7), timestamp: new Date(Date.now() - 3600000).toISOString(), content: "Observed liquidity void in BTC/USDT orderbook" },
    { id: Math.random().toString(36).substring(7), timestamp: new Date(Date.now() - 7200000).toISOString(), content: "Updated risk vectors due to macro event proxy" }
  ],
  decisionLog: [
    { id: Math.random().toString(36).substring(7), timestamp: new Date(Date.now() - Math.random() * 1000000).toISOString(), asset: 'BTC/USDT', type: 'LONG', confidence: 82, whyEntry: 'Volume profile support breakout confirmed with positive CVD.', whyLeverage: 'ATR compression allows 5x without hitting max loss limits', whySize: 'Fixed fractional 2% total equity scaling', whyStop: 'Below structural swing low at 68,400', whyTarget: 'Unfilled CME gap at 71,200'}
  ],
  health: Math.floor(Math.random() * 21) + 80
});

export const usePersistentStore = create<AppState>()(
  persist(
    (set) => ({
      mode: 'paper',
      activeExchange: 'auto',
      agents: [
        { id: 'openclaw', name: 'OpenClaw', role: 'executor', enabled: true, confidenceThreshold: 80, modelAssignmentType: 'default', state: generateMockAgentState() },
        { id: 'mirofish', name: 'Mirofish', role: 'signal', enabled: true, confidenceThreshold: 85, modelAssignmentType: 'default', state: generateMockAgentState() },
        { id: 'betafish', name: 'Betafish', role: 'arbitrage', enabled: true, confidenceThreshold: 75, modelAssignmentType: 'default', state: generateMockAgentState() },
        { id: 'onyx', name: 'Onyx', role: 'research', enabled: true, confidenceThreshold: 80, modelAssignmentType: 'default', state: generateMockAgentState() },
      ],
      models: [
        { id: 'default-local', name: 'Default Local LLM', source: 'localhost', endpoint: 'http://localhost:11434/v1', assignedTo: ['all'] }
      ],
      killSwitchEngaged: false,
      
      setMode: (mode) => set({ mode }),
      setActiveExchange: (exchange) => set({ activeExchange: exchange }),
      setKillSwitch: (state) => set({ killSwitchEngaged: state }),
      
      updateAgent: (id, updates) => set((state) => ({
        agents: state.agents.map(a => a.id === id ? { ...a, ...updates } : a)
      })),
      
      addAgent: (agent) => set((state) => ({
        agents: [...state.agents, agent]
      })),

      addModel: (model) => set((state) => {
        // If assigned to 'all', we don't automatically update agents to 'assigned', we let them know it's available.
        return { models: [...state.models, model] }
      }),

      removeModel: (id) => set((state) => ({
        models: state.models.filter(m => m.id !== id),
        // revert agents that used this model to 'default'
        agents: state.agents.map(a => a.assignedModelId === id ? { ...a, modelAssignmentType: 'default', assignedModelId: undefined } : a)
      })),

      assignModelToAgent: (agentId, modelId) => set((state) => ({
        agents: state.agents.map(a => a.id === agentId ? { ...a, modelAssignmentType: modelId === 'default' ? 'default' : 'assigned', assignedModelId: modelId === 'default' ? undefined : modelId } : a)
      })),
    }),
    {
      name: 'dataclaw-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), 
    }
  )
)
