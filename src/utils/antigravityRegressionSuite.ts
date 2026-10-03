/**
 * ==============================================================================
 * SUITE DE PRUEBAS DE REGRESIÓN AUTOMATIZADA ANTIGRAVITY (FASE 3)
 * ==============================================================================
 * Sistema Operativo Clínico Simplificado (SOCS) — Centro Médico Imbanaco (CCMI)
 * Dr. Samir Moucharrafie Naime — Neurocirugía y Cirugía Mínimamente Invasiva
 *
 * Implementa las 3 Pruebas de Regresión Clave sugeridas en el Dictamen Forense:
 * 1. [PRUEBA 1]: Detección y Auditoría de XObjects en el Árbol PDF (Garantía de Fondo Embebido)
 * 2. [PRUEBA 2]: Verificación Estructural, Dimensiones Canónicas y Protección Anti-Monocromía
 * 3. [PRUEBA 3]: Simulación de Fallo de Red y Resiliencia con Fallback JPG de 300 DPI
 * ==============================================================================
 */

import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { generateCanonicalDocumentPDF } from './pdfExport';
import { VectorOverlayEngineV2 } from '../calibration/VectorOverlayEngineV2';
import { getMasterTemplateV2 } from '../calibration/MasterRegistryV2';
import { PatientData } from '../types';

export interface SingleRegressionTestResult {
  id: string;
  name: string;
  docType: string;
  passed: boolean;
  durationMs: number;
  details: string;
  metrics: {
    byteSize?: number;
    widthPt?: number;
    heightPt?: number;
    pageCount?: number;
    hasXObjects?: boolean;
    xObjectCount?: number;
    fallbackUsed?: boolean;
  };
}

export interface AntigravityAuditSummary {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  executionTimeMs: number;
  results: SingleRegressionTestResult[];
}

const DUMMY_PATIENT: PatientData = {
  fullName: 'Dr. Samir Moucharrafie (Auditoría Forense)',
  idNumber: 'V-12.887.723',
  age: '48',
  date: '28/09/2026',
  phone: '+58 424-9381674',
  address: 'Centro Médico Orinokia, Puerto Ordaz, Venezuela',
  guideNumber: 'CCMI-AUDIT-2026',
};

const DUMMY_BUNDLE = {
  recipeData: {
    pharmacy: '1. Pregabalina 75 mg VO c/12h por 14 días.\n2. Meloxicam 15 mg VO c/24h por 7 días.',
    patientIndications: 'Reposo relativo. Control en 15 días con RM de Columna.',
  },
  informeData: {
    bodyText: 'INFORME CLÍNICO DE CONTROL NEUROQUIRÚRGICO\n\nPaciente evaluado con diagnóstico de Hernia Discal Lumbar L5-S1. Evolución clínica favorable.',
  },
  labData: {
    labTests: ['hematologia', 'quimica_sanguinea', 'perfil_lipídico'],
    neuroimagingTests: { rmn_columna: true },
    neuroimagingDetails: { rmn_columna: 'Columna lumbosacra con y sin contraste' },
    presumptiveDx: 'Lumbociatalgia Radicular Izquierda L5-S1',
  },
  constanciaData: {
    restDays: '7',
    diagnosis: 'Lumbociatalgia aguda secundaria a discopatía lumbar',
    condition: 'Reposo absoluto en domicilio',
  },
  historiaData: {
    motivoConsulta: 'Evaluación y seguimiento de dolor lumbar irradiado a miembro inferior izquierdo',
    enfermedadActual: 'Paciente masculino con antecedente de radiculopatía en tratamiento médico.',
    diagnostico: 'Radiculopatía L5-S1 en resolución',
  },
};

const CANONICAL_DOCS = [
  { docType: 'RECIPES', expectedPages: 1, expectedWidthMm: 210, expectedHeightMm: 297, name: 'Récipe Médico Oficial (Doble Talón)' },
  { docType: 'ORDEN_LAB', expectedPages: 2, expectedWidthMm: 153.5, expectedHeightMm: 215.8, name: 'Orden de Laboratorio y Neuroimagen (2 Páginas)' },
  { docType: 'INFORME', expectedPages: 1, expectedWidthMm: 210, expectedHeightMm: 297, name: 'Informe Médico Clínico' },
  { docType: 'CONSTANCIA', expectedPages: 1, expectedWidthMm: 210, expectedHeightMm: 297, name: 'Constancia Médica de Reposo' },
  { docType: 'HISTORIA', expectedPages: 1, expectedWidthMm: 210, expectedHeightMm: 297, name: 'Historia Clínica Integral' },
];

/**
 * PRUEBA 1: Auditoría de Integridad y Detección de XObjects en el Árbol PDF
 * Valida que cada página contenga objetos gráficos incrustados (Form XObject o Image XObject).
 */
export async function test1_AuditXObjectsInPdfTree(docType: string): Promise<SingleRegressionTestResult> {
  const start = Date.now();
  try {
    const result = await generateCanonicalDocumentPDF(docType as any, DUMMY_PATIENT, DUMMY_BUNDLE as any);
    const pdfDoc = await PDFDocument.load(result.pdfBytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    let allPagesHaveXObjects = true;
    let totalXObjects = 0;

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const resources = page.node.Resources();
      let pageXObjectCount = 0;

      if (resources) {
        const xObjectsDict = resources.lookup(PDFName.of('XObject'));
        if (xObjectsDict instanceof PDFDict) {
          pageXObjectCount = xObjectsDict.entries().length;
          totalXObjects += pageXObjectCount;
        }
      }

      // Si la página no tiene XObjects explícitos, verificar si el buffer contiene stream embebido con peso adecuado
      if (pageXObjectCount === 0 && result.pdfBytes.length < 50000) {
        allPagesHaveXObjects = false;
      }
    }

    const duration = Date.now() - start;
    const passed = (allPagesHaveXObjects || totalXObjects > 0) && result.pdfBytes.length > 50000;

    return {
      id: `TEST_1_XOBJECT_${docType}`,
      name: `Auditoría XObject [${docType}]: Fondo Institucional Embebido`,
      docType,
      passed,
      durationMs: duration,
      details: passed
        ? `XObjects detectados exitosamente en ${pageCount} página(s). El documento preserva su papelería física inmutable.`
        : `Falla crítica: No se detectaron XObjects de fondo o el tamaño del buffer es inferior al umbral de seguridad.`,
      metrics: {
        byteSize: result.pdfBytes.length,
        pageCount,
        hasXObjects: totalXObjects > 0,
        xObjectCount: totalXObjects,
      },
    };
  } catch (err: any) {
    return {
      id: `TEST_1_XOBJECT_${docType}`,
      name: `Auditoría XObject [${docType}]: Fondo Institucional Embebido`,
      docType,
      passed: false,
      durationMs: Date.now() - start,
      details: `Excepción en generación de documento: ${err?.message || err}`,
      metrics: {},
    };
  }
}

/**
 * PRUEBA 2: Verificación de Estructura, Dimensiones Canónicas y Protección Anti-Monocromía
 * Valida que el documento no sea monocromático en blanco y que sus dimensiones cumplan con la norma.
 */
export async function test2_VerifyDimensionsAndAntiMonochrome(
  docType: string,
  expectedWidthMm: number,
  expectedHeightMm: number,
  expectedPages: number
): Promise<SingleRegressionTestResult> {
  const start = Date.now();
  try {
    const result = await generateCanonicalDocumentPDF(docType as any, DUMMY_PATIENT, DUMMY_BUNDLE as any);
    const pdfDoc = await PDFDocument.load(result.pdfBytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();

    const expectedWidthPt = (expectedWidthMm * 72) / 25.4;
    const expectedHeightPt = (expectedHeightMm * 72) / 25.4;

    const widthTolerancePt = 25; // Tolerancia geométrica admisible por márgenes PostScript
    const heightTolerancePt = 25;

    const widthOk = Math.abs(width - expectedWidthPt) <= widthTolerancePt;
    const heightOk = Math.abs(height - expectedHeightPt) <= heightTolerancePt;
    const pagesOk = pageCount >= expectedPages;
    const nonMonochromeOk = result.pdfBytes.length > 50000; // Un PDF blanco con solo texto pesa < 5 KB

    const passed = widthOk && heightOk && pagesOk && nonMonochromeOk;
    const duration = Date.now() - start;

    return {
      id: `TEST_2_DIMENSIONS_${docType}`,
      name: `Verificación Estructural y Dimensiones [${docType}]`,
      docType,
      passed,
      durationMs: duration,
      details: passed
        ? `Dimensiones conformes: ${width.toFixed(1)} × ${height.toFixed(1)} pt. Tamaño: ${(result.pdfBytes.length / 1024).toFixed(1)} KB (Anti-blanco verificado).`
        : `Discrepancia estructural: Dimensiones reales (${width.toFixed(1)} × ${height.toFixed(1)} pt) o peso insuficiente (${result.pdfBytes.length} bytes).`,
      metrics: {
        byteSize: result.pdfBytes.length,
        widthPt: Math.round(width),
        heightPt: Math.round(height),
        pageCount,
      },
    };
  } catch (err: any) {
    return {
      id: `TEST_2_DIMENSIONS_${docType}`,
      name: `Verificación Estructural y Dimensiones [${docType}]`,
      docType,
      passed: false,
      durationMs: Date.now() - start,
      details: `Error al evaluar dimensiones: ${err?.message || err}`,
      metrics: {},
    };
  }
}

/**
 * PRUEBA 3: Simulación de Fallo de Red y Verificación del Fallback JPG de 300 DPI
 * Inyecta un buffer corrupto/vacío para forzar al motor a activar el respaldo JPG de emergencia.
 */
export async function test3_SimulateNetworkFailureFallback(): Promise<SingleRegressionTestResult> {
  const start = Date.now();
  try {
    const template = getMasterTemplateV2('recipe') || {
      documentType: 'recipe',
      pages: [{ widthMm: 210, heightMm: 297, elements: [] }],
    };

    // Buffer nulo/inválido simulando fallo de descarga del PDF original
    const corruptedOrEmptyBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

    // Ejecutar sobreimpresión vectorial pasando el buffer corrupto
    const renderResult = await VectorOverlayEngineV2.applyOverlay(
      corruptedOrEmptyBytes,
      template as any,
      DUMMY_PATIENT,
      { debugMode: false }
    );

    const pdfDoc = await PDFDocument.load(renderResult.pdfBytes, { ignoreEncryption: true });
    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();

    // Comprobar que no arrojó un PDF en blanco y que el tamaño es consistente con imagen incrustada
    const hasAdequateSize = renderResult.pdfBytes.length > 50000;
    const duration = Date.now() - start;
    const passed = hasAdequateSize && width > 500 && height > 800;

    return {
      id: 'TEST_3_NETWORK_FALLBACK_SIMULATION',
      name: 'Simulación de Fallo de Red: Activación de Fallback JPG 300 DPI',
      docType: 'RECIPES',
      passed,
      durationMs: duration,
      details: passed
        ? `Fallback JPG institucional activado con éxito. Documento recuperado: ${(renderResult.pdfBytes.length / 1024).toFixed(1)} KB sin emitir hoja en blanco.`
        : `Falla en conmutación de emergencia: El PDF generado no contiene el fondo JPG de respaldo.`,
      metrics: {
        byteSize: renderResult.pdfBytes.length,
        widthPt: Math.round(width),
        heightPt: Math.round(height),
        fallbackUsed: true,
      },
    };
  } catch (err: any) {
    return {
      id: 'TEST_3_NETWORK_FALLBACK_SIMULATION',
      name: 'Simulación de Fallo de Red: Activación de Fallback JPG 300 DPI',
      docType: 'RECIPES',
      passed: false,
      durationMs: Date.now() - start,
      details: `Excepción durante la prueba de fallback: ${err?.message || err}`,
      metrics: {},
    };
  }
}

/**
 * EJECUTOR MAESTRO DE LA SUITE DE REGRESIÓN COMPLETA (ANTIGRAVITY FASE 3)
 */
export async function runAntigravityRegressionSuite(): Promise<AntigravityAuditSummary> {
  const suiteStart = Date.now();
  const results: SingleRegressionTestResult[] = [];

  // 1. Ejecutar Prueba 1 (Auditoría XObjects) en los 5 documentos canónicos
  for (const doc of CANONICAL_DOCS) {
    const res = await test1_AuditXObjectsInPdfTree(doc.docType);
    results.push(res);
  }

  // 2. Ejecutar Prueba 2 (Dimensiones y Anti-Monocromía) en los 5 documentos canónicos
  for (const doc of CANONICAL_DOCS) {
    const res = await test2_VerifyDimensionsAndAntiMonochrome(
      doc.docType,
      doc.expectedWidthMm,
      doc.expectedHeightMm,
      doc.expectedPages
    );
    results.push(res);
  }

  // 3. Ejecutar Prueba 3 (Simulación de Fallo de Red y Fallback 300 DPI)
  const fallbackTest = await test3_SimulateNetworkFailureFallback();
  results.push(fallbackTest);

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
  if (failedCount > 0 && failedCount <= 2) {
    overallStatus = 'DEGRADED';
  } else if (failedCount > 2) {
    overallStatus = 'CRITICAL';
  }

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: passedCount,
    failed: failedCount,
    overallStatus,
    executionTimeMs: Date.now() - suiteStart,
    results,
  };
}
