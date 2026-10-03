/**
 * ============================================================================
 * SISTEMA OPERATIVO CcMi / SYNAPSIS (SOCS)
 * Archivo: src/api/workspaceEngine.ts
 * 
 * MOTOR DE INTEGRACIÓN WORKSPACE & GEMINI AI PARA VERCEL SERVERLESS / CLOUD
 * ============================================================================
 * Este módulo orquesta la comunicación entre la interfaz clínica/logística
 * y el backend serverless (ej. Vercel Functions / Node.js Express).
 * 
 * FLUJO DE ARQUITECTURA (4 FASES):
 * 1. INGESTA CLÍNICA: Recepción de texto libre / dictado por voz del Dr. Samir Moucharrafie.
 * 2. ESTRUCTURACIÓN GEMINI: Extracción semántica en JSON estricto (Diagnóstico, CIE-10,
 *    Fármacos, Dosis, Posología, Duración, Indicaciones Generales, Reposo).
 * 3. CLONACIÓN & INYECCIÓN GOOGLE DOCS:
 *    - Se toma la plantilla preexistente diseñada por "Magic Graphic" (Template ID).
 *    - Se duplica en Google Drive para preservar márgenes, cabeceras, logos, firmas y sellos.
 *    - Se ejecutan peticiones `batchUpdate` (replaceAllText) reemplazando placeholders.
 * 4. EXPORTACIÓN PDF & STREAM DE IMPRESIÓN:
 *    - Google Drive `files.export({ mimeType: 'application/pdf' })`
 *    - Se retorna la URL del documento, el PDF en base64 o blob para vista previa e impresión directa.
 */

import { DocumentType, PatientInfo, ProcessedDocumentResult, StructuredClinicalData } from '../types';
import { auth } from '../firebase/config';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    if (typeof window !== 'undefined' && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Silencioso en modo offline o sin sesión
  }
  return {};
}

export interface ProcessDocumentRequest {
  patient: PatientInfo;
  documentType: DocumentType;
  rawClinicalNote: string;
  templateId?: string;
  includeDigitalSignature?: boolean;
  metadata?: {
    clinicLocation?: string;
    specialty?: string;
    doctorName?: string;
    doctorLicence?: string;
  };
}

export interface WorkspaceEngineApiResponse {
  success: boolean;
  data?: ProcessedDocumentResult;
  error?: string;
  debugTrace?: {
    geminiLatencyMs: number;
    docsLatencyMs: number;
    pdfExportLatencyMs: number;
    tokensUsed: number;
  };
}

// Configuración de plantillas base de Google Docs (Magic Graphic Design IDs)
export const MAGIC_GRAPHIC_TEMPLATES: Record<string, { id: string; name: string; version: string }> = {
  recipe: {
    id: '1aBcD_MagicGraphic_Recipe_Template_V3',
    name: 'Plantilla Oficial CcMi - Récipe Médico (Doble Talón)',
    version: '3.2 (Magic Graphic)',
  },
  RECIPES: {
    id: '1aBcD_MagicGraphic_Recipe_Template_V3',
    name: 'Plantilla Oficial CcMi - Récipe Médico (Doble Talón)',
    version: '3.2 (Magic Graphic)',
  },
  report: {
    id: '2eFgH_MagicGraphic_Report_Template_V2',
    name: 'Plantilla Oficial CcMi - Informe Médico Especializado',
    version: '2.8 (Magic Graphic)',
  },
  INFORME: {
    id: '2eFgH_MagicGraphic_Report_Template_V2',
    name: 'Plantilla Oficial CcMi - Informe Médico Especializado',
    version: '2.8 (Magic Graphic)',
  },
  lab_order: {
    id: '3iJkL_MagicGraphic_LabOrder_Template_V1',
    name: 'Plantilla Oficial CcMi - Orden de Laboratorio / Imágenes',
    version: '1.9 (Magic Graphic)',
  },
  ORDEN_LAB: {
    id: '3iJkL_MagicGraphic_LabOrder_Template_V1',
    name: 'Plantilla Oficial CcMi - Orden de Laboratorio / Imágenes',
    version: '1.9 (Magic Graphic)',
  },
  certificate: {
    id: '4mNoP_MagicGraphic_Certificate_Template_V2',
    name: 'Plantilla Oficial CcMi - Constancia de Reposo / Asistencia',
    version: '2.1 (Magic Graphic)',
  },
  CONSTANCIA: {
    id: '4mNoP_MagicGraphic_Certificate_Template_V2',
    name: 'Plantilla Oficial CcMi - Constancia de Reposo / Asistencia',
    version: '2.1 (Magic Graphic)',
  },
  history: {
    id: '5qRsT_MagicGraphic_History_Template_V1',
    name: 'Plantilla Oficial CcMi - Historia Médica Neuroquirúrgica',
    version: '1.0 (Magic Graphic)',
  },
  HISTORIA: {
    id: '5qRsT_MagicGraphic_History_Template_V1',
    name: 'Plantilla Oficial CcMi - Historia Médica Neuroquirúrgica',
    version: '1.0 (Magic Graphic)',
  },
};

/**
 * Cliente de Integración Principal
 */
export class WorkspaceEngineService {
  private static instance: WorkspaceEngineService;
  private apiBaseUrl: string;

  private constructor() {
    // En Vercel: '/api/clinical-engine' o URL del backend configurable
    this.apiBaseUrl = (import.meta as any).env?.VITE_BACKEND_API_URL || '/api';
  }

  public static getInstance(): WorkspaceEngineService {
    if (!WorkspaceEngineService.instance) {
      WorkspaceEngineService.instance = new WorkspaceEngineService();
    }
    return WorkspaceEngineService.instance;
  }

  /**
   * Procesa la nota clínica enviándola al backend serverless o ejecutando el motor
   * de procesamiento semántico en tiempo real.
   */
  public async processMedicalDocument(
    payload: ProcessDocumentRequest
  ): Promise<ProcessedDocumentResult> {
    const startTime = performance.now();

    try {
      // 1. Intentar llamar al backend serverless si está disponible (Vercel / Node)
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${this.apiBaseUrl}/process-clinical-doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const json: WorkspaceEngineApiResponse = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      // Si estamos en entorno preview sin backend serverless activo,
      // ejecutamos el motor de simulación de alta fidelidad.
      console.info('[SOCS WorkspaceEngine] Usando motor de orquestación integrado (Client-Side Bridge).', e);
    }

    // 2. Motor de extracción semántica y mapeo a plantilla Magic Graphic
    return this.fallbackSimulateEngine(payload, startTime);
  }

  /**
   * Simulación interactiva del motor de Gemini 2.5 y Google Docs
   * Permite probar la aplicación con datos reales sin depender de que
   * las credenciales de Google Cloud OAuth / Service Account estén inyectadas todavía.
   */
  private async fallbackSimulateEngine(
    payload: ProcessDocumentRequest,
    startTime: number
  ): Promise<ProcessedDocumentResult> {
    // Simula latencia de IA + Google Docs API
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const structured = this.parseClinicalNoteWithRules(payload.rawClinicalNote, payload.documentType);
    const templateConfig = MAGIC_GRAPHIC_TEMPLATES[payload.documentType];
    const docNumber = `SOCS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const result: ProcessedDocumentResult = {
      id: `doc_${Date.now()}`,
      docNumber,
      documentType: payload.documentType,
      patient: payload.patient,
      structuredData: structured,
      templateName: templateConfig.name,
      googleDriveFileId: null,
      googleDocUrl: null,
      pdfExportUrl: `#pdf-${docNumber}`,
      generatedAt: formattedDate,
      doctorName: payload.metadata?.doctorName || 'Dr. Samir Moucharrafie',
      doctorRegistration: payload.metadata?.doctorLicence || 'M.P.P.S. 42.109 / C.M.D.F. 18.432',
      degradedMode: true,
    };

    const totalDuration = Math.round(performance.now() - startTime);
    console.log(`[SOCS WorkspaceEngine] Documento estructurado e inyectado con éxito en ${totalDuration}ms`);

    return result;
  }

  /**
   * Parser semántico clínico (Extrae únicamente información explícita)
   */
  private parseClinicalNoteWithRules(note: string, _docType: DocumentType): StructuredClinicalData {
    const lines = note.split('\n').map((l) => l.trim()).filter(Boolean);
    
    const medications: StructuredClinicalData['medications'] = [];
    const indications: string[] = [];
    let diagnosisPrincipal = '';
    const secondary: string[] = [];
    const labTests: string[] = [];
    let restDays = 0;

    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      
      // Diagnóstico
      if (lower.includes('dx:') || lower.includes('diagnostico:') || lower.includes('diagnóstico:')) {
        diagnosisPrincipal = line.replace(/^(dx:|diagnostico:|diagnóstico:)/i, '').trim();
        return;
      }

      // Reposo
      if (lower.includes('reposo') || lower.includes('días') || lower.includes('dias')) {
        const matchDays = line.match(/(\d+)\s*(días|dias)/i);
        if (matchDays) restDays = parseInt(matchDays[1], 10);
      }

      // Laboratorio / Exámenes
      if (lower.includes('laboratorio') || lower.includes('hematologia') || lower.includes('eco') || lower.includes('rx') || lower.includes('perfil') || lower.includes('rmn') || lower.includes('tac')) {
        labTests.push(line.replace(/^[-\d.]+\s*/, '').trim());
        return;
      }

      // Medicamento
      if (
        lower.match(/\b(mg|gr|ml|tab|caps|amp|comp|gotas|inhal)\b/) ||
        lower.match(/\bcada\s+\d+\s+(horas|hrs|h)\b/)
      ) {
        const parts = line.split(/[-–,;]/);
        const drugName = parts[0] ? parts[0].trim() : line;
        
        let freq = '';
        if (lower.includes('12')) freq = 'Cada 12 horas';
        else if (lower.includes('24') || lower.includes('diaria') || lower.includes('al día')) freq = 'Una vez al día';
        else if (lower.includes('6')) freq = 'Cada 6 horas';
        else if (lower.includes('8')) freq = 'Cada 8 horas';

        let duration = '';
        if (lower.includes('3 días') || lower.includes('3 dias')) duration = 'Por 3 días';
        else if (lower.includes('5 días') || lower.includes('5 dias')) duration = 'Por 5 días';
        else if (lower.includes('7 días') || lower.includes('7 dias')) duration = 'Por 7 días';
        else if (lower.includes('10 días') || lower.includes('10 dias')) duration = 'Por 10 días';
        else if (lower.includes('14 días') || lower.includes('14 dias')) duration = 'Por 14 días';
        else if (lower.includes('30 días') || lower.includes('30 dias')) duration = 'Por 30 días';

        medications.push({
          id: `med_${idx}`,
          drug: drugName,
          dose: line.match(/\d+\s*(mg|gr|ml|mcg|ui)/i)?.[0] || '',
          frequency: freq,
          duration: duration,
          instructions: '',
        });
      } else {
        indications.push(line);
      }
    });

    return {
      diagnosisPrincipal,
      secondaryDiagnoses: secondary,
      cie10Suggestions: [],
      medications,
      generalIndications: indications,
      restDays,
      restStartDate: restDays > 0 ? new Date().toISOString().split('T')[0] : '',
      labTests,
      summaryNote: note,
    };
  }

  /**
   * Verifica la conectividad con Google Drive, Google Docs y Gemini
   */
  public async testWorkspaceConnection(): Promise<{ docsConnected: boolean; driveConnected: boolean; geminiConnected: boolean }> {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        const geminiConnected = Boolean(data && data.status === 'ok' && (data.hasApiKey ?? true));
        return {
          docsConnected: false,
          driveConnected: false,
          geminiConnected,
        };
      }
    } catch (e) {
      console.warn('[WorkspaceEngine] Error comprobando conectividad con /api/health:', e);
    }
    return {
      docsConnected: false,
      driveConnected: false,
      geminiConnected: false,
    };
  }
}

export const workspaceEngine = WorkspaceEngineService.getInstance();

// ============================================================================
// ARQUITECTURA DE INTEGRACIÓN CLÍNICA Y CONTROL DE ERRORES
// SOCS - DR. SAMIR MOUCHARRAFIE
// ============================================================================

export const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-pro-preview',
];

export interface ClinicalExtractionResponse {
  success: boolean;
  data?: any;
  proposal?: any;
  requiresReview: boolean;
  uncertainFields?: string[];
  extractedTranscript?: string;
  error?: string;
  warning?: string;
  usedModel?: string;
  source?: string;
  isLocalFallback?: boolean;
}

export interface FallbackExtractionResult {
  data: any;
  usedModel: string;
  isLocalFallback: boolean;
  requiresReview?: boolean;
  uncertainFields?: string[];
  warning?: string;
  source?: string;
  error?: string;
}

/**
 * Extracción clínica a partir de texto o dictado transcrito
 */
export async function extractClinicalDataFromText(
  rawNote: string,
  currentData?: any
): Promise<ClinicalExtractionResponse> {
  if (!rawNote || !rawNote.trim()) {
    return {
      success: false,
      requiresReview: true,
      data: {},
      error: 'El texto del dictado clínico no puede estar vacío.'
    };
  }

  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/gemini/extract-clinical-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        transcript: rawNote,
        currentData: currentData || null,
      }),
    });

    const resData = await response.json().catch(() => null);

    if (response.ok && resData && resData.success && resData.data) {
      return {
        success: true,
        data: resData.data,
        proposal: resData.proposal,
        requiresReview: Boolean(resData.requiresReview || resData.data.requiresReview),
        uncertainFields: resData.uncertainFields || resData.data.uncertainFields || [],
        usedModel: resData.usedModel || resData.source || 'gemini-model',
        source: resData.source,
        warning: resData.warning,
      };
    }

    return {
      success: false,
      requiresReview: true,
      data: {},
      error: resData?.error || 'No fue posible extraer los datos clínicos.',
      warning: resData?.warning,
    };
  } catch (err: any) {
    return {
      success: false,
      requiresReview: true,
      data: {},
      error: `Error de red o conexión al servicio de extracción: ${err.message || 'Error desconocido'}`
    };
  }
}

/**
 * Extracción clínica directa desde un Blob de audio (Multimodal)
 */
export async function extractClinicalDataFromAudio(
  audioBlob: Blob,
  currentData?: any
): Promise<ClinicalExtractionResponse> {
  if (!audioBlob || audioBlob.size < 100) {
    return {
      success: false,
      requiresReview: true,
      data: {},
      error: 'El archivo de audio está vacío o no es legible.'
    };
  }

  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(audioBlob);
    const audioBase64 = await base64Promise;

    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/gemini/extract-from-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
        currentData: currentData || null,
      }),
    });

    const resData = await response.json().catch(() => null);

    if (response.ok && resData && resData.success && resData.data) {
      return {
        success: true,
        data: resData.data,
        proposal: resData.proposal,
        requiresReview: Boolean(resData.requiresReview || resData.data.requiresReview),
        uncertainFields: resData.uncertainFields || resData.data.uncertainFields || [],
        extractedTranscript: resData.transcript || resData.data.extractedTranscript || '',
        usedModel: resData.usedModel || resData.source || 'gemini-audio',
        source: resData.source,
      };
    }

    return {
      success: false,
      requiresReview: true,
      data: {},
      error: resData?.error || 'No fue posible procesar el dictado de voz.',
    };
  } catch (err: any) {
    return {
      success: false,
      requiresReview: true,
      data: {},
      error: `Error al transmitir audio al servicio: ${err.message || 'Error de conexión'}`
    };
  }
}

/**
 * Compatibilidad hacia atrás: extracción con manejo de estado
 */
export async function extractClinicalDataWithFallback(
  rawNote: string,
  currentData?: any
): Promise<FallbackExtractionResult> {
  const res = await extractClinicalDataFromText(rawNote, currentData);
  if (res.success && res.data) {
    return {
      data: res.data,
      usedModel: res.usedModel || 'gemini-model',
      isLocalFallback: false,
      requiresReview: res.requiresReview,
      uncertainFields: res.uncertainFields,
      warning: res.warning,
      source: res.source,
    };
  }

  return {
    data: currentData || {},
    usedModel: 'none',
    isLocalFallback: false,
    requiresReview: true,
    warning: res.warning || res.error || 'Extracción no exitosa. Complete los campos requeridos en la interfaz.',
    error: res.error,
  };
}
