import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Network, Activity, ShieldAlert, Cpu, Route, ArrowRight, Play } from 'lucide-react';
import { bridgeService, DataclawSignal } from '../services/executionBridge';

export default function ExecutionBridge() {
  const [events, setEvents] = useState<{time: string, type: string, message: string, color: string}[]>([
    { time: new Date().toLocaleTimeString(), type: '[SYSTEM]', message: 'Bridge initialized and ready.', color: 'text-gray-400' }
  ]);

  const testDispatch = async () => {
    const signal: DataclawSignal = {
      intent_id: Math.random().toString(36).substring(7),
      agent_origin: 'Betafish',
      symbol: 'BTC/USDT',
      direction: 'LONG',
      entry_price: 64500,
      stop_loss: 62000,
      take_profit: 68000,
      position_size_usd: 50000,
      leverage: 5,
      confidence_score: 92,
      order_type: 'LIMIT',
      ttl_seconds: 60
    };

    const addEvent = (type: string, message: string, color: string) => {
      setEvents(prev => [{ time: new Date().toLocaleTimeString(), type, message, color }, ...prev].slice(0, 20));
    };

    addEvent('[INGEST]', `Received actionable Intent ${signal.intent_id} from Swarm (Agent: ${signal.agent_origin}).`, 'text-emerald-400');

    // Slight delay to simulate risk gate
    setTimeout(async () => {
      const gateResult = await bridgeService.validateSafetyGate(signal);
      if (!gateResult.valid) {
        addEvent('[RISK_GATE_REJECT]', `Evaluation Failed: ${gateResult.reason}`, 'text-red-400');
        return;
      }
      addEvent('[RISK_GATE_PASS]', `Evaluation Passed: Sizing within Kelly limit. Leverage (${signal.leverage}x) approved.`, 'text-blue-400');
      
      setTimeout(() => {
        addEvent('[DISPATCH]', `Sent formatted OrderSchema for ${signal.intent_id} to Hummingbot Gateway API.`, 'text-amber-400');
        
        bridgeService.dispatch(signal, 'binance').then(order => {
          if (order) {
            setTimeout(() => {
               addEvent('[OPEN]', `Hummingbot accepted intent. Order placed on Orderbook.`, 'text-purple-400');
               setTimeout(() => {
                  addEvent('[FILL_EVENT]', `Hummingbot reported fill on ${signal.symbol} ${signal.direction}. Slippage: 1.2bps.`, 'text-[#00FFB2]');
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
      <div className="p-4 md:p-6 border-b border-white/5 shrink-0 bg-black/40 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 font-['Syne'] uppercase">
            <Network size={18} className="text-blue-400" />
            Execution Bridge
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">AI to Hummingbot Routing & Risk Gate</p>
        </div>
        <div className="flex gap-4">
           <button onClick={testDispatch} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg px-4 py-2 flex items-center gap-2 text-xs font-bold transition-colors">
              <Play size={12} /> Test Signal
           </button>
           <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 uppercase">Hummingbot Link</span>
                <span className="text-sm font-bold text-emerald-400">ONLINE</span>
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
                       <Cpu size={32} className="text-[#00FFB2]" />
                       <span className="text-[#00FFB2]">DATACLAW AI</span>
                       <span className="text-[9px] text-gray-500 font-normal">Intent Generation</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                       <ArrowRight size={20} className="text-gray-600 mb-1" />
                       <span className="text-[10px] text-gray-600">ZMQ / WebSocket</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 w-1/3">
                       <ShieldAlert size={32} className="text-blue-400" />
                       <span className="text-blue-400">EXECUTION BRIDGE</span>
                       <span className="text-[9px] text-gray-500 font-normal">Risk Gate & Transforming</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                       <ArrowRight size={20} className="text-gray-600 mb-1" />
                       <span className="text-[10px] text-gray-600">Gateway API</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 w-1/3">
                       <Route size={32} className="text-amber-400" />
                       <span className="text-amber-400">HUMMINGBOT</span>
                       <span className="text-[9px] text-gray-500 font-normal">Exchange Determinism</span>
                    </div>
                 </div>
               </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="flex flex-col min-h-[300px]">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                     <Activity size={16} className="text-blue-400"/> Bridge Event Trace
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
                     <ShieldAlert size={16} className="text-amber-400"/> PolicyGuard Constraints
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                   <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400"><span>Global Heat Limit</span> <span>10%</span></div>
                      <div className="h-1 bg-white/5 rounded"><div className="h-full bg-emerald-400 w-[10%]"></div></div>
                   </div>
                   <div className="space-y-1 mt-4">
                      <div className="flex justify-between text-xs text-gray-400"><span>Max Position Size</span> <span>2.5% Equity</span></div>
                      <div className="h-1 bg-white/5 rounded"><div className="h-full bg-blue-400 w-[25%]"></div></div>
                   </div>
                   <div className="space-y-1 mt-4">
                      <div className="flex justify-between text-xs text-gray-400"><span>Max Soft Leverage</span> <span>10x</span></div>
                      <div className="h-1 bg-white/5 rounded"><div className="h-full bg-amber-400 w-[100%]"></div></div>
                   </div>
                   <div className="mt-6 text-[10px] text-gray-500 leading-relaxed border-t border-white/5 pt-4">
                     Any signal violating these parameters will be immediately rejected at the Bridge without querying the Hummingbot Engine.
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
