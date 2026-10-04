const fs = require('fs');
let c = fs.readFileSync('src/components/SamiCopilot.tsx', 'utf8');

c = c.replace(/[\x80-\xFF]{2,}\.[\x80-\xFF]{2,}'[\x80-\xFF]{2,}\?/g, 'í');
c = c.replace(/[\x80-\xFF]{2,}n/g, 'ón');
c = c.replace(/[\x80-\xFF]{2,} /g, 'í ');
c = c.replace(/[\x80-\xFF]{2,}\?/g, '¿');
c = c.replace(/[\x80-\xFF]{2,}/g, '');

fs.writeFileSync('src/components/SamiCopilot.tsx', c);