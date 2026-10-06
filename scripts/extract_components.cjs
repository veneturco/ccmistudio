const fs = require('fs');
const path = require('path');

const jsxPath = path.join(__dirname, '..', 'src', 'components', 'DrSamirDashboard.tsx');
let jsxContent = fs.readFileSync(jsxPath, 'utf8');

// Fix encoding issues if any (lnea -> línea)
jsxContent = jsxContent.replace(/lnea/g, 'línea');
jsxContent = jsxContent.replace(/Quirfano/g, 'Quirófano');
jsxContent = jsxContent.replace(/Rcipe/g, 'Récipe');
jsxContent = jsxContent.replace(/Quirófano/g, 'Quirófano');

// Extract Header & Background
const headerRegex = /([\s\S]*?)<main/i;
const headerMatch = jsxContent.match(headerRegex);

// Extract Main wrapper
const mainRegex = /<main([^>]*)>([\s\S]*?)<\/main>/i;
const mainMatch = jsxContent.match(mainRegex);

// Extract footer/avatar (everything after main)
const footerRegex = /<\/main>([\s\S]*?)<\/div>\s*<\/div>\s*\);\s*}/i;
const footerMatch = jsxContent.match(footerRegex);

const layoutComponent = `import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export const ModernLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const { user } = useAuth();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if(newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  return (
    <div className={\`\${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} relative min-h-screen flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-500\`}>
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      <header className="glass-header sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group relative z-10 flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-1 flex items-center justify-center shadow-lg shadow-sky-500/30 border border-white/20 group-hover:scale-105 transition-transform duration-300">
                      <i className="fa-solid fa-brain text-white text-sm sm:text-lg"></i>
                  </div>
                  <div className="flex flex-col">
                      <div className="flex items-center gap-1 sm:gap-2">
                          <span className="font-extrabold text-xs sm:text-base tracking-tight text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate max-w-[130px] sm:max-w-none">
                              Dr. Samir Moucharrafie
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-400/30 hidden md:inline-block">
                              MPPS: 61231
                          </span>
                      </div>
                      <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide truncate max-w-[150px] sm:max-w-none">
                          Unidad Cerebro Columna (CMI)
                      </p>
                  </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 relative z-10 flex-shrink-0">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold tracking-widest uppercase shadow-inner cursor-default">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      En línea
                  </div>

                  <button onClick={toggleTheme} className="flex items-center justify-center sm:px-3 sm:py-1.5 w-8 h-8 sm:w-auto sm:h-auto rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-sky-500/40 shadow-sm transition-colors group">
                      <i className={\`fa-solid \${theme === 'dark' ? 'fa-sun text-amber-400' : 'fa-moon text-slate-600'} text-sm group-hover:rotate-45 dark:group-hover:-rotate-12 transition-transform duration-300\`}></i>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-amber-400 hidden sm:inline ml-2">Guardia</span>
                  </button>
              </div>
          </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 md:pb-6 z-10 relative">
        {children}
      </main>

      ${footerMatch ? footerMatch[1] : ''}
    </div>
  );
};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'components', 'ModernLayout.tsx'), layoutComponent);
console.log('ModernLayout created.');

// Extract view-dashboard
let mainContent = mainMatch[2];
const dashboardViewRegex = /<div id="view-dashboard"([^>]*)>([\s\S]*?)<!-- ===+/i;
const dashboardMatch = mainContent.match(dashboardViewRegex);

if (dashboardMatch) {
  let dashboardJsx = dashboardMatch[2];
  // Replace onclick to valid functions
  dashboardJsx = dashboardJsx.replace(/onClick=\{\(\) => \{\}\}/g, 'onClick={() => {}}');

  const dashboardComponent = `import React, { useState } from 'react';

export const ModernHomeView: React.FC<{
  onNavigateToDocs: (docType: string) => void;
  onNavigateToView: (view: string) => void;
}> = ({ onNavigateToDocs, onNavigateToView }) => {
  const [bimodalMode, setBimodalMode] = useState<'consulta' | 'quirofano'>('consulta');

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in-up">
      ${dashboardJsx}
    </div>
  );
};
`;
  // Inject some logic to the buttons
  let fixedDashboard = dashboardComponent.replace(/<button id="btn-sub-consulta" onClick=\{\(\) => \{\}\} className="px-3 py-1 rounded-lg bg-sky-500 text-white/g, 
    `<button onClick={() => setBimodalMode('consulta')} className={\`px-3 py-1 rounded-lg transition \${bimodalMode === 'consulta' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'}\`}`);
  fixedDashboard = fixedDashboard.replace(/<button id="btn-sub-quirofano" onClick=\{\(\) => \{\}\} className="px-3 py-1 rounded-lg text-slate-600/g,
    `<button onClick={() => setBimodalMode('quirofano')} className={\`px-3 py-1 rounded-lg transition \${bimodalMode === 'quirofano' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'}\`}`);

  // Toggling display of bimodal sub-views
  fixedDashboard = fixedDashboard.replace(/id="bimodal-consulta-view" className="grid/g, `className={\`grid \${bimodalMode === 'consulta' ? '' : 'hidden'}\``);
  fixedDashboard = fixedDashboard.replace(/id="bimodal-quirofano-view" className="hidden grid/g, `className={\`grid \${bimodalMode === 'quirofano' ? '' : 'hidden'}\``);

  // Fix document navigation
  fixedDashboard = fixedDashboard.replace(/switchView\('view-recipe'\)/g, `onNavigateToDocs('RECIPES')`);
  fixedDashboard = fixedDashboard.replace(/switchView\('view-report'\)/g, `onNavigateToDocs('INFORME')`);
  fixedDashboard = fixedDashboard.replace(/switchView\('view-orders'\)/g, `onNavigateToDocs('ORDEN_LAB')`);
  fixedDashboard = fixedDashboard.replace(/switchView\('view-certificate'\)/g, `onNavigateToDocs('CONSTANCIA')`);
  
  // Fix view navigation
  fixedDashboard = fixedDashboard.replace(/switchView\('view-appointments'\)/g, `onNavigateToView('view-appointments')`);
  fixedDashboard = fixedDashboard.replace(/switchView\('view-waiting-room'\)/g, `onNavigateToView('view-waiting-room')`);
  fixedDashboard = fixedDashboard.replace(/switchView\('view-active-consultation'\)/g, `onNavigateToView('view-active-consultation')`);
  fixedDashboard = fixedDashboard.replace(/switchView\('view-attended'\)/g, `onNavigateToView('view-attended')`);

  // Fix class to className if any slipped
  fixedDashboard = fixedDashboard.replace(/ class=/g, ' className=');

  fs.writeFileSync(path.join(__dirname, '..', 'src', 'components', 'ModernHomeView.tsx'), fixedDashboard);
  console.log('ModernHomeView created.');
}

