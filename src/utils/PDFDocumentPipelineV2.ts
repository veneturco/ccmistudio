/**
 * PDFDocumentPipelineV2.ts
 * 
 * PIPELINE UNIVERSAL DE GENERACIÓN DE DOCUMENTOS MÉDICOS (ARQUITECTURA V2)
 * =======================================================================
 * Flujo estricto:
 * 1. PDF MAESTRO ORIGINAL (Background inmutable de /public/templates/*.pdf)
 * 2. MASTER TEMPLATE V2 (Esquema físico canónico en mm de /src/calibration/MasterRegistryV2)
 * 3. MAPEO SEMÁNTICO (Data de paciente y clínica estructurada a notación de puntos)
 * 4. OVERLAY VECTORIAL PURO (pdf-lib, inyección directa sin rasterizar)
 * 5. VALIDACIÓN Y AUDITORÍA (Verificación de desbordamiento, colisiones y campos)
 * 6. SALIDA COMPLETA (Uint8Array, Blob, File, descarga o distribución directa)
 */

import { PDFDocument } from 'pdf-lib';
import { getMasterTemplateV2, MasterTemplateV2 } from '../calibration/MasterRegistryV2';
import { TemplateRegistry } from '../calibration/TemplateRegistry';
import { VectorOverlayEngineV2, OverlayRenderResult } from '../calibration/VectorOverlayEngineV2';
import { SemanticDataMapperV2, ClinicalWorkspaceContext } from '../calibration/SemanticDataMapperV2';
import { downloadBlob, formatWhatsAppPhone, buildWhatsAppMessage, sharePdfToWhatsApp } from './pdfExportHelpers';
import { getCustomTemplateOriginalPdf, getCustomTemplate } from './templateStorage';
import { PDFTemplatePreloader } from './PDFTemplatePreloader';

export interface DocumentPipelineRequest {
  documentType: string; // 'recipe' | 'certificate' | 'report' | 'history' | 'lab_order' o cualquier tipo maestro
  context: ClinicalWorkspaceContext;
  customFileName?: string;
  doctorStampBase64?: string;
  template?: MasterTemplateV2;
  templateBytes?: Uint8Array;
  customBgImage?: string | null;
}

export interface DocumentPipelineResponse {
  pdfBytes: Uint8Array;
  blob: Blob;
  file: File;
  fileName: string;
  template: MasterTemplateV2;
  requiresReview: boolean;
  warnings: string[];
  injectedCount: number;
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  try {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    const base64Index = dataUrl.indexOf(';base64,');
    if (base64Index !== -1) {
      const b64 = dataUrl.slice(base64Index + 8);
      const binaryString = atob(b64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  } catch (e) {
    console.warn('[PDFDocumentPipelineV2] Error convirtiendo DataURL a bytes:', e);
  }
  return null;
}

export class PDFDocumentPipelineV2 {
  /**
   * Carga el buffer del PDF o imagen base inmutable.
   * Prioridad 0: Fondo maestro explícito pasado en la petición (DataURL o URL).
   * Prioridad 1: Plantilla física personalizada en IndexedDB / localStorage.
   * Prioridad 2: Archivo PDF maestro oficial (/templates/*.pdf).
   * Prioridad 3: Imagen oficial de alta resolución 300 DPI (/templates/*.jpg).
   */
  private static async loadOriginalPdf(path: string, documentType?: string, customBgImage?: string | null): Promise<Uint8Array> {
    // 0. Si se pasó una imagen o fondo maestro directo (DataURL o URL) en la petición
    if (customBgImage) {
      const directBytes = dataUrlToBytes(customBgImage);
      if (directBytes && directBytes.length > 500) {
        return directBytes;
      }
      try {
        const resp = await fetch(customBgImage);
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          const bytes = new Uint8Array(buf);
          if (bytes.length > 500) return bytes;
        }
      } catch (err) {
        console.warn('[PDFDocumentPipelineV2] Error fetching customBgImage:', err);
      }
    }

    // 1. Revisar si el usuario tiene una plantilla personalizada en IndexedDB / localStorage
    if (documentType) {
      const rawType = documentType.toLowerCase().trim();
      try {
        // A. Revisar si tiene PDF oficial subido en IndexedDB
        const storedPdf = await getCustomTemplateOriginalPdf(documentType);
        if (
          storedPdf &&
          storedPdf.length > 10000 &&
          storedPdf[0] === 0x25 &&
          storedPdf[1] === 0x50 &&
          storedPdf[2] === 0x44 &&
          storedPdf[3] === 0x46
        ) {
          return storedPdf;
        }

        // B. Revisar si tiene Imagen escaneada/DataURL personalizada en IndexedDB o localStorage
        const customImgDataUrl =
          (await getCustomTemplate(documentType)) ||
          (await getCustomTemplate(rawType)) ||
          (typeof localStorage !== 'undefined'
            ? localStorage.getItem(`custom_tpl_${documentType}`) || localStorage.getItem(`custom_tpl_${rawType}`)
            : null);

        if (customImgDataUrl) {
          const customBytes = dataUrlToBytes(customImgDataUrl);
          if (customBytes && customBytes.length > 500) {
            return customBytes;
          }
          if (typeof customImgDataUrl === 'string' && customImgDataUrl.startsWith('http')) {
            const resp = await fetch(customImgDataUrl);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              return new Uint8Array(buf);
            }
          }
        }
      } catch (err) {
        console.warn(`[PDFDocumentPipelineV2] Error buscando plantilla personalizada para ${documentType}:`, err);
      }
    }
    const rawType = (documentType || '').toLowerCase().trim();
    
    // Mapeo exhaustivo y tolerante de nombres a archivos maestros oficiales
    let defaultPdf = '/templates/recipe_base.pdf';
    let defaultImg = '/templates/recipes_bg.jpg';
    
    if (rawType.includes('recipe') || rawType === 'recipes') {
      defaultPdf = '/templates/recipe_base.pdf';
      defaultImg = '/templates/recipes_bg.jpg';
    } else if (rawType.includes('lab') || rawType.includes('orden')) {
      defaultPdf = '/templates/orden_lab_base.pdf';
      defaultImg = '/templates/orden_lab_p1_bg.jpg';
    } else if (rawType.includes('report') || rawType.includes('informe')) {
      defaultPdf = '/templates/informe_base.pdf';
      defaultImg = '/templates/informe_bg.jpg';
    } else if (rawType.includes('cert') || rawType.includes('constancia')) {
      defaultPdf = '/templates/constancia_base.pdf';
      defaultImg = '/templates/constancia_bg.jpg';
    } else if (rawType.includes('hist') || rawType.includes('historia')) {
      defaultPdf = '/templates/historia_base.pdf';
      defaultImg = '/templates/historia_bg.jpg';
    } else if (path && path.length > 3) {
      defaultPdf = path.startsWith('/') ? path : `/${path}`;
      defaultImg = defaultPdf.replace(/\.pdf$/i, '_bg.jpg');
    }

    // 0. Cache en memoria RAM viva (Pilar 5: Optimización < 50ms)
    try {
      const cached = await PDFTemplatePreloader.getOrFetch(defaultPdf);
      if (cached && cached.length > 1000 && cached[0] === 0x25 && cached[1] === 0x50 && cached[2] === 0x44 && cached[3] === 0x46) {
        return cached;
      }
    } catch {
      // Continuar con carga estándar
    }

    // 1. Entorno Node.js / CLI (Carga directa de disco)
    if (typeof window === 'undefined') {
      try {
        const fs = await import(/* @vite-ignore */ 'fs');
        const nodePath = await import(/* @vite-ignore */ 'path');
        const localFilePath = nodePath.join(process.cwd(), 'public', defaultPdf.replace(/^\//, ''));
        if (fs.existsSync(localFilePath)) {
          const buf = fs.readFileSync(localFilePath);
          if (buf.length > 1000 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
            return new Uint8Array(buf);
          }
        }
        const localImgPath = nodePath.join(process.cwd(), 'public', defaultImg.replace(/^\//, ''));
        if (fs.existsSync(localImgPath)) {
          return new Uint8Array(fs.readFileSync(localImgPath));
        }
      } catch {
        // Seguir con fetch
      }
    }

    // 2. Cargar PDF estático oficial maestro vía fetch (Máxima prioridad en navegador)
    const pdfCandidateUrls = [
      defaultPdf,
      defaultPdf.replace(/^\//, ''),
      typeof window !== 'undefined' ? `${window.location.origin}${defaultPdf}` : null,
    ].filter(Boolean) as string[];

    for (const url of pdfCandidateUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          // Validar cabecera mágica %PDF y tamaño mínimo razonable para un PDF con arte gráfico (> 10 KB)
          if (bytes.length > 10000 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
            return bytes;
          }
        }
      } catch (fetchErr) {
        // Continuar con la siguiente alternativa
      }
    }

    // 3. Si el servidor estático no responde, intentar cargar desde IndexedDB sólo si tiene tamaño de arte (> 40 KB)
    if (documentType) {
      try {
        const storedPdf = await getCustomTemplateOriginalPdf(documentType);
        if (
          storedPdf && 
          storedPdf.length > 40000 && 
          storedPdf[0] === 0x25 && 
          storedPdf[1] === 0x50 && 
          storedPdf[2] === 0x44 && 
          storedPdf[3] === 0x46
        ) {
          try {
            const pdfDoc = await PDFDocument.load(storedPdf, { ignoreEncryption: true });
            if (pdfDoc.getPageCount() > 0) {
              return storedPdf;
            }
          } catch (e) {
            console.warn(`[PDFDocumentPipelineV2] PDF en IndexedDB descartado para ${documentType}:`, e);
          }
        }
      } catch (err) {
        console.warn(`[PDFDocumentPipelineV2] Error leyendo IndexedDB para ${documentType}:`, err);
      }
    }

    // 4. Capa de Respaldo Inmune a Fallos: Cargar imagen maestra 300 DPI
    const imgCandidateUrls = [
      defaultImg,
      defaultImg.replace(/^\//, ''),
      typeof window !== 'undefined' ? `${window.location.origin}${defaultImg}` : null,
    ].filter(Boolean) as string[];

    for (const url of imgCandidateUrls) {
      try {
        const imgResp = await fetch(url);
        if (imgResp.ok) {
          const imgBuffer = await imgResp.arrayBuffer();
          const imgBytes = new Uint8Array(imgBuffer);
          // Validar cabecera JPEG (0xff, 0xd8, 0xff) o PNG (0x89, 0x50, 0x4e, 0x47)
          const isJpg = imgBytes.length > 100 && imgBytes[0] === 0xff && imgBytes[1] === 0xd8 && imgBytes[2] === 0xff;
          const isPng = imgBytes.length > 100 && imgBytes[0] === 0x89 && imgBytes[1] === 0x50 && imgBytes[2] === 0x4e && imgBytes[3] === 0x47;
          if (isJpg || isPng) {
            return imgBytes;
          }
        }
      } catch (imgErr) {
        // Continuar
      }
    }

    throw new Error(`[PDFDocumentPipelineV2] No se pudo cargar la papelería oficial maestra para '${documentType || path}'.`);
  }

  /**
   * Genera el documento PDF final utilizando la Arquitectura V2 completa
   */
  public static async generateDocument(request: DocumentPipelineRequest): Promise<DocumentPipelineResponse> {
    const template = request.template || getMasterTemplateV2(request.documentType) || TemplateRegistry.get(request.documentType);
    if (!template) {
      throw new Error(`No existe un MasterTemplateV2 registrado para el tipo '${request.documentType}'`);
    }

    // 1. Cargar el PDF maestro original (Bytes directos, customBgImage, IndexedDB o ruta estática)
    const originalPdfBytes = request.templateBytes || (await this.loadOriginalPdf(template.source.backgroundPdf, request.documentType, request.customBgImage));

    // 2. Mapear datos semánticos del paciente
    const semanticDictionary = SemanticDataMapperV2.mapToSemanticDictionary(request.context);

    // 3. Aplicar Overlay Vectorial con protección y autoajuste
    const renderResult: OverlayRenderResult = await VectorOverlayEngineV2.applyOverlay(
      originalPdfBytes,
      template,
      semanticDictionary,
      {
        doctorStampBase64: request.doctorStampBase64 || request.context.doctorStampBase64,
      }
    );

    // 4. Construir Blob y File
    const patientNameSafe = (semanticDictionary.patient.fullName || 'Paciente')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const dateSafe = (semanticDictionary.document.date || '').replace(/[\/\\]/g, '-');
    const defaultFileName = `${template.documentType.toUpperCase()}_${patientNameSafe}_${dateSafe || 'doc'}.pdf`;
    const finalFileName = request.customFileName || defaultFileName;

    const blob = new Blob([renderResult.pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], finalFileName, { type: 'application/pdf' });

    return {
      pdfBytes: renderResult.pdfBytes,
      blob,
      file,
      fileName: finalFileName,
      template,
      requiresReview: renderResult.requiresReview,
      warnings: renderResult.warnings,
      injectedCount: renderResult.injectedElementsCount,
    };
  }

  /**
   * Descarga directamente un buffer PDF
   */
  public static downloadPDF(pdfBytes: Uint8Array, fileName: string): void {
    downloadBlob(pdfBytes, fileName);
  }

  /**
   * Genera y descarga directamente el documento PDF
   */
  public static async generateAndDownload(request: DocumentPipelineRequest): Promise<DocumentPipelineResponse> {
    const response = await this.generateDocument(request);
    downloadBlob(response.pdfBytes, response.fileName);
    return response;
  }

  /**
   * Genera y abre el diálogo nativo de impresión con el fondo Master 100% integrado
   */
  public static async generateAndPrint(request: DocumentPipelineRequest): Promise<DocumentPipelineResponse> {
    const response = await this.generateDocument(request);
    if (typeof window !== 'undefined') {
      const blobUrl = URL.createObjectURL(response.blob);
      let iframe = document.getElementById('ccmi-dedicated-print-iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'ccmi-dedicated-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }
      const prevBlobUrl = iframe.dataset.blobUrl;
      if (prevBlobUrl) {
        URL.revokeObjectURL(prevBlobUrl);
      }
      iframe.dataset.blobUrl = blobUrl;
      iframe.src = blobUrl;
      iframe.onload = () => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch (err) {
          console.warn('Fallback de impresión nativa:', err);
          window.print();
        }
      };
    }
    return response;
  }

  /**
   * Genera y prepara el documento para envío por WhatsApp y descarga
   */
  public static async generateAndShareWhatsApp(
    request: DocumentPipelineRequest,
    targetPhone?: string
  ): Promise<{ pipelineResponse: DocumentPipelineResponse; shareResult: any }> {
    const pipelineResponse = await this.generateDocument(request);
    const semanticData = SemanticDataMapperV2.mapToSemanticDictionary(request.context);

    const docName = pipelineResponse.template.metadata?.name || pipelineResponse.template.documentType;
    const msg = buildWhatsAppMessage({
      patientName: semanticData.patient.fullName,
      docTitle: docName,
      phone: targetPhone || semanticData.patient.phone || '',
    });

    sharePdfToWhatsApp(targetPhone || semanticData.patient.phone || '', msg);

    return { pipelineResponse, shareResult: { success: true } };
  }
}
