import React from 'react';
import { 
  X, 
  Check, 
  FileText, 
  User, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  Calendar, 
  Clock, 
  FileSpreadsheet,
  Activity,
  Layers
} from 'lucide-react';
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

  const rawData = legacyExtractedData || proposal?.extracted || (proposal as any)?.payload || {};

  // Extraer campos de forma limpia y legible para humanos
  const patient = rawData.patient || {};
  const patientName = patient.fullName || patient.patientName || patient.name || 'Sin especificar';
  const patientId = patient.idNumber || patient.nationalId || patient.cedula || 'Sin cédula';
  const patientAge = patient.age ? `${patient.age} años` : 'Edad no indicada';
  
  const diagnosis = 
    rawData.diagnosisPrincipal || 
    rawData.diagnosis || 
    rawData.informe?.diagnostico || 
    rawData.informe?.diagnosis || 
    'No especificado';

  // Medicamentos / Récipe
  const recipeData = rawData.recipeDual || rawData.recipe || {};
  const rxLeft = recipeData.pharmacy || recipeData.rxLeft || rawData.treatment || '';
  const rxRight = recipeData.patientIndications || recipeData.indicationsRight || rawData.indications || '';

  // Exámenes de Laboratorio y Neuroimágenes
  const labSource = rawData.ordenLab || rawData.labAndImagesOrder || rawData.laboratory || {};
  const labTestsList: string[] = [];
  if (Array.isArray(labSource.laboratorios)) labTestsList.push(...labSource.laboratorios);
  if (Array.isArray(labSource.tests)) labTestsList.push(...labSource.tests);
  if (Array.isArray(labSource.labTests)) labTestsList.push(...labSource.labTests);
  if (labSource.labTests && typeof labSource.labTests === 'object' && !Array.isArray(labSource.labTests)) {
    Object.entries(labSource.labTests).forEach(([k, v]) => { if (Boolean(v)) labTestsList.push(k); });
  }

  const neuroTestsList: string[] = [];
  if (Array.isArray(labSource.neuroimagen)) neuroTestsList.push(...labSource.neuroimagen);
  if (Array.isArray(labSource.neuroimagingTests)) neuroTestsList.push(...labSource.neuroimagingTests);
  if (Array.isArray(labSource.estudios)) neuroTestsList.push(...labSource.estudios);
  if (labSource.neuroimagingTests && typeof labSource.neuroimagingTests === 'object' && !Array.isArray(labSource.neuroimagingTests)) {
    Object.entries(labSource.neuroimagingTests).forEach(([k, v]) => { if (Boolean(v)) neuroTestsList.push(k); });
  }

  const otherExams = labSource.otrosEstudios || labSource.otherExams || '';

  // Días de Reposo
  const restDays = 
    rawData.restDays || 
    rawData.constancia?.restDays || 
    rawData.restCertificate?.restDays || 
    null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-[#0b1329] shadow-2xl text-slate-100 ring-1 ring-cyan-500/20">
        
        {/* Encabezado Profesional */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#070e1d] px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Verificación de Dictado Clínico
              </h3>
              <p className="text-xs text-slate-400">
                Resumen legible para aplicar en los 5 documentos oficiales
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido en Tarjetas Claras y Ordenadas */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs text-slate-300">
          
          {/* Tarjeta 1: Datos del Paciente y Diagnóstico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Paciente
              </span>
              <p className="text-sm font-bold text-white">{patientName}</p>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold">CI: {patientId}</span>
                <span>•</span>
                <span>{patientAge}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Diagnóstico Principal
              </span>
              <p className="text-sm font-bold text-emerald-300 leading-snug">{diagnosis}</p>
              {restDays && (
                <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  <span>Reposo médico indicado: {restDays} días</span>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta 2: Prescripción Médica (Récipe) */}
          {(rxLeft || rxRight) && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" />
                Tratamiento y Prescripción Médica (Récipe)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {rxLeft && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Farmacia (Fármaco y Dosis)</span>
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{rxLeft}</p>
                  </div>
                )}
                {rxRight && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Indicaciones al Paciente</span>
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{rxRight}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tarjeta 3: Exámenes de Laboratorio e Imágenes Solicitadas */}
          {(labTestsList.length > 0 || neuroTestsList.length > 0 || otherExams) && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2.5">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" />
                Estudios y Exámenes Solicitados
              </span>
              
              <div className="space-y-2 text-xs">
                {labTestsList.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                      Laboratorio Clínico (Página 1):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {labTestsList.map((t, idx) => (
                        <span key={idx} className="bg-purple-950/80 border border-purple-500/40 text-purple-200 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {neuroTestsList.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                      Neuroimágenes y Especiales (Página 2):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {neuroTestsList.map((n, idx) => (
                        <span key={idx} className="bg-sky-950/80 border border-sky-500/40 text-sky-200 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                          ✓ {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {otherExams && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Otros Estudios Específicos:</span>
                    <p className="text-slate-300 mt-0.5">{otherExams}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tarjeta 4: Informe Médico Resumen */}
          {rawData.informe?.bodyText && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Resumen para el Informe Médico
              </span>
              <p className="text-xs text-slate-300 line-clamp-3 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                "{rawData.informe.bodyText}"
              </p>
            </div>
          )}

        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#070e1d] px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onRejected();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Descartar
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmed(rawData);
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-950/60 cursor-pointer active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>Confirmar y Aplicar a los 5 Documentos</span>
          </button>
        </div>

      </div>
    </div>
  );
};
