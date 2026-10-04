import React from 'react';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Mic, 
  History, 
  Building2,
  Sparkles
} from 'lucide-react';

interface MobileBottomNavBarProps {
  activeTab: 'portal' | 'workspace' | 'dictation_ai' | 'agenda' | 'history' | 'quoter' | 'developer_studio' | 'analytics';
  setActiveTab: (tab: any) => void;
  historyCount: number;
  userRole?: string;
}

/**
 * Google Material Design 3 (M3) Mobile Navigation Bar
 * Diseñado bajo especificaciones de Material You:
 * - Altura estándar 80dp con elevación tonal de superficie.
 * - Indicadores activos en forma de píldora (Active Indicator Pill).
 * - Extended FAB central con aura iridiscente para Dictado IA.
 * - Badges numéricos M3 de alta visibilidad.
 */
export const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  userRole,
}) => {
  return (
    <nav 
      aria-label="Barra de Navegación Móvil Material 3"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#071329]/95 backdrop-blur-2xl border-t border-cyan-500/20 shadow-[0_-8px_30px_rgba(0,0,0,0.65)] transition-all"
      style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
    >
      <div className="grid grid-cols-5 items-center justify-around h-[72px] max-w-lg mx-auto px-1">
        
        {/* 1. Agenda / Citas */}
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className="flex flex-col items-center justify-center py-1 transition-all group cursor-pointer active:scale-95 select-none"
        >
          <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeTab === 'agenda'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
              : 'text-slate-400 group-hover:text-slate-200'
          }`}>
            <CalendarIcon className="w-5 h-5" />
          </div>
          <span className={`text-[10.5px] mt-0.5 tracking-tight transition-colors ${
            activeTab === 'agenda' ? 'text-cyan-200 font-bold' : 'text-slate-400 font-medium'
          }`}>
            Agenda
          </span>
        </button>

        {/* 2. Historial */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className="flex flex-col items-center justify-center py-1 transition-all group cursor-pointer active:scale-95 select-none"
        >
          <div className="relative">
            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              activeTab === 'history'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}>
              <History className="w-5 h-5" />
            </div>
            {historyCount > 0 && (
              <span className="absolute -top-0.5 right-1 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-1 ring-slate-900 shadow-md">
                {historyCount}
              </span>
            )}
          </div>
          <span className={`text-[10.5px] mt-0.5 tracking-tight transition-colors ${
            activeTab === 'history' ? 'text-cyan-200 font-bold' : 'text-slate-400 font-medium'
          }`}>
            Historial
          </span>
        </button>

        {/* 3. Dictado IA (Google M3 Extended Floating Action Button) */}
        <button
          type="button"
          onClick={() => setActiveTab('dictation_ai')}
          className="flex flex-col items-center justify-center -mt-5 transition-all group cursor-pointer active:scale-90 select-none"
          title="Dictado Clínico Neuronal"
        >
          <div className="relative p-[2px] rounded-full sami-capsule shadow-[0_6px_25px_rgba(6,182,212,0.5)]">
            <div className="sami-synaptic-border rounded-full" />
            <div className={`w-13 h-13 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
              activeTab === 'dictation_ai'
                ? 'bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.8)]'
                : 'bg-[#09152b] border border-cyan-400/50 text-cyan-300 hover:text-white'
            }`}>
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <span className="text-[10.5px] font-bold mt-1 text-cyan-300 flex items-center gap-0.5 drop-shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            Dictado
          </span>
        </button>

        {/* 4. Documentos / Papelería A4 */}
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className="flex flex-col items-center justify-center py-1 transition-all group cursor-pointer active:scale-95 select-none"
        >
          <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeTab === 'workspace'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
              : 'text-slate-400 group-hover:text-slate-200'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <span className={`text-[10.5px] mt-0.5 tracking-tight transition-colors ${
            activeTab === 'workspace' ? 'text-cyan-200 font-bold' : 'text-slate-400 font-medium'
          }`}>
            Docs A4
          </span>
        </button>

        {/* 5. Portal */}
        <button
          type="button"
          onClick={() => setActiveTab('portal')}
          className="flex flex-col items-center justify-center py-1 transition-all group cursor-pointer active:scale-95 select-none"
        >
          <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeTab === 'portal'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
              : 'text-slate-400 group-hover:text-slate-200'
          }`}>
            <Building2 className="w-5 h-5" />
          </div>
          <span className={`text-[10.5px] mt-0.5 tracking-tight transition-colors ${
            activeTab === 'portal' ? 'text-cyan-200 font-bold' : 'text-slate-400 font-medium'
          }`}>
            Portal
          </span>
        </button>

      </div>
    </nav>
  );
};
