import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { DocType } from '../types';

interface Props {
  activeDoc?: DocType;
  onChangeDoc?: (doc: DocType) => void;
  calibration?: any;
  selectedFieldId?: string | null;
  onSelectField?: (id: string | null) => void;
  onUpdateField?: (updated: any) => void;
  onApplyWholeCalibration?: (newCalib: any) => void;
  onSaveAsFactoryDefault?: () => void;
  onResetDefaults?: () => void;
  onClose?: () => void;
  hasUnsavedChanges?: boolean;
  testMode?: 'real' | 'stress';
  onToggleTestMode?: (mode: 'real' | 'stress') => void;
  activeBgUrl?: string;
  onOpenUploader?: () => void;
}

export const DeveloperCalibrationStudio: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-lg mx-auto my-12 shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-white mb-2">
        HERRAMIENTA DESACTIVADA
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-6">
        El sistema utiliza calibración vectorial automatizada V2 basada en <code className="text-cyan-300 font-mono">*.master.json</code> y el pipeline oficial <code className="text-blue-300 font-mono">PDFDocumentPipelineV2</code>.
      </p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Espacio de Trabajo</span>
        </button>
      )}
    </div>
  );
};
