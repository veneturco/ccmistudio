const fs = require('fs');
let c = fs.readFileSync('src/components/DocumentSelectorWorkspace.tsx', 'utf8');

c = c.replace(/'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-950\/40'/g, "'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-white/20 scale-105 z-10'");
c = c.replace(/'text-slate-400 hover:text-slate-200 hover:bg-slate-800\/60'/g, "'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 hover:shadow-[0_0_10px_rgba(6,182,212,0.15)]'");

fs.writeFileSync('src/components/DocumentSelectorWorkspace.tsx', c);
console.log("Updated DocumentSelectorWorkspace buttons");