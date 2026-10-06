const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'src', 'components', 'Dashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// Replace the top imports
content = content.replace(/import React, \{ useState \} from 'react';/, 
`import React, { useState, useEffect } from 'react';
import { 
  FileText, History, ChevronRight, CreditCard, Pill, FlaskConical, CalendarCheck, ClipboardList, Boxes, Menu, X, Code2, Home, Stethoscope 
} from 'lucide-react';
import { ProcessedDocumentResult, DocType } from '../types';
import { BrandLogo } from './BrandLogo';
import { CmiSpecialtiesPortal } from './CmiSpecialtiesPortal';
import { DocumentSelectorWorkspace } from './DocumentSelectorWorkspace';
import { LogisticsQuoter } from './LogisticsQuoter';
import { HistoryList } from './HistoryList';
import { DoctorBusinessCard } from './DoctorBusinessCard';
import { DocumentZoneEditorStudio } from './DocumentZoneEditorStudio';
import { FirestoreStationerySync } from '../cloud/FirestoreStationerySync';
`);

// Replace the function name and add state
content = content.replace(/export default function DrSamirDashboard\(\) \{/, 
`export const Dashboard: React.FC = () => {
  useEffect(() => {
    FirestoreStationerySync.initialize().catch((err) => {
      console.warn('[Dashboard] Sincronización offline:', err);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<'portal' | 'workspace' | 'history' | 'quoter' | 'developer_studio'>('portal');
  const [selectedDoc, setSelectedDoc] = useState<DocType>('RECIPES');
  const [documentsHistory] = useState<ProcessedDocumentResult[]>([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
`);

// Replace switchView usages inside the component
// For switchView('view-recipe') -> setActiveTab('workspace'); setSelectedDoc('RECIPES');
content = content.replace(/switchView\('view-recipe'\)/g, "() => { setActiveTab('workspace'); setSelectedDoc('RECIPES'); }");
content = content.replace(/switchView\('view-report'\)/g, "() => { setActiveTab('workspace'); setSelectedDoc('INFORME'); }");
content = content.replace(/switchView\('view-orders'\)/g, "() => { setActiveTab('workspace'); setSelectedDoc('ORDEN_LAB'); }");
content = content.replace(/switchView\('view-certificate'\)/g, "() => { setActiveTab('workspace'); setSelectedDoc('CONSTANCIA'); }");
content = content.replace(/switchView\('view-dashboard'\)/g, "() => { setActiveTab('portal'); setActiveView('view-dashboard'); }");

// Hide the static HTML views if activeTab !== 'portal'
content = content.replace(/<div id="view-dashboard" className="app-view active-view space-y-4 sm:space-y-5">/g, 
  `{activeTab === 'workspace' && (
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
          <button onClick={() => setActiveTab('portal')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1">
            <span>← Volver</span>
          </button>
        </div>
        <DocumentSelectorWorkspace initialDocType={selectedDoc} key={selectedDoc} onOpenZoneEditor={() => setActiveTab('developer_studio')} />
      </div>
  )}

  {activeTab === 'portal' && (
  <div id="view-dashboard" className={\`app-view \${activeView === 'view-dashboard' ? 'active-view' : 'hidden'} space-y-4 sm:space-y-5\`}>`
);

content = content.replace(/<div id="view-appointments" className="app-view space-y-4">/g, 
  `</div>)}
  
  {activeTab === 'portal' && (
  <div id="view-appointments" className={\`app-view \${activeView === 'view-appointments' ? 'active-view' : 'hidden'} space-y-4\`}>`
);

// Do the same for waiting-room, active-consultation, attended
content = content.replace(/<div id="view-waiting-room" className="app-view space-y-4">/g, 
  `</div>)}
  {activeTab === 'portal' && (
  <div id="view-waiting-room" className={\`app-view \${activeView === 'view-waiting-room' ? 'active-view' : 'hidden'} space-y-4\`}>`
);

content = content.replace(/<div id="view-active-consultation" className="app-view space-y-4">/g, 
  `</div>)}
  {activeTab === 'portal' && (
  <div id="view-active-consultation" className={\`app-view \${activeView === 'view-active-consultation' ? 'active-view' : 'hidden'} space-y-4\`}>`
);

content = content.replace(/<div id="view-attended" className="app-view space-y-4">/g, 
  `</div>)}
  {activeTab === 'portal' && (
  <div id="view-attended" className={\`app-view \${activeView === 'view-attended' ? 'active-view' : 'hidden'} space-y-4\`}>`
);

// Close the last div
content = content.replace(/<\/main>/g, `</div>)}</main>`);

// Also we should change the onClick of switchView so it doesn't wrap inside an anonymous function if it already has () => {}
// Wait, the replace string "() => { setActiveTab('workspace'); setSelectedDoc('RECIPES'); }" replaces the whole "switchView('view-recipe')" text.
// So if the HTML had "onClick={() => console.log('switchView('view-recipe')')}" it becomes:
// onClick={() => console.log('() => { ... }')}
// Ah, let's fix that. In DrSamirDashboard.tsx, we replaced `onclick` with `onClick={() => console.log('...')}`!
// Let me verify this.
