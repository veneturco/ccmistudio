import React, { useState } from 'react';
import { 
  Pill, 
  FileText, 
  FlaskConical, 
  CalendarCheck, 
  ClipboardList, 
  Share2, 
  Printer, 
  Eye, 
  User, 
  Phone, 
  Calendar, 
  AlertCircle,
  Sparkles,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';
import { DocType, PatientData } from '../types';
import { DOCUMENT_DEFINITIONS } from '../utils/pdfExport';
import { BrandLogo } from './BrandLogo';

interface MobileDocumentCardViewProps {
  activeDoc: DocType;
  patient: PatientData;
  treatmentText?: string;
  indicationsText?: string;
  diagnosisText?: string;
  doctorNotes?: string;
  onOpenWhatsApp: () => void;
  onPrint: () => void;
  onSwitchToA4View: () => void;
  onOpenEditModal?: () => void;
}

export const MobileDocumentCardView: React.FC<MobileDocumentCardViewProps> = ({
  activeDoc,
  patient,
  treatmentText = '',
  indicationsText = '',
  diagnosisText = '',
  doctorNotes = '',
  onOpenWhatsApp,
  onPrint,
  onSwitchToA4View,
  onOpenEditModal,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const activeDef = DOCUMENT_DEFINITIONS?.[activeDoc] || {
    shortName: 'Documento',
    label: 'Documento Médico',
    headerColor: '#092347',
  };

  const handleCopy = (text: string, section: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Formatear líneas de tratamiento en píldoras legibles
  const treatmentLines = treatmentText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const indicationLines = indicationsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pb-24 font-clinical animate-fade-in">
      
      {/* Barra de Control Móvil Superior */}
      <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            <Sparkles className="w-3 h-3" />
            <span>Modo Tarjeta Móvil</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onSwitchToA4View}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          title="Ver hoja A4 física con doble talón y sellos"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ver Hoja A4</span>
        </button>
      </div>

      {/* Tarjeta Principal del Documento */}
      <div className="bg-[#0b1528] rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden">
        
        {/* Cabecera Médica Institucional */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-[#0b1c38] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                {activeDef.label}
              </h2>
              <p className="text-[11px] text-cyan-300 font-medium">
                Dr. Samir Moucharrafie • Orinokia Piso 2
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-blue-900/40 text-blue-200 border border-blue-700/40 font-bold">
            {activeDoc}
          </span>
        </div>

        {/* Ficha Resumen del Paciente */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800/80">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-extrabold text-sm text-white">
                  {patient.fullName || 'Paciente General'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-300">
                <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">
                  {patient.idType || 'V'}-{patient.nationalId || 'S/N'}
                </span>
                {patient.age && <span>{patient.age} años</span>}
                {patient.gender && <span>• {patient.gender === 'M' ? 'Masc.' : 'Fem.'}</span>}
                {patient.phone && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Phone className="w-3 h-3" />
                    {patient.phone}
                  </span>
                )}
              </div>
            </div>

            {patient.allergies && patient.allergies !== 'Negadas' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>Alérgia: {patient.allergies}</span>
              </span>
            )}
          </div>
        </div>

        {/* Contenido Clínico */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* SECCIÓN 1: TRATAMIENTO / RP */}
          {treatmentLines.length > 0 && (
            <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-slate-800 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  <Pill className="w-4 h-4 text-cyan-400" />
                  <span>Rp. / Prescripción Médica</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(treatmentText, 'treatment')}
                  className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 transition cursor-pointer"
                >
                  {copiedSection === 'treatment' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {treatmentLines.map((line, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#061122] border border-blue-900/40 text-xs text-slate-100 font-medium leading-relaxed"
                  >
                    <span className="text-cyan-400 font-bold mr-1.5">{idx + 1}.</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: INDICACIONES */}
          {indicationLines.length > 0 && (
            <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Indicaciones & Posología</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(indicationsText, 'indications')}
                  className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 transition cursor-pointer"
                >
                  {copiedSection === 'indications' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {indicationLines.map((line, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#061122] border border-emerald-950/60 text-xs text-slate-200 leading-relaxed"
                  >
                    <span className="text-emerald-400 font-bold mr-1.5">•</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 3: DIAGNÓSTICO */}
          {diagnosisText && (
            <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-slate-800">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
                Diagnóstico Clínico
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {diagnosisText}
              </p>
            </div>
          )}

        </div>

        {/* Barra de Acciones Principales Móviles */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2.5">
          
          {/* Botón Verde Destacado de WhatsApp */}
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-slate-950 font-black text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition cursor-pointer"
          >
            <Share2 className="w-5 h-5 text-slate-950" />
            <span>Enviar Récipe por WhatsApp al Paciente</span>
          </button>

          {/* Botón de Impresión Oficial A4 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir A4</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToA4View}
              className="py-2.5 px-3 rounded-xl bg-blue-950 hover:bg-blue-900 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 border border-blue-800/60 transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Ver Hoja Oficial</span>
            </button>
          </div>

        </div>

      </div>

      {/* Pie Institucional */}
      <div className="text-center text-[10px] text-slate-300 py-1">
        Centro Clínico Médico Integral (CCMI) • Dr. Samir Moucharrafie (MPPS 61231)
      </div>

    </div>
  );
};
