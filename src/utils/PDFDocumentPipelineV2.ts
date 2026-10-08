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
import {
  recipeBytes,
  informeBytes,
  ordenLabBytes,
  constanciaBytes,
  historiaBytes,
} from '../document-engine-v3/bundled';


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
   * Carga el buffer del PDF maestro oficial inmutable (Zero-Network).
   * Lee exclusivamente de los binarios TypeScript pre-empaquetados en memoria.
   */
  private static async loadOriginalPdf(path: string, documentType?: string): Promise<Uint8Array> {
    const rawType = (documentType || path || '').toLowerCase().trim();
    
    // Entrega inmediata y determinista desde binarios embebidos (Zero-Network)
    if (rawType.includes('recipe') || rawType === 'recipes') {
      return recipeBytes;
    }
    if (rawType.includes('lab') || rawType.includes('orden')) {
      return ordenLabBytes;
    }
    if (rawType.includes('report') || rawType.includes('informe')) {
      return informeBytes;
    }
    if (rawType.includes('cert') || rawType.includes('constancia')) {
      return constanciaBytes;
    }
    if (rawType.includes('hist') || rawType.includes('historia')) {
      return historiaBytes;
    }

    throw new Error('CRÍTICO: Tipo de documento desconocido. No se puede generar el PDF.');
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
    const bgPath = template.source?.backgroundImage || template.source?.backgroundPdf || (template as any).backgroundImage || template.backgroundPdf || '';
    const originalPdfBytes = request.templateBytes || (await this.loadOriginalPdf(bgPath, request.documentType, request.customBgImage));

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

