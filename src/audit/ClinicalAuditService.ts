/**
 * ClinicalAuditService.ts
 * ==============================================================================
 * Servicio Centralizado de Auditoría Clínica y Trazabilidad Médica
 * Dr. Samir Moucharrafie Naime (CCMI)
 * ==============================================================================
 */

export interface ClinicalAuditEvent {
  action: string;
  category: string;
  sourceModule: string;
  entityType: string;
  entityId: string;
  patientId?: string;
  previousVersion?: number;
  resultingVersion?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

class ClinicalAuditServiceImpl {
  private events: ClinicalAuditEvent[] = [];

  public recordEvent(event: ClinicalAuditEvent): void {
    const enrichedEvent: ClinicalAuditEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    this.events.push(enrichedEvent);
    if (this.events.length > 500) {
      this.events.shift();
    }
  }

  public getEvents(): ClinicalAuditEvent[] {
    return [...this.events];
  }

  public getEventsByPatient(patientId: string): ClinicalAuditEvent[] {
    return this.events.filter((e) => e.patientId === patientId);
  }
}

export const clinicalAuditService = new ClinicalAuditServiceImpl();
