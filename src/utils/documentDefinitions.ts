import { DocType } from '../types';

export interface DocumentDefinition {
  id: DocType;
  label: string;
  shortName: string;
  filenamePrefix: string;
  pageCount: number;
  widthMm?: number;
  heightMm?: number;
  description?: string;
}

export const DOCUMENT_DEFINITIONS: Record<DocType, DocumentDefinition> = {
  RECIPES: {
    id: 'RECIPES',
    label: 'Récipe Médico (Doble Talón Farmacia + Indicaciones)',
    shortName: 'Récipe Médico',
    filenamePrefix: 'Recipe_Doble_Talon',
    pageCount: 1,
    widthMm: 210,
    heightMm: 297,
    description: 'Talonario duplicado con membrete del Instituto CCMI para prescripción de fármacos y régimen posológico.',
  },
  INFORME: {
    id: 'INFORME',
    label: 'Informe Médico Neuroquirúrgico Especializado',
    shortName: 'Informe Médico',
    filenamePrefix: 'Informe_Medico',
    pageCount: 1,
    widthMm: 210,
    heightMm: 297,
    description: 'Documento legal de evaluación especializada con diagnóstico principal, secundario y conducta.',
  },
  ORDEN_LAB: {
    id: 'ORDEN_LAB',
    label: 'Orden de Laboratorio y Neuroimagen Especializada',
    shortName: 'Orden de Laboratorio',
    filenamePrefix: 'Orden_Laboratorio_Neuroimagen',
    pageCount: 2,
    widthMm: 153.5,
    heightMm: 215.8,
    description: 'Hoja de solicitud de perfiles hematológicos, bioquímica y neuroimagen (RMN / TAC).',
  },
  CONSTANCIA: {
    id: 'CONSTANCIA',
    label: 'Constancia Médica de Reposo / Asistencia',
    shortName: 'Constancia Médica',
    filenamePrefix: 'Constancia_Medica_Reposo',
    pageCount: 1,
    widthMm: 215.8,
    heightMm: 139.7,
    description: 'Certificación de reposo laboral con desglose de días continuos y fechas.',
  },
  HISTORIA: {
    id: 'HISTORIA',
    label: 'Historia Clínica Especializada de Columna y Neurocirugía',
    shortName: 'Historia Clínica',
    filenamePrefix: 'Historia_Clinica_Columna',
    pageCount: 1,
    widthMm: 210,
    heightMm: 297,
    description: 'Expediente médico exhaustivo con motivo de consulta, antecedentes y examen neurológico.',
  },
};

export const TEMPLATE_IMAGE_PATHS: Record<DocType, string> = {
  RECIPES: '/templates/recipes_bg.jpg',
  INFORME: '/templates/informe_bg.jpg',
  ORDEN_LAB: '/templates/orden_lab_p1_bg.jpg',
  CONSTANCIA: '/templates/constancia_bg.jpg',
  HISTORIA: '/templates/historia_bg.jpg',
};
