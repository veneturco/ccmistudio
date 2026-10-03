/**
 * TemplateRegistry.ts
 * 
 * REGISTRO DINÁMICO DE PLANTILLAS MAESTRAS (ARQUITECTURA V2)
 * ==========================================================
 * Permite registrar, consultar y gestionar plantillas MasterTemplateV2
 * sin necesidad de modificar múltiples archivos al incorporar nuevos documentos
 * (ej: AUTORIZACION-001, RECIBO-001, ORDEN-IMAGEN-001).
 * 
 * Jerarquía de autoridad:
 * 1. MasterTemplateV2 oficial validado
 * 2. Registro dinámico en memoria
 */

import { MasterTemplateV2 } from './types/MasterTemplateV2';
import {
  RECIPE_MASTER_V2,
  CONSTANCIA_MASTER_V2,
  INFORME_MASTER_V2,
  HISTORIA_MASTER_V2,
  LAB_ORDER_MASTER_V2,
  setMasterTemplateV2,
  getMasterTemplateV2,
} from './MasterRegistryV2';

export class TemplateRegistry {
  private static templates: Map<string, MasterTemplateV2> = new Map();
  private static initialized: boolean = false;

  /**
   * Inicializa el registro cargando los 5 masters canónicos del sistema si no están ya registrados
   */
  public static ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Registrar los cinco documentos maestros por defecto solo si no fueron ya registrados
    if (!this.templates.has('RECIPES-001') && !this.templates.has('RECIPE-001')) {
      this.register(RECIPE_MASTER_V2);
    }
    if (!this.templates.has('CONSTANCIA-001') && !this.templates.has('CERTIFICATE-001')) {
      this.register(CONSTANCIA_MASTER_V2);
    }
    if (!this.templates.has('INFORME-001') && !this.templates.has('REPORT-001')) {
      this.register(INFORME_MASTER_V2);
    }
    if (!this.templates.has('HISTORIA-001') && !this.templates.has('HISTORY-001')) {
      this.register(HISTORIA_MASTER_V2);
    }
    if (!this.templates.has('LAB_ORDER-001') && !this.templates.has('LAB-001')) {
      this.register(LAB_ORDER_MASTER_V2);
    }
  }

  /**
   * Registra o actualiza una plantilla maestra en el catálogo
   */
  public static register(template: MasterTemplateV2): void {
    if (!template || !template.masterId) {
      throw new Error('[TemplateRegistry] Plantilla inválida: falta masterId.');
    }
    this.ensureInitialized();
    // Indexar tanto por masterId ('RECIPE-001') como por documentType ('recipe')
    this.templates.set(template.masterId.toUpperCase(), template);
    this.templates.set(template.masterId.toLowerCase(), template);
    setMasterTemplateV2(template.masterId, template);
    if (template.documentType) {
      this.templates.set(template.documentType.toUpperCase(), template);
      this.templates.set(template.documentType.toLowerCase(), template);
      setMasterTemplateV2(template.documentType, template);
    }
  }

  /**
   * Obtiene una plantilla maestra por su ID ('RECIPE-001') o tipo ('recipe')
   * Siempre hidrata con las calibraciones guardadas en localStorage si están disponibles
   */
  public static get(identifier: string): MasterTemplateV2 | undefined {
    this.ensureInitialized();
    if (!identifier) return undefined;
    
    // 1. Intentar obtener a través de MasterRegistryV2 con hidratación de calibraciones
    const master = getMasterTemplateV2(identifier);
    if (master) return master;

    // 2. Fallback a templates en memoria
    const cached = (
      this.templates.get(identifier.toUpperCase()) ||
      this.templates.get(identifier.toLowerCase()) ||
      this.templates.get(identifier)
    );
    return cached ? (getMasterTemplateV2(cached.documentType || cached.masterId) || cached) : undefined;
  }

  /**
   * Comprueba si una plantilla está registrada
   */
  public static has(identifier: string): boolean {
    this.ensureInitialized();
    if (!identifier) return false;
    return (
      this.templates.has(identifier.toUpperCase()) ||
      this.templates.has(identifier.toLowerCase())
    );
  }

  /**
   * Retorna todas las plantillas únicas registradas
   */
  public static getAll(): MasterTemplateV2[] {
    this.ensureInitialized();
    const unique = new Map<string, MasterTemplateV2>();
    for (const t of this.templates.values()) {
      unique.set(t.masterId, t);
    }
    return Array.from(unique.values());
  }

  /**
   * Limpia y reinicia el registro (útil para pruebas de integración)
   */
  public static reset(): void {
    this.templates.clear();
    this.initialized = false;
  }
}
