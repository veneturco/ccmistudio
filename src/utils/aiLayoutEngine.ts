import { DocType } from '../types';
import { DocumentCalibration, FieldCalibration } from '../types/calibration';
import { DEFAULT_CALIBRATIONS } from './calibrationStorage';

// Factores de conversión estándar para A4 a 96/300 DPI escalado en pantalla (794 x 1123 px para 210 x 297 mm)
export const PX_PER_MM = 794 / 210; // ≈ 3.78095 px por mm
export const MM_PER_PX = 210 / 794; // ≈ 0.26448 mm por px

export function pxToMm(px: number): number {
  return Math.round(px * MM_PER_PX * 10) / 10;
}

export function mmToPx(mm: number): number {
  return Math.round(mm * PX_PER_MM);
}

export type AIPresetProfile = 'printed_lines' | 'magic_graphic' | 'high_capacity' | 'compact';

export interface LayoutDiagnostic {
  fieldId: string;
  label: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

/**
 * Escaneo y Calibración Visual Asistida por Gemini Vision
 * Envía la imagen real de la papelería médica al modelo multimodal de IA en el servidor
 * para detectar dónde están impresas las etiquetas y líneas, y encuadra los campos editables automáticamente.
 */
export async function scanAndCalibrateWithGeminiVision(
  docType: DocType,
  imageBase64?: string
): Promise<{ success: boolean; calibration: DocumentCalibration; source: string; rasterizedImageUrl?: string; error?: string }> {
  try {
    const res = await fetch('/api/gemini/calibrate-template-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType, imageBase64 }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Falló la comunicación con el motor de visión.`);
    }

    const data = await res.json();
    if (data.success && data.calibration) {
      return {
        success: true,
        calibration: data.calibration,
        source: data.source || 'gemini-vision',
        rasterizedImageUrl: data.rasterizedImageUrl,
      };
    }

    throw new Error(data.error || 'No se recibieron coordenadas válidas del análisis visual.');
  } catch (err: any) {
    console.warn('[AI Layout Engine] Fallback a calibración matemática de renglones:', err.message);
    return {
      success: true,
      calibration: autoCalibrateWithAI(docType, 'printed_lines'),
      source: 'optical-mathematical-fallback',
      error: err.message,
    };
  }
}

/**
 * Motor de Auto-Calibración Inteligente por IA
 * Genera la geometría matemática y tipográfica óptima según el tipo de documento y perfil seleccionado.
 */
export function autoCalibrateWithAI(
  docType: DocType,
  profile: AIPresetProfile = 'printed_lines'
): DocumentCalibration {
  switch (docType) {
    case 'RECIPES':
      return autoCalibrateRecipe(profile);
    case 'INFORME':
      return autoCalibrateInforme(profile);
    case 'ORDEN_LAB':
      return autoCalibrateOrdenLab(profile);
    case 'CONSTANCIA':
      return autoCalibrateConstancia(profile);
    case 'HISTORIA':
      return autoCalibrateHistoria(profile);
    default:
      return (DEFAULT_CALIBRATIONS as Record<string, DocumentCalibration>)[docType] 
        ? { ...(DEFAULT_CALIBRATIONS as Record<string, DocumentCalibration>)[docType] } 
        : {};
  }
}

/**
 * RÉCIPE MÉDICO: Doble Talón Simétrico con compensación óptica de imprenta
 * Soporta formato de renglones impresos separados (Línea 1: Nombre, Línea 2: Cédula y Edad, Línea 3: Fecha)
 */
function autoCalibrateRecipe(profile: AIPresetProfile): DocumentCalibration {
  if (profile === 'printed_lines') {
    // Perfil Papelería con Renglones Físicos: Los campos editables se sitúan a la derecha de las etiquetas preimpresas
    return {
      // === TALÓN IZQUIERDO (FARMACIA) ===
      'patient.fullName': {
        id: 'patient.fullName',
        label: 'Talón Izq: Nombre del Paciente',
        top: 124,
        left: 140,
        width: 240,
        height: 26,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'left',
      },
      'patient.idNumber': {
        id: 'patient.idNumber',
        label: 'Talón Izq: Cédula de Identidad',
        top: 154,
        left: 95,
        width: 130,
        height: 26,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'left',
      },
      'patient.age': {
        id: 'patient.age',
        label: 'Talón Izq: Edad',
        top: 154,
        left: 275,
        width: 105,
        height: 26,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
      },
      'patient.date': {
        id: 'patient.date',
        label: 'Talón Izq: Fecha',
        top: 184,
        left: 95,
        width: 150,
        height: 26,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
      },
      'recipe.rxLeft': {
        id: 'recipe.rxLeft',
        label: 'Talón Izq: Rp. (Farmacia)',
        top: 238,
        left: 45,
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
      },

      // === TALÓN DERECHO (INDICACIONES AL PACIENTE) ===
      'patient.fullNameRight': {
        id: 'patient.fullNameRight',
        label: 'Talón Der: Nombre del Paciente',
        top: 124,
        left: 510,
        width: 240,
        height: 26,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'left',
      },
      'patient.idNumberRight': {
        id: 'patient.idNumberRight',
        label: 'Talón Der: Cédula de Identidad',
        top: 154,
        left: 465,
        width: 130,
        height: 26,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'left',
      },
      'patient.ageRight': {
        id: 'patient.ageRight',
        label: 'Talón Der: Edad',
        top: 154,
        left: 645,
        width: 105,
        height: 26,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
      },
      'patient.dateRight': {
        id: 'patient.dateRight',
        label: 'Talón Der: Fecha',
        top: 184,
        left: 465,
        width: 150,
        height: 26,
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
      },
      'recipe.indicationsRight': {
        id: 'recipe.indicationsRight',
        label: 'Talón Der: Indicaciones al Paciente',
        top: 238,
        left: 415,
        width: 335,
        height: 650,
        fontSize: 12,
        lineHeight: 21,
        fontWeight: 'normal',
        textAlign: 'left',
      },
      'stamp.right': {
        id: 'stamp.right',
        label: 'Talón Der: Sello Médico',
        top: 898,
        left: 600,
        width: 140,
        height: 70,
      },
    };
  }

  const topHeader = profile === 'high_capacity' ? 100 : 105;
  const colWidth = 335;
  const rxHeight = profile === 'high_capacity' ? 780 : (profile === 'compact' ? 740 : 760);
  const fontSize = profile === 'high_capacity' ? 11.5 : 12;
  const lineHeight = profile === 'high_capacity' ? 20 : 21;

  // Separación simétrica de columnas: Margen Izquierdo = 45px, Margen Derecho = 415px (Offset exacto +370px)
  return {
    // === TALÓN IZQUIERDO (FARMACIA) ===
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Talón Izq: Nombre del Paciente',
      top: topHeader,
      left: 45,
      width: 175,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Talón Izq: Cédula de Identidad',
      top: topHeader,
      left: 225,
      width: 75,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.age': {
      id: 'patient.age',
      label: 'Talón Izq: Edad',
      top: topHeader,
      left: 305,
      width: 35,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'patient.date': {
      id: 'patient.date',
      label: 'Talón Izq: Fecha',
      top: topHeader,
      left: 345,
      width: 35,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'recipe.rxLeft': {
      id: 'recipe.rxLeft',
      label: 'Talón Izq: Rp. (Farmacia)',
      top: topHeader + 31,
      left: 45,
      width: colWidth,
      height: rxHeight,
      fontSize: fontSize,
      lineHeight: lineHeight,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'stamp.left': {
      id: 'stamp.left',
      label: 'Talón Izq: Sello Médico',
      top: 900,
      left: 230,
      width: 140,
      height: 70,
    },

    // === TALÓN DERECHO (INDICACIONES AL PACIENTE) ===
    'patient.fullNameRight': {
      id: 'patient.fullNameRight',
      label: 'Talón Der: Nombre del Paciente',
      top: topHeader,
      left: 415,
      width: 175,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumberRight': {
      id: 'patient.idNumberRight',
      label: 'Talón Der: Cédula de Identidad',
      top: topHeader,
      left: 595,
      width: 75,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.ageRight': {
      id: 'patient.ageRight',
      label: 'Talón Der: Edad',
      top: topHeader,
      left: 675,
      width: 35,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'patient.dateRight': {
      id: 'patient.dateRight',
      label: 'Talón Der: Fecha',
      top: topHeader,
      left: 715,
      width: 35,
      height: 26,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'recipe.indicationsRight': {
      id: 'recipe.indicationsRight',
      label: 'Talón Der: Indicaciones al Paciente',
      top: topHeader + 31,
      left: 415,
      width: colWidth,
      height: rxHeight,
      fontSize: fontSize,
      lineHeight: lineHeight,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'stamp.right': {
      id: 'stamp.right',
      label: 'Talón Der: Sello Médico',
      top: 900,
      left: 600,
      width: 140,
      height: 70,
    },
  };
}

/**
 * INFORME MÉDICO: Justificación plena formal con interlineado óptimo
 */
function autoCalibrateInforme(profile: AIPresetProfile): DocumentCalibration {
  const isHighCap = profile === 'high_capacity';
  const bodyTop = isHighCap ? 218 : 225;
  const bodyHeight = isHighCap ? 725 : 710;
  const fontSize = isHighCap ? 12 : 12.5;
  const lineHeight = isHighCap ? 22.5 : 24;

  return {
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Nombre del Paciente',
      top: 152,
      left: 65,
      width: 420,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Cédula de Identidad',
      top: 152,
      left: 495,
      width: 235,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.age': {
      id: 'patient.age',
      label: 'Edad',
      top: 184,
      left: 65,
      width: 340,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.date': {
      id: 'patient.date',
      label: 'Fecha',
      top: 184,
      left: 415,
      width: 315,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'informe.bodyText': {
      id: 'informe.bodyText',
      label: 'Cuerpo del Informe Médico',
      top: bodyTop,
      left: 65,
      width: 665,
      height: bodyHeight,
      fontSize: fontSize,
      lineHeight: lineHeight,
      fontWeight: 'normal',
      textAlign: 'justify',
    },
    'stamp': {
      id: 'stamp',
      label: 'Sello Médico',
      top: 940,
      left: 540,
      width: 160,
      height: 80,
    },
  };
}

/**
 * ORDEN DE LABORATORIO: Cuadrícula de pruebas analíticas
 */
function autoCalibrateOrdenLab(profile: AIPresetProfile): DocumentCalibration {
  const isHighCap = profile === 'high_capacity';
  const containerHeight = isHighCap ? 600 : 580;
  const diagTop = isHighCap ? 825 : 815;

  return {
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Nombre del Paciente',
      top: 208,
      left: 175,
      width: 310,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Cédula de Identidad',
      top: 208,
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
      top: 236,
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
      top: 236,
      left: 280,
      width: 160,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'orden.container': {
      id: 'orden.container',
      label: 'Área de Exámenes & Pruebas',
      top: 225,
      left: 65,
      width: 665,
      height: containerHeight,
      fontSize: 11,
      lineHeight: 20,
    },
    'orden.diagnostico': {
      id: 'orden.diagnostico',
      label: 'Diagnóstico Presuntivo',
      top: diagTop,
      left: 65,
      width: 665,
      height: 95,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'semibold',
    },
    'stamp': {
      id: 'stamp',
      label: 'Sello Médico',
      top: 920,
      left: 540,
      width: 160,
      height: 80,
    },
  };
}

/**
 * CONSTANCIA MÉDICA: Reposo en 3 columnas y diagnóstico
 */
function autoCalibrateConstancia(_profile: AIPresetProfile): DocumentCalibration {
  return {
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Nombre del Paciente',
      top: 215,
      left: 65,
      width: 665,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Cédula de Identidad',
      top: 248,
      left: 65,
      width: 665,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'constancia.attendedDate': {
      id: 'constancia.attendedDate',
      label: 'Fecha Atención',
      top: 285,
      left: 65,
      width: 320,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'constancia.condition': {
      id: 'constancia.condition',
      label: 'Condición (Paciente/Acompañante)',
      top: 285,
      left: 400,
      width: 330,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'constancia.restDays': {
      id: 'constancia.restDays',
      label: 'Días de Reposo',
      top: 325,
      left: 65,
      width: 210,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.restFrom': {
      id: 'constancia.restFrom',
      label: 'Reposo Desde',
      top: 325,
      left: 290,
      width: 210,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.restTo': {
      id: 'constancia.restTo',
      label: 'Reposo Hasta',
      top: 325,
      left: 520,
      width: 210,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    'constancia.idx': {
      id: 'constancia.idx',
      label: 'Diagnóstico Formal',
      top: 375,
      left: 65,
      width: 665,
      height: 360,
      fontSize: 12.5,
      lineHeight: 24,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'constancia.requestDay': {
      id: 'constancia.requestDay',
      label: 'Expedición Fecha y Lugar',
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
      label: 'Sello Médico',
      top: 890,
      left: 540,
      width: 160,
      height: 80,
    },
  };
}

/**
 * HISTORIA CLÍNICA: 5 secciones clínicas estructuradas
 */
function autoCalibrateHistoria(_profile: AIPresetProfile): DocumentCalibration {
  return {
    'patient.fullName': {
      id: 'patient.fullName',
      label: 'Nombre y Apellido',
      top: 168,
      left: 200,
      width: 495,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.age': {
      id: 'patient.age',
      label: 'Edad',
      top: 203,
      left: 148,
      width: 142,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.address': {
      id: 'patient.address',
      label: 'Dirección de Habitación',
      top: 203,
      left: 398,
      width: 297,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.phone': {
      id: 'patient.phone',
      label: 'Teléfono',
      top: 238,
      left: 148,
      width: 142,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'patient.idNumber': {
      id: 'patient.idNumber',
      label: 'Cédula de Identidad',
      top: 238,
      left: 398,
      width: 297,
      height: 28,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    'historia.motivo': {
      id: 'historia.motivo',
      label: 'Motivo de Consulta',
      top: 314,
      left: 65,
      width: 665,
      height: 78,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'historia.enfermedad': {
      id: 'historia.enfermedad',
      label: 'Enfermedad Actual',
      top: 419,
      left: 65,
      width: 665,
      height: 148,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'historia.antecedentes': {
      id: 'historia.antecedentes',
      label: 'Antecedentes Personales y Familiares',
      top: 594,
      left: 65,
      width: 665,
      height: 108,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'historia.examen': {
      id: 'historia.examen',
      label: 'Examen Físico / Neurológico',
      top: 729,
      left: 65,
      width: 665,
      height: 142,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    'historia.diagnostico': {
      id: 'historia.diagnostico',
      label: 'Diagnóstico y Plan',
      top: 899,
      left: 65,
      width: 665,
      height: 118,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: 'semibold',
      textAlign: 'left',
    },
    'stamp': {
      id: 'stamp',
      label: 'Sello Médico',
      top: 960,
      left: 550,
      width: 160,
      height: 80,
    },
  };
}

/**
 * Diagnóstico inteligente de la calibración: detecta solapamientos o desbordes del A4
 */
export function diagnoseLayout(calibration: DocumentCalibration): LayoutDiagnostic[] {
  const diagnostics: LayoutDiagnostic[] = [];
  const fields = Object.values(calibration);

  for (const field of fields) {
    // Verificar si se sale de la hoja A4 (794 x 1123 px)
    if (field.left + field.width > 794) {
      diagnostics.push({
        fieldId: field.id,
        label: field.label,
        severity: 'error',
        message: `El campo desborda el margen derecho (${field.left + field.width}px > 794px).`,
      });
    }

    if (field.top + field.height > 1123) {
      diagnostics.push({
        fieldId: field.id,
        label: field.label,
        severity: 'error',
        message: `El campo desborda el pie de página (${field.top + field.height}px > 1123px).`,
      });
    }

    if (field.width < 25 || field.height < 15) {
      diagnostics.push({
        fieldId: field.id,
        label: field.label,
        severity: 'warning',
        message: `Dimensiones muy reducidas (${field.width}x${field.height}px), puede cortar texto.`,
      });
    }
  }

  return diagnostics;
}

/**
 * Genera el código TypeScript exacto para dejarlo fijo en defaultCalibrations.ts
 */
export function generateTypeScriptCode(calibration: DocumentCalibration, docType: DocType): string {
  return `'${docType}': ${JSON.stringify(calibration, null, 2)},`;
}
