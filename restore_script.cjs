const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/Dashboard.tsx',
  'src/components/QuickAccessWidgetsHub.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let restored = '';
    for (let i = 0; i < content.length; i += 2) {
      restored += content[i];
    }

    fs.writeFileSync(filePath, restored, 'utf8');
    console.log('Restored ' + file);
  }
});
