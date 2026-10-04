import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileCheck2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Building2,
  Stethoscope,
  AlertTriangle,
  Crosshair
} from 'lucide-react';
import { ProcessedDocumentResult } from '../types';
import { BrandLogo } from './BrandLogo';
import { OfficialMedicalStamp } from './OfficialMedicalStamp';
import { 
  downloadBlob
} from '../utils/pdfExport';
import { PDFDocumentPipelineV2 } from '../utils/PDFDocumentPipelineV2';
import { ClinicalWorkspaceContext } from '../calibration/SemanticDataMapperV2';
import { LiveCoordinateCalibratorModal } from './LiveCoordinateCalibratorModal';
import { OptimizedA4Background } from './OptimizedA4Background';
interface Props {
  document: ProcessedDocumentResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<Props> = ({ document, isOpen, onClose }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showCalibratorModal, setShowCalibratorModal] = useState<boolean>(false);

  if (!isOpen || !document) return null;

  // Determinar la plantilla original oficial correspondiente
  const getTemplateBg = (type: string) => {
    switch (type) {
      case 'recipe':
        return '/templates/recipes_bg.jpg';
      case 'report':
        return '/templates/informe_bg.jpg';
      case 'certificate':
        return '/templates/constancia_bg.jpg';
      case 'lab_order':
        return '/templates/orden_lab_bg.jpg';
      case 'history':
        return '/templates/historia_bg.jpg';
      default:
        return '/templates/recipes_bg.jpg';
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const safeName = (document.patient.fullName || 'Paciente').replace(/\s+/g, '_');
      const fileName = `${document.docNumber || 'DOC'}_${safeName}.pdf`;

      const rxLeft =
        document.structuredData?.recipe?.rxLeft ||
        document.structuredData?.recipeDual?.pharmacy ||
        (document.structuredData as any)?.pharmacyText ||
        '';

      const rxRight =
        document.structuredData?.recipe?.indicationsRight ||
        document.structuredData?.recipeDual?.patientIndications ||
        (document.structuredData as any)?.indicationsText ||
        '';

      const context: ClinicalWorkspaceContext = {
        patient: {
          fullName: document.patient.fullName,
          idNumber: document.patient.idType
            ? `${document.patient.idType}-${document.patient.nationalId || ''}`
            : document.patient.nationalId || '',
          idType: document.patient.idType,
          nationalId: document.patient.nationalId,
          age: document.patient.age,
          date: document.generatedAt || new Date().toLocaleDateString('es-VE'),
          phone: document.patient.phone,
          address: document.patient.address,
          condition: (document.patient as any)?.condition || 'Paciente',
        },
        clinical: document.structuredData,
        documentDate: document.generatedAt || new Date().toLocaleDateString('es-VE'),
        recipeLeft: rxLeft,
        recipeRight: rxRight,
        certificateText:
          (document.structuredData as any)?.certificateText ||
          document.structuredData?.summaryNote ||
          '',
        notes:
          document.structuredData?.summaryNote ||
          document.structuredData?.clinicalSummary ||
          '',
      };

      const result = await PDFDocumentPipelineV2.generateDocument({
        documentType: document.documentType,
        context,
        customFileName: fileName,
      });

      downloadBlob(result.pdfBytes, fileName);
    } catch (err: any) {
      console.error('Error exportando documento oficial V2:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getDocTypeTitle = (type: string) => {
    switch (type) {
      case 'recipe': return 'RÉCIPE MÉDICO Y TRATAMIENTO';
      case 'report': return 'INFORME MÉDICO ESPECIALIZADO';
      case 'lab_order': return 'ORDEN DE EXÁMENES Y ESTUDIOS';
      case 'certificate': return 'CONSTANCIA MÉDICA DE REPOSO';
      default: return 'DOCUMENTO CLÍNICO OFICIAL';
    }
  };

  const bgUrl = getTemplateBg(document.documentType);

  const rxPharmacyPreview =
    (document.structuredData as any)?.recipe?.rxLeft ||
    (document.structuredData as any)?.recipeDual?.pharmacy ||
    (document.structuredData as any)?.pharmacyText ||
    '';

  const rxIndicationsPreview =
    (document.structuredData as any)?.recipe?.indicationsRight ||
    (document.structuredData as any)?.recipeDual?.patientIndications ||
    (document.structuredData as any)?.indicationsText ||
    '';

  return (
    <div 
      id="document-preview-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white"
    >
      <div 
        id="document-preview-modal-card"
        className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none"
      >
        {/* Modal Topbar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs">
              <BrandLogo size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Papelería Oficial: {getDocTypeTitle(document.documentType)}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ARQUITECTURA V2 • VECTOR OVERLAY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Folio: <span className="font-mono font-medium text-slate-300">{document.docNumber}</span> | Paciente: <span className="font-semibold text-slate-200">{document.patient.fullName}</span> | Autoridad: <span className="text-blue-400 font-medium">MASTER PDF + VECTOR OVERLAY</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-live-calibrator"
              onClick={() => setShowCalibratorModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Abrir calibrador interactivo superpuesto para arrastrar elementos y obtener coordenadas exactas"
            >
              <Crosshair className="w-4 h-4 text-blue-400" />
              <span>Calibrar Coordenadas (Drag & Drop)</span>
            </button>
            <button
              id="btn-print-doc"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF Oficial'}</span>
            </button>
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Degraded Mode Warning */}
        {document.degradedMode && (
          <div className="bg-amber-950/60 border-b border-amber-500/30 px-6 py-3 flex items-center gap-3 text-amber-200 text-xs sm:text-sm print:hidden">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-amber-300">Modo degradado: </span>
              Sin conexión con el servicio de IA — los datos no fueron procesados por Gemini, revisa manualmente.
            </div>
          </div>
        )}

        {/* Printable Document Canvas (Paper sheet simulator with official background) */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center">
          <div 
            ref={printAreaRef}
            id="printable-medical-sheet"
            className="relative bg-white shadow-2xl text-slate-900 overflow-hidden"
            style={{
              width: '794px',
              height: '1123px',
              minHeight: '1123px',
              maxHeight: '1123px',
              fontFamily: "'Montserrat', sans-serif",
              boxSizing: 'border-box',
            }}
          >
            {/* Progressive Lazy-Loaded A4 Stationery Layer (300 DPI) */}
            <OptimizedA4Background 
              src={bgUrl || ''} 
              isCustomOriginal={false} 
              docTitle={document.documentType} 
            />

            {/* RÉCIPE MÉDICO: Estampado directo sobre recipes_bg.jpg (Doble Talón Simétrico) */}
            {document.documentType === 'recipe' && (
              <div className="relative w-[794px] h-[1123px]">
                {/* === CABECERA TALÓN IZQUIERDO (FARMACIA) === */}
                <div className="absolute top-[105px] left-[45px] w-[175px] h-[26px] flex items-center text-slate-900 font-bold text-xs truncate">
                  {document.patient.fullName}
                </div>
                <div className="absolute top-[105px] left-[225px] w-[75px] h-[26px] flex items-center text-slate-900 font-bold text-xs truncate">
                  {document.patient.idType ? `${document.patient.idType}-${document.patient.nationalId}` : document.patient.nationalId}
                </div>
                <div className="absolute top-[105px] left-[305px] w-[35px] h-[26px] flex items-center justify-center text-slate-900 font-bold text-xs">
                  {document.patient.age ? `${document.patient.age}` : ''}
                </div>
                <div className="absolute top-[105px] left-[345px] w-[35px] h-[26px] flex items-center justify-center text-slate-900 font-bold text-[10px]">
                  {document.generatedAt || new Date().toLocaleDateString('es-VE')}
                </div>

                {/* === CABECERA TALÓN DERECHO (INDICACIONES) === */}
                <div className="absolute top-[105px] left-[415px] w-[175px] h-[26px] flex items-center text-slate-900 font-bold text-xs truncate">
                  {document.patient.fullName}
                </div>
                <div className="absolute top-[105px] left-[595px] w-[75px] h-[26px] flex items-center text-slate-900 font-bold text-xs truncate">
                  {document.patient.idType ? `${document.patient.idType}-${document.patient.nationalId}` : document.patient.nationalId}
                </div>
                <div className="absolute top-[105px] left-[675px] w-[35px] h-[26px] flex items-center justify-center text-slate-900 font-bold text-xs">
                  {document.patient.age ? `${document.patient.age}` : ''}
                </div>
                <div className="absolute top-[105px] left-[715px] w-[35px] h-[26px] flex items-center justify-center text-slate-900 font-bold text-[10px]">
                  {document.generatedAt || new Date().toLocaleDateString('es-VE')}
                </div>

                {/* Talón Izquierdo: Farmacia */}
                <div className="absolute top-[136px] left-[45px] w-[335px] h-[760px] text-slate-900 text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                  {rxPharmacyPreview ? (
                    <div>{rxPharmacyPreview}</div>
                  ) : Array.isArray(document.structuredData?.medications) && document.structuredData.medications.length > 0 ? (
                    document.structuredData.medications.map((med, i) => (
                      <div key={i} className="mb-3">
                        <p className="font-bold text-slate-950">
                          {i + 1}. {med.drug} ({med.dose})
                        </p>
                        <p className="text-slate-800 text-[11px]">
                          Dispensar: {med.duration || 'Tratamiento completo'}
                        </p>
                      </div>
                    ))
                  ) : null}
                  {document.structuredData?.diagnosisPrincipal && (
                    <div className="mt-4 pt-3 border-t border-slate-300/80 text-[11px]">
                      <span className="font-bold text-blue-900">Dx: </span>
                      {document.structuredData.diagnosisPrincipal}
                    </div>
                  )}
                </div>

                {/* Talón Derecho: Indicaciones al Paciente */}
                <div className="absolute top-[136px] left-[415px] w-[335px] h-[760px] text-slate-900 text-xs font-medium leading-relaxed whitespace-pre-wrap">
                  {rxIndicationsPreview ? (
                    <div>{rxIndicationsPreview}</div>
                  ) : Array.isArray(document.structuredData?.medications) && document.structuredData.medications.length > 0 ? (
                    document.structuredData.medications.map((med, i) => (
                      <div key={i} className="mb-3">
                        <p className="font-bold text-blue-950">
                          {i + 1}. {med.drug}
                        </p>
                        <p className="text-slate-800 text-[11px]">
                          Tomar {med.dose} cada {med.frequency} por {med.duration}.
                        </p>
                        {med.instructions && (
                          <p className="text-slate-600 text-[10.5px] italic">
                            Nota: {med.instructions}
                          </p>
                        )}
                      </div>
                    ))
                  ) : null}

                  {document.structuredData?.generalIndications && document.structuredData.generalIndications.length > 0 && !rxIndicationsPreview && (
                    <div className="mt-4 pt-3 border-t border-slate-300/80">
                      <p className="font-bold text-[11px] text-blue-950 mb-1">Recomendaciones:</p>
                      <ul className="list-disc list-inside text-[10.5px] text-slate-700 space-y-0.5">
                        {document.structuredData.generalIndications.map((ind, idx) => (
                          <li key={idx}>{ind}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sello Oficial en Talón Farmacia */}
                <div className="absolute top-[900px] left-[230px] scale-75 origin-top-left">
                  <OfficialMedicalStamp size="sm" inkColor="navy" />
                </div>
                {/* Sello Oficial en Talón Paciente */}
                <div className="absolute top-[900px] left-[600px] scale-75 origin-top-left">
                  <OfficialMedicalStamp size="sm" inkColor="navy" />
                </div>
              </div>
            )}

            {/* INFORME MÉDICO: Estampado sobre informe_bg.jpg */}
            {document.documentType === 'report' && (
              <div className="relative w-[794px] h-[1123px]">
                {/* Paciente y Cédula */}
                <div className="absolute top-[152px] left-[65px] w-[420px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.fullName}
                </div>
                <div className="absolute top-[152px] left-[495px] w-[235px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.idType ? `${document.patient.idType}-${document.patient.nationalId}` : document.patient.nationalId}
                </div>
                {/* Edad y Fecha */}
                <div className="absolute top-[184px] left-[65px] w-[340px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.age ? (String(document.patient.age).includes('año') ? String(document.patient.age) : `${document.patient.age} años`) : ''}
                </div>
                <div className="absolute top-[184px] left-[415px] w-[315px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.generatedAt || new Date().toLocaleDateString('es-VE')}
                </div>

                {/* Cuerpo del Informe */}
                <div className="absolute top-[225px] left-[65px] w-[665px] h-[710px] text-xs sm:text-[12.5px] text-slate-900 leading-relaxed text-justify whitespace-pre-wrap font-sans">
                  {(document.structuredData as any)?.clinicalReport || (document.structuredData as any)?.reportText || document.clinicalSummary || document.structuredData.diagnosisPrincipal}
                </div>

                <div className="absolute top-[940px] left-[540px]">
                  <OfficialMedicalStamp size="md" inkColor="navy" />
                </div>
              </div>
            )}

            {/* CONSTANCIA MÉDICA: Estampado sobre constancia_bg.jpg */}
            {document.documentType === 'certificate' && (
              <div className="relative w-[794px] h-[1123px]">
                {/* Paciente y Cédula */}
                <div className="absolute top-[215px] left-[65px] w-[665px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.fullName}
                </div>
                <div className="absolute top-[248px] left-[65px] w-[665px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.idType ? `${document.patient.idType}-${document.patient.nationalId}` : document.patient.nationalId}
                </div>
                {/* Fecha y Condición */}
                <div className="absolute top-[285px] left-[65px] w-[320px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.generatedAt || new Date().toLocaleDateString('es-VE')}
                </div>
                <div className="absolute top-[285px] left-[400px] w-[330px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  Paciente
                </div>
                {/* Reposo Días */}
                <div className="absolute top-[325px] left-[65px] w-[665px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {`${(document.structuredData as any)?.restDays || (document.structuredData as any)?.restCertificate?.restDays || '3'} DÍAS CONTINUOS`}
                </div>
                {/* IDX Diagnóstico */}
                <div className="absolute top-[375px] left-[65px] w-[665px] h-[360px] text-xs sm:text-[12.5px] font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap font-sans">
                  {document.structuredData?.diagnosisPrincipal || (document.structuredData as any)?.diagnostic || (document.structuredData as any)?.restCertificate?.idx}
                </div>

                <div className="absolute top-[890px] left-[540px]">
                  <OfficialMedicalStamp size="md" inkColor="navy" />
                </div>
              </div>
            )}

            {/* ORDEN DE LABORATORIO: Estampado sobre orden_lab_bg.jpg */}
            {document.documentType === 'lab_order' && (
              <div className="relative w-[794px] h-[1123px]">
                {/* Paciente y Cédula */}
                <div className="absolute top-[208px] left-[175px] w-[310px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.fullName}
                </div>
                <div className="absolute top-[208px] left-[550px] w-[180px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.idType ? `${document.patient.idType}-${document.patient.nationalId}` : document.patient.nationalId}
                </div>
                {/* Edad y Fecha */}
                <div className="absolute top-[236px] left-[105px] w-[120px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.age ? `${document.patient.age} años` : ''}
                </div>
                <div className="absolute top-[236px] left-[280px] w-[160px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.generatedAt || new Date().toLocaleDateString('es-VE')}
                </div>

                {/* Lista de Exámenes */}
                <div className="absolute top-[225px] left-[65px] w-[665px] h-[580px] text-xs font-semibold text-slate-900 leading-relaxed">
                  <ul className="space-y-1.5 list-disc list-inside">
                    {document.structuredData.labTests?.map((test, idx) => (
                      <li key={idx}>{test}</li>
                    ))}
                  </ul>
                </div>

                <div className="absolute top-[920px] left-[540px]">
                  <OfficialMedicalStamp size="md" inkColor="navy" />
                </div>
              </div>
            )}

            {/* HISTORIA CLÍNICA: Estampado sobre historia_bg.jpg */}
            {document.documentType === 'history' && (
              <div className="relative w-[794px] h-[1123px]">
                {/* 1. Cabecera Paciente */}
                <div className="absolute top-[168px] left-[200px] w-[495px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.fullName}
                </div>
                <div className="absolute top-[203px] left-[148px] w-[142px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.age ? `${document.patient.age}` : ''}
                </div>
                <div className="absolute top-[203px] left-[398px] w-[297px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.address || 'Ciudad Guayana, Edo. Bolívar'}
                </div>
                <div className="absolute top-[238px] left-[148px] w-[142px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.phoneNumber || ''}
                </div>
                <div className="absolute top-[238px] left-[398px] w-[297px] h-[28px] flex items-center text-slate-900 font-bold text-xs">
                  {document.patient.idType ? `${document.patient.idType}-${document.patient.nationalId}` : document.patient.nationalId}
                </div>

                {/* 2. Secciones Clínicas */}
                <div className="absolute top-[314px] left-[65px] w-[665px] h-[78px] text-xs text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {document.clinicalSummary}
                </div>
                <div className="absolute top-[419px] left-[65px] w-[665px] h-[148px] text-xs text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {document.notes || ''}
                </div>
                <div className="absolute top-[594px] left-[65px] w-[665px] h-[108px] text-xs text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {document.structuredData.generalIndications?.join(', ') || 'No refiere alergias ni antecedentes patológicos de relevancia.'}
                </div>
                <div className="absolute top-[729px] left-[65px] w-[665px] h-[142px] text-xs text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {document.structuredData.diagnosisPrincipal || 'Evaluación segmentaria y neurológica en rango.'}
                </div>
                <div className="absolute top-[899px] left-[65px] w-[665px] h-[118px] text-xs font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {document.structuredData.diagnosisPrincipal}
                </div>

                <div className="absolute top-[960px] left-[550px]">
                  <OfficialMedicalStamp size="md" inkColor="navy" />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer Actions (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Papelería ajustada a los estándares tipográficos y márgenes de Magic Graphic.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalibratorModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Crosshair className="w-4 h-4 text-blue-400" />
              <span>Calibrador en Vivo</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF Oficial'}</span>
            </button>
          </div>
        </div>
      </div>

      {showCalibratorModal && (
        <LiveCoordinateCalibratorModal
          initialDocType={document.documentType as any}
          activeDocument={document as any}
          onClose={() => setShowCalibratorModal(false)}
        />
      )}
    </div>
  );
};
