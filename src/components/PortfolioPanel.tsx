import { useState, useEffect } from "react";
import { useSimEngine } from '../state/simEngine';
import { Network, Activity, BarChart2 } from 'lucide-react';
import { clsx } from "clsx";

export default function PortfolioPanel() {
  const { balance, positions, history, openPosition, closePosition, updatePrices } = useSimEngine();
  const [prices, setPrices] = useState<Record<string, number>>({
    'BTC/USDT': 94500,
    'ETH/USDT': 3450,
    'SOL/USDT': 180
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time price updates locally
      setPrices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k] = next[k] + (Math.random() * (next[k] * 0.002) - (next[k] * 0.001));
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    updatePrices(prices);

    // Simulate generic agent order opening randomly
    if (Math.random() > 0.8 && positions.length < 5) {
        const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
        const randSym = symbols[Math.floor(Math.random() * symbols.length)];
        openPosition(
          ['mirofish', 'betafish', 'onyx'][Math.floor(Math.random()*3)],
          randSym,
          Math.random() > 0.5 ? 'LONG' : 'SHORT',
          randSym === 'BTC/USDT' ? 0.1 : randSym === 'ETH/USDT' ? 2 : 20,
          prices[randSym],
          Math.floor(Math.random() * 9) + 2
        );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices]);

  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] relative z-10 overflow-hidden text-white font-mono">
       <div className="p-6 border-b border-white/5 shrink-0 bg-[#0B0E11]/40 backdrop-blur-md flex items-center justify-between">
         <div>
           <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Syne']">
             <BarChart2 size={18} className="text-[#FCD535]" />
             Simulation & Execution Engine
           </h2>
           <p className="text-xs text-gray-500 font-mono mt-1">Institutional Paper Trading & Agent Order Routing</p>
         </div>
         <div className="flex gap-4">
           <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FCD535] shadow-[0_0_8px_#FCD535] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] text-[#FCD535] font-mono uppercase">Engine Status</span>
                <span className="text-sm font-bold text-white leading-none mt-0.5">SIMULATED MATCHING</span>
              </div>
           </div>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
               <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Simulated Balance</div>
               <div className="text-3xl font-bold font-sans">${(balance + totalUnrealizedPnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
             </div>
             <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
               <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Unrealized PnL</div>
               <div className={clsx("text-3xl font-bold font-sans", totalUnrealizedPnl >= 0 ? "text-[#FCD535]" : "text-red-500")}>
                  {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </div>
             </div>
             <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
               <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Open Positions</div>
               <div className="text-3xl font-bold font-sans text-blue-400">{positions.length}</div>
             </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl flex-1 flex flex-col overflow-hidden min-h-[300px]">
             <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0B0E11]/40">
                <h3 className="text-sm font-bold text-gray-300">Active Agent Positions</h3>
             </div>
             <div className="flex-1 overflow-y-auto overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[700px]">
                   <thead className="bg-[#0A0C14] sticky top-0 z-10 border-b border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                      <tr>
                         <th className="p-4 font-normal text-gray-500 uppercase">Agent</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Pair</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Side</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Size</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Avg Entry</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Mark</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">PnL (ROE)</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {positions.map(p => (
                         <tr key={p.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-bold text-gray-300 capitalize">{p.agentId}</td>
                            <td className="p-4 font-bold">{p.symbol}</td>
                            <td className="p-4">
                               <span className={clsx("px-2 py-1 rounded text-[10px] font-bold", p.side === 'LONG' ? "bg-[#FCD535]/20 text-[#FCD535]" : "bg-red-500/20 text-red-500")}>
                                {p.side} {p.leverage}x
                               </span>
                            </td>
                            <td className="p-4 text-gray-400">{p.size.toFixed(4)}</td>
                            <td className="p-4 font-sans">${p.entryPrice.toFixed(2)}</td>
                            <td className="p-4 font-sans">${p.markPrice.toFixed(2)}</td>
                            <td className={clsx("p-4 font-bold font-sans", p.pnl >= 0 ? "text-[#FCD535]" : "text-red-500")}>
                               {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)} ({p.pnlPercent.toFixed(2)}%)
                            </td>
                            <td className="p-4">
                               <button 
                                 onClick={() => closePosition(p.id, prices[p.symbol])}
                                 className="px-3 py-1.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded text-[10px] transition-colors"
                               >
                                 MARKET CLOSE
                               </button>
                            </td>
                         </tr>
                      ))}
                      {positions.length === 0 && (
                         <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-500 italic">No active positions tracked by Execution Engine. Waiting for agent signals.</td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl flex-1 flex flex-col overflow-hidden min-h-[250px]">
             <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0B0E11]/40">
                <h3 className="text-sm font-bold text-gray-300">Execution History (Closed Trades)</h3>
             </div>
             <div className="flex-1 overflow-y-auto overflow-x-auto">
                <table className="w-full text-xs text-left opacity-70 hover:opacity-100 transition-opacity min-w-[600px]">
                   <thead className="bg-[#0A0C14] sticky top-0 z-10 border-b border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                      <tr>
                         <th className="p-4 font-normal text-gray-500 uppercase">Agent</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Pair</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Side</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Entry</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Exit</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">PnL</th>
                         <th className="p-4 font-normal text-gray-500 uppercase">Time Open</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {history.map(p => (
                         <tr key={p.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-gray-400 capitalize">{p.agentId}</td>
                            <td className="p-4 text-gray-300">{p.symbol}</td>
                            <td className="p-4">
                               <span className={clsx(p.side === 'LONG' ? "text-[#FCD535]" : "text-red-500")}>
                                {p.side}
                               </span>
                            </td>
                            <td className="p-4 font-sans text-gray-400">${p.entryPrice.toFixed(2)}</td>
                            <td className="p-4 font-sans text-gray-400">${p.markPrice.toFixed(2)}</td>
                            <td className={clsx("p-4 font-bold font-sans", p.pnl >= 0 ? "text-[#FCD535]" : "text-red-500")}>
                               {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                            </td>
                            <td className="p-4 text-gray-500 font-sans">
                               {Math.max(1, Math.floor((Date.now() - p.openedAt) / 1000))}s
                            </td>
                         </tr>
                      ))}
                      {history.length === 0 && (
                         <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-500 italic">No closed trades in this session.</td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </div>
  );
}
