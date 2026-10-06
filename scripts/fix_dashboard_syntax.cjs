const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// Fix escaped quotes
content = content.replace(/\\'/g, "'");

// Fix bimodalMode broken classNames
// Currently: className={`grid ${bimodalMode === 'consulta' ? '' : 'hidden'}` grid-cols-1 lg:grid-cols-12 gap-4 items-center">
content = content.replace(/className=\{`grid \$\{bimodalMode === 'consulta' \? '' : 'hidden'\}` grid-cols-1/g, 
  "className={`grid ${bimodalMode === 'consulta' ? '' : 'hidden'} grid-cols-1");

content = content.replace(/className=\{`grid \$\{bimodalMode === 'quirofano' \? '' : 'hidden'\}` grid-cols-1/g, 
  "className={`grid ${bimodalMode === 'quirofano' ? '' : 'hidden'} grid-cols-1");

// Make sure other trailing quotes are fixed, if there are any lingering string closes.
// e.g. items-center"> -> items-center`} >
content = content.replace(/className=\{`grid \$\{bimodalMode === 'consulta' \? '' : 'hidden'\} grid-cols-1 lg:grid-cols-12 gap-4 items-center">/g, 
  "className={`grid ${bimodalMode === 'consulta' ? '' : 'hidden'} grid-cols-1 lg:grid-cols-12 gap-4 items-center`}>");

content = content.replace(/className=\{`grid \$\{bimodalMode === 'quirofano' \? '' : 'hidden'\} grid-cols-1 lg:grid-cols-12 gap-4 items-center">/g, 
  "className={`grid ${bimodalMode === 'quirofano' ? '' : 'hidden'} grid-cols-1 lg:grid-cols-12 gap-4 items-center`}>");

fs.writeFileSync(dashPath, content);
console.log('Fixed JSX syntax errors.');
