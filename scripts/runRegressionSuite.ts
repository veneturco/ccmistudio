/**
 * scripts/runRegressionSuite.ts
 * 
 * AUDITORÍA FORENSE GENERAL DE LOS MOTORES DE GENERACIÓN PDF
 * ==========================================================
 * Ejecuta la batería de pruebas y validaciones sobre los motores:
 * 1. PDFDocumentPipelineV2
 * 2. VectorOverlayEngineV2
 * 3. SemanticDataMapperV2 & DataResolver
 * 4. Inmutabilidad de plantillas oficiales (SHA-256)
 * 5. Calibración geométrica y Shrink-to-Fit (Casos A, B y C)
 */

import { runAntigravityRegressionSuite } from '../src/utils/antigravityRegressionSuite';
import { runShrinkToFitTests } from '../src/utils/pdfFidelityTest';

async function main() {
  console.log('================================================================');
  console.log('🔍 AUDITORÍA INTEGRAL DE MOTORES DE GENERACIÓN PDF (CCMI)');
  console.log('   Dr. Samir Moucharrafie — Neurocirugía y Cirugía de Columna');
  console.log('================================================================\n');

  let hasErrors = false;

  // PARTE 1: Pruebas de Regresión Antigravity (Fondo, XObjects, Dimensiones, Fallback)
  console.log('>>> [FASE 1]: Ejecutando Auditoría Antigravity (5 Papelerías Oficiales)...');
  try {
    const summary = await runAntigravityRegressionSuite();
    console.log(`✓ Pruebas ejecutadas: ${summary.totalTests}`);
    console.log(`✓ Aprobadas:         ${summary.passed}`);
    console.log(`✓ Fallidas:          ${summary.failed}`);
    console.log(`✓ Estado:            ${summary.overallStatus}`);
    console.log(`✓ Latencia promedio: ${summary.executionTimeMs} ms\n`);

    if (summary.failed > 0) hasErrors = true;
  } catch (err: any) {
    console.error('❌ Error en Fase 1:', err.message);
    hasErrors = true;
  }

  // PARTE 2: Pruebas de Shrink-to-Fit y Protección de Texto
  console.log('>>> [FASE 2]: Pruebas de Ajuste Tipográfico (Shrink-to-Fit y Límite 7.5pt)...');
  try {
    const shrinkResults = runShrinkToFitTests();
    for (const test of shrinkResults) {
      const badge = test.success ? '✅ [PASS]' : '❌ [FAIL]';
      console.log(`${badge} ${test.caseName}`);
      console.log(`   Fuente: ${test.calculatedFontSize} pt (Límite mín: ${test.minFontSize} pt) | Requiere Revisión: ${test.requiresReview}`);
      if (!test.success) hasErrors = true;
    }
    console.log('');
  } catch (err: any) {
    console.error('❌ Error en Fase 2:', err.message);
    hasErrors = true;
  }

  console.log('================================================================');
  if (hasErrors) {
    console.error('❌ DICTAMEN DE AUDITORÍA: SE DETECTARON DISCREPANCIAS EN LOS MOTORES.');
    process.exit(1);
  } else {
    console.log('🎉 DICTAMEN DE AUDITORÍA: MOTORES PDF 100% OPERATIVOS Y CALIBRADOS.');
    console.log('   - Papelerías físicas inmutables garantizadas.');
    console.log('   - Inyección de texto vectorial pura sin rasterización.');
    console.log('   - Mapeo semántico y resolución de checkboxes certificado.');
    console.log('================================================================');
    process.exit(0);
  }
}

main();
