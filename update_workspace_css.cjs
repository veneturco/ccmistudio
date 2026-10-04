const fs = require('fs');
let c = fs.readFileSync('src/components/DocumentSelectorWorkspace.tsx', 'utf8');

c = c.replace(/a4-responsive-container/g, 'a4-transform-wrapper');

fs.writeFileSync('src/components/DocumentSelectorWorkspace.tsx', c);
console.log("Updated Workspace");