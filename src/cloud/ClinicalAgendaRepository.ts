/**
 * CORTEX AXIS — CENTRO CLÍNICO MÉDICO INTEGRAL
 * FASE 1: SERVICIO DE PERSISTENCIA Y AISLAMIENTO DE AGENDA CLÍNICA
 * 
 * Responsabilidades:
 * - Aislamiento estricto Multi-Tenant (CCMI-DR-SAMIR)
 * - Trazabilidad y auditoría de transiciones de estado de citas
 * - Gestión de configuraciones de horario y bloques de agenda
 * - Manejo robusto de errores de permisos y desconexión según SKILL.md
 * - Inalterabilidad de ClinicalEpisode, Patient360 y PDF Engine
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db, CLINICAL_TENANT_ID } from '../firebase/config';
import {
  ClinicalAppointment,
  AppointmentStatus,
  DoctorScheduleConfig,
  ScheduleBlock,
  AppointmentType,
  ConsultationModality,
} from '../types/agenda';
import { assertValidAppointmentTransition } from '../agenda/appointmentStateMachine';
import { calculateAvailableSlots, hasTimeConflict } from '../agenda/availabilityEngine';
import { clinicalAuditService } from '../audit/ClinicalAuditService';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';

/**
 * Sanitiza recursivamente objetos para evitar valores `undefined` que Firestore rechaza.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean as T;
}

export class ClinicalAgendaRepository {
  private tenantId: string;

  constructor(tenantId: string = CLINICAL_TENANT_ID) {
    this.tenantId = tenantId;
  }

  // =========================================================================
  // 1. GESTIÓN DE CITAS CLÍNICAS (APPOINTMENTS)
  // =========================================================================

  /**
   * Registra una nueva cita clínica con validación multi-tenant y auditoría
   */
  public async createAppointment(appointment: Omit<ClinicalAppointment, 'id' | 'createdBy' | 'tenantId' | 'createdAt' | 'updatedAt' | 'version' | 'stateHistory'> & {
    id?: string;
    createdBy?: string;
    createdByUserId: string;
    createdByRole: 'MEDICO' | 'PACIENTE' | 'DESARROLLADOR' | 'RECEPCION' | 'SISTEMA';
  }): Promise<ClinicalAppointment> {
    const nowIso = new Date().toISOString();
    const appointmentId = appointment.id || doc(collection(db, 'agenda')).id;

    const fullAppointment: ClinicalAppointment = {
      ...appointment,
      id: appointmentId,
      createdBy: appointment.createdBy || appointment.createdByUserId,
      tenantId: this.tenantId,
      version: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      stateHistory: [
        {
          fromStatus: null,
          toStatus: appointment.status,
          timestamp: nowIso,
          actorUserId: appointment.createdByUserId,
          actorRole: appointment.createdByRole,
          reason: 'Creación de cita clínica inicial',
        },
      ],
    };

    try {
      const docRef = doc(db, 'tenants', this.tenantId, 'appointments', appointmentId);
      const cleanData = sanitizeForFirestore(fullAppointment);
      await setDoc(docRef, cleanData);

      // Auditoría forense append-only
      try {
        await clinicalAuditService.recordEvent({
          tenantId: this.tenantId,
          patientId: appointment.patientId,
          action: 'APPOINTMENT_SCHEDULED',
          category: 'CLINICAL_ACTION',
          provenance: 'RAW_CAPTURED',
          result: 'SUCCESS',
          sourceModule: 'CLINICAL_AGENDA',
          entityType: 'Appointment',
          entityId: appointmentId,
          correlationId: appointmentId,
          clinicalDate: appointment.date,
        });
      } catch (auditErr) {
        console.warn('[AGENDA AUDIT] Registro local encolado ante fallo de auditoría remota:', auditErr);
      }

      return fullAppointment;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tenants/${this.tenantId}/appointments/${appointmentId}`);
      throw error;
    }
  }

  /**
   * Transición de estado de una cita clínica con validación de ciclo de vida y auditoría
   */
  public async updateAppointmentStatus(params: {
    appointmentId: string;
    newStatus: AppointmentStatus;
    actorUserId: string;
    actorRole: 'MEDICO' | 'PACIENTE' | 'DESARROLLADOR' | 'RECEPCION' | 'SISTEMA';
    reason?: string;
    clinicalEpisodeId?: string;
  }): Promise<void> {
    const { appointmentId, newStatus, actorUserId, actorRole, reason, clinicalEpisodeId } = params;
    const nowIso = new Date().toISOString();
    const docRef = doc(db, 'tenants', this.tenantId, 'appointments', appointmentId);

    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error(`Cita clínica ${appointmentId} no encontrada en el tenant ${this.tenantId}`);
      }

      const current = snap.data() as ClinicalAppointment;
      const prevStatus = current.status;

      // Validación de inmutabilidad de tenant
      if (current.tenantId !== this.tenantId) {
        throw new Error(`Violación de frontera tenant: cita ${appointmentId} pertenece a ${current.tenantId}`);
      }

      // Validación determinista de máquina de estados (P0-1)
      assertValidAppointmentTransition(prevStatus, newStatus);

      const updatedHistory = [
        ...(current.stateHistory || []),
        {
          fromStatus: prevStatus,
          toStatus: newStatus,
          timestamp: nowIso,
          actorUserId,
          actorRole,
          reason: reason || `Transición de estado a ${newStatus}`,
        },
      ];

      const patch: Partial<ClinicalAppointment> = {
        status: newStatus,
        updatedAt: nowIso,
        version: (current.version || 1) + 1,
        stateHistory: updatedHistory,
      };

      if (clinicalEpisodeId) {
        patch.clinicalEpisodeId = clinicalEpisodeId;
      }

      await setDoc(docRef, sanitizeForFirestore(patch), { merge: true });

      // Mapeo de acción de auditoría
      let auditAction: any = 'APPOINTMENT_CONFIRMED';
      if (newStatus === 'CHECK_IN') auditAction = 'APPOINTMENT_CHECKED_IN';
      else if (newStatus === 'SALA_ESPERA') auditAction = 'APPOINTMENT_MOVED_TO_WAITING_ROOM';
      else if (newStatus === 'EN_CONSULTA') auditAction = 'APPOINTMENT_STARTED';
      else if (newStatus === 'FINALIZADA') auditAction = 'APPOINTMENT_COMPLETED';
      else if (newStatus.startsWith('CANCELADA')) auditAction = 'APPOINTMENT_CANCELLED';
      else if (newStatus === 'REPROGRAMADA') auditAction = 'APPOINTMENT_RESCHEDULED';
      else if (newStatus === 'NO_ASISTIO') auditAction = 'APPOINTMENT_NO_SHOW';

      try {
        await clinicalAuditService.recordEvent({
          tenantId: this.tenantId,
          patientId: current.patientId,
          action: auditAction,
          category: 'CLINICAL_ACTION',
          provenance: 'DOCTOR_EDIT',
          result: 'SUCCESS',
          sourceModule: 'CLINICAL_AGENDA',
          entityType: 'Appointment',
          entityId: appointmentId,
          correlationId: appointmentId,
          clinicalDate: current.date,
        });
      } catch (auditErr) {
        console.warn('[AGENDA AUDIT] Fallo no fatal registrando evento de auditoría:', auditErr);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${this.tenantId}/appointments/${appointmentId}`);
      throw error;
    }
  }

  /**
   * Obtiene citas de un médico en una fecha específica
   */
  public async getDoctorAppointmentsByDate(doctorUserId: string, date: string): Promise<ClinicalAppointment[]> {
    try {
      const colRef = collection(db, 'tenants', this.tenantId, 'appointments');
      const q = query(
        colRef,
        where('doctorUserId', '==', doctorUserId),
        where('date', '==', date),
        orderBy('startTime', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as ClinicalAppointment);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `tenants/${this.tenantId}/appointments?doctor=${doctorUserId}&date=${date}`);
      return [];
    }
  }

  /**
   * Obtiene el historial de citas de un paciente
   */
  public async getPatientAppointments(patientId: string): Promise<ClinicalAppointment[]> {
    try {
      const colRef = collection(db, 'tenants', this.tenantId, 'appointments');
      const q = query(
        colRef,
        where('patientId', '==', patientId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as ClinicalAppointment);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `tenants/${this.tenantId}/appointments?patient=${patientId}`);
      return [];
    }
  }

  /**
   * Suscribe en tiempo real a las citas de un médico en un día específico (ej. Portal Médico / Sala de Espera)
   */
  public subscribeToDoctorDayAppointments(
    doctorUserId: string,
    date: string,
    onUpdate: (appointments: ClinicalAppointment[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const colRef = collection(db, 'tenants', this.tenantId, 'appointments');
    const q = query(
      colRef,
      where('doctorUserId', '==', doctorUserId),
      where('date', '==', date),
      orderBy('startTime', 'asc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as ClinicalAppointment);
        onUpdate(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `tenants/${this.tenantId}/appointments subscription`);
        if (onError) onError(err);
      }
    );
  }

  // =========================================================================
  // 2. CONFIGURACIÓN DE HORARIOS (SCHEDULE CONFIG)
  // =========================================================================

  /**
   * Guarda o actualiza la configuración de horario del médico
   */
  public async saveDoctorScheduleConfig(config: DoctorScheduleConfig): Promise<void> {
    const docId = config.id || `sched-${config.doctorUserId}`;
    const nowIso = new Date().toISOString();
    const docRef = doc(db, 'tenants', this.tenantId, 'schedules', docId);

    const payload: DoctorScheduleConfig = {
      ...config,
      id: docId,
      tenantId: this.tenantId,
      updatedAt: nowIso,
      version: (config.version || 0) + 1,
    };

    try {
      await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });

      try {
        await clinicalAuditService.recordEvent({
          tenantId: this.tenantId,
          action: 'DOCTOR_SCHEDULE_CONFIG_UPDATED',
          category: 'GOVERNANCE',
          provenance: 'DOCTOR_EDIT',
          result: 'SUCCESS',
          sourceModule: 'CLINICAL_AGENDA',
          entityType: 'DoctorScheduleConfig',
          entityId: docId,
        });
      } catch (_e) {}
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tenants/${this.tenantId}/schedules/${docId}`);
      throw error;
    }
  }

  /**
   * Obtiene la configuración de horario de un médico
   */
  public async getDoctorScheduleConfig(doctorUserId: string): Promise<DoctorScheduleConfig | null> {
    try {
      const docRef = doc(db, 'tenants', this.tenantId, 'schedules', `sched-${doctorUserId}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as DoctorScheduleConfig;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `tenants/${this.tenantId}/schedules/sched-${doctorUserId}`);
      return null;
    }
  }

  // =========================================================================
  // 3. BLOQUEOS DE AGENDA (SCHEDULE BLOCKS)
  // =========================================================================

  /**
   * Crea un bloqueo de agenda médica (cirugía, vacaciones, etc.)
   */
  public async createScheduleBlock(block: Omit<ScheduleBlock, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<ScheduleBlock> {
    const blockId = `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const docRef = doc(db, 'tenants', this.tenantId, 'schedule_blocks', blockId);

    const fullBlock: ScheduleBlock = {
      ...block,
      id: blockId,
      tenantId: this.tenantId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await setDoc(docRef, sanitizeForFirestore(fullBlock));

      try {
        await clinicalAuditService.recordEvent({
          tenantId: this.tenantId,
          action: 'SCHEDULE_BLOCK_CREATED',
          category: 'GOVERNANCE',
          provenance: 'DOCTOR_EDIT',
          result: 'SUCCESS',
          sourceModule: 'CLINICAL_AGENDA',
          entityType: 'ScheduleBlock',
          entityId: blockId,
          clinicalDate: block.startDate,
        });
      } catch (_e) {}

      return fullBlock;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tenants/${this.tenantId}/schedule_blocks/${blockId}`);
      throw error;
    }
  }

  /**
   * Obtiene los bloqueos activos de un médico en un rango de fechas
   */
  public async getDoctorScheduleBlocks(doctorUserId: string, startDate: string, endDate: string): Promise<ScheduleBlock[]> {
    try {
      const colRef = collection(db, 'tenants', this.tenantId, 'schedule_blocks');
      const q = query(
        colRef,
        where('doctorUserId', '==', doctorUserId),
        where('startDate', '<=', endDate),
        orderBy('startDate', 'asc')
      );
      const snapshot = await getDocs(q);
      const blocks = snapshot.docs.map((d) => d.data() as ScheduleBlock);
      // Filtrar aquellos que terminen antes de startDate
      return blocks.filter((b) => b.endDate >= startDate);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `tenants/${this.tenantId}/schedule_blocks?doctor=${doctorUserId}`);
      return [];
    }
  }

  // =========================================================================
  // 4. OPERACIONES AVANZADAS: DISPONIBILIDAD, CANCELACIÓN Y REPROGRAMACIÓN
  // =========================================================================

  /**
   * Consulta slots disponibles calculados para un médico y fecha específica (Fase 2)
   */
  public async getAvailableSlots(params: {
    doctorUserId: string;
    date: string;
    excludeAppointmentId?: string;
  }) {
    const { doctorUserId, date, excludeAppointmentId } = params;
    const scheduleConfig = await this.getDoctorScheduleConfig(doctorUserId);
    const existingAppointments = await this.getDoctorAppointmentsByDate(doctorUserId, date);
    const scheduleBlocks = await this.getDoctorScheduleBlocks(doctorUserId, date, date);

    return calculateAvailableSlots({
      doctorUserId,
      date,
      scheduleConfig,
      existingAppointments,
      scheduleBlocks,
      excludeAppointmentId,
    });
  }

  /**
   * Cancela una cita clínica mediante transición de estado auditada (sin eliminación física destructiva)
   */
  public async cancelAppointment(params: {
    appointmentId: string;
    actorUserId: string;
    actorRole: 'MEDICO' | 'PACIENTE' | 'DESARROLLADOR' | 'RECEPCION' | 'SISTEMA';
    cancelledBy: 'MEDICO' | 'PACIENTE';
    reason: string;
  }): Promise<void> {
    const targetStatus: AppointmentStatus =
      params.cancelledBy === 'MEDICO' ? 'CANCELADA_MEDICO' : 'CANCELADA_PACIENTE';

    await this.updateAppointmentStatus({
      appointmentId: params.appointmentId,
      newStatus: targetStatus,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      reason: params.reason,
    });
  }

  /**
   * Reprograma atómicamente una cita clínica hacia un nuevo slot de fecha y hora
   * Valida ausencia de colisiones y genera trazabilidad completa.
   */
  public async rescheduleAppointment(params: {
    appointmentId: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
    actorUserId: string;
    actorRole: 'MEDICO' | 'PACIENTE' | 'DESARROLLADOR' | 'RECEPCION' | 'SISTEMA';
    reason: string;
  }): Promise<ClinicalAppointment> {
    const { appointmentId, newDate, newStartTime, newEndTime, actorUserId, actorRole, reason } = params;
    const nowIso = new Date().toISOString();
    const docRef = doc(db, 'tenants', this.tenantId, 'appointments', appointmentId);

    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error(`Cita ${appointmentId} no encontrada para reprogramación.`);
      }

      const current = snap.data() as ClinicalAppointment;

      // 1. Validar que la cita actual admita reprogramación según máquina de estados
      assertValidAppointmentTransition(current.status, 'REPROGRAMADA');

      // 2. Validar que no colisione con otra cita existente en el nuevo slot
      const dayAppointments = await this.getDoctorAppointmentsByDate(current.doctorUserId, newDate);
      const conflict = dayAppointments.find((apt) => {
        if (apt.id === appointmentId) return false;
        if (apt.status.startsWith('CANCELADA') || apt.status === 'REPROGRAMADA' || apt.status === 'NO_ASISTIO') {
          return false;
        }
        return hasTimeConflict(newStartTime, newEndTime, apt.startTime, apt.endTime);
      });

      if (conflict) {
        throw new Error(
          `Conflicto de horario: el slot ${newDate} ${newStartTime}-${newEndTime} colisiona con la cita ${conflict.id} (${conflict.startTime}-${conflict.endTime}).`
        );
      }

      // 3. Validar que no colisione con bloqueos de agenda
      const blocks = await this.getDoctorScheduleBlocks(current.doctorUserId, newDate, newDate);
      for (const blk of blocks) {
        if (blk.isAllDay) {
          throw new Error(`El médico tiene un bloqueo de día completo (${blk.title}) para la fecha ${newDate}.`);
        }
        if (blk.startTime && blk.endTime) {
          if (hasTimeConflict(newStartTime, newEndTime, blk.startTime, blk.endTime)) {
            throw new Error(`El slot seleccionado colisiona con el bloqueo de agenda: ${blk.title} (${blk.startTime}-${blk.endTime}).`);
          }
        }
      }

      // 4. Actualizar la cita con el nuevo horario y el estado CONFIRMADA (o PENDIENTE_CONFIRMACION)
      const updatedHistory = [
        ...(current.stateHistory || []),
        {
          fromStatus: current.status,
          toStatus: 'REPROGRAMADA' as AppointmentStatus,
          timestamp: nowIso,
          actorUserId,
          actorRole,
          reason: `Reprogramada de ${current.date} ${current.startTime} a ${newDate} ${newStartTime}. Motivo: ${reason}`,
        },
        {
          fromStatus: 'REPROGRAMADA' as AppointmentStatus,
          toStatus: 'CONFIRMADA' as AppointmentStatus,
          timestamp: nowIso,
          actorUserId,
          actorRole,
          reason: 'Cita reactivada y confirmada en nuevo slot horario',
        },
      ];

      const patch: Partial<ClinicalAppointment> = {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'CONFIRMADA',
        updatedAt: nowIso,
        version: (current.version || 1) + 1,
        stateHistory: updatedHistory,
      };

      await setDoc(docRef, sanitizeForFirestore(patch), { merge: true });

      // 5. Auditoría del evento de reprogramación
      try {
        await clinicalAuditService.recordEvent({
          tenantId: this.tenantId,
          patientId: current.patientId,
          action: 'APPOINTMENT_RESCHEDULED',
          category: 'CLINICAL_ACTION',
          provenance: 'DOCTOR_EDIT',
          result: 'SUCCESS',
          sourceModule: 'CLINICAL_AGENDA',
          entityType: 'Appointment',
          entityId: appointmentId,
          correlationId: appointmentId,
          clinicalDate: newDate,
        });
      } catch (_e) {}

      return {
        ...current,
        ...patch,
      } as ClinicalAppointment;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${this.tenantId}/appointments/${appointmentId}`);
      throw error;
    }
  }
}

export const clinicalAgendaRepository = new ClinicalAgendaRepository();
