import fs from 'fs';

const files = [
  'src/components/AgentPanel.tsx',
  'src/components/AgentOperatingDesk.tsx',
  'src/components/layout/BottomNav.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/EnterpriseHeader.tsx'
];

for(const file of files) {
  if (fs.existsSync(file)) {
    let d = fs.readFileSync(file, 'utf-8');
    
    // Replace hardcoded Hex colours
    d = d.replace(/#00FFB2/gi, '#FCD535');
    d = d.replace(/rgba\(0,255,178/gi, 'rgba(252,213,53'); 
    d = d.replace(/rgba\(0, 255, 178/gi, 'rgba(252, 213, 53'); 
    d = d.replace(/#FF4D6D/gi, '#F6465D');
    
    // Any remaining #06F7C9
    d = d.replace(/#06F7C9/gi, '#FCD535');

    fs.writeFileSync(file, d);
  }
}
console.log("Secondary Colors Updated");
