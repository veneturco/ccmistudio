import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  User, 
  Calendar, 
  Pill, 
  FileText, 
  FlaskConical, 
  ShieldCheck, 
  Copy, 
  RotateCcw, 
  Check, 
  ChevronRight, 
  Clock, 
  Sparkles,
  Search,
  ArrowRight
} from 'lucide-react';
import { ProcessedDocumentResult, DocType, PatientData } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPatient: PatientData;
  allHistory: ProcessedDocumentResult[];
  onReissueTreatment?: (recipeLeft: string, indicationsRight: string, diagnosis?: string) => void;
  onCopyDiagnosis?: (diagnosis: string) => void;
  onSelectHistoricalDoc?: (doc: ProcessedDocumentResult) => void;
}

export const PatientTimelineDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  currentPatient,
  allHistory,
  onReissueTreatment,
  onCopyDiagnosis,
  onSelectHistoricalDoc,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtrar el historial para coincidir con la cédula o nombre del paciente actual
  const patientCleanId = (currentPatient.idNumber || '').replace(/[^0-9]/g, '');
  const patientCleanName = (currentPatient.fullName || '').trim().toLowerCase();

  const matchingRecords = allHistory.filter((item) => {
    if (!item.patient) return false;
    const itemCleanId = (item.patient.nationalId || '').replace(/[^0-9]/g, '');
    const itemCleanName = (item.patient.fullName || '').trim().toLowerCase();

    const matchesId = patientCleanId && itemCleanId && (patientCleanId === itemCleanId || itemCleanId.includes(patientCleanId));
    const matchesName = patientCleanName && itemCleanName && (itemCleanName.includes(patientCleanName) || patientCleanName.includes(itemCleanName));

    return matchesId || matchesName;
  });

  const filteredRecords = matchingRecords.filter((rec) => {
    if (filterType === 'all') return true;
    return rec.documentType === filterType;
  });

  const handleReissue = (rec: ProcessedDocumentResult) => {
    if (!onReissueTreatment) return;

    // Extraer medicamentos estructurados o notas
    let rxLeft = '';
    let indicationsRight = '';

    if (rec.structuredData?.medications && rec.structuredData.medications.length > 0) {
      rxLeft = rec.structuredData.medications
        .map((m, i) => `${i + 1}. ${m.drug} ${m.dose || ''}\n   Tomar: ${m.frequency || ''} por ${m.duration || ''}`)
        .join('\n\n');

      indicationsRight = (rec.structuredData.generalIndications || []).join('\n• ');
    } else {
      rxLeft = rec.structuredData?.summaryNote || 'Tratamiento previo';
      indicationsRight = 'Seguir indicaciones previas';
    }

    onReissueTreatment(rxLeft, indicationsRight, rec.structuredData?.diagnosisPrincipal);
    setCopiedId(rec.id);
    setTimeout(() => {
      setCopiedId(null);
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-fade-in print:hidden"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#0b1426] border-l border-slate-700/80 text-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Drawer */}
        <div className="p-5 border-b border-slate-800 bg-[#070e1c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/30 text-cyan-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Expediente 360° del Paciente
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-cyan-300 border border-blue-800/40">
                  {matchingRecords.length} Consultas
                </span>
              </div>
              <p className="text-xs text-slate-300 font-bold truncate max-w-[280px]">
                {currentPatient.fullName || 'Paciente'} • CI: {currentPatient.idNumber || 'S/N'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              filterType === 'all' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({matchingRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('recipe')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              filterType === 'recipe' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            💊 Récipes
          </button>
          <button
            type="button"
            onClick={() => setFilterType('informe')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              filterType === 'informe' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Informes
          </button>
          <button
            type="button"
            onClick={() => setFilterType('lab_order')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              filterType === 'lab_order' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            🧪 Estudios
          </button>
        </div>

        {/* Lista Cronológica de Consultas */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                No se encontraron consultas previas para esta cédula o nombre.
              </p>
              <p className="text-[11px] text-slate-500">
                Al guardar el primer récipe o informe, se creará su línea de tiempo automáticamente.
              </p>
            </div>
          ) : (
            filteredRecords.map((rec, index) => (
              <div 
                key={rec.id || index}
                className="p-4 rounded-2xl bg-[#0f1b33] border border-slate-700/70 hover:border-cyan-500/40 shadow-md space-y-3 transition"
              >
                {/* Cabecera del Registro */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {rec.docNumber || `DOC-${index + 1}`}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {rec.documentType === 'recipe' ? '💊 Récipe Médico' : rec.documentType === 'informe' ? '📋 Informe Médico' : '📄 Documento'}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {rec.patient?.date || 'Fecha registrada'}
                  </span>
                </div>

                {/* Diagnóstico Principal */}
                {rec.structuredData?.diagnosisPrincipal && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                      Diagnóstico Registrado
                    </span>
                    <p className="text-white font-semibold">
                      {rec.structuredData.diagnosisPrincipal}
                    </p>
                  </div>
                )}

                {/* Lista de Medicamentos si es Récipe */}
                {rec.structuredData?.medications && rec.structuredData.medications.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      Medicamentos Prescritos ({rec.structuredData.medications.length})
                    </span>
                    <div className="space-y-1">
                      {rec.structuredData.medications.map((m, mi) => (
                        <div key={mi} className="flex items-start gap-1.5 text-[11px] text-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          <span><strong>{m.drug}</strong> {m.dose} • {m.frequency} ({m.duration})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones de Acción Rápida para el Doctor */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  {rec.structuredData?.diagnosisPrincipal && onCopyDiagnosis && (
                    <button
                      type="button"
                      onClick={() => onCopyDiagnosis(rec.structuredData.diagnosisPrincipal)}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-cyan-400" />
                      <span>Copiar Dx</span>
                    </button>
                  )}

                  {onReissueTreatment && (
                    <button
                      type="button"
                      onClick={() => handleReissue(rec)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-sm ${
                        copiedId === rec.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white active:scale-95'
                      }`}
                    >
                      {copiedId === rec.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Cargado en Récipe!</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-emitir Tratamiento</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Pie del Drawer */}
        <div className="p-4 border-t border-slate-800 bg-[#070e1c] flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Re-emisión clínica con 1 clic
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
