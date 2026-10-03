import React from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Sliders, 
  Eye, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Contrast, 
  Type, 
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, setPreference, isClinicalLight, isAutoSchedule, resetDefaults } = useTheme();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in print:hidden"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden transition-all duration-200 ${
          isClinicalLight 
            ? 'bg-white border-slate-300 text-slate-900 shadow-blue-900/10' 
            : 'bg-[#0d152a] border-slate-700/80 text-white shadow-cyan-950/40 ring-1 ring-cyan-500/20'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Panel de Ajustes */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${
          isClinicalLight 
            ? 'bg-slate-50 border-slate-200' 
            : 'bg-[#091024] border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
              isClinicalLight 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Configuración de Visualización & Horario
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  isClinicalLight 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                }`}>
                  Dr. Samir Moucharrafie
                </span>
              </div>
              <p className={`text-xs ${isClinicalLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Ajuste automático circadiano y contraste clínico para consultorio y quirófano
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isClinicalLight 
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Cerrar panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 1. SELECCIÓN DE MODO: AUTOMÁTICO POR HORARIO (OPCIÓN 1) VS MANUALES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-500" />
                <span>Modalidad de Iluminación Operativa</span>
              </label>
              <span className={`text-[11px] font-mono ${isClinicalLight ? 'text-blue-700 font-bold' : 'text-cyan-400 font-bold'}`}>
                {isAutoSchedule 
                  ? `⏰ Horario Automático: ${isClinicalLight ? '☀️ Luz Diurna' : '🌙 Modo Oscuro'}` 
                  : isClinicalLight ? '☀️ Modo Manual: Luz Diurna' : '🌙 Modo Manual: Oscuro'}
              </span>
            </div>

            {/* OPCIÓN 1 DESTACADA: CAMBIO AUTOMÁTICO POR HORARIO CLÍNICO */}
            <div
              onClick={() => setPreference('auto_schedule')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                isAutoSchedule
                  ? isClinicalLight
                    ? 'bg-blue-50/90 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-[#0a1835] border-cyan-400 shadow-md ring-2 ring-cyan-400/20'
                  : isClinicalLight
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-[#0a1224] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isAutoSchedule 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : isClinicalLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}>
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm sm:text-base font-black tracking-tight ${
                        isClinicalLight ? 'text-blue-950' : 'text-white'
                      }`}>
                        Opción 1: Automático por Horario Clínico
                      </h3>
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                        Recomendado
                      </span>
                    </div>
                    <p className={`text-xs font-semibold ${
                      isClinicalLight ? 'text-blue-800' : 'text-cyan-300'
                    }`}>
                      07:00 AM – 06:30 PM: Luz Diurna • 06:30 PM – 07:00 AM: Modo Oscuro
                    </p>
                  </div>
                </div>

                {isAutoSchedule && (
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full font-mono shadow-xs shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Activo
                  </span>
                )}
              </div>

              <p className={`text-xs leading-relaxed mt-2 ${
                isClinicalLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                La estación de trabajo evalúa el reloj local cada 30 segundos y cambia automáticamente de tema al comenzar y terminar la jornada de consultorio, sin necesidad de intervención manual.
              </p>

              <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                isClinicalLight
                  ? 'bg-white border-blue-200 text-blue-950 font-bold'
                  : 'bg-[#060e22] border-slate-800 text-cyan-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isClinicalLight ? 'bg-amber-500' : 'bg-cyan-400'} animate-ping`}></span>
                  <span>Estado actual del reloj: {isClinicalLight ? '☀️ 07:00 - 18:30 (Modo Diurno)' : '🌙 18:30 - 07:00 (Modo Nocturno)'}</span>
                </div>
                <span className="text-[11px] opacity-80">Automático</span>
              </div>
            </div>

            {/* SELECCIÓN MANUAL FIJA (Por si el doctor desea fijar un modo siempre) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Tarjeta: Luz Clínica Fija */}
              <div
                onClick={() => setPreference('clinical_light')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                  settings.preference === 'clinical_light'
                    ? 'bg-blue-50/70 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : isClinicalLight
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-[#0a1224] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600">
                    <Sun className="w-4 h-4" />
                  </div>
                  {settings.preference === 'clinical_light' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" /> Fijo Siempre
                    </span>
                  )}
                </div>

                <h4 className={`text-xs font-bold tracking-tight mb-0.5 ${
                  isClinicalLight ? 'text-slate-900' : 'text-slate-200'
                }`}>
                  Fijo: 'Clinical Light' (Luz Diurna)
                </h4>
                <p className={`text-[11px] leading-relaxed ${
                  isClinicalLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Mantiene siempre el fondo blanco y alto contraste las 24 horas.
                </p>
              </div>

              {/* Tarjeta: Modo Oscuro Fijo */}
              <div
                onClick={() => setPreference('dark')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                  settings.preference === 'dark'
                    ? 'bg-[#081126] border-cyan-400 shadow-md ring-2 ring-cyan-400/20'
                    : isClinicalLight
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-[#0a1224] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  {settings.preference === 'dark' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full font-mono shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" /> Fijo Siempre
                    </span>
                  )}
                </div>

                <h4 className={`text-xs font-bold tracking-tight mb-0.5 ${
                  isClinicalLight ? 'text-slate-900' : 'text-slate-200'
                }`}>
                  Fijo: Modo Oscuro Ejecutivo
                </h4>
                <p className={`text-[11px] leading-relaxed ${
                  isClinicalLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Mantiene siempre el fondo oscuro de bajo brillo las 24 horas.
                </p>
              </div>
            </div>
          </div>

          {/* 2. REFUERZO DE CONTRASTE & ACCESIBILIDAD CLÍNICA */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            isClinicalLight 
              ? 'bg-slate-50/80 border-slate-200' 
              : 'bg-[#091224] border-slate-800/80'
          }`}>
            <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <Contrast className="w-4 h-4 text-cyan-500" />
              <span>Optimizaciones para Lectura Médica Rápida</span>
            </h4>

            {/* Toggle: Contraste Reforzado (Bordes negros/azul profundo) */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className={`text-xs font-bold ${isClinicalLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  Refuerzo de Bordes y Contraste Tipográfico
                </p>
                <p className={`text-[11px] ${isClinicalLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Intensifica la delimitación de campos médicos para mayor nitidez sin reflejos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.highContrast ? 'bg-blue-600' : isClinicalLight ? 'bg-slate-300' : 'bg-slate-700'
                }`}
                title="Alternar contraste reforzado"
              >
                <span 
                  className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`} 
                />
              </button>
            </div>

            {/* Selector: Tamaño de letra para distancia de escritorio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <p className={`text-xs font-bold flex items-center gap-1 ${isClinicalLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  <Type className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Escala de Letra en Formularios</span>
                </p>
                <p className={`text-[11px] ${isClinicalLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Ajusta el tamaño del texto para lectura cómoda desde el escritorio médico.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => updateSettings({ fontSize: 'normal' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    settings.fontSize === 'normal'
                      ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Estándar (100%)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ fontSize: 'large' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    settings.fontSize === 'large'
                      ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Grande (+10%)
                </button>
              </div>
            </div>
          </div>

          {/* Información de Persistencia */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Su preferencia se sincroniza al instante y se recuerda automáticamente en cada inicio de sesión.
            </span>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isClinicalLight 
            ? 'bg-slate-50 border-slate-200' 
            : 'bg-[#091024] border-slate-800'
        }`}>
          <button
            type="button"
            onClick={resetDefaults}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
              isClinicalLight 
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Volver a la Opción 1 automática predeterminada"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Opción 1</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer"
          >
            <span>Listo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
