const fs = require('fs');
const filePath = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Mobile Menu Toggle Button
content = content.replace(
  /{mobileMenuOpen \? <X className="w-5 h-5" \/> : <Menu className="w-5 h-5" \/>}/g,
  '{/* Mobile menu removed in favor of BottomNav */}'
);

// 2. Remove the Dropdown Menu (roughly)
const mobileDropdownRegex = /{\/\* Menú Móvil Desplegable Estilo Apple \*\/}[\s\S]*?(?=<\/header>)/;
content = content.replace(mobileDropdownRegex, '');

// 3. Clean up the Tools Popover (remove dictation and quoter buttons from popover to reduce clutter)
const dictationButtonRegex = /<button[\s\S]*?setActiveTab\('dictation_ai'\)[\s\S]*?<\/button>/;
const quoterButtonRegex = /<button[\s\S]*?setActiveTab\(activeTab === 'quoter' \? 'portal' : 'quoter'\)[\s\S]*?<\/button>/;
const widgetsToggleButtonRegex = /<button[\s\S]*?setShowWidgetsHub\(!showWidgetsHub\)[\s\S]*?<\/button>/;

content = content.replace(dictationButtonRegex, '');
content = content.replace(quoterButtonRegex, '');
content = content.replace(widgetsToggleButtonRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned up Dashboard.tsx');
