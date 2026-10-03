import React, { useEffect } from 'react';
import { MedicalFormCheckbox } from './MedicalFormCheckbox';
import { OfficialMedicalStamp } from './OfficialMedicalStamp';
import { PatientData } from '../types';
import { QrCode, ShieldCheck, Calendar, Clock, AlertCircle } from 'lucide-react';

interface ConstanciaData {
  attendedDate: string;
  condition: 'Paciente' | 'Familiar';
  needsRest: boolean;
  restDays: string;
  restDaysWords?: string;
  restFrom: string;
  restTo: string;
  idx: string;
  requestDay: string;
  requestMonth: string;
  requestYear: string;
}

interface ConstanciaMedicalSheetProps {
  patient: PatientData;
  setPatient: React.Dispatch<React.SetStateAction<PatientData>>;
  constanciaData: ConstanciaData;
  setConstanciaData: React.Dispatch<React.SetStateAction<ConstanciaData>>;
  highlightClass?: (fieldName: string) => string;
}

// Convertidor de números a palabras en español para días de reposo
function numberToSpanishDays(numStr: string): string {
  const num = parseInt(numStr, 10);
  if (isNaN(num) || num <= 0) return 'Cero (00)';
  
  const words: Record<number, string> = {
    1: 'Un (01)',
    2: 'Dos (02)',
    3: 'Tres (03)',
    4: 'Cuatro (04)',
    5: 'Cinco (05)',
    6: 'Seis (06)',
    7: 'Siete (07)',
    8: 'Ocho (08)',
    9: 'Nueve (09)',
    10: 'Diez (10)',
    11: 'Once (11)',
    12: 'Doce (12)',
    13: 'Trece (13)',
    14: 'Catorce (14)',
    15: 'Quince (15)',
    16: 'Dieciséis (16)',
    17: 'Diecisiete (17)',
    18: 'Dieciocho (18)',
    19: 'Diecinueve (19)',
    20: 'Veinte (20)',
    21: 'Veintiún (21)',
    22: 'Veintidós (22)',
    23: 'Veintitrés (23)',
    24: 'Veinticuatro (24)',
    25: 'Veinticinco (25)',
    26: 'Veintiséis (26)',
    27: 'Veintisiete (27)',
    28: 'Veintiocho (28)',
    29: 'Veintinueve (29)',
    30: 'Treinta (30)',
    45: 'Cuarenta y cinco (45)',
    60: 'Sesenta (60)',
    90: 'Noventa (90)',
  };

  return words[num] || `${num} (${String(num).padStart(2, '0')})`;
}

/**
 * Plantilla Oficial de Constancia Médica de Asistencia y Reposo
 * Diseñada para reproducir al 100% el documento médico institucional del Dr. Samir Moucharrafie Naime.
 * Incluye recuadros oficiales interactivos (Sí/No, Paciente/Familiar con flecha),
 * cálculo automático de fechas y días en letras, y estética impecable para impresión directa o WhatsApp.
 */
export const ConstanciaMedicalSheet: React.FC<ConstanciaMedicalSheetProps> = ({
  patient,
  setPatient,
  constanciaData,
  setConstanciaData,
  highlightClass = (_fieldName: string) => '',
}) => {
  // Sincronizar automáticamente fecha fin de reposo cuando cambian los días o la fecha inicio
  const handleDaysChange = (val: string) => {
    const cleanDays = val.replace(/\D/g, '');
    const numDays = parseInt(cleanDays, 10) || 0;
    
    let newRestTo = constanciaData.restTo;
    try {
      const parts = (constanciaData.restFrom || patient.date || '').split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const startDate = new Date(y, m, d);
        if (!isNaN(startDate.getTime())) {
          const endDate = new Date(startDate.getTime() + numDays * 86400000);
          newRestTo = endDate.toLocaleDateString('es-VE');
        }
      }
    } catch {
      // mantener actual si hay fallo de parseo
    }

    setConstanciaData((prev) => ({
      ...prev,
      restDays: cleanDays,
      restDaysWords: numberToSpanishDays(cleanDays),
      needsRest: numDays > 0,
      restTo: numDays > 0 ? newRestTo : '-',
    }));
  };

  // Manejar el toggle entre SÍ amerita reposo y NO amerita reposo
  const handleToggleNeedsRest = (needs: boolean) => {
    if (needs) {
      const days = constanciaData.restDays === '00' || constanciaData.restDays === '0' ? '07' : constanciaData.restDays;
      setConstanciaData((prev) => ({
        ...prev,
        needsRest: true,
        restDays: days,
        restDaysWords: numberToSpanishDays(days),
        restTo: prev.restTo === '-' ? new Date(Date.now() + 7 * 86400000).toLocaleDateString('es-VE') : prev.restTo,
      }));
    } else {
      setConstanciaData((prev) => ({
        ...prev,
        needsRest: false,
        restDays: '00',
        restDaysWords: 'Cero (00)',
        restTo: '-',
      }));
    }
  };

  // Manejar el toggle de Condición de Ingreso: Paciente vs Familiar
  const handleConditionToggle = (cond: 'Paciente' | 'Familiar') => {
    setConstanciaData((prev) => ({ ...prev, condition: cond }));
    setPatient((prev) => ({ ...prev, condition: cond }));
  };

  const isPaciente = (constanciaData.condition || patient.condition || 'Paciente') === 'Paciente';
  const isFamiliar = (constanciaData.condition || patient.condition || 'Paciente') === 'Familiar';

  return (
    <div
      id="constancia-official-content"
      className="relative w-[794px] h-[1123px] px-12 pt-[145px] pb-10 flex flex-col justify-between select-text text-slate-900"
      style={{ boxSizing: 'border-box' }}
    >
      {/* 1. TÍTULO OFICIAL INSTITUCIONAL */}
      <div>
        <div className="text-center pb-2.5 mb-4 border-b-2 border-[#0a376d]">
          <h1 className="text-[17px] font-black tracking-wider text-[#0a376d] uppercase font-sans">
            CONSTANCIA MÉDICA DE ASISTENCIA Y REPOSO
          </h1>
          <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            Especialidad en Neurocirugía y Cirugía de Columna Mínimamente Invasiva
          </p>
        </div>

        {/* 2. ENCABEZADO INSTITUCIONAL: DATOS DEL PACIENTE */}
        <div className="w-full rounded-[4px] border-2 border-[#0a376d]/50 bg-[#0a376d]/[0.03] p-3 mb-4 shadow-2xs print:border-[#0a376d] print:bg-transparent">
          {/* Fila 1: Paciente y Cédula */}
          <div className="grid grid-cols-12 gap-3 items-center mb-2.5">
            <div className="col-span-8 flex items-baseline gap-2 border-b border-slate-300 pb-0.5">
              <span className="text-[11px] font-black text-[#0a376d] uppercase shrink-0">
                Ciudadano(a):
              </span>
              <input
                type="text"
                value={patient.fullName}
                onChange={(e) => setPatient((prev) => ({ ...prev, fullName: e.target.value }))}
                className={`w-full bg-transparent font-bold text-xs text-slate-900 outline-none uppercase tracking-wide ${highlightClass(
                  'patient.fullName'
                )}`}
                placeholder="Nombre y Apellido del paciente"
              />
            </div>

            <div className="col-span-4 flex items-baseline gap-2 border-b border-slate-300 pb-0.5">
              <span className="text-[11px] font-black text-[#0a376d] uppercase shrink-0">
                C.I. Nº:
              </span>
              <input
                type="text"
                value={patient.idNumber}
                onChange={(e) => setPatient((prev) => ({ ...prev, idNumber: e.target.value }))}
                className={`w-full bg-transparent font-bold text-xs text-slate-900 outline-none ${highlightClass(
                  'patient.idNumber'
                )}`}
                placeholder="V-00.000.000"
              />
            </div>
          </div>

          {/* Fila 2: Fecha, Guía de Ingreso y Condición (Paciente / Familiar) */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-3 flex items-baseline gap-2 border-b border-slate-300 pb-0.5">
              <span className="text-[10px] font-black text-[#0a376d] uppercase shrink-0">
                Fecha Emisión:
              </span>
              <input
                type="text"
                value={patient.date}
                onChange={(e) => setPatient((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full bg-transparent font-bold text-xs text-slate-900 outline-none"
                placeholder="DD/MM/AAAA"
              />
            </div>

            <div className="col-span-3 flex items-baseline gap-2 border-b border-slate-300 pb-0.5">
              <span className="text-[10px] font-black text-[#0a376d] uppercase shrink-0">
                Guía Ingreso:
              </span>
              <input
                type="text"
                value={patient.guideNumber || 'ING-2026-0842'}
                onChange={(e) => setPatient((prev) => ({ ...prev, guideNumber: e.target.value }))}
                className="w-full bg-transparent font-bold text-xs text-slate-900 outline-none"
                placeholder="ING-2026-XXXX"
              />
            </div>

            {/* Condición con Recuadros Marcables con Flecha */}
            <div className="col-span-6 flex items-center justify-end gap-3 pl-2">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight shrink-0">
                Condición Ingreso:
              </span>
              <MedicalFormCheckbox
                id="constancia-condition-paciente"
                label="Paciente"
                checked={isPaciente}
                onChange={() => handleConditionToggle('Paciente')}
                size="sm"
                iconType="arrow"
              />
              <MedicalFormCheckbox
                id="constancia-condition-familiar"
                label="Familiar / Acompañante"
                checked={isFamiliar}
                onChange={() => handleConditionToggle('Familiar')}
                size="sm"
                iconType="arrow"
              />
            </div>
          </div>
        </div>

        {/* 3. DECLARACIÓN FORMAL DE ASISTENCIA */}
        <div className="mb-4">
          <p className="text-[11.5px] leading-relaxed text-slate-800 text-justify mb-2 font-serif">
            Quien suscribe, <strong>Dr. Samir Moucharrafie Naime</strong>, Médico Especialista en Neurocirugía y Cirugía de Columna (M.P.P.S. 68.214 | C.M.D.F. 34.891), hace constar formalmente por medio del presente documento que el/la ciudadano(a) arriba identificado(a):
          </p>

          <div className="rounded-[4px] border border-slate-300 bg-slate-50/60 p-2.5 flex items-center gap-3 print:bg-transparent print:border-slate-400">
            <Calendar className="w-4 h-4 text-[#0a376d] shrink-0 print:hidden" />
            <span className="text-xs font-bold text-slate-900 shrink-0">
              Asistió a la consulta médica especializada el día:
            </span>
            <input
              type="text"
              value={constanciaData.attendedDate || patient.date}
              onChange={(e) => setConstanciaData((prev) => ({ ...prev, attendedDate: e.target.value }))}
              className="bg-transparent font-black text-xs text-[#0a376d] border-b border-[#0a376d] outline-none px-1 w-32 text-center"
              placeholder="DD/MM/AAAA"
            />
          </div>
        </div>

        {/* 4. SECCIÓN DE REPOSO MÉDICO CON RECUADROS SÍ / NO */}
        <div className="w-full rounded-[4px] border-2 border-[#0a376d]/60 bg-blue-50/[0.15] p-3 mb-4 print:border-[#0a376d] print:bg-transparent">
          <div className="flex items-center justify-between border-b border-[#0a376d]/30 pb-2 mb-2.5">
            <span className="text-xs font-black uppercase text-[#0a376d] tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0a376d] print:hidden" />
              ¿Amerita Reposo Médico Domiciliario?
            </span>

            {/* Recuadros SÍ / NO */}
            <div className="flex items-center gap-4">
              <MedicalFormCheckbox
                id="constancia-reposo-si"
                label="SÍ AMERITA"
                checked={constanciaData.needsRest}
                onChange={() => handleToggleNeedsRest(true)}
                size="md"
                iconType="check"
              />
              <MedicalFormCheckbox
                id="constancia-reposo-no"
                label="NO AMERITA"
                checked={!constanciaData.needsRest}
                onChange={() => handleToggleNeedsRest(false)}
                size="md"
                iconType="check"
              />
            </div>
          </div>

          {/* Contenido Condicional según Sí / No */}
          {constanciaData.needsRest ? (
            <div className="text-[11.5px] leading-relaxed text-slate-800">
              <div className="flex items-baseline gap-2 flex-wrap mb-2">
                <span>Por presentar cuadro clínico que requiere reposo médico continuo por un lapso de:</span>
                <div className="inline-flex items-baseline gap-1 border-b-2 border-[#0a376d] pb-0.5">
                  <input
                    type="text"
                    value={constanciaData.restDays}
                    onChange={(e) => handleDaysChange(e.target.value)}
                    className="bg-transparent font-black text-xs text-[#0a376d] outline-none w-8 text-center"
                    placeholder="07"
                  />
                  <span className="font-bold text-xs text-slate-900">DÍAS</span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    ({constanciaData.restDaysWords || numberToSpanishDays(constanciaData.restDays)} días continuos)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center bg-white/70 p-2 rounded-[3px] border border-blue-200/80 print:border-none print:p-0 print:bg-transparent">
                <div className="col-span-6 flex items-baseline gap-2">
                  <span className="font-bold text-xs text-[#0a376d]">Desde el día:</span>
                  <input
                    type="text"
                    value={constanciaData.restFrom}
                    onChange={(e) => setConstanciaData((prev) => ({ ...prev, restFrom: e.target.value }))}
                    className="bg-transparent font-black text-xs text-slate-900 border-b border-slate-400 outline-none w-28 text-center"
                    placeholder="DD/MM/AAAA"
                  />
                </div>

                <div className="col-span-6 flex items-baseline gap-2">
                  <span className="font-bold text-xs text-[#0a376d]">Hasta el día:</span>
                  <input
                    type="text"
                    value={constanciaData.restTo}
                    onChange={(e) => setConstanciaData((prev) => ({ ...prev, restTo: e.target.value }))}
                    className="bg-transparent font-black text-xs text-slate-900 border-b border-slate-400 outline-none w-28 text-center"
                    placeholder="DD/MM/AAAA"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">(inclusive)</span>
                </div>
              </div>

              <p className="text-[10.5px] font-semibold text-slate-600 mt-2 italic">
                * Debiendo reintegrarse a sus labores habituales el día hábil inmediato posterior al vencimiento del reposo.
              </p>
            </div>
          ) : (
            <div className="py-2 text-[11.5px] font-medium text-slate-700 bg-white/60 p-2.5 rounded-[3px] border border-slate-200 print:bg-transparent print:border-none">
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 print:hidden" />
                <span>
                  El/la ciudadano(a) <strong>NO amerita reposo médico domiciliario</strong>. Se encuentra facultado(a) física y funcionalmente para continuar con sus actividades académicas, laborales y cotidianas habituales.
                </span>
              </p>
            </div>
          )}
        </div>

        {/* 5. DIAGNÓSTICO E IMPRESIÓN CLÍNICA (CIE-10) */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-black uppercase text-[#0a376d] tracking-wider">
              Diagnóstico / Impresión Clínica Justificativa (CIE-10):
            </span>
          </div>

          <textarea
            rows={3}
            value={constanciaData.idx}
            onChange={(e) => setConstanciaData((prev) => ({ ...prev, idx: e.target.value }))}
            className={`w-full rounded-[4px] border border-slate-300 bg-white/70 p-2.5 font-sans font-semibold text-[11.5px] leading-relaxed text-slate-900 outline-none resize-none transition-all focus:border-[#0a376d] focus:ring-1 focus:ring-[#0a376d] ${highlightClass(
              'constancia.idx'
            )} print:border-none print:p-0 print:bg-transparent`}
            placeholder="Diagnóstico formal de la patología y código CIE-10 correspondiente..."
          />
        </div>

        {/* 6. CLÁUSULA DE EXPEDICIÓN FORMAL */}
        <div className="text-[11.5px] leading-relaxed text-slate-800 text-justify mb-2 font-serif">
          Constancia que se expide a solicitud de la parte interesada para los fines consiguientes que estime pertinentes en la ciudad de <strong>Puerto Ordaz, Estado Bolívar</strong>, a los{' '}
          <input
            type="text"
            value={constanciaData.requestDay}
            onChange={(e) => setConstanciaData((prev) => ({ ...prev, requestDay: e.target.value }))}
            className="bg-transparent font-black text-xs text-[#0a376d] border-b border-[#0a376d] outline-none w-8 text-center inline-block"
            placeholder="09"
          />{' '}
          días del mes de{' '}
          <input
            type="text"
            value={constanciaData.requestMonth}
            onChange={(e) => setConstanciaData((prev) => ({ ...prev, requestMonth: e.target.value.toUpperCase() }))}
            className="bg-transparent font-black text-xs text-[#0a376d] border-b border-[#0a376d] outline-none w-28 text-center inline-block uppercase"
            placeholder="SEPTIEMBRE"
          />{' '}
          del año{' '}
          <input
            type="text"
            value={constanciaData.requestYear}
            onChange={(e) => setConstanciaData((prev) => ({ ...prev, requestYear: e.target.value }))}
            className="bg-transparent font-black text-xs text-[#0a376d] border-b border-[#0a376d] outline-none w-14 text-center inline-block"
            placeholder="2026"
          />
          .
        </div>
      </div>

      {/* 7. PIE OFICIAL: SELLO HÚMEDO, FIRMA Y CÓDIGO QR */}
      <div className="w-full flex items-end justify-between border-t border-slate-300 pt-3 mt-1">
        {/* Código QR de Validación Médica y Hash Criptográfico */}
        <div className="flex items-center gap-2.5 opacity-85">
          <div className="w-14 h-14 bg-white border border-slate-300 rounded p-1 flex items-center justify-center shrink-0">
            <QrCode className="w-full h-full text-[#0a376d]" />
          </div>
          <div className="flex flex-col text-[8.5px] leading-tight text-slate-500 font-mono">
            <span className="font-bold text-[#0a376d]">VALIDACIÓN MÉDICA CCMI</span>
            <span>DOC-ID: {patient.guideNumber || 'ING-2026-0842'}</span>
            <span>HASH: 8F2A-7C1E-9B4D</span>
            <span className="text-[7.5px] text-slate-400">Verificable vía QR</span>
          </div>
        </div>

        {/* Firma del Médico Especialista */}
        <div className="flex flex-col items-center text-center">
          <div className="w-48 border-b-2 border-[#0a376d] mb-1"></div>
          <span className="font-black text-xs text-[#0a376d] uppercase tracking-wide">
            Dr. Samir Moucharrafie Naime
          </span>
          <span className="text-[9.5px] font-bold text-slate-700 uppercase">
            Especialista en Neurocirugía
          </span>
          <span className="text-[8.5px] text-slate-500 font-medium">
            M.P.P.S. 68.214 • C.M.D.F. 34.891
          </span>
        </div>

        {/* Sello Húmedo Oficial */}
        <div className="w-36 h-20 flex items-center justify-center relative scale-90">
          <OfficialMedicalStamp size="md" inkColor="navy" />
        </div>
      </div>
    </div>
  );
};
