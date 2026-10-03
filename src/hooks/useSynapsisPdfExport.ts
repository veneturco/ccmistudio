/**
 * useSynapsisPdfExport.ts
 * 
 * PILAR 3 & 5: HOOK DE EXPORTACIÓN Y GENERACIÓN INSTANTÁNEA (<50 MS)
 * =================================================================
 * Maneja la generación canónica de PDF, descarga directa, envío por WhatsApp
 * y registro en el historial de documentos emitidos.
 */

import { useState, useCallback } from 'react';
import { DocType, PatientData, ProcessedDocumentResult } from '../types';
import { PDFDocumentPipelineV2, DocumentPipelineResponse } from '../utils/PDFDocumentPipelineV2';
import { ClinicalWorkspaceContext } from '../calibration/SemanticDataMapperV2';
import { downloadBlob, formatWhatsAppPhone, sharePdfToWhatsApp, buildWhatsAppMessage } from '../utils/pdfExportHelpers';
import { ClinicalValidationGuard, ValidationResult } from '../utils/clinicalValidation';
import { DigitalSignatureQR } from '../utils/digitalSignatureQR';

export interface UsePdfExportOptions {
  onDocumentGenerated?: (doc: ProcessedDocumentResult) => void;
}

export function useSynapsisPdfExport(options?: UsePdfExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<{
    blob: Blob;
    fileName: string;
    url: string;
    docResult?: ProcessedDocumentResult;
  } | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  /**
   * Genera el PDF vectorial de alta fidelidad directamente sobre el PDF maestro
   */
  const generateOfficialPdf = useCallback(
    async (
      docType: DocType,
      patient: PatientData,
      contextData: Partial<ClinicalWorkspaceContext['clinical']>,
      doctorStampBase64?: string
    ): Promise<DocumentPipelineResponse | null> => {
      setIsExporting(true);
      setExportError(null);

      try {
        // 1. Guarda de Validación Clínica
        const validation = ClinicalValidationGuard.validate(docType, patient, {
          recipeData: {
            medications: contextData.medications,
            generalIndications: contextData.generalIndications,
          },
          informeData: {
            diagnosisPrincipal: contextData.diagnosisPrincipal,
            clinicalReport: contextData.clinicalReport,
          },
          constanciaData: {
            attendedDate: contextData.attendedDate,
            restDays: contextData.restDays,
            restFrom: contextData.restFrom,
            restTo: contextData.restTo,
            diagnosisPrincipal: contextData.diagnosisPrincipal,
          },
          historiaData: {
            consultReason: (contextData as any)?.consultReason,
            currentIllness: (contextData as any)?.currentIllness,
            diagnosis: contextData.diagnosisPrincipal,
          },
          labData: {
            testsSelectedCount: Object.values(contextData.labTests || {}).filter(Boolean).length,
            presumptiveDiagnosis: contextData.diagnosisPrincipal,
          },
        });

        setValidationResult(validation);

        if (!validation.canProceed) {
          const firstErr = validation.errors[0]?.message || 'Verifique los datos requeridos antes de emitir.';
          setExportError(firstErr);
          setIsExporting(false);
          return null;
        }

        // 2. Preparar Contexto Semántico Unificado
        const nationalId = patient.nationalId || patient.idNumber;
        const qrVerificationUrl = DigitalSignatureQR.generateVerificationUrl(
          docType,
          patient.fullName,
          nationalId,
          (contextData as any)?.date
        );

        const fullContext: ClinicalWorkspaceContext = {
          patient: {
            fullName: patient.fullName || '',
            idNumber: nationalId || '',
            age: patient.age || '',
            gender: (patient.gender === 'F' ? 'F' : 'M') as 'M' | 'F',
            phone: patient.phone || '',
            address: patient.address || '',
            allergies: patient.allergies || 'Negadas',
          },
          clinical: {
            ...contextData,
            qrVerificationUrl,
          },
        };

        // 3. Ejecución del Pipeline Vectorial (< 50 ms en RAM)
        const result = await PDFDocumentPipelineV2.generateDocument({
          documentType: docType,
          context: fullContext,
          doctorStampBase64,
        });

        const url = URL.createObjectURL(result.blob);

        const newDocResult: ProcessedDocumentResult = {
          id: `doc_${Date.now()}`,
          docNumber: `CCMI-${Date.now().toString().slice(-6)}`,
          documentType: docType === 'RECIPES' ? 'recipe' : docType === 'CONSTANCIA' ? 'certificate' : 'recipe',
          patient: {
            fullName: patient.fullName,
            idType: (patient.idType as any) || 'V',
            nationalId: nationalId,
            age: patient.age,
            gender: (patient.gender as any) || 'M',
            allergies: patient.allergies || 'Negadas',
            phone: patient.phone,
          },
          structuredData: {
            diagnosisPrincipal: contextData.diagnosisPrincipal || '',
            secondaryDiagnoses: [],
            medications: (contextData.medications || []).map((m, idx) => ({
              id: `m_${idx}`,
              drug: m.drug,
              dose: m.dose || '',
              frequency: m.frequency || '',
              duration: m.duration || '',
              instructions: m.instructions || '',
            })),
            generalIndications: contextData.generalIndications || [],
            summaryNote: contextData.clinicalReport || '',
          },
          templateName: `Documento Oficial CCMI (${docType})`,
          pdfExportUrl: url,
          generatedAt: new Date().toLocaleDateString('es-VE'),
          doctorName: 'Dr. Samir Moucharrafie',
          doctorRegistration: 'M.P.P.S. 61231 / C.M.E.B. 5331',
        };

        setLastGeneratedPdf({
          blob: result.blob,
          fileName: result.fileName,
          url,
          docResult: newDocResult,
        });

        if (options?.onDocumentGenerated) {
          options.onDocumentGenerated(newDocResult);
        }

        return result;
      } catch (err: any) {
        console.error('[useSynapsisPdfExport] Error generando documento:', err);
        setExportError(err?.message || 'Error al generar el documento oficial.');
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [options]
  );

  /**
   * Descarga inmediata del archivo PDF
   */
  const downloadCurrentPdf = useCallback((blob: Blob, fileName: string) => {
    downloadBlob(blob, fileName);
  }, []);

  /**
   * Envío directo a WhatsApp
   */
  const sendToWhatsApp = useCallback(
    async (
      patientPhone: string,
      patientName: string,
      docType: DocType,
      pdfBlob: Blob,
      pdfFileName: string
    ) => {
      try {
        const formattedPhone = formatWhatsAppPhone(patientPhone);
        const customMessage = buildWhatsAppMessage({
          patientName,
          docTitle: docType,
          doctorName: 'Dr. Samir Moucharrafie Naime',
        });
        sharePdfToWhatsApp(formattedPhone, customMessage);
        return true;
      } catch (err: any) {
        console.warn('[useSynapsisPdfExport] Envío a WhatsApp:', err);
        return false;
      }
    },
    []
  );

  return {
    isExporting,
    lastGeneratedPdf,
    validationResult,
    exportError,
    generateOfficialPdf,
    downloadCurrentPdf,
    sendToWhatsApp,
    clearExportError: () => setExportError(null),
  };
}
