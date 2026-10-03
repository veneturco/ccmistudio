import { firestorePatientSync } from '../cloud/FirestorePatientSync';
import { ClinicalEpisode, ImagingStudyRecord, Patient360Record } from '../types';
import { clinicalAuditService } from '../audit/ClinicalAuditService';


// =========================================================================
// SYNAPSIS — FASE 3.1: MODELADO CLÍNICO 360° Y PERSISTENCIA LONGITUDINAL
// Dr. Samir Moucharrafie Naime (CCMI / Neurocirugía y Cirugía de Columna)
// =========================================================================

export type { ClinicalEpisode, ImagingStudyRecord, Patient360Record };

export interface PatientRecord {
  id: string;
  nationalId: string; // Clave de índice principal (ej. "V-16.482.903")
  cleanId?: string;
  tenantId?: string;
  fullName: string;
  age: string;
  phone: string;
  address: string;
  idType?: 'V' | 'E' | 'P' | string;
  gender?: 'M' | 'F' | string;
  allergies?: string;
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
  auditLog?: Array<{
    timestamp: string;
    action: string;
    note?: string;
    deviceId?: string;
  }>;
  // Campos del Modelo 360 (opcionales para retrocompatibilidad total)
  biologicalProfile?: {
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
    surgicalHistory: string[];
  };
  episodes?: ClinicalEpisode[];
  studies?: ImagingStudyRecord[];
  activeMedications?: Array<{
    id: string;
    drugName: string;
    posology: string;
    startDate: string;
    prescribedInEpisodeId: string;
  }>;
  version?: number;
  isArchived?: boolean;
  archivedAt?: string;
  // Fase 3.1-R: Estados de sincronización y mitigación de conflictos
  syncStatus?: 'LOCAL_DRAFT' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'SYNC_CONFLICT' | 'SYNC_ERROR';
  syncError?: string;
  subcollectionsMigrated?: boolean;
  subcollectionsMigratedAt?: string;
}

const STORAGE_KEY = 'socs_ccmi_patients_v2';
const ENCRYPTION_KEY = 'ccmi-secure-clinical-key-2026';

function encryptData(data: string): string {
  try {
    const encoded = encodeURIComponent(data);
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
      result += String.fromCharCode(encoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    return 'enc_v2:' + btoa(result);
  } catch {
    return data;
  }
}

function decryptData(data: string): string {
  try {
    if (data.startsWith('enc_v2:')) {
      const raw = atob(data.slice(7));
      let result = '';
      for (let i = 0; i < raw.length; i++) {
        result += String.fromCharCode(raw.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
      }
      return decodeURIComponent(result);
    }
    // Compatibilidad retroactiva con Base64 previo o texto plano
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return data;
    }
  } catch (e) {
    return data;
  }
}

// Fichas clínicas iniciales vacías para instalaciones limpias
const SEED_PATIENTS: PatientRecord[] = [];

/**
 * Convierte e hidrata cualquier PatientRecord o registro parcial al modelo Patient360Record completo.
 */
export function toPatient360Record(record: PatientRecord | Partial<Patient360Record>): Patient360Record {
  const nationalId = record.nationalId || '';
  const cleanId = record.cleanId || nationalId.replace(/[^\d]/g, '');
  const nowIso = new Date().toISOString();

  return {
    id: record.id || `pat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    nationalId,
    cleanId,
    fullName: record.fullName || '',
    age: record.age || '',
    phone: record.phone || '',
    address: record.address || '',
    lastConsultationDate: record.lastConsultationDate || '',
    lastDiagnosis: record.lastDiagnosis || '',
    updatedAt: record.updatedAt || nowIso,
    createdAt: record.createdAt || nowIso,
    documentStates: record.documentStates || {
      recipe: { rxLeft: '', indicationsRight: '' },
      informe: { motivo: '', antecedentes: '', enfermedadActual: '', examenFisico: '', estudiosParaclinicos: '', diagnostico: '', planConducta: '' },
      ordenLab: { perfilPreoperatorio: [], neuroimagen: [], otrosEstudios: [], diagnosticoPresuntivo: '' },
      constancia: { attendedDate: '', condition: 'Paciente', needsRest: false, restDays: '', restFrom: '', restTo: '', idx: '' },
      historia: { motivoConsulta: '', enfermedadActual: '', antecedentes: '', examenNeurologico: '', diagnostico: '' },
    },
    auditLog: Array.isArray(record.auditLog) ? record.auditLog : [],
    biologicalProfile: {
      bloodType: record.biologicalProfile?.bloodType || '',
      allergies: Array.isArray(record.biologicalProfile?.allergies) ? record.biologicalProfile.allergies : [],
      chronicConditions: Array.isArray(record.biologicalProfile?.chronicConditions) ? record.biologicalProfile.chronicConditions : [],
      surgicalHistory: Array.isArray(record.biologicalProfile?.surgicalHistory) ? record.biologicalProfile.surgicalHistory : [],
    },
    episodes: Array.isArray(record.episodes) ? record.episodes : [],
    studies: Array.isArray(record.studies) ? record.studies : [],
    activeMedications: Array.isArray(record.activeMedications) ? record.activeMedications : [],
    version: typeof record.version === 'number' && record.version > 0 ? record.version : 1,
    isArchived: Boolean(record.isArchived),
    archivedAt: record.archivedAt,
    syncStatus: record.syncStatus || 'LOCAL_DRAFT',
    syncError: record.syncError,
    subcollectionsMigrated: Boolean(record.subcollectionsMigrated),
    subcollectionsMigratedAt: record.subcollectionsMigratedAt,
  };
}

/**
 * Obtiene todas las fichas guardadas. Por defecto omite pacientes archivados salvo que se solicite.
 */
export function getAllPatients(options?: { includeArchived?: boolean }): PatientRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, encryptData(JSON.stringify(SEED_PATIENTS)));
      return SEED_PATIENTS;
    }
    const decryptedRaw = decryptData(raw);
    const list: PatientRecord[] = JSON.parse(decryptedRaw);
    if (options?.includeArchived) {
      return list;
    }
    return list.filter((p) => !p.isArchived);
  } catch (err) {
    console.error('Error leyendo pacientes de localStorage:', err);
    return SEED_PATIENTS;
  }
}

/**
 * Obtiene todas las fichas hidratadas al modelo Patient360Record completo.
 */
export function getAllPatients360(options?: { includeArchived?: boolean }): Patient360Record[] {
  return getAllPatients(options).map(toPatient360Record);
}

/**
 * Buscar paciente por Cédula (normalizada).
 */
export function getPatientByCedula(nationalId: string, options?: { includeArchived?: boolean }): PatientRecord | null {
  const cleanQuery = nationalId.replace(/[^\d]/g, '');
  if (!cleanQuery) return null;

  const all = getAllPatients({ includeArchived: options?.includeArchived ?? true });
  const match = all.find((p) => p.nationalId.replace(/[^\d]/g, '') === cleanQuery);
  if (!match) return null;
  if (!options?.includeArchived && match.isArchived) return null;
  return match;
}

/**
 * Buscar paciente 360 por Cédula (normalizada).
 */
export function getPatient360ByCedula(nationalId: string, options?: { includeArchived?: boolean }): Patient360Record | null {
  const pat = getPatientByCedula(nationalId, options);
  return pat ? toPatient360Record(pat) : null;
}

export const getPatientByNationalId = getPatientByCedula;
export const getPatient360ByNationalId = getPatient360ByCedula;

/**
 * Buscar paciente por ID o Cédula.
 */
export function getPatientRecord(idOrNationalId: string): PatientRecord | null {
  if (!idOrNationalId) return null;
  const clean = idOrNationalId.replace(/[^\d]/g, '');
  const all = getAllPatients({ includeArchived: true });
  return all.find((p) => p.id === idOrNationalId || (clean && p.nationalId.replace(/[^\d]/g, '') === clean) || p.nationalId === idOrNationalId) || null;
}

/**
 * Guardar o actualizar ficha de paciente (preserva modelo 360 e incrementa version de auditoría).
 */
export function savePatientRecord(record: PatientRecord | Patient360Record): void {
  try {
    const rawList = getAllPatients({ includeArchived: true });
    const cleanId = record.nationalId.replace(/[^\d]/g, '');
    const index = rawList.findIndex((p) => p.nationalId.replace(/[^\d]/g, '') === cleanId);

    const now = new Date();
    const timeString = `${now.toLocaleDateString('es-VE')} ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`;

    const prevRecord = index >= 0 ? rawList[index] : null;
    let currentVersion = 1;
    let finalAuditLog: Array<{ timestamp: string; action: string; note?: string; deviceId?: string }> = [];

    if (prevRecord) {
      currentVersion = (prevRecord.version || 1) + 1;
      const actionText = `Actualización clínica v${currentVersion}`;
      const newAuditEntry = {
        timestamp: timeString,
        action: actionText,
        note: (record.auditLog && record.auditLog[0]?.note) || undefined,
      };
      // Si el registro entrante ya contenía una entrada específica agregada inmediatamente antes de guardar
      const incomingNote = record.auditLog && record.auditLog[0]?.action !== actionText ? record.auditLog[0] : null;
      if (incomingNote && !prevRecord.auditLog?.some(a => a.timestamp === incomingNote.timestamp && a.action === incomingNote.action)) {
        finalAuditLog = [incomingNote, ...(prevRecord.auditLog || [])];
      } else {
        finalAuditLog = [newAuditEntry, ...(prevRecord.auditLog || [])];
      }
    } else {
      currentVersion = record.version && record.version > 0 ? record.version : 1;
      finalAuditLog = record.auditLog && record.auditLog.length > 0
        ? record.auditLog
        : [{ timestamp: timeString, action: 'Alta y registro de nuevo paciente (Fase 3.1)' }];
    }

    // Hidratar registro como 360 en estado LOCAL_DRAFT / SYNC_PENDING
    const hydrated360 = toPatient360Record({
      ...prevRecord,
      ...record,
      cleanId,
      version: currentVersion,
      syncStatus: 'SYNC_PENDING',
      syncError: undefined,
      updatedAt: now.toISOString(),
      createdAt: prevRecord?.createdAt || record.createdAt || now.toISOString(),
      auditLog: finalAuditLog,
    });

    if (index >= 0) {
      rawList[index] = hydrated360;
    } else {
      rawList.unshift(hydrated360);
    }

    localStorage.setItem(STORAGE_KEY, encryptData(JSON.stringify(rawList)));

    // Registro en auditoría clínica centralizada (Bloque H)
    try {
      clinicalAuditService.recordEvent({
        action: prevRecord ? 'PATIENT_RECORD_UPDATED' : 'PATIENT_RECORD_CREATED',
        category: 'CLINICAL_ACTION',
        sourceModule: 'PATIENT360',
        entityType: 'PatientRecord',
        entityId: hydrated360.id,
        patientId: cleanId,
        previousVersion: prevRecord?.version,
        resultingVersion: currentVersion,
        metadata: {
          details: prevRecord ? `Actualización clínica v${currentVersion}` : 'Alta y registro de nuevo paciente',
        },
      });
    } catch (auditErr) {
      console.warn('[SYNAPSIS AUDIT] Error no bloqueante registrando auditoría de paciente:', auditErr);
    }

    // Sincronización transaccional con Firestore
    firestorePatientSync.syncPatientWithTransaction(hydrated360).catch((syncErr) => {
      console.warn('[SYNAPSIS CLOUD] Guardado local preservado. Sincronización pendiente/error:', syncErr);
    });
  } catch (err) {
    console.error('Error guardando paciente en localStorage:', err);
  }
}

/**
 * Actualiza el estado de sincronización (Fase 3.1-R: LOCAL_DRAFT, SYNC_PENDING, SYNCING, SYNCED, SYNC_CONFLICT, SYNC_ERROR)
 * sin alterar la versión clínica del registro.
 */
export function updatePatientSyncStatus(
  cleanId: string,
  syncStatus: 'LOCAL_DRAFT' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'SYNC_CONFLICT' | 'SYNC_ERROR',
  options?: {
    syncError?: string;
    version?: number;
    subcollectionsMigrated?: boolean;
    subcollectionsMigratedAt?: string;
  }
): void {
  try {
    const rawList = getAllPatients({ includeArchived: true });
    const index = rawList.findIndex((p) => p.nationalId.replace(/[^\d]/g, '') === cleanId);
    if (index < 0) return;

    const patient = rawList[index];
    patient.syncStatus = syncStatus;
    if (options?.syncError !== undefined) patient.syncError = options.syncError;
    if (options?.version !== undefined) patient.version = options.version;
    if (options?.subcollectionsMigrated !== undefined) patient.subcollectionsMigrated = options.subcollectionsMigrated;
    if (options?.subcollectionsMigratedAt !== undefined) patient.subcollectionsMigratedAt = options.subcollectionsMigratedAt;

    rawList[index] = patient;
    localStorage.setItem(STORAGE_KEY, encryptData(JSON.stringify(rawList)));
  } catch (err) {
    console.error(`Error actualizando syncStatus para paciente ${cleanId}:`, err);
  }
}

/**
 * Guardar directamente una ficha Patient360Record.
 */
export function savePatient360Record(record: Patient360Record): void {
  savePatientRecord(record);
}

/**
 * Agrega un nuevo episodio clínico al paciente y actualiza su historial longitudinal.
 */
export function addClinicalEpisode(
  nationalId: string,
  episode: Omit<ClinicalEpisode, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): Patient360Record | null {
  const patient = getPatient360ByCedula(nationalId, { includeArchived: true });
  if (!patient) return null;

  const now = new Date();
  const newEpisode: ClinicalEpisode = {
    id: episode.id || `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: episode.timestamp || now.toISOString(),
    type: episode.type,
    reasonForVisit: episode.reasonForVisit,
    anamnesis: episode.anamnesis,
    physicalExam: episode.physicalExam,
    diagnoses: episode.diagnoses || [],
    prescriptions: episode.prescriptions || [],
    orderedStudies: episode.orderedStudies || [],
    documentIdsIssued: episode.documentIdsIssued || [],
    audioRecordings: episode.audioRecordings || [],
    authorDoctor: episode.authorDoctor || 'Dr. Samir Moucharrafie',
  };

  // Actualizar diagnósticos y fecha de última consulta si procede
  const primaryDx = newEpisode.diagnoses.find((d) => d.isPrimary)?.description;
  if (primaryDx) {
    patient.lastDiagnosis = primaryDx;
  }
  patient.lastConsultationDate = new Date(newEpisode.timestamp).toLocaleDateString('es-VE');

  // Insertar al inicio de la cronología de episodios
  patient.episodes = [newEpisode, ...patient.episodes];

  // Registrar en bitácora
  patient.auditLog = [
    {
      timestamp: `${now.toLocaleDateString('es-VE')} ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`,
      action: `Nuevo episodio clínico registrado: ${newEpisode.type}`,
      note: primaryDx || newEpisode.reasonForVisit,
    },
    ...patient.auditLog,
  ];

  savePatient360Record(patient);
  return getPatient360ByCedula(nationalId, { includeArchived: true });
}

/**
 * Agrega un estudio de imagen o paraclínico al expediente del paciente.
 */
export function addImagingStudy(
  nationalId: string,
  study: Omit<ImagingStudyRecord, 'id'> & { id?: string }
): Patient360Record | null {
  const patient = getPatient360ByCedula(nationalId, { includeArchived: true });
  if (!patient) return null;

  const now = new Date();
  const newStudy: ImagingStudyRecord = {
    id: study.id || `study_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: study.date || now.toISOString().split('T')[0],
    type: study.type,
    institution: study.institution || 'CcMi / Centro de Especialidades Médicas',
    reportSummary: study.reportSummary,
    keyFindings: study.keyFindings || [],
    attachments: study.attachments || [],
  };

  patient.studies = [newStudy, ...patient.studies];

  patient.auditLog = [
    {
      timestamp: `${now.toLocaleDateString('es-VE')} ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`,
      action: `Estudio radiológico/paraclínico añadido: ${newStudy.type}`,
      note: newStudy.reportSummary.substring(0, 80),
    },
    ...patient.auditLog,
  ];

  savePatient360Record(patient);
  return getPatient360ByCedula(nationalId, { includeArchived: true });
}

/**
 * Archivar ficha de paciente (Borrado clínico seguro no destructivo).
 */
export function archivePatientRecord(nationalId: string, note?: string): boolean {
  try {
    const rawList = getAllPatients({ includeArchived: true });
    const cleanId = nationalId.replace(/[^\d]/g, '');
    const index = rawList.findIndex((p) => p.nationalId.replace(/[^\d]/g, '') === cleanId);
    if (index < 0) return false;

    const now = new Date();
    const timeString = `${now.toLocaleDateString('es-VE')} ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`;

    const target = rawList[index];
    target.isArchived = true;
    target.archivedAt = now.toISOString();
    target.updatedAt = now.toISOString();
    target.version = (target.version || 1) + 1;
    target.auditLog = [
      {
        timestamp: timeString,
        action: 'Ficha clínica archivada (borrado no destructivo seguro)',
        note: note || 'Archivado por solicitud clínica',
      },
      ...target.auditLog,
    ];

    rawList[index] = target;
    localStorage.setItem(STORAGE_KEY, encryptData(JSON.stringify(rawList)));

    // Sincronizar archivado con Firestore
    firestorePatientSync.archivePatient(nationalId, note).catch((err) => {
      console.warn('[SYNAPSIS SYNC] Error sincronizando archivado en nube:', err);
    });

    return true;
  } catch (err) {
    console.error('Error archivando paciente:', err);
    return false;
  }
}

/**
 * Eliminar ficha de paciente.
 * NOTA DE SEGURIDAD FASE 3: Se convierte automáticamente en borrado NO destructivo (archivado clínico).
 */
export function deletePatientRecord(nationalId: string): boolean {
  return archivePatientRecord(nationalId, 'Solicitud de eliminación protegida (archivado clínico)');
}

/**
 * Borrado destructivo forzado (Solo para mantenimiento administrativo explícito).
 */
export function hardDeletePatientRecord(nationalId: string): boolean {
  try {
    const cleanId = nationalId.replace(/[^\d]/g, '');
    const all = getAllPatients({ includeArchived: true });
    const filtered = all.filter((p) => p.nationalId.replace(/[^\d]/g, '') !== cleanId);
    localStorage.setItem(STORAGE_KEY, encryptData(JSON.stringify(filtered)));

    // Sincronizar eliminación definitiva con Firestore
    firestorePatientSync.deletePatient(nationalId, true).catch((syncErr) => {
      console.warn('[SYNAPSIS CLOUD] Eliminación permanente pendiente:', syncErr);
    });
    return true;
  } catch (err) {
    console.error('Error en borrado permanente de paciente:', err);
    return false;
  }
}
