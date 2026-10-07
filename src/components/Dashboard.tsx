import React, { useState, useEffect } from 'react';
import { 
  FileText, History, ChevronRight, CreditCard, Pill, FlaskConical, CalendarCheck, ClipboardList, Boxes, Menu, X, Code2, Home, Stethoscope 
} from 'lucide-react';
import { ProcessedDocumentResult, DocType } from '../types';
import { DocumentSelectorWorkspace } from './DocumentSelectorWorkspace';
import { LogisticsQuoter } from './LogisticsQuoter';
import { HistoryList } from './HistoryList';
import { DoctorBusinessCard } from './DoctorBusinessCard';
import { DocumentZoneEditorStudio } from './DocumentZoneEditorStudio';
import { SamiCopilot } from './SamiCopilot';

export const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState('view-dashboard');
  const [bimodalMode, setBimodalMode] = useState('consulta');
  const [theme, setTheme] = useState('light');
  
  // App state
  const [activeTab, setActiveTab] = useState<'portal' | 'workspace' | 'history' | 'quoter' | 'developer_studio'>('portal');
  const [selectedDoc, setSelectedDoc] = useState<DocType>('RECIPES');
  const [documentsHistory] = useState<ProcessedDocumentResult[]>([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPatientPanelOpen, setIsPatientPanelOpen] = useState(false);
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  const togglePatientPanel = (name?: string, age?: string, id?: string, diag?: string, initials?: string) => setIsPatientPanelOpen(prev => !prev);
  const closeAllPanels = () => { setIsPatientPanelOpen(false); setIsVoicePanelOpen(false); };
  const toggleVoicePanel = () => setIsVoicePanelOpen(prev => !prev);
  const openNewPatientModal = () => setIsNewPatientModalOpen(true);
  const closeNewPatientModal = () => setIsNewPatientModalOpen(false);
// In a real app this would use a toast library


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
  const showToast = (msg: string) => console.log("Toast:", msg);
  const processDictation = () => { console.log('Procesando dictado...'); setIsVoicePanelOpen(false); };
return (
    <div className={`${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} relative min-h-screen flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-500`}>
      

    <div className="ambient-glow-1"></div>
    <div className="ambient-glow-2"></div>

    <header className="glass-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
            
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group relative z-10 flex-shrink-0" onClick={() => { switchView('view-dashboard') }}>
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

                <button onClick={() => { toggleTheme() }} className="flex items-center justify-center sm:px-3 sm:py-1.5 w-8 h-8 sm:w-auto sm:h-auto rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-sky-500/40 shadow-sm transition-colors group">
                    <i className="fa-solid fa-moon dark:fa-sun text-slate-600 dark:text-amber-400 text-sm group-hover:rotate-45 dark:group-hover:-rotate-12 transition-transform duration-300" id="theme-icon"></i>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-amber-400 hidden sm:inline ml-2" id="theme-text">Guardia</span>
                </button>
            </div>
        </div>
    </header>

    <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 md:pb-6 z-10 relative">

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
            
        
        {/*  ==========================================  */}
        {/*  VIEW 1: DASHBOARD PRINCIPAL                */}
        {/*  ==========================================  */}
        <div id="view-dashboard" className={`app-view ${activeTab === 'portal' && activeView === 'view-dashboard' ? 'active-view' : 'hidden'}  space-y-4 sm:space-y-5`}>
            
            {/*  ========================================================  */}
            {/*  HERO BIMODAL ADAPTATIVO ("Consulta vs Quirófano")         */}
            {/*  ========================================================  */}
            <div id="hero-bimodal-container" className="glass-card rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all duration-500">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-800 px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5">
                            <i className="fa-solid fa-bolt text-amber-500"></i> Estación de Comando Clínico
                        </span>
                        <span className="text-[11px] font-bold text-slate-500" id="bimodal-status-label">Modo: Consulta en Vivo</span>
                    </div>

                    {/*  Conmutador contextual Consulta / Quirófano  */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                        <button id="btn-sub-consulta" onClick={() => { setBimodalSubMode('consulta') }} className="px-3 py-1 rounded-lg bg-sky-500 text-white shadow-sm transition">
                            <i className="fa-solid fa-user-doctor mr-1"></i> Consulta
                        </button>
                        <button id="btn-sub-quirofano" onClick={() => { setBimodalSubMode('quirofano') }} className="px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-white transition">
                            <i className="fa-solid fa-hospital mr-1"></i> Quirófano / Guardia
                        </button>
                    </div>
                </div>

                {/*  SUB-VISTA 1: MODO CONSULTA (Paciente en Silla + Acciones Instantáneas)  */}
                <div id="bimodal-consulta-view" className={`grid ${bimodalMode === 'consulta' ? '' : 'hidden'} grid-cols-1 lg:grid-cols-12 gap-4 items-center`}>
                    <div className="lg:col-span-5 flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-sky-500/30 flex-shrink-0 cursor-pointer" onClick={() => { togglePatientPanel('Mariana G. Rivas', '42 años', 'V-14.230.198', 'Cervicalgia aguda (M54.2)', 'MR') }}>
                            MR
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">Mariana González Rivas</h3>
                                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/30 text-[9px] font-black">EVA: 8/10</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">42 años · CI: 14.230.198 · <strong>En silla: 18 min</strong></p>
                            <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-0.5"><i className="fa-solid fa-notes-medical"></i> Cervicalgia aguda con radiculopatía C6</p>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-wrap items-center justify-start lg:justify-end gap-2">
                        <button onClick={() => { toggleVoicePanel() }} className="px-3.5 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500 text-sky-600 hover:text-white dark:text-sky-300 dark:hover:text-white border border-sky-400/40 text-xs font-bold transition flex items-center gap-2">
                            <i className="fa-solid fa-microphone"></i> Dictar SOAP
                        </button>
                        <button onClick={() => { switchView('view-recipe') }} className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition flex items-center gap-2">
                            <i className="fa-solid fa-file-prescription text-sky-500"></i> Emitir Récipe
                        </button>
                        <button onClick={() => { showToast('Alerta clínica: Alergia a Penicilina registrada', 'fa-triangle-exclamation', 'text-amber-400') }} className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-1.5">
                            <i className="fa-solid fa-triangle-exclamation"></i> Penicilina
                        </button>
                        <button onClick={() => { openNewPatientModal() }} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition flex items-center gap-1.5">
                            <i className="fa-solid fa-plus"></i> Nueva Consulta
                        </button>
                    </div>
                </div>

                {/*  SUB-VISTA 2: MODO QUIRÓFANO / GUARDIA (Procedimiento, Horario y Checklist)  */}
                <div id="bimodal-quirofano-view" className={`grid ${bimodalMode === 'quirofano' ? '' : 'hidden'} grid-cols-1 lg:grid-cols-12 gap-4 items-center`}>
                    <div className="lg:col-span-6 flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-amber-500/30 flex-shrink-0">
                            <i className="fa-solid fa-hospital-user"></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">Quirófano 2 · Synapsis CMI</h3>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black">10:30 AM</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Procedimiento: <strong>Microdiscectomía tubular L5-S1</strong></p>
                            <p className="text-[10px] font-bold text-amber-500 mt-0.5"><i className="fa-solid fa-box-archive"></i> Cajas intersomáticas y set CMI verificados en sala</p>
                        </div>
                    </div>

                    <div className="lg:col-span-6 flex flex-wrap items-center justify-start lg:justify-end gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                            <i className="fa-solid fa-heart-pulse"></i> Riesgo Quirúrgico: Aprobado (ASA II)
                        </span>
                        <button onClick={() => { showToast('Cargando protocolo y checklist Synapsis...', 'fa-file-shield', 'text-sky-400') }} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2">
                            <i className="fa-solid fa-clipboard-check"></i> Ver Protocolo Quirúrgico
                        </button>
                    </div>
                </div>
            </div>

            {/*  KPI Grid Interconectado con sub-vistas  */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="glass-card beam-card p-4 sm:p-5 rounded-3xl text-center cursor-pointer" onClick={() => { switchView('view-appointments') }}>
                    <div className="beam-content">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl icon-box-clean text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-3">
                            <i className="fa-solid fa-calendar-day text-base"></i>
                        </div>
                        <span className="text-xl font-black" id="kpi-today-count">18</span>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase flex items-center justify-center gap-1">
                            Citas Hoy <i className="fa-solid fa-chevron-right text-[8px] text-sky-500"></i>
                        </p>
                    </div>
                </div>

                <div className="glass-card beam-card p-4 sm:p-5 rounded-3xl text-center relative cursor-pointer" onClick={() => { switchView('view-waiting-room') }}>
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-ping z-10"></div>
                    <div className="beam-content">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl icon-box-clean text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                            <i className="fa-solid fa-users text-base"></i>
                        </div>
                        <span className="text-xl font-black" id="kpi-waiting-count">4</span>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase flex items-center justify-center gap-1">
                            En Espera <i className="fa-solid fa-chevron-right text-[8px] text-emerald-500"></i>
                        </p>
                    </div>
                </div>

                <div className="glass-card beam-card p-4 sm:p-5 rounded-3xl text-center cursor-pointer" onClick={() => { switchView('view-active-consultation') }}>
                    <div className="beam-content">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl icon-box-clean text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                            <i className="fa-solid fa-user-doctor text-base"></i>
                        </div>
                        <span className="text-xl font-black">1</span>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase flex items-center justify-center gap-1">
                            En Consulta <i className="fa-solid fa-chevron-right text-[8px] text-indigo-500"></i>
                        </p>
                    </div>
                </div>

                <div className="glass-card beam-card p-4 sm:p-5 rounded-3xl text-center cursor-pointer" onClick={() => { switchView('view-attended') }}>
                    <div className="beam-content">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl icon-box-clean text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-3">
                            <i className="fa-solid fa-circle-check text-base"></i>
                        </div>
                        <span className="text-xl font-black">13</span>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase flex items-center justify-center gap-1">
                            Atendidos <i className="fa-solid fa-chevron-right text-[8px] text-sky-500"></i>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/*  Fila Deslizable de Pacientes  */}
                <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden relative">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-md uppercase tracking-widest shadow-inner"><i className="fa-solid fa-arrows-left-right mr-1"></i> Fila de Pacientes</span>
                        <span className="text-[10px] text-slate-500 font-bold" id="queue-turn-indicator">En turno: 104</span>
                    </div>
                    
                    <div id="patient-queue-list" className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pb-4">
                        <div className="snap-center shrink-0 w-[90%] md:w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white/40 dark:bg-slate-800/40 cursor-pointer hover:border-sky-400 transition-colors" onClick={() => { togglePatientPanel('Mariana G. Rivas', '42 años', 'V-14.230.198', 'Cervicalgia aguda (M54.2)', 'MR') }}>
                            <div className="flex flex-row items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-sky-500/40">MR</div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mariana G. Rivas</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">42 años · CI: 14.230.198</p>
                                    <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-1"><i className="fa-solid fa-notes-medical"></i> Cervicalgia aguda</p>
                                </div>
                            </div>
                        </div>
                        <div className="snap-center shrink-0 w-[90%] md:w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white/40 dark:bg-slate-800/40 cursor-pointer hover:border-sky-400 transition-colors" onClick={() => { togglePatientPanel('Héctor José Valera', '31 años', 'V-19.502.833', 'Hernia L5-S1', 'HJ') }}>
                            <div className="flex flex-row items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/40">HJ</div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Héctor José Valera</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">31 años · CI: 19.502.833</p>
                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1"><i className="fa-solid fa-notes-medical"></i> Hernia L5-S1</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                        <button onClick={() => { togglePatientPanel() }} className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-sky-500/30 text-slate-700 dark:text-sky-300 font-bold py-3 rounded-2xl text-[11px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                            <i className="fa-solid fa-user-injured"></i> Ver Perfil Detallado
                        </button>
                    </div>
                </div>

                {/*  Papelería Institucional Completa  */}
                <div className="lg:col-span-2 glass-card rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Papelería Institucional A4</h3>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 font-medium">Módulos de emisión rápida con autocompletado neuroquirúrgico.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div onClick={() => { switchView('view-recipe') }} className="glass-card beam-card p-3 sm:p-4 rounded-2xl flex items-center gap-3 cursor-pointer">
                                <div className="beam-content flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded-xl icon-box-clean text-sky-600 dark:text-sky-400 flex items-center justify-center"><i className="fa-solid fa-pills text-base"></i></div>
                                    <div><h4 className="text-[11px] sm:text-xs font-bold transition-colors">Récipe Médico</h4></div>
                                </div>
                            </div>
                            <div onClick={() => { switchView('view-report') }} className="glass-card beam-card p-3 sm:p-4 rounded-2xl flex items-center gap-3 cursor-pointer">
                                <div className="beam-content flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded-xl icon-box-clean text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><i className="fa-solid fa-file-medical text-base"></i></div>
                                    <div><h4 className="text-[11px] sm:text-xs font-bold transition-colors">Informe Médico</h4></div>
                                </div>
                            </div>
                            <div onClick={() => { switchView('view-orders') }} className="glass-card beam-card p-3 sm:p-4 rounded-2xl flex items-center gap-3 cursor-pointer">
                                <div className="beam-content flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded-xl icon-box-clean text-violet-600 dark:text-violet-400 flex items-center justify-center"><i className="fa-solid fa-flask text-base"></i></div>
                                    <div><h4 className="text-[11px] sm:text-xs font-bold transition-colors">Orden Exámenes</h4></div>
                                </div>
                            </div>
                            <div onClick={() => { switchView('view-certificate') }} className="glass-card beam-card p-3 sm:p-4 rounded-2xl flex items-center gap-3 cursor-pointer">
                                <div className="beam-content flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded-xl icon-box-clean text-amber-600 dark:text-amber-400 flex items-center justify-center"><i className="fa-solid fa-calendar-check text-base"></i></div>
                                    <div><h4 className="text-[11px] sm:text-xs font-bold transition-colors">Constancia Reposo</h4></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/*  ==========================================  */}
        {/*  VIEW 2: CITAS DE HOY (AGENDA DÍA)           */}
        {/*  ==========================================  */}
        <div id="view-appointments" className={`app-view  space-y-4 ${activeView === 'view-appointments' ? 'active-view' : 'hidden'}`}>
            <div className="flex items-center justify-between">
                <button onClick={() => { switchView('view-dashboard') }} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-left"></i> Volver al Dashboard
                </button>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Módulo: Agenda de Citas de Hoy (18)
                </span>
            </div>

            <div className="glass-card p-6 rounded-3xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Agenda Diaria de Consultas</h2>
                        <p className="text-xs text-slate-500">Dr. Samir Moucharrafie · Martes, 06 Octubre 2026</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20">Todos (18)</button>
                        <button className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-300">En Espera (4)</button>
                        <button className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-300">Atendidos (13)</button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between hover:border-sky-400 transition-colors cursor-pointer" onClick={() => { togglePatientPanel('Mariana G. Rivas', '42 años', 'V-14.230.198', 'Cervicalgia aguda (M54.2)', 'MR') }}>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400 w-16">08:30 AM</span>
                            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center font-bold text-xs">MR</div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Mariana González Rivas</h4>
                                <p className="text-[10px] text-slate-500">Cervicalgia aguda · CI: 14.230.198</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">En Consulta</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between hover:border-sky-400 transition-colors cursor-pointer" onClick={() => { togglePatientPanel('Héctor José Valera', '31 años', 'V-19.502.833', 'Hernia L5-S1', 'HJ') }}>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400 w-16">09:15 AM</span>
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">HJ</div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Héctor José Valera</h4>
                                <p className="text-[10px] text-slate-500">Hernia L5-S1 · CI: 19.502.833</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 text-[10px] font-bold">En Sala</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between hover:border-sky-400 transition-colors cursor-pointer" onClick={() => { togglePatientPanel('Elena P. Salazar', '58 años', 'V-8.910.421', 'Canal lumbar estrecho', 'ES') }}>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400 w-16">10:00 AM</span>
                            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">ES</div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Elena Patricia Salazar</h4>
                                <p className="text-[10px] text-slate-500">Canal lumbar estrecho · CI: 8.910.421</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">Confirmada</span>
                    </div>
                </div>
            </div>
        </div>

        {/*  ==========================================  */}
        {/*  VIEW 3: SALA DE ESPERA (TRIAGE)             */}
        {/*  ==========================================  */}
        <div id="view-waiting-room" className={`app-view  space-y-4 ${activeView === 'view-waiting-room' ? 'active-view' : 'hidden'}`}>
            <div className="flex items-center justify-between">
                <button onClick={() => { switchView('view-dashboard') }} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-left"></i> Volver al Dashboard
                </button>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Módulo: Control de Sala de Espera
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-3xl md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Pacientes Presentes en Recepción</h3>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">4 Pacientes</span>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold">Turno #105</span>
                                <h4 className="text-sm font-bold mt-1">Héctor José Valera</h4>
                                <p className="text-[11px] text-slate-500">Llegada: hace 22 minutos · Triage: Normal (125/82 mmHg)</p>
                            </div>
                            <button onClick={() => { showToast('Llamando a Héctor Valera a consultorio...', 'fa-bullhorn', 'text-sky-400') }} className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20">
                                Llamar a Consultorio
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold">Turno #106</span>
                                <h4 className="text-sm font-bold mt-1">Carlos Eduardo Méndez</h4>
                                <p className="text-[11px] text-slate-500">Llegada: hace 10 minutos · Triage: Dolor Agudo (135/88 mmHg)</p>
                            </div>
                            <button onClick={() => { showToast('Llamando a Carlos Méndez...', 'fa-bullhorn', 'text-sky-400') }} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-sky-500 hover:text-white text-slate-800 dark:text-white text-xs font-bold transition">
                                Llamar a Consultorio
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider mb-2">Pantalla de Sala</h4>
                        <p className="text-[11px] text-slate-500 mb-4">Control de llamado visual para el monitor de recepción de CMI.</p>
                        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-center">
                            <span className="text-[10px] font-bold uppercase text-sky-400">Próximo en Pantalla</span>
                            <h2 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">TURNO 105</h2>
                            <p className="text-xs font-semibold text-slate-500">Consultorio 1 · Dr. Samir</p>
                        </div>
                    </div>
                    <button onClick={() => { showToast('Timbre de llamado emitido en sala', 'fa-bell', 'text-amber-400') }} className="w-full mt-4 py-3 rounded-xl border border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white font-bold text-xs transition">
                        <i className="fa-solid fa-volume-high mr-1"></i> Notificar por Altavoz
                    </button>
                </div>
            </div>
        </div>

        {/*  ==========================================  */}
        {/*  VIEW 4: CONSULTA ACTIVA (EXPEDIENTE)        */}
        {/*  ==========================================  */}
        <div id="view-active-consultation" className={`app-view  space-y-4 ${activeView === 'view-active-consultation' ? 'active-view' : 'hidden'}`}>
            <div className="flex items-center justify-between">
                <button onClick={() => { switchView('view-dashboard') }} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-left"></i> Volver al Dashboard
                </button>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-mono font-bold text-emerald-500">Consulta en Progreso: 18 min</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">MR</div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">Mariana González Rivas</h2>
                                <p className="text-xs text-slate-500">42 años · CI: 14.230.198 · Ocupación: Docente</p>
                            </div>
                        </div>
                        <button onClick={() => { toggleVoicePanel() }} className="px-4 py-2 rounded-xl bg-sky-500/20 text-sky-500 border border-sky-500/40 text-xs font-bold flex items-center gap-2 hover:bg-sky-500 hover:text-white transition">
                            <i className="fa-solid fa-microphone"></i> Dictar Evolución
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">Evolución Clínica / Anamnesis</label>
                            <textarea rows="4" className="w-full p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-sky-500" placeholder="Escriba aquí los hallazgos clínicos o utilice Sami Copilot...">Paciente femenina refiere mejoría parcial con tratamiento conservador. Persiste radiculopatía C6 derecha con parestesias intermitentes en pulgar y dedo índice. Reflejo bicipital conservado.</textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">Diagnóstico Principal (CIE-10)</label>
                                <input type="text" value="Cervicalgia aguda con radiculopatía (M54.2)" className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white font-bold" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">Conducta Médica</label>
                                <input type="text" value="Plan quirúrgico mínimamente invasivo vs Bloqueo" className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button onClick={() => { switchView('view-recipe') }} className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-300">
                            Emitir Récipe
                        </button>
                        <button onClick={() => { showToast('Consulta guardada y finalizada con éxito', 'fa-check', 'text-emerald-400'); switchView('view-dashboard'); }} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black shadow-lg shadow-emerald-500/20">
                            Finalizar Consulta
                        </button>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Estudios de Imagen (PACS / RMN)</h3>
                    <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center">
                        <i className="fa-solid fa-x-ray text-3xl text-sky-500 mb-2"></i>
                        <p className="text-xs font-bold">RMN Columna Cervical</p>
                        <p className="text-[10px] text-slate-500">C5-C6 Hernia posterolateral derecha</p>
                        <button onClick={() => { showToast('Abriendo visor DICOM...', 'fa-eye', 'text-sky-400') }} className="mt-3 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-500 text-[10px] font-bold">Ver Resonancia</button>
                    </div>
                </div>
            </div>
        </div>

        {/*  ==========================================  */}
        {/*  VIEW 5: PACIENTES ATENDIDOS                 */}
        {/*  ==========================================  */}
        <div id="view-attended" className={`app-view  space-y-4 ${activeView === 'view-attended' ? 'active-view' : 'hidden'}`}>
            <div className="flex items-center justify-between">
                <button onClick={() => { switchView('view-dashboard') }} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-left"></i> Volver al Dashboard
                </button>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Módulo: Pacientes Atendidos Hoy (13)
                </span>
            </div>

            <div className="glass-card p-6 rounded-3xl">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-4">Consultas Concluidas con Éxito</h3>
                <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-circle-check text-emerald-500 text-lg"></i>
                            <div>
                                <h4 className="text-xs font-bold">Dr. Armando Quintero</h4>
                                <p className="text-[10px] text-slate-500">Control Postoperatorio Artrodesis L4-L5 · Atendido 08:00 AM</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">Récipe & Informe Generados</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-circle-check text-emerald-500 text-lg"></i>
                            <div>
                                <h4 className="text-xs font-bold">Beatriz Morales</h4>
                                <p className="text-[10px] text-slate-500">Cefalea tensional crónica · Atendido 08:45 AM</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">Tratamiento Médico Indicado</span>
                    </div>
                </div>
            </div>
        </div>

        {/*  ==========================================  */}
        {/*  VIEW 6: RÉCIPE MÉDICO A4                   */}
        {/*  ==========================================  */}
        <div id="view-recipe" className={`app-view  space-y-4 ${activeView === 'view-recipe' ? 'active-view' : 'hidden'}`}>
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => { switchView('view-dashboard') }} className="text-[10px] sm:text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                    <i className="fa-solid fa-arrow-left"></i> Volver al Dashboard
                </button>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Módulo: Récipe Médico Oficial A4
                </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="a4-paper a4-printable p-8 sm:p-12 mx-auto max-w-[800px] border border-slate-200 dark:border-slate-700 relative">
                        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-brain text-3xl text-slate-800"></i>
                                <div>
                                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Dr. Samir Moucharrafie</h1>
                                    <p className="text-xs font-bold text-slate-700">Neurocirugía · Cirugía de Columna Mínimamente Invasiva</p>
                                    <p className="text-[10px] text-slate-600">MPPS 61231 | CMI Cerebro y Columna · UCBL Lyon 1</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase text-slate-600">Fecha de Emisión</p>
                                <p className="text-sm font-mono font-bold text-slate-900">06/10/2026</p>
                            </div>
                        </div>

                        <div className="bg-slate-100 p-4 rounded-lg mb-6 text-xs grid grid-cols-2 gap-4 border border-slate-300">
                            <div>
                                <span className="font-bold">Paciente:</span> Mariana G. Rivas<br />
                                <span className="font-bold">CI:</span> V-14.230.198
                            </div>
                            <div>
                                <span className="font-bold">Edad:</span> 42 años<br />
                                <span className="font-bold">Diagnóstico:</span> Cervicalgia aguda (M54.2)
                            </div>
                        </div>

                        <div className="min-h-[400px]">
                            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-900"><i className="fa-solid fa-pills"></i> Rp.</h2>
                            <div className="space-y-4 text-sm font-medium text-slate-800">
                                <div className="border-b border-slate-300 pb-2">
                                    <p className="font-bold text-base">1. Tiocolchicósido 4mg</p>
                                    <p className="pl-4">Tomar 1 cápsula vía oral cada 12 horas por 5 días.</p>
                                </div>
                                <div className="border-b border-slate-300 pb-2">
                                    <p className="font-bold text-base">2. Ketoprofeno 100mg</p>
                                    <p className="pl-4">Tomar 1 tableta vía oral cada 8 horas por 4 días. Administrar con protector gástrico.</p>
                                </div>
                                <textarea className="w-full mt-4 p-2 bg-transparent border border-dashed border-slate-400 rounded resize-none focus:outline-none focus:border-sky-500 text-slate-800" rows="3" placeholder="Escriba aquí la siguiente indicación médica..."></textarea>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-300 text-center w-64 mx-auto">
                            <p className="text-2xl mb-1 text-slate-800 font-serif italic">Dr. Samir Moucharrafie</p>
                            <div className="border-t border-slate-800 pt-1">
                                <p className="text-[10px] font-bold text-slate-700">Firma y Sello Digital Oficial</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-72 flex flex-col gap-4">
                    <div className="glass-card p-5 rounded-3xl">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Acciones de Emisión</h3>
                        <div className="space-y-3">
                            <button onClick={() => { window.print() }} className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                                <i className="fa-solid fa-print"></i> Imprimir Físico (A4)
                            </button>
                            <button onClick={() => { showToast('Generando PDF firmado...', 'fa-file-pdf', 'text-indigo-400') }} className="w-full py-3 px-4 rounded-xl bg-slate-800 text-white flex items-center justify-center gap-2 text-xs font-bold hover:bg-slate-700 transition">
                                <i className="fa-solid fa-file-pdf"></i> Generar PDF
                            </button>
                            <button onClick={() => { showToast('Enviado por WhatsApp a Mariana Rivas', 'fa-whatsapp', 'text-emerald-400') }} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-emerald-500/30">
                                <i className="fa-brands fa-whatsapp"></i> Enviar a Paciente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/*  ==========================================  */}
        {/*  VIEW 7: INFORME MÉDICO A4                   */}
        {/*  ==========================================  */}
        <div id="view-report" className={`app-view  space-y-4 ${activeView === 'view-report' ? 'active-view' : 'hidden'}`}>
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => { switchView('view-dashboard') }} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                    <i className="fa-solid fa-arrow-left"></i> Volver al Dashboard
                </button>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Módulo: Informe Neuroquirúrgico A4
                </span>
            </div>

            <div className="a4-paper a4-printable p-8 sm:p-12 mx-auto max-w-[800px] border border-slate-200 dark:border-slate-700 space-y-6">
                <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-black uppercase text-slate-900">Dr. Samir Moucharrafie</h1>
                        <p className="text-xs font-bold text-slate-700">Informe Médico Especializado de Columna</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">INF-CMI-2026-088</span>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-slate-800">
                    <p><strong>Paciente:</strong> Mariana González Rivas | <strong>C.I.:</strong> V-14.230.198 | <strong>Edad:</strong> 42 años</p>
                    <div>
                        <h4 className="font-bold uppercase text-slate-900 mb-1">Motivo de Evaluación y Resumen Clínico:</h4>
                        <p>Paciente acude a valoración por cuadro de cervicalgia irradiada a dermatoma C6 derecho con 3 semanas de evolución, refractario a analgésicos de primer escalón.</p>
                    </div>
                    <div>
                        <h4 className="font-bold uppercase text-slate-900 mb-1">Hallazgos en Imagenología (Resonancia Magnética):</h4>
                        <p>La RMN de columna cervical evidencia discopatía degenerativa en el espacio intervertebral C5-C6 con protrusión posterolateral derecha que condiciona contacto radicular.</p>
                    </div>
                    <div>
                        <h4 className="font-bold uppercase text-slate-900 mb-1">Plan Terapéutico y Recomendación Quirúrgica:</h4>
                        <p>Se sugiere abordaje mínimamente invasivo (Microdiscectomía / Artroplastia cervical) tras fracaso de protocolo fisiátrico.</p>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-300 text-center w-64 mx-auto">
                    <p className="font-serif italic text-2xl text-slate-900">Dr. Samir Moucharrafie</p>
                    <p className="text-[10px] font-bold text-slate-700">Neurocirujano Especialista</p>
                </div>
            </div>
        </div>

        {/*  ==========================================  */}
        {/*  VIEW 8: ORDEN DE EXÁMENES A4                */}
        {/*  ==========================================  */}
        <div id="view-orders" className={`app-view  space-y-4 ${activeView === 'view-orders' ? 'active-view' : 'hidden'}`}>
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => { switchView('view-dashboard') }} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                    <i className="fa-solid fa-arrow-left"></i> Volver al Dashboard
                </button>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Módulo: Orden de Laboratorio e Imágenes A4
                </span>
            </div>

            <div className="a4-paper a4-printable p-8 sm:p-12 mx-auto max-w-[800px] border border-slate-200 dark:border-slate-700 space-y-6">
                <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-black uppercase text-slate-900">Dr. Samir Moucharrafie</h1>
                        <p className="text-xs font-bold text-slate-700">Orden Médica de Estudios y Laboratorios</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">Fecha: 06/10/2026</span>
                </div>

                <div className="text-xs space-y-4 text-slate-800">
                    <p><strong>Paciente:</strong> Mariana González Rivas | <strong>C.I.:</strong> V-14.230.198</p>
                    <div className="p-4 bg-slate-100 rounded-xl space-y-2">
                        <p className="font-bold text-sm text-slate-900">1. Resonancia Magnética Nuclear (RMN):</p>
                        <p className="pl-4">• Columna Cervical con y sin contraste.</p>
                        <p className="font-bold text-sm text-slate-900 mt-2">2. Estudios Preoperatorios Básicos:</p>
                        <p className="pl-4">• Hematología Completa, Tiempos de Coagulación (PT, PTT, INR), Glicemia, Urea, Creatinina.</p>
                        <p className="pl-4">• Valoración Cardiovascular Preoperatoria.</p>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-300 text-center w-64 mx-auto">
                    <p className="font-serif italic text-2xl text-slate-900">Dr. Samir Moucharrafie</p>
                    <p className="text-[10px] font-bold text-slate-700">Firma y Sello Médico</p>
                </div>
            </div>
        </div>

        {/*  ==========================================  */}
        {/*  VIEW 9: CONSTANCIA DE REPOSO A4             */}
        {/*  ==========================================  */}
        <div id="view-certificate" className={`app-view  space-y-4 ${activeView === 'view-certificate' ? 'active-view' : 'hidden'}`}>
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => { switchView('view-dashboard') }} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                    <i className="fa-solid fa-arrow-left"></i> Volver al Dashboard
                </button>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Módulo: Constancia de Reposo Médico A4
                </span>
            </div>

            <div className="a4-paper a4-printable p-8 sm:p-12 mx-auto max-w-[800px] border border-slate-200 dark:border-slate-700 space-y-6">
                <div className="border-b-2 border-slate-800 pb-4 text-center">
                    <h1 className="text-xl font-black uppercase text-slate-900">Constancia Médica de Reposo</h1>
                    <p className="text-xs font-bold text-slate-700">Dr. Samir Moucharrafie Naime · Neurocirugía</p>
                </div>

                <div className="text-xs space-y-6 leading-relaxed text-slate-800 pt-4">
                    <p>Por medio de la presente se hace constar que el (la) ciudadano(a): <strong>Mariana González Rivas</strong>, titular de la Cédula de Identidad <strong>V-14.230.198</strong>, fue evaluado(a) clínicamente en el día de la fecha, presentando diagnóstico de: <strong>Cervicalgia Aguda Incapacitante (CIE-10: M54.2)</strong>.</p>
                    
                    <p>Por tal motivo, se indica <strong>REPOSO FÍSICO Y LABORAL</strong> por un período de <strong>siete (07) días consecutivos</strong>, comprendidos desde el 06/10/2026 hasta el 13/10/2026 inclusive.</p>
                    
                    <p className="italic text-[11px] text-slate-600">Constancia expedida a petición de la parte interesada para los fines legales que estime convenientes.</p>
                </div>

                <div className="pt-12 border-t border-slate-300 text-center w-64 mx-auto">
                    <p className="font-serif italic text-2xl text-slate-900">Dr. Samir Moucharrafie</p>
                    <p className="text-[10px] font-bold text-slate-700">MPPS 61231 | CMI</p>
                </div>
            </div>
        </div>

    
          </div>
        )}
  
</main>

{/* Sami Copilot Desktop se maneja de forma inteligente a través de <SamiCopilot /> */}

    {/*  Barra Navegación Móvil con Sami Copilot Central  */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-header border-t-white/10 flex justify-between items-center px-4 py-2 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center gap-1 w-1/5 cursor-pointer mobile-nav-item active" id="nav-dashboard" onClick={() => { switchView('view-dashboard') }}>
            <i className="fa-solid fa-house text-lg"></i>
            <span className="text-[9px] font-bold">Inicio</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-sky-500 transition-colors w-1/5 relative cursor-pointer" id="nav-waiting" onClick={() => { switchView('view-waiting-room') }}>
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-red-500"></span>
            <i className="fa-solid fa-users text-lg"></i>
            <span className="text-[9px] font-bold">Espera</span>
        </div>
        
        <div className="sami-mobile-container" onClick={() => { toggleVoicePanel() }}>
            <div className="sami-mobile-bg">
                <div className="avatar-seal">
                    <div className="seal-ring-liquid"></div>
                    <div className="seal-core-glass">
                        <i className="fa-solid fa-brain seal-icon-gradient"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-sky-500 transition-colors w-1/5 cursor-pointer mobile-nav-item" id="nav-recipe" onClick={() => { switchView('view-recipe') }}>
            <i className="fa-solid fa-file-prescription text-lg"></i>
            <span className="text-[9px] font-bold">Récipes</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-sky-500 transition-colors w-1/5 cursor-pointer mobile-nav-item" id="nav-appointments" onClick={() => { switchView('view-appointments') }}>
            <i className="fa-solid fa-calendar-days text-lg"></i>
            <span className="text-[9px] font-bold">Agenda</span>
        </div>
    </nav>

    <div id="app-overlay" className={`glass-overlay ${(isPatientPanelOpen || isVoicePanelOpen) ? 'active' : ''}`} onClick={() => { closeAllPanels() }}></div>

    {/*  Panel de Dictado por Voz (Sami)  */}
    <div id="voice-panel" className="voice-panel">
        <div className="absolute top-4 right-4">
            <button onClick={() => { closeAllPanels() }} className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
        
        <div className="w-12 h-12 mb-3 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)] animate-pulse">
            <i className="fa-solid fa-microphone text-xl"></i>
        </div>
        
        <h3 className="text-[10px] md:text-xs font-bold uppercase text-sky-600 dark:text-sky-400 mb-3 tracking-widest text-center">Sami está escuchando...</h3>
        
        <div className="sound-waves">
            <div className="sound-bar"></div><div className="sound-bar"></div><div className="sound-bar"></div><div className="sound-bar"></div><div className="sound-bar"></div>
        </div>
        
        <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 text-center px-8 italic">
            "Paciente refiere cervicalgia irradiada a hombro derecho..."
        </p>
        
        <button onClick={() => { processDictation() }} className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-sky-500/30 hover:scale-105 transition-transform flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles"></i> Transcribir Nota SOAP
        </button>
    </div>

    {/*  Panel Lateral de Paciente  */}
    <div id="patient-panel" className="side-panel p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg">Perfil del Paciente</h2>
            <button onClick={() => { closeAllPanels() }} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
            <div id="panel-avatar" className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-2xl">MR</div>
            <div>
                <h3 id="panel-patient-name" className="text-xl font-black">Mariana G. Rivas</h3>
                <p id="panel-patient-age" className="text-xs text-slate-500">42 años</p>
                <p id="panel-patient-id" className="text-xs text-slate-500">CI: 14.230.198</p>
            </div>
        </div>

        <div className="space-y-4 flex-1">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Motivo de Consulta (Triage)</p>
                <p id="panel-patient-reason" className="text-sm font-medium">Dolor agudo en región cervical irradiado a hombro derecho.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Alergias</p>
                    <p className="text-sm font-medium text-red-500"><i className="fa-solid fa-triangle-exclamation"></i> Penicilina</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Signos Vitales</p>
                    <p className="text-sm font-medium">120/80 mmHg</p>
                </div>
            </div>
        </div>

        <div className="mt-auto pt-6 space-y-3">
            <button onClick={() => { switchView('view-active-consultation'); closeAllPanels(); }} className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20">
                <i className="fa-solid fa-stethoscope"></i> Abrir Consulta Activa
            </button>
            <button onClick={() => { switchView('view-recipe'); closeAllPanels(); }} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2">
                <i className="fa-solid fa-file-prescription"></i> Emitir Récipe
            </button>
        </div>
    </div>

    {/*  Modal: Nueva Consulta  */}
    <div id="new-patient-modal" className="fixed inset-0 z-[65] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-all duration-300">
        <div className="glass-card max-w-lg w-full rounded-3xl p-6 sm:p-8 relative border border-slate-300 dark:border-sky-500/40 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                        <i className="fa-solid fa-user-plus text-base"></i>
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Nueva Consulta</h3>
                        <p className="text-[10px] text-slate-500">Ingreso a sala de espera y expediente rápido</p>
                    </div>
                </div>
                <button onClick={() => { closeNewPatientModal() }} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="new-patient-form" onsubmit="handleNewPatientSubmit(event)" className="space-y-4">
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Nombre Completo del Paciente</label>
                    <input type="text" id="inp-patient-name" required placeholder="Ej: Carlos Eduardo Méndez" className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Cédula / Documento</label>
                        <input type="text" id="inp-patient-ci" required placeholder="V-18.452.901" className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Edad</label>
                        <input type="number" id="inp-patient-age" required min="1" max="110" placeholder="38" className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" />
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Motivo de Consulta / Triage</label>
                    <input type="text" id="inp-patient-reason" required placeholder="Ej: Lumbociatalgia derecha, parestesias L5" className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button type="button" onClick={() => { closeNewPatientModal() }} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        Cancelar
                    </button>
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/30 active:scale-95 transition">
                        <i className="fa-solid fa-check mr-1.5"></i> Ingresar a Sala
                    </button>
                </div>
            </form>
        </div>
    </div>

    {/*  Toast Notifications  */}
    <div id="toast-container" className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[70] flex flex-col space-y-2 pointer-events-none w-[calc(100%-2rem)] sm:w-auto max-w-sm"></div>

    

      
      <DoctorBusinessCard
        isModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      {/* Copiloto Clínico Real con IA Gemini, Dictado por Voz y Modos de Audio */}
      <SamiCopilot activeView={activeView} />
    </div>
  );
}
