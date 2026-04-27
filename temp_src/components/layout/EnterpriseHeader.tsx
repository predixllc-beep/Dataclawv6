import React, { useEffect, useState } from 'react';
import { Activity, Power, Wifi, Cpu, Fingerprint } from 'lucide-react';
import { usePersistentStore } from '../../state/persistentStore';
import { clsx } from 'clsx';

const formatP = (n: number) => n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

export function EnterpriseHeader({ audit }: { audit: any }) {
  const [time, setTime] = useState(new Date().toISOString());
  const { mode, activeExchange, killSwitchEngaged } = usePersistentStore();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toISOString()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-14 bg-black/80 backdrop-blur-md border-b border-[#1a1a1a] flex items-center justify-between px-4 shrink-0 font-mono relative z-20">
      
      {/* Ticker Tape */}
      <div className="flex bg-[#0a0a0c] border border-white/5 rounded-lg px-3 h-8 items-center overflow-hidden flex-1 max-w-2xl mr-4">
        <div className="flex gap-6 animate-pulse-slow overflow-x-auto no-scrollbar whitespace-nowrap">
          {Object.entries(audit.market).map(([sym, d]: [string, any]) => {
            const isUp = d.change >= 0;
            return (
              <div key={sym} className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-500 font-semibold">{sym}</span>
                <span className="text-white">${formatP(d.price)}</span>
                <span className={clsx("font-bold", isUp ? "text-[#00FFB2]" : "text-[#FF4D6D]")}>
                  {isUp ? "+" : ""}{d.change.toFixed(2)}%
                </span>
                <span className="text-gray-700 ml-1">vol:{d.vol}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-2 text-gray-500">
           <Fingerprint size={12} />
           <span>{time.split('T')[1].split('.')[0]} UTC</span>
        </div>
        
        <div className="w-px h-4 bg-[#1a1a1a]" />
        
        <div className="flex items-center gap-2 text-gray-500">
           <Cpu size={12} className={killSwitchEngaged ? "text-red-500" : "text-[#00FFB2]"} />
           <span>CORE: {killSwitchEngaged ? 'HALTED' : 'SYNCED'}</span>
        </div>

        <div className="w-px h-4 bg-[#1a1a1a]" />

        <div className="flex items-center gap-2">
           <Wifi size={12} className={mode === 'live' ? "text-[#00FFB2]" : "text-amber-500"} />
           <span className={mode === 'live' ? "text-[#00FFB2]" : "text-amber-500"}>ENV: {mode.toUpperCase()}</span>
           <span className="text-gray-500">[{activeExchange.toUpperCase()}]</span>
        </div>
      </div>
    </div>
  );
}
