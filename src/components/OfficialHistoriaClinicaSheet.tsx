import React, { useRef } from 'react';
import { exportOfficialHistoriaPDF } from '../utils/pdfExport';

export interface HistoriaClinicaProps {
  patient: {
    fullName: string;
    age: string;
    address?: string;
    phone: string;
    idNumber: string;
  };
  clinicalData: {
    motivoConsulta: string;
    enfermedadActual: string;
    antecedentes: string;
    examenNeurologico: string;
    diagnostico: string;
  };
  onUpdatePatient: (field: string, val: string) => void;
  onUpdateClinical: (field: string, val: string) => void;
  containerId?: string;
  customBgUrl?: string | null;
  hideExportButton?: boolean;
  getHighlightClass?: (field: string) => string;
}

export const OfficialHistoriaClinicaSheet: React.FC<HistoriaClinicaProps> = ({
  patient,
  clinicalData,
  onUpdatePatient,
  onUpdateClinical,
  containerId = 'historia-sheet-exact',
  customBgUrl = null,
  hideExportButton = false,
  getHighlightClass = (_field?: string) => '',
}) => {
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Generación directa y fiel sobre la plantilla binaria oficial (pdf-lib)
  const handleExportPDF = async () => {
    const safeName = (patient.fullName || 'Paciente').replace(/\s+/g, '_');
    const safeId = patient.idNumber || 'S_N';
    await exportOfficialHistoriaPDF(
      {
        fullName: patient.fullName,
        idNumber: patient.idNumber,
        age: patient.age,
        address: patient.address,
        phone: patient.phone,
      },
      {
        motivo: clinicalData.motivoConsulta,
        enfermedadActual: clinicalData.enfermedadActual,
        antecedentes: clinicalData.antecedentes,
        neuroExam: clinicalData.examenNeurologico,
        dx: clinicalData.diagnostico,
      },
      `Historia_Clinica_${safeName}_${safeId}.pdf`
    );
  };

  const bgImage = customBgUrl || '/templates/historia_bg.jpg';

  return (
    <div className="flex flex-col items-center">
      {/* Botón de exportación rápida */}
      {!hideExportButton && (
        <div className="w-[794px] flex justify-end pb-3 print:hidden">
          <button
            type="button"
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded shadow flex items-center gap-2 transition-colors cursor-pointer"
          >
            Descargar PDF Oficial Idéntico
          </button>
        </div>
      )}

      {/* Contenedor A4 Rígido (794px x 1123px) con Plantilla Original de Fondo */}
      <div
        ref={printSheetRef}
        id={containerId}
        className="relative bg-white shadow-2xl overflow-hidden print:shadow-none"
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          boxSizing: 'border-box',
        }}
      >

        {/* ======================================================== */}
        {/* 1. CAMPOS DE CABECERA (BLOQUE AZUL SUPERIOR)            */}
        {/* ======================================================== */}
        
        {/* Nombre y Apellido */}
        <input
          type="text"
          value={patient.fullName || ''}
          onChange={(e) => onUpdatePatient('fullName', e.target.value)}
          placeholder="Nombre y Apellido del paciente"
          className={`absolute top-[168px] left-[200px] w-[495px] h-[28px] bg-transparent text-slate-900 font-bold text-xs px-2 outline-none border-none ${getHighlightClass('patient.fullName')}`}
        />

        {/* Edad */}
        <input
          type="text"
          value={patient.age || ''}
          onChange={(e) => onUpdatePatient('age', e.target.value)}
          placeholder="Edad"
          className={`absolute top-[203px] left-[148px] w-[142px] h-[28px] bg-transparent text-slate-900 font-bold text-xs px-2 outline-none border-none ${getHighlightClass('patient.age')}`}
        />

        {/* Dirección */}
        <input
          type="text"
          value={patient.address || ''}
          onChange={(e) => onUpdatePatient('address', e.target.value)}
          placeholder="Dirección del paciente"
          className={`absolute top-[203px] left-[398px] w-[297px] h-[28px] bg-transparent text-slate-900 font-bold text-xs px-2 outline-none border-none ${getHighlightClass('patient.address')}`}
        />

        {/* Teléfono */}
        <input
          type="text"
          value={patient.phone || ''}
          onChange={(e) => onUpdatePatient('phone', e.target.value)}
          placeholder="0412 / 0414 / 0424..."
          className={`absolute top-[238px] left-[148px] w-[142px] h-[28px] bg-transparent text-slate-900 font-bold text-xs px-2 outline-none border-none ${getHighlightClass('patient.phone')}`}
        />

        {/* Cédula */}
        <input
          type="text"
          value={patient.idNumber || ''}
          onChange={(e) => onUpdatePatient('idNumber', e.target.value)}
          placeholder="V-00.000.000"
          className={`absolute top-[238px] left-[398px] w-[297px] h-[28px] bg-transparent text-slate-900 font-bold text-xs px-2 outline-none border-none ${getHighlightClass('patient.idNumber')}`}
        />

        {/* ======================================================== */}
        {/* 2. CAMPOS CLÍNICOS DEL CUERPO (BAJO TITULARES DE FONDO) */}
        {/* ======================================================== */}

        {/* MOTIVO DE CONSULTA */}
        <textarea
          value={clinicalData.motivoConsulta || ''}
          onChange={(e) => onUpdateClinical('motivoConsulta', e.target.value)}
          placeholder="Indicar motivo de consulta..."
          className={`absolute top-[314px] left-[65px] w-[665px] h-[78px] bg-transparent resize-none font-sans text-xs text-slate-900 leading-relaxed outline-none border-none ${getHighlightClass('historia.motivo')}`}
        />

        {/* ENFERMEDAD ACTUAL */}
        <textarea
          value={clinicalData.enfermedadActual || ''}
          onChange={(e) => onUpdateClinical('enfermedadActual', e.target.value)}
          placeholder="Evolución del cuadro actual..."
          className="absolute top-[419px] left-[65px] w-[665px] h-[148px] bg-transparent resize-none font-sans text-xs text-slate-900 leading-relaxed outline-none border-none"
        />

        {/* ANTECEDENTES IMPORTANTES */}
        <textarea
          value={clinicalData.antecedentes || ''}
          onChange={(e) => onUpdateClinical('antecedentes', e.target.value)}
          placeholder="Quirúrgicos, patológicos, alérgicos..."
          className="absolute top-[594px] left-[65px] w-[665px] h-[108px] bg-transparent resize-none font-sans text-xs text-slate-900 leading-relaxed outline-none border-none"
        />

        {/* EXAMEN NEUROLÓGICO */}
        <textarea
          value={clinicalData.examenNeurologico || ''}
          onChange={(e) => onUpdateClinical('examenNeurologico', e.target.value)}
          placeholder="Examen físico segmentario y neurológico..."
          className="absolute top-[729px] left-[65px] w-[665px] h-[142px] bg-transparent resize-none font-sans text-xs text-slate-900 leading-relaxed outline-none border-none"
        />

        {/* DIAGNÓSTICO */}
        <textarea
          value={clinicalData.diagnostico || ''}
          onChange={(e) => onUpdateClinical('diagnostico', e.target.value)}
          placeholder="Diagnóstico formal definitivo / diferencial..."
          className={`absolute top-[899px] left-[65px] w-[665px] h-[118px] bg-transparent resize-none font-sans text-xs font-bold text-slate-900 leading-relaxed outline-none border-none ${getHighlightClass('historia.diagnostico')}`}
        />
      </div>
    </div>
  );
};
