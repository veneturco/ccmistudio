/**
 * TestCalibrationRunner.ts
 * 
 * GENERADOR DE DOCUMENTOS DE CALIBRACIÓN Y PRUEBA RIGUROSA (V2)
 * ==============================================================
 * REGLA ESTRICTA:
 * NO utilizar datos clínicos ficticios que parezcan datos reales de pacientes.
 * Utiliza exclusivamente marcadores claros y estandarizados para evaluar la robustez física:
 * - "PACIENTE DE PRUEBA EXTREMA CALIBRACIÓN V2 CON APELLIDOS COMPUESTOS"
 * - "V-99.999.999"
 * - "99 años"
 * - "DIAGNÓSTICO DE PRUEBA: HERNIA DISCAL L4-L5 CON COMPRESIÓN RADICULAR SEVERA Y LUMBALGIA CRÓNICA RESISTENTE AL TRATAMIENTO CONSERVADOR EN FASE DE CALIBRACIÓN DE CAMPO MULTILÍNEA"
 * - Fórmulas de récipe largas con indicaciones detalladas
 * - Verificación de checkboxes y estampados
 */

import { MasterTemplateV2 } from './types/MasterTemplateV2';
import { TemplateRegistry } from './TemplateRegistry';
import { OverlayRenderer, OverlayExecutionReport } from './OverlayRenderer';
import { DataResolver } from './DataResolver';
import { CalibrationEngineV2 } from './CalibrationEngineV2';

export interface TestDocumentGenerationOptions {
  debugMode?: boolean; // CALIBRATION DEBUG MODE con bboxes y coordenadas
  doctorStampBase64?: string;
}

export class TestCalibrationRunner {
  /**
   * Genera el diccionario semántico artificial de calibración extrema
   */
  public static getRigorousTestDictionary(): Record<string, any> {
    return {
      patient: {
        fullName: 'PACIENTE DE PRUEBA EXPERIMENTAL CON NOMBRE EXTENSO PARA VERIFICACIÓN DE SHRINK',
        idNumber: 'V-99.999.999',
        age: '88 años',
        phone: '0414-000.00.00',
        address: 'CALLE DE PRUEBA 123, URBANIZACIÓN LOS OLIVOS, PUERTO ORDAZ',
        date: '12/09/2026',
      },
      clinical: {
        diagnosisPrincipal:
          'DIAGNÓSTICO DE PRUEBA: RADICULOPATÍA LUMBAR L5-S1 DERECHA CRÓNICA SECUNDARIA A DISCOPATÍA DEGENERATIVA MODIC II CON ESTENOSIS FORAMINAL SEVERA (TEXTO DE AUDITORÍA VECTORIAL)',
        motivo:
          'CONSULTA DE PRUEBA: EVALUACIÓN SISTÉMICA DE CALIBRACIÓN Y AUDITORÍA DE INYECCIÓN VECTORIAL SIN DESBORDAMIENTO',
        enfermedad:
          'PACIENTE DE PRUEBA REFIERE CUADRO CLÍNICO DE VARIOS MESES DE EVOLUCIÓN CARACTERIZADO POR DOLOR EN REGIÓN LUMBAR IRRADIADO A MIEMBRO INFERIOR DERECHO QUE NO CEDE CON ANALGÉSICOS HABITUALES.',
        antecedentes:
          'HIPERTENSIÓN ARTERIAL CONTROLADA EN TRATAMIENTO DE PRUEBA. NIEGA ALERGIAS MEDICAMENTOSAS.',
        examen:
          'MARCHA CON CLAUDICACIÓN ANTIÁLGICA DERECHA. LASEGUE POSITIVO A 45 GRADOS DERECHO. FUERZA MUSCULAR 4/5 EN EXTENSIÓN DEL HALLUX DERECHO.',
        diagnostico:
          'DIAGNÓSTICO DE PRUEBA: RADICULOPATÍA LUMBAR L5-S1 DERECHA CRÓNICA SECUNDARIA A DISCOPATÍA DEGENERATIVA MODIC II',
      },
      recipe: {
        pharmacy:
          '1. PREGABALINA 75 MG CÁPSULAS - DISPENSAR: 60 CÁPSULAS (TRATAMIENTO DE PRUEBA)\n2. CELECOXIB 200 MG CÁPSULAS - DISPENSAR: 30 CÁPSULAS\n3. TRAMADOL / PARACETAMOL 37.5/325 MG - DISPENSAR: 20 COMPRIMIDOS',
        indications:
          '1. PREGABALINA 75 MG: TOMAR 1 CÁPSULA VÍA ORAL CADA 12 HORAS POR 30 DÍAS.\n2. CELECOXIB 200 MG: TOMAR 1 CÁPSULA VÍA ORAL CADA 24 HORAS CON ALIMENTOS.\n3. TRAMADOL / PARACETAMOL: TOMAR 1 COMPRIMIDO VÍA ORAL CADA 8 HORAS EN CASO DE DOLOR MODERADO A SEVERO.',
        rxBody:
          '1. PREGABALINA 75 MG CÁPSULAS - DISPENSAR: 60 CÁPSULAS\n2. CELECOXIB 200 MG - DISPENSAR: 30 CÁPSULAS',
        indicationsBody:
          '1. PREGABALINA 75 MG: 1 CÁPSULA CADA 12 HORAS POR 30 DÍAS.\n2. CELECOXIB 200 MG: 1 CÁPSULA CADA 24 HORAS.',
      },
      report: {
        body:
          'INFORME MÉDICO DE PRUEBA: SE HACE CONSTAR QUE EL PACIENTE DE PRUEBA ACUDE A EVALUACIÓN MÉDICA ESPECIALIZADA POR CUADRO DE RADICULOPATÍA LUMBAR CRÓNICA. SE REALIZAN ESTUDIOS COMPLEMENTARIOS Y SE PROPONE PLAN TERAPÉUTICO DE INTERVENCIÓN CONSERVADORA CON REPOSO RELATIVO Y REEVALUACIÓN EN 15 DÍAS.',
      },
      certificate: {
        diagnosis:
          'DIAGNÓSTICO DE PRUEBA PARA CONSTANCIA MÉDICA DE AUDITORÍA Y CALIBRACIÓN',
        narrative:
          'SE HACE CONSTAR QUE EL PACIENTE DE PRUEBA AMERITA REPOSO MÉDICO LABORAL POR UN PERÍODO DE TRES (03) DÍAS CONTINUOS A PARTIR DE LA PRESENTE FECHA PARA TRATAMIENTO Y REPOSO.',
      },
      history: {
        clinical: {
          motivo: 'EVALUACIÓN DE PRUEBA V2',
          enfermedad: 'ENFERMEDAD ACTUAL DE PRUEBA V2',
          antecedentes: 'ANTECEDENTES DE PRUEBA V2',
          examen: 'EXAMEN FÍSICO DE PRUEBA V2',
          diagnostico: 'DIAGNÓSTICO DE PRUEBA V2',
        },
      },
      lab: {
        checkbox: {
          hematologia_completa: true,
          glicemia: true,
          urea: true,
          creatinina: true,
          hiv: true,
          vdrl: true,
        },
      },
      neuroimaging: {
        rmn: true,
        tac: false,
        radiologia: true,
        eeg: false,
        emg: true,
        pess: false,
        valoracion: true,
      },
      document: {
        date: '12/09/2026',
        type: 'test_calibration',
      },
      doctor: {
        name: 'Dr. Samir Moucharrafie Naime',
        specialty: 'Especialista en Neurocirugía (UCBL Lyon 1 - Francia)',
        mpps: '61231',
        cmeb: '5331',
      },
    };
  }

  /**
   * Genera el PDF de prueba de un documento específico utilizando su PDF original
   */
  public static async generateTestPdf(
    documentIdentifier: string,
    originalPdfBytes: Uint8Array,
    options: TestDocumentGenerationOptions = {}
  ): Promise<OverlayExecutionReport> {
    const template = TemplateRegistry.get(documentIdentifier);
    if (!template) {
      throw new Error(`[TestCalibrationRunner] Plantilla '${documentIdentifier}' no encontrada.`);
    }

    const testDictionary = this.getRigorousTestDictionary();

    return await OverlayRenderer.render(originalPdfBytes, template, testDictionary, {
      debugMode: options.debugMode !== undefined ? options.debugMode : true,
      doctorStampBase64: options.doctorStampBase64,
    });
  }
}
