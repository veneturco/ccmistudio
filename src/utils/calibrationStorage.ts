/**
 * calibrationStorage.ts
 *
 * JERARQUÍA OFICIAL DE AUTORIDAD DE CALIBRACIÓN (ÚNICA FUENTE DE VERDAD):
 * =====================================================================
 * 1. FUENTE MAESTRA CANÓNICA (Física en Milímetros):
 *    - /src/calibration/masters/*.master.json (ej. recipe.master.json, lab.master.json)
 *    - Es la autoridad absoluta e inmutable de coordenadas físicas (mm) para la inyección vectorial oficial.
 *
 * 2. MOTOR GEOMÉTRICO:
 *    - CalibrationEngine.ts traduce milímetros (mm) a puntos PDF (pt) con inversión de eje Y
 *      y a píxeles de pantalla (px) para renderizado web con precisión de 0.1 mm.
 *
 * 3. CAPA DE INTERFAZ Y AJUSTES VISUALES (Legacy UI / Zone Editor):
 *    - localStorage (`socs_doc_calibration_v9_master_samir_*`): Almacena personalizaciones del editor de zonas.
 *    - DEFAULT_CALIBRATIONS (este archivo): Fallback de coordenadas en píxeles exclusivamente para la previsualización
 *      interactiva en el navegador (DocumentZoneEditorStudio / modal previews clásicos).
 *    - En ningún caso sobrescribe la geometría vectorial de los masters oficiales en milímetros.
 */

import { DocType } from '../types';
import { AllCalibrations, DocumentCalibration, FieldCalibration } from '../types/calibration';

/**
 * ARQUITECTURA LEGACY:
 * DEFAULT_CALIBRATIONS representa la versión previa basada en píxeles de pantalla (pantalla 96 DPI).
 * Se mantiene EXCLUSIVAMENTE por compatibilidad retrospectiva con vistas previas DOM heredadas.
 * NO es la autoridad de calibración ni de renderizado para documentos oficiales.
 * La autoridad canónica física radica exclusivamente en MasterTemplateV2 y CalibrationEngineV2 (milímetros).
 */
export const DEFAULT_CALIBRATIONS: AllCalibrations = {
  RECIPES: {
    // === TALÓN IZQUIERDO: RP. FARMACIA / DISPENSACIÓN ===
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Talón Izq: Nombre del Paciente',
      top: 130,
      left: 118,
      width: 240,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Talón Izq: Cédula de Identidad',
      top: 175,
      left: 35,
      width: 130,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.age': {
      id: 'patient.age',
      label: 'Talón Izq: Edad',
      top: 175,
      left: 180,
      width: 105,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'patient.date': {
      id: 'patient.date',
      label: 'Talón Izq: Fecha',
      top: 175,
      left: 280,
      width: 150,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'recipe.rxLeft': {
      id: 'recipe.rxLeft',
      label: 'Talón Izq: Rp. (Farmacia)',
      top: 240,
      left: 30,
      width: 335,
      height: 650,
      fontSize: 12,
      lineHeight: 21,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'stamp.left': {
      id: 'stamp.left',
      label: 'Talón Izq: Sello Médico',
      top: 898,
      left: 230,
      width: 140,
      height: 70,
      scale: 0.75,
    },

    // === TALÓN DERECHO: INDICACIONES AL PACIENTE ===
    'patient.fullNameRight': {
      id: 'patient.fullNameRight',
      label: 'Talón Der: Nombre del Paciente',
      top: 130,
      left: 511,
      width: 240,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumberRight': {
      id: 'patient.idNumberRight',
      label: 'Talón Der: Cédula de Identidad',
      top: 175,
      left: 435,
      width: 130,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.ageRight': {
      id: 'patient.ageRight',
      label: 'Talón Der: Edad',
      top: 175,
      left: 580,
      width: 105,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'patient.dateRight': {
      id: 'patient.dateRight',
      label: 'Talón Der: Fecha',
      top: 175,
      left: 680,
      width: 150,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'recipe.indicationsRight': {
      id: 'recipe.indicationsRight',
      label: 'Talón Der: Indicaciones al Paciente',
      top: 240,
      left: 430,
      width: 335,
      height: 650,
      fontSize: 12,
      lineHeight: 21,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'stamp.right': {
      id: 'stamp.right',
      label: 'Talón Der: Sello Médico',
      top: 893,
      left: 630,
      width: 140,
      height: 70,
      scale: 0.75,
    },
  },

  INFORME: {
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Nombre del Paciente',
      top: 144,
      left: 247,
      width: 438,
      height: 24,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Cédula de Identidad',
      top: 178,
      left: 174,
      width: 151,
      height: 24,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.age': {
      id: 'patient.age',
      label: 'Edad',
      top: 178,
      left: 397,
      width: 95,
      height: 24,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.date': {
      id: 'patient.date',
      label: 'Fecha',
      top: 178,
      left: 531,
      width: 132,
      height: 24,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'informe.diagnosis': {
      id: 'informe.diagnosis',
      label: 'Diagnóstico Principal',
      top: 219,
      left: 68,
      width: 661,
      height: 26,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'informe.bodyText': {
      id: 'informe.bodyText',
      label: 'Cuerpo del Informe Médico',
      top: 250,
      left: 68,
      width: 661,
      height: 624,
      fontSize: 12.5,
      lineHeight: 24,
      fontWeight: 'normal',
      textAlign: 'justify',
    },
    'stamp': {
      id: 'stamp',
      label: 'Sello Médico Oficial (Dr. Samir Moucharrafie)',
      top: 940,
      left: 540,
      width: 160,
      height: 80,
      scale: 0.85,
    },
  },

  ORDEN_LAB: {
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Nombre y Apellido',
      top: 260,
      left: 150,
      width: 310,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Cédula de Identidad',
      top: 260,
      left: 550,
      width: 180,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.age': {
      id: 'patient.age',
      label: 'Edad',
      top: 300,
      left: 105,
      width: 120,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.date': {
      id: 'patient.date',
      label: 'Fecha',
      top: 300,
      left: 280,
      width: 160,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'orden.col_izquierda': {
      id: 'orden.col_izquierda',
      label: 'Columna Izquierda (top: 360px, left: 55px)',
      top: 360,
      left: 55,
      width: 220,
      height: 615,
      fontSize: 9.5,
      lineHeight: 16,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'orden.col_centro': {
      id: 'orden.col_centro',
      label: 'Columna Centro (top: 360px, left: 280px)',
      top: 360,
      left: 280,
      width: 220,
      height: 615,
      fontSize: 9.5,
      lineHeight: 16,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'orden.col_derecha': {
      id: 'orden.col_derecha',
      label: 'Columna Derecha (top: 360px, left: 510px)',
      top: 360,
      left: 510,
      width: 220,
      height: 615,
      fontSize: 9.5,
      lineHeight: 16,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'stamp': {
      id: 'stamp',
      label: 'Sello Médico (Página 1)',
      top: 935,
      left: 540,
      width: 160,
      height: 80,
      scale: 0.85,
    },
  },

  ORDEN_LAB_P2: {
    'orden_p2.patientName': {
      id: 'orden_p2.patientName',
      label: 'Agradezco practicar a (Nombre)',
      top: 220,
      left: 230,
      width: 480,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'orden_p2.idNumber': {
      id: 'orden_p2.idNumber',
      label: 'Cédula de Identidad (P2)',
      top: 220,
      left: 620,
      width: 150,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'orden_p2.date': {
      id: 'orden_p2.date',
      label: 'Fecha (P2)',
      top: 250,
      left: 230,
      width: 150,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'orden_p2.diagnosis': {
      id: 'orden_p2.diagnosis',
      label: 'Con Impresión Diagnóstica (IDX)',
      top: 270,
      left: 260,
      width: 450,
      height: 80,
      fontSize: 11,
      lineHeight: 18,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'orden_p2.rmn_cerebral': {
      id: 'orden_p2.rmn_cerebral',
      label: 'Resonancia Magnética (RMN) [X]',
      top: 340,
      left: 81,
      width: 20,
      height: 20,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'orden_p2.tac_cerebral': {
      id: 'orden_p2.tac_cerebral',
      label: 'Tomografía Axial (TAC) [X]',
      top: 380,
      left: 81,
      width: 20,
      height: 20,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'orden_p2.radiologia': {
      id: 'orden_p2.radiologia',
      label: 'Radiología [X]',
      top: 460,
      left: 81,
      width: 20,
      height: 20,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'orden_p2.emg': {
      id: 'orden_p2.emg',
      label: 'Electromiografía (EMG) [X]',
      top: 500,
      left: 81,
      width: 20,
      height: 20,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'orden_p2.eeg': {
      id: 'orden_p2.eeg',
      label: 'Electroencefalograma (EEG) [X]',
      top: 540,
      left: 81,
      width: 20,
      height: 20,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'orden_p2.pess': {
      id: 'orden_p2.pess',
      label: 'Potenciales Evocados (PESS) [X]',
      top: 580,
      left: 81,
      width: 20,
      height: 20,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'orden_p2.valoracion': {
      id: 'orden_p2.valoracion',
      label: 'Valoración Cardiovascular [X]',
      top: 620,
      left: 81,
      width: 20,
      height: 20,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'stamp': {
      id: 'stamp',
      label: 'Sello Médico (Página 2)',
      top: 940,
      left: 540,
      width: 160,
      height: 80,
      scale: 0.85,
    },
  },

  CONSTANCIA: {
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Nombre y Apellido',
      top: 240,
      left: 65,
      width: 440,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Cédula de Identidad',
      top: 240,
      left: 515,
      width: 215,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.date': {
      id: 'patient.date',
      label: 'Fecha de Consulta',
      top: 282,
      left: 65,
      width: 320,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.condition_label': {
      id: 'constancia.condition_label',
      label: 'Condición (Paciente / Familiar)',
      top: 320,
      left: 65,
      width: 300,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'constancia.cond_paciente': {
      id: 'constancia.cond_paciente',
      label: 'Casilla Paciente [X]',
      top: 320,
      left: 170,
      width: 16,
      height: 16,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.cond_familiar': {
      id: 'constancia.cond_familiar',
      label: 'Casilla Familiar [X]',
      top: 320,
      left: 260,
      width: 16,
      height: 16,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.amerita_label': {
      id: 'constancia.amerita_label',
      label: 'Amerita Reposo Médico',
      top: 320,
      left: 390,
      width: 340,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'constancia.reposo_si': {
      id: 'constancia.reposo_si',
      label: 'Casilla Sí [X]',
      top: 320,
      left: 515,
      width: 16,
      height: 16,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.reposo_no': {
      id: 'constancia.reposo_no',
      label: 'Casilla No [X]',
      top: 320,
      left: 565,
      width: 16,
      height: 16,
      shapeType: 'checkbox_x',
      markStyle: 'X',
      fieldType: 'checkbox',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.restDays': {
      id: 'constancia.restDays',
      label: 'Campo Días (Número y Letras)',
      top: 320,
      left: 620,
      width: 110,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.rango_label': {
      id: 'constancia.rango_label',
      label: 'Rango de Reposo (Desde / Hasta)',
      top: 360,
      left: 65,
      width: 665,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'constancia.restFrom': {
      id: 'constancia.restFrom',
      label: 'Fecha Desde',
      top: 360,
      left: 290,
      width: 200,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.restTo': {
      id: 'constancia.restTo',
      label: 'Fecha Hasta',
      top: 360,
      left: 520,
      width: 210,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.idx': {
      id: 'constancia.idx',
      label: 'Diagnóstico Formal (IDX)',
      top: 410,
      left: 65,
      width: 665,
      height: 320,
      fontSize: 12.5,
      lineHeight: 24,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'constancia.requestDay': {
      id: 'constancia.requestDay',
      label: 'Expedición (Días, Mes, Año)',
      top: 765,
      left: 65,
      width: 665,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'stamp': {
      id: 'stamp',
      label: 'Sello Médico Oficial (Dr. Samir Moucharrafie)',
      top: 890,
      left: 540,
      width: 160,
      height: 80,
      scale: 0.85,
    },
  },

  HISTORIA: {
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Nombre y Apellido',
      top: 176,
      left: 142,
      width: 359,
      height: 29,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Cédula de Identidad',
      top: 174,
      left: 556,
      width: 189,
      height: 29,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.age': {
      id: 'patient.age',
      label: 'Edad',
      top: 214,
      left: 45,
      width: 142,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.phone': {
      id: 'patient.phone',
      label: 'Teléfono',
      top: 214,
      left: 228,
      width: 142,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.address': {
      id: 'patient.address',
      label: 'Dirección de Habitación',
      top: 217,
      left: 444,
      width: 297,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'historia.motivo': {
      id: 'historia.motivo',
      label: 'Motivo de Consulta',
      top: 288,
      left: 42,
      width: 704,
      height: 63,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'historia.enfermedad': {
      id: 'historia.enfermedad',
      label: 'Enfermedad Actual',
      top: 365,
      left: 36,
      width: 721,
      height: 141,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'historia.antecedentes': {
      id: 'historia.antecedentes',
      label: 'Antecedentes Personales y Familiares',
      top: 547,
      left: 38,
      width: 721,
      height: 147,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'historia.examen': {
      id: 'historia.examen',
      label: 'Examen Físico y Neurológico',
      top: 707,
      left: 38,
      width: 715,
      height: 171,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'historia.diagnostico': {
      id: 'historia.diagnostico',
      label: 'Diagnóstico Definitivo / Presuntivo',
      top: 911,
      left: 39,
      width: 716,
      height: 126,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'stamp': {
      id: 'stamp',
      label: 'Sello Médico',
      top: 1036,
      left: 550,
      width: 160,
      height: 80,
      scale: 0.85,
    },
  },
};

const STORAGE_KEY_PREFIX = 'socs_doc_calibration_v9_master_samir_';

export function getStoredCalibration(docType: DocType | string): DocumentCalibration {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${docType}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-migración si contiene valores con el margen antiguo desfasado
      if (docType === 'INFORME' && parsed['patient.fullName'] && parsed['patient.fullName'].left < 100) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${docType}`);
        return { ...((DEFAULT_CALIBRATIONS as any)?.[docType] || {}) };
      }
      // Merge with defaults to ensure any missing fields are present
      return { ...((DEFAULT_CALIBRATIONS as any)?.[docType] || {}), ...parsed };
    }
  } catch (err) {
    console.warn(`Error loading calibration for ${docType}:`, err);
  }
  return { ...((DEFAULT_CALIBRATIONS as any)?.[docType] || {}) };
}

export function getAllStoredCalibrations(): AllCalibrations {
  const docs: (DocType | 'ORDEN_LAB_P2')[] = ['RECIPES', 'INFORME', 'ORDEN_LAB', 'ORDEN_LAB_P2', 'CONSTANCIA', 'HISTORIA'];
  const all: any = {};
  docs.forEach((doc) => {
    all[doc] = getStoredCalibration(doc);
  });
  return all as AllCalibrations;
}

const CALIBRATION_BROADCAST_CHANNEL_NAME = 'ccmi_calibration_sync_channel';
let calibrationBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    calibrationBroadcastChannel = new BroadcastChannel(CALIBRATION_BROADCAST_CHANNEL_NAME);
    calibrationBroadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'CALIBRATION_UPDATED') {
        window.dispatchEvent(new CustomEvent('medical_template_calibrated', { detail: { docType: event.data.docType || 'all' } }));
      }
    };
  } catch (err) {
    console.warn('[BroadcastChannel] No disponible en este entorno:', err);
  }
}

export function notifyCalibrationBroadcast(docType: string): void {
  try {
    calibrationBroadcastChannel?.postMessage({ type: 'CALIBRATION_UPDATED', docType, timestamp: Date.now() });
  } catch (err) {}
}

/**
 * GUARDA ESTRUCTURAL ANTI-EMPTY:
 * Prohíbe terminantemente guardar coordenadas nulas, corruptas o con dimensiones <= 0.
 */
export function validateCalibrationStructure(calibration: DocumentCalibration): { isValid: boolean; reason?: string } {
  if (!calibration || typeof calibration !== 'object') {
    return { isValid: false, reason: 'Calibración nula o tipo inválido' };
  }
  const fields = Object.entries(calibration);
  if (fields.length === 0) {
    return { isValid: false, reason: 'Objeto de calibración sin campos' };
  }

  for (const [key, field] of fields) {
    if (!field || typeof field !== 'object') {
      return { isValid: false, reason: `Campo '${key}' es nulo o inválido` };
    }
    if (typeof field.width === 'number' && (field.width <= 0 || isNaN(field.width))) {
      return { isValid: false, reason: `Campo '${key}' tiene ancho inválido (${field.width})` };
    }
    if (typeof field.height === 'number' && (field.height <= 0 || isNaN(field.height))) {
      return { isValid: false, reason: `Campo '${key}' tiene alto inválido (${field.height})` };
    }
  }
  return { isValid: true };
}

export function saveStoredCalibration(docType: DocType | string, calibration: DocumentCalibration): void {
  // Anti-Empty Guard: Verificar que no contenga dimensiones <= 0
  const validation = validateCalibrationStructure(calibration);
  if (!validation.isValid) {
    console.error(`[Anti-Empty Guard] RECHAZADO: No se permite guardar calibración para '${docType}': ${validation.reason}`);
    return;
  }

  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${docType}`, JSON.stringify(calibration));
    notifyCalibrationBroadcast(String(docType));

    // Non-blocking sync with server disk persistence
    fetch('/api/calibrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType, calibration }),
    }).catch(() => {
      // Offline or preview fallback is completely fine
    });
  } catch (err) {
    console.error(`Error saving calibration for ${docType}:`, err);
  }
}

export function saveAllStoredCalibrations(all: AllCalibrations): void {
  const docs = Object.keys(all) as (DocType | string)[];
  docs.forEach((doc) => {
    if (all[doc as DocType]) {
      const validation = validateCalibrationStructure(all[doc as DocType]);
      if (!validation.isValid) {
        console.warn(`[Anti-Empty Guard] Omitiendo guardado de '${doc}': ${validation.reason}`);
        return;
      }
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${doc}`, JSON.stringify(all[doc as DocType]));
      } catch (e) {
        console.warn(e);
      }
    }
  });

  notifyCalibrationBroadcast('all');

  // Sync to server
  fetch('/api/calibrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allCalibrations: all }),
  }).catch(() => {});
}

export function resetStoredCalibration(docType: DocType | string): DocumentCalibration {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${docType}`);
  } catch (err) {
    console.warn(err);
  }
  return { ...((DEFAULT_CALIBRATIONS as any)?.[docType] || {}) };
}

/**
 * Descargar todas las calibraciones en un archivo JSON descargable
 */
export function exportCalibrationsToJsonFile(): void {
  const all = getAllStoredCalibrations();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(all, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `calibraciones_cmi_dr_samir_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Importar calibraciones desde un archivo JSON
 */
export function importCalibrationsFromJson(jsonText: string): AllCalibrations {
  const parsed = JSON.parse(jsonText);
  saveAllStoredCalibrations(parsed);
  return getAllStoredCalibrations();
}
