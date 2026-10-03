/**
 * test_phase3_3.ts
 * 
 * SUITE DE AUDITORÍA Y CERTIFICACIÓN FORMAL FASE 3.3
 * ===================================================
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';
import fs from 'fs';
import { UniversalMasterAnalyzer } from './src/calibration/UniversalMasterAnalyzer';
import { SemanticFieldResolver } from './src/calibration/SemanticFieldResolver';
import { LAB_ORDER_MASTER_V2 } from './src/calibration/MasterRegistryV2';
import { VectorOverlayEngineV2 } from './src/calibration/VectorOverlayEngineV2';
import { SemanticDataMapperV2 } from './src/calibration/SemanticDataMapperV2';

async function generateConstanciaVectorPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Page A4: 595.28 x 841.89 pt (210 x 297 mm)
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const H = 841.89; // pt
  const mmToPt = 72 / 25.4;

  const toPtX = (xMm: number) => xMm * mmToPt;
  const toPtY = (yMm: number) => H - (yMm * mmToPt);

  // 1. Membrete oficial institucional (Header en primeros 30 mm)
  page.drawText('CENTRO MÉDICO DOCENTE SAMIR - CONSTANCIA MÉDICA OFICIAL', {
    x: toPtX(25),
    y: toPtY(18),
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  // 2. Título del Documento
  page.drawText('CONSTANCIA MÉDICA DE ASISTENCIA Y REPOSO', {
    x: toPtX(50),
    y: toPtY(42),
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // 3. Datos del Paciente
  // Nombre y Apellido
  page.drawText('Nombre del Paciente:', {
    x: toPtX(18),
    y: toPtY(58),
    size: 9,
    font: fontBold,
  });
  page.drawLine({
    start: { x: toPtX(55), y: toPtY(59) },
    end: { x: toPtX(130), y: toPtY(59) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // Cédula de Identidad
  page.drawText('Cédula de Identidad:', {
    x: toPtX(134),
    y: toPtY(58),
    size: 9,
    font: fontBold,
  });
  page.drawLine({
    start: { x: toPtX(168), y: toPtY(59) },
    end: { x: toPtX(192), y: toPtY(59) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // Edad
  page.drawText('Edad:', {
    x: toPtX(18),
    y: toPtY(68),
    size: 9,
    font: fontBold,
  });
  page.drawLine({
    start: { x: toPtX(29), y: toPtY(69) },
    end: { x: toPtX(55), y: toPtY(69) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // Sexo
  page.drawText('Sexo:', {
    x: toPtX(65),
    y: toPtY(68),
    size: 9,
    font: fontBold,
  });
  page.drawLine({
    start: { x: toPtX(76), y: toPtY(69) },
    end: { x: toPtX(105), y: toPtY(69) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // Fecha
  page.drawText('Fecha de Emisión:', {
    x: toPtX(118),
    y: toPtY(68),
    size: 9,
    font: fontBold,
  });
  page.drawLine({
    start: { x: toPtX(150), y: toPtY(69) },
    end: { x: toPtX(192), y: toPtY(69) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // 4. SECCIÓN DE LAS 3 CASILLAS (CHECKBOXES FÍSICOS)
  // Checkbox 1: Amerita Reposo
  const cb1X = 22;
  const cb1Y = 82;
  page.drawRectangle({
    x: toPtX(cb1X),
    y: toPtY(cb1Y + 3.5),
    width: 3.5 * mmToPt,
    height: 3.5 * mmToPt,
    borderWidth: 0.8,
    borderColor: rgb(0, 0, 0),
  });
  page.drawText('Amerita Reposo Médico Domiciliario', {
    x: toPtX(cb1X + 5.5),
    y: toPtY(cb1Y + 2.8),
    size: 8.5,
    font: font,
  });

  // Checkbox 2: Solo Asistencia
  const cb2X = 85;
  const cb2Y = 82;
  page.drawRectangle({
    x: toPtX(cb2X),
    y: toPtY(cb2Y + 3.5),
    width: 3.5 * mmToPt,
    height: 3.5 * mmToPt,
    borderWidth: 0.8,
    borderColor: rgb(0, 0, 0),
  });
  page.drawText('Solo Asistencia a Consulta Médica', {
    x: toPtX(cb2X + 5.5),
    y: toPtY(cb2Y + 2.8),
    size: 8.5,
    font: font,
  });

  // Checkbox 3: Alta Médica
  const cb3X = 148;
  const cb3Y = 82;
  page.drawRectangle({
    x: toPtX(cb3X),
    y: toPtY(cb3Y + 3.5),
    width: 3.5 * mmToPt,
    height: 3.5 * mmToPt,
    borderWidth: 0.8,
    borderColor: rgb(0, 0, 0),
  });
  page.drawText('Alta Médica y Reincorporación', {
    x: toPtX(cb3X + 5.5),
    y: toPtY(cb3Y + 2.8),
    size: 8.5,
    font: font,
  });

  // 5. Diagnóstico Principal (Caja Rectangular grande)
  page.drawText('Diagnóstico Principal:', {
    x: toPtX(18),
    y: toPtY(96),
    size: 9,
    font: fontBold,
  });
  page.drawRectangle({
    x: toPtX(18),
    y: toPtY(100 + 22),
    width: 174 * mmToPt,
    height: 22 * mmToPt,
    borderWidth: 0.8,
    borderColor: rgb(0.2, 0.2, 0.2),
  });

  // 6. Tratamiento e Indicaciones (Caja Rectangular grande)
  page.drawText('Tratamiento e Indicaciones:', {
    x: toPtX(18),
    y: toPtY(128),
    size: 9,
    font: fontBold,
  });
  page.drawRectangle({
    x: toPtX(18),
    y: toPtY(132 + 55),
    width: 174 * mmToPt,
    height: 55 * mmToPt,
    borderWidth: 0.8,
    borderColor: rgb(0.2, 0.2, 0.2),
  });

  // 7. Firmas y Sellos
  // Línea de Firma del Médico
  page.drawLine({
    start: { x: toPtX(28), y: toPtY(240) },
    end: { x: toPtX(88), y: toPtY(240) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });
  page.drawText('Firma del Médico', {
    x: toPtX(42),
    y: toPtY(245),
    size: 8.5,
    font: fontBold,
  });

  // Sello Médico
  page.drawLine({
    start: { x: toPtX(120), y: toPtY(240) },
    end: { x: toPtX(180), y: toPtY(240) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });
  page.drawText('Sello Médico / M.P.P.S.', {
    x: toPtX(132),
    y: toPtY(245),
    size: 8.5,
    font: fontBold,
  });

  return await doc.save();
}

async function generateInformeVectorPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mmToPt = 72 / 25.4;
  const H = 841.89;
  const toPtX = (xMm: number) => xMm * mmToPt;
  const toPtY = (yMm: number) => H - (yMm * mmToPt);

  page.drawText('INFORME MÉDICO ESPECIALIZADO', {
    x: toPtX(60),
    y: toPtY(40),
    size: 13,
    font: fontBold,
  });

  page.drawText('Nombre del Paciente:', {
    x: toPtX(20),
    y: toPtY(60),
    size: 9.5,
    font: fontBold,
  });
  page.drawLine({
    start: { x: toPtX(60), y: toPtY(61) },
    end: { x: toPtX(130), y: toPtY(61) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  page.drawText('Cédula de Identidad:', {
    x: toPtX(135),
    y: toPtY(60),
    size: 9.5,
    font: fontBold,
  });
  page.drawLine({
    start: { x: toPtX(170), y: toPtY(61) },
    end: { x: toPtX(192), y: toPtY(61) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  page.drawText('Diagnóstico Principal:', {
    x: toPtX(20),
    y: toPtY(85),
    size: 9.5,
    font: fontBold,
  });
  page.drawRectangle({
    x: toPtX(20),
    y: toPtY(90 + 30),
    width: 170 * mmToPt,
    height: 30 * mmToPt,
    borderWidth: 0.75,
    borderColor: rgb(0, 0, 0),
  });

  page.drawText('Tratamiento e Indicaciones:', {
    x: toPtX(20),
    y: toPtY(130),
    size: 9.5,
    font: fontBold,
  });
  page.drawRectangle({
    x: toPtX(20),
    y: toPtY(135 + 80),
    width: 170 * mmToPt,
    height: 80 * mmToPt,
    borderWidth: 0.75,
    borderColor: rgb(0, 0, 0),
  });

  return await doc.save();
}

async function run() {
  console.log('================================================================');
  console.log('FASE 3.3 — REPORTE DE EJECUCIÓN DEL PARSER REAL DE CONTENT STREAMS');
  console.log('================================================================\n');

  // 1. Ingesta y análisis de CONSTANCIA-CLINICA-001
  console.log('--- 1. AUDITORÍA Y EXTRACCIÓN SOBRE CONSTANCIA-CLINICA-001 ---');
  const constanciaBytes = await generateConstanciaVectorPdf();
  const sha256 = crypto.createHash('sha256').update(constanciaBytes).digest('hex');

  const analysis = await UniversalMasterAnalyzer.analyze(constanciaBytes, sha256);

  console.log(`Documento Clasificación: ${analysis.classification}`);
  console.log(`Dimensiones detectadas: ${analysis.pages[0].widthMm.toFixed(2)} x ${analysis.pages[0].heightMm.toFixed(2)} mm`);
  console.log(`Nodos de texto extraídos: ${analysis.textNodes.length}`);
  console.log(`Rectángulos vectoriales detectados: ${analysis.vectorRects.length}`);
  console.log(`Líneas vectoriales detectadas: ${analysis.vectorLines.length}`);
  console.log(`Checkboxes candidatos detectados: ${analysis.candidateCheckboxes.length}`);
  console.log(`Campos candidatos detectados: ${analysis.candidateFields.length}`);

  console.log('\n--- DETALLE GEOMÉTRICO DE LAS 3 CASILLAS (CHECKBOXES) ---');
  analysis.candidateCheckboxes.forEach((cb, idx) => {
    console.log(`checkbox ${idx + 1}:`);
    console.log(`  xMm: ${cb.geometry.xMm.toFixed(2)}`);
    console.log(`  yMm: ${cb.geometry.yMm.toFixed(2)}`);
    console.log(`  widthMm: ${cb.geometry.widthMm.toFixed(2)}`);
    console.log(`  heightMm: ${cb.geometry.heightMm.toFixed(2)}`);
    console.log(`  confidence: ${cb.confidence}`);
  });

  // 2. Resolución Semántica
  console.log('\n--- 2. RESOLUCIÓN SEMÁNTICA AUTOMÁTICA ---');
  const resolvedMaster = SemanticFieldResolver.buildMasterTemplate(
    analysis,
    'CONSTANCIA-CLINICA-001',
    'certificate',
    'Constancia Médica de Asistencia y Reposo'
  );

  console.log(`Master ID: ${resolvedMaster.masterId}`);
  console.log(`Master Status: ${resolvedMaster.status}`);
  console.log(`Elementos resueltos en página 1: ${resolvedMaster.pages[0].elements.length}`);
  console.log('\nTABLA DE ELEMENTOS FÍSICOS CANÓNICOS RESUELTOS:');
  console.table(
    resolvedMaster.pages[0].elements.map((el) => ({
      ID: el.id,
      Tipo: el.type,
      Key: (el as any).dataKey || (el as any).assetKey,
      'x (mm)': el.geometry.xMm.toFixed(2),
      'y (mm)': el.geometry.yMm.toFixed(2),
      'Ancho (mm)': el.geometry.widthMm.toFixed(2),
      'Alto (mm)': el.geometry.heightMm.toFixed(2),
      Label: el.label || '',
      Confianza: el.confidence,
      Estado: el.status,
    }))
  );

  // 3. Regresión Obligatoria LAB-001 v3.0
  console.log('\n--- 3. REGRESIÓN DE NO-REGRESIÓN LAB-001 v3.0 ---');
  const labMaster = LAB_ORDER_MASTER_V2;
  const p1Checkboxes = labMaster.pages[0].elements.filter((e) => e.type === 'checkbox');
  const p2Checkboxes = labMaster.pages[1].elements.filter((e) => e.type === 'checkbox');
  const totalLabCheckboxes = p1Checkboxes.length + p2Checkboxes.length;

  console.log(`LAB-001 Master ID: ${labMaster.masterId}`);
  console.log(`LAB-001 Versión: ${labMaster.version}`);
  console.log(`LAB-001 Total Checkboxes: ${totalLabCheckboxes} (Esperado: 114)`);
  console.log(`  Página 1 Checkboxes: ${p1Checkboxes.length} (Esperado: 107)`);
  console.log(`  Página 2 Checkboxes: ${p2Checkboxes.length} (Esperado: 7)`);

  const labPassed =
    totalLabCheckboxes === 114 &&
    p1Checkboxes.length === 107 &&
    p2Checkboxes.length === 7 &&
    labMaster.masterId === 'LAB-001';

  console.log(`Resultado Regresión LAB-001: ${labPassed ? 'PASS (100% INTACTO)' : 'FAIL'}`);

  // 4. Ingesta de Segundo Master (INFORME-A4-002)
  console.log('\n--- 4. SEGUNDO MASTER: INFORME-A4-002 ---');
  const informeBytes = await generateInformeVectorPdf();
  const informeSha = crypto.createHash('sha256').update(informeBytes).digest('hex');
  const informeAnalysis = await UniversalMasterAnalyzer.analyze(informeBytes, informeSha);
  const informeMaster = SemanticFieldResolver.buildMasterTemplate(
    informeAnalysis,
    'INFORME-A4-002',
    'report',
    'Informe Médico Especializado'
  );
  console.log(`Informe Master ID: ${informeMaster.masterId}`);
  console.log(`Informe Elementos Detectados: ${informeMaster.pages[0].elements.length}`);
  console.log(`Informe Status: ${informeMaster.status}`);

  // 5. Inyección de Producción sobre el Master Resuelto
  console.log('\n--- 5. PRUEBA DE GENERACIÓN DE PRODUCCIÓN Y DEBUG OVERLAY ---');
  const testPayload = {
    patient: {
      fullName: 'PACIENTE DE PRUEBA UNIVERSAL',
      idNumber: 'V-00.000.000',
      age: '99',
      gender: 'M' as const,
    },
    documentDate: '01/01/2099',
    clinical: {
      diagnosisPrincipal: 'EVALUACIÓN UNIVERSAL DE PRUEBA',
      treatment: 'REPOSO Y CONTROL',
    },
    labTests: {
      'Amerita Reposo Médico Domiciliario': true,
    },
  };

  const semanticDict = SemanticDataMapperV2.mapToSemanticDictionary(testPayload);
  
  // Producción
  const renderProd = await VectorOverlayEngineV2.applyOverlay(
    constanciaBytes,
    resolvedMaster,
    semanticDict,
    { debugOverlay: false }
  );
  console.log(`PDF Producción Generado: ${renderProd.pdfBytes.length} bytes`);
  console.log(`Elementos Inyectados con éxito (Prod): ${renderProd.injectedElementsCount}`);

  // Debug Overlay
  const renderDebug = await VectorOverlayEngineV2.applyOverlay(
    constanciaBytes,
    resolvedMaster,
    semanticDict,
    { debugOverlay: true }
  );
  console.log(`PDF Debug Overlay Generado: ${renderDebug.pdfBytes.length} bytes`);
  console.log(`Elementos Inyectados con éxito (Debug): ${renderDebug.injectedElementsCount}`);

  console.log('\n================================================================');
  console.log(`FASE 3.3 ESTADO GLOBAL: ${labPassed && analysis.candidateCheckboxes.length === 3 ? 'PASS' : 'FAIL'}`);
  console.log('================================================================');
}

run();
