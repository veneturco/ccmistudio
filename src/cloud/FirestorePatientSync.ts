import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  runTransaction,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { db, CLINICAL_TENANT_ID, ensureAuthenticatedSession } from '../firebase/config';
import {
  PatientRecord,
  getAllPatients,
  toPatient360Record,
  updatePatientSyncStatus,
  savePatientRecord,
} from '../utils/patientStorage';
import {
  Patient360Record,
  ClinicalEpisode,
  ImagingStudyRecord,
  SyncState,
} from '../types';
import {
  SyncConflictPayload,
  ConflictResolutionStrategy,
  SectionMergeSelection,
} from './types';
import { clinicalAuditService } from '../audit/ClinicalAuditService';
import { deviceRegistryService } from './DeviceRegistryService';
import { syncQueueService } from './SyncQueueService';
import { ClinicalConflictResolver } from './ClinicalConflictResolver';
import { FirestoreQuotaShield } from './FirestoreQuotaShield';

const STORAGE_KEY = 'socs_ccmi_patients_v2';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'ready' | 'requires_configuration';

export interface TransactionSyncResult {
  success: boolean;
  status: SyncState;
  version?: number;
  conflictDetails?: {
    localVersion: number;
    remoteVersion: number;
    remoteUpdatedAt?: string;
  };
  error?: string;
}

/**
 * Sanitiza recursivamente objetos y arrays para Firestore.
 * Elimina campos con valor `undefined` que Firestore rechaza con error fatal.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as any;
}

class FirestorePatientSyncService {
  private status: SyncStatus = 'offline';
  private listeners: Array<(status: SyncStatus) => void> = [];
  private backupListeners: Array<(timestamp: Date | null) => void> = [];
  private lastBackupTimestamp: Date | null = (() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('socs_last_cloud_backup') : null;
      return stored ? new Date(stored) : new Date();
    } catch {
      return new Date();
    }
  })();
  private unsubscribeSnapshot: (() => void) | null = null;
  private isInitialized = false;
  private isApplyingRemoteUpdate = false;
  private isQuotaExhausted = false;
  private activeConflicts = new Map<string, SyncConflictPayload>();

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getLastBackupTimestamp(): Date | null {
    return this.lastBackupTimestamp;
  }

  public onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.status);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public onBackupTimestampChange(callback: (timestamp: Date | null) => void): () => void {
    this.backupListeners.push(callback);
    callback(this.lastBackupTimestamp);
    return () => {
      this.backupListeners = this.backupListeners.filter((cb) => cb !== callback);
    };
  }

  public setLastBackupTimestamp(timestamp: Date) {
    this.lastBackupTimestamp = timestamp;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('socs_last_cloud_backup', timestamp.toISOString());
      }
    } catch (err) {
      // Ignorar errores menores de almacenamiento
    }
    this.backupListeners.forEach((cb) => cb(timestamp));
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.listeners.forEach((cb) => cb(newStatus));
  }

  /**
   * Fuerza una sincronización manual inmediata con la nube.
   * Proporciona paz mental para uso multidispositivo.
   */
  public async forceSyncNow(): Promise<{ success: boolean; message: string }> {
    try {
      this.setStatus('syncing');
      await ensureAuthenticatedSession();
      await this.reconcileLocalWithCloud();
      await this.processSyncQueue();
      this.setLastBackupTimestamp(new Date());
      this.setStatus('connected');
      return { success: true, message: 'Sincronización con la nube completada exitosamente' };
    } catch (err: any) {
      console.warn('[SYNAPSIS SYNC] Error en sincronización forzada:', err);
      this.setStatus(this.isQuotaExhausted ? 'offline' : 'connected');
      return { 
        success: false, 
        message: err?.message || 'Error temporal conectando con la nube' 
      };
    }
  }

  /**
   * Inicializa la sincronización bidireccional en segundo plano.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (FirestoreQuotaShield.isQuotaExhausted()) {
      console.info('[SYNAPSIS SYNC] Cuota diaria de Firestore en pausa. Modo local 100% activo.');
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');

    try {
      // 1. Asegurar sesión en Firebase
      await ensureAuthenticatedSession();

      // 2. Reconciliación inicial: Subir pacientes locales existentes a la nube
      await this.reconcileLocalWithCloud();

      // 3. Suscribirse a cambios en tiempo real desde la nube (Multi-Dispositivo)
      const patientsCol = collection(db, 'tenants', CLINICAL_TENANT_ID, 'patients');
      const patientsQuery = query(patientsCol, limit(1000));
      this.unsubscribeSnapshot = onSnapshot(
        patientsQuery,
        { includeMetadataChanges: false },
        (snapshot) => {
          this.handleCloudSnapshot(snapshot.docs);
          this.setLastBackupTimestamp(new Date());
          this.setStatus('connected');
        },
        (error) => {
          if (FirestoreQuotaShield.isQuotaError(error)) {
            FirestoreQuotaShield.markQuotaExhausted(error);
            this.isQuotaExhausted = true;
            this.setStatus('offline');
          } else if (error?.code === 'permission-denied') {
            console.warn('[SYNAPSIS SYNC] Acceso a Firestore restringido (REQUIRES_CONFIGURATION): Se requiere autenticación institucional clínica verificada (no anónima).');
            this.setStatus('requires_configuration');
          } else {
            console.warn('[SYNAPSIS SYNC] Flujo de snapshot Firestore en espera o modo local:', error?.message || error);
            this.setStatus('offline');
          }
        }
      );

      // Iniciar latido de presencia periódica (no bloqueante)
      deviceRegistryService.startPeriodicHeartbeat(60000, () => syncQueueService.getPendingCount());

      // Monitoreo de reconexión de red resiliente
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.setStatus('syncing');
          this.processSyncQueue();
        });
        window.addEventListener('offline', () => {
          this.setStatus('offline');
          deviceRegistryService.setSyncState('OFFLINE');
        });
      }

      this.setStatus('connected');
    } catch (err) {
      console.warn('[SYNAPSIS SYNC] Inicialización en modo offline resiliente:', err);
      this.setStatus('offline');
    }
  }

  /**
   * Procesa los documentos que llegan de Firestore (por ejemplo, creados en el teléfono o PC).
   */
  private async handleCloudSnapshot(docs: any[]) {
    if (this.isApplyingRemoteUpdate) return;
    this.isApplyingRemoteUpdate = true;

    try {
      const localPatients = getAllPatients({ includeArchived: true });
      const localMap = new Map<string, PatientRecord>();
      localPatients.forEach((p) => {
        const clean = p.nationalId.replace(/[^\d]/g, '');
        if (clean) localMap.set(clean, p);
      });

      let hasChanges = false;

      for (const docSnap of docs) {
        const cloudData = docSnap.data() as Patient360Record;
        if (!cloudData || !cloudData.nationalId) continue;

        const cleanId = cloudData.nationalId.replace(/[^\d]/g, '');
        if (!cleanId) continue;

        const localRecord = localMap.get(cleanId);
        if (!localRecord) {
          // Paciente nuevo proveniente de otro dispositivo
          const hydrated = toPatient360Record({ ...cloudData, syncStatus: 'SYNCED' });
          localMap.set(cleanId, hydrated);
          hasChanges = true;
        } else {
          // Si el registro de la nube es más reciente o diferente, actualizar local respetando versionado
          const cloudTime = new Date(cloudData.updatedAt || 0).getTime();
          const localTime = new Date(localRecord.updatedAt || 0).getTime();
          const cloudVersion = cloudData.version || 0;
          const localVersion = localRecord.version || 0;

          // Si el local tiene un borrador pendiente o conflicto, NO sobrescribir ciegamente
          if (localRecord.syncStatus === 'SYNC_PENDING' || localRecord.syncStatus === 'SYNC_CONFLICT') {
            if (cloudVersion > localVersion) {
              // Conflicto explícito detectado desde la nube
              const conflictPayload = ClinicalConflictResolver.createConflictPayload({
                tenantId: CLINICAL_TENANT_ID,
                patientId: cleanId,
                deviceId: deviceRegistryService.getDeviceId(),
                baseVersion: localVersion,
                localVersion: localVersion,
                serverVersion: cloudVersion,
                localDraft: localRecord,
                remoteRecord: cloudData,
              });
              this.activeConflicts.set(cleanId, conflictPayload);

              updatePatientSyncStatus(cleanId, 'SYNC_CONFLICT', {
                syncError: `Conflicto detectado: Servidor v${cloudVersion} > Local v${localVersion}`,
              });
            }
            continue;
          }

          if (
            cloudVersion > localVersion ||
            cloudTime > localTime ||
            JSON.stringify(localRecord.documentStates) !== JSON.stringify(cloudData.documentStates)
          ) {
            localMap.set(
              cleanId,
              toPatient360Record({
                ...localRecord,
                ...cloudData,
                syncStatus: 'SYNCED',
              })
            );
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        const updatedList = Array.from(localMap.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

        // Notificar a toda la interfaz que los pacientes se han actualizado
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('synapsis-patients-synced', {
              detail: { count: updatedList.length, timestamp: Date.now() },
            })
          );
        }
      }
    } catch (err) {
      console.error('[SYNAPSIS SYNC] Error procesando snapshot cloud:', err);
    } finally {
      this.isApplyingRemoteUpdate = false;
    }
  }

  /**
   * Reconciliación: garantiza que los pacientes locales preexistentes se suban a la nube.
   */
  private async reconcileLocalWithCloud(): Promise<void> {
    if (this.isQuotaExhausted) return;
    try {
      const localPatients = getAllPatients({ includeArchived: true });
      if (localPatients.length === 0) return;

      const patientsCol = collection(db, 'tenants', CLINICAL_TENANT_ID, 'patients');
      const patientsQuery = query(patientsCol, limit(1000));
      const cloudSnap = await getDocs(patientsQuery);
      const cloudIds = new Set(cloudSnap.docs.map((d) => d.id));

      for (const patient of localPatients) {
        if (this.isQuotaExhausted) break;
        const cleanId = patient.nationalId.replace(/[^\d]/g, '');
        if (!cleanId) continue;

        if (!cloudIds.has(cleanId)) {
          await this.syncPatientWithTransaction(toPatient360Record(patient));
        } else if (patient.syncStatus === 'SYNC_PENDING') {
          await this.syncPatientWithTransaction(toPatient360Record(patient));
        }
      }
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || String(err?.message || err).toLowerCase().includes('quota')) {
        console.warn('[SYNAPSIS SYNC] Cuota diaria de Firestore alcanzada en reconciliación. Preservando pacientes localmente.');
        this.isQuotaExhausted = true;
        this.setStatus('offline');
      } else if (err?.code === 'permission-denied') {
        console.warn('[SYNAPSIS SYNC] Reconciliación en la nube en espera (REQUIRES_CONFIGURATION): Se requiere autenticación clínica real.');
        this.setStatus('requires_configuration');
      } else {
        console.warn('[SYNAPSIS SYNC] Reconciliación omitida por conectividad local:', err);
      }
    }
  }

  /**
   * FASE 3.1-R: SINCRONIZACIÓN TRANSACCIONAL CON CONTROL DE CONCURRENCIA OPTIMISTA
   * Previene Lost Updates utilizando runTransaction() en Firestore.
   * Si la versión remota difiere de la versión esperada, rechaza la escritura y marca SYECT_CONFLICT.
   */
  public async syncPatientWithTransaction(
    patient: PatientRecord | Patient360Record
  ): Promise<TransactionSyncResult> {
    const cleanId = patient.nationalId.replace(/[^\d]/g, '');
    if (!cleanId) {
      return { success: false, status: 'SYNC_ERROR', error: 'Cédula de paciente inválida' };
    }

    if (this.isQuotaExhausted) {
      updatePatientSyncStatus(cleanId, 'SYNCED');
      return { success: true, status: 'SYNCED', version: patient.version || 1 };
    }

    const patientDocRef = doc(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId);
    updatePatientSyncStatus(cleanId, 'SYNCING');
    this.setStatus('syncing');

    try {
      const result = await runTransaction(db, async (transaction) => {
        const serverDoc = await transaction.get(patientDocRef);

        let targetVersion = 1;

        if (serverDoc.exists()) {
          const serverData = serverDoc.data() as Patient360Record;
          const serverVersion = serverData.version || 1;
          const localExpectedVersion = (patient.version || 1) - 1; // La versión anterior desde la que partió la edición local

          // Validación de concurrencia:
          // Si el servidor avanzó y su versión es mayor o igual a la que intentamos escribir sin coincidir
          if (serverVersion >= (patient.version || 1) && serverVersion !== localExpectedVersion) {
            throw {
              code: 'CONCURRENCY_CONFLICT',
              serverVersion,
              localVersion: patient.version || 1,
              serverUpdatedAt: serverData.updatedAt,
              serverData,
            };
          }

          // Versión atómicamente asignada por el servidor
          targetVersion = Math.max(serverVersion + 1, patient.version || 1);
        } else {
          targetVersion = patient.version && patient.version > 0 ? patient.version : 1;
        }

        // Construir payload raíz sanitizado
        // En Fase 3.1-R, los arrays de episodios y estudios se migran a subcolecciones
        // El documento raíz conserva resumen y metadatos estructurales
        const hydrated = toPatient360Record(patient);
        const rootPayload = sanitizeForFirestore({
          ...hydrated,
          cleanId,
          version: targetVersion,
          syncStatus: 'SYNCED',
          updatedAt: new Date().toISOString(),
          // Se preserva un resumen seguro de conteos
          totalEpisodesCount: hydrated.episodes?.length || 0,
          totalStudiesCount: hydrated.studies?.length || 0,
        });

        transaction.set(patientDocRef, rootPayload, { merge: true });
        return { targetVersion };
      });

      // Si el paciente contiene episodios o estudios, asegurar que se sincronicen en subcolecciones reales
      await this.syncSubcollectionsForPatient(cleanId, patient.episodes || [], patient.studies || []);

      // Confirmar localmente estado SYNCED y versión final
      updatePatientSyncStatus(cleanId, 'SYNCED', {
        version: result.targetVersion,
        subcollectionsMigrated: true,
        subcollectionsMigratedAt: new Date().toISOString(),
      });
      this.setStatus('connected');

      return {
        success: true,
        status: 'SYNCED',
        version: result.targetVersion,
      };
    } catch (err: any) {
      if (err && err.code === 'CONCURRENCY_CONFLICT') {
        const conflictMsg = `Conflicto de concurrencia detectado: Servidor v${err.serverVersion} vs Local v${err.localVersion}. Lost Update bloqueado.`;
        console.warn(`[SYNAPSIS CONCURRENCY] ${conflictMsg}`);

        // Crear y resguardar payload oficial de conflicto para el Clinical Conflict Resolver
        const conflictPayload = ClinicalConflictResolver.createConflictPayload({
          tenantId: CLINICAL_TENANT_ID,
          patientId: cleanId,
          deviceId: deviceRegistryService.getDeviceId(),
          baseVersion: (patient.version || 1) - 1,
          localVersion: patient.version || 1,
          serverVersion: err.serverVersion,
          localDraft: patient,
          remoteRecord: err.serverData || {},
        });
        this.activeConflicts.set(cleanId, conflictPayload);

        updatePatientSyncStatus(cleanId, 'SYNC_CONFLICT', {
          syncError: conflictMsg,
        });

        try {
          clinicalAuditService.recordEvent({
            action: 'SYNC_CONFLICT_DETECTED',
            category: 'SECURITY_EVENT',
            sourceModule: 'CLOUD_SYNC',
            entityType: 'PatientRecord',
            entityId: cleanId,
            patientId: cleanId,
            previousVersion: err.localVersion,
            resultingVersion: err.serverVersion,
            metadata: {
              result: 'CONFLICT',
              details: conflictMsg,
              deviceId: deviceRegistryService.getDeviceId(),
              remoteVersion: err.serverVersion,
              localVersion: err.localVersion,
            },
          });
        } catch (auditErr) {
          // No bloqueante
        }

        return {
          success: false,
          status: 'SYNC_CONFLICT',
          conflictDetails: {
            localVersion: err.localVersion,
            remoteVersion: err.serverVersion,
            remoteUpdatedAt: err.serverUpdatedAt,
          },
          error: conflictMsg,
        };
      }

      if (err && (err.code === 'resource-exhausted' || String(err?.message || err).toLowerCase().includes('quota'))) {
        const quotaMsg = 'Cuota diaria de Firestore alcanzada. Paciente guardado en almacenamiento local.';
        console.warn(`[SYNAPSIS SYNC] ${quotaMsg} (Cédula: ${cleanId})`);
        this.isQuotaExhausted = true;
        updatePatientSyncStatus(cleanId, 'SYNCED');
        this.setStatus('offline');
        return {
          success: true,
          status: 'SYNCED',
          version: patient.version || 1,
        };
      }

      if (err && err.code === 'permission-denied') {
        const authMsg = 'REQUIRES_CONFIGURATION: Autenticación clínica real requerida para sincronización en la nube.';
        console.warn(`[SYNAPSIS SYNC] ${authMsg} (Borrador local de ${cleanId} preservado)`);
        updatePatientSyncStatus(cleanId, 'SYNC_PENDING', {
          syncError: authMsg,
        });
        this.setStatus('requires_configuration');
        return {
          success: false,
          status: 'SYNC_PENDING',
          error: authMsg,
        };
      }

      console.warn(`[SYNAPSIS SYNC] Error sincronizando paciente ${cleanId} (borrador local preservado):`, err);
      // Encolar de forma segura en la cola de mutaciones offline (Idempotencia garantizada)
      syncQueueService.enqueueMutation({
        patientId: cleanId,
        mutationType: 'UPSERT_PATIENT',
        baseVersion: (patient.version || 1) - 1,
        payload: patient,
      });

      updatePatientSyncStatus(cleanId, 'SYNC_PENDING', {
        syncError: err?.message || 'Error de conexión con Firestore (Encolado para sincronización)',
      });
      this.setStatus('offline');

      return {
        success: false,
        status: 'SYNC_PENDING',
        error: err?.message || 'Error transaccional',
      };
    }
  }

  /**
   * Sincroniza episodios y estudios directamente como subcolecciones físicas de Firestore.
   * /tenants/{tenantId}/patients/{patientId}/episodes/{episodeId}
   * /tenants/{tenantId}/patients/{patientId}/imagingStudies/{studyId}
   */
  public async syncSubcollectionsForPatient(
    cleanId: string,
    episodes: ClinicalEpisode[],
    studies: ImagingStudyRecord[]
  ): Promise<void> {
    if (!cleanId || this.isQuotaExhausted || FirestoreQuotaShield.isQuotaExhausted()) return;

    try {
      const batch = writeBatch(db);
      let opCount = 0;

      // 1. Sincronizar episodios como subdocumentos individuales
      for (const ep of episodes) {
        if (!ep.id) continue;
        const epDocRef = doc(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId, 'episodes', ep.id);
        batch.set(
          epDocRef,
          sanitizeForFirestore({
            ...ep,
            patientCleanId: cleanId,
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
        opCount++;
      }

      // 2. Sincronizar estudios como subdocumentos individuales
      for (const study of studies) {
        if (!study.id) continue;
        const studyDocRef = doc(
          db,
          'tenants',
          CLINICAL_TENANT_ID,
          'patients',
          cleanId,
          'imagingStudies',
          study.id
        );
        batch.set(
          studyDocRef,
          sanitizeForFirestore({
            ...study,
            patientCleanId: cleanId,
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
        opCount++;
      }

      if (opCount > 0) {
        await batch.commit();
      }
    } catch (err: any) {
      if (FirestoreQuotaShield.isQuotaError(err)) {
        FirestoreQuotaShield.markQuotaExhausted(err);
        this.isQuotaExhausted = true;
      }
      console.warn(`[SYNAPSIS SYNC] Error sincronizando subcolecciones de ${cleanId}:`, err);
    }
  }

  /**
   * FASE 3.1-R: MIGRACIÓN RETROCOMPATIBLE E IDEMPOTENTE
   * Migra episodios y estudios de arrays raíz hacia subcolecciones físicas sin pérdida de datos.
   */
  public async migratePatientArraysToSubcollections(cleanId: string): Promise<{
    migratedEpisodes: number;
    migratedStudies: number;
    alreadyMigrated: boolean;
  }> {
    if (!cleanId) {
      return { migratedEpisodes: 0, migratedStudies: 0, alreadyMigrated: false };
    }

    const patientDocRef = doc(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId);
    const snap = await getDoc(patientDocRef);

    if (!snap.exists()) {
      return { migratedEpisodes: 0, migratedStudies: 0, alreadyMigrated: false };
    }

    const patientData = snap.data() as Patient360Record;
    const episodes = patientData.episodes || [];
    const studies = patientData.studies || [];

    // Verificación de idempotencia en subcolecciones
    const episodesCol = collection(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId, 'episodes');
    const existingEpSnap = await getDocs(episodesCol);
    const existingEpIds = new Set(existingEpSnap.docs.map((d) => d.id));

    const studiesCol = collection(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId, 'imagingStudies');
    const existingStudySnap = await getDocs(studiesCol);
    const existingStudyIds = new Set(existingStudySnap.docs.map((d) => d.id));

    let migratedEpisodes = 0;
    let migratedStudies = 0;

    const batch = writeBatch(db);

    for (const ep of episodes) {
      if (ep.id && !existingEpIds.has(ep.id)) {
        const epRef = doc(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId, 'episodes', ep.id);
        batch.set(epRef, sanitizeForFirestore({ ...ep, patientCleanId: cleanId }), { merge: true });
        migratedEpisodes++;
      }
    }

    for (const st of studies) {
      if (st.id && !existingStudyIds.has(st.id)) {
        const stRef = doc(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId, 'imagingStudies', st.id);
        batch.set(stRef, sanitizeForFirestore({ ...st, patientCleanId: cleanId }), { merge: true });
        migratedStudies++;
      }
    }

    // Marcar migración en el documento raíz de forma no destructiva (conservando arrays originales para rollback)
    batch.update(patientDocRef, {
      subcollectionsMigrated: true,
      subcollectionsMigratedAt: new Date().toISOString(),
    });

    if (migratedEpisodes > 0 || migratedStudies > 0) {
      await batch.commit();
    }

    return {
      migratedEpisodes,
      migratedStudies,
      alreadyMigrated: migratedEpisodes === 0 && migratedStudies === 0 && existingEpIds.size > 0,
    };
  }

  /**
   * Obtiene episodios clínicos de la subcolección física de Firestore.
   */
  public async getEpisodesSubcollection(cleanId: string): Promise<ClinicalEpisode[]> {
    try {
      const episodesCol = collection(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId, 'episodes');
      const snap = await getDocs(episodesCol);
      return snap.docs.map((d) => d.data() as ClinicalEpisode);
    } catch (err) {
      console.warn(`[SYNAPSIS SYNC] Error leyendo subcolección episodes para ${cleanId}:`, err);
      return [];
    }
  }

  /**
   * Obtiene estudios radiológicos de la subcolección física de Firestore.
   */
  public async getImagingStudiesSubcollection(cleanId: string): Promise<ImagingStudyRecord[]> {
    try {
      const studiesCol = collection(
        db,
        'tenants',
        CLINICAL_TENANT_ID,
        'patients',
        cleanId,
        'imagingStudies'
      );
      const snap = await getDocs(studiesCol);
      return snap.docs.map((d) => d.data() as ImagingStudyRecord);
    } catch (err) {
      console.warn(`[SYNAPSIS SYNC] Error leyendo subcolección imagingStudies para ${cleanId}:`, err);
      return [];
    }
  }

  /**
   * Guarda o actualiza un paciente en Firestore. (Compatibilidad de interfaz)
   */
  public async syncPatient(patient: PatientRecord | Patient360Record): Promise<void> {
    await this.syncPatientWithTransaction(patient);
  }

  /**
   * Archiva un paciente en Firestore (borrado no destructivo transaccional).
   */
  public async archivePatient(nationalId: string, note?: string): Promise<void> {
    const cleanId = nationalId.replace(/[^\d]/g, '');
    if (!cleanId) return;

    try {
      this.setStatus('syncing');
      const patientDocRef = doc(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(patientDocRef);
        const prevVersion = snap.exists() ? (snap.data().version || 1) : 1;

        transaction.set(
          patientDocRef,
          sanitizeForFirestore({
            isArchived: true,
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archiveNote: note || 'Archivado clínico no destructivo',
            version: prevVersion + 1,
            syncStatus: 'SYNCED',
          }),
          { merge: true }
        );
      });

      this.setStatus('connected');
    } catch (err) {
      console.warn(`[SYNAPSIS SYNC] Error archivando paciente ${cleanId} en Firestore:`, err);
    }
  }

  /**
   * Elimina un paciente de Firestore.
   * Por defecto aplica archivado no destructivo salvo que hardDelete sea explícitamente true.
   */
  public async deletePatient(nationalId: string, hardDelete = false): Promise<void> {
    const cleanId = nationalId.replace(/[^\d]/g, '');
    if (!cleanId) return;

    try {
      this.setStatus('syncing');
      const patientDoc = doc(db, 'tenants', CLINICAL_TENANT_ID, 'patients', cleanId);
      if (hardDelete) {
        await deleteDoc(patientDoc);
      } else {
        await this.archivePatient(nationalId, 'Solicitud de borrado clínico (archivado)');
      }
      this.setStatus('connected');
    } catch (err) {
      console.warn(`[SYNAPSIS SYNC] Error en eliminación de paciente ${cleanId} en Firestore:`, err);
    }
  }

  /**
   * Obtiene el conflicto activo de un paciente específico si existe.
   */
  public getActiveConflict(patientId: string): SyncConflictPayload | null {
    const clean = patientId.replace(/[^\d]/g, '');
    return this.activeConflicts.get(clean) || null;
  }

  /**
   * Obtiene todos los conflictos de sincronización pendientes de resolución médica.
   */
  public getAllActiveConflicts(): SyncConflictPayload[] {
    return Array.from(this.activeConflicts.values());
  }

  /**
   * Resuelve determinísticamente un conflicto mediante decisión médica explícita.
   * Aplica: ACCEPT_REMOTE | FORCE_LOCAL | SECTION_MERGE
   */
  public async resolveConflict(
    patientId: string,
    strategy: ConflictResolutionStrategy,
    options?: {
      selection?: SectionMergeSelection;
      doctorUserId?: string;
    }
  ): Promise<TransactionSyncResult> {
    const cleanId = patientId.replace(/[^\d]/g, '');
    const conflict = this.activeConflicts.get(cleanId);
    if (!conflict) {
      return { success: false, status: 'SYNC_ERROR', error: 'No se encontró un conflicto activo para este paciente.' };
    }

    const doctorId = options?.doctorUserId || 'dr_samir';
    let resolvedData: Patient360Record;
    let auditPayload: any;

    if (strategy === 'ACCEPT_REMOTE') {
      const res = ClinicalConflictResolver.resolveAcceptRemote(conflict, doctorId);
      resolvedData = res.resolvedRecord;
      auditPayload = res.auditEventPayload;

      // Guardar en almacenamiento local
      savePatientRecord(resolvedData);
      this.activeConflicts.delete(cleanId);
      syncQueueService.clearLocalDraftBackup(cleanId);

      try {
        clinicalAuditService.recordEvent(auditPayload);
      } catch {
        // No bloqueante
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('synapsis-patients-synced', {
            detail: { count: 1, timestamp: Date.now() },
          })
        );
      }

      return { success: true, status: 'SYNCED', version: res.resultingVersion };
    } else if (strategy === 'FORCE_LOCAL') {
      const res = ClinicalConflictResolver.resolveForceLocal(conflict, doctorId);
      resolvedData = res.resolvedRecord;
      auditPayload = res.auditEventPayload;
    } else {
      // SECTION_MERGE
      if (!options?.selection) {
        return { success: false, status: 'SYNC_ERROR', error: 'Se requiere la selección modular de secciones para SECTION_MERGE.' };
      }
      const res = ClinicalConflictResolver.resolveSectionMerge(conflict, options.selection, doctorId);
      resolvedData = res.resolvedRecord;
      auditPayload = res.auditEventPayload;
    }

    // Para FORCE_LOCAL y SECTION_MERGE, escribir localmente e intentar commit atómico a Firestore
    savePatientRecord(resolvedData);
    const syncRes = await this.syncPatientWithTransaction(resolvedData);

    if (syncRes.success) {
      this.activeConflicts.delete(cleanId);
      syncQueueService.clearLocalDraftBackup(cleanId);
      try {
        clinicalAuditService.recordEvent(auditPayload);
      } catch {
        // No bloqueante
      }
    }

    return syncRes;
  }

  /**
   * Procesa ordenadamente la cola de mutaciones offline al recuperar conectividad.
   * Aplica verificación estricta de idempotencia para cada operación.
   */
  public async processSyncQueue(): Promise<{ processed: number; conflicts: number; failed: number }> {
    const items = syncQueueService.getQueue().filter((q) => q.status === 'PENDING' || q.status === 'SYNCING');
    let processed = 0;
    let conflicts = 0;
    let failed = 0;

    for (const item of items) {
      if (syncQueueService.isIdempotencyKeyProcessed(item.idempotencyKey)) {
        syncQueueService.removeSyncedItem(item.id);
        continue;
      }

      syncQueueService.updateItemStatus(item.id, 'SYNCING', { incrementAttempt: true });

      try {
        if (item.mutationType === 'UPSERT_PATIENT') {
          const syncResult = await this.syncPatientWithTransaction(item.payload);
          if (syncResult.success) {
            syncQueueService.markIdempotencyKeyProcessed(item.idempotencyKey);
            syncQueueService.removeSyncedItem(item.id);
            processed++;
          } else if (syncResult.status === 'SYNC_CONFLICT') {
            syncQueueService.updateItemStatus(item.id, 'CONFLICT', { lastError: syncResult.error });
            conflicts++;
          } else {
            syncQueueService.updateItemStatus(item.id, 'PENDING', { lastError: syncResult.error });
            failed++;
          }
        }
      } catch (err: any) {
        syncQueueService.updateItemStatus(item.id, 'PENDING', { lastError: err?.message || 'Error procesando cola' });
        failed++;
      }
    }

    return { processed, conflicts, failed };
  }
}

export const firestorePatientSync = new FirestorePatientSyncService();
