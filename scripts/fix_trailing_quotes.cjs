const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// Fix the trailing quote after backtick
content = content.replace(/\`\}"\>/g, '`}>');

fs.writeFileSync(dashPath, content);
console.log('Fixed trailing quotes.');
