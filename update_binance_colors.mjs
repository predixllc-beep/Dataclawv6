import fs from 'fs';
import path from 'path';

const files = [
  'src/components/AdminPanel.tsx',
  'src/components/ControlPlane.tsx',
  'src/components/QuantDashboard.tsx',
  'src/components/SignalEngine.tsx',
  'src/components/ExecutionBridge.tsx',
  'src/components/PortfolioPanel.tsx',
  'src/components/AgentOperatingDesk.tsx',
  'src/components/AgentPanel.tsx',
  'src/components/NotificationCopilot.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/BottomNav.tsx',
  'src/components/layout/EnterpriseHeader.tsx',
  'src/App.tsx'
];

for(const file of files) {
  if (fs.existsSync(file)) {
    let d = fs.readFileSync(file, 'utf-8');
    
    // Backgrounds
    d = d.replace(/#0F0F12/g, '#181A20');
    d = d.replace(/#08080A/g, '#0B0E11');
    d = d.replace(/#141418/g, '#1E2329');
    d = d.replace(/#121216/g, '#1E2329');
    d = d.replace(/bg-black/g, 'bg-[#0B0E11]');
    
    // Tokens
    d = d.replace(/#06F7C9/gi, '#FCD535');
    d = d.replace(/#C026D3/gi, '#8B5CF6'); // Onyx was purple
    d = d.replace(/#38BDF8/gi, '#38BDF8'); // Keep Mirofish blue
    d = d.replace(/#FF4D6D/gi, '#F6465D'); // Down
    d = d.replace(/#00C8A0/gi, '#0ECB81'); // Up
    d = d.replace(/#00DF9A/gi, '#0ECB81');

    d = d.replace(/text-\[#FCD535\]/g, 'text-[#FCD535]'); 
    d = d.replace(/border-\[#FCD535\]/g, 'border-[#FCD535]');
    d = d.replace(/bg-\[#FCD535\]/g, 'bg-[#FCD535]');

    fs.writeFileSync(file, d);
  }
}
console.log("Colors Updated");
