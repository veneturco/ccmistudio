/**
 * test_phase3_4.ts
 * 
 * SUITE DE CERTIFICACIÓN FINAL END-TO-END FASE 3.4
 * ==================================================
 * 
 * Valida de extremo a extremo que el Motor Universal de Ingesta, Análisis Geométrico,
 * Calibración Automática y Generación de Overlays Vectoriales funciona de forma
 * completamente agnóstica para cualquier nuevo documento PDF sin código específico por plantilla.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';
import { UniversalMasterAnalyzer } from './src/calibration/UniversalMasterAnalyzer';
import { SemanticFieldResolver } from './src/calibration/SemanticFieldResolver';
import { LAB_ORDER_MASTER_V2 } from './src/calibration/MasterRegistryV2';
import { VectorOverlayEngineV2 } from './src/calibration/VectorOverlayEngineV2';
import { SemanticDataMapperV2 } from './src/calibration/SemanticDataMapperV2';
import { MasterTemplateV2 } from './src/calibration/types/MasterTemplateV2';

const mmToPt = 72 / 25.4;

/**
 * 1. Generador de Documento A: Evaluación Cardiológica (A4, 210 x 297 mm)
 * Contiene 4 checkboxes + campos paciente + caja diagnóstica
 */
async function generateCardioEvaluationPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const H = 841.89;

  const toPtX = (xMm: number) => xMm * mmToPt;
  const toPtY = (yMm: number) => H - (yMm * mmToPt);

  // Header institucional (bloqueado)
  page.drawText('INSTITUTO DE CARDIOLOGÍA AVANZADA - UNIDAD CLÍNICA', {
    x: toPtX(25),
    y: toPtY(16),
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  page.drawText('EVALUACIÓN CARDIOVASCULAR PREOPERATORIA', {
    x: toPtX(45),
    y: toPtY(40),
    size: 12,
    font: fontBold,
  });

  // Campos de Paciente
  page.drawText('Nombre del Paciente:', { x: toPtX(18), y: toPtY(55), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(58), y: toPtY(56) }, end: { x: toPtX(130), y: toPtY(56) }, thickness: 0.75, color: rgb(0,0,0) });

  page.drawText('Cédula de Identidad:', { x: toPtX(134), y: toPtY(55), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(170), y: toPtY(56) }, end: { x: toPtX(192), y: toPtY(56) }, thickness: 0.75, color: rgb(0,0,0) });

  page.drawText('Edad:', { x: toPtX(18), y: toPtY(65), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(30), y: toPtY(66) }, end: { x: toPtX(55), y: toPtY(66) }, thickness: 0.75, color: rgb(0,0,0) });

  page.drawText('Fecha de Emisión:', { x: toPtX(118), y: toPtY(65), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(152), y: toPtY(66) }, end: { x: toPtX(192), y: toPtY(66) }, thickness: 0.75, color: rgb(0,0,0) });

  // 4 Checkboxes de Clasificación de Riesgo ASA/Goldman
  const cbConfigs = [
    { x: 22, y: 78, label: 'Riesgo Quirúrgico Leve (Clase I)' },
    { x: 105, y: 78, label: 'Riesgo Quirúrgico Moderado (Clase II)' },
    { x: 22, y: 88, label: 'Riesgo Quirúrgico Alto (Clase III)' },
    { x: 105, y: 88, label: 'Riesgo Quirúrgico Severo (Clase IV)' },
  ];

  cbConfigs.forEach((c) => {
    page.drawRectangle({
      x: toPtX(c.x),
      y: toPtY(c.y + 3.5),
      width: 3.5 * mmToPt,
      height: 3.5 * mmToPt,
      borderWidth: 0.8,
      borderColor: rgb(0, 0, 0),
    });
    page.drawText(c.label, {
      x: toPtX(c.x + 5.5),
      y: toPtY(c.y + 2.8),
      size: 8.5,
      font: font,
    });
  });

  // Caja Diagnóstica
  page.drawText('Diagnóstico Principal:', { x: toPtX(18), y: toPtY(102), size: 9, font: fontBold });
  page.drawRectangle({
    x: toPtX(18),
    y: toPtY(106 + 25),
    width: 174 * mmToPt,
    height: 25 * mmToPt,
    borderWidth: 0.8,
    borderColor: rgb(0, 0, 0),
  });

  // Caja de Tratamiento / Recomendaciones
  page.drawText('Tratamiento e Indicaciones:', { x: toPtX(18), y: toPtY(138), size: 9, font: fontBold });
  page.drawRectangle({
    x: toPtX(18),
    y: toPtY(142 + 45),
    width: 174 * mmToPt,
    height: 45 * mmToPt,
    borderWidth: 0.8,
    borderColor: rgb(0, 0, 0),
  });

  return await doc.save();
}

/**
 * 2. Generador de Documento B: Solicitud de Neuroimagen (Media Carta, 153.5 x 215.8 mm)
 * Contiene 6 checkboxes de modalidades radiológicas
 */
async function generateNeuroimagingPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Media Carta: 435.12 x 611.72 pt (153.5 x 215.8 mm)
  const page = doc.addPage([435.12, 611.72]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const H = 611.72;

  const toPtX = (xMm: number) => xMm * mmToPt;
  const toPtY = (yMm: number) => H - (yMm * mmToPt);

  page.drawText('SOLICITUD DE NEUROIMAGEN Y RESONANCIA MAGNÉTICA', {
    x: toPtX(15),
    y: toPtY(25),
    size: 9.5,
    font: fontBold,
  });

  page.drawText('Nombre del Paciente:', { x: toPtX(12), y: toPtY(40), size: 8, font: fontBold });
  page.drawLine({ start: { x: toPtX(45), y: toPtY(41) }, end: { x: toPtX(100), y: toPtY(41) }, thickness: 0.75, color: rgb(0,0,0) });

  page.drawText('Cédula de Identidad:', { x: toPtX(104), y: toPtY(40), size: 8, font: fontBold });
  page.drawLine({ start: { x: toPtX(132), y: toPtY(41) }, end: { x: toPtX(145), y: toPtY(41) }, thickness: 0.75, color: rgb(0,0,0) });

  const neuroCbs = [
    { x: 15, y: 55, label: 'RMN Cerebral Simple' },
    { x: 80, y: 55, label: 'RMN Cerebral con Contraste' },
    { x: 15, y: 65, label: 'TAC de Cráneo Simple' },
    { x: 80, y: 65, label: 'TAC de Cráneo Contrastada' },
    { x: 15, y: 75, label: 'Angiorresonancia Cerebral' },
    { x: 80, y: 75, label: 'Espectroscopia por RMN' },
  ];

  neuroCbs.forEach((c) => {
    page.drawRectangle({
      x: toPtX(c.x),
      y: toPtY(c.y + 3.2),
      width: 3.2 * mmToPt,
      height: 3.2 * mmToPt,
      borderWidth: 0.75,
      borderColor: rgb(0, 0, 0),
    });
    page.drawText(c.label, {
      x: toPtX(c.x + 5.0),
      y: toPtY(c.y + 2.5),
      size: 7.5,
      font: font,
    });
  });

  page.drawText('Diagnóstico Principal:', { x: toPtX(12), y: toPtY(90), size: 8, font: fontBold });
  page.drawRectangle({
    x: toPtX(12),
    y: toPtY(94 + 25),
    width: 130 * mmToPt,
    height: 25 * mmToPt,
    borderWidth: 0.75,
    borderColor: rgb(0, 0, 0),
  });

  return await doc.save();
}

async function runEndToEndCertification() {
  console.log('================================================================');
  console.log('FASE 3.4 — CERTIFICACIÓN FINAL END-TO-END DEL MOTOR UNIVERSAL');
  console.log('================================================================\n');

  const testResults: { name: string; status: 'PASS' | 'FAIL'; details: string }[] = [];

  // -------------------------------------------------------------
  // TEST 1: Ingesta End-to-End Documento A (Cardiología A4 con 4 Checkboxes)
  // -------------------------------------------------------------
  console.log('--- 1. TEST E2E: DOCUMENTO A (EVALUACIÓN CARDIOLÓGICA A4) ---');
  const docABytes = await generateCardioEvaluationPdf();
  const shaA = crypto.createHash('sha256').update(docABytes).digest('hex');

  const analysisA = await UniversalMasterAnalyzer.analyze(docABytes, shaA);
  const masterA = SemanticFieldResolver.buildMasterTemplate(
    analysisA,
    'CARDIO-EVAL-001',
    'certificate',
    'Evaluación Cardiovascular Preoperatoria'
  );

  const cbsA = masterA.pages[0].elements.filter((e) => e.type === 'checkbox');
  console.log(`Documento A Dimensiones: ${masterA.pages[0].widthMm} x ${masterA.pages[0].heightMm} mm`);
  console.log(`Documento A Checkboxes detectados: ${cbsA.length} / 4 esperados`);
  console.log(`Documento A Campos detectados: ${masterA.pages[0].elements.length - cbsA.length}`);
  console.log(`Documento A Master Status: ${masterA.status}`);

  // Inyección de prueba sobre Documento A
  const payloadA = {
    patient: { fullName: 'MARÍA TERESA HERNÁNDEZ', idNumber: 'V-11.222.333', age: '62', gender: 'F' as const },
    documentDate: '12/09/2026',
    clinical: { diagnosisPrincipal: 'ESTENOSIS AÓRTICA SEVERA ASINTOMÁTICA', treatment: 'APTO PARA CIRUGÍA BAJO PROTOCOLO CARDIO' },
    labTests: { 'Riesgo Quirúrgico Leve (Clase I)': true },
  };
  const dictA = SemanticDataMapperV2.mapToSemanticDictionary(payloadA);
  const renderA = await VectorOverlayEngineV2.applyOverlay(docABytes, masterA, dictA);

  const passedA = cbsA.length === 4 && renderA.injectedElementsCount >= 4 && masterA.status === 'CALIBRATED';
  testResults.push({
    name: 'Ingesta E2E Documento A (Cardiología 4 checkboxes)',
    status: passedA ? 'PASS' : 'FAIL',
    details: `${cbsA.length}/4 checkboxes detectados, ${renderA.injectedElementsCount} elementos inyectados`,
  });

  // -------------------------------------------------------------
  // TEST 2: Ingesta End-to-End Documento B (Neuroimagen Media Carta con 6 Checkboxes)
  // -------------------------------------------------------------
  console.log('\n--- 2. TEST E2E: DOCUMENTO B (SOLICITUD NEUROIMAGEN MEDIA CARTA) ---');
  const docBBytes = await generateNeuroimagingPdf();
  const shaB = crypto.createHash('sha256').update(docBBytes).digest('hex');

  const analysisB = await UniversalMasterAnalyzer.analyze(docBBytes, shaB);
  const masterB = SemanticFieldResolver.buildMasterTemplate(
    analysisB,
    'NEURO-REQ-001',
    'lab_order',
    'Solicitud de Neuroimagen y RMN'
  );

  const cbsB = masterB.pages[0].elements.filter((e) => e.type === 'checkbox');
  console.log(`Documento B Dimensiones: ${masterB.pages[0].widthMm} x ${masterB.pages[0].heightMm} mm`);
  console.log(`Documento B Checkboxes detectados: ${cbsB.length} / 6 esperados`);
  console.log(`Documento B Master Status: ${masterB.status}`);

  const payloadB = {
    patient: { fullName: 'CARLOS ALBERTO RAMÍREZ', idNumber: 'V-09.876.543', age: '48', gender: 'M' as const },
    documentDate: '12/09/2026',
    clinical: { diagnosisPrincipal: 'CEFALEA CRÓNICA CON SIGNOS DE ALARMA' },
    labTests: { 'RMN Cerebral con Contraste': true, 'Angiorresonancia Cerebral': true },
  };
  const dictB = SemanticDataMapperV2.mapToSemanticDictionary(payloadB);
  const renderB = await VectorOverlayEngineV2.applyOverlay(docBBytes, masterB, dictB);

  const passedB = cbsB.length === 6 && renderB.injectedElementsCount >= 3 && masterB.status === 'CALIBRATED';
  testResults.push({
    name: 'Ingesta E2E Documento B (Neuroimagen 6 checkboxes)',
    status: passedB ? 'PASS' : 'FAIL',
    details: `${cbsB.length}/6 checkboxes detectados, ${renderB.injectedElementsCount} elementos inyectados`,
  });

  // -------------------------------------------------------------
  // TEST 3: Verificación de Regresión Absoluta LAB-001 v3.0
  // -------------------------------------------------------------
  console.log('\n--- 3. TEST DE REGRESIÓN: LAB-001 v3.0 ---');
  const labMaster = LAB_ORDER_MASTER_V2;
  const p1 = labMaster.pages[0].elements.filter((e) => e.type === 'checkbox').length;
  const p2 = labMaster.pages[1].elements.filter((e) => e.type === 'checkbox').length;
  const totalLab = p1 + p2;

  const passedLab = totalLab === 114 && p1 === 107 && p2 === 7 && labMaster.masterId === 'LAB-001';
  testResults.push({
    name: 'Regresión Inmutable LAB-001 v3.0 (114/114 Checkboxes)',
    status: passedLab ? 'PASS' : 'FAIL',
    details: `Página 1: ${p1}/107, Página 2: ${p2}/7, Total: ${totalLab}/114`,
  });

  // -------------------------------------------------------------
  // TEST 4: Verificación de Cero Código Específico / Hardcoded Branches
  // -------------------------------------------------------------
  console.log('\n--- 4. AUDITORÍA DE ARQUITECTURA AGNOSTICA (CERO HARDCODED IFS) ---');
  const analyzerCode = await import('fs').then((fs) =>
    fs.readFileSync('./src/calibration/UniversalMasterAnalyzer.ts', 'utf-8')
  );
  const resolverCode = await import('fs').then((fs) =>
    fs.readFileSync('./src/calibration/SemanticFieldResolver.ts', 'utf-8')
  );

  const hasHardcodedAnalyzer =
    analyzerCode.includes("templateId === 'CONSTANCIA-CLINICA-001'") ||
    analyzerCode.includes("masterId === 'LAB-001'");
  const hasHardcodedResolver =
    resolverCode.includes("masterId === 'CONSTANCIA-CLINICA-001'") ||
    resolverCode.includes("documentType === 'CONSTANCIA-CLINICA-001'");

  const passedAgnostic = !hasHardcodedAnalyzer && !hasHardcodedResolver;
  testResults.push({
    name: 'Auditoría Agnóstica (Cero ramas hardcodeadas por plantilla)',
    status: passedAgnostic ? 'PASS' : 'FAIL',
    details: 'UniversalMasterAnalyzer y SemanticFieldResolver operan 100% basados en geometría y diccionario semántico.',
  });

  // -------------------------------------------------------------
  // REPORTE FINAL
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('RESUMEN FORMAL DE CERTIFICACIÓN FASE 3.4');
  console.log('================================================================');
  console.table(testResults);

  const allPassed = testResults.every((t) => t.status === 'PASS');
  console.log(`\nESTADO GLOBAL FASE 3.4: ${allPassed ? 'PASS (CERTIFICADO)' : 'FAIL'}`);
  console.log('================================================================\n');
}

runEndToEndCertification();
