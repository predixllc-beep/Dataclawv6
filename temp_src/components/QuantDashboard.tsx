import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ShieldAlert, Activity, GitCommit, GitBranch, Cpu, Database, Eye, Crosshair } from 'lucide-react';

const regimeData = Array.from({ length: 40 }).map((_, i) => ({
  time: i,
  volatility: Math.random() * 100,
  momentum: Math.random() * 50 - 25,
}));

const signalConfidence = [
  { factor: 'Order Flow', score: 92, risk: 'LOW' },
  { factor: 'Momentum', score: 85, risk: 'MED' },
  { factor: 'Structure', score: 71, risk: 'HIGH' },
  { factor: 'Liquidity', score: 88, risk: 'LOW' },
  { factor: 'Regime', score: 65, risk: 'MED' },
];

export default function QuantDashboard() {
  return (
    <div className="flex-1 p-2 bg-[#020202] text-neutral-300 font-mono text-xs overflow-y-auto">
      <div className="grid grid-cols-12 gap-2 max-w-[2000px] mx-auto">
        
        {/* TOP ROW: Global State */}
        <div className="col-span-12 flex justify-between items-center px-2 py-1 bg-[#0a0a0a] border border-neutral-800 rounded-sm">
           <div className="flex space-x-6">
             <div className="flex items-center space-x-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-emerald-500 font-semibold tracking-wider">LIVE LAB</span>
             </div>
             <div className="flex items-center space-x-2 text-neutral-500">
               <Activity size={14} />
               <span>Regime: <span className="text-amber-400">HIGH_VOL_CONTRACTION</span></span>
             </div>
           </div>
           <div className="flex space-x-4 items-center">
             <div className="text-right">
               <div className="text-neutral-500">Global VaR (99%)</div>
               <div className="text-red-400 font-bold">$1.42M</div>
             </div>
             <div className="text-right">
               <div className="text-neutral-500">Gross Exposure</div>
               <div className="text-blue-400 font-bold">$14.5M</div>
             </div>
             <button className="bg-red-900/30 hover:bg-red-900/60 text-red-500 border border-red-900/50 px-4 py-2 flex items-center space-x-2 transition-colors">
               <ShieldAlert size={14} />
               <span>KILL SWITCH</span>
             </button>
           </div>
        </div>

        {/* LEFT COLUMN: Agent & Signal Radar */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-2">
          
          {/* Signal Laboratory Canvas */}
          <Card className="min-h-[400px] md:h-64 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><Crosshair size={14} className="text-blue-400"/> <span>Signal Fusion Matrix</span></CardTitle>
              <div className="text-[10px] text-neutral-500 bg-neutral-900 px-2 py-1 rounded">MULTI-FACTOR CONFIRMATION</div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col md:flex-row flex-1">
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-neutral-800 p-4 shrink-0">
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-neutral-400 text-xs">AGGREGATE</span>
                    <span className="text-xl text-emerald-400 cursor-pointer">LONG (A-)</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1">
                    <div className="bg-emerald-500 h-1" style={{ width: '84%' }} />
                  </div>
                </div>
                <div className="space-y-2 mt-4 md:mt-6">
                  {signalConfidence.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-500 w-24 truncate">{s.factor}</span>
                      <div className="flex-1 px-2">
                        <div className="w-full bg-neutral-900 h-1">
                          <div className={s.score > 80 ? 'bg-emerald-500 h-1' : s.score > 70 ? 'bg-amber-500 h-1' : 'bg-red-500 h-1'} style={{ width: `${s.score}%` }} />
                        </div>
                      </div>
                      <span className="w-6 text-right text-neutral-300">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-2/3 p-4 relative min-h-[150px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={regimeData}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', fontSize: '10px' }} itemStyle={{ color: '#a3a3a3' }} />
                    <Area type="monotone" dataKey="volatility" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVol)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Agent Orchestration DAG */}
          <Card className="min-h-[400px] md:h-64 flex flex-col relative overflow-hidden group">
            <CardHeader className="relative z-10 bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-900">
              <CardTitle className="flex items-center space-x-2"><GitBranch size={14} className="text-purple-400"/> <span>Agent Routing DAG</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-neutral-950 flex-1 relative overflow-hidden">
              {/* Background Matrix/Grid */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none" />
              
              {/* Animated SVG Connections (Background Layer) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                  </linearGradient>
                  {/* Animation for dashed line */}
                  <style>
                    {`
                      .path-flow {
                        stroke-dasharray: 10, 10;
                        animation: dashFlow 2s linear infinite;
                      }
                      @keyframes dashFlow {
                        to {
                          stroke-dashoffset: -20;
                        }
                      }
                    `}
                  </style>
                </defs>
                
                {/* Main Path (Ingest -> Signals) */}
                <path d="M 120 50 L 250 50" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="path-flow opacity-70" />
                <path d="M 120 150 L 250 150" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="path-flow opacity-30" />
                
                {/* Signals -> Consensus */}
                <path d="M 350 50 L 480 100" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="path-flow opacity-70" />
                <path d="M 350 150 L 480 100" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="path-flow opacity-70" />
                
                {/* Consensus -> Supervisor */}
                <path d="M 580 100 L 710 100" stroke="#f59e0b" strokeWidth="2" fill="none" className="path-flow opacity-90" />
              </svg>

              <div className="relative z-10 flex h-full w-full min-w-[750px] items-center justify-between px-6 py-6 overflow-x-auto">
                
                {/* Stage 1: Ingestion */}
                <div className="flex flex-col space-y-12 w-32 relative">
                  <div className="absolute -left-2 -top-4 text-[9px] font-mono text-neutral-500 tracking-wider">STAGE 1: SENSORS</div>
                  <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg text-center shadow-lg hover:-translate-y-1 transition-transform relative group/node cursor-default" title="Provides real-time tick data and OHLCV chunks">
                    <div className="absolute -top-2 -right-2 bg-green-500/20 text-green-400 text-[8px] px-1.5 py-0.5 rounded border border-green-500/50">12ms</div>
                    <div className="text-amber-400 font-bold mb-1 flex items-center justify-center gap-1"><Database size={10}/> DATA_CLAW</div>
                    <div className="text-[10px] text-neutral-400">Stream Alive</div>
                  </div>
                  
                  <div className="bg-neutral-900/50 border border-neutral-800 p-3 rounded-lg text-center opacity-70 hover:opacity-100 transition-opacity cursor-default" title="Provides historical context and vector embeddings">
                    <div className="text-purple-400/70 font-bold mb-1 flex items-center justify-center gap-1"><Database size={10}/> MEM_CLAW</div>
                    <div className="text-[10px] text-neutral-500">Idle</div>
                  </div>
                </div>

                {/* Stage 2: Signal / Cognition */}
                <div className="flex flex-col space-y-8 w-36 relative">
                  <div className="absolute -left-2 -top-4 text-[9px] font-mono text-neutral-500 tracking-wider">STAGE 2: COGNITION</div>
                  <div className="bg-blue-900/20 border border-blue-500/50 p-3 rounded-lg text-center shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all cursor-default" title="Technical patterns and order flow analysis">
                    <div className="absolute -left-2 top-1/2 flex h-2 w-2 -translate-y-1/2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-blue-500/20 text-blue-400 text-[8px] px-1.5 py-0.5 rounded border border-blue-500/50">Conf: 89%</div>
                    <div className="text-blue-400 font-bold mb-1 flex items-center justify-center space-x-1"><Cpu size={10}/><span>BETAFISH</span></div>
                    <div className="text-[10px] text-blue-200/70">Analyzing Flow</div>
                    <div className="mt-2 w-full bg-blue-950 rounded-full h-1"><div className="bg-blue-500 h-1 rounded-full w-[70%] animate-pulse"></div></div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/50 p-3 rounded-lg text-center shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all cursor-default" title="Macro trends and sentiment analysis">
                    <div className="absolute -left-2 top-1/2 flex h-2 w-2 -translate-y-1/2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-blue-500/20 text-blue-400 text-[8px] px-1.5 py-0.5 rounded border border-blue-500/50">Conf: 72%</div>
                    <div className="text-purple-400 font-bold mb-1 flex items-center justify-center space-x-1"><Activity size={10}/><span>MIROFISH</span></div>
                    <div className="text-[10px] text-purple-200/70">Evaluating Macro</div>
                    <div className="mt-2 w-full bg-purple-950 rounded-full h-1"><div className="bg-purple-500 h-1 rounded-full w-[40%] animate-pulse"></div></div>
                  </div>
                </div>

                {/* Stage 3: Swarm Consensus */}
                <div className="flex flex-col space-y-2 w-32 relative">
                  <div className="absolute -left-2 -top-4 text-[9px] font-mono text-neutral-500 tracking-wider">STAGE 3: SWARM</div>
                  <div className="bg-indigo-900/20 border border-indigo-500/50 p-3 rounded-lg text-center hover:scale-105 transition-transform cursor-default" title="Calculates weighted direction score">
                    <div className="text-indigo-400 font-bold mb-1 flex items-center justify-center space-x-1"><GitCommit size={12}/><span>SWARM</span></div>
                    <div className="text-[10px] text-indigo-200/70">Awaiting Sub-Agents</div>
                  </div>
                </div>

                {/* Stage 4: Risk / Policy */}
                <div className="flex flex-col space-y-2 w-32 relative">
                  <div className="absolute -left-2 -top-4 text-[9px] font-mono text-neutral-500 tracking-wider">STAGE 4: POLICY</div>
                   <div className="bg-amber-900/20 border border-amber-500/50 p-3 rounded-lg text-center hover:border-amber-400 transition-colors cursor-default" title="Risk Gate: Enforces drawdown limits and portfolio exposure">
                    <div className="text-amber-400 font-bold mb-1 flex items-center justify-center space-x-1"><ShieldAlert size={10}/><span>POLICY_GUARD</span></div>
                    <div className="text-[10px] text-amber-200/70">Armed</div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Execution & Risk */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
          
          <Card className="min-h-[300px] md:h-64 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><Database size={14} className="text-amber-400"/> <span>Live Execution Sim</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-neutral-400 font-mono flex-1">
              <div className="h-full overflow-y-auto overflow-x-auto">
                <table className="w-full text-left min-w-[340px]">
                  <thead className="bg-[#0a0a0a] text-neutral-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-normal">TIME</th>
                      <th className="px-4 py-2 font-normal">SYM</th>
                      <th className="px-4 py-2 font-normal text-right">ACTION</th>
                      <th className="px-4 py-2 font-normal text-right">SLIPPAGE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900/50 whitespace-nowrap">
                    {[
                      { t: '16:01:23', sym: 'BTC-PERP', a: 'LIMIT BUY 1.4', slip: '-0.3 bps' },
                      { t: '16:00:54', sym: 'ETH-PERP', a: 'MARKET SELL 14', slip: '+2.1 bps' },
                      { t: '15:58:12', sym: 'SOL-PERP', a: 'TWAP 1/10 BUY', slip: '-0.1 bps' },
                      { t: '15:58:12', sym: 'SOL-PERP', a: 'CANCELED', slip: '-' },
                      { t: '15:52:01', sym: 'BTC-PERP', a: 'LIMIT SELL 4.1', slip: '0.0 bps' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-900/50">
                        <td className="px-4 py-2 text-neutral-500">{row.t}</td>
                        <td className="px-4 py-2">{row.sym}</td>
                        <td className={`px-4 py-2 text-right ${row.a.includes('BUY') ? 'text-emerald-400' : row.a.includes('SELL') ? 'text-red-400' : 'text-neutral-500'}`}>{row.a}</td>
                        <td className={`px-4 py-2 text-right ${row.slip.includes('+') ? 'text-red-400' : 'text-emerald-400'}`}>{row.slip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="h-64 bg-red-950/10 border-red-900/20">
            <CardHeader className="border-red-900/20 bg-transparent">
              <CardTitle className="text-red-500 text-[10px]">RISK GOVERNANCE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
               <div>
                 <div className="flex justify-between mb-1">
                   <span className="text-neutral-500">Max Drawdown Limit</span>
                   <span className="text-red-400">-4.2% / -5.0%</span>
                 </div>
                 <div className="w-full bg-neutral-900 h-1">
                   <div className="bg-red-500 h-1 w-[84%]" />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between mb-1">
                   <span className="text-neutral-500">Concentration (BTC)</span>
                   <span className="text-neutral-300">38% / 40%</span>
                 </div>
                 <div className="w-full bg-neutral-900 h-1">
                   <div className="bg-amber-500 h-1 w-[95%]" />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between mb-1">
                   <span className="text-neutral-500">Agent Veto Rate</span>
                   <span className="text-neutral-300">14% (Critic Rejects)</span>
                 </div>
                 <div className="w-full bg-neutral-900 h-1">
                   <div className="bg-blue-500 h-1 w-[14%]" />
                 </div>
               </div>
               
               <div className="pt-2">
                 <div className="text-xs text-neutral-500 mb-2">Automated Rules Enforced:</div>
                 <div className="flex items-center space-x-2 text-emerald-500/80">
                   <GitCommit size={12}/> <span>Hard Stop-Loss at 2.5% Position Risk</span>
                 </div>
                 <div className="flex items-center space-x-2 text-emerald-500/80 mt-1">
                   <GitCommit size={12}/> <span>Execution Halted during High Spread</span>
                 </div>
               </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
