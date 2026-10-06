const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dr_samir_ccmi_2026..html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

let bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (!bodyMatch) process.exit(1);
let jsxContent = bodyMatch[1];

// 1. Remove scripts
jsxContent = jsxContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

// 2. HTML Comments to JSX Comments
jsxContent = jsxContent.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// 3. style="string" to style={{}}
jsxContent = jsxContent.replace(/style="([^"]*)"/g, (match, p1) => {
    const styleObj = {};
    p1.split(';').forEach(rule => {
        const parts = rule.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            const val = parts.slice(1).join(':').trim();
            if(key) styleObj[key] = val;
        }
    });
    return `style={${JSON.stringify(styleObj)}}`;
});

// 4. class= to className=
jsxContent = jsxContent.replace(/class=/g, 'className=');

// 5. for= to htmlFor=
jsxContent = jsxContent.replace(/ for=/g, ' htmlFor=');

// 6. self closing tags
jsxContent = jsxContent.replace(/<(img|input|br|hr|meta|link)([^>]*?)(?<!\/)>/g, '<$1$2 />');

// 7. inline event handlers
jsxContent = jsxContent.replace(/onclick="([^"]*)"/gi, (match, p1) => {
    return `onClick={() => { ${p1} }}`;
});

// 8. viewBox, stroke-width, stroke-linecap, stroke-linejoin, fill-rule, clip-rule, stroke-miterlimit
jsxContent = jsxContent.replace(/viewbox=/gi, 'viewBox=');
jsxContent = jsxContent.replace(/stroke-width=/g, 'strokeWidth=');
jsxContent = jsxContent.replace(/stroke-linecap=/g, 'strokeLinecap=');
jsxContent = jsxContent.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
jsxContent = jsxContent.replace(/fill-rule=/g, 'fillRule=');
jsxContent = jsxContent.replace(/clip-rule=/g, 'clipRule=');
jsxContent = jsxContent.replace(/stroke-miterlimit=/g, 'strokeMiterlimit=');

const reactComponent = `import React, { useState, useEffect } from 'react';
import { 
  FileText, History, ChevronRight, CreditCard, Pill, FlaskConical, CalendarCheck, ClipboardList, Boxes, Menu, X, Code2, Home, Stethoscope 
} from 'lucide-react';
import { ProcessedDocumentResult, DocType } from '../types';
import { DocumentSelectorWorkspace } from './DocumentSelectorWorkspace';
import { LogisticsQuoter } from './LogisticsQuoter';
import { HistoryList } from './HistoryList';
import { DoctorBusinessCard } from './DoctorBusinessCard';
import { DocumentZoneEditorStudio } from './DocumentZoneEditorStudio';

export const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState('view-dashboard');
  const [bimodalMode, setBimodalMode] = useState('consulta');
  const [theme, setTheme] = useState('light');
  
  // App state
  const [activeTab, setActiveTab] = useState<'portal' | 'workspace' | 'history' | 'quoter' | 'developer_studio'>('portal');
  const [selectedDoc, setSelectedDoc] = useState<DocType>('RECIPES');
  const [documentsHistory] = useState<ProcessedDocumentResult[]>([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const switchView = (view: string) => {
    if (view === 'view-recipe') { setActiveTab('workspace'); setSelectedDoc('RECIPES'); }
    else if (view === 'view-report') { setActiveTab('workspace'); setSelectedDoc('INFORME'); }
    else if (view === 'view-orders') { setActiveTab('workspace'); setSelectedDoc('ORDEN_LAB'); }
    else if (view === 'view-certificate') { setActiveTab('workspace'); setSelectedDoc('CONSTANCIA'); }
    else { setActiveTab('portal'); setActiveView(view); }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if(newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };
  
  const setBimodalSubMode = (mode: string) => setBimodalMode(mode);
  
  // Dummy handlers for now to avoid crashes
  const togglePatientPanel = () => console.log("Toggle patient");
  const toggleVoicePanel = () => console.log("Toggle voice");
  const showToast = (msg: string) => console.log("Toast:", msg);
  const openNewPatientModal = () => console.log("New patient");

  return (
    <div className={\`\${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} relative min-h-screen flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-500\`}>
      ${jsxContent}
      
      <DoctorBusinessCard
        isModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'components', 'Dashboard.tsx'), reactComponent);
console.log('JSX generation complete and injected into Dashboard.tsx.');
