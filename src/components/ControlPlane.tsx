import React, { useState, useEffect, useRef } from 'react';
import { usePersistentStore } from '../state/persistentStore';
import { Send, Terminal, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export default function ControlPlane({ auditData }: { auditData?: any }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'nexus',
      text: 'SYSTEM BOOT SEQUENCE COMPLETE. Patron connected. Multi-exchange routing (Binance, Bybit) initialized. Awaiting commands.',
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), sender: 'patron', text: input, time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      let reply = "Affirmative. Executing scan.";
      if (input.toLowerCase().includes('status')) {
        reply = "System is nominal. Signal Hunter and Strategy agents are in standby. Active exchanges: Binance, Bybit. Mode: SIMULATE.";
      } else if (input.toLowerCase().includes('report')) {
        reply = "Core modules OK. CrewAI agent status: Waiting for tasks. Pre-flight complete.";
      }
      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'nexus', text: reply, time: new Date().toLocaleTimeString() }]);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] relative z-10">
      <div className="p-4 md:p-6 border-b border-white/5 shrink-0 bg-[#050505]/40 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Syne']">
            <Terminal size={18} className="text-[#06F7C9]" />
            Control Plane
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">High Level Orchestration & Patron Chat</p>
        </div>
        <div className="flex gap-4">
           {/* Summary Stats */}
           <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex flex-col items-end">
              <span className="text-[9px] text-gray-400 font-mono uppercase">Active Agents</span>
              <span className="text-sm font-bold text-[#06F7C9]">4</span>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex flex-col items-end">
              <span className="text-[9px] text-gray-400 font-mono uppercase">System Load</span>
              <span className="text-sm font-bold text-[#06F7C9]">12%</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-0 lg:gap-6 p-0 lg:p-6">
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/5 border-y lg:border border-white/10 lg:rounded-xl overflow-hidden relative min-h-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,178,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,178,0.01)_1px,transparent_1px)] bg-[size:10px_10px]" />
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 relative z-10 scroll-smooth">
            {messages.map((m) => (
              <div key={m.id} className={clsx(
                "flex flex-col max-w-[90%] md:max-w-[80%] font-mono text-xs",
                m.sender === 'patron' ? "self-end items-end" : "self-start items-start"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx(
                    "text-[9px] font-bold tracking-wider",
                    m.sender === 'patron' ? "text-[#06F7C9]" : "text-gray-400"
                  )}>
                    {m.sender === 'patron' ? 'PATRON' : 'NEXUS.SUPERVISOR'}
                  </span>
                  <span className="text-[9px] text-gray-600">{m.time}</span>
                </div>
                <div className={clsx(
                  "px-4 py-3 rounded-lg leading-relaxed shadow-sm",
                  m.sender === 'patron' 
                    ? "bg-[#06F7C9]/10 border border-[#06F7C9]/20 text-[#e0e0e0]" 
                    : "bg-[#050505]/50 border border-white/10 text-gray-300"
                )}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatRef} className="h-1 shrink-0" />
          </div>

          <div className="p-4 bg-[#050505]/60 border-t border-white/10 relative z-10 pb-20 md:pb-4">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Give command to Nexus..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-white outline-none focus:border-[#06F7C9]/50 transition-colors"
              />
              <button 
                onClick={handleSend}
                className="bg-[#06F7C9]/10 hover:bg-[#06F7C9]/20 border border-[#06F7C9]/30 text-[#06F7C9] w-12 rounded-lg flex items-center justify-center transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* System Overview Side Panel */}
        <div className="hidden lg:flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
           {/* Supervisor Agent Status */}
           <div className="bg-white/5 border border-white/10 rounded-xl p-5">
             <h3 className="text-xs font-bold font-mono text-gray-400 uppercase mb-4 tracking-wider">Hierarchy Supervisor</h3>
             
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-full border border-[#06F7C9]/30 bg-[#06F7C9]/10 flex items-center justify-center">
                 <Terminal size={20} className="text-[#06F7C9]" />
               </div>
               <div>
                  <div className="text-sm font-bold">NEXUS PRIME</div>
                  <div className="text-[10px] text-[#06F7C9]">STATUS: IDLE</div>
               </div>
             </div>

             <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between items-center bg-[#050505]/30 p-2 rounded">
                  <span className="text-gray-500">Current Task</span>
                  <span className="text-gray-300">Monitoring Patrol</span>
                </div>
                <div className="flex justify-between items-center bg-[#050505]/30 p-2 rounded">
                  <span className="text-gray-500">Sub-Agents</span>
                  <span className="text-[#06F7C9]">4 Online</span>
                </div>
                <div className="flex justify-between items-center bg-[#050505]/30 p-2 rounded">
                  <span className="text-gray-500">Model</span>
                  <span className="text-gray-300 truncate max-w-[100px]">gpt-4-turbo</span>
                </div>
             </div>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-xl flex-1 p-5 flex flex-col">
              <h3 className="text-xs font-bold font-mono text-gray-400 uppercase mb-4 tracking-wider">Active Patrol</h3>
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 relative">
                 <div className="w-24 h-24 rounded-full border border-dashed border-[#06F7C9]/50 animate-[spin_10s_linear_infinite]" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={24} className="text-[#06F7C9] animate-pulse" />
                 </div>
              </div>
              <p className="text-center font-mono text-[9px] text-gray-500 mt-4 leading-relaxed">
                Supervisor is actively monitoring incoming market data and evaluating risk limits over 2 active exchanges.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}
