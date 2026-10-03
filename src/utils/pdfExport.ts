/**
 * pdfExport.ts
 * 
 * PILAR 1: PODA QUIRÚRGICA Y API CANÓNICA UNIFICADA
 * ==================================================
 * API limpia, ligera y de alto rendimiento que conecta la interfaz directamente
 * con el motor moderno PDFDocumentPipelineV2 y VectorOverlayEngineV2.
 * Eliminadas conversiones pesadas base64 y capturas de pantalla lentas.
 */

import { DocType, PatientData } from '../types';
import { PDFDocument } from 'pdf-lib';
import { PDFDocumentPipelineV2, DocumentPipelineResponse } from './PDFDocumentPipelineV2';
import type { ClinicalWorkspaceContext } from '../calibration/SemanticDataMapperV2';
import { downloadBlob } from './pdfExportHelpers';
import { PDFTemplatePreloader } from './PDFTemplatePreloader';

// Re-export canonical definitions and helpers
export { DOCUMENT_DEFINITIONS, TEMPLATE_IMAGE_PATHS } from './documentDefinitions';
export type { DocumentDefinition } from './documentDefinitions';
export {
  formatWhatsAppPhone,
  sanitizeFileName,
  toBlobPart,
  toBufferSource,
  downloadBlob,
  uploadPdfForSharing,
  sharePdfToWhatsApp,
  buildWhatsAppMessage,
  copyImageToClipboard,
} from './pdfExportHelpers';
export type { SharePdfOptions, SharedDocumentResult } from './pdfExportHelpers';
export { PDFDocumentPipelineV2 } from './PDFDocumentPipelineV2';
export type { DocumentPipelineRequest, DocumentPipelineResponse } from './PDFDocumentPipelineV2';

/**
 * Carga el documento PDF maestro en memoria para validación o análisis estructural.
 */
export async function loadBasePdf(filename: string): Promise<PDFDocument> {
  const cleanPath = filename.startsWith('/') ? filename : `/templates/${filename}`;
  const bytes = await PDFTemplatePreloader.getOrFetch(cleanPath);
  return await PDFDocument.load(bytes);
}

export interface LabOrderExportOptions {
  labTests?: Record<string, boolean> | string[];
  neuroimagingTests?: Record<string, boolean> | string[];
  neuroimagingDetails?: Record<string, string>;
  selectedCheckboxes?: Record<string, { x: number; y: number; page: number }>;
}

export interface ClinicalDataBundle {
  recipeData?: { pharmacy?: string; patientIndications?: string; rxLeft?: string; indicationsRight?: string };
  labData?: {
    labTests?: Record<string, boolean> | string[];
    neuroimagingTests?: Record<string, boolean> | string[];
    neuroimagingDetails?: Record<string, string>;
    presumptiveDx?: string;
    otherExams?: string;
  };
  informeData?: { bodyText?: string };
  constanciaData?: {
    restDays?: string | number;
    diagnosis?: string;
    idx?: string;
    condition?: string;
    needsRest?: boolean;
    attendedDate?: string;
    restFrom?: string;
    restTo?: string;
    requestDay?: string;
    requestMonth?: string;
    requestYear?: string;
  };
  historiaData?: {
    motivo?: string;
    motivoConsulta?: string;
    enfermedadActual?: string;
    antecedentes?: string;
    neuroExam?: string;
    examenNeurologico?: string;
    dx?: string;
    diagnostico?: string;
  };
}

// ----------------------------------------------------------------------------
// GENERADORES CANÓNICOS OFICIALES (100% VECTORIAL DIRECTO SOBRE PDF MAESTRO)
// ----------------------------------------------------------------------------

export async function createOfficialRecipePdf(
  patient: { fullName?: string; idNumber?: string; age?: string | number; date?: string },
  recipeData: { rxLeft?: string; indicationsRight?: string },
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  const context: ClinicalWorkspaceContext = {
    patient: {
      fullName: patient.fullName || '',
      idNumber: patient.idNumber || '',
      age: patient.age ? String(patient.age) : '',
      date: patient.date || new Date().toLocaleDateString('es-VE'),
    },
    recipeLeft: recipeData.rxLeft || '',
    recipeRight: recipeData.indicationsRight || '',
    documentDate: patient.date || new Date().toLocaleDateString('es-VE'),
  };

  return await PDFDocumentPipelineV2.generateDocument({
    documentType: 'recipe',
    context,
    customFileName,
    customBgImage,
  });
}

export async function exportOfficialRecipePDF(
  patient: { fullName?: string; idNumber?: string; age?: string | number; date?: string },
  recipeData: { rxLeft?: string; indicationsRight?: string },
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  const result = await createOfficialRecipePdf(patient, recipeData, customFileName, customBgImage);
  downloadBlob(result.pdfBytes, result.fileName);
  return result;
}

export async function createOfficialLabOrderPdf(
  patient: { fullName?: string; idNumber?: string; age?: string | number; date?: string; phone?: string; address?: string },
  orderData: LabOrderExportOptions | Record<string, any>,
  presumptiveDx: string = '',
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  const context: ClinicalWorkspaceContext = {
    patient: {
      fullName: patient.fullName || '',
      idNumber: patient.idNumber || '',
      age: patient.age ? String(patient.age) : '',
      phone: (patient as any).phone || '',
      address: (patient as any).address || '',
    },
    clinical: {
      diagnosisPrincipal: presumptiveDx || '',
      labTests: (orderData as any)?.perfilPreoperatorio || (orderData as any)?.labTests || orderData,
      neuroimagingTests: (orderData as any)?.neuroimagen || (orderData as any)?.neuroimagingTests,
      otherExams: (orderData as any)?.otrosEstudios || (orderData as any)?.otherExams || '',
    },
    documentDate: patient.date || new Date().toLocaleDateString('es-VE'),
  };

  return await PDFDocumentPipelineV2.generateDocument({
    documentType: 'lab_order',
    context,
    customFileName,
    customBgImage,
  });
}

export async function exportOfficialLabOrderPDF(
  patient: { fullName?: string; idNumber?: string; age?: string | number; date?: string; phone?: string; address?: string },
  orderData: LabOrderExportOptions | Record<string, any>,
  presumptiveDxOrFileName?: string,
  customFileName?: string
): Promise<DocumentPipelineResponse> {
  const isFileName = presumptiveDxOrFileName && presumptiveDxOrFileName.endsWith('.pdf');
  const actualFileName = isFileName ? presumptiveDxOrFileName : customFileName;
  const presumptiveDx = isFileName
    ? ((orderData as any)?.diagnosticoPresuntivo || (orderData as any)?.diagnosisPrincipal || '')
    : (presumptiveDxOrFileName || (orderData as any)?.diagnosticoPresuntivo || '');

  const result = await createOfficialLabOrderPdf(patient, orderData, presumptiveDx, actualFileName);
  downloadBlob(result.pdfBytes, result.fileName);
  return result;
}

export async function createOfficialInformePdf(
  patient: { fullName?: string; idNumber?: string; age?: string | number; date?: string },
  reportData: { content?: string; diagnosis?: string; bodyText?: string } | string,
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  const bodyText = typeof reportData === 'string'
    ? reportData
    : (reportData.bodyText || reportData.content || reportData.diagnosis || '');

  const context: ClinicalWorkspaceContext = {
    patient: {
      fullName: patient.fullName || '',
      idNumber: patient.idNumber || '',
      age: patient.age ? String(patient.age) : '',
      date: patient.date || new Date().toLocaleDateString('es-VE'),
    },
    clinical: {
      clinicalReport: bodyText,
      reportText: bodyText,
      diagnosisPrincipal: typeof reportData === 'object' ? (reportData.diagnosis || '') : '',
    },
    documentDate: patient.date || new Date().toLocaleDateString('es-VE'),
  };

  return await PDFDocumentPipelineV2.generateDocument({
    documentType: 'report',
    context,
    customFileName,
    customBgImage,
  });
}

export async function exportOfficialInformePDF(
  patient: { fullName?: string; idNumber?: string; age?: string | number; date?: string },
  reportData: { content?: string; diagnosis?: string; bodyText?: string } | string,
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  const result = await createOfficialInformePdf(patient, reportData, customFileName, customBgImage);
  downloadBlob(result.pdfBytes, result.fileName);
  return result;
}

export async function createOfficialConstanciaPdf(
  patient: { fullName?: string; idNumber?: string; date?: string; guideNumber?: string; condition?: string },
  certificateData: {
    restDays?: string | number;
    diagnosis?: string;
    idx?: string;
    condition?: string;
    needsRest?: boolean;
    attendedDate?: string;
    restFrom?: string;
    restTo?: string;
    requestDay?: string;
    requestMonth?: string;
    requestYear?: string;
    isPaciente?: boolean;
    isFamiliar?: boolean;
  },
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  const context: ClinicalWorkspaceContext = {
    patient: {
      fullName: patient.fullName || '',
      idNumber: patient.idNumber || '',
      date: patient.date || new Date().toLocaleDateString('es-VE'),
    },
    clinical: {
      diagnosisPrincipal: certificateData.idx || certificateData.diagnosis || '',
    },
    certificateText: certificateData.idx || certificateData.diagnosis || '',
    documentDate: patient.date || new Date().toLocaleDateString('es-VE'),
    ...({
      certificateData: {
        restDays: certificateData.restDays,
        diagnosis: certificateData.idx || certificateData.diagnosis,
        needsRest: certificateData.needsRest,
        attendedDate: certificateData.attendedDate || patient.date || new Date().toLocaleDateString('es-VE'),
        restFrom: certificateData.restFrom,
        restTo: certificateData.restTo,
        requestDay: certificateData.requestDay,
        requestMonth: certificateData.requestMonth,
        requestYear: certificateData.requestYear,
        isPaciente: certificateData.isPaciente ?? (certificateData.condition?.toLowerCase() === 'paciente' || !certificateData.condition),
        isFamiliar: certificateData.isFamiliar ?? (certificateData.condition?.toLowerCase() === 'familiar'),
      }
    } as any),
  };

  return await PDFDocumentPipelineV2.generateDocument({
    documentType: 'certificate',
    context,
    customFileName,
    customBgImage,
  });
}

export async function exportOfficialConstanciaPDF(
  patient: { fullName?: string; idNumber?: string; date?: string; guideNumber?: string; condition?: string },
  certificateData: {
    restDays?: string | number;
    diagnosis?: string;
    idx?: string;
    condition?: string;
    needsRest?: boolean;
    attendedDate?: string;
    restFrom?: string;
    restTo?: string;
    requestDay?: string;
    requestMonth?: string;
    requestYear?: string;
  },
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  const result = await createOfficialConstanciaPdf(patient, certificateData, customFileName, customBgImage);
  downloadBlob(result.pdfBytes, result.fileName);
  return result;
}

export async function createOfficialHistoriaPdf(
  patient: { fullName?: string; idNumber?: string; age?: string | number; phone?: string; address?: string; date?: string },
  clinical: {
    motivo?: string;
    motivoConsulta?: string;
    enfermedadActual?: string;
    antecedentes?: string;
    neuroExam?: string;
    examenNeurologico?: string;
    dx?: string;
    diagnostico?: string;
  },
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  const context: ClinicalWorkspaceContext = {
    patient: {
      fullName: patient.fullName || '',
      idNumber: patient.idNumber || '',
      age: patient.age ? String(patient.age) : '',
      phone: patient.phone || '',
      address: patient.address || '',
      date: patient.date || new Date().toLocaleDateString('es-VE'),
    },
    clinical: {
      motivoConsulta: clinical.motivoConsulta || clinical.motivo || '',
      enfermedadActual: clinical.enfermedadActual || '',
      antecedentes: clinical.antecedentes || '',
      examenFisico: clinical.examenNeurologico || clinical.neuroExam || '',
      diagnosisPrincipal: clinical.diagnostico || clinical.dx || '',
    },
    documentDate: patient.date || new Date().toLocaleDateString('es-VE'),
  };

  return await PDFDocumentPipelineV2.generateDocument({
    documentType: 'history',
    context,
    customFileName,
    customBgImage,
  });
}

export async function exportOfficialHistoriaPDF(
  patient: { fullName?: string; idNumber?: string; age?: string | number; address?: string; phone?: string; date?: string },
  clinical: {
    motivo?: string;
    motivoConsulta?: string;
    enfermedadActual?: string;
    antecedentes?: string;
    neuroExam?: string;
    examenNeurologico?: string;
    dx?: string;
    diagnostico?: string;
  },
  customFileName?: string
): Promise<DocumentPipelineResponse> {
  const result = await createOfficialHistoriaPdf(patient, clinical, customFileName);
  downloadBlob(result.pdfBytes, result.fileName);
  return result;
}

// ----------------------------------------------------------------------------
// DISPATCHER CANÓNICO UNIVERSAL
// ----------------------------------------------------------------------------
export async function generateCanonicalDocumentPDF(
  docKey: DocType,
  patient: PatientData,
  bundle: ClinicalDataBundle,
  customFileName?: string,
  customBgImage?: string | null
): Promise<DocumentPipelineResponse> {
  switch (docKey) {
    case 'RECIPES':
      return await createOfficialRecipePdf(
        {
          fullName: patient.fullName,
          idNumber: patient.idNumber,
          age: patient.age,
          date: patient.date,
        },
        {
          rxLeft: bundle.recipeData?.rxLeft || bundle.recipeData?.pharmacy,
          indicationsRight: bundle.recipeData?.indicationsRight || bundle.recipeData?.patientIndications,
        },
        customFileName,
        customBgImage
      );

    case 'ORDEN_LAB':
      return await createOfficialLabOrderPdf(
        {
          fullName: patient.fullName,
          idNumber: patient.idNumber,
          age: patient.age,
          date: patient.date,
        },
        {
          labTests: bundle.labData?.labTests || [],
          neuroimagingTests: bundle.labData?.neuroimagingTests,
          neuroimagingDetails: bundle.labData?.neuroimagingDetails,
          otherExams: bundle.labData?.otherExams || '',
        },
        bundle.labData?.presumptiveDx || '',
        customFileName,
        customBgImage
      );

    case 'INFORME':
      return await createOfficialInformePdf(
        {
          fullName: patient.fullName,
          idNumber: patient.idNumber,
          age: patient.age,
          date: patient.date,
        },
        {
          bodyText: bundle.informeData?.bodyText,
        },
        customFileName,
        customBgImage
      );

    case 'CONSTANCIA':
      return await createOfficialConstanciaPdf(
        {
          fullName: patient.fullName,
          idNumber: patient.idNumber,
          date: patient.date,
          guideNumber: patient.guideNumber,
          condition: bundle.constanciaData?.condition || patient.condition,
        },
        {
          restDays: bundle.constanciaData?.restDays,
          diagnosis: bundle.constanciaData?.diagnosis || bundle.constanciaData?.idx,
          idx: bundle.constanciaData?.idx || bundle.constanciaData?.diagnosis,
          condition: bundle.constanciaData?.condition || patient.condition,
          needsRest: bundle.constanciaData?.needsRest,
          attendedDate: bundle.constanciaData?.attendedDate,
          restFrom: bundle.constanciaData?.restFrom,
          restTo: bundle.constanciaData?.restTo,
          requestDay: bundle.constanciaData?.requestDay,
          requestMonth: bundle.constanciaData?.requestMonth,
          requestYear: bundle.constanciaData?.requestYear,
        },
        customFileName,
        customBgImage
      );

    case 'HISTORIA':
      return await createOfficialHistoriaPdf(
        {
          fullName: patient.fullName,
          idNumber: patient.idNumber,
          age: patient.age,
          phone: patient.phone,
          address: patient.address,
          date: patient.date,
        },
        {
          motivoConsulta: bundle.historiaData?.motivoConsulta || bundle.historiaData?.motivo,
          enfermedadActual: bundle.historiaData?.enfermedadActual,
          antecedentes: bundle.historiaData?.antecedentes,
          examenNeurologico: bundle.historiaData?.examenNeurologico || bundle.historiaData?.neuroExam,
          diagnostico: bundle.historiaData?.diagnostico || bundle.historiaData?.dx,
        },
        customFileName,
        customBgImage
      );

    default:
      throw new Error(`Tipo de documento clínico oficial desconocido: ${docKey}`);
  }
}
