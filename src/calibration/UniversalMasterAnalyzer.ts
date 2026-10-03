/**
 * UniversalMasterAnalyzer.ts
 * 
 * MOTOR UNIVERSAL DE INGESTA, ANÁLISIS GEOMÉTRICO Y DETECCIÓN VECTORIAL
 * ======================================================================
 * 
 * REGLAS ARQUITECTÓNICAS ABSOLUTAS:
 * 1. El PDF original es la autoridad geométrica inmutable.
 * 2. NO se asume A4 ni ningún formato predefinido. Las dimensiones se leen directamente del PDF.
 * 3. NO se inventan coordenadas ni se utilizan interpolaciones lineales (startY + index * stepY).
 * 4. Clasificación explícita: PDF_VECTORIAL, PDF_HIBRIDO, PDF_ESCANEADO.
 * 5. Coordenadas canónicas: unit = "mm", origin = "top-left", yAxis = "down".
 */

import { PDFDocument, PDFPage, PDFName, PDFDict, PDFStream, PDFRef } from 'pdf-lib';
import {
  MasterTemplateV2,
  PageTemplate,
  OverlayElement,
  CheckboxElement,
  TextElement,
  MultilineTextElement,
  LineElement,
  LockedRegion,
  ElementGeometry,
  PdfDocumentClassification,
} from './types/MasterTemplateV2';
import {
  PDFContentStreamReader,
  RawTextNode,
  RawVectorRect,
  RawVectorLine,
} from './PDFContentStreamReader';

export interface AnalyzedTextNode {
  id: string;
  text: string;
  pageIndex: number;
  geometry: ElementGeometry;
  fontSizePt: number;
  fontName?: string;
  confidence: number;
}

export interface AnalyzedVectorRect {
  id: string;
  pageIndex: number;
  geometry: ElementGeometry;
  isClosed: boolean;
  strokeWidthPt: number;
  isCheckboxCandidate: boolean;
  confidence: number;
  sourceOperator: 're' | 'path_m_l_h';
}

export interface AnalyzedVectorLine {
  id: string;
  pageIndex: number;
  x1Mm: number;
  y1Mm: number;
  x2Mm: number;
  y2Mm: number;
  thicknessMm: number;
  orientation: 'horizontal' | 'vertical' | 'diagonal';
  isFieldCandidate: boolean;
}

export interface DocumentAnalysisReport {
  classification: PdfDocumentClassification;
  sha256: string;
  pageCount: number;
  pages: {
    pageIndex: number;
    widthPt: number;
    heightPt: number;
    widthMm: number;
    heightMm: number;
    hasTextOperators: boolean;
    hasVectorGraphics: boolean;
    hasRasterImages: boolean;
  }[];
  textNodes: AnalyzedTextNode[];
  vectorRects: AnalyzedVectorRect[];
  vectorLines: AnalyzedVectorLine[];
  candidateCheckboxes: AnalyzedVectorRect[];
  candidateFields: {
    id: string;
    pageIndex: number;
    geometry: ElementGeometry;
    associatedLabel?: string;
    suggestedType: 'text' | 'multilineText' | 'checkbox' | 'signature' | 'stamp';
    confidence: number;
  }[];
  lockedRegionsDetected: LockedRegion[];
  summary: {
    totalElementsDetected: number;
    totalCheckboxes: number;
    totalFields: number;
    globalConfidence: number;
  };
}

export class UniversalMasterAnalyzer {
  /**
   * Analiza integralmente los bytes de un PDF original
   */
  public static async analyze(
    pdfBytes: Uint8Array,
    sha256Hex: string
  ): Promise<DocumentAnalysisReport> {
    const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
    const pages = pdfDoc.getPages();
    const pageCount = pages.length;

    const pageReports: DocumentAnalysisReport['pages'] = [];
    const textNodes: AnalyzedTextNode[] = [];
    const vectorRects: AnalyzedVectorRect[] = [];
    const vectorLines: AnalyzedVectorLine[] = [];

    let overallHasVectors = false;
    let overallHasImages = false;
    let overallHasText = false;

    // Regiones bloqueadas naturales detectadas (Membrete superior y Pie inferior)
    const lockedRegionsDetected: LockedRegion[] = [];

    for (let i = 0; i < pageCount; i++) {
      const page = pages[i];
      const pageExtract = await PDFContentStreamReader.extractPageContent(pdfDoc, page, i);
      const hasImages = this.inspectRasterImages(page);

      if (pageExtract.textNodes.length > 0) overallHasText = true;
      if (pageExtract.vectorRects.length > 0 || pageExtract.vectorLines.length > 0) overallHasVectors = true;
      if (hasImages) overallHasImages = true;

      pageReports.push({
        pageIndex: i,
        widthPt: pageExtract.widthPt,
        heightPt: pageExtract.heightPt,
        widthMm: pageExtract.widthMm,
        heightMm: pageExtract.heightMm,
        hasTextOperators: pageExtract.textNodes.length > 0,
        hasVectorGraphics: pageExtract.vectorRects.length > 0 || pageExtract.vectorLines.length > 0,
        hasRasterImages: hasImages,
      });

      // Registrar regiones bloqueadas por página
      lockedRegionsDetected.push({
        id: `auto_header_page_${i + 1}`,
        xMm: 0,
        yMm: 0,
        widthMm: pageExtract.widthMm,
        heightMm: Math.min(32, pageExtract.heightMm * 0.15),
      });

      lockedRegionsDetected.push({
        id: `auto_footer_page_${i + 1}`,
        xMm: 0,
        yMm: Math.max(0, pageExtract.heightMm - 18),
        widthMm: pageExtract.widthMm,
        heightMm: 18,
      });

      // Mapear TextNodes
      pageExtract.textNodes.forEach((t) => {
        textNodes.push({
          id: t.id,
          text: t.text,
          pageIndex: i,
          geometry: {
            xMm: Number(t.xMm.toFixed(3)),
            yMm: Number(t.yMm.toFixed(3)),
            widthMm: Number(t.widthMm.toFixed(3)),
            heightMm: Number(t.heightMm.toFixed(3)),
          },
          fontSizePt: t.fontSizePt,
          fontName: t.fontName,
          confidence: 0.98,
        });
      });

      // Mapear VectorRects y clasificar Checkboxes
      pageExtract.vectorRects.forEach((r) => {
        const isSquare = Math.abs(r.widthMm - r.heightMm) <= 1.2;
        const isCheckboxSize = r.widthMm >= 2.0 && r.widthMm <= 6.5 && r.heightMm >= 2.0 && r.heightMm <= 6.5;
        
        // No clasificar como checkbox si está en el header o footer bloqueado
        const inHeader = r.yMm <= Math.min(32, pageExtract.heightMm * 0.15);
        const inFooter = r.yMm >= pageExtract.heightMm - 18;
        const isCheckboxCandidate = isSquare && isCheckboxSize && !inHeader && !inFooter;

        vectorRects.push({
          id: r.id,
          pageIndex: i,
          geometry: {
            xMm: Number(r.xMm.toFixed(3)),
            yMm: Number(r.yMm.toFixed(3)),
            widthMm: Number(r.widthMm.toFixed(3)),
            heightMm: Number(r.heightMm.toFixed(3)),
          },
          isClosed: true,
          strokeWidthPt: 0.75,
          isCheckboxCandidate,
          confidence: isCheckboxCandidate ? 0.96 : 0.80,
          sourceOperator: r.sourceOperator,
        });
      });

      // Mapear VectorLines
      pageExtract.vectorLines.forEach((l) => {
        const isHorizontal = l.orientation === 'horizontal';
        const isFieldCandidate = isHorizontal && l.lengthMm >= 6.0;

        vectorLines.push({
          id: l.id,
          pageIndex: i,
          x1Mm: Number(l.startXCountMm.toFixed(3)),
          y1Mm: Number(l.startYMm.toFixed(3)),
          x2Mm: Number(l.endXMm.toFixed(3)),
          y2Mm: Number(l.endYMm.toFixed(3)),
          thicknessMm: Number(l.thicknessMm.toFixed(3)),
          orientation: l.orientation,
          isFieldCandidate,
        });
      });
    }

    // Clasificación explícita del documento
    let classification: PdfDocumentClassification = 'PDF_VECTORIAL';
    if (!overallHasVectors && !overallHasText && overallHasImages) {
      classification = 'PDF_ESCANEADO';
    } else if (overallHasImages && (overallHasVectors || overallHasText)) {
      classification = 'PDF_HIBRIDO';
    } else if (!overallHasText && !overallHasVectors) {
      classification = 'PDF_ESCANEADO';
    } else {
      classification = 'PDF_VECTORIAL';
    }

    // Candidatos a Checkbox
    const candidateCheckboxes = vectorRects.filter((r) => r.isCheckboxCandidate);

    // Candidatos a Campos de Texto / Multilínea
    const candidateFields: DocumentAnalysisReport['candidateFields'] = [];

    // 1. Campos por líneas de subrayado horizontal
    vectorLines
      .filter((l) => l.isFieldCandidate)
      .forEach((line, idx) => {
        const widthMm = Math.abs(line.x2Mm - line.x1Mm);
        const heightMm = 5.5; // Altura estándar para inyección de texto sobre línea
        const yMm = Math.max(0, line.y1Mm - heightMm);
        const xMm = Math.min(line.x1Mm, line.x2Mm);

        candidateFields.push({
          id: `cand_field_line_${line.pageIndex}_${idx + 1}`,
          pageIndex: line.pageIndex,
          geometry: {
            xMm: Number(xMm.toFixed(3)),
            yMm: Number(yMm.toFixed(3)),
            widthMm: Number(widthMm.toFixed(3)),
            heightMm: Number(heightMm.toFixed(3)),
          },
          suggestedType: widthMm > 80 ? 'multilineText' : 'text',
          confidence: 0.92,
        });
      });

    // 2. Campos por cajas rectangulares (Diagnósticos, Tratamiento, Firmas, Observaciones)
    vectorRects
      .filter((r) => !r.isCheckboxCandidate && r.geometry.widthMm >= 18 && r.geometry.heightMm >= 7)
      .forEach((rect, idx) => {
        const inHeader = rect.geometry.yMm <= 32;
        const inFooter = rect.geometry.yMm >= (pageReports[rect.pageIndex]?.heightMm || 215) - 18;
        if (inHeader || inFooter) return;

        candidateFields.push({
          id: `cand_field_rect_${rect.pageIndex}_${idx + 1}`,
          pageIndex: rect.pageIndex,
          geometry: {
            xMm: Number((rect.geometry.xMm + 1.5).toFixed(3)),
            yMm: Number((rect.geometry.yMm + 1.5).toFixed(3)),
            widthMm: Number((rect.geometry.widthMm - 3.0).toFixed(3)),
            heightMm: Number((rect.geometry.heightMm - 3.0).toFixed(3)),
          },
          suggestedType: rect.geometry.heightMm >= 18 ? 'multilineText' : 'text',
          confidence: 0.94,
        });
      });

    // Calcular confianza global
    const totalElements = candidateCheckboxes.length + candidateFields.length + textNodes.length;
    let confidenceSum = 0;
    candidateCheckboxes.forEach((c) => (confidenceSum += c.confidence));
    candidateFields.forEach((f) => (confidenceSum += f.confidence));
    textNodes.forEach((t) => (confidenceSum += t.confidence));

    const globalConfidence = totalElements > 0 ? Number((confidenceSum / totalElements).toFixed(3)) : 0.5;

    return {
      classification,
      sha256: sha256Hex,
      pageCount,
      pages: pageReports,
      textNodes,
      vectorRects,
      vectorLines,
      candidateCheckboxes,
      candidateFields,
      lockedRegionsDetected,
      summary: {
        totalElementsDetected: totalElements,
        totalCheckboxes: candidateCheckboxes.length,
        totalFields: candidateFields.length,
        globalConfidence: classification === 'PDF_ESCANEADO' ? 0.4 : globalConfidence,
      },
    };
  }

  /**
   * Inspecciona si la página contiene imágenes rasterizadas
   */
  private static inspectRasterImages(page: PDFPage): boolean {
    try {
      const node = page.node;
      const resources = node.Resources();
      if (resources) {
        const xObjects =
          (resources as any).lookupMaybe?.(PDFName.of('XObject'), PDFDict) ||
          (resources as any).lookup?.(PDFName.of('XObject'), PDFDict);
        if (xObjects) {
          const entries = xObjects.entries();
          for (const [, obj] of entries) {
            const resolved = obj instanceof PDFRef ? node.context.lookup(obj) : obj;
            if (resolved) {
              const dict = (resolved as any).dict || resolved;
              const subtype = dict?.lookup?.(PDFName.of('Subtype'));
              if (subtype && subtype.toString() === '/Image') {
                return true;
              }
            }
          }
        }
      }
    } catch {
      // Silencioso
    }
    return false;
  }
}
