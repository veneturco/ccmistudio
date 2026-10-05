import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db, CLINICAL_TENANT_ID } from '../firebase/config';
import { 
  AuthorizedPersonnel, 
  AUTHORIZED_PERSONNEL_DIRECTORY, 
  PersonnelStatus, 
  getDefaultPermissionsForRole 
} from '../auth/userDirectory';
import { SynapsisRole, StaffPermissions } from '../auth/types';

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
              const clean = m.email.trim().toLowerCase();
              const base = this.cachedMembers.get(clean);
              this.cachedMembers.set(clean, {
                ...base,
                ...m,
                permissions: m.permissions || base?.permissions || getDefaultPermissionsForRole(m.role || 'MEDICO'),
                status: m.status || base?.status || 'ACTIVO',
              });
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
          if (snapshot.empty) {
            console.log('[STAFF IAM] Firestore vacío. Autopoblando con directorio estático...');
            Object.values(AUTHORIZED_PERSONNEL_DIRECTORY).forEach(person => {
              this.addOrUpdateMember(person).catch(e => console.warn(e));
            });
          } else {
            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data() as AuthorizedPersonnel;
              if (data && data.email) {
                const cleanEmail = data.email.trim().toLowerCase();
                const existing = this.cachedMembers.get(cleanEmail) || AUTHORIZED_PERSONNEL_DIRECTORY[cleanEmail];
                const merged: AuthorizedPersonnel = {
                  ...existing,
                  ...data,
                  email: cleanEmail,
                  displayName: data.displayName || existing?.displayName || cleanEmail,
                  role: data.role || existing?.role || 'MEDICO',
                  specialty: data.specialty !== undefined ? data.specialty : (existing?.specialty || ''),
                  description: data.description !== undefined ? data.description : (existing?.description || ''),
                  status: data.status || existing?.status || 'ACTIVO',
                  nationalId: data.nationalId || existing?.nationalId || '',
                  mppsNumber: data.mppsNumber || existing?.mppsNumber || '',
                  cmebNumber: data.cmebNumber || existing?.cmebNumber || '',
                  phone: data.phone || existing?.phone || '',
                  avatarUrl: data.avatarUrl || existing?.avatarUrl || '',
                  consultationDays: data.consultationDays || existing?.consultationDays || [],
                  consultationHours: data.consultationHours || existing?.consultationHours || '',
                  officeLocation: data.officeLocation || existing?.officeLocation || '',
                  permissions: data.permissions || existing?.permissions || getDefaultPermissionsForRole(data.role || existing?.role || 'MEDICO'),
                  stampBase64: data.stampBase64 || existing?.stampBase64 || '',
                  signatureBase64: data.signatureBase64 || existing?.signatureBase64 || '',
                  updatedAt: data.updatedAt || new Date().toISOString(),
                };
                this.cachedMembers.set(cleanEmail, merged);
              }
            });
            this.saveToLocalStorage();
            this.notifyListeners();
          }
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

  public getActiveDoctors(): AuthorizedPersonnel[] {
    return Array.from(this.cachedMembers.values()).filter(
      (m) => m.role === 'MEDICO' && m.status !== 'INACTIVO'
    );
  }

  public isEmailAuthorized(email: string): boolean {
    if (!email) return false;
    const member = this.cachedMembers.get(email.trim().toLowerCase());
    return !!member && member.status !== 'INACTIVO';
  }

  public async addOrUpdateMember(member: AuthorizedPersonnel): Promise<{ success: boolean; message: string }> {
    const cleanEmail = member.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Correo electrónico inválido' };
    }

    const existing = this.cachedMembers.get(cleanEmail) || AUTHORIZED_PERSONNEL_DIRECTORY[cleanEmail];
    
    const payload: AuthorizedPersonnel = {
      ...existing,
      ...member,
      email: cleanEmail,
      displayName: member.displayName?.trim() || existing?.displayName || cleanEmail.split('@')[0],
      role: member.role || existing?.role || 'MEDICO',
      specialty: member.specialty !== undefined ? member.specialty.trim() : (existing?.specialty || ''),
      description: member.description !== undefined ? member.description.trim() : (existing?.description || ''),
      status: member.status || existing?.status || 'ACTIVO',
      nationalId: member.nationalId !== undefined ? member.nationalId.trim() : (existing?.nationalId || ''),
      mppsNumber: member.mppsNumber !== undefined ? member.mppsNumber.trim() : (existing?.mppsNumber || ''),
      cmebNumber: member.cmebNumber !== undefined ? member.cmebNumber.trim() : (existing?.cmebNumber || ''),
      phone: member.phone !== undefined ? member.phone.trim() : (existing?.phone || ''),
      avatarUrl: member.avatarUrl !== undefined ? member.avatarUrl : (existing?.avatarUrl || ''),
      consultationDays: member.consultationDays || existing?.consultationDays || [],
      consultationHours: member.consultationHours !== undefined ? member.consultationHours.trim() : (existing?.consultationHours || ''),
      officeLocation: member.officeLocation !== undefined ? member.officeLocation.trim() : (existing?.officeLocation || ''),
      permissions: member.permissions || existing?.permissions || getDefaultPermissionsForRole(member.role || existing?.role || 'MEDICO'),
      stampBase64: member.stampBase64 !== undefined ? member.stampBase64 : (existing?.stampBase64 || ''),
      signatureBase64: member.signatureBase64 !== undefined ? member.signatureBase64 : (existing?.signatureBase64 || ''),
      updatedAt: new Date().toISOString(),
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

  public async updateMemberStatus(email: string, status: PersonnelStatus): Promise<boolean> {
    const member = this.getMember(email);
    if (!member) return false;
    const res = await this.addOrUpdateMember({ ...member, status });
    return res.success;
  }

  public async saveDoctorStamp(email: string, stampBase64: string): Promise<boolean> {
    const member = this.getMember(email);
    if (!member) return false;
    const res = await this.addOrUpdateMember({ ...member, stampBase64 });
    return res.success;
  }

  public async saveDoctorSignature(email: string, signatureBase64: string): Promise<boolean> {
    const member = this.getMember(email);
    if (!member) return false;
    const res = await this.addOrUpdateMember({ ...member, signatureBase64 });
    return res.success;
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
