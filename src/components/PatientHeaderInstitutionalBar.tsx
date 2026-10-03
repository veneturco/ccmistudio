import React from 'react';
import { MedicalFormCheckbox } from './MedicalFormCheckbox';
import { PatientData } from '../types';

interface PatientHeaderInstitutionalBarProps {
  patient: PatientData;
  setPatient: React.Dispatch<React.SetStateAction<PatientData>>;
  showAge?: boolean;
  compact?: boolean;
  highlightClass?: (fieldName: string) => string;
  className?: string;
  onConditionChange?: (condition: 'Paciente' | 'Familiar') => void;
}

/**
 * Barra Institucional de Identificación del Paciente
 * Presente de manera oficial en todos los documentos médicos del Dr. Samir Moucharrafie:
 * Cédula, Nombre, Fecha, Guía de Ingreso y Condición (Paciente / Familiar) con recuadros interactivos.
 */
export const PatientHeaderInstitutionalBar: React.FC<PatientHeaderInstitutionalBarProps> = ({
  patient,
  setPatient,
  showAge = true,
  compact = false,
  highlightClass = (_fieldName: string) => '',
  className = '',
  onConditionChange,
}) => {
  const handleConditionToggle = (cond: 'Paciente' | 'Familiar') => {
    setPatient((prev) => ({
      ...prev,
      condition: cond,
    }));
    if (onConditionChange) {
      onConditionChange(cond);
    }
  };

  const isPaciente = (patient.condition || 'Paciente') === 'Paciente';
  const isFamiliar = (patient.condition || 'Paciente') === 'Familiar';

  return (
    <div
      className={`w-full rounded-[4px] border border-[#0a376d]/40 bg-[#0a376d]/[0.02] p-2.5 transition-all text-slate-900 ${className} print:border-[#0a376d]/60 print:bg-transparent`}
    >
      {/* Fila 1: Nombre y Cédula */}
      <div className="grid grid-cols-12 gap-2 items-center mb-2">
        {/* Nombre del Paciente */}
        <div className="col-span-8 flex items-baseline gap-1.5 border-b border-slate-300 pb-0.5">
          <span className="text-[10px] font-black tracking-wider text-[#0a376d] shrink-0 uppercase">
            Paciente:
          </span>
          <input
            type="text"
            value={patient.fullName}
            onChange={(e) => setPatient((prev) => ({ ...prev, fullName: e.target.value }))}
            className={`w-full bg-transparent font-bold text-xs text-slate-900 outline-none uppercase ${highlightClass(
              'patient.fullName'
            )}`}
            placeholder="Nombre y Apellidos completos"
          />
        </div>

        {/* Cédula de Identidad */}
        <div className="col-span-4 flex items-baseline gap-1.5 border-b border-slate-300 pb-0.5">
          <span className="text-[10px] font-black tracking-wider text-[#0a376d] shrink-0 uppercase">
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

      {/* Fila 2: Fecha, Guía de Ingreso, Edad y Condición */}
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Fecha de Consulta */}
        <div className="col-span-3 flex items-baseline gap-1.5 border-b border-slate-300 pb-0.5">
          <span className="text-[10px] font-black tracking-wider text-[#0a376d] shrink-0 uppercase">
            Fecha:
          </span>
          <input
            type="text"
            value={patient.date}
            onChange={(e) => setPatient((prev) => ({ ...prev, date: e.target.value }))}
            className={`w-full bg-transparent font-bold text-xs text-slate-900 outline-none ${highlightClass(
              'patient.date'
            )}`}
            placeholder="DD/MM/AAAA"
          />
        </div>

        {/* Guía de Ingreso */}
        <div className="col-span-3 flex items-baseline gap-1.5 border-b border-slate-300 pb-0.5">
          <span className="text-[10px] font-black tracking-wider text-[#0a376d] shrink-0 uppercase">
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

        {/* Edad (opcional) */}
        {showAge && (
          <div className="col-span-2 flex items-baseline gap-1.5 border-b border-slate-300 pb-0.5">
            <span className="text-[10px] font-black tracking-wider text-[#0a376d] shrink-0 uppercase">
              Edad:
            </span>
            <input
              type="text"
              value={patient.age}
              onChange={(e) => setPatient((prev) => ({ ...prev, age: e.target.value }))}
              className={`w-full bg-transparent font-bold text-xs text-slate-900 outline-none text-center ${highlightClass(
                'patient.age'
              )}`}
              placeholder="Años"
            />
          </div>
        )}

        {/* Condición de Atención: Recuadros Interactivos Paciente / Familiar */}
        <div className={`${showAge ? 'col-span-4' : 'col-span-6'} flex items-center justify-end gap-3 pl-1`}>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">
            Condición:
          </span>
          <MedicalFormCheckbox
            id="checkbox-condition-paciente"
            label="Paciente"
            checked={isPaciente}
            onChange={() => handleConditionToggle('Paciente')}
            size="sm"
            iconType="arrow"
          />
          <MedicalFormCheckbox
            id="checkbox-condition-familiar"
            label="Familiar"
            checked={isFamiliar}
            onChange={() => handleConditionToggle('Familiar')}
            size="sm"
            iconType="arrow"
          />
        </div>
      </div>
    </div>
  );
};
