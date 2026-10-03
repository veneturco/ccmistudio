import React from 'react';
import {
  X,
  Sliders,
  Layers,
  FileText,
  RefreshCw,
  Sparkles,
  UploadCloud,
  FileCheck,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DocType } from '../types';

interface TechnicalToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoc?: DocType;
  showZoneGuides?: boolean;
  onToggleZoneGuides?: () => void;
  onOpenLiveCalibrator?: () => void;
  onOpenUploader?: () => void;
  onOpenOriginalPdf?: () => void;
  onOpenSyncModal?: () => void;
  onLoadDemoCase?: () => void;
}

export const TechnicalToolsModal: React.FC<TechnicalToolsModalProps> = ({
  isOpen,
  onClose,
  activeDoc,
  showZoneGuides = false,
  onToggleZoneGuides,
  onOpenLiveCalibrator,
  onOpenUploader,
  onOpenOriginalPdf,
  onOpenSyncModal,
  onLoadDemoCase,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Herramientas Técnicas y de Calibración</h2>
              <p className="text-xs text-slate-400">CCMI — Gestión avanzada de papelería e ingeniería documental</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {/* Opción 1: Calibrador Milimétrico en Vivo */}
          <div
            onClick={() => {
              onClose();
              if (onOpenLiveCalibrator) onOpenLiveCalibrator();
            }}
            className="group flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-cyan-500/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Calibrador Milimétrico V2 en Vivo
                </h4>
                <p className="text-xs text-slate-400">
                  Visualice las cajas físicas, alinee coordenadas magnéticamente y active simetría paramétrica.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
              Abrir →
            </span>
          </div>

          {/* Opción 2: Gestor de Papelería Institucional */}
          <div
            onClick={() => {
              onClose();
              if (onOpenUploader) onOpenUploader();
            }}
            className="group flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-blue-500/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Papelería Oficial y Subida de Fondos
                </h4>
                <p className="text-xs text-slate-400">
                  Gestione y suba escaneos oficiales de alta resolución (300 DPI) para los 5 documentos.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform">
              Gestionar →
            </span>
          </div>

          {/* Opción 3: Visor de PDF Original Base */}
          <div
            onClick={() => {
              onClose();
              if (onOpenOriginalPdf) onOpenOriginalPdf();
            }}
            className="group flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-indigo-500/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  Visor de PDF Original Base
                </h4>
                <p className="text-xs text-slate-400">
                  Inspeccione las plantillas maestras inmutables sin ninguna capa de sobreimpresión.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
              Ver →
            </span>
          </div>

          {/* Opción 4: Sincronización en la Nube */}
          <div
            onClick={() => {
              onClose();
              if (onOpenSyncModal) onOpenSyncModal();
            }}
            className="group flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-emerald-500/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Sincronización Cloud Firestore
                </h4>
                <p className="text-xs text-slate-400">
                  Respalde y sincronice plantillas entre dispositivos y sesiones del consultorio.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              Sincronizar →
            </span>
          </div>

          {/* Opción 5: Guías de Zona y Demo */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <button
              onClick={() => {
                if (onToggleZoneGuides) onToggleZoneGuides();
              }}
              className="flex items-center gap-2 hover:text-white transition cursor-pointer"
            >
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>{showZoneGuides ? 'Ocultar Guías de Zona' : 'Mostrar Guías de Zona'}</span>
            </button>
            {onLoadDemoCase && (
              <button
                onClick={() => {
                  onClose();
                  onLoadDemoCase();
                }}
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Cargar Caso Demo (Dr. Samir)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
