const fs = require('fs');
const glob = require('glob'); // wait I'll just hardcode paths since we don't have glob 

const files = [
  'src/components/AdminPanel.tsx',
  'src/components/ControlPlane.tsx',
  'src/components/QuantDashboard.tsx',
  'src/components/SignalEngine.tsx',
  'src/components/ExecutionBridge.tsx',
  'src/components/PortfolioPanel.tsx',
  'src/components/AgentOperatingDesk.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content
      .replace(/green:\s*"#[0-9a-fA-F]+"/g, 'green: "#06F7C9"')
      .replace(/purple:\s*"#[0-9a-fA-F]+"/g, 'purple: "#C026D3"')
      .replace(/#00C8A0/gi, '#06F7C9')
      .replace(/#00DF9A/gi, '#06F7C9')
      .replace(/#00FFB2/gi, '#06F7C9')
      .replace(/#A78BFA/gi, '#C026D3')
      .replace(/#8B5CF6/gi, '#C026D3');
    fs.writeFileSync(file, content);
  }
}
console.log('UI colors updated');
