import fs from 'fs';

const file = 'src/components/AdminPanel.tsx';
if (fs.existsSync(file)) {
  let d = fs.readFileSync(file, 'utf-8');

  // Fix horizontal scroll for NAV buttons
  d = d.replace(
    /className="flex flex-wrap border-b border-white\/5 bg-\[#0B0E11\]\/30 shrink-0 gap-1 p-2"/,
    'className="flex flex-nowrap overflow-x-auto border-b border-white/5 bg-[#0B0E11]/30 shrink-0 gap-1 p-2 scrollbar-none"'
  );

  d = d.replace(
    /<div style={{flex:1,overflowY:"auto",padding:"16px 16px"}}>/,
    '<div className="flex-1 overflow-y-auto p-4 pb-[80px] md:pb-4">'
  );

  fs.writeFileSync(file, d);
}
console.log('Fixed admin panel styling');
