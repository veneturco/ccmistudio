// =========================================================================
// FASE 3.2-A: MOTOR DE TIMELINE CLÍNICA — MODELOS Y DEFINICIÓN DE TIPOS
// =========================================================================

export type ClinicalTimelineEventType =
  | 'CONSULTATION'
  | 'CLINICAL_EPISODE'
  | 'IMAGING_STUDY'
  | 'LAB_STUDY'
  | 'MEDICAL_DOCUMENT'
  | 'PROCEDURE'
  | 'EVOLUTION'
  | 'ADMISSION'
  | 'DISCHARGE'
  | 'FOLLOW_UP'
  | 'ADMINISTRATIVE';

export type TimelineSourceType =
  | 'clinical_episode'
  | 'imaging_study'
  | 'medical_document'
  | 'consultation'
  | 'procedure'
  | 'evolution'
  | 'administrative';

export type DatePrecision = 
  | 'DATE_TIME' 
  | 'DATE_ONLY' 
  | 'DATETIME_WITHOUT_TIMEZONE' 
  | 'UNKNOWN';

export type TimezoneStatus = 
  | 'EXPLICIT' 
  | 'ABSENT' 
  | 'UNKNOWN';

export interface ClinicalTimelineEvent {
  id: string;
  patientId: string; // cleanId o nationalId del paciente
  tenantId: string;  // CCMI-DR-SAMIR
  timestamp: string; // Clave técnica canónica de ordenamiento (ISO 8601 o '' si fecha desconocida)
  eventType: ClinicalTimelineEventType;
  title: string;
  summary: string;
  sourceType: TimelineSourceType;
  sourceId: string;
  createdAt?: string; // ISO 8601 — Fecha de registro/ingesta técnica (solo si existe en la fuente)
  updatedAt?: string;
  
  // Consolidación Fase 3.2-A-R2: Fechas clínicas explícitas y precisión temporal
  clinicalDate?: string; // YYYY-MM-DD cuando se conoce la fecha clínica
  clinicalDateTime?: string; // ISO 8601 exacto (UTC/offset) solo cuando existe hora clínica con timezone explícito
  rawClinicalDateTime?: string; // Literal 'YYYY-MM-DDTHH:mm:ss' preservado intacto cuando timezoneStatus === 'ABSENT'
  datePrecision: DatePrecision;
  timezoneStatus?: TimezoneStatus;
  hasClinicalDate: boolean;

  // Identificadores de fuente específicos
  episodeId?: string;
  documentId?: string;
  studyId?: string;
  // Metadatos clínicos ligeros (resumen/trazabilidad, sin duplicar blobs ni arrays masivos)
  metadata?: {
    documentType?: DocumentType;
    modality?: string;
    diagnosesCodes?: string[];
    authorDoctor?: string;
    institution?: string;
    isPrimaryEvent?: boolean;
    dateInferred?: boolean; // true si la fecha fue derivada de consulta
    hasLaboratory?: boolean;
    hasImaging?: boolean;
    categories?: string[];
  };
}

/**
 * CONTRATO SEMÁNTICO DE FILTRADO PARACLÍNICO (FASE 3.2-A-R2):
 * 
 * En SYNAPSIS, la orden paraclínica física (ORDEN_LAB-001) corresponde a un único documento
 * médico y acto prescriptivo multimodal. Para respetar el modelo fuente sin fragmentar
 * artificialmente el expediente en dos registros ficticios, se emite como un ÚNICO evento de Timeline.
 * 
 * 'LAB_STUDY' no representa exclusividad de laboratorio cuando metadata.hasImaging === true.
 * 'IMAGING_STUDY' se asigna cuando la orden prescribe exclusivamente neuroimagen.
 * 
 * Regla Canónica de Filtrado en UI / Consumidores (Fase 3.2-B):
 * - Filtro Laboratorio: (event.eventType === 'LAB_STUDY' || event.metadata?.hasLaboratory === true)
 * - Filtro Imagenología: (event.eventType === 'IMAGING_STUDY' || event.metadata?.hasImaging === true)
 */
export function matchesParaclinicalFilter(
  event: ClinicalTimelineEvent,
  filter: 'LABORATORY' | 'IMAGING' | 'ALL'
): boolean {
  if (filter === 'ALL') {
    return (
      event.eventType === 'LAB_STUDY' ||
      event.eventType === 'IMAGING_STUDY' ||
      Boolean(event.metadata?.hasLaboratory) ||
      Boolean(event.metadata?.hasImaging)
    );
  }
  if (filter === 'LABORATORY') {
    return event.eventType === 'LAB_STUDY' || Boolean(event.metadata?.hasLaboratory);
  }
  if (filter === 'IMAGING') {
    return event.eventType === 'IMAGING_STUDY' || Boolean(event.metadata?.hasImaging);
  }
  return false;
}

export type DocumentType = 'recipe' | 'report' | 'lab_order' | 'certificate' | 'history';

export type DocType = 
  | 'RECIPES' 
  | 'INFORME' 
  | 'ORDEN_LAB' 
  | 'CONSTANCIA' 
  | 'HISTORIA';

export interface PatientData {
  fullName: string;
  idNumber: string;
  age: string;
  date: string;
  phone: string;
  address?: string;
  guideNumber?: string;
  condition?: 'Paciente' | 'Familiar';
  idType?: 'V' | 'E' | 'P' | string;
  nationalId?: string;
  gender?: 'M' | 'F' | string;
  allergies?: string;
}

export interface PatientInfo {
  fullName: string;
  idType: 'V' | 'E' | 'P';
  nationalId: string;
  age: string;
  gender: 'M' | 'F';
  allergies: string;
  phone?: string;
  email?: string;
}

// ==========================================
// FASE 3: MODELO CLÍNICO 360° & LONGITUDINAL
// ==========================================

export interface ClinicalEpisode {
  id: string;
  tenantId?: string;
  timestamp: string; // ISO 8601
  createdAt?: string; // ISO 8601 — Ingesta técnica
  updatedAt?: string;
  type: 'CONSULTA_INICIAL' | 'CONTROL_POSTOP' | 'EVOLUCION' | 'PROCEDIMIENTO_QUIRURGICO' | 'EMERGENCIA';
  reasonForVisit: string;
  anamnesis: string;
  physicalExam: {
    neurological: string;
    painScaleEva: number; // 0-10
    motorDeficit?: string;
    sensoryDeficit?: string;
    reflexes?: string;
  };
  diagnoses: Array<{
    code?: string; // CIE-10 / CIE-11 (ej: M51.2)
    description: string;
    isPrimary: boolean;
  }>;
  prescriptions: Array<{
    drug: string;
    dose: string;
    frequency: string;
    duration: string;
    status: 'ACTIVE' | 'DISCONTINUED' | 'COMPLETED';
  }>;
  orderedStudies: string[];
  documentIdsIssued: string[];
  audioRecordings?: Array<{
    id: string;
    durationSec: number;
    rawTranscript: string;
    aiExtractionAudit?: any;
  }>;
  authorDoctor: string;
}

export interface ImagingStudyRecord {
  id: string;
  tenantId?: string;
  date: string;
  createdAt?: string; // ISO 8601 — Ingesta técnica
  updatedAt?: string;
  type: 'RMN_LUMBAR' | 'RMN_CERVICAL' | 'RMN_CEREBRAL' | 'TAC_COLUMNA' | 'RX_DINAMICAS' | 'ELECTROMIOGRAFIA' | 'LAB_SANGRE';
  institution?: string;
  reportSummary: string;
  keyFindings: string[];
  attachments: Array<{
    id: string;
    name: string;
    url: string; // Storage URL o IndexedDB cache
    mimeType: string;
    thumbnailUrl?: string;
  }>;
}

export interface Patient360Record {
  id: string;
  tenantId?: string;
  nationalId: string;
  cleanId?: string;
  fullName: string;
  age: string;
  phone: string;
  address: string;
  lastConsultationDate: string;
  lastDiagnosis: string;
  updatedAt?: string;
  createdAt?: string;
  documentStates: {
    recipe: {
      rxLeft: string;
      indicationsRight: string;
      issuedAt?: string;
    };
    informe: {
      motivo: string;
      antecedentes: string;
      enfermedadActual: string;
      examenFisico: string;
      estudiosParaclinicos: string;
      diagnostico: string;
      planConducta: string;
      issuedAt?: string;
    };
    ordenLab: {
      perfilPreoperatorio: string[];
      neuroimagen: string[];
      otrosEstudios: string[];
      otherExams?: string;
      diagnosticoPresuntivo: string;
      issuedAt?: string;
    };
    constancia: {
      attendedDate: string;
      condition: 'Paciente' | 'Familiar';
      needsRest: boolean;
      restDays: string;
      restFrom: string;
      restTo: string;
      idx: string;
      issuedAt?: string;
    };
    historia: {
      motivoConsulta: string;
      enfermedadActual: string;
      antecedentes: string;
      examenNeurologico: string;
      diagnostico: string;
      issuedAt?: string;
    };
  };
  auditLog: Array<{
    timestamp: string;
    action: string;
    note?: string;
    deviceId?: string;
  }>;
  biologicalProfile: {
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
    surgicalHistory: string[];
  };
  episodes: ClinicalEpisode[];
  studies: ImagingStudyRecord[];
  clinicalHistory?: string;
  activeMedications: Array<{
    id: string;
    drugName: string;
    posology: string;
    startDate: string;
    prescribedInEpisodeId: string;
  }>;
  version: number;
  isArchived?: boolean;
  archivedAt?: string;
  // Fase 3.1-R: Estado de Sincronización y Migración
  syncStatus?: 'LOCAL_DRAFT' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'SYNC_CONFLICT' | 'SYNC_ERROR';
  syncError?: string;
  subcollectionsMigrated?: boolean;
  subcollectionsMigratedAt?: string;
}

export type SyncState = 'LOCAL_DRAFT' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'SYNC_CONFLICT' | 'SYNC_ERROR';

export interface MedicationItem {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface StructuredClinicalData {
  diagnosisPrincipal: string;
  secondaryDiagnoses: string[];
  cie10Suggestions?: string[];
  medications: MedicationItem[];
  generalIndications: string[];
  restDays?: number;
  restStartDate?: string;
  labTests?: string[];
  summaryNote: string;
}

export interface ProcessedDocumentResult {
  id: string;
  docNumber: string;
  documentType: DocumentType;
  patient: PatientInfo;
  structuredData: StructuredClinicalData;
  templateName: string;
  googleDriveFileId?: string | null;
  googleDocUrl?: string | null;
  pdfExportUrl: string;
  generatedAt: string;
  doctorName: string;
  doctorRegistration: string;
  degradedMode?: boolean;
}

export interface LogisticsItem {
  id: string;
  sku: string;
  name: string;
  category: 'Biomateriales' | 'Instrumental Quirúrgico' | 'Fármacos' | 'Descartables';
  stock: number;
  unitPriceUsd: number;
}

export interface QuoteLineItem {
  id: string;
  item: LogisticsItem;
  quantity: number;
  discountPct: number;
}

export interface LogisticsQuote {
  id: string;
  quoteNumber: string;
  recipientName: string;
  rif: string;
  doctorReference: string;
  date: string;
  validUntil: string;
  items: QuoteLineItem[];
  taxRate: number;
  observations: string;
}

export type ActiveNavTab = 
  | 'cmi-portal'
  | 'clinical-agenda'
  | 'official-sheet'
  | 'clinic-form' 
  | 'clinic-history' 
  | 'synapsis-quoter' 
  | 'synapsis-inventory'
  | 'settings-templates';

// CORTEX AXIS — AGENDA CLÍNICA (FASE 1)
export * from './types/agenda';

