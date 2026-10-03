import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db, CLINICAL_TENANT_ID } from '../firebase/config';
import { AuthorizedPersonnel, AUTHORIZED_PERSONNEL_DIRECTORY } from '../auth/userDirectory';
import { SynapsisRole } from '../auth/types';

const LOCAL_STORAGE_STAFF_KEY = 'socs_authorized_staff_directory_v2';

export class StaffDirectoryService {
  private static instance: StaffDirectoryService;
  private cachedMembers: Map<string, AuthorizedPersonnel> = new Map();
  private listeners: Array<(members: AuthorizedPersonnel[]) => void> = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private isInitialized = false;

  private constructor() {
    this.loadFromLocalStorage();
  }

  public static getInstance(): StaffDirectoryService {
    if (!StaffDirectoryService.instance) {
      StaffDirectoryService.instance = new StaffDirectoryService();
    }
    return StaffDirectoryService.instance;
  }

  private loadFromLocalStorage(): void {
    try {
      // 1. Cargar directorio base estático
      Object.values(AUTHORIZED_PERSONNEL_DIRECTORY).forEach((person) => {
        this.cachedMembers.set(person.email.trim().toLowerCase(), person);
      });

      // 2. Cargar modificaciones locales persistidas
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
        if (stored) {
          const parsed: AuthorizedPersonnel[] = JSON.parse(stored);
          parsed.forEach((m) => {
            if (m.email) {
              this.cachedMembers.set(m.email.trim().toLowerCase(), m);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[STAFF IAM] Error cargando caché local:', err);
    }
  }

  private saveToLocalStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const list = Array.from(this.cachedMembers.values());
        localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(list));
      }
    } catch (err) {
      console.warn('[STAFF IAM] Error guardando en localStorage:', err);
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const membersCol = collection(db, 'tenants', CLINICAL_TENANT_ID, 'members');
      
      // Suscripción reactiva en tiempo real a la nube
      this.unsubscribeFirestore = onSnapshot(
        query(membersCol),
        (snapshot) => {
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data() as AuthorizedPersonnel;
            if (data && data.email) {
              this.cachedMembers.set(data.email.trim().toLowerCase(), {
                email: data.email.trim().toLowerCase(),
                displayName: data.displayName || data.email,
                role: data.role || 'MEDICO',
                specialty: data.specialty || '',
                description: data.description || '',
              });
            }
          });
          this.saveToLocalStorage();
          this.notifyListeners();
        },
        (error) => {
          console.warn('[STAFF IAM] Modo offline o reglas restringidas en members:', error.message);
        }
      );
    } catch (err) {
      console.warn('[STAFF IAM] Error inicializando escucha en Firestore:', err);
    }
  }

  public getMembers(): AuthorizedPersonnel[] {
    return Array.from(this.cachedMembers.values());
  }

  public getMember(email: string): AuthorizedPersonnel | null {
    if (!email) return null;
    return this.cachedMembers.get(email.trim().toLowerCase()) || null;
  }

  public isEmailAuthorized(email: string): boolean {
    if (!email) return false;
    return this.cachedMembers.has(email.trim().toLowerCase());
  }

  public async addOrUpdateMember(member: AuthorizedPersonnel): Promise<{ success: boolean; message: string }> {
    const cleanEmail = member.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Correo electrónico inválido' };
    }

    const payload: AuthorizedPersonnel = {
      email: cleanEmail,
      displayName: member.displayName.trim() || cleanEmail.split('@')[0],
      role: member.role,
      specialty: member.specialty?.trim() || '',
      description: member.description?.trim() || '',
    };

    // Actualizar caché local inmediatamente
    this.cachedMembers.set(cleanEmail, payload);
    this.saveToLocalStorage();
    this.notifyListeners();

    // Sincronizar con Firestore
    try {
      const memberDocRef = doc(db, 'tenants', CLINICAL_TENANT_ID, 'members', cleanEmail);
      await setDoc(memberDocRef, {
        ...payload,
        updatedAt: new Date().toISOString(),
        tenantId: CLINICAL_TENANT_ID,
      }, { merge: true });

      return { success: true, message: `Personal "${payload.displayName}" autorizado y sincronizado con la nube.` };
    } catch (err: any) {
      console.warn('[STAFF IAM] Guardado local exitoso. Sincronización en la nube pendiente:', err);
      return { 
        success: true, 
        message: `Guardado en dispositivo local. Se sincronizará con la nube al conectar.` 
      };
    }
  }

  public async removeMember(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    
    // Prohibir eliminar al Titular principal
    if (cleanEmail === 'moucharrafiepc@gmail.com') {
      return { success: false, message: 'No se puede remover al Titular Principal de la cuenta' };
    }

    this.cachedMembers.delete(cleanEmail);
    this.saveToLocalStorage();
    this.notifyListeners();

    try {
      const memberDocRef = doc(db, 'tenants', CLINICAL_TENANT_ID, 'members', cleanEmail);
      await deleteDoc(memberDocRef);
      return { success: true, message: 'Personal revocado exitosamente' };
    } catch (err: any) {
      return { success: true, message: 'Acceso revocado localmente.' };
    }
  }

  public subscribe(callback: (members: AuthorizedPersonnel[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.getMembers());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    const list = this.getMembers();
    this.listeners.forEach((cb) => cb(list));
  }
}

export const staffDirectoryService = StaffDirectoryService.getInstance();
