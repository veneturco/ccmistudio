export type SynapsisRole = 'MEDICO' | 'DESARROLLADOR' | 'SECRETARIA' | 'RECEPCION' | 'ADMINISTRADOR';

export type AuthStatus = 
  | 'AUTHENTICATING' 
  | 'AUTHENTICATED' 
  | 'UNAUTHENTICATED' 
  | 'AUTH_ERROR' 
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED';

export interface StaffPermissions {
  canViewFullHistory: boolean;
  canAccessQuoter: boolean;
  canCalibrateA4: boolean;
  canManageStaff: boolean;
}

export interface SynapsisUser {
  uid: string;
  email: string | null;
  displayName: string;
  role: SynapsisRole;
  tenantId: string;
  isVerified: boolean;
  photoURL?: string | null;
  deviceAuthenticated?: boolean;
  permissions?: StaffPermissions;
  status?: 'ACTIVO' | 'INACTIVO' | 'VACACIONES';
}

export interface AuthContextType {
  status: AuthStatus;
  user: SynapsisUser | null;
  firebaseUser: any | null;
  errorMessage: string | null;
  isDeviceAuthAvailable: boolean;
  isDeviceAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  bypassLocalDoctor?: () => void;
  neuralState?: string;
  verifyDeviceBiometrics: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}
