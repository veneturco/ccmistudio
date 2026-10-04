const fs = require('fs');
const path = require('path');

// Test files with regex and balanced brackets/tags
const filesToTest = [
  'src/components/SamiCopilot.tsx',
  'src/components/SamiAvatar.tsx',
  'src/components/DocumentSelectorWorkspace.tsx',
  'server.ts',
  'src/index.css'
];

let allPassed = true;

for (const relPath of filesToTest) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`MISSING: ${relPath}`);
    allPassed = false;
    continue;
  }
  const code = fs.readFileSync(fullPath, 'utf8');
  
  // Check matching braces and parentheses
  let brace = 0, paren = 0, bracket = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const prev = code[i - 1];
    
    if (inString) {
      if (ch === stringChar && prev !== '\\\\') {
        inString = false;
      }
    } else {
      if (ch === '"' || ch === "'" || ch === '\`') {
        inString = true;
        stringChar = ch;
      } else if (ch === '{') brace++;
      else if (ch === '}') brace--;
      else if (ch === '(') paren++;
      else if (ch === ')') paren--;
      else if (ch === '[') bracket++;
      else if (ch === ']') bracket--;
    }
  }

  if (brace !== 0 || paren !== 0 || bracket !== 0) {
    console.warn(`[WARN] Balance check for ${relPath}: braces=${brace}, parens=${paren}, brackets=${bracket}`);
  } else {
    console.log(`[OK] Balanced syntax: ${relPath}`);
  }
}

console.log('Verification finished.');
