/**
 * OverlayRenderer.ts
 * 
 * RENDERIZADOR GENÉRICO DE OVERLAY VECTORIAL (ARQUITECTURA V2)
 * ============================================================
 * Responsabilidad exclusiva: Inyectar elementos vectoriales en un PDF de pdf-lib
 * a partir de un MasterTemplateV2 y un DataResolver.
 * 
 * REGLAS FUNDAMENTALES:
 * 1. El renderer NO conoce coordenadas fijas ni hardcodeadas de ninguna plantilla
 *    (receta, historia, constancia, informe, laboratorio).
 * 2. Las coordenadas provienen EXCLUSIVAMENTE del MasterTemplateV2.
 * 3. Utiliza font.widthOfTextAtSize() de pdf-lib para cálculo tipográfico real.
 *    PROHIBIDO utilizar aproximaciones tipo 0.52 * fontSize.
 * 4. Texto multilínea: cálculo de ancho real, división de líneas, respeto estricto de
 *    maxLines, heightMm, shrink configurado y error ante desbordamiento crítico.
 * 5. Protección de regiones bloqueadas (lockedRegions): no dibuja fuera o sobre ellas.
 * 6. Soporte de operaciones conceptuales genéricas:
 *      overlay.text(dataKey, value)
 *      overlay.multiline(dataKey, value)
 *      overlay.checkbox(dataKey, checked)
 *      overlay.stamp(assetKey)
 */

import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import {
  MasterTemplateV2,
  PageTemplate,
  OverlayElement,
  TextElement,
  MultilineTextElement,
  CheckboxElement,
  StampElement,
  SignatureElement,
  ImageElement,
  LineElement,
  LockedRegion,
  ElementGeometry,
} from './types/MasterTemplateV2';
import { CalibrationEngineV2 } from './CalibrationEngineV2';
import { DataResolver } from './DataResolver';

export interface OverlayRendererOptions {
  doctorStampBase64?: string;
  signatureBase64?: string;
  debugMode?: boolean; // CALIBRATION DEBUG MODE
}

export interface OverlayExecutionReport {
  pdfBytes: Uint8Array;
  requiresReview: boolean;
  warnings: string[];
  errors: string[];
  renderedElementsCount: number;
  overflowElements: string[];
}

export class OverlayRenderer {
  private pdfDoc: PDFDocument;
  private template: MasterTemplateV2;
  private dataDict: Record<string, any>;
  private options: OverlayRendererOptions;
  private fontRegular!: PDFFont;
  private fontBold!: PDFFont;
  private fontMono!: PDFFont;
  private warnings: string[] = [];
  private errors: string[] = [];
  private overflowElements: string[] = [];
  private renderedElementsCount = 0;

  private constructor(
    pdfDoc: PDFDocument,
    template: MasterTemplateV2,
    dataDict: Record<string, any>,
    options: OverlayRendererOptions = {}
  ) {
    this.pdfDoc = pdfDoc;
    this.template = template;
    this.dataDict = dataDict;
    this.options = options;
  }

  /**
   * Punto de entrada principal estático para renderizar un documento canónico
   */
  public static async render(
    originalPdfBytes: Uint8Array,
    template: MasterTemplateV2,
    dataDict: Record<string, any>,
    options: OverlayRendererOptions = {}
  ): Promise<OverlayExecutionReport> {
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const renderer = new OverlayRenderer(pdfDoc, template, dataDict, options);
    return await renderer.execute();
  }

  /**
   * Ejecución orquestada del renderizado
   */
  public async execute(): Promise<OverlayExecutionReport> {
    // 1. Cargar fuentes estándar vectoriales en pdf-lib
    this.fontRegular = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    this.fontMono = await this.pdfDoc.embedFont(StandardFonts.Courier);

    const pages = this.pdfDoc.getPages();

    // 2. Iterar sobre las páginas definidas en el MasterTemplateV2
    const masterPages = this.template?.pages || [];
    for (const pageConfig of masterPages) {
      if (pageConfig.pageIndex >= pages.length) {
        this.warnings.push(
          `[OverlayRenderer] La página ${pageConfig.pageIndex} definida en el master no existe en el PDF base.`
        );
        continue;
      }

      const pdfPage = pages[pageConfig.pageIndex];
      const { width: pageWidthPt, height: pageHeightPt } = pdfPage.getSize();
      const pageHeightMm = CalibrationEngineV2.ptToMm(pageHeightPt);

      // Combinar regiones bloqueadas de la página y del documento
      const combinedLockedRegions: LockedRegion[] = [
        ...(this.template.lockedRegions || []),
        ...(pageConfig.lockedRegions || []),
      ];

      // Modo debug visual si está habilitado
      if (this.options.debugMode) {
        this.renderDebugGrid(pdfPage, pageHeightMm, combinedLockedRegions);
      }

      // 3. Renderizar cada elemento de la página
      for (const element of pageConfig.elements) {
        // Verificar colisión con regiones bloqueadas
        const collision = this.checkCollision(element.geometry, combinedLockedRegions);
        if (collision.collides) {
          const msg = `Elemento '${element.id}' invade la región protegida '${collision.regionId}'. Omitiendo para preservar el original.`;
          this.warnings.push(msg);
          if (element.type === 'multilineText' && element.overflow === 'error') {
            this.errors.push(msg);
          }
          continue;
        }

        try {
          switch (element.type) {
            case 'text':
              this.renderTextElement(pdfPage, element, pageHeightMm);
              break;
            case 'multilineText':
              this.renderMultilineElement(pdfPage, element, pageHeightMm);
              break;
            case 'checkbox':
              this.renderCheckboxElement(pdfPage, element, pageHeightMm);
              break;
            case 'stamp':
            case 'signature':
            case 'image':
              await this.renderAssetElement(pdfPage, element, pageHeightMm);
              break;
            case 'line':
              this.renderLineElement(pdfPage, element, pageHeightMm);
              break;
          }
        } catch (err: any) {
          this.errors.push(`Error renderizando elemento '${element.id}': ${err.message}`);
        }
      }
    }

    const finalBytes = await this.pdfDoc.save();
    const requiresReview = this.errors.length > 0 || this.overflowElements.length > 0;

    return {
      pdfBytes: finalBytes,
      requiresReview,
      warnings: this.warnings,
      errors: this.errors,
      renderedElementsCount: this.renderedElementsCount,
      overflowElements: this.overflowElements,
    };
  }

  // ==========================================================================
  // OPERACIONES CONCEPTUALES GENÉRICAS DEL OVERLAY
  // ==========================================================================

  /**
   * overlay.text(dataKey, text)
   */
  public renderTextElement(pdfPage: PDFPage, el: TextElement, pageHeightMm: number): void {
    const rawVal = DataResolver.resolve(this.dataDict, el.dataKey);
    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') return;

    let text = String(rawVal).trim();
    if (el.labelPrefix) {
      text = `${el.labelPrefix} ${text}`;
    }

    const font = el.typography?.fontWeight === 'bold' ? this.fontBold : this.fontRegular;
    let fontSize = el.typography?.fontSizePt || 10;
    const maxAllowedWidthPt = CalibrationEngineV2.mmToPt(el.geometry.widthMm);

    // Medición exacta sin aproximaciones
    let textWidthPt = font.widthOfTextAtSize(text, fontSize);

    // Ajuste de desbordamiento (shrink / clip / error)
    if (textWidthPt > maxAllowedWidthPt) {
      if (el.overflow === 'shrink') {
        const shrinkFactor = maxAllowedWidthPt / textWidthPt;
        fontSize = Math.max(fontSize * shrinkFactor, 6.0); // piso de legibilidad: 6pt
        textWidthPt = font.widthOfTextAtSize(text, fontSize);
      } else if (el.overflow === 'error') {
        this.overflowElements.push(el.id);
        this.errors.push(`[OVERFLOW] El texto de '${el.id}' (${el.dataKey}) excede el ancho permitido.`);
        return;
      }
    }

    // Cálculo de alineación en X
    const originXPt = CalibrationEngineV2.xMmToPdfPt(el.geometry.xMm);
    let drawXPt = originXPt;
    if (el.typography?.align === 'center') {
      drawXPt = originXPt + (maxAllowedWidthPt - textWidthPt) / 2;
    } else if (el.typography?.align === 'right') {
      drawXPt = originXPt + (maxAllowedWidthPt - textWidthPt);
    }

    // Centrado vertical dentro de la celda de altura
    const cellHeightPt = CalibrationEngineV2.mmToPt(el.geometry.heightMm);
    const originYPt = CalibrationEngineV2.yMmToPdfPt(el.geometry.yMm, pageHeightMm);
    const drawYPt = originYPt - (cellHeightPt + fontSize * 0.75) / 2;

    pdfPage.drawText(text, {
      x: drawXPt,
      y: drawYPt,
      size: fontSize,
      font,
      color: rgb(0.08, 0.12, 0.2),
    });

    if (this.options.debugMode) {
      this.drawElementDebugBox(pdfPage, el, pageHeightMm, '#0ea5e9');
    }

    this.renderedElementsCount++;
  }

  /**
   * overlay.multiline(dataKey, text)
   * Cálculo riguroso de partición de líneas con font.widthOfTextAtSize()
   */
  public renderMultilineElement(
    pdfPage: PDFPage,
    el: MultilineTextElement,
    pageHeightMm: number
  ): void {
    const rawVal = DataResolver.resolve(this.dataDict, el.dataKey);
    if (!rawVal) return;

    const fullText = String(rawVal).trim();
    if (!fullText) return;

    const font = el.typography?.fontWeight === 'bold' ? this.fontBold : this.fontRegular;
    let fontSize = el.typography?.fontSizePt || 9.5;
    let lineHeight = el.typography?.lineHeightPt || fontSize * 1.35;
    const maxAllowedWidthPt = CalibrationEngineV2.mmToPt(el.geometry.widthMm);
    const maxAllowedHeightPt = CalibrationEngineV2.mmToPt(el.geometry.heightMm);
    const maxLines = el.maxLines || Math.floor(maxAllowedHeightPt / lineHeight) || 1;

    // Función pura para particionar texto respetando el ancho real
    const breakTextIntoLines = (text: string, currentFontSize: number): string[] => {
      const paragraphs = text.split('\n');
      const lines: string[] = [];

      for (const para of paragraphs) {
        if (!para.trim()) {
          lines.push('');
          continue;
        }
        const words = para.split(/\s+/);
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const lineWidth = font.widthOfTextAtSize(testLine, currentFontSize);

          if (lineWidth <= maxAllowedWidthPt) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
      }
      return lines;
    };

    let lines = breakTextIntoLines(fullText, fontSize);

    // Si excede maxLines o altura física y está en modo 'shrink'
    if ((lines.length > maxLines || lines.length * lineHeight > maxAllowedHeightPt) && el.overflow === 'shrink') {
      const minFontSize = 6.0;
      while (
        (lines.length > maxLines || lines.length * lineHeight > maxAllowedHeightPt) &&
        fontSize > minFontSize
      ) {
        fontSize -= 0.5;
        lineHeight = fontSize * 1.3;
        lines = breakTextIntoLines(fullText, fontSize);
      }
    }

    // Si aún excede y es error
    if ((lines.length > maxLines || lines.length * lineHeight > maxAllowedHeightPt) && el.overflow === 'error') {
      this.overflowElements.push(el.id);
      this.errors.push(
        `[OVERFLOW] '${el.id}' (${el.dataKey}) excede la capacidad del contenedor multilínea.`
      );
      return;
    }

    // Si es clip, recortar las líneas sobrantes
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      this.warnings.push(`[CLIP] Texto en '${el.id}' recortado a ${maxLines} líneas.`);
    }

    // Dibujar cada línea
    const originXPt = CalibrationEngineV2.xMmToPdfPt(el.geometry.xMm);
    const originYPt = CalibrationEngineV2.yMmToPdfPt(el.geometry.yMm, pageHeightMm);

    lines.forEach((line, index) => {
      const y = originYPt - (index + 1) * lineHeight;
      let x = originXPt;

      if (el.typography?.align === 'center') {
        const w = font.widthOfTextAtSize(line, fontSize);
        x = originXPt + (maxAllowedWidthPt - w) / 2;
      } else if (el.typography?.align === 'right') {
        const w = font.widthOfTextAtSize(line, fontSize);
        x = originXPt + (maxAllowedWidthPt - w);
      }

      pdfPage.drawText(line, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.08, 0.12, 0.2),
      });
    });

    if (this.options.debugMode) {
      this.drawElementDebugBox(pdfPage, el, pageHeightMm, '#8b5cf6');
    }

    this.renderedElementsCount++;
  }

  /**
   * overlay.checkbox(dataKey, isChecked)
   * Marca precisa con coordenada individual del master
   */
  public renderCheckboxElement(
    pdfPage: PDFPage,
    el: CheckboxElement,
    pageHeightMm: number
  ): void {
    const isChecked = DataResolver.resolveBoolean(this.dataDict, el.dataKey);
    if (!isChecked) return;

    const markChar = el.markStyle === 'CHECK' ? '✓' : 'X';
    const font = this.fontBold;
    const fontSize = el.fontSizePt || 11;

    const originXPt = CalibrationEngineV2.xMmToPdfPt(el.geometry.xMm);
    const originYPt = CalibrationEngineV2.yMmToPdfPt(el.geometry.yMm, pageHeightMm);
    const boxWidthPt = CalibrationEngineV2.mmToPt(el.geometry.widthMm);
    const boxHeightPt = CalibrationEngineV2.mmToPt(el.geometry.heightMm);

    const markWidth = font.widthOfTextAtSize(markChar, fontSize);
    const x = originXPt + (boxWidthPt - markWidth) / 2;
    const y = originYPt - boxHeightPt + (boxHeightPt - fontSize * 0.75) / 2;

    pdfPage.drawText(markChar, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.08, 0.12, 0.2),
    });

    if (this.options.debugMode) {
      this.drawElementDebugBox(pdfPage, el, pageHeightMm, '#10b981');
    }

    this.renderedElementsCount++;
  }

  /**
   * overlay.stamp(assetKey) / signature / image
   */
  public async renderAssetElement(
    pdfPage: PDFPage,
    el: StampElement | SignatureElement | ImageElement,
    pageHeightMm: number
  ): Promise<void> {
    let base64 = '';
    if (el.assetKey === 'doctor_stamp_signature' || el.assetKey === 'doctor.stamp') {
      base64 = this.options.doctorStampBase64 || DataResolver.resolve(this.dataDict, 'doctor.stampBase64') || '';
    } else if (el.assetKey === 'doctor.signature') {
      base64 = this.options.signatureBase64 || DataResolver.resolve(this.dataDict, 'doctor.signatureBase64') || '';
    } else {
      base64 = DataResolver.resolve(this.dataDict, el.assetKey) || '';
    }

    if (!base64 || typeof base64 !== 'string') return;

    try {
      const cleanBase64 = base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const imageBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));

      const isPng = base64.startsWith('data:image/png') || cleanBase64.startsWith('iVBORw0KGgo');
      const embeddedImage = isPng
        ? await this.pdfDoc.embedPng(imageBytes)
        : await this.pdfDoc.embedJpg(imageBytes);

      const xPt = CalibrationEngineV2.xMmToPdfPt(el.geometry.xMm);
      const widthPt = CalibrationEngineV2.mmToPt(el.geometry.widthMm);
      const heightPt = CalibrationEngineV2.mmToPt(el.geometry.heightMm);
      const originYPt = CalibrationEngineV2.yMmToPdfPt(el.geometry.yMm, pageHeightMm);
      const yPt = originYPt - heightPt;

      pdfPage.drawImage(embeddedImage, {
        x: xPt,
        y: yPt,
        width: widthPt,
        height: heightPt,
        opacity: el.opacity !== undefined ? el.opacity : 0.95,
      });

      if (this.options.debugMode) {
        this.drawElementDebugBox(pdfPage, el, pageHeightMm, '#f59e0b');
      }

      this.renderedElementsCount++;
    } catch (err: any) {
      this.warnings.push(`[OverlayRenderer] No se pudo incrustar asset '${el.id}': ${err.message}`);
    }
  }

  /**
   * Inyección de líneas vectoriales
   */
  public renderLineElement(pdfPage: PDFPage, el: LineElement, pageHeightMm: number): void {
    const originXPt = CalibrationEngineV2.xMmToPdfPt(el.geometry.xMm);
    const originYPt = CalibrationEngineV2.yMmToPdfPt(el.geometry.yMm, pageHeightMm);
    const widthPt = CalibrationEngineV2.mmToPt(el.geometry.widthMm);

    pdfPage.drawLine({
      start: { x: originXPt, y: originYPt },
      end: { x: originXPt + widthPt, y: originYPt },
      thickness: el.thicknessPt || 0.75,
      color: rgb(0.2, 0.25, 0.35),
    });

    this.renderedElementsCount++;
  }

  // ==========================================================================
  // PROTECCIÓN DE REGIONES Y VISUAL DEBUG MODE
  // ==========================================================================

  private checkCollision(
    geom: ElementGeometry,
    lockedRegions: LockedRegion[] = []
  ): { collides: boolean; regionId?: string } {
    for (const region of lockedRegions) {
      const xOverlap = Math.max(
        0,
        Math.min(geom.xMm + geom.widthMm, region.xMm + region.widthMm) -
          Math.max(geom.xMm, region.xMm)
      );
      const yOverlap = Math.max(
        0,
        Math.min(geom.yMm + geom.heightMm, region.yMm + region.heightMm) -
          Math.max(geom.yMm, region.yMm)
      );
      if (xOverlap > 0.5 && yOverlap > 0.5) {
        return { collides: true, regionId: region.id };
      }
    }
    return { collides: false };
  }

  private renderDebugGrid(pdfPage: PDFPage, pageHeightMm: number, lockedRegions: LockedRegion[]): void {
    // Dibujar regiones protegidas en rojo semitransparente
    for (const lr of lockedRegions) {
      const x = CalibrationEngineV2.xMmToPdfPt(lr.xMm);
      const w = CalibrationEngineV2.mmToPt(lr.widthMm);
      const h = CalibrationEngineV2.mmToPt(lr.heightMm);
      const originY = CalibrationEngineV2.yMmToPdfPt(lr.yMm, pageHeightMm);
      const y = originY - h;

      pdfPage.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: rgb(0.9, 0.2, 0.2),
        borderWidth: 1,
        color: rgb(0.95, 0.8, 0.8),
        opacity: 0.25,
      });

      pdfPage.drawText(`LOCKED: ${lr.id}`, {
        x: x + 4,
        y: y + h - 10,
        size: 7,
        font: this.fontMono,
        color: rgb(0.8, 0.1, 0.1),
      });
    }
  }

  private drawElementDebugBox(
    pdfPage: PDFPage,
    el: OverlayElement,
    pageHeightMm: number,
    hexColor: string
  ): void {
    const x = CalibrationEngineV2.xMmToPdfPt(el.geometry.xMm);
    const w = CalibrationEngineV2.mmToPt(el.geometry.widthMm);
    const h = CalibrationEngineV2.mmToPt(el.geometry.heightMm);
    const originY = CalibrationEngineV2.yMmToPdfPt(el.geometry.yMm, pageHeightMm);
    const y = originY - h;

    pdfPage.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      borderColor: rgb(0.2, 0.6, 0.9),
      borderWidth: 0.5,
      opacity: 0.7,
    });

    const label = `${el.id} [${(el as any).dataKey || el.type}]`;
    pdfPage.drawText(label.slice(0, 30), {
      x,
      y: y + h + 2,
      size: 6,
      font: this.fontMono,
      color: rgb(0.1, 0.4, 0.8),
    });
  }
}
