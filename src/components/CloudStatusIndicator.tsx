import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  Sparkles,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import { firestorePatientSync, SyncStatus } from '../cloud/FirestorePatientSync';
import { CLINICAL_TENANT_ID } from '../firebase/config';

interface Props {
  variant?: 'compact' | 'detailed' | 'minimal';
  className?: string;
}

export const CloudStatusIndicator: React.FC<Props> = ({ 
  variant = 'compact',
  className = '' 
}) => {
  const [status, setStatus] = useState<SyncStatus>(firestorePatientSync.getStatus());
  const [lastBackup, setLastBackup] = useState<Date | null>(firestorePatientSync.getLastBackupTimestamp());
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Suscripción reactiva a cambios de estado y fecha de respaldo
  useEffect(() => {
    const unsubStatus = firestorePatientSync.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubTimestamp = firestorePatientSync.onBackupTimestampChange((timestamp) => {
      setLastBackup(timestamp);
    });

    // Actualizar el cálculo de tiempo relativo cada 15 segundos
    const interval = setInterval(() => {
      setLastBackup(firestorePatientSync.getLastBackupTimestamp());
    }, 15000);

    return () => {
      unsubStatus();
      unsubTimestamp();
      clearInterval(interval);
    };
  }, []);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Formateador de tiempo relativo en español
  const getRelativeTimeString = (date: Date | null): string => {
    if (!date) return 'Sin respaldo previo';
    const now = new Date();
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffSeconds < 15) return 'Hace un momento';
    if (diffSeconds < 60) return `Hace ${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return date.toLocaleDateString('es-VE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleForceSync = async () => {
    if (isManualSyncing) return;
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await firestorePatientSync.forceSyncNow();
      if (res.success) {
        setSyncFeedback('¡Nube 100% Sincronizada con Firestore!');
      } else {
        setSyncFeedback(res.message);
      }
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Error temporal de conexión');
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const isConnected = status === 'connected' || status === 'ready';
  const isSyncing = status === 'syncing' || isManualSyncing;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Botón Indicador Principal */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95 ${
          isConnected
            ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border-emerald-500/40 shadow-xs'
            : isSyncing
            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border-amber-500/40 animate-pulse'
            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
        }`}
        title="Estado de Respaldo en la Nube (Firebase Firestore) - Clic para ver detalles multidispositivo"
      >
        {/* Icono con LED de estado */}
        <div className="relative flex items-center justify-center shrink-0">
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          ) : isConnected ? (
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-slate-400" />
          )}

          {/* LED Pulsante */}
          <span 
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-emerald-400 ring-2 ring-emerald-950 shadow-xs shadow-emerald-400'
                : isSyncing
                ? 'bg-amber-400 ring-2 ring-amber-950 animate-ping'
                : 'bg-slate-500 ring-2 ring-slate-950'
            }`} 
          />
        </div>

        {/* Texto Dinámico */}
        <div className="flex flex-col items-start text-left leading-tight">
          <div className="flex items-center gap-1 font-bold text-[11px]">
            <span className={isConnected ? 'text-emerald-300' : isSyncing ? 'text-amber-300' : 'text-slate-300'}>
              {isSyncing ? 'Sincronizando...' : isConnected ? 'Nube Activa' : 'Modo Local'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-transform group-hover:translate-y-0.5" />
          </div>
          <span className="text-[9.5px] font-mono text-slate-400 font-normal">
            {isSyncing ? 'Subiendo datos' : getRelativeTimeString(lastBackup)}
          </span>
        </div>
      </button>

      {/* Menú Desplegable Informativo: Paz Mental Multidispositivo */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0b1528]/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 z-50 p-4.5 text-slate-200 ring-1 ring-cyan-500/20 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Cabecera del Panel */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white tracking-wide uppercase">
                  Respaldo Central en la Nube
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Google Firebase Firestore • Tenant CCMI
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDropdownOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tarjeta de Garantía Multidispositivo */}
          <div className="my-3 p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border border-cyan-500/30 text-[11px] space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Garantía de Disponibilidad Total</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Toda la información médica (pacientes, historias, diagnósticos, órdenes y papelería master) 
              está respaldada en la nube institucional. <strong>Si los doctores cambian de teléfono o inician sesión desde otra computadora</strong>, 
              todos sus datos estarán disponibles inmediatamente.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Teléfonos Móviles
              </span>
              <span className="flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-blue-400" /> Consultorio / PC
              </span>
            </div>
          </div>

          {/* Estadísticas de Conexión en Tiempo Real */}
          <div className="space-y-2 text-xs py-1">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Estado de Conexión</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isConnected ? 'Conectado en Tiempo Real' : isSyncing ? 'Sincronizando' : 'Modo Offline Seguro'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Último Respaldo Confirmado</span>
              <span className="font-mono font-bold text-[11px] text-cyan-300">
                {lastBackup 
                  ? lastBackup.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                  : 'En curso'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Identificador de Clínica</span>
              <span className="font-mono text-[10px] font-bold text-slate-300">
                {CLINICAL_TENANT_ID}
              </span>
            </div>
          </div>

          {/* Feedback de sincronización forzada */}
          {syncFeedback && (
            <div className="mt-2.5 p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Botón de Acción Directa: Forzar Sincronización Manual */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleForceSync}
              disabled={isManualSyncing}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                isManualSyncing
                  ? 'bg-slate-800 text-slate-400 cursor-wait'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-cyan-950/40 active:scale-98'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Sincronizando con Firestore...' : 'Sincronizar y Forzar Respaldo Ahora'}</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Usa este botón para verificar la sincronización antes de cambiar de equipo o salir de consulta.
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
