import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db, CLINICAL_TENANT_ID, ensureAuthenticatedSession } from '../firebase/config';
import { FirestoreQuotaShield } from './FirestoreQuotaShield';
import { ClinicalAppointment, AppointmentStatus } from '../types/agenda';

const STORAGE_AGENDA_KEY = 'ccmi_clinical_agenda_appointments_v1';
const COLLECTION_NAME = 'clinical_appointments';

export class FirestoreAgendaSync {
  private static unsubscribe: (() => void) | null = null;

  /**
   * Suscribe en tiempo real a las citas del tenant CCMI-DR-SAMIR
   */
  public static subscribeToAppointments(
    onAppointmentsUpdated: (appointments: ClinicalAppointment[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Primero leer datos locales para render instantáneo
    try {
      const cached = localStorage.getItem(STORAGE_AGENDA_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onAppointmentsUpdated(parsed);
        }
      }
    } catch (e) {
      console.warn('[FirestoreAgendaSync] Error leyendo caché local:', e);
    }

    if (FirestoreQuotaShield.isQuotaExhausted()) {
      return () => {};
    }

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('tenantId', '==', CLINICAL_TENANT_ID)
      );

      this.unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          FirestoreQuotaShield.recordSuccess();
          const items: ClinicalAppointment[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: docSnap.id,
              ...data,
            } as ClinicalAppointment);
          });

          if (items.length > 0) {
            // Guardar en caché local
            try {
              localStorage.setItem(STORAGE_AGENDA_KEY, JSON.stringify(items));
            } catch (e) {}

            onAppointmentsUpdated(items);
          }
        },
        (error) => {
          FirestoreQuotaShield.recordFailure(error);
          console.warn('[FirestoreAgendaSync] Listener offline o error:', error);
          if (onError) onError(error);
        }
      );

      return () => {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
      };
    } catch (err) {
      console.warn('[FirestoreAgendaSync] Error al iniciar suscripción:', err);
      return () => {};
    }
  }

  /**
   * Guarda o actualiza una cita en Firestore y en caché local
   */
  public static async saveAppointment(appointment: ClinicalAppointment): Promise<void> {
    // 1. Guardar en memoria local inmediatamente
    try {
      const raw = localStorage.getItem(STORAGE_AGENDA_KEY);
      let list: ClinicalAppointment[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((a) => a.id === appointment.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...appointment };
      } else {
        list.unshift(appointment);
      }
      localStorage.setItem(STORAGE_AGENDA_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[FirestoreAgendaSync] Error local save:', e);
    }

    // 2. Sincronizar en Firestore
    if (FirestoreQuotaShield.isQuotaExhausted()) return;

    try {
      await ensureAuthenticatedSession();
      const docRef = doc(db, COLLECTION_NAME, appointment.id);
      await setDoc(docRef, {
        ...appointment,
        tenantId: CLINICAL_TENANT_ID,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      FirestoreQuotaShield.recordSuccess();
    } catch (err) {
      FirestoreQuotaShield.recordFailure(err);
      console.warn('[FirestoreAgendaSync] Guardado en Firestore falló (guardado local OK):', err);
    }
  }

  /**
   * Actualiza rápidamente el estado de una cita (ej: 'EN_SALA', 'EN_CONSULTA', 'COMPLETADA')
   */
  public static async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    // 1. Local
    try {
      const raw = localStorage.getItem(STORAGE_AGENDA_KEY);
      if (raw) {
        const list: ClinicalAppointment[] = JSON.parse(raw);
        const target = list.find((a) => a.id === id);
        if (target) {
          target.status = status;
          target.updatedAt = new Date().toISOString();
          localStorage.setItem(STORAGE_AGENDA_KEY, JSON.stringify(list));
        }
      }
    } catch (e) {}

    // 2. Cloud
    if (FirestoreQuotaShield.isQuotaExhausted()) return;
    try {
      await ensureAuthenticatedSession();
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, {
        status,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      FirestoreQuotaShield.recordSuccess();
    } catch (err) {
      FirestoreQuotaShield.recordFailure(err);
    }
  }

  /**
   * Elimina una cita
   */
  public static async deleteAppointment(id: string): Promise<void> {
    try {
      const raw = localStorage.getItem(STORAGE_AGENDA_KEY);
      if (raw) {
        const list: ClinicalAppointment[] = JSON.parse(raw);
        const filtered = list.filter((a) => a.id !== id);
        localStorage.setItem(STORAGE_AGENDA_KEY, JSON.stringify(filtered));
      }
    } catch (e) {}

    if (FirestoreQuotaShield.isQuotaExhausted()) return;
    try {
      await ensureAuthenticatedSession();
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      FirestoreQuotaShield.recordSuccess();
    } catch (err) {
      FirestoreQuotaShield.recordFailure(err);
    }
  }
}
