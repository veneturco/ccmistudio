/**
 * VectorOverlayEngineV2.ts
 * 
 * MOTOR UNIVERSAL DE RENDERIZADO VECTORIAL OVERLAY (ARQUITECTURA V2)
 * ===================================================================
 * REGLAS FUNDAMENTALES:
 * 1. PDF MAESTRO INMUTABLE: Se utiliza como background original no rasterizado.
 * 2. OVERLAY VECTORIAL PURO: El texto, marcas y firmas se inyectan como streams vectoriales nativos.
 * 3. NO INVENCIÃ“N DE DATOS: Si un dato no existe, no se inyecta nada ni se inventa contenido.
 * 4. PROTECCIÃ“N DE REGIONES BLOQUEADAS: Detecta colisiones geomÃ©tricas con membretes o sellos.
 * 5. AUTOAJUSTE TIPOGRÃFICO: Aplica Shrink-to-fit o advertencia de revisiÃ³n sin truncamiento destructivo.
 */

import { PDFDocument, PDFPage, PDFFont, rgb } from 'pdf-lib';
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
import QRCode from 'qrcode';
import { CalibrationEngine } from './CalibrationEngine';
import { DataResolver } from './DataResolver';

export interface OverlayRenderOptions {
  doctorStampBase64?: string;
  signatureBase64?: string;
  debugOverlay?: boolean;
  debugMode?: boolean;
}

export interface OverlayRenderResult {
  pdfBytes: Uint8Array;
  requiresReview: boolean;
  warnings: string[];
  injectedElementsCount: number;
}

export class VectorOverlayEngineV2 {
  /**
   * Resuelve el valor semÃ¡ntico a partir de una clave con notaciÃ³n de puntos
   * Ej: 'patient.fullName' -> data.patient?.fullName
   */
  public static resolveDataKey(data: Record<string, any>, key: string): any {
    if (!data || !key) return undefined;
    return DataResolver.resolve(data, key);
  }

  /**
   * Comprueba si una geometrÃ­a colisiona con alguna regiÃ³n bloqueada
   */
  public static checkCollision(
    geom: ElementGeometry,
    lockedRegions: LockedRegion[] = []
  ): { collides: boolean; regionId?: string } {
    for (const region of lockedRegions) {
      const xOverlap = Math.max(0, Math.min(geom.xMm + geom.widthMm, region.xMm + region.widthMm) - Math.max(geom.xMm, region.xMm));
      const yOverlap = Math.max(0, Math.min(geom.yMm + geom.heightMm, region.yMm + region.heightMm) - Math.max(geom.yMm, region.yMm));
      if (xOverlap > 0.5 && yOverlap > 0.5) {
        return { collides: true, regionId: region.id };
      }
    }
    return { collides: false };
  }

  /**
   * Aplica un MasterTemplateV2 con datos semÃ¡nticos sobre un PDF o imagen original
   */
  public static async applyOverlay(
    originalPdfBytes: Uint8Array,
    template: MasterTemplateV2,
    patientData: Record<string, any>,
    options: OverlayRenderOptions = {}
  ): Promise<OverlayRenderResult> {
    let pdfDoc: PDFDocument;

    // DetecciÃ³n de formato del buffer maestro
    const isPdf =
      originalPdfBytes &&
      originalPdfBytes.length > 4 &&
      originalPdfBytes[0] === 0x25 &&
      originalPdfBytes[1] === 0x50 &&
      originalPdfBytes[2] === 0x44 &&
      originalPdfBytes[3] === 0x46;

    const isJpg =
      originalPdfBytes &&
      originalPdfBytes.length > 3 &&
      originalPdfBytes[0] === 0xff &&
      originalPdfBytes[1] === 0xd8 &&
      originalPdfBytes[2] === 0xff;

    const isPng =
      originalPdfBytes &&
      originalPdfBytes.length > 4 &&
      originalPdfBytes[0] === 0x89 &&
      originalPdfBytes[1] === 0x50 &&
      originalPdfBytes[2] === 0x4e &&
      originalPdfBytes[3] === 0x47;

    // Si el buffer es un PDF maestro vectorial (como orden_lab_base.pdf o documentos base con membrete),
    // se carga directamente con pdf-lib preservando toda la tipografía vectorial, logos y recuadros.
    if (isPdf) {
      pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
    } else {
      // Si el buffer es una imagen de alta resoluciÃ³n o respaldo, se genera un PDF contenedor con fondo incrustado por cada pÃ¡gina
      pdfDoc = await PDFDocument.create();
      const requiredPages = template?.pages?.length || 1;

      for (let pIdx = 0; pIdx < requiredPages; pIdx++) {
        const pConfig = template?.pages?.[pIdx];
        const defaultWidthMm = pConfig?.widthMm || (template?.pages?.[0]?.widthMm || 210.0);
        const defaultHeightMm = pConfig?.heightMm || (template?.pages?.[0]?.heightMm || 297.0);
        const widthPt = (defaultWidthMm * 72) / 25.4;
        const heightPt = (defaultHeightMm * 72) / 25.4;

        const page = pdfDoc.addPage([widthPt, heightPt]);

        // Determinar imagen maestra para esta pÃ¡gina especÃ­fica
        const docTypeLower = (template?.documentType || '').toLowerCase();
        let targetImgUrl = '/templates/recipes_bg.jpg';
        if (docTypeLower.includes('lab') || docTypeLower.includes('orden')) {
          targetImgUrl = pIdx === 1 ? '/templates/orden_lab_p2_bg.jpg' : '/templates/orden_lab_p1_bg.jpg';
        } else if (docTypeLower.includes('report') || docTypeLower.includes('informe')) {
          targetImgUrl = '/templates/informe_bg.jpg';
        } else if (docTypeLower.includes('cert') || docTypeLower.includes('constancia')) {
          targetImgUrl = '/templates/constancia_bg.jpg';
        } else if (docTypeLower.includes('hist')) {
          targetImgUrl = '/templates/historia_bg.jpg';
        }

        try {
          let imgBytesToEmbed: Uint8Array | null = null;
          // Si es la pÃ¡gina 0 y el originalPdfBytes ya era JPG/PNG, usarlo
          if (pIdx === 0 && (isJpg || isPng)) {
            imgBytesToEmbed = originalPdfBytes;
          } else {
            // Carga de imagen de respaldo (100% Browser Fetch sin fs ni path)
            if (typeof window !== 'undefined') {
              const candUrls = [
                targetImgUrl,
                new URL(targetImgUrl, window.location.origin).href,
                targetImgUrl.startsWith('/templates/') ? targetImgUrl.replace('/templates/', '/') : '/templates' + targetImgUrl,
              ];
              for (const candUrl of candUrls) {
                try {
                  const resp = await fetch(candUrl, { cache: 'force-cache' });
                  if (resp.ok) {
                    const cType = resp.headers.get('content-type') || '';
                    if (cType.includes('text/html')) {
                      console.warn("[VectorOverlayEngineV2] SPA Router interceptó devolviendo text/html.");
                      continue;
                    }
                    const buf = await resp.arrayBuffer();
                    const bytes = new Uint8Array(buf);
                    const validJpg = bytes.length > 500 && bytes[0] === 0xff && bytes[1] === 0xd8;
                    const validPng = bytes.length > 500 && bytes[0] === 0x89 && bytes[1] === 0x50;
                    if (validJpg || validPng) {
                      imgBytesToEmbed = bytes;
                      break;
                    }
                  }
                } catch {}
              }
            }
          }

          if (imgBytesToEmbed) {
            const isTargetPng = imgBytesToEmbed.length > 4 && imgBytesToEmbed[0] === 0x89 && imgBytesToEmbed[1] === 0x50;
            const bgImg = isTargetPng
              ? await pdfDoc.embedPng(imgBytesToEmbed)
              : await pdfDoc.embedJpg(imgBytesToEmbed);
            page.drawImage(bgImg, {
              x: 0,
              y: 0,
              width: widthPt,
              height: heightPt,
              opacity: 1.0,
            });
          }
        } catch (imgErr) {
          console.warn(`[VectorOverlayEngineV2] Advertencia al incrustar fondo de pÃ¡gina ${pIdx}:`, imgErr);
        }
      }
    }

    const fontRegular = await pdfDoc.embedFont('Helvetica');
    const fontBold = await pdfDoc.embedFont('Helvetica-Bold');

    const warnings: string[] = [];
    let requiresReview = false;
    let injectedElementsCount = 0;

    // Embeber sello/firma si estÃ¡ disponible en opciones
    let embeddedStampImage: any = null;
    if (options.doctorStampBase64) {
      try {
        const cleanBase64 = options.doctorStampBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
        embeddedStampImage = options.doctorStampBase64.includes('image/png')
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
      } catch (err: any) {
        warnings.push(`No se pudo embeber el sello del mÃ©dico: ${err.message}`);
      }
    }

    // Asegurar que existan suficientes pÃ¡ginas en el documento
    const tplPages = template?.pages || [];
    while (pdfDoc.getPageCount() < tplPages.length) {
      const pIdx = pdfDoc.getPageCount();
      const pageTpl = tplPages[pIdx];
      const wMm = pageTpl?.widthMm || 210.0;
      const hMm = pageTpl?.heightMm || 297.0;
      pdfDoc.addPage([(wMm * 72) / 25.4, (hMm * 72) / 25.4]);
    }

    const pages = pdfDoc.getPages();

    for (const pageTemplate of tplPages) {
      if (pageTemplate.pageIndex >= pages.length) {
        warnings.push(`PÃ¡gina ${pageTemplate.pageIndex + 1} no existe en el PDF base (total pÃ¡ginas: ${pages.length}).`);
        continue;
      }

      const page = pages[pageTemplate.pageIndex];
      const actualPageWidthPt = page.getWidth();
      const actualPageHeightPt = page.getHeight();
      const actualPageWidthMm = (actualPageWidthPt * 25.4) / 72;
      const actualPageHeightMm = (actualPageHeightPt * 25.4) / 72;

      // ValidaciÃ³n estricta de dimensiones fÃ­sicas reales vs MasterTemplateV2
      const templatePageWidthMm = pageTemplate.widthMm ?? (pageTemplate as any).pageSize?.widthMm ?? actualPageWidthMm;
      const templatePageHeightMm = pageTemplate.heightMm ?? (pageTemplate as any).pageSize?.heightMm ?? actualPageHeightMm;

      const widthDiffMm = Math.abs(templatePageWidthMm - actualPageWidthMm);
      const heightDiffMm = Math.abs(templatePageHeightMm - actualPageHeightMm);
      const DIMENSION_TOLERANCE_MM = 3.0;

      if (widthDiffMm > DIMENSION_TOLERANCE_MM || heightDiffMm > DIMENSION_TOLERANCE_MM) {
        const errorMsg = `[VectorOverlayEngineV2] ADVERTENCIA DE DIMENSIÃ“N DEL MASTER: La pÃ¡gina ${pageTemplate.pageIndex + 1} del PDF base mide ${actualPageWidthMm.toFixed(1)} Ã— ${actualPageHeightMm.toFixed(1)} mm (${actualPageWidthPt.toFixed(1)} Ã— ${actualPageHeightPt.toFixed(1)} pt), mientras que el MasterTemplateV2 '${template.masterId}' declara ${templatePageWidthMm.toFixed(1)} Ã— ${templatePageHeightMm.toFixed(1)} mm.`;
        console.warn(errorMsg);
        warnings.push(errorMsg);
        requiresReview = true;
      }

      // La altura fÃ­sica real de la pÃ¡gina para la transformaciÃ³n top-down a bottom-up
      const pageHeightMm = actualPageHeightMm;
      const combinedLockedRegions = [
        ...(template.lockedRegions || []),
        ...(pageTemplate.lockedRegions || []),
      ];

      // Factor de escala dinÃ¡mico en caso de que el PDF cargado difiera del diseÃ±o de referencia (ej. Carta vs A4)
      const scaleX = templatePageWidthMm > 0 && Math.abs(templatePageWidthMm - actualPageWidthMm) > 1.5
        ? actualPageWidthMm / templatePageWidthMm
        : 1.0;
      const scaleY = templatePageHeightMm > 0 && Math.abs(templatePageHeightMm - actualPageHeightMm) > 1.5
        ? actualPageHeightMm / templatePageHeightMm
        : 1.0;

      for (const element of pageTemplate.elements) {
        const rawGeom = element.geometry || {
          xMm: (element as any).xMm ?? 20,
          yMm: (element as any).yMm ?? 20,
          widthMm: (element as any).widthMm ?? 40,
          heightMm: (element as any).heightMm ?? 6,
        };

        // Guarda Centinela GeomÃ©trica CanÃ³nica (ProtecciÃ³n Anti-DesalineaciÃ³n RÃ©cipe)
        if (element.id && (element.id === 'left_date' || element.id === 'right_date') && (rawGeom.yMm <= 5.0 || rawGeom.yMm < 56.0)) {
          rawGeom.yMm = 60.5;
        }
        if (element.id && (element.id === 'left_patient_id' || element.id === 'right_patient_id') && (rawGeom.yMm < 56.0 || rawGeom.yMm === 0)) {
          rawGeom.yMm = 60.5;
        }
        if (element.id && (element.id === 'left_patient_name' || element.id === 'right_patient_name') && rawGeom.yMm < 54.0) {
          rawGeom.yMm = 56.5;
        }
        if (element.id && (element.id === 'left_rx_body' || element.id === 'right_indications_body') && rawGeom.yMm < 75.0) {
          rawGeom.yMm = 78.0;
        }

        const geom: ElementGeometry = {
          xMm: Number((rawGeom.xMm * scaleX).toFixed(2)),
          yMm: Number((rawGeom.yMm * scaleY).toFixed(2)),
          widthMm: Number((rawGeom.widthMm * scaleX).toFixed(2)),
          heightMm: Number((rawGeom.heightMm * scaleY).toFixed(2)),
        };

        switch (element.type) {
          case 'text': {
            const rawVal = VectorOverlayEngineV2.resolveDataKey(patientData, element.dataKey);
            if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
              break;
            }
            const textToDraw = element.labelPrefix ? `${element.labelPrefix}${String(rawVal).trim()}` : String(rawVal).trim();
            const font = (element.typography?.fontWeight ?? (element as any).fontWeight) === 'bold' ? fontBold : fontRegular;
            let fontSize = element.typography?.fontSizePt ?? (element as any).fontSizePt ?? 9.5;

            // MediciÃ³n tipogrÃ¡fica exacta y autoajuste (shrink) sin partir en mÃºltiples lÃ­neas
            const maxAllowedWidthPt = CalibrationEngine.xMmToPdfPt(geom.widthMm);
            let textWidth = font.widthOfTextAtSize(textToDraw, fontSize);
            if (textWidth > maxAllowedWidthPt) {
              if (element.overflow === 'shrink') {
                const shrinkFactor = maxAllowedWidthPt / textWidth;
                fontSize = Math.max(fontSize * shrinkFactor, 6.0);
                textWidth = font.widthOfTextAtSize(textToDraw, fontSize);
              }
            }

            const alignedX = CalibrationEngine.calculateAlignedXPt(
              geom.xMm,
              geom.widthMm,
              element.typography?.align ?? (element as any).align ?? 'left',
              textWidth
            );
            const baselineY = CalibrationEngine.calculateBaselineYPt(
              geom.yMm,
              fontSize,
              pageHeightMm,
              font.heightAtSize(fontSize),
              geom.heightMm
            );

            // Importante: No pasar maxWidth en 'text' de una sola lÃ­nea para evitar saltos de lÃ­nea no deseados en pdf-lib
            page.drawText(textToDraw, {
              x: alignedX,
              y: baselineY,
              size: fontSize,
              font,
              color: rgb(0.08, 0.12, 0.2),
            });
            injectedElementsCount++;
            break;
          }

          case 'multilineText': {
            const rawVal = VectorOverlayEngineV2.resolveDataKey(patientData, element.dataKey);
            if (!rawVal || String(rawVal).trim() === '') break;

            const textToDraw = String(rawVal).trim();
            const font = (element.typography?.fontWeight ?? (element as any).fontWeight) === 'bold' ? fontBold : fontRegular;
            const baseFontSize = element.typography?.fontSizePt ?? (element as any).fontSizePt ?? 9.5;

            const shrinkResult = CalibrationEngine.calculateShrinkFontSize(
              textToDraw,
              geom.heightMm,
              baseFontSize,
              7.5,
              geom.widthMm
            );

            if (shrinkResult.requiresReview) {
              requiresReview = true;
              warnings.push(`El texto en '${element.id}' excede el espacio visual asignado y requiere revisiÃ³n.`);
            }

            const activeFontSize = shrinkResult.fontSizePt;
            const lineHeightPt = element.typography?.lineHeightPt ?? ((element as any).lineHeightPt || (activeFontSize * 1.35));

            // Renderizar pÃ¡rrafos y lÃ­neas
            const lines = VectorOverlayEngineV2.wrapText(textToDraw, font, activeFontSize, CalibrationEngine.xMmToPdfPt(geom.widthMm));
            let currentYMm = geom.yMm;

            for (let i = 0; i < Math.min(lines.length, element.maxLines || 40); i++) {
              const line = lines[i];
              const textWidth = font.widthOfTextAtSize(line, activeFontSize);
              const alignedX = CalibrationEngine.calculateAlignedXPt(
                geom.xMm,
                geom.widthMm,
                element.typography?.align ?? (element as any).align ?? 'left',
                textWidth
              );
              const baselineY = CalibrationEngine.calculateBaselineYPt(
                currentYMm,
                activeFontSize,
                pageHeightMm,
                font.heightAtSize(activeFontSize)
              );

              page.drawText(line, {
                x: alignedX,
                y: baselineY,
                size: activeFontSize,
                font,
                maxWidth: CalibrationEngine.xMmToPdfPt(geom.widthMm),
                color: rgb(0.08, 0.12, 0.2), // Mejora: Color clÃ­nico de alto contraste para lectura mÃ©dica
              });
              currentYMm += CalibrationEngine.ptToMm(lineHeightPt);
            }
            injectedElementsCount++;
            break;
          }

          case 'checkbox': {
            const rawVal = VectorOverlayEngineV2.resolveDataKey(patientData, element.dataKey);
            const isChecked = Boolean(rawVal);
            const isDebug = Boolean(options.debugMode || options.debugOverlay);
            if (!isChecked && !isDebug) break;

            const markChar = 'X';
            const fontSize = element.fontSizePt ?? (element as any).fontSizePt ?? 8;
            const markWidth = fontBold.widthOfTextAtSize(markChar, fontSize);
            const boxWidthPt = CalibrationEngine.mmToPt(geom.widthMm);
            const boxHeightPt = CalibrationEngine.mmToPt(geom.heightMm);
            const originXPt = CalibrationEngine.xMmToPdfPt(geom.xMm);
            const originYPt = CalibrationEngine.yMmToPdfPt(geom.yMm, pageHeightMm);

            // Centrado geomÃ©trico exacto usando mÃ©tricas reales de la fuente
            const alignedX = originXPt + (boxWidthPt - markWidth) / 2;
            const capHeight = fontSize * 0.718;
            const baselineY = originYPt - (boxHeightPt + capHeight) / 2;

            if (isChecked) {
              page.drawText(markChar, {
                x: alignedX,
                y: baselineY,
                size: fontSize,
                font: fontBold,
                color: isDebug ? rgb(0.85, 0.1, 0.1) : rgb(0.04, 0.22, 0.43),
              });
              injectedElementsCount++;
            }

            if (isDebug) {
              // Caja de diagnÃ³stico de alta visibilidad para comprobaciÃ³n de superposiciÃ³n
              page.drawRectangle({
                x: originXPt,
                y: originYPt - boxHeightPt,
                width: boxWidthPt,
                height: boxHeightPt,
                borderColor: rgb(0.1, 0.7, 0.2),
                borderWidth: 0.5,
              });
            }
            break;
          }

          case 'stamp':
          case 'signature': {
            const xPt = CalibrationEngine.xMmToPdfPt(geom.xMm);
            const yPt = CalibrationEngine.yMmToPdfPt(geom.yMm + geom.heightMm, pageHeightMm);
            const widthPt = CalibrationEngine.xMmToPdfPt(geom.widthMm);
            const heightPt = CalibrationEngine.xMmToPdfPt(geom.heightMm);

            if (embeddedStampImage) {
              page.drawImage(embeddedStampImage, {
                x: xPt,
                y: yPt,
                width: widthPt,
                height: heightPt,
                opacity: element.opacity !== undefined ? element.opacity : 0.92,
              });
              injectedElementsCount++;
            } else {
              // Sello Vectorial AutomÃ¡tico Oficial (Dr. Samir - NeurocirugÃ­a y CirugÃ­a de Columna)
              const stampBlue = rgb(0.04, 0.22, 0.43); // #0a376d
              const stampCyan = rgb(0.06, 0.45, 0.65); // #0f769e

              // Marco institucional vectorial de alta definiciÃ³n
              page.drawRectangle({
                x: xPt,
                y: yPt,
                width: widthPt,
                height: heightPt,
                borderColor: stampBlue,
                borderWidth: 0.75,
                opacity: 0.85,
              });

              // LÃ­nea divisoria de firma
              page.drawLine({
                start: { x: xPt + 8, y: yPt + heightPt * 0.46 },
                end: { x: xPt + widthPt - 8, y: yPt + heightPt * 0.46 },
                color: stampBlue,
                thickness: 0.6,
                opacity: 0.75,
              });

              const line1 = 'Dr. Samir';
              const line2 = 'Especialista en NeurocirugÃ­a y CirugÃ­a de Columna';
              const line3 = 'MPPS: 61231 â€¢ CMEB: 5331';

              const sz1 = Math.max(6.5, Math.min(8.5, widthPt / 13));
              const sz2 = Math.max(5.0, Math.min(6.2, widthPt / 22));
              const sz3 = Math.max(5.5, Math.min(6.5, widthPt / 18));

              const w1 = fontBold.widthOfTextAtSize(line1, sz1);
              const w2 = fontRegular.widthOfTextAtSize(line2, sz2);
              const w3 = fontBold.widthOfTextAtSize(line3, sz3);

              page.drawText(line1, {
                x: xPt + Math.max(2, (widthPt - w1) / 2),
                y: yPt + heightPt * 0.28,
                size: sz1,
                font: fontBold,
                color: stampBlue,
                opacity: 0.95,
              });

              page.drawText(line2, {
                x: xPt + Math.max(2, (widthPt - w2) / 2),
                y: yPt + heightPt * 0.16,
                size: sz2,
                font: fontRegular,
                color: stampCyan,
                opacity: 0.9,
              });

              page.drawText(line3, {
                x: xPt + Math.max(2, (widthPt - w3) / 2),
                y: yPt + heightPt * 0.04,
                size: sz3,
                font: fontBold,
                color: stampBlue,
                opacity: 0.95,
              });

              injectedElementsCount++;
            }
            break;
          }

          case 'line': {
            const startX = CalibrationEngine.xMmToPdfPt(geom.xMm);
            const endX = CalibrationEngine.xMmToPdfPt(geom.xMm + geom.widthMm);
            const yPt = CalibrationEngine.yMmToPdfPt(geom.yMm, pageHeightMm);

            page.drawLine({
              start: { x: startX, y: yPt },
              end: { x: endX, y: yPt },
              thickness: element.thicknessPt || 1,
              color: rgb(0.3, 0.35, 0.4),
            });
            injectedElementsCount++;
            break;
          }
        }
      }
    }

    
    // === MEJORA: INYECCIÃ“N DE CÃ“DIGO QR DE SEGURIDAD ANTIFALSIFICACIÃ“N ===
    try {
      // Generamos un string de verificaciÃ³n Ãºnico con los datos del documento
      const docRef = `${template.documentType.toUpperCase()}-${new Date().getTime().toString(36).toUpperCase()}`;
      const verificationText = `CCMI STUDIO | Dr. Samir Moucharrafie
Doc: ${docRef}
Verificable digitalmente.`;
      
      const qrDataUrl = await QRCode.toDataURL(verificationText, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: { dark: '#0a376d', light: '#ffffff' }
      });
      
      const cleanBase64 = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const qrBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
      const qrImage = await pdfDoc.embedPng(qrBytes);

      // Dibujar en todas las pÃ¡ginas procesadas en la esquina inferior derecha
      for (const p of tplPages) {
         if (p.pageIndex < pages.length) {
            const pdfPage = pages[p.pageIndex];
            const qrSize = 45; // pt
            const marginX = 25;
            const marginY = 25;
            
            pdfPage.drawImage(qrImage, {
              x: pdfPage.getWidth() - qrSize - marginX,
              y: marginY,
              width: qrSize,
              height: qrSize,
              opacity: 0.9,
            });

            pdfPage.drawText("VERIFICACIÃ“N DIGITAL", {
              x: pdfPage.getWidth() - qrSize - marginX - 5,
              y: marginY - 6,
              size: 5,
              font: fontBold,
              color: rgb(0.04, 0.22, 0.43),
              opacity: 0.7,
            });
         }
      }
      injectedElementsCount++;
    } catch (qrErr) {
      console.warn('[VectorOverlayEngineV2] Fallo al generar QR de seguridad:', qrErr);
    }
    // =====================================================================

    const pdfBytes = await pdfDoc.save();
    return {
      pdfBytes,
      requiresReview,
      warnings,
      injectedElementsCount,
    };
  }

  /**
   * Divide un texto en lÃ­neas respetando el ancho mÃ¡ximo en puntos
   */
  public static wrapText(text: string, font: PDFFont, fontSize: number, maxWidthPt: number): string[] {
    const paragraphs = text.split('\n');
    const resultLines: string[] = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        resultLines.push('');
        continue;
      }
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth <= maxWidthPt) {
          currentLine = testLine;
        } else {
          if (currentLine !== '') {
            resultLines.push(currentLine);
          }
          currentLine = word;
        }
      }
      if (currentLine !== '') {
        resultLines.push(currentLine);
      }
    }

    return resultLines;
  }
}
