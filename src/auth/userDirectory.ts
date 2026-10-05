import { User as FirebaseUser } from 'firebase/auth';
import { SynapsisUser, SynapsisRole, StaffPermissions } from './types';
import { CLINICAL_TENANT_ID } from '../firebase/config';

export type PersonnelStatus = 'ACTIVO' | 'INACTIVO' | 'VACACIONES';

export interface AuthorizedPersonnel {
  email: string;
  displayName: string;
  role: SynapsisRole;
  specialty?: string;
  description?: string;

  // Pilar 6: Ficha Profesional y Legal
  nationalId?: string;      // Cédula de Identidad, ej: "V-11.456.789"
  mppsNumber?: string;      // Registro Sanitario MPPS, ej: "62.431"
  cmebNumber?: string;      // Colegio de Médicos (CMEB/CMD), ej: "3.842"
  phone?: string;           // Teléfono móvil / WhatsApp, ej: "0414-883.21.09"
  status?: PersonnelStatus; // Estado operativo (por defecto ACTIVO)
  avatarUrl?: string;       // Foto de perfil

  // Pilar 5: Horarios y Consultorio
  consultationDays?: string[]; // ej: ["Lunes", "Miércoles", "Viernes"]
  consultationHours?: string;  // ej: "02:00 PM - 06:00 PM"
  officeLocation?: string;     // ej: "Consultorio 14, Torre Médica Orinokia Mall"

  // Pilar 4: Matriz de Permisos Granulares
  permissions?: StaffPermissions;

  // Pilar 2: Sello y Firma Digital
  stampBase64?: string;        // Sello húmedo digitalizado (PNG transparente)
  signatureBase64?: string;    // Firma digitalizada
  updatedAt?: string;
}

/**
 * Permisos por defecto inteligentes basados en el rol
 */
export function getDefaultPermissionsForRole(role: SynapsisRole): StaffPermissions {
  switch (role) {
    case 'DESARROLLADOR':
    case 'ADMINISTRADOR':
      return {
        canViewFullHistory: true,
        canAccessQuoter: true,
        canCalibrateA4: true,
        canManageStaff: true,
      };
    case 'MEDICO':
      return {
        canViewFullHistory: true,
        canAccessQuoter: true,
        canCalibrateA4: false, // Solo Administrador/Dev calibra papelería por defecto
        canManageStaff: false,
      };
    case 'SECRETARIA':
    case 'RECEPCION':
    default:
      return {
        canViewFullHistory: false, // Protege secreto médico: solo agenda y datos administrativos
        canAccessQuoter: false,     // Protege finanzas y costos de quirófano
        canCalibrateA4: false,     // Bloquea calibrador milimétrico
        canManageStaff: false,     // Bloquea gestión de usuarios
      };
  }
}

/**
 * Directorio Institucional de Personal Médico y Administrativo Autorizado
 * Basado en las credenciales de firestore.rules para el tenant CCMI-DR-SAMIR
 */
export const AUTHORIZED_PERSONNEL_DIRECTORY: Record<string, AuthorizedPersonnel> = {
  'moucharrafiepc@gmail.com': {
    email: 'moucharrafiepc@gmail.com',
    displayName: 'Dr. Samir Moucharrafie Naime',
    role: 'MEDICO',
    specialty: 'Especialista en Neurocirugía y Cirugía de Columna',
    description: 'Titular / Administrador Principal',
    nationalId: 'V-11.456.789',
    mppsNumber: '62.431',
    cmebNumber: '3.842',
    phone: '0414-883.21.09',
    status: 'ACTIVO',
    consultationDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    consultationHours: '08:30 AM - 12:30 PM / 02:30 PM - 06:00 PM',
    officeLocation: 'Consultorio 14, Piso 2, Torre Médica Orinokia Mall',
    permissions: {
      canViewFullHistory: true,
      canAccessQuoter: true,
      canCalibrateA4: true,
      canManageStaff: true,
    },
  },
  'lennysalcantarat@gmail.com': {
    email: 'lennysalcantarat@gmail.com',
    displayName: 'Lennys Alcántara',
    role: 'SECRETARIA',
    specialty: 'Recepción & Coordinación Quirúrgica',
    description: 'Secretaría y Control de Citas Orinokia',
    nationalId: 'V-18.765.432',
    phone: '0424-912.83.41',
    status: 'ACTIVO',
    consultationDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    consultationHours: '08:00 AM - 05:00 PM',
    officeLocation: 'Recepción Principal Orinokia Piso 2',
    permissions: {
      canViewFullHistory: false,
      canAccessQuoter: false,
      canCalibrateA4: false,
      canManageStaff: false,
    },
  },
  'afiftauficmoucharrafie@gmail.com': {
    email: 'afiftauficmoucharrafie@gmail.com',
    displayName: 'Afif Taufic Moucharrafie',
    role: 'ADMINISTRADOR',
    specialty: 'Gestión Institucional CCMI',
    description: 'Administración y Soporte',
    status: 'ACTIVO',
    permissions: {
      canViewFullHistory: true,
      canAccessQuoter: true,
      canCalibrateA4: true,
      canManageStaff: true,
    },
  },
  'samnaime@gmail.com': {
    email: 'samnaime@gmail.com',
    displayName: 'Dr. Samir Moucharrafie',
    role: 'MEDICO',
    specialty: 'Neurocirugía',
    status: 'ACTIVO',
    mppsNumber: '62.431',
    cmebNumber: '3.842',
    permissions: getDefaultPermissionsForRole('MEDICO'),
  },
  'neurochirsami@gmail.com': {
    email: 'neurochirsami@gmail.com',
    displayName: 'Dr. Samir Moucharrafie (Institucional)',
    role: 'MEDICO',
    specialty: 'Centro Clínico Médico Integral',
    status: 'ACTIVO',
    permissions: getDefaultPermissionsForRole('MEDICO'),
  },
  'cerebro.columna.mi@gmail.com': {
    email: 'cerebro.columna.mi@gmail.com',
    displayName: 'Dirección Médica CCMI',
    role: 'ADMINISTRADOR',
    specialty: 'Columna Mínimamente Invasiva',
    status: 'ACTIVO',
    permissions: getDefaultPermissionsForRole('ADMINISTRADOR'),
  },
  'neurocirujanosam@gmail.com': {
    email: 'neurocirujanosam@gmail.com',
    displayName: 'Dr. Samir Moucharrafie',
    role: 'MEDICO',
    specialty: 'Neurocirugía',
    status: 'ACTIVO',
    permissions: getDefaultPermissionsForRole('MEDICO'),
  },
};

import { staffDirectoryService } from '../cloud/StaffDirectoryService';

/**
 * Resuelve la identidad y rol del usuario si su correo está en la lista blanca oficial
 */
export function resolveSynapsisUser(firebaseUser: FirebaseUser | null): SynapsisUser | null {
  if (!firebaseUser || !firebaseUser.email) {
    return null;
  }

  const normalizedEmail = firebaseUser.email.trim().toLowerCase();
  
  // 1. Consultar directorio dinámico en tiempo real (Firestore / LocalStorage)
  let personnel = staffDirectoryService.getMember(normalizedEmail);
  
  // 2. Fallback al directorio estático
  if (!personnel) {
    personnel = AUTHORIZED_PERSONNEL_DIRECTORY[normalizedEmail] || null;
  }

  if (!personnel) {
    console.warn(`[SYNAPSIS IAM] Acceso denegado: el correo "${normalizedEmail}" no está en el directorio autorizado.`);
    return null;
  }

  const effectivePermissions = personnel.permissions || getDefaultPermissionsForRole(personnel.role);
  const effectiveStatus = personnel.status || 'ACTIVO';

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: personnel.displayName || firebaseUser.displayName || 'Personal Autorizado',
    role: personnel.role,
    tenantId: CLINICAL_TENANT_ID,
    isVerified: true,
    photoURL: personnel.avatarUrl || firebaseUser.photoURL,
    deviceAuthenticated: true,
    permissions: effectivePermissions,
    status: effectiveStatus,
  };
}
