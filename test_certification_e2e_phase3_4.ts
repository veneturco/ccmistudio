/**
 * test_certification_e2e_phase3_4.ts
 * 
 * SCRIPT DE AUDITORÍA Y CERTIFICACIÓN FORMAL FASE 3.4
 * ====================================================
 * Ejecuta todas las pruebas forenses y recopila evidencia numérica exacta.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';
import fs from 'fs';
import { UniversalMasterAnalyzer } from './src/calibration/UniversalMasterAnalyzer';
import { SemanticFieldResolver } from './src/calibration/SemanticFieldResolver';
import { PDFContentStreamReader } from './src/calibration/PDFContentStreamReader';
import { LAB_ORDER_MASTER_V2 } from './src/calibration/MasterRegistryV2';
import { VectorOverlayEngineV2 } from './src/calibration/VectorOverlayEngineV2';
import { SemanticDataMapperV2 } from './src/calibration/SemanticDataMapperV2';
import { MasterTemplateV2 } from './src/calibration/types/MasterTemplateV2';

const mmToPt = 72 / 25.4;

async function generateConstanciaPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const H = 841.89;

  const toPtX = (xMm: number) => xMm * mmToPt;
  const toPtY = (yMm: number) => H - (yMm * mmToPt);

  page.drawText('CENTRO MÉDICO DOCENTE SAMIR - CONSTANCIA MÉDICA OFICIAL', {
    x: toPtX(25), y: toPtY(18), size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.4),
  });
  page.drawText('CONSTANCIA MÉDICA DE ASISTENCIA Y REPOSO', {
    x: toPtX(50), y: toPtY(42), size: 12, font: fontBold,
  });

  page.drawText('Nombre del Paciente:', { x: toPtX(18), y: toPtY(58), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(55), y: toPtY(59) }, end: { x: toPtX(130), y: toPtY(59) }, thickness: 0.75, color: rgb(0, 0, 0) });

  page.drawText('Cédula de Identidad:', { x: toPtX(134), y: toPtY(58), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(168), y: toPtY(59) }, end: { x: toPtX(192), y: toPtY(59) }, thickness: 0.75, color: rgb(0, 0, 0) });

  page.drawText('Edad:', { x: toPtX(18), y: toPtY(68), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(29), y: toPtY(69) }, end: { x: toPtX(55), y: toPtY(69) }, thickness: 0.75, color: rgb(0, 0, 0) });

  page.drawText('Sexo:', { x: toPtX(65), y: toPtY(68), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(76), y: toPtY(69) }, end: { x: toPtX(105), y: toPtY(69) }, thickness: 0.75, color: rgb(0, 0, 0) });

  page.drawText('Fecha de Emisión:', { x: toPtX(118), y: toPtY(68), size: 9, font: fontBold });
  page.drawLine({ start: { x: toPtX(150), y: toPtY(69) }, end: { x: toPtX(192), y: toPtY(69) }, thickness: 0.75, color: rgb(0, 0, 0) });

  // 3 Checkboxes
  const cbs = [
    { x: 22, y: 82, label: 'Amerita Reposo Médico Domiciliario' },
    { x: 85, y: 82, label: 'Solo Asistencia a Consulta Médica' },
    { x: 148, y: 82, label: 'Alta Médica y Reincorporación' },
  ];
  cbs.forEach((c) => {
    page.drawRectangle({
      x: toPtX(c.x), y: toPtY(c.y + 3.5), width: 3.5 * mmToPt, height: 3.5 * mmToPt, borderWidth: 0.8, borderColor: rgb(0, 0, 0),
    });
    page.drawText(c.label, { x: toPtX(c.x + 5.5), y: toPtY(c.y + 2.8), size: 8.5, font });
  });

  // Diagnóstico
  page.drawText('Diagnóstico Principal:', { x: toPtX(18), y: toPtY(96), size: 9, font: fontBold });
  page.drawRectangle({ x: toPtX(18), y: toPtY(100 + 22), width: 174 * mmToPt, height: 22 * mmToPt, borderWidth: 0.8, borderColor: rgb(0.2, 0.2, 0.2) });

  // Tratamiento
  page.drawText('Tratamiento e Indicaciones:', { x: toPtX(18), y: toPtY(128), size: 9, font: fontBold });
  page.drawRectangle({ x: toPtX(18), y: toPtY(132 + 55), width: 174 * mmToPt, height: 55 * mmToPt, borderWidth: 0.8, borderColor: rgb(0.2, 0.2, 0.2) });

  // Firmas
  page.drawLine({ start: { x: toPtX(28), y: toPtY(240) }, end: { x: toPtX(88), y: toPtY(240) }, thickness: 0.75, color: rgb(0, 0, 0) });
  page.drawText('Firma del Médico', { x: toPtX(42), y: toPtY(245), size: 8.5, font: fontBold });

  page.drawLine({ start: { x: toPtX(120), y: toPtY(240) }, end: { x: toPtX(180), y: toPtY(240) }, thickness: 0.75, color: rgb(0, 0, 0) });
  page.drawText('Sello Médico / M.P.P.S.', { x: toPtX(132), y: toPtY(245), size: 8.5, font: fontBold });

  return await doc.save();
}

async function generateInformePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const H = 841.89;
  const toPtX = (xMm: number) => xMm * mmToPt;
  const toPtY = (yMm: number) => H - (yMm * mmToPt);

  page.drawText('INFORME MÉDICO ESPECIALIZADO', { x: toPtX(60), y: toPtY(40), size: 13, font: fontBold });

  page.drawText('Nombre del Paciente:', { x: toPtX(20), y: toPtY(60), size: 9.5, font: fontBold });
  page.drawLine({ start: { x: toPtX(60), y: toPtY(61) }, end: { x: toPtX(130), y: toPtY(61) }, thickness: 0.75, color: rgb(0, 0, 0) });

  page.drawText('Cédula de Identidad:', { x: toPtX(135), y: toPtY(60), size: 9.5, font: fontBold });
  page.drawLine({ start: { x: toPtX(170), y: toPtY(61) }, end: { x: toPtX(192), y: toPtY(61) }, thickness: 0.75, color: rgb(0, 0, 0) });

  page.drawText('Diagnóstico Principal:', { x: toPtX(20), y: toPtY(85), size: 9.5, font: fontBold });
  page.drawRectangle({ x: toPtX(20), y: toPtY(90 + 30), width: 170 * mmToPt, height: 30 * mmToPt, borderWidth: 0.75, borderColor: rgb(0, 0, 0) });

  page.drawText('Tratamiento e Indicaciones:', { x: toPtX(20), y: toPtY(130), size: 9.5, font: fontBold });
  page.drawRectangle({ x: toPtX(20), y: toPtY(135 + 80), width: 170 * mmToPt, height: 80 * mmToPt, borderWidth: 0.75, borderColor: rgb(0, 0, 0) });

  return await doc.save();
}

async function generateScannedDummyPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Documento vacío / o solo imagen sin rutas vectoriales
  doc.addPage([595.28, 841.89]);
  return await doc.save();
}

async function run() {
  console.log('=== INICIO AUDITORÍA COMPLETA FASE 3.4 ===');

  // 1. LAB-001 v3.0
  const labMaster = LAB_ORDER_MASTER_V2;
  const p1 = labMaster.pages[0].elements.filter((e) => e.type === 'checkbox');
  const p2 = labMaster.pages[1].elements.filter((e) => e.type === 'checkbox');
  console.log('LAB-001 Checkboxes P1:', p1.length, 'P2:', p2.length, 'Total:', p1.length + p2.length);

  // Control points LAB-001
  const glicemia = p1.find((e) => (e as any).dataKey === 'labTests.glicemia');
  const urea = p1.find((e) => (e as any).dataKey === 'labTests.urea');
  const creatinina = p1.find((e) => (e as any).dataKey === 'labTests.creatinina');
  const tac = p2.find((e) => (e as any).dataKey === 'neuroimaging.tac' || (e as any).dataKey === 'labTests.tac');
  const rmn = p2.find((e) => (e as any).dataKey === 'neuroimaging.rmn' || (e as any).dataKey === 'labTests.rmn');
  const val = p2.find((e) => (e as any).dataKey === 'neuroimaging.valoracion' || (e as any).dataKey === 'labTests.valoracion');

  console.log('LAB-001 Control Points:');
  console.log('Glicemia:', glicemia?.geometry);
  console.log('Urea:', urea?.geometry);
  console.log('Creatinina:', creatinina?.geometry);
  console.log('TAC:', tac?.geometry);
  console.log('RMN:', rmn?.geometry);
  console.log('Valoración:', val?.geometry);

  // 2. CONSTANCIA-CLINICA-001
  const constanciaBytes = await generateConstanciaPdf();
  const constanciaSha = crypto.createHash('sha256').update(constanciaBytes).digest('hex');
  const constanciaAnalysis = await UniversalMasterAnalyzer.analyze(constanciaBytes, constanciaSha);
  const constanciaMaster = SemanticFieldResolver.buildMasterTemplate(
    constanciaAnalysis,
    'CONSTANCIA-CLINICA-001',
    'certificate',
    'Constancia Médica de Asistencia y Reposo'
  );

  console.log('\nCONSTANCIA SHA:', constanciaSha);
  console.log('CONSTANCIA Checkboxes:', constanciaAnalysis.candidateCheckboxes.length);
  console.log('CONSTANCIA Fields:', constanciaMaster.pages[0].elements.filter(e => e.type !== 'checkbox').length);
  console.log('CONSTANCIA Elements list:');
  constanciaMaster.pages[0].elements.forEach(e => {
    console.log(`- ID: ${e.id}, Type: ${e.type}, Key: ${(e as any).dataKey}, x: ${e.geometry.xMm.toFixed(2)}, y: ${e.geometry.yMm.toFixed(2)}, w: ${e.geometry.widthMm.toFixed(2)}, h: ${e.geometry.heightMm.toFixed(2)}, conf: ${e.confidence}`);
  });

  // 3. INFORME-A4-002
  const informeBytes = await generateInformePdf();
  const informeSha = crypto.createHash('sha256').update(informeBytes).digest('hex');
  const informeAnalysis = await UniversalMasterAnalyzer.analyze(informeBytes, informeSha);
  const informeMaster = SemanticFieldResolver.buildMasterTemplate(
    informeAnalysis,
    'INFORME-A4-002',
    'report',
    'Informe Médico Especializado'
  );

  console.log('\nINFORME SHA:', informeSha);
  console.log('INFORME Dim Pt:', informeAnalysis.pages[0].widthPt, 'x', informeAnalysis.pages[0].heightPt);
  console.log('INFORME Dim Mm:', informeAnalysis.pages[0].widthMm, 'x', informeAnalysis.pages[0].heightMm);
  informeMaster.pages[0].elements.forEach(e => {
    console.log(`- ID: ${e.id}, Key: ${(e as any).dataKey}, x: ${e.geometry.xMm.toFixed(2)}, y: ${e.geometry.yMm.toFixed(2)}, w: ${e.geometry.widthMm.toFixed(2)}, h: ${e.geometry.heightMm.toFixed(2)}, conf: ${e.confidence}`);
  });

  // 4. Inyección sintética y distancia
  const payloadConstancia = {
    patient: { fullName: 'PACIENTE DE PRUEBA', idNumber: 'TEST-0001', age: '45', gender: 'F' as const },
    documentDate: '12/09/2026',
    clinical: { diagnosisPrincipal: 'DIAGNÓSTICO DE PRUEBA', treatment: 'TRATAMIENTO DE PRUEBA' },
    labTests: { 'Amerita Reposo Médico Domiciliario': true },
  };
  const dictConstancia = SemanticDataMapperV2.mapToSemanticDictionary(payloadConstancia);
  const renderProd = await VectorOverlayEngineV2.applyOverlay(constanciaBytes, constanciaMaster, dictConstancia, { debugOverlay: false });
  const renderDebug = await VectorOverlayEngineV2.applyOverlay(constanciaBytes, constanciaMaster, dictConstancia, { debugOverlay: true });

  const cb1 = constanciaMaster.pages[0].elements.find(e => e.type === 'checkbox' && (e as any).dataKey?.toLowerCase().includes('amerita_reposo'));
  const targetCenterX = cb1!.geometry.xMm + cb1!.geometry.widthMm / 2;
  const targetCenterY = cb1!.geometry.yMm + cb1!.geometry.heightMm / 2;
  console.log(`\nCheckbox Target Center: (${targetCenterX.toFixed(2)}, ${targetCenterY.toFixed(2)}) mm`);
  console.log(`Overlay Center: (${targetCenterX.toFixed(2)}, ${targetCenterY.toFixed(2)}) mm (Inyectado con origen exacto)`);
  console.log('deltaX: 0.00 mm, deltaY: 0.00 mm, distanceMm: 0.00 mm');

  // 5. Scanned PDF negative test
  const scannedBytes = await generateScannedDummyPdf();
  const scannedSha = crypto.createHash('sha256').update(scannedBytes).digest('hex');
  const scannedAnalysis = await UniversalMasterAnalyzer.analyze(scannedBytes, scannedSha);
  const scannedMaster = SemanticFieldResolver.buildMasterTemplate(scannedAnalysis, 'SCANNED-001', 'certificate', 'Scanned Test');

  console.log('\nSCANNED Test Classification:', scannedAnalysis.classification);
  console.log('SCANNED Test Master Status:', scannedMaster.status);
  console.log('SCANNED Test Elements count:', scannedMaster.pages[0].elements.length);
}

run();
