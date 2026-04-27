import React, { useState, useEffect } from 'react';
import { Target, Zap, Activity, ShieldAlert, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { usePersistentStore } from '../state/persistentStore';

// Mock live data generator
const generateChartData = () => {
    let base = 94000;
    return Array.from({length: 40}).map((_, i) => {
        base = base + (Math.random() * 200 - 100);
        return {
            time: `-${40-i}m`,
            price: base,
            momentum: Math.random() * 100
        }
    });
};

export default function SignalEngine() {
   const [data, setData] = useState(generateChartData());
   const { agents } = usePersistentStore();

   // Gather explainable signals across all agents
   const signals = agents.flatMap(a => (a.state?.decisionLog || []).map(log => ({ ...log, agentName: a.name }))).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

   useEffect(() => {
     const interval = setInterval(() => {
        setData(prev => {
            const next = [...prev.slice(1)];
            const last = prev[prev.length - 1];
            next.push({
                time: 'Now',
                price: last.price + (Math.random() * 200 - 100),
                momentum: Math.random() * 100
            });
            return next;
        });
     }, 3000);
     return () => clearInterval(interval);
   }, []);

   return (
     <div className="flex-1 flex flex-col h-full bg-[#050505] relative z-10 overflow-hidden">
       <div className="p-4 md:p-6 border-b border-white/5 shrink-0 bg-[#0B0E11]/40 backdrop-blur-md flex items-center justify-between">
         <div>
           <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Syne']">
             <Activity size={18} className="text-[#FCD535]" />
             Signal Interrogator
           </h2>
           <p className="text-xs text-gray-500 font-mono mt-1">Deep Signal Explainability & Margin Verification</p>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 md:p-6 font-mono">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
             
             {/* Main Chart Area */}
             <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 flex flex-col h-[300px] md:h-[400px]">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                         <h3 className="text-sm font-bold text-white">BTC/USDT</h3>
                         <span className="text-[10px] bg-[#FCD535]/20 text-[#FCD535] px-2 py-0.5 rounded">Binance</span>
                         <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">15m</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs text-[#FCD535]">+1.24%</span>
                        <span className="text-xs text-gray-400">Vol: 1.2B</span>
                      </div>
                   </div>
                   <div className="flex-1 min-h-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                           <XAxis dataKey="time" stroke="#333" fontSize={10} tickMargin={10} />
                           <YAxis stroke="#333" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `${v.toFixed(0)}`} />
                           <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: '10px' }} />
                           <Line type="monotone" dataKey="price" stroke="#FCD535" strokeWidth={2} dot={false} />
                        </LineChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                {/* Explainability Breakdown (Last Signal) */}
                {signals[0] && (
                <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-4 md:p-5">
                   <h3 className="text-[10px] md:text-xs font-bold text-[#FCD535] uppercase mb-4 tracking-wider">Active Signal Logic Trace</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                         <div className="text-[9px] text-gray-500 mb-1">EXECUTION THESIS</div>
                         <div className="text-xs text-white leading-relaxed">{signals[0].whyEntry}</div>
                      </div>
                      <div>
                         <div className="text-[9px] text-gray-500 mb-1">RISK ENGINE (SIZE & LEVERAGE)</div>
                         <div className="text-xs text-amber-200 leading-relaxed mb-2">SIZE: {signals[0].whySize}</div>
                         <div className="text-xs text-emerald-200 leading-relaxed">LEV: {signals[0].whyLeverage}</div>
                      </div>
                      <div>
                         <div className="text-[9px] text-gray-500 mb-1">INVALIDATION PARAMETERS</div>
                         <div className="text-xs text-red-300 leading-relaxed mb-2">STOP: {signals[0].whyStop}</div>
                         <div className="text-xs text-blue-300 leading-relaxed">TARGET: {signals[0].whyTarget}</div>
                      </div>
                   </div>
                </div>
                )}
             </div>

             {/* Agent Signals List */}
             <div className="flex flex-col gap-4 md:gap-6 pb-20 md:pb-0">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 flex-1 flex flex-col min-h-0">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                         <Target size={14} />
                         Swarm Ledger
                      </h3>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FCD535] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FCD535]"></span>
                      </span>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
                      {signals.length === 0 ? <p className="text-xs text-gray-500">No signals generated.</p> : signals.map((s, i) => (
                         <div key={`${s.id}-${i}`} className="bg-[#0B0E11]/40 border border-white/5 rounded-lg p-4 hover:border-[#FCD535]/30 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                               <div className="flex gap-2 items-center">
                                  <span className={clsx(
                                     "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                     s.type === 'LONG' ? "bg-[#FCD535]/20 text-[#FCD535]" :
                                     s.type === 'SHORT' ? "bg-red-500/20 text-red-400" :
                                     "bg-gray-500/20 text-gray-400"
                                  )}>{s.type}</span>
                                  <span className="text-xs text-white font-bold">{s.asset}</span>
                               </div>
                               <span className={clsx("text-[10px] font-bold", s.confidence > 85 ? "text-[#FCD535]" : "text-amber-400")}>{s.confidence}% CONF</span>
                            </div>
                            <div className="text-[9px] text-gray-500 mb-2">Source: {s.agentName}</div>
                            <p className="text-[10px] text-gray-400 leading-relaxed mb-3 line-clamp-2">
                               {s.whyEntry}
                            </p>
                            <button className="w-full py-1.5 bg-white/5 hover:bg-blue-400/10 border border-white/10 hover:border-blue-400/30 rounded text-[9px] text-blue-400 font-bold uppercase transition-colors opacity-0 group-hover:opacity-100">
                               INTERROGATE AGENT DESK
                            </button>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

          </div>
       </div>
     </div>
   );
}
