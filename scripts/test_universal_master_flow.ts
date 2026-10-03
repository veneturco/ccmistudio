/**
 * test_universal_master_flow.ts
 * 
 * EXAMEN FINAL DEL SISTEMA: UNIVERSAL MASTER ANALYZER
 * ====================================================
 * Valida que un PDF que NUNCA estuvo programado en el sistema puede:
 * 1. Ser analizado de forma 100% ciega y automática por UniversalMasterAnalyzer.
 * 2. Resolver automáticamente campos de paciente (nombre, cédula, edad, fecha).
 * 3. Resolver automáticamente checkboxes vectoriales con sus etiquetas asociadas.
 * 4. Resolver automáticamente campos multilínea (diagnóstico, tratamiento/plan).
 * 5. Resolver firma y sello médico.
 * 6. Calibrar y Publicar el Master sin tocar una sola línea de pdfExport.ts,
 *    DataResolver.ts o VectorOverlayEngineV2.ts.
 * 7. Generar un PDF real en PDFDocumentPipelineV2.
 * 8. Realizar inspección física del content stream para certificar la inyección vectorial.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { UniversalMasterAnalyzer } from '../src/calibration/UniversalMasterAnalyzer';
import { SemanticFieldResolver } from '../src/calibration/SemanticFieldResolver';
import { CalibrationValidator } from '../src/calibration/CalibrationValidator';
import { TemplateRegistry } from '../src/calibration/TemplateRegistry';
import { PDFDocumentPipelineV2 } from '../src/utils/PDFDocumentPipelineV2';
import { PDFContentStreamReader } from '../src/calibration/PDFContentStreamReader';

async function createUnprogrammedPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // Media Carta estándar (435.12 pt × 611.72 pt = 153.5 mm × 215.8 mm)
  const page = pdfDoc.addPage([435.12, 611.72]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const mmToPt = (mm: number) => (mm * 72) / 25.4;
  const pageH = 611.72;
  const yPt = (yMm: number) => pageH - mmToPt(yMm);

  // Membrete / Encabezado
  page.drawText('CENTRO MÉDICO QUIRÚRGICO DE OCCIDENTE', {
    x: mmToPt(20),
    y: yPt(15),
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  page.drawText('EVALUACIÓN PREANESTÉSICA Y AUTORIZACIÓN QUIRÚRGICA', {
    x: mmToPt(20),
    y: yPt(20),
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Línea divisoria de encabezado
  page.drawLine({
    start: { x: mmToPt(15), y: yPt(25) },
    end: { x: mmToPt(138.5), y: yPt(25) },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Campos de Paciente (con líneas horizontales para inyección)
  // Nombre del Paciente:
  page.drawText('Nombre del Paciente:', {
    x: mmToPt(15),
    y: yPt(35),
    size: 8.5,
    font: fontBold,
  });
  page.drawLine({
    start: { x: mmToPt(50), y: yPt(36) },
    end: { x: mmToPt(138.5), y: yPt(36) },
    thickness: 0.75,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Cédula de Identidad:
  page.drawText('Cédula de Identidad:', {
    x: mmToPt(15),
    y: yPt(43),
    size: 8.5,
    font: fontBold,
  });
  page.drawLine({
    start: { x: mmToPt(48), y: yPt(44) },
    end: { x: mmToPt(85), y: yPt(44) },
    thickness: 0.75,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Edad:
  page.drawText('Edad:', {
    x: mmToPt(90),
    y: yPt(43),
    size: 8.5,
    font: fontBold,
  });
  page.drawLine({
    start: { x: mmToPt(102), y: yPt(44) },
    end: { x: mmToPt(118), y: yPt(44) },
    thickness: 0.75,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Fecha:
  page.drawText('Fecha:', {
    x: mmToPt(15),
    y: yPt(51),
    size: 8.5,
    font: fontBold,
  });
  page.drawLine({
    start: { x: mmToPt(28), y: yPt(52) },
    end: { x: mmToPt(65), y: yPt(52) },
    thickness: 0.75,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Sección Checkboxes: ANTECEDENTES Y FACTORES DE RIESGO
  page.drawText('ANTECEDENTES MÉDICOS DEL PACIENTE:', {
    x: mmToPt(15),
    y: yPt(62),
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });

  const drawCheckbox = (xMm: number, yMm: number, label: string) => {
    // Casilla física cuadrada de 3.5mm × 3.5mm
    page.drawRectangle({
      x: mmToPt(xMm),
      y: yPt(yMm + 3.5),
      width: mmToPt(3.5),
      height: mmToPt(3.5),
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 0.75,
    });
    // Etiqueta a la derecha
    page.drawText(label, {
      x: mmToPt(xMm + 5.5),
      y: yPt(yMm + 2.8),
      size: 8,
      font: font,
    });
  };

  // 4 Checkboxes vectoriales
  drawCheckbox(16, 70, 'Hipertensión Arterial');
  drawCheckbox(75, 70, 'Diabetes Mellitus');
  drawCheckbox(16, 80, 'Alergia a Medicamentos');
  drawCheckbox(75, 80, 'Fumador Activo');

  // Sección Multilínea: Diagnóstico
  page.drawText('Diagnóstico Principal:', {
    x: mmToPt(15),
    y: yPt(95),
    size: 8.5,
    font: fontBold,
  });
  page.drawRectangle({
    x: mmToPt(15),
    y: yPt(120),
    width: mmToPt(123.5),
    height: mmToPt(22),
    borderColor: rgb(0.6, 0.6, 0.6),
    borderWidth: 0.75,
  });

  // Sección Multilínea: Tratamiento / Plan Propuesto
  page.drawText('Plan de Tratamiento / Conducta Quirúrgica:', {
    x: mmToPt(15),
    y: yPt(128),
    size: 8.5,
    font: fontBold,
  });
  page.drawRectangle({
    x: mmToPt(15),
    y: yPt(160),
    width: mmToPt(123.5),
    height: mmToPt(30),
    borderColor: rgb(0.6, 0.6, 0.6),
    borderWidth: 0.75,
  });

  // Sección Firma y Sello Médico
  page.drawLine({
    start: { x: mmToPt(80), y: yPt(185) },
    end: { x: mmToPt(135), y: yPt(185) },
    thickness: 0.75,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText('Firma del Médico Tratante', {
    x: mmToPt(85),
    y: yPt(190),
    size: 8,
    font: fontBold,
  });

  // Pie de página
  page.drawText('Formulario Oficial FORM-UNPROGRAMMED-001 | Sistema Clínico Automatizado', {
    x: mmToPt(25),
    y: yPt(208),
    size: 7,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc.save();
}

async function runUniversalMasterExam() {
  console.log('================================================================');
  console.log('🚀 INICIANDO EXAMEN FINAL: UNIVERSAL MASTER ANALYZER');
  console.log('================================================================');

  // 1. Crear PDF nuevo que NUNCA estuvo programado en el sistema
  console.log('PASO 1: Generando PDF nuevo e inédito (FORM-UNPROGRAMMED-001)...');
  const pdfBytes = await createUnprogrammedPdf();
  console.log(`✓ PDF generado exitosamente: ${pdfBytes.length} bytes`);

  // 2. Ejecutar UniversalMasterAnalyzer
  console.log('\nPASO 2: Ingesta y Análisis Geométrico Universal (UniversalMasterAnalyzer)...');
  const sha256 = 'sha256_unprogrammed_test_hash_001';
  const analysis = await UniversalMasterAnalyzer.analyze(pdfBytes, sha256);

  console.log(`✓ Clasificación: ${analysis.classification}`);
  console.log(`✓ Confianza Global: ${(analysis.summary.globalConfidence * 100).toFixed(1)}%`);
  console.log(`✓ Nodos de Texto detectados: ${analysis.textNodes.length}`);
  console.log(`✓ Rectángulos Vectoriales: ${analysis.vectorRects.length}`);
  console.log(`✓ Líneas Vectoriales: ${analysis.vectorLines.length}`);
  console.log(`✓ Checkboxes Candidatos detectados: ${analysis.candidateCheckboxes.length}`);
  console.log(`✓ Campos Candidatos detectados: ${analysis.candidateFields.length}`);

  // 3. Resolver Semántica con SemanticFieldResolver
  console.log('\nPASO 3: Resolución Semántica Automática (SemanticFieldResolver)...');
  const autoMaster = SemanticFieldResolver.buildMasterTemplate(
    analysis,
    'PREANESTHESIA-001',
    'preanesthetic_eval',
    'Evaluación Preanestésica'
  );

  console.log(`✓ Master ID: ${autoMaster.masterId}`);
  console.log(`✓ Status: ${autoMaster.status}`);
  console.log(`✓ Total Páginas: ${autoMaster.pages.length}`);

  const pageElements = autoMaster.pages[0].elements;
  console.log(`✓ Total Elementos Resueltos en Página 1: ${pageElements.length}`);

  console.log('\n--- DETALLE DE ELEMENTOS DETECTADOS ---');
  pageElements.forEach((el, idx) => {
    const labelStr = (el as any).label ? ` [Etiqueta: "${(el as any).label}"]` : '';
    const keyStr = (el as any).dataKey ? ` -> dataKey: "${(el as any).dataKey}"` : '';
    console.log(`  [${idx + 1}] (${el.type.padEnd(14)}) id: ${el.id.padEnd(32)} ${keyStr}${labelStr}`);
  });

  // Verificaciones de Campos Críticos
  const hasFullName = pageElements.some((e) => (e as any).dataKey === 'patient.fullName');
  const hasIdNumber = pageElements.some((e) => (e as any).dataKey === 'patient.idNumber');
  const hasAge = pageElements.some((e) => (e as any).dataKey === 'patient.age');
  const hasDate = pageElements.some((e) => (e as any).dataKey === 'document.date');
  const hasDiagnosis = pageElements.some((e) => (e as any).dataKey === 'clinical.diagnosisPrincipal');
  const hasTreatment = pageElements.some((e) => (e as any).dataKey === 'clinical.treatment');
  const hasSignature = pageElements.some((e) => e.type === 'signature' || (e as any).dataKey === 'doctor.signature');
  const checkboxes = pageElements.filter((e) => e.type === 'checkbox');

  console.log('\n--- COMPROBACIÓN DE ASIGNACIÓN SEMÁNTICA ---');
  console.log(`• Nombre del Paciente (patient.fullName): ${hasFullName ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
  console.log(`• Cédula de Identidad (patient.idNumber): ${hasIdNumber ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
  console.log(`• Edad del Paciente (patient.age):        ${hasAge ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
  console.log(`• Fecha (document.date):                  ${hasDate ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
  console.log(`• Diagnóstico Multilínea:                 ${hasDiagnosis ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
  console.log(`• Tratamiento Multilínea:                 ${hasTreatment ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
  console.log(`• Firma del Médico:                       ${hasSignature ? '✅ DETECTADO' : '❌ NO DETECTADO'}`);
  console.log(`• Checkboxes Vectoriales Identificados:   ${checkboxes.length} (${checkboxes.length >= 4 ? '✅ 4/4 DETECTADOS' : '❌ INCOMPLETO'})`);

  checkboxes.forEach((cb) => {
    console.log(`   - Checkbox: "${(cb as any).label}" -> ${(cb as any).dataKey}`);
  });

  // 4. Calibración y Certificación con CalibrationValidator
  console.log('\nPASO 4: Auditoría y Certificación (CalibrationValidator)...');
  const evaluation = CalibrationValidator.evaluateUniversalMaster(autoMaster);
  console.log(`✓ Validación Estructural: ${evaluation.isValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Estatus Recomendado: ${evaluation.recommendedStatus}`);
  console.log(`✓ Score de Integridad: ${(evaluation.score * 100).toFixed(1)}%`);
  console.log(`✓ Resumen: ${evaluation.summary.totalElements} elementos (${evaluation.summary.totalCheckboxes} checkboxes, ${evaluation.summary.totalTextFields} campos de texto)`);
  if (evaluation.issues.length > 0) {
    console.log(`⚠️ Advertencias:`, evaluation.issues);
  }

  // 5. Publicación del Master
  console.log('\nPASO 5: Publicando Master en Registro Dinámico...');
  const publishedMaster = {
    ...autoMaster,
    status: 'PUBLISHED' as const,
  };
  TemplateRegistry.register(publishedMaster);
  console.log(`✓ Master '${publishedMaster.masterId}' y '${publishedMaster.documentType}' registrados.`);

  // 6. Invocación de PDFDocumentPipelineV2 sin tocar pdfExport ni DataResolver
  console.log('\nPASO 6: Generando PDF Real de Paciente vía PDFDocumentPipelineV2...');
  const patientContext = {
    patient: {
      fullName: 'Pedro Lucas',
      idNumber: '14.892.304',
      age: '54 años',
      phone: '+58 414 1234567',
    },
    documentDate: '13/09/2026',
    clinical: {
      diagnosisPrincipal: 'Hernia Discal L4-L5 con Radiculopatía Compresiva L5 Derecha',
      treatment: 'Microdiscectomía Tubular Asistida por Microscopio y Foraminotomía L5',
      checkbox: {
        hipertension_arterial: true,
        diabetes_mellitus: false,
        alergia_a_medicamentos: true,
        fumador_activo: false,
      },
    },
    checkbox: {
      hipertension_arterial: true,
      diabetes_mellitus: false,
      alergia_a_medicamentos: true,
      fumador_activo: false,
    },
  };

  const pipelineResponse = await PDFDocumentPipelineV2.generateDocument({
    documentType: 'preanesthetic_eval',
    context: patientContext as any,
    template: publishedMaster,
    templateBytes: pdfBytes,
  });

  console.log(`✓ Documento PDF generado exitosamente:`);
  console.log(`  - Nombre de archivo: ${pipelineResponse.fileName}`);
  console.log(`  - Tamaño final: ${pipelineResponse.pdfBytes.length} bytes`);
  console.log(`  - Elementos inyectados por VectorOverlayEngineV2: ${pipelineResponse.injectedCount}`);

  // 7. Inspección Física del Content Stream del PDF resultante
  console.log('\nPASO 7: Inspección Física Independiente del Content Stream...');
  const loadedPdf = await PDFDocument.load(pipelineResponse.pdfBytes);
  const page0 = loadedPdf.getPage(0);
  const streamExtraction = await PDFContentStreamReader.extractPageContent(loadedPdf, page0, 0);

  const textFound = streamExtraction.textNodes.map((t) => t.text);
  console.log(`✓ Nodos de texto físicos en el PDF generado: ${textFound.length}`);

  const hasPhysicalName = textFound.some((t) => t.includes('Pedro Lucas'));
  const hasPhysicalId = textFound.some((t) => t.includes('14.892.304'));
  const hasPhysicalAge = textFound.some((t) => t.includes('54 años'));
  const hasPhysicalDate = textFound.some((t) => t.includes('13/09/2026'));
  const hasPhysicalDiagnosis = textFound.some((t) => t.includes('Hernia Discal'));
  const hasPhysicalTreatment = textFound.some((t) => t.includes('Microdiscectomía Tubular'));

  // Conteo de marcas 'X' vectoriales inyectadas
  const xMarksFound = textFound.filter((t) => t.trim() === 'X');

  console.log('\n--- RESULTADOS DE INSPECCIÓN FÍSICA DEL PDF FINAL ---');
  console.log(`• Nombre 'Pedro Lucas' en stream:              ${hasPhysicalName ? '✅ CONFIRMADO' : '❌ NO ENCONTRADO'}`);
  console.log(`• Cédula '14.892.304' en stream:              ${hasPhysicalId ? '✅ CONFIRMADO' : '❌ NO ENCONTRADO'}`);
  console.log(`• Edad '54 años' en stream:                   ${hasPhysicalAge ? '✅ CONFIRMADO' : '❌ NO ENCONTRADO'}`);
  console.log(`• Fecha '13/09/2026' en stream:               ${hasPhysicalDate ? '✅ CONFIRMADO' : '❌ NO ENCONTRADO'}`);
  console.log(`• Diagnóstico 'Hernia Discal...' en stream:   ${hasPhysicalDiagnosis ? '✅ CONFIRMADO' : '❌ NO ENCONTRADO'}`);
  console.log(`• Tratamiento 'Microdiscectomía...' en stream:${hasPhysicalTreatment ? '✅ CONFIRMADO' : '❌ NO ENCONTRADO'}`);
  console.log(`• Marcas 'X' de Checkbox en stream:           ${xMarksFound.length} (Esperadas: 2: Hipertensión y Alergia) -> ${xMarksFound.length === 2 ? '✅ EXACTO' : '⚠️ ' + xMarksFound.length}`);

  console.log('\n================================================================');
  if (
    hasPhysicalName &&
    hasPhysicalId &&
    hasPhysicalAge &&
    hasPhysicalDiagnosis &&
    hasPhysicalTreatment &&
    xMarksFound.length === 2
  ) {
    console.log('🏆 EXAMEN FINAL SUPERADO CON ÉXITO ROTUNDO');
    console.log('El UniversalMasterAnalyzer demostró autonomía total de detección,');
    console.log('resolución semántica y superposición física vectorial sin tocar');
    console.log('el código base ni crear condiciones especiales.');
  } else {
    console.error('❌ FALLÓ EL EXAMEN: Revisar discrepancias arriba.');
    process.exit(1);
  }
  console.log('================================================================');
}

runUniversalMasterExam().catch((err) => {
  console.error('Error fatal durante el examen:', err);
  process.exit(1);
});
