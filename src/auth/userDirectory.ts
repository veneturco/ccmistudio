import { User as FirebaseUser } from 'firebase/auth';
import { SynapsisUser, SynapsisRole } from './types';
import { CLINICAL_TENANT_ID } from '../firebase/config';

export interface AuthorizedPersonnel {
  email: string;
  displayName: string;
  role: SynapsisRole;
  specialty?: string;
  description?: string;
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
  },
  'lennysalcantarat@gmail.com': {
    email: 'lennysalcantarat@gmail.com',
    displayName: 'Lennys Alcántara',
    role: 'SECRETARIA',
    specialty: 'Recepción & Coordinación Quirúrgica',
    description: 'Secretaría y Control de Citas Orinokia',
  },
  'afiftauficmoucharrafie@gmail.com': {
    email: 'afiftauficmoucharrafie@gmail.com',
    displayName: 'Afif Taufic Moucharrafie',
    role: 'ADMINISTRADOR',
    specialty: 'Gestión Institucional CCMI',
    description: 'Administración y Soporte',
  },
  'samnaime@gmail.com': {
    email: 'samnaime@gmail.com',
    displayName: 'Dr. Samir Moucharrafie',
    role: 'MEDICO',
    specialty: 'Neurocirugía',
  },
  'neurochirsami@gmail.com': {
    email: 'neurochirsami@gmail.com',
    displayName: 'Dr. Samir Moucharrafie (Institucional)',
    role: 'MEDICO',
    specialty: 'Centro Clínico Médico Integral',
  },
  'cerebro.columna.mi@gmail.com': {
    email: 'cerebro.columna.mi@gmail.com',
    displayName: 'Dirección Médica CCMI',
    role: 'ADMINISTRADOR',
    specialty: 'Columna Mínimamente Invasiva',
  },
  'neurocirujanosam@gmail.com': {
    email: 'neurocirujanosam@gmail.com',
    displayName: 'Dr. Samir Moucharrafie',
    role: 'MEDICO',
    specialty: 'Neurocirugía',
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

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: personnel.displayName || firebaseUser.displayName || 'Personal Autorizado',
    role: personnel.role,
    tenantId: CLINICAL_TENANT_ID,
    isVerified: true,
    photoURL: firebaseUser.photoURL,
    deviceAuthenticated: true,
  };
}
