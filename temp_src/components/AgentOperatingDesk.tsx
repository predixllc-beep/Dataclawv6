import React from 'react';
import { usePersistentStore } from '../state/persistentStore';
import { BrainCircuit, Activity, Crosshair, Cpu, MemoryStick, Target, ShieldAlert, BadgeCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

export default function AgentOperatingDesk({ agentId, onBack }: { agentId: string, onBack: () => void }) {
  const { agents, models, assignModelToAgent } = usePersistentStore();
  const agent = agents.find(a => a.id.toLowerCase() === agentId.toLowerCase() || a.name.toLowerCase() === agentId.toLowerCase());

  if (!agent || !agent.state) return (
    <div className="flex flex-col items-center justify-center h-full p-8 font-mono text-gray-500">
      <BrainCircuit size={48} className="mb-4 text-gray-800" />
      <div>No memory trace found for agent signature '{agentId}'.</div>
      <button onClick={onBack} className="mt-4 text-[#00FFB2] hover:text-white underline">Return to CrewAI</button>
    </div>
  );

  const { state } = agent;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] relative z-10 overflow-hidden font-mono text-white">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/5 shrink-0 bg-black/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-xs border border-white/10 px-3 py-1 rounded">
             &larr; BACK
           </button>
           <div>
             <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Syne'] uppercase">
               <BrainCircuit size={18} className="text-[#00FFB2]" />
               {agent.name} 
               <span className="text-[10px] text-[red] text-gray-500 font-mono tracking-widest">{agent.id}</span>
               <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 ml-2 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                 Health: {state.health}%
               </span>
             </h2>
             <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-wider">Role: {agent.role}</p>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex flex-col items-end">
              <span className="text-[9px] text-gray-400 font-mono uppercase">Win Rate</span>
              <span className="text-sm font-bold text-blue-400">{state.performance.winRate.toFixed(1)}%</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 pb-20 md:pb-0">
          
          {/* Main Execution Log & Reason Trace */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
            <Card className="flex flex-col min-h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2"><Crosshair size={14} className="text-[#00FFB2]"/> <span>Decision Ledger & Diagnostics</span></CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto">
                 {state.decisionLog.length === 0 ? (
                   <div className="text-gray-500 text-xs italic">No decisions logged.</div>
                 ) : (
                   <div className="flex flex-col gap-4">
                     {state.decisionLog.map(log => (
                       <div key={log.id} className="border border-white/10 rounded-lg bg-black/40 p-4">
                         <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center gap-3">
                             <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold", log.type === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : log.type === 'SHORT' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400')}>
                               {log.type}
                             </span>
                             <span className="font-bold text-sm">{log.asset}</span>
                           </div>
                           <span className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                           <div>
                             <h4 className="text-[9px] text-gray-500 mb-1 uppercase tracking-wider">Why Entry?</h4>
                             <p className="text-xs text-gray-300">{log.whyEntry}</p>
                           </div>
                           <div>
                             <h4 className="text-[9px] text-gray-500 mb-1 uppercase tracking-wider">Position & Leverage</h4>
                             <p className="text-xs text-gray-300"><span className="text-blue-400">Lev:</span> {log.whyLeverage}</p>
                             <p className="text-xs text-gray-300 mt-1"><span className="text-blue-400">Size:</span> {log.whySize}</p>
                           </div>
                           <div>
                             <h4 className="text-[9px] text-gray-500 mb-1 uppercase tracking-wider">Risk Management</h4>
                             <p className="text-xs text-gray-300"><span className="text-red-400">Stop:</span> {log.whyStop}</p>
                             <p className="text-xs text-gray-300 mt-1"><span className="text-emerald-400">Target:</span> {log.whyTarget}</p>
                           </div>
                           <div className="flex flex-col justify-end">
                             <div className="bg-black border border-white/5 p-2 rounded flex justify-between items-center">
                                <span className="text-[10px] text-gray-500 uppercase">Swarm Consensus</span>
                                <div className="flex items-center gap-1">
                                  <BadgeCheck size={12} className="text-[#00FFB2]"/>
                                  <span className="text-xs font-bold text-[#00FFB2]">{log.confidence}%</span>
                                </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2"><MemoryStick size={14} className="text-purple-400"/> <span>Context & Memory State</span></CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <div className="space-y-3">
                  {state.memory.map(m => (
                    <div key={m.id} className="flex gap-4 items-start border-l-2 border-white/10 pl-3">
                       <span className="text-[10px] text-gray-500 w-16 shrink-0 pt-0.5">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       <p className="text-xs text-gray-300">{m.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Performance & Settings */}
          <div className="flex flex-col gap-4 md:gap-6">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2"><Activity size={14} className="text-blue-400"/> <span>Performance Analytics</span></CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-4">
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">Total PnL</span>
                    <span className={clsx("text-sm font-bold", state.performance.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {state.performance.pnl >= 0 ? '+' : ''}${state.performance.pnl.toFixed(2)}
                    </span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">Total Trades</span>
                    <span className="text-sm text-gray-200">{state.performance.totalTrades}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">Sharpe Ratio</span>
                    <span className="text-sm text-gray-200">{state.performance.sharpeRatio.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">Max Drawdown</span>
                    <span className="text-sm text-red-400">{state.performance.maxDrawdown.toFixed(1)}%</span>
                 </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2"><ShieldAlert size={14} className="text-amber-400"/> <span>Risk Configuration</span></CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <div className="text-xs space-y-4">
                    <div>
                      <div className="flex justify-between text-gray-400 mb-1"><span>Confidence Threshold</span> <span>{agent.confidenceThreshold}%</span></div>
                      <div className="h-1 bg-white/10 rounded overflow-hidden">
                        <div className="h-full bg-amber-400" style={{width: `${agent.confidenceThreshold}%`}}></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                       <span className="text-gray-400">Assigned Model</span>
                       <select 
                         value={agent.modelAssignmentType === 'default' ? 'default-local' : (agent.assignedModelId || 'default-local')}
                         onChange={(e) => assignModelToAgent(agent.id, e.target.value === 'default-local' ? 'default' : e.target.value)}
                         className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white max-w-[150px]"
                       >
                         {models.map(m => (
                           <option key={m.id} value={m.id}>{m.name}</option>
                         ))}
                       </select>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                       <span className="text-gray-400">Execution Status</span>
                       <span className={clsx("px-2 py-0.5 rounded text-[10px]", agent.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                         {agent.enabled ? 'ACTIVE' : 'SUSPENDED'}
                       </span>
                    </div>
                 </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col flex-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2"><Cpu size={14} className="text-gray-400"/> <span>Swarm Arbitration Log</span></CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <div className="text-[10px] text-gray-500 italic">
                   Awaiting next consensus cycle...
                 </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
}
