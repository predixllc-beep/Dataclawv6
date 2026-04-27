import React from 'react';
import { Network, Activity, BrainCircuit, Wallet, Settings, TerminalSquare, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { usePersistentStore } from '../../state/persistentStore';

const NAV_ITEMS = [
  { id: 'patrol', icon: TerminalSquare, label: 'Control Plane', subtitle: 'Patron Chat' },
  { id: 'laboratory', icon: Activity, label: 'Quant Lab', subtitle: 'Research Engine' },
  { id: 'agents', icon: BrainCircuit, label: 'Agent Center', subtitle: 'Deployment & Stats' },
  { id: 'signals', icon: Activity, label: 'Signal Engine', subtitle: 'Live Heatmap' },
  { id: 'bridge', icon: Network, label: 'Execution Bridge', subtitle: 'Hummingbot Adapter' },
  { id: 'trading', icon: Network, label: 'Execution', subtitle: 'Exchanges' },
  { id: 'portfolio', icon: Wallet, label: 'Simulation', subtitle: 'Paper Trading' },
  { id: 'admin', icon: Settings, label: 'Admin Vault', subtitle: 'Keys & System' },
];

export function Sidebar({ currentTab, setTab }: { currentTab: string, setTab: (t: string) => void }) {
  const killSwitchEngaged = usePersistentStore(s => s.killSwitchEngaged);
  const setKillSwitch = usePersistentStore(s => s.setKillSwitch);

  return (
    <div className="w-64 bg-black border-r border-[#1a1a1a] flex flex-col h-screen shrink-0 relative z-20">
      <div className="p-5 flex items-center gap-3 border-b border-[#1a1a1a]">
         <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00FFB2] to-[#006B4F] flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(0,255,178,0.3)]">
           N
         </div>
         <div className="flex flex-col">
           <span className="font-['Syne'] font-bold text-sm tracking-wide bg-gradient-to-r from-white to-[#00FFB2] bg-clip-text text-transparent">NEXUS O.S.</span>
           <span className="text-[10px] text-gray-500 font-mono">Institutional v4.0</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                "flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all duration-200 group font-mono",
                active ? "bg-[#00FFB2]/10 border border-[#00FFB2]/20" : "hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon size={18} className={active ? "text-[#00FFB2]" : "text-gray-500 group-hover:text-gray-300"} />
              <div className="flex flex-col flex-1">
                 <span className={clsx("text-xs font-semibold tracking-tight", active ? "text-[#00FFB2]" : "text-gray-300")}>{item.label}</span>
                 <span className="text-[9px] text-gray-500">{item.subtitle}</span>
              </div>
              {active && <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] shadow-[0_0_5px_#00FFB2]" />}
            </button>
          )
        })}
      </div>

      <div className="p-4 border-t border-[#1a1a1a] flex flex-col gap-3">
         <button 
           onClick={() => setKillSwitch(!killSwitchEngaged)}
           className={clsx(
             "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-mono text-xs font-bold transition-all border",
             killSwitchEngaged 
               ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
               : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
           )}
         >
           <ShieldAlert size={16} />
           {killSwitchEngaged ? 'SYSTEM HALTED' : 'ENGAGE KILL SWITCH'}
         </button>
      </div>
    </div>
  );
}
