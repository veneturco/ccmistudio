const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// Define processDictation
const target = `const showToast = (msg: string) => console.log("Toast:", msg);`;
const replacement = `const showToast = (msg: string) => console.log("Toast:", msg);\n  const processDictation = () => { console.log('Procesando dictado...'); setIsVoicePanelOpen(false); };`;

content = content.replace(target, replacement);

fs.writeFileSync(dashPath, content);
console.log('Defined processDictation.');
