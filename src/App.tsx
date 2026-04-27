import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav, MobileMenuDrawer } from './components/layout/BottomNav';
import { EnterpriseHeader } from './components/layout/EnterpriseHeader';
import { NotificationCopilot } from './components/NotificationCopilot';
import ControlPlane from './components/ControlPlane';
import AgentPanel from './components/AgentPanel';
import SignalEngine from './components/SignalEngine';
import ExecutionBridge from './components/ExecutionBridge';
import PortfolioPanel from './components/PortfolioPanel';
import QuantDashboard from './components/QuantDashboard';
import AdminPanel from './components/AdminPanel';
import AgentOperatingDesk from './components/AgentOperatingDesk';

export default function App() {
  const [currentTab, setTab] = useState('patrol');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  // Mock global audit data to satisfy EnterpriseHeader/Dashboard requirements
  const mockAudit = {
    market: {
      BTC: { price: 65400, change: 2.3, vol: '1.2B' },
      ETH: { price: 3400, change: -1.2, vol: '500M' },
      SOL: { price: 145, change: 5.4, vol: '300M' }
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveAgentId(null);
    setTab(tab);
  };

  const renderContent = () => {
    if (activeAgentId) {
      return (
        <AgentOperatingDesk 
          agentId={activeAgentId} 
          onBack={() => setActiveAgentId(null)} 
        />
      );
    }

    switch(currentTab) {
      case 'patrol': return <ControlPlane auditData={mockAudit} />;
      case 'laboratory': return <QuantDashboard />;
      case 'agents': return <AgentPanel />;
      case 'signals': return <SignalEngine />;
      case 'bridge': return <ExecutionBridge />;
      case 'trading': return <AdminPanel forceSection="trading" onSelectAgent={(id) => setActiveAgentId(id)} />;
      case 'risk': return <AdminPanel forceSection="risk" onSelectAgent={(id) => setActiveAgentId(id)} />;
      case 'portfolio': return <PortfolioPanel />;
      case 'admin': return <AdminPanel onSelectAgent={(id) => setActiveAgentId(id)} />;
      default: return <ControlPlane auditData={mockAudit} />;
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#050505] text-gray-200 overflow-hidden font-sans">
      <div className="hidden md:flex">
         <Sidebar currentTab={currentTab} setTab={handleTabChange} />
      </div>
      
      <div className="flex flex-col flex-1 relative w-full h-[100dvh] overflow-hidden">
        <EnterpriseHeader audit={mockAudit} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide pb-[70px] md:pb-0">
          {renderContent()}
        </main>
        
        <NotificationCopilot />

        <div className="md:hidden absolute bottom-0 left-0 w-full z-50">
          <BottomNav 
            currentTab={currentTab} 
            setTab={handleTabChange} 
            onMenuClick={() => setMenuOpen(true)} 
          />
        </div>
        
        <MobileMenuDrawer 
          isOpen={isMenuOpen} 
          onClose={() => setMenuOpen(false)} 
          setTab={handleTabChange} 
        />
      </div>
    </div>
  );
}
