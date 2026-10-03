import { doc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';
import { db, CLINICAL_TENANT_ID as TENANT_ID } from '../firebase/config';
import { CALIBRATOR_STORAGE_KEY } from '../calibration/MasterRegistryV2';
import { saveCustomTemplate } from '../utils/templateStorage';

class FirestoreStationerySyncService {
  private isInitialized = false;
  private isQuotaExhausted = false;

  public async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    try {
      this.subscribeToCloudCalibration();
      this.subscribeToCloudTemplates();
      // En arranque solo se suscribe a lecturas; no se satura la cuota de escritura diaria
    } catch (e: any) {
      console.warn('[SYNAPSIS SYNC] Inicialización en modo offline resiliente:', e?.message || e);
    }
  }

  public subscribeToCloudTemplates() {
    try {
      if (!db) return;
      const statColRef = collection(db, 'tenants', TENANT_ID, 'stationery');
      onSnapshot(statColRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const docType = change.doc.id;
            if (data && data.dataUrl) {
              console.log(`[SYNAPSIS CLOUD] Descargando plantilla master '${docType}' desde Firestore...`);
              saveCustomTemplate(docType, data.dataUrl, {
                width: data.width,
                height: data.height,
                mimeType: data.mimeType,
                lqipDataUrl: data.lqipDataUrl,
                originalPdfHash: data.originalPdfHash,
              }).then(() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('stationery_cloud_synced', {
                    detail: { docType, dataUrl: data.dataUrl }
                  }));
                }
              }).catch(console.warn);
            }
          }
        });
      }, (err) => {
        console.warn('[SYNAPSIS SYNC] Error escuchando papelería de Firestore:', err);
      });
    } catch (err) {
      console.warn('[SYNAPSIS SYNC] Error suscribiendo a papelería:', err);
    }
  }

  public subscribeToCloudCalibration() {
    try {
      if (!db) return;
      const calDocRef = doc(db, 'tenants', TENANT_ID, 'settings', 'calibration');
      onSnapshot(calDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.map && localStorage.getItem(CALIBRATOR_STORAGE_KEY) !== data.map) {
            // Anti-Empty Guard en descarga: Rechazar si los datos remotos están vacíos
            try {
              const parsed = JSON.parse(data.map);
              if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
                console.warn('[SYNAPSIS SYNC] Anti-Empty Guard: Se rechaza calibración remota vacía de Firestore.');
                return;
              }
            } catch {
              console.warn('[SYNAPSIS SYNC] Anti-Empty Guard: Calibración remota no es JSON válido.');
              return;
            }

            console.log('[SYNAPSIS SYNC] Descargando calibraciones verificadas de la nube Firestore...');
            localStorage.setItem(CALIBRATOR_STORAGE_KEY, data.map);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('medical_template_calibrated', { detail: { docType: 'all' } }));
            }
          }
        }
      }, (err) => {
        console.warn('[SYNAPSIS SYNC] Error escuchando calibraciones de Firestore:', err);
      });
    } catch (err) {
      console.warn('[SYNAPSIS SYNC] Error suscribiendo a calibraciones:', err);
    }
  }

  public async pushLocalCalibrationToCloud() {
    if (this.isQuotaExhausted) return;
    try {
      const localMap = typeof window !== 'undefined' ? localStorage.getItem(CALIBRATOR_STORAGE_KEY) : null;
      if (localMap && localMap.trim() !== '' && localMap !== '{}' && localMap !== 'null') {
        // Anti-Empty Guard en subida: Verificar que el mapa no contenga dimensiones <= 0
        try {
          const parsed = JSON.parse(localMap);
          if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
            console.warn('[SYNAPSIS SYNC] Anti-Empty Guard: Se aborta subida a Firestore porque el mapa local está vacío.');
            return;
          }

          for (const [docName, docCal] of Object.entries(parsed)) {
            const elements = (docCal as any)?.elements || docCal;
            if (Array.isArray(elements)) {
              for (const el of elements) {
                const w = el.geometry?.widthMm ?? el.width;
                const h = el.geometry?.heightMm ?? el.height;
                if ((typeof w === 'number' && w <= 0) || (typeof h === 'number' && h <= 0)) {
                  console.error(`[SYNAPSIS SYNC] Anti-Empty Guard: Elemento '${el.id || 'campo'}' en '${docName}' tiene dimensión inválida (w: ${w}, h: ${h}). Se rechaza sincronización a Firestore.`);
                  return;
                }
              }
            }
          }
        } catch (e) {
          console.error('[SYNAPSIS SYNC] Anti-Empty Guard: Error validando JSON de calibración antes de subir:', e);
          return;
        }

        // 1. Sincronización al servidor en disco
        try {
          await fetch('/api/calibrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawMap: localMap }),
          });
        } catch (fetchErr) {
          // Servidor local offline o en preview
        }

        // 2. Sincronización a Firestore
        if (!db) return;
        const calDocRef = doc(db, 'tenants', TENANT_ID, 'settings', 'calibration');
        await setDoc(calDocRef, {
          map: localMap,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // Si el cliente no tiene datos locales, intentar descargar del servidor en disco
        try {
          const res = await fetch('/api/calibrations');
          const data = await res.json();
          if (data && data.rawMap && typeof window !== 'undefined' && !localStorage.getItem(CALIBRATOR_STORAGE_KEY)) {
            localStorage.setItem(CALIBRATOR_STORAGE_KEY, data.rawMap);
            window.dispatchEvent(new CustomEvent('medical_template_calibrated', { detail: { docType: 'all' } }));
          }
        } catch (pullErr) {
          // Continuar con valores por defecto
        }
      }
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || String(err?.message || err).toLowerCase().includes('quota')) {
        this.isQuotaExhausted = true;
      }
      console.warn('[SYNAPSIS SYNC] Modo offline resiliente (se preservan copias locales):', err?.message || err);
    }
  }

  public async uploadSingleTemplateToCloud(docType: string, templateData: any) {
    if (this.isQuotaExhausted) return;
    try {
      if (!db) return;
      const tmplDocRef = doc(db, 'tenants', TENANT_ID, 'stationery', docType);
      await setDoc(tmplDocRef, {
        ...templateData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || String(err?.message || err).toLowerCase().includes('quota')) {
        this.isQuotaExhausted = true;
      }
      console.warn('[SYNAPSIS SYNC] Error subiendo plantilla:', err?.message || err);
    }
  }
}

export const FirestoreStationerySync = new FirestoreStationerySyncService();
