import React, { useState } from 'react';
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
    <div className={`${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} relative min-h-screen flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-500`}>
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
                      <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-amber-400' : 'fa-moon text-slate-600'} text-sm group-hover:rotate-45 dark:group-hover:-rotate-12 transition-transform duration-300`}></i>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-amber-400 hidden sm:inline ml-2">Guardia</span>
                  </button>
              </div>
          </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 md:pb-6 z-10 relative">
        {children}
      </main>

      

    {/*  Sami Copilot Desktop  */}
    <div className="ai-avatar-container animate-float" id="sami-desktop">
        <div className="sami-wrapper relative">
            <div className="ai-tooltip">Sami Copilot — <span className="text-sky-500 font-normal">IA CMI</span></div>
            <div className="avatar-seal" onClick={() => {}}>
                <div className="seal-ring-liquid"></div>
                <div className="seal-core-glass">
                    <i className="fa-solid fa-brain seal-icon-gradient"></i>
                </div>
            </div>
        </div>
    </div>

    {/*  Barra Navegación Móvil con Sami Copilot Central  */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-header border-t-white/10 flex justify-between items-center px-4 py-2 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center gap-1 w-1/5 cursor-pointer mobile-nav-item active" id="nav-dashboard" onClick={() => {}}>
            <i className="fa-solid fa-house text-lg"></i>
            <span className="text-[9px] font-bold">Inicio</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-sky-500 transition-colors w-1/5 relative cursor-pointer" id="nav-waiting" onClick={() => {}}>
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-red-500"></span>
            <i className="fa-solid fa-users text-lg"></i>
            <span className="text-[9px] font-bold">Espera</span>
        </div>
        
        <div className="sami-mobile-container" onClick={() => {}}>
            <div className="sami-mobile-bg">
                <div className="avatar-seal">
                    <div className="seal-ring-liquid"></div>
                    <div className="seal-core-glass">
                        <i className="fa-solid fa-brain seal-icon-gradient"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-sky-500 transition-colors w-1/5 cursor-pointer mobile-nav-item" id="nav-recipe" onClick={() => {}}>
            <i className="fa-solid fa-file-prescription text-lg"></i>
            <span className="text-[9px] font-bold">Récipes</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-sky-500 transition-colors w-1/5 cursor-pointer mobile-nav-item" id="nav-appointments" onClick={() => {}}>
            <i className="fa-solid fa-calendar-days text-lg"></i>
            <span className="text-[9px] font-bold">Agenda</span>
        </div>
    </nav>

    <div id="app-overlay" className="glass-overlay" onClick={() => {}}></div>

    {/*  Panel de Dictado por Voz (Sami)  */}
    <div id="voice-panel" className="voice-panel">
        <div className="absolute top-4 right-4">
            <button onClick={() => {}} className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
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
        
        <button onClick={() => {}} className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-sky-500/30 hover:scale-105 transition-transform flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles"></i> Transcribir Nota SOAP
        </button>
    </div>

    {/*  Panel Lateral de Paciente  */}
    <div id="patient-panel" className="side-panel p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg">Perfil del Paciente</h2>
            <button onClick={() => {}} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
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
            <button onClick={() => {}} className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20">
                <i className="fa-solid fa-stethoscope"></i> Abrir Consulta Activa
            </button>
            <button onClick={() => {}} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2">
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
                <button onClick={() => {}} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="new-patient-form" onSubmit={() => {}} className="space-y-4">
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
                    <button type="button" onClick={() => {}} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition">
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
    <div id="toast-container" className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[70] flex flex-col space-y-2 pointer-events-none w-[calc(100%-2rem)] sm:w-auto max-w-sm">
    </div>
  );
};
