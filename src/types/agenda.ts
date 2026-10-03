/**
 * src/types/agenda.ts
 * Definición canónica de tipos para la Agenda Clínica y Citas Médicas del CCMI (Cortex Axis).
 */

export type AppointmentStatus =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'EN_SALA'
  | 'EN_CONSULTA'
  | 'COMPLETADA'
  | 'CANCELADA_MEDICO'
  | 'CANCELADA_PACIENTE'
  | 'NO_ASISTIO'
  | 'REPROGRAMADA';

export type AppointmentType =
  | 'PRIMERA_VEZ'
  | 'CONTROL'
  | 'POSTOPERATORIO'
  | 'LECTURA_ESTUDIOS'
  | 'PROCEDIMIENTO_MENOR'
  | 'SEGUNDA_OPINION';

export type ConsultationModality = 'PRESENCIAL' | 'TELEMEDICINA' | 'DOMICILIARIA';

export interface AppointmentStatusTransition {
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  timestamp: string;
  actorUserId: string;
  reason?: string;
}

export interface ClinicalAppointment {
  id: string;
  tenantId: string;
  doctorUserId: string;
  patientId: string;
  patientName: string;
  patientNationalId: string;
  patientPhone: string;
  date: string; // ISO YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  type: AppointmentType;
  modality: ConsultationModality;
  status: AppointmentStatus;
  reasonForVisit: string;
  notes?: string;
  stateHistory?: AppointmentStatusTransition[];
  version?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  enabled: boolean;
  slots: Array<{
    start: string; // HH:mm
    end: string; // HH:mm
  }>;
}

export interface DoctorScheduleConfig {
  id: string;
  tenantId: string;
  doctorUserId: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
  weeklySchedule: DaySchedule[];
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface ScheduleBlock {
  id: string;
  tenantId: string;
  doctorUserId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'VACACIONES' | 'CIRUGIA' | 'CONGRESO' | 'AUSENCIA_PERSONAL' | 'OTRO';
}
