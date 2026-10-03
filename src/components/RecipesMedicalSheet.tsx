import React, { useMemo, useState, useEffect } from 'react';
import { OfficialMedicalStamp } from './OfficialMedicalStamp';
import { PatientData } from '../types';
import { TemplateRegistry } from '../calibration/TemplateRegistry';
import { RECIPE_MASTER_V2 } from '../calibration/MasterRegistryV2';

export interface RecipesMedicalSheetProps {
  patient: PatientData;
  onUpdatePatient: (field: string, val: string) => void;
  recipeData: {
    rxLeft: string;
    indicationsRight: string;
  };
  onUpdateRecipeData: (field: 'rxLeft' | 'indicationsRight', val: string) => void;
  showStamp?: boolean;
  customBgUrl?: string | null;
  id?: string;
}

const MM_TO_PX_X = 794 / 210.0;
const MM_TO_PX_Y = 1123 / 297.0;

function getElGeo(
  el: any, 
  fallback: { 
    xMm: number; 
    yMm: number; 
    widthMm: number; 
    heightMm: number; 
    fontSizePt?: number;
    fontWeight?: string;
    align?: string;
  }
) {
  const xMm = el?.geometry?.xMm ?? el?.xMm ?? fallback.xMm;
  const yMm = el?.geometry?.yMm ?? el?.yMm ?? fallback.yMm;
  const widthMm = el?.geometry?.widthMm ?? el?.widthMm ?? fallback.widthMm;
  const heightMm = el?.geometry?.heightMm ?? el?.heightMm ?? fallback.heightMm;
  const fontSizePt = el?.typography?.fontSizePt ?? el?.fontSizePt ?? fallback.fontSizePt ?? 9.5;
  const fontWeight = el?.typography?.fontWeight ?? el?.fontWeight ?? fallback.fontWeight ?? 'bold';
  const align = el?.typography?.align ?? el?.align ?? fallback.align ?? 'left';
  return { xMm, yMm, widthMm, heightMm, fontSizePt, fontWeight, align };
}

/**
 * RecipesMedicalSheet
 * Implementación oficial de récipe médico institucional de dos talones (Farmacia + Indicaciones)
 * Conectado en caliente con la calibración milimétrica y el registro canónico V2.
 */
export const RecipesMedicalSheet: React.FC<RecipesMedicalSheetProps> = ({
  patient,
  onUpdatePatient,
  recipeData,
  onUpdateRecipeData,
  showStamp = true,
  customBgUrl = null,
  id = 'recipe-official-sheet',
}) => {
  const [calibVersion, setCalibVersion] = useState(0);

  useEffect(() => {
    const handleCalibUpdated = () => {
      setCalibVersion(v => v + 1);
    };
    window.addEventListener('medical_template_calibrated', handleCalibUpdated);
    return () => {
      window.removeEventListener('medical_template_calibrated', handleCalibUpdated);
    };
  }, []);

  const masterTemplate = useMemo(() => {
    return TemplateRegistry.get('recipe') || RECIPE_MASTER_V2;
  }, [calibVersion]);

  const pageElements = masterTemplate?.pages?.[0]?.elements || RECIPE_MASTER_V2?.pages?.[0]?.elements || [];

  // Talón Izquierdo Elements (xMm < 105mm)
  const leftNameEl = pageElements.find(e => e.id === 'left_patient_name' || (e.dataKey === 'patient.fullName' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) < 105));
  const leftIdEl = pageElements.find(e => e.id === 'left_patient_id' || (e.dataKey === 'patient.idNumber' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) < 105));
  const leftAgeEl = pageElements.find(e => e.id === 'left_patient_age' || (e.dataKey === 'patient.age' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) < 105));
  const leftDateEl = pageElements.find(e => e.id === 'left_date' || (e.dataKey === 'document.date' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) < 105));
  const leftRxEl = pageElements.find(e => e.id === 'left_rx_body' || e.dataKey === 'recipe.pharmacy' || e.dataKey === 'recipe.left' || ((e.type === 'multilineText' || (e.geometry?.heightMm ?? 0) > 40) && (e.geometry?.xMm ?? (e as any).xMm ?? 0) < 105));
  const leftStampEl = pageElements.find(e => e.id === 'left_doctor_stamp' || e.dataKey === 'doctor_stamp_signature' || ((e.type === 'stamp' || (e as any).assetKey === 'doctor_stamp_signature') && (e.geometry?.xMm ?? (e as any).xMm ?? 0) < 105));

  // Talón Derecho Elements (xMm >= 105mm)
  const rightNameEl = pageElements.find(e => e.id === 'right_patient_name' || (e.dataKey === 'patient.fullName' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) >= 105));
  const rightIdEl = pageElements.find(e => e.id === 'right_patient_id' || (e.dataKey === 'patient.idNumber' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) >= 105));
  const rightAgeEl = pageElements.find(e => e.id === 'right_patient_age' || (e.dataKey === 'patient.age' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) >= 105));
  const rightDateEl = pageElements.find(e => e.id === 'right_date' || (e.dataKey === 'document.date' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) >= 105));
  const rightIndicationsEl = pageElements.find(e => e.id === 'right_indications_body' || e.dataKey === 'recipe.indications' || e.dataKey === 'recipe.patientIndications' || e.dataKey === 'recipe.right' || ((e.type === 'multilineText' || (e.geometry?.heightMm ?? 0) > 40) && (e.geometry?.xMm ?? (e as any).xMm ?? 0) >= 105));
  const rightStampEl = pageElements.find(e => e.id === 'right_doctor_stamp' || (e.dataKey === 'doctor_stamp_signature' && (e.geometry?.xMm ?? (e as any).xMm ?? 0) >= 105) || ((e.type === 'stamp' || (e as any).assetKey === 'doctor_stamp_signature') && (e.geometry?.xMm ?? (e as any).xMm ?? 0) >= 105));

  // Geometrías calculadas (Canónicas calibradas sobre cajas físicas)
  const gLeftName = getElGeo(leftNameEl, { xMm: 25.0, yMm: 56.5, widthMm: 75.0, heightMm: 5.5, fontSizePt: 9.5 });
  const gLeftId = getElGeo(leftIdEl, { xMm: 15.0, yMm: 60.5, widthMm: 32.0, heightMm: 5.0, fontSizePt: 9.5 });
  const gLeftAge = getElGeo(leftAgeEl, { xMm: 51.0, yMm: 60.5, widthMm: 18.0, heightMm: 5.0, fontSizePt: 9.5 });
  const gLeftDate = getElGeo(leftDateEl, { xMm: 74.0, yMm: 60.5, widthMm: 25.0, heightMm: 5.0, fontSizePt: 9.5 });
  const gLeftRx = getElGeo(leftRxEl, { xMm: 10.0, yMm: 78.0, widthMm: 89.0, heightMm: 165.0, fontSizePt: 10.0 });
  const gLeftStamp = getElGeo(leftStampEl, { xMm: 58.0, yMm: 248.0, widthMm: 38.0, heightMm: 22.0 });

  const gRightName = getElGeo(rightNameEl, { xMm: 129.0, yMm: 56.5, widthMm: 75.0, heightMm: 5.5, fontSizePt: 9.5 });
  const gRightId = getElGeo(rightIdEl, { xMm: 119.0, yMm: 60.5, widthMm: 32.0, heightMm: 5.0, fontSizePt: 9.5 });
  const gRightAge = getElGeo(rightAgeEl, { xMm: 155.0, yMm: 60.5, widthMm: 18.0, heightMm: 5.0, fontSizePt: 9.5 });
  const gRightDate = getElGeo(rightDateEl, { xMm: 178.0, yMm: 60.5, widthMm: 25.0, heightMm: 5.0, fontSizePt: 9.5 });
  const gRightIndications = getElGeo(rightIndicationsEl, { xMm: 114.0, yMm: 78.0, widthMm: 89.0, heightMm: 165.0, fontSizePt: 10.0 });
  const gRightStamp = getElGeo(rightStampEl, { xMm: 162.0, yMm: 248.0, widthMm: 38.0, heightMm: 22.0 });

  const bgImage = customBgUrl || '/templates/recipes_bg.jpg';

  return (
    <div
      id={id}
      data-doc-page="1"
      className="relative bg-white shadow-2xl overflow-hidden print:shadow-none print:m-0 select-text"
      style={{
        width: '794px',
        height: '1123px',
        minWidth: '794px',
        minHeight: '1123px',
        maxWidth: '794px',
        maxHeight: '1123px',
        boxSizing: 'border-box',
        fontFamily: "'Liberation Sans', 'Arial', sans-serif",
      }}
    >
      {/* FONDO MASTER OFICIAL INMUTABLE (300 DPI) - Siempre visible e impreso sin depender de ajustes de navegador */}
      <img
        src={bgImage}
        alt="Fondo Maestro Récipe Médico"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* ==================================================================== */}
      {/* 1. TALÓN IZQUIERDO (FARMACIA / RP.)                                  */}
      {/* ==================================================================== */}

      {/* Nombre y Apellido Izquierdo */}
      <input
        type="text"
        value={patient.fullName || ''}
        onChange={(e) => onUpdatePatient('fullName', e.target.value)}
        placeholder="NOMBRE DEL PACIENTE"
        style={{
          position: 'absolute',
          left: `${gLeftName.xMm * MM_TO_PX_X}px`,
          top: `${gLeftName.yMm * MM_TO_PX_Y}px`,
          width: `${gLeftName.widthMm * MM_TO_PX_X}px`,
          height: `${gLeftName.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gLeftName.fontSizePt * 1.33}px`,
          fontWeight: gLeftName.fontWeight as any,
          textAlign: gLeftName.align as any,
        }}
        className="bg-transparent text-[#143e72] px-1 outline-none uppercase border-none truncate focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Cédula Izquierda */}
      <input
        type="text"
        value={patient.idNumber || ''}
        onChange={(e) => onUpdatePatient('idNumber', e.target.value)}
        placeholder="V-00.000.000"
        style={{
          position: 'absolute',
          left: `${gLeftId.xMm * MM_TO_PX_X}px`,
          top: `${gLeftId.yMm * MM_TO_PX_Y}px`,
          width: `${gLeftId.widthMm * MM_TO_PX_X}px`,
          height: `${gLeftId.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gLeftId.fontSizePt * 1.33}px`,
          fontWeight: gLeftId.fontWeight as any,
          textAlign: gLeftId.align as any,
        }}
        className="bg-transparent text-[#143e72] px-1 outline-none border-none truncate focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Edad Izquierda */}
      <input
        type="text"
        value={patient.age || ''}
        onChange={(e) => onUpdatePatient('age', e.target.value)}
        placeholder="Edad"
        style={{
          position: 'absolute',
          left: `${gLeftAge.xMm * MM_TO_PX_X}px`,
          top: `${gLeftAge.yMm * MM_TO_PX_Y}px`,
          width: `${gLeftAge.widthMm * MM_TO_PX_X}px`,
          height: `${gLeftAge.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gLeftAge.fontSizePt * 1.33}px`,
          fontWeight: gLeftAge.fontWeight as any,
          textAlign: 'center',
        }}
        className="bg-transparent text-[#143e72] px-0.5 outline-none border-none truncate focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Fecha Izquierda */}
      <input
        type="text"
        value={patient.date || ''}
        onChange={(e) => onUpdatePatient('date', e.target.value)}
        placeholder="DD/MM/AAAA"
        style={{
          position: 'absolute',
          left: `${gLeftDate.xMm * MM_TO_PX_X}px`,
          top: `${gLeftDate.yMm * MM_TO_PX_Y}px`,
          width: `${gLeftDate.widthMm * MM_TO_PX_X}px`,
          height: `${gLeftDate.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gLeftDate.fontSizePt * 1.33}px`,
          fontWeight: gLeftDate.fontWeight as any,
          textAlign: 'center',
        }}
        className="bg-transparent text-[#143e72] px-0.5 outline-none border-none truncate focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Cuerpo Rp. / Farmacia */}
      <textarea
        value={recipeData.rxLeft || ''}
        onChange={(e) => onUpdateRecipeData('rxLeft', e.target.value)}
        placeholder="Rp. Prescripción farmacológica (Fármaco, concentración, presentación y cantidad)..."
        style={{
          position: 'absolute',
          left: `${gLeftRx.xMm * MM_TO_PX_X}px`,
          top: `${gLeftRx.yMm * MM_TO_PX_Y}px`,
          width: `${gLeftRx.widthMm * MM_TO_PX_X}px`,
          height: `${gLeftRx.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gLeftRx.fontSizePt * 1.33}px`,
          textAlign: gLeftRx.align as any,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        className="bg-transparent text-[#143e72] font-semibold leading-relaxed p-1 outline-none resize-none border-none select-text focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Sello Oficial Izquierdo */}
      {showStamp && (
        <div
          style={{
            position: 'absolute',
            left: `${gLeftStamp.xMm * MM_TO_PX_X}px`,
            top: `${gLeftStamp.yMm * MM_TO_PX_Y}px`,
            width: `${gLeftStamp.widthMm * MM_TO_PX_X}px`,
            height: `${gLeftStamp.heightMm * MM_TO_PX_Y}px`,
          }}
          className="pointer-events-none flex items-center justify-center"
        >
          <OfficialMedicalStamp inkColor="navy" size="md" />
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. TALÓN DERECHO (INDICACIONES PACIENTE)                             */}
      {/* ==================================================================== */}

      {/* Nombre y Apellido Derecho */}
      <input
        type="text"
        value={patient.fullName || ''}
        onChange={(e) => onUpdatePatient('fullName', e.target.value)}
        placeholder="NOMBRE DEL PACIENTE"
        style={{
          position: 'absolute',
          left: `${gRightName.xMm * MM_TO_PX_X}px`,
          top: `${gRightName.yMm * MM_TO_PX_Y}px`,
          width: `${gRightName.widthMm * MM_TO_PX_X}px`,
          height: `${gRightName.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gRightName.fontSizePt * 1.33}px`,
          fontWeight: gRightName.fontWeight as any,
          textAlign: gRightName.align as any,
        }}
        className="bg-transparent text-[#143e72] px-1 outline-none uppercase border-none truncate focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Cédula Derecha */}
      <input
        type="text"
        value={patient.idNumber || ''}
        onChange={(e) => onUpdatePatient('idNumber', e.target.value)}
        placeholder="V-00.000.000"
        style={{
          position: 'absolute',
          left: `${gRightId.xMm * MM_TO_PX_X}px`,
          top: `${gRightId.yMm * MM_TO_PX_Y}px`,
          width: `${gRightId.widthMm * MM_TO_PX_X}px`,
          height: `${gRightId.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gRightId.fontSizePt * 1.33}px`,
          fontWeight: gRightId.fontWeight as any,
          textAlign: gRightId.align as any,
        }}
        className="bg-transparent text-[#143e72] px-1 outline-none border-none truncate focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Edad Derecha */}
      <input
        type="text"
        value={patient.age || ''}
        onChange={(e) => onUpdatePatient('age', e.target.value)}
        placeholder="Edad"
        style={{
          position: 'absolute',
          left: `${gRightAge.xMm * MM_TO_PX_X}px`,
          top: `${gRightAge.yMm * MM_TO_PX_Y}px`,
          width: `${gRightAge.widthMm * MM_TO_PX_X}px`,
          height: `${gRightAge.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gRightAge.fontSizePt * 1.33}px`,
          fontWeight: gRightAge.fontWeight as any,
          textAlign: 'center',
        }}
        className="bg-transparent text-[#143e72] px-0.5 outline-none border-none truncate focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Fecha Derecha */}
      <input
        type="text"
        value={patient.date || ''}
        onChange={(e) => onUpdatePatient('date', e.target.value)}
        placeholder="DD/MM/AAAA"
        style={{
          position: 'absolute',
          left: `${gRightDate.xMm * MM_TO_PX_X}px`,
          top: `${gRightDate.yMm * MM_TO_PX_Y}px`,
          width: `${gRightDate.widthMm * MM_TO_PX_X}px`,
          height: `${gRightDate.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gRightDate.fontSizePt * 1.33}px`,
          fontWeight: gRightDate.fontWeight as any,
          textAlign: 'center',
        }}
        className="bg-transparent text-[#143e72] px-0.5 outline-none border-none truncate focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Cuerpo Indicaciones al Paciente */}
      <textarea
        value={recipeData.indicationsRight || ''}
        onChange={(e) => onUpdateRecipeData('indicationsRight', e.target.value)}
        placeholder="Indicaciones terapéuticas detalladas (Dosis, vía de administración, frecuencia, duración y recomendaciones)..."
        style={{
          position: 'absolute',
          left: `${gRightIndications.xMm * MM_TO_PX_X}px`,
          top: `${gRightIndications.yMm * MM_TO_PX_Y}px`,
          width: `${gRightIndications.widthMm * MM_TO_PX_X}px`,
          height: `${gRightIndications.heightMm * MM_TO_PX_Y}px`,
          fontSize: `${gRightIndications.fontSizePt * 1.33}px`,
          textAlign: gRightIndications.align as any,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        className="bg-transparent text-slate-900 font-medium leading-relaxed p-1 outline-none resize-none border-none select-text focus:ring-1 focus:ring-blue-400 rounded"
      />

      {/* Sello Oficial Derecho */}
      {showStamp && (
        <div
          style={{
            position: 'absolute',
            left: `${gRightStamp.xMm * MM_TO_PX_X}px`,
            top: `${gRightStamp.yMm * MM_TO_PX_Y}px`,
            width: `${gRightStamp.widthMm * MM_TO_PX_X}px`,
            height: `${gRightStamp.heightMm * MM_TO_PX_Y}px`,
          }}
          className="pointer-events-none flex items-center justify-center"
        >
          <OfficialMedicalStamp inkColor="navy" size="md" />
        </div>
      )}
    </div>
  );
};
