/**
 * clinicalValidation.ts
 * 
 * PILAR 4: VALIDACIÓN CLÍNICA Y SEGURIDAD MÉDICO-LEGAL
 * ===================================================
 * Guarda Pre-Emisión: Validador clínico que verifica requisitos mínimos
 * indispensables antes de generar y emitir cualquier documento médico oficial.
 */

import { DocType, PatientData } from '../types';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export class ClinicalValidationGuard {
  /**
   * Valida la coherencia de datos antes de permitir la emisión del PDF oficial.
   */
  public static validate(
    docType: DocType,
    patient: PatientData,
    clinicalData: {
      recipeData?: {
        medications?: Array<{ drug?: string; dose?: string; frequency?: string; duration?: string }>;
        generalIndications?: string[];
      };
      informeData?: {
        diagnosisPrincipal?: string;
        clinicalReport?: string;
      };
      constanciaData?: {
        attendedDate?: string;
        restDays?: number;
        restFrom?: string;
        restTo?: string;
        diagnosisPrincipal?: string;
      };
      historiaData?: {
        consultReason?: string;
        currentIllness?: string;
        diagnosis?: string;
      };
      labData?: {
        testsSelectedCount?: number;
        presumptiveDiagnosis?: string;
      };
    }
  ): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // 1. Validación de Datos Demográficos del Paciente (Universal)
    if (!patient.fullName || patient.fullName.trim().length < 3) {
      errors.push({
        field: 'patient.fullName',
        message: 'El nombre completo del paciente es obligatorio (mínimo 3 caracteres).',
        severity: 'error',
      });
    }

    const cleanCedula = ((patient.nationalId || patient.idNumber) || '').replace(/[^\d]/g, '');
    if (!cleanCedula || cleanCedula.length < 5) {
      warnings.push({
        field: 'patient.idNumber',
        message: 'La cédula de identidad parece incompleta o ausente.',
        severity: 'warning',
      });
    }

    // 2. Validación Específica según Tipo de Documento
    switch (docType) {
      case 'RECIPES': {
        const meds = clinicalData.recipeData?.medications || [];
        const validMeds = meds.filter((m) => m.drug && m.drug.trim().length > 0);
        if (validMeds.length === 0) {
          warnings.push({
            field: 'recipe.medications',
            message: 'No ha añadido ningún medicamento al récipe médico.',
            severity: 'warning',
          });
        } else {
          validMeds.forEach((m, idx) => {
            if (!m.dose && !m.frequency) {
              warnings.push({
                field: `recipe.medications[${idx}]`,
                message: `El medicamento "${m.drug}" no tiene especificada la dosis o frecuencia de administración.`,
                severity: 'warning',
              });
            }
          });
        }
        break;
      }

      case 'INFORME': {
        const report = clinicalData.informeData?.clinicalReport || '';
        const dx = clinicalData.informeData?.diagnosisPrincipal || '';
        if (!dx.trim() && !report.trim()) {
          errors.push({
            field: 'informe.content',
            message: 'El informe médico requiere un diagnóstico principal o contenido clínico descriptivo.',
            severity: 'error',
          });
        }
        break;
      }

      case 'CONSTANCIA': {
        const restDays = clinicalData.constanciaData?.restDays;
        if (restDays === undefined || restDays === null || restDays < 0) {
          warnings.push({
            field: 'constancia.restDays',
            message: 'No se han especificado los días de reposo recomendados.',
            severity: 'warning',
          });
        }
        break;
      }

      case 'HISTORIA': {
        const motivo = clinicalData.historiaData?.consultReason || '';
        const enfermedad = clinicalData.historiaData?.currentIllness || '';
        if (!motivo.trim() && !enfermedad.trim()) {
          warnings.push({
            field: 'historia.content',
            message: 'La historia clínica no tiene motivo de consulta ni descripción de la enfermedad actual.',
            severity: 'warning',
          });
        }
        break;
      }

      case 'ORDEN_LAB': {
        const count = clinicalData.labData?.testsSelectedCount || 0;
        if (count === 0) {
          warnings.push({
            field: 'lab.tests',
            message: 'No se ha seleccionado ninguna prueba de laboratorio o estudio de neuroimagen.',
            severity: 'warning',
          });
        }
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      canProceed: errors.length === 0,
      errors,
      warnings,
    };
  }
}
