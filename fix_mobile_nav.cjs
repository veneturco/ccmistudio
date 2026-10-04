const fs = require('fs');

const content = `import React from 'react';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Mic, 
  History, 
  Building2,
  Sparkles
} from 'lucide-react';
import { ActiveNavTab } from '../types';

interface MobileBottomNavBarProps {
  activeTab: 'portal' | 'workspace' | 'dictation_ai' | 'agenda' | 'history' | 'quoter' | 'developer_studio' | 'analytics';
  setActiveTab: (tab: any) => void;
  historyCount: number;
  userRole?: string;
}

export const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  userRole,
}) => {
  const isSecretary = userRole === 'SECRETARIA' || userRole === 'RECEPCION';
  return (
    <nav 
      aria-label="Navegación Móvil Principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#061122]/95 backdrop-blur-xl border-t border-cyan-500/20 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-all"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="grid grid-cols-5 items-center justify-around gap-1 max-w-lg mx-auto">
        
        {/* 1. Agenda / Citas */}
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={\`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 \${
            activeTab === 'agenda'
              ? 'text-cyan-300 font-bold bg-cyan-950/60 ring-1 ring-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }\`}
        >
          <CalendarIcon className={\`w-5 h-5 \${activeTab === 'agenda' ? 'text-cyan-400 scale-110' : ''}\`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Agenda</span>
        </button>

        {/* 2. Historial */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={\`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 \${
            activeTab === 'history'
              ? 'text-cyan-300 font-bold bg-cyan-950/60 ring-1 ring-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }\`}
        >
          <div className="relative">
            <History className={\`w-5 h-5 \${activeTab === 'history' ? 'text-cyan-400 scale-110' : ''}\`} />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-slate-900 shadow-md">
                {historyCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Historial</span>
        </button>

        {/* 3. Dictado IA (Botón Central Destacado) */}
        <button
          type="button"
          onClick={() => setActiveTab('dictation_ai')}
          className={\`flex flex-col items-center justify-center -mt-3 py-1 px-2 rounded-2xl transition-all cursor-pointer hover:-translate-y-1 active:scale-95 relative group \${
            activeTab === 'dictation_ai'
              ? 'text-white'
              : 'text-cyan-200'
          }\`}
        >
          <div className={\`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform \${
            activeTab === 'dictation_ai'
              ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)] ring-2 ring-cyan-300'
              : 'bg-gradient-to-tr from-slate-800 to-cyan-900 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
          }\`}>
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold mt-1 text-cyan-300 flex items-center gap-0.5 drop-shadow-md">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            Dictado
          </span>
        </button>

        {/* 4. Documentos / Papelería A4 */}
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={\`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 \${
            activeTab === 'workspace'
              ? 'text-cyan-300 font-bold bg-cyan-950/60 ring-1 ring-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }\`}
        >
          <div className="relative">
            <FileText className={\`w-5 h-5 \${activeTab === 'workspace' ? 'text-cyan-400 scale-110' : ''}\`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Docs</span>
        </button>

        {/* 5. Portal */}
        <button
          type="button"
          onClick={() => setActiveTab('portal')}
          className={\`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer \${
            activeTab === 'portal'
              ? 'text-cyan-300 font-bold bg-cyan-950/60 ring-1 ring-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }\`}
        >
          <Building2 className={\`w-5 h-5 \${activeTab === 'portal' ? 'text-cyan-400 scale-110' : ''}\`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Portal</span>
        </button>

      </div>
    </nav>
  );
};
`

fs.writeFileSync('src/components/MobileBottomNavBar.tsx', content);
console.log("Fixed!");