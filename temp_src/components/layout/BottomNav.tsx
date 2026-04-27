import React from 'react';
import { TerminalSquare, Activity, BrainCircuit, Menu, Network, Wallet, Settings, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

const MAIN_TABS = [
  { id: 'patrol', icon: TerminalSquare, label: 'Chat' },
  { id: 'signals', icon: Activity, label: 'Signals' },
  { id: 'bridge', icon: Network, label: 'Bridge' },
  { id: 'agents', icon: BrainCircuit, label: 'Agents' },
];

export function BottomNav({ 
  currentTab, 
  setTab,
  onMenuClick 
}: { 
  currentTab: string, 
  setTab: (t: string) => void,
  onMenuClick: () => void 
}) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 z-50 px-2 pb-safe">
      <div className="flex items-center justify-around h-16">
        {MAIN_TABS.map((item) => {
          const active = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                active ? "text-[#00FFB2]" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon size={20} className={active ? "drop-shadow-[0_0_8px_rgba(0,255,178,0.5)]" : ""} />
              <span className="text-[10px] font-mono font-medium tracking-wide">{item.label}</span>
            </button>
          )
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-gray-500 transition-colors"
        >
          <Menu size={20} />
          <span className="text-[10px] font-mono font-medium tracking-wide">Menu</span>
        </button>
      </div>
    </div>
  );
}

export function MobileMenuDrawer({ 
  isOpen, 
  onClose, 
  setTab 
}: { 
  isOpen: boolean, 
  onClose: () => void,
  setTab: (t: string) => void 
}) {
  if (!isOpen) return null;

  const handleSelect = (tabId: string) => {
    setTab(tabId);
    onClose();
  };

  return (
    <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#0a0a0a] border-t border-white/10 rounded-t-2xl p-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-200">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
        
        <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Systems & Settings</h3>
        
        <button onClick={() => handleSelect('trading')} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl text-left border border-white/5 active:bg-white/10">
          <Network size={20} className="text-blue-400" />
          <div className="flex flex-col font-mono">
            <span className="text-sm text-white font-bold">Execution</span>
            <span className="text-[10px] text-gray-400">Exchanges & API</span>
          </div>
        </button>

        <button onClick={() => handleSelect('risk')} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl text-left border border-white/5 active:bg-white/10">
          <ShieldAlert size={20} className="text-red-400" />
          <div className="flex flex-col font-mono">
            <span className="text-sm text-white font-bold">Risk Engine</span>
            <span className="text-[10px] text-gray-400">Limits & Governance</span>
          </div>
        </button>

        <button onClick={() => handleSelect('portfolio')} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl text-left border border-white/5 active:bg-white/10">
          <Wallet size={20} className="text-emerald-400" />
          <div className="flex flex-col font-mono">
            <span className="text-sm text-white font-bold">Portfolio</span>
            <span className="text-[10px] text-gray-400">Simulation Stats</span>
          </div>
        </button>

        <button onClick={() => handleSelect('admin')} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl text-left border border-white/5 active:bg-white/10 mb-8">
          <Settings size={20} className="text-amber-400" />
          <div className="flex flex-col font-mono">
            <span className="text-sm text-white font-bold">Global Admin</span>
            <span className="text-[10px] text-gray-400">All System Settings</span>
          </div>
        </button>
        
        {/* Fill extra padding for bottom nav space + safety */}
        <div className="h-4" />
      </div>
    </div>
  );
}
