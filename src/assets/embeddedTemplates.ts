import { DocType } from '../types';

/**
 * RECURSOS OFICIALES EMBEBIDOS DE FÁBRICA (ZERO CONFIGURATION)
 * INSTITUTO DE CIRUGÍA DE COLUMNA MÍNIMAMENTE INVASIVA (CCMI)
 * DR. SAMIR MOUCHARRAFIE NAIME
 *
 * Mapeo permanente y precargado de las 5 plantillas oficiales de imprenta (Magic Graphic)
 * en formato Imagen 300 DPI y en formato PDF Vectorial original.
 */

export const LAB_P1_TEMPLATE = '/templates/orden_lab_p1_bg.jpg';
export const LAB_P2_TEMPLATE = '/templates/orden_lab_p2_bg.jpg';

export const EMBEDDED_TEMPLATES: Record<DocType | 'ORDEN_LAB_P2', string> = {
  RECIPES: '/templates/recipes_bg.jpg',
  INFORME: '/templates/informe_bg.jpg',
  ORDEN_LAB: '/templates/orden_lab_p1_bg.jpg',
  ORDEN_LAB_P2: '/templates/orden_lab_p2_bg.jpg',
  CONSTANCIA: '/templates/constancia_bg.jpg',
  HISTORIA: '/templates/historia_bg.jpg',
};

export const EMBEDDED_PDF_TEMPLATES: Record<DocType | 'ORDEN_LAB_P2', string> = {
  RECIPES: '/templates/recipe_base.pdf',
  INFORME: '/templates/informe_base.pdf',
  ORDEN_LAB: '/templates/orden_lab_base.pdf',
  ORDEN_LAB_P2: '/templates/orden_lab_base.pdf',
  CONSTANCIA: '/templates/constancia_base.pdf',
  HISTORIA: '/templates/historia_base.pdf',
};

export interface TemplateFileInfo {
  name: string;
  shortName: string;
  imgUrl: string;
  pdfUrl: string;
  resolution: string;
  dimensions: string;
  description: string;
  type: string;
}

export const TEMPLATE_FILE_INFO: Record<string, TemplateFileInfo> = {
  RECIPES: {
    name: 'Plantilla Oficial Récipe Médico (Doble Talón Farmacia + Indicaciones)',
    shortName: 'Récipe Doble Talón',
    imgUrl: '/templates/recipes_bg.jpg',
    pdfUrl: '/templates/recipe_base.pdf',
    resolution: '300 DPI (1588 × 2246 px)',
    dimensions: 'A4 Estándar (794 × 1123 px)',
    description: 'Talonario duplicado con membrete del Instituto CCMI para prescripción de fármacos y régimen posológico.',
    type: 'PDF / JPG Imprenta',
  },
  INFORME: {
    name: 'Plantilla Oficial Informe Médico Neuroquirúrgico',
    shortName: 'Informe Médico',
    imgUrl: '/templates/informe_bg.jpg',
    pdfUrl: '/templates/informe_base.pdf',
    resolution: '300 DPI (1588 × 2246 px)',
    dimensions: 'A4 Estándar (794 × 1123 px)',
    description: 'Documento legal de evaluación especializada con diagnóstico principal, secundario y conducta.',
    type: 'PDF / JPG Imprenta',
  },
  ORDEN_LAB: {
    name: 'Plantilla Oficial Orden de Laboratorio (Página 1 - Bioquímica y Perfiles)',
    shortName: 'Orden Lab (Pág. 1)',
    imgUrl: '/templates/orden_lab_p1_bg.jpg',
    pdfUrl: '/templates/orden_lab_base.pdf',
    resolution: '300 DPI (1813 × 2549 px)',
    dimensions: 'Media Carta (153.5 × 215.8 mm)',
    description: 'Hoja de solicitud de perfiles hematológicos, coagulación, química sanguínea y marcadores.',
    type: 'PDF / JPG Imprenta',
  },
  ORDEN_LAB_P2: {
    name: 'Plantilla Oficial Neuroimagen y Estudios Especiales (Página 2 - Resonancia y Tomografía)',
    shortName: 'Neuroimagen (Pág. 2)',
    imgUrl: '/templates/orden_lab_p2_bg.jpg',
    pdfUrl: '/templates/orden_lab_base.pdf',
    resolution: '300 DPI (1813 × 2549 px)',
    dimensions: 'Media Carta (153.5 × 215.8 mm)',
    description: 'Hoja especializada para solicitud de RMN de columna lumbar, cervical, TAC y electromiografía.',
    type: 'PDF / JPG Imprenta',
  },
  CONSTANCIA: {
    name: 'Plantilla Oficial Constancia Médica de Reposo / Asistencia',
    shortName: 'Constancia de Reposo',
    imgUrl: '/templates/constancia_bg.jpg',
    pdfUrl: '/templates/constancia_base.pdf',
    resolution: '300 DPI (2549 × 1650 px)',
    dimensions: 'Media Carta Horizontal (215.8 × 139.7 mm)',
    description: 'Certificación de reposo laboral con desglose de días continuos, fechas desde/hasta e IDX.',
    type: 'PDF / JPG Imprenta',
  },
  HISTORIA: {
    name: 'Plantilla Oficial Historia Clínica Especializada de Columna y Neurocirugía',
    shortName: 'Historia Clínica',
    imgUrl: '/templates/historia_bg.jpg',
    pdfUrl: '/templates/historia_base.pdf',
    resolution: '300 DPI (1588 × 2246 px)',
    dimensions: 'A4 Estándar (794 × 1123 px)',
    description: 'Expediente médico exhaustivo con motivo de consulta, enfermedad actual, antecedentes y examen neurológico.',
    type: 'PDF / JPG Imprenta',
  },
};

export const TEMPLATE_NAMES: Record<DocType, string> = {
  RECIPES: 'Récipe Médico (Doble Talón Farmacia + Indicaciones)',
  INFORME: 'Informe Médico Neuroquirúrgico Oficial',
  ORDEN_LAB: 'Orden de Laboratorio y Neuroimagen Especializada',
  CONSTANCIA: 'Constancia Médica de Reposo / Asistencia',
  HISTORIA: 'Historia Clínica Especializada de Columna y Neurocirugía',
};

/**
 * Obtiene la URL estática de la plantilla oficial de fábrica en imagen JPG (300 DPI).
 */
export function getOfficialTemplateUrl(docType: DocType | string): string {
  if (docType === 'ORDEN_LAB_P2') return LAB_P2_TEMPLATE;
  if (docType === 'ORDEN_LAB') return LAB_P1_TEMPLATE;
  return (EMBEDDED_TEMPLATES as any)?.[docType] || EMBEDDED_TEMPLATES?.RECIPES || '/templates/recipes_bg.jpg';
}

/**
 * Obtiene la URL del archivo PDF original precargado de fábrica.
 */
export function getOfficialPdfUrl(docType: DocType | string): string {
  return (EMBEDDED_PDF_TEMPLATES as any)?.[docType] || EMBEDDED_PDF_TEMPLATES?.RECIPES || '/templates/recipe_base.pdf';
}

/**
 * Precarga de alta velocidad para todos los fondos oficiales en la memoria del navegador.
 */
export function preloadAllOfficialTemplates(): void {
  if (typeof window === 'undefined') return;
  const allTemplates = [...Object.values(EMBEDDED_TEMPLATES), LAB_P1_TEMPLATE, LAB_P2_TEMPLATE];
  allTemplates.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}
