import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  getDocFromServer,
  setLogLevel 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { FirestoreQuotaShield } from '../cloud/FirestoreQuotaShield';

// Suprimir logs ruidosos de polling/offline del SDK de Firestore
try {
  setLogLevel('silent');
} catch {
  // Ignorar en entornos donde no aplique
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

// Tenant institucional verificado para el Centro Clínico Médico Integral
export const CLINICAL_TENANT_ID = 'CCMI-DR-SAMIR';

export async function ensureAuthenticatedSession(): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (err) {
    console.warn('[Firebase Auth] Sesión anónima en modo offline o restringida:', err);
    let offlineUid = localStorage.getItem('ccmi_offline_uid');
    if (!offlineUid) {
      offlineUid = 'local-offline-' + crypto.randomUUID();
      localStorage.setItem('ccmi_offline_uid', offlineUid);
    }
    return offlineUid;
  }
}

// Validación inicial de conectividad conforme al estándar de Firebase Skill
export async function validateFirestoreConnection(): Promise<boolean> {
  if (FirestoreQuotaShield.isQuotaExhausted()) {
    return false;
  }
  try {
    const fetchPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout')), 2500)
    );
    await Promise.race([fetchPromise, timeoutPromise]);
    return true;
  } catch (error) {
    // Modo offline resiliente y transparente
    return false;
  }
}

export default app;
