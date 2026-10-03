import React from 'react';
import { X, Check, FileText, AlertCircle } from 'lucide-react';
import { ClinicalProposal } from '../clinicalAssistant/types';

interface ClinicalProposalReviewModalProps {
  isOpen: boolean;
  proposal: ClinicalProposal | null;
  legacyExtractedData?: any;
  onClose: () => void;
  onConfirmed: (data: any) => void;
  onRejected: () => void;
}

export const ClinicalProposalReviewModal: React.FC<ClinicalProposalReviewModalProps> = ({
  isOpen,
  proposal,
  legacyExtractedData,
  onClose,
  onConfirmed,
  onRejected,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Revisión de Dictado Clínico</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-slate-300">
          <p className="text-slate-400 leading-relaxed">
            Revise los datos extraídos antes de sincronizar con los 5 documentos médicos:
          </p>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(legacyExtractedData || proposal?.extracted || {}, null, 2)}
          </pre>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <button
            onClick={() => {
              onRejected();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Descartar
          </button>
          <button
            onClick={() => {
              onConfirmed(legacyExtractedData || proposal?.extracted || {});
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/20"
          >
            <Check className="h-4 w-4" />
            <span>Confirmar y Aplicar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
