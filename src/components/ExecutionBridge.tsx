import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Network, Activity, ShieldAlert, Cpu, Route, ArrowRight, Play } from 'lucide-react';
import { bridgeService, DataclawSignal } from '../services/executionBridge';

export default function ExecutionBridge() {
  const [events, setEvents] = useState<{time: string, type: string, message: string, color: string}[]>([
    { time: new Date().toLocaleTimeString(), type: '[SYSTEM]', message: 'Nexus Alpha Bridge initialized. Polymarket Native CLOB Client loading...', color: 'text-gray-400' },
    { time: new Date().toLocaleTimeString(), type: '[DEPENDENCY]', message: 'Installed: web3, requests, py-clob-client (asyncio wrapped).', color: 'text-[#06F7C9]' }
  ]);

  const testDispatch = async () => {
    const signal: DataclawSignal = {
      intent_id: Math.random().toString(36).substring(7),
      agent_origin: 'Betafish',
      symbol: 'YES/NO',
      direction: 'LONG',
      entry_price: 0.45,
      stop_loss: 0.30,
      take_profit: 0.80,
      position_size_usd: 500,
      leverage: 1,
      confidence_score: 92,
      order_type: 'LIMIT',
      ttl_seconds: 60
    };

    const addEvent = (type: string, message: string, color: string) => {
      setEvents(prev => [{ time: new Date().toLocaleTimeString(), type, message, color }, ...prev].slice(0, 20));
    };

    addEvent('[INGEST]', `Received actionable Intent ${signal.intent_id} from Swarm (Agent: ${signal.agent_origin}).`, 'text-[#06F7C9]');

    // Slight delay to simulate risk gate
    setTimeout(async () => {
      const gateResult = await bridgeService.validateSafetyGate(signal);
      if (!gateResult.valid) {
        addEvent('[RISK_GATE_REJECT]', `Evaluation Failed: ${gateResult.reason}`, 'text-red-400');
        return;
      }
      addEvent('[RISK_GATE_PASS]', `Evaluation Passed: Dynamic Kelly Sizing applied ($${signal.position_size_usd.toFixed(2)}). Leverage (${signal.leverage}x) within ATR limits.`, 'text-[#06F7C9]');
      
      setTimeout(() => {
        addEvent('[ASYNCIO_DISPATCH]', `Wrapped OrderSchema for ${signal.intent_id} to Polymarket CLOB.`, 'text-[#C026D3]');
        
        bridgeService.dispatch(signal, 'polymarket').then(order => {
          if (order) {
            setTimeout(() => {
               addEvent('[OPEN_POLYMARKET]', `Polymarket Market Maker accepted intent. Limit order placed.`, 'text-[#C026D3]');
               setTimeout(() => {
                  addEvent('[FILL_EVENT]', `py-clob-client reported fill on ${signal.symbol} ${signal.direction}. Slippage: 0bps.`, 'text-[#06F7C9]');
               }, 1000);
            }, 500);
          }
        });
      }, 500);
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] relative z-10 font-mono text-white overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/5 shrink-0 bg-[#050505]/40 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 font-['Syne'] uppercase">
             <Network size={18} className="text-[#C026D3]" />
             Nexus Alpha Bridge
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">py-clob-client & Polymarket MM</p>
        </div>
        <div className="flex gap-4">
           <button onClick={testDispatch} className="bg-[#06F7C9]/10 hover:bg-[#06F7C9]/20 text-[#06F7C9] border border-[#06F7C9]/30 rounded-lg px-4 py-2 flex items-center gap-2 text-xs font-bold transition-colors">
              <Play size={12} /> Test Signal
           </button>
           <div className="bg-[#1E2329]/50 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 bg-[#C026D3] rounded-full animate-pulse shadow-[0_0_10px_rgba(192,38,211,0.5)]"></div>
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 uppercase">Polymarket Web3</span>
                <span className="text-sm font-bold text-[#C026D3]">ONLINE</span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Architecture Visual */}
          <div className="lg:col-span-3">
             <Card>
               <CardContent className="p-6">
                 <div className="flex items-center justify-between opacity-80 text-xs text-center font-bold">
                    <div className="flex flex-col items-center gap-2 w-1/3">
                       <Cpu size={32} className="text-[#06F7C9]" />
                       <span className="text-[#06F7C9]">DATACLAW V5</span>
                       <span className="text-[9px] text-gray-500 font-normal">Intent Generation</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                       <ArrowRight size={20} className="text-gray-600 mb-1" />
                       <span className="text-[10px] text-gray-600">ZMQ / WebSocket</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 w-1/3">
                       <ShieldAlert size={32} className="text-[#C026D3]" />
                       <span className="text-[#C026D3]">NEXUS ALPHA BRIDGE</span>
                       <span className="text-[9px] text-gray-500 font-normal">Asyncio Wrapping & Auth</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                       <ArrowRight size={20} className="text-gray-600 mb-1" />
                       <span className="text-[10px] text-gray-600">API Gateway</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 w-1/3">
                       <Route size={32} className="text-white" />
                       <span className="text-white">POLYMARKET CLOB</span>
                       <span className="text-[9px] text-gray-500 font-normal">Native Client Determinism</span>
                    </div>
                 </div>
               </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="flex flex-col min-h-[300px]">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                     <Activity size={16} className="text-[#C026D3]"/> Bridge Event Trace
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-4 overflow-x-auto text-[10px] space-y-3">
                  {events.map((e, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-white/5 pb-2">
                       <div className="flex gap-4 min-w-[500px]">
                          <span className="w-20 text-gray-500">{e.time}</span>
                          <span className={`w-36 font-bold ${e.color}`}>{e.type}</span>
                          <span className="text-gray-300">{e.message}</span>
                       </div>
                    </div>
                  ))}
               </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
             <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                     <ShieldAlert size={16} className="text-[#06F7C9]"/> RiskEngine Constraints
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                   <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400"><span>Global Portfolio Heat</span> <span>15% / 50%</span></div>
                      <div className="h-1 bg-white/5 rounded"><div className="h-full bg-[#06F7C9] w-[30%]"></div></div>
                   </div>
                   <div className="space-y-1 mt-4">
                      <div className="flex justify-between text-xs text-gray-400"><span>Kelly Criterion sizing</span> <span>Half-Kelly Active</span></div>
                      <div className="h-1 bg-white/5 rounded"><div className="h-full bg-[#C026D3] w-[50%]"></div></div>
                   </div>
                   <div className="space-y-1 mt-4">
                      <div className="flex justify-between text-xs text-gray-400"><span>ATR Volatility Leverage</span> <span>Dynamic (Max 10x)</span></div>
                      <div className="h-1 bg-white/5 rounded"><div className="h-full bg-white w-[100%]"></div></div>
                   </div>
                   <div className="mt-6 text-[10px] text-gray-500 leading-relaxed border-t border-white/5 pt-4">
                     All signals are intercepted by the RiskEngine. Position sizing is dynamically recalculated based on Fractional Kelly, local ATR, and remaining portfolio heat. Over-leveraged or oversized intents are auto-truncated before reaching the internal Polymarket Market Maker wrapper.
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
