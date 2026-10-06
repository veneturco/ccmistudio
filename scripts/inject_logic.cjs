const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// The main view is everything inside <main>.
// We want to replace the static HTML views with conditional logic.

// 1. Replace the entire <main> content with a conditional rendering wrapper
// First, find the <main> block
const mainRegex = /<main className="flex-1[^>]*>([\s\S]*?)<\/main>/i;
const mainMatch = content.match(mainRegex);

if (mainMatch) {
  let mainContent = mainMatch[1];
  
  // We will replace 'active-view' with conditionally applied classes based on activeView state.
  // Example: className="app-view active-view" -> className={`app-view ${activeView === 'view-dashboard' ? 'active-view' : 'hidden'}`}
  
  mainContent = mainContent.replace(/className="app-view active-view([^"]*)"/g, 'className={`app-view ${activeTab === \\\'portal\\\' && activeView === \\\'view-dashboard\\\' ? \\\'active-view\\\' : \\\'hidden\\\'} $1`}');
  mainContent = mainContent.replace(/className="app-view([^"]*)"/g, (match, p1) => {
      // Don't replace if it already has the template literal
      if (match.includes('activeTab')) return match;
      
      // Extract the id of the view to know which state it corresponds to
      // It's tricky with regex here, let's just make ALL views respect activeView.
      return match; 
  });
  
  // Actually, a simpler way is to just inject our React components at the top of <main>, 
  // and wrap the rest of the HTML views inside `{activeTab === 'portal' && ( <> ... </> )}`

  let newMainContent = `
        {activeTab === 'workspace' && (
          <div className="w-full space-y-3 animate-fade-in-up relative z-20">
            <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-xs">
                <button onClick={() => setActiveTab('portal')} className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  <span>Dashboard Principal</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Estación de Papelería</span>
              </div>
            </div>
            <DocumentSelectorWorkspace initialDocType={selectedDoc} key={selectedDoc} onOpenZoneEditor={() => setActiveTab('developer_studio')} />
          </div>
        )}
        
        {activeTab === 'portal' && (
          <div className="portal-views-container">
            ${mainContent.replace(/app-view active-view/g, 'app-view')}
          </div>
        )}
  `;

  // We need to apply the correct active-view class dynamically for the portal views
  newMainContent = newMainContent.replace(/<div id="([^"]+)" className="app-view([^"]*)"/g, '<div id="$1" className={`app-view $2 ${activeView === \'$1\' ? \'active-view\' : \'hidden\'}`}"');
  
  // Wait, the regex replacement above will leave a trailing quote `"` because of the way template literals are added.
  // Let's do it cleaner.
  newMainContent = newMainContent.replace(/<div id="([^"]+)" className="app-view([^"]*)"/g, '<div id="$1" className={`app-view$2 ${activeView === \'$1\' ? \'active-view\' : \'hidden\'}`}');
  
  content = content.replace(mainMatch[0], `<main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 md:pb-6 z-10 relative">\n${newMainContent}\n</main>`);
  
  // Also fix bimodal view toggles
  content = content.replace(/id="bimodal-consulta-view" className="grid/g, 'id="bimodal-consulta-view" className={`grid ${bimodalMode === \\\'consulta\\\' ? \\\'\\\' : \\\'hidden\\\'}`');
  content = content.replace(/id="bimodal-quirofano-view" className="hidden grid/g, 'id="bimodal-quirofano-view" className={`grid ${bimodalMode === \\\'quirofano\\\' ? \\\'\\\' : \\\'hidden\\\'}`');

  fs.writeFileSync(dashPath, content);
  console.log('Dashboard logic injected.');
} else {
  console.log('Main not found');
}
