/**
 * CanonicalDocumentGeneratorV2.ts
 * 
 * GENERADOR CANÓNICO DE DOCUMENTOS MÉDICOS V2
 * ===========================================
 * Ruta oficial canónica: generateCanonicalDocumentPDF()
 * 
 * Flujo estricto de seguridad:
 *   1. Resolve MasterTemplateV2 autoritativo (TemplateRegistry / CalibrationStorageV2).
 *   2. Load PDF Maestro Original inmutable.
 *   3. Validate Master Template (CalibrationValidator).
 *   4. Validate Real PDF Page Size (PDFMasterSizeValidator) sin fallbacks de 297/210mm.
 *   5. Build & Resolve Semantic Data (DataResolver).
 *   6. Render Vector Overlay (OverlayRenderer con font.widthOfTextAtSize de pdf-lib).
 *   7. Validate Result (verificar desbordamientos y colisiones con regiones bloqueadas).
 *   8. Return Production PDF or Block if requiresReview / critical failure.
 * 
 * REGLA DE ORO:
 * Si falla una validación crítica: NO generar PDF oficial y emitir reporte estructurado.
 */

import { TemplateRegistry } from './TemplateRegistry';
import { CalibrationStorageV2 } from './CalibrationStorageV2';
import { CalibrationValidator } from './CalibrationValidator';
import { PDFMasterSizeValidator } from './PDFMasterSizeValidator';
import { DataResolver, ClinicalWorkspaceContext } from './DataResolver';
import { OverlayRenderer, OverlayExecutionReport } from './OverlayRenderer';
import { MasterTemplateV2 } from './types/MasterTemplateV2';

export interface CanonicalGenerationRequest {
  documentTypeOrId: string; // 'RECIPE-001' | 'recipe' | 'INFORME-001' | 'informe' | etc.
  context: ClinicalWorkspaceContext;
  customFileName?: string;
  debugMode?: boolean;      // Solo para desarrollo; falso en producción
  strictMode?: boolean;     // Si es true, cualquier warning impide generar el oficial
}

export interface CanonicalGenerationResult {
  success: boolean;
  pdfBytes: Uint8Array | null;
  fileName: string;
  template: MasterTemplateV2;
  requiresReview: boolean;
  warnings: string[];
  errors: string[];
  elementCount: number;
}

export class CanonicalDocumentGeneratorV2 {
  /**
   * Carga el buffer del PDF maestro inmutable
   */
  private static async loadOriginalPdf(path: string): Promise<Uint8Array> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(cleanPath);
    if (!response.ok) {
      throw new Error(`[CanonicalV2] No se pudo cargar el PDF maestro original desde '${cleanPath}' (HTTP ${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Genera el documento médico oficial canónico respetando los 8 pasos de seguridad
   */
  public static async generateCanonicalDocumentPDF(
    request: CanonicalGenerationRequest
  ): Promise<CanonicalGenerationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Obtener MasterTemplateV2 autoritativo
    const template = CalibrationStorageV2.getAuthoritativeTemplate(request.documentTypeOrId);
    if (!template) {
      return {
        success: false,
        pdfBytes: null,
        fileName: 'ERROR_DOCUMENT.pdf',
        template: null as any,
        requiresReview: true,
        warnings: [],
        errors: [`No se encontró ninguna plantilla registrada para '${request.documentTypeOrId}'`],
        elementCount: 0,
      };
    }

    // Alerta si el documento requiere calibración física (como LAB-001)
    if ((template.status as any) === 'REQUIRES_CALIBRATION' || template.masterId === 'LAB-001') {
      warnings.push(
        `[AUDITORÍA FÍSICA] El documento '${template.masterId}' está clasificado como REQUIRES_CALIBRATION hasta validar la geometría extraída del PDF original.`
      );
    }

    // 2. Cargar PDF Maestro Original
    let originalPdfBytes: Uint8Array;
    try {
      originalPdfBytes = await this.loadOriginalPdf(template.source.backgroundPdf);
    } catch (err: any) {
      return {
        success: false,
        pdfBytes: null,
        fileName: 'ERROR_PDF_LOAD.pdf',
        template,
        requiresReview: true,
        warnings,
        errors: [err.message],
        elementCount: 0,
      };
    }

    // 3. Validar MasterTemplate V2
    const masterValidation = await CalibrationValidator.validateMasterTemplate(template, originalPdfBytes);
    if (masterValidation.verdict === 'ERROR') {
      masterValidation.issues.forEach((issue) => {
        if (issue.severity === 'ERROR') errors.push(`[Template] ${issue.message}`);
        else warnings.push(`[Template] ${issue.message}`);
      });
    }

    // 4. Validar Tamaño Físico de Página (sin fallbacks de 297/210mm)
    const sizeInspection = await PDFMasterSizeValidator.inspectPdfMaster(originalPdfBytes, template);
    if (!sizeInspection.isValid) {
      errors.push(
        `[PDF Size Mismatch] Las dimensiones físicas del PDF maestro no coinciden con la especificación del master (${template.masterId}). Emisión bloqueada.`
      );
    }

    // 5. Resolver Diccionario Semántico
    const semanticDict = DataResolver.buildSemanticDictionary(request.context);

    // Si hubo errores críticos en validación previa, abortar generación oficial
    if (errors.length > 0) {
      return {
        success: false,
        pdfBytes: null,
        fileName: 'REJECTED_OFFICIAL_DOCUMENT.pdf',
        template,
        requiresReview: true,
        warnings,
        errors,
        elementCount: 0,
      };
    }

    // 6. Inyección de Overlay Vectorial
    const renderReport: OverlayExecutionReport = await OverlayRenderer.render(
      originalPdfBytes,
      template,
      semanticDict,
      {
        doctorStampBase64: request.context.doctorStampBase64,
        signatureBase64: request.context.signatureBase64,
        debugMode: Boolean(request.debugMode),
      }
    );

    // 7. Consolidar resultados y advertencias
    warnings.push(...renderReport.warnings);
    errors.push(...renderReport.errors);

    const requiresReview =
      renderReport.requiresReview ||
      (request.strictMode && warnings.length > 0) ||
      (template.status as any) === 'REQUIRES_CALIBRATION' ||
      errors.length > 0;

    // 8. Construir nombre de archivo canónico
    const patientSafe = (semanticDict.patient.fullName || 'PACIENTE')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const dateSafe = (semanticDict.document.date || '').replace(/[\/\\]/g, '-');
    const defaultFileName = `${template.documentType.toUpperCase()}_${patientSafe}_${dateSafe || 'doc'}.pdf`;

    return {
      success: errors.length === 0,
      pdfBytes: renderReport.pdfBytes,
      fileName: request.customFileName || defaultFileName,
      template,
      requiresReview,
      warnings,
      errors,
      elementCount: renderReport.renderedElementsCount,
    };
  }
}
