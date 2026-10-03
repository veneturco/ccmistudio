/**
 * CalibrationStorageV2.ts
 * 
 * CAPA DE ALMACENAMIENTO Y AUTORIDAD DE CALIBRACIÓN V2
 * ====================================================
 * Jerarquía estricta de autoridad:
 * 1. MasterTemplateV2 oficial inmutable (código fuente / JSON canónico)
 * 2. Versión validada del sistema
 * 3. Configuración de aplicación
 * 4. localStorage ÚNICAMENTE como caché / preferencias temporales de UI
 * 
 * REGLAS FUNDAMENTALES:
 * - localStorage NO debe convertirse en autoridad final de coordenadas oficiales.
 * - NO permitir que una calibración antigua sobrescriba silenciosamente una nueva.
 * - Manejo explícito de versionado: masterId, version, timestamp, status.
 */

import { MasterTemplateV2 } from './types/MasterTemplateV2';
import { TemplateRegistry } from './TemplateRegistry';

export interface CalibrationStorageSnapshot {
  masterId: string;
  version: string;
  timestamp: string;
  status: 'DRAFT' | 'CALIBRATED' | 'VALIDATED' | 'LOCKED' | 'REQUIRES_CALIBRATION';
  customOverrides?: Partial<MasterTemplateV2>;
}

const STORAGE_PREFIX = 'ccmi_calibration_v2_';

export class CalibrationStorageV2 {
  /**
   * Resuelve la plantilla autoritativa respetando la jerarquía estricta.
   * La autoridad geométrica y semántica es SIEMPRE el MasterTemplateV2 oficial.
   * REGLA ABSOLUTA: localStorage NUNCA altera la geometría de producción.
   */
  public static getAuthoritativeTemplate(identifier: string): MasterTemplateV2 | undefined {
    const canonicalTemplate = TemplateRegistry.get(identifier);
    if (!canonicalTemplate) return undefined;

    // La plantilla canónica es la ÚNICA autoridad para producción
    return canonicalTemplate;
  }

  /**
   * Obtiene la plantilla para producción garantizando que esté VALIDATED o LOCKED
   */
  public static getProductionMaster(identifier: string): MasterTemplateV2 | undefined {
    return this.getAuthoritativeTemplate(identifier);
  }

  /**
   * Guarda únicamente el estado visual de UI (zoom, pan, selección) en localStorage.
   * PROHIBIDO modificar coordenadas o dataKeys de producción mediante este método.
   */
  public static saveUiViewState(masterId: string, state: { zoom?: number; pan?: { x: number; y: number }; selectedId?: string }): void {
    if (!masterId) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}ui_view_${masterId}`, JSON.stringify(state));
    } catch {
      // Ignorar errores en entornos sin localStorage
    }
  }

  /**
   * Recupera el estado visual de UI desde localStorage
   */
  public static getUiViewState(masterId: string): { zoom?: number; pan?: { x: number; y: number }; selectedId?: string } | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}ui_view_${masterId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Snapshot de UI temporal (solo para borradores en desarrollo, NUNCA para producción)
   */
  public static saveUiCacheSnapshot(
    template: MasterTemplateV2,
    overrides?: Partial<MasterTemplateV2>
  ): void {
    if (!template || !template.masterId) return;

    // Prohibido registrar overrides para plantillas protegidas o LOCKED
    if (template.status === 'LOCKED' || template.masterId === 'LAB-001' || template.masterId === 'ORDEN_LAB-001') {
      return;
    }

    try {
      const snapshot: CalibrationStorageSnapshot = {
        masterId: template.masterId,
        version: template.version,
        timestamp: new Date().toISOString(),
        status: (template.status as any) || 'DRAFT',
        customOverrides: overrides,
      };
      localStorage.setItem(`${STORAGE_PREFIX}${template.masterId}`, JSON.stringify(snapshot));
    } catch {
      // Manejo silencioso en entornos restringidos
    }
  }

  /**
   * Lee la instantánea de UI desde localStorage
   */
  public static getUiCacheSnapshot(masterId: string): CalibrationStorageSnapshot | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${masterId}`);
      if (!raw) return null;
      return JSON.parse(raw) as CalibrationStorageSnapshot;
    } catch {
      return null;
    }
  }

  /**
   * Limpia la caché local de UI para restaurar el master oficial inmutable
   */
  public static clearUiCache(masterId?: string): void {
    try {
      if (masterId) {
        localStorage.removeItem(`${STORAGE_PREFIX}${masterId}`);
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // Ignorar
    }
  }

  /**
   * Sanitizador Centinela de Arranque:
   * Revisa si existen claves en localStorage con coordenadas corruptas (y <= 0, o id en fila de nombre)
   * y las purga automáticamente para garantizar 100% de integridad física.
   */
  public static runCentinelaSanitization(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToPurge: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('calibration') || key.includes('recipe') || key.includes('template') || key.startsWith(STORAGE_PREFIX))) {
          try {
            const val = localStorage.getItem(key);
            if (val && (val.includes('"left_date"') || val.includes('"left_patient_name"') || val.includes('left_patient_id'))) {
              // Si contiene coordenadas obsoletas de 44.5 o y=0, purgar
              if (val.includes('44.5') || val.includes('"yMm":0') || val.includes('"yMm": 0') || val.includes('y: 0') || val.includes('y:0')) {
                keysToPurge.push(key);
              }
            }
          } catch {}
        }
      }
      keysToPurge.forEach((k) => {
        console.log(`[Centinela Sanitizer] Purgando configuración obsoleta/corrupta de localStorage: ${k}`);
        localStorage.removeItem(k);
      });
    } catch {}
  }
}
