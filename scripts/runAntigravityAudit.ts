/**
 * CLI Runner: Auditoría de Regresión Automatizada Antigravity
 * Ejecutable vía: npx tsx scripts/runAntigravityAudit.ts
 */

import { runAntigravityRegressionSuite } from '../src/utils/antigravityRegressionSuite';

async function main() {
  console.log('================================================================');
  console.log('🚀 INICIANDO AUDITORÍA FORENSE DE REGRESIÓN (AGENTE ANTIGRAVITY)');
  console.log('   Proyecto: SOCS CCMI — Dr. Samir Moucharrafie');
  console.log('================================================================\n');

  try {
    const summary = await runAntigravityRegressionSuite();

    console.log(`⏱️  Timestamp: ${summary.timestamp}`);
    console.log(`📊 Pruebas Totales: ${summary.totalTests}`);
    console.log(`✅ Aprobadas:       ${summary.passed}`);
    console.log(`❌ Fallidas:        ${summary.failed}`);
    console.log(`🛡️  Estado Global:   ${summary.overallStatus}`);
    console.log(`⚡ Tiempo Total:    ${summary.executionTimeMs} ms\n`);

    console.log('----------------------------------------------------------------');
    console.log('DETALLE DE EJECUCIÓN POR PRUEBA:');
    console.log('----------------------------------------------------------------');

    for (const test of summary.results) {
      const badge = test.passed ? '✅ [PASS]' : '❌ [FAIL]';
      console.log(`${badge} ${test.name} (${test.durationMs} ms)`);
      console.log(`   Detalle: ${test.details}`);
      if (Object.keys(test.metrics).length > 0) {
        console.log(`   Métricas: ${JSON.stringify(test.metrics)}`);
      }
      console.log('');
    }

    if (summary.overallStatus === 'HEALTHY') {
      console.log('🎉 DICTAMEN FINAL: EL SISTEMA ESTÁ 100% SANO Y BLINDADO.');
      process.exit(0);
    } else {
      console.error('⚠️ DICTAMEN FINAL: SE DETECTARON DISCREPANCIAS.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error fatal ejecutando la auditoría:', error);
    process.exit(1);
  }
}

main();
