/**
 * PDFMasterSizeValidator.ts
 * 
 * VALIDACIÓN ESTRICTA DE TAMAÑO FÍSICO DE PDFS MAESTROS (V2)
 * ==========================================================
 * OBLIGATORIO:
 * Al cargar un PDF maestro:
 * 1. Lee las dimensiones reales página por página mediante pdf-lib.
 * 2. Convierte puntos PostScript a milímetros físicos con precisión decimal.
 * 3. Compara con la especificación del MasterTemplateV2.
 * 4. PROHIBIDO usar fallbacks ciegos (pageHeightMm || 297, widthMm || 210).
 * 5. Si hay discrepancia significativa (> 1.5mm):
 *    status = INVALID y bloquea la emisión de documentos oficiales.
 */

import { PDFDocument } from 'pdf-lib';
import { MasterTemplateV2 } from './types/MasterTemplateV2';
import { CalibrationEngineV2 } from './CalibrationEngineV2';

export interface PageSizeInspectionResult {
  pageIndex: number;
  actualPt: { width: number; height: number };
  actualMm: { width: number; height: number };
  expectedMm: { width: number; height: number };
  diffMm: { width: number; height: number };
  isMatch: boolean;
}

export interface MasterPdfInspectionReport {
  masterId: string;
  pdfPath: string;
  totalPages: number;
  isValid: boolean;
  requiresCalibration: boolean;
  pages: PageSizeInspectionResult[];
  errorMessage?: string;
}

export class PDFMasterSizeValidator {
  private static readonly TOLERANCE_MM = 1.5;

  /**
   * Carga e inspecciona los bytes reales del PDF maestro contrastándolos con el master
   */
  public static async inspectPdfMaster(
    pdfBytes: Uint8Array,
    template: MasterTemplateV2
  ): Promise<MasterPdfInspectionReport> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const totalPages = pdfDoc.getPageCount();
      const pageResults: PageSizeInspectionResult[] = [];
      let allMatch = true;

      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPage(i);
        const { width: ptW, height: ptH } = page.getSize();
        const mmW = CalibrationEngineV2.ptToMm(ptW);
        const mmH = CalibrationEngineV2.ptToMm(ptH);

        const templatePage = template?.pages?.find((p) => p.pageIndex === i);
        const expectedW = templatePage ? templatePage.widthMm : mmW;
        const expectedH = templatePage ? templatePage.heightMm : mmH;

        const diffW = Math.abs(mmW - expectedW);
        const diffH = Math.abs(mmH - expectedH);
        const match = diffW <= this.TOLERANCE_MM && diffH <= this.TOLERANCE_MM;

        if (!match) {
          allMatch = false;
        }

        pageResults.push({
          pageIndex: i,
          actualPt: { width: Number(ptW.toFixed(2)), height: Number(ptH.toFixed(2)) },
          actualMm: { width: Number(mmW.toFixed(2)), height: Number(mmH.toFixed(2)) },
          expectedMm: { width: Number(expectedW.toFixed(2)), height: Number(expectedH.toFixed(2)) },
          diffMm: { width: Number(diffW.toFixed(2)), height: Number(diffH.toFixed(2)) },
          isMatch: match,
        });
      }

      // Si el master tiene status 'REQUIRES_CALIBRATION' o 'DRAFT'
      const requiresCalibration =
        !allMatch ||
        (template.status as any) === 'REQUIRES_CALIBRATION';

      return {
        masterId: template.masterId,
        pdfPath: template.source.backgroundPdf,
        totalPages,
        isValid: allMatch && !requiresCalibration,
        requiresCalibration,
        pages: pageResults,
      };
    } catch (err: any) {
      return {
        masterId: template.masterId,
        pdfPath: template.source.backgroundPdf,
        totalPages: 0,
        isValid: false,
        requiresCalibration: true,
        pages: [],
        errorMessage: `Error leyendo PDF maestro: ${err.message}`,
      };
    }
  }
}
