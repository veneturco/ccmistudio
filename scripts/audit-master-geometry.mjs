import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';

const TEMPLATES = [
  'orden_lab_base.pdf',
  'recipe_base.pdf',
  'informe_base.pdf',
  'constancia_base.pdf',
  'historia_base.pdf',
];

const SRC_DIR_CANDIDATES = [
  resolve('public/templates/masters'),
  resolve('public/templates'),
];

const SRC_DIR = SRC_DIR_CANDIDATES.find((d) => existsSync(d)) || resolve('public/templates');

async function auditMasters() {
  console.log('====================================================');
  console.log('🔍 AUDITORÍA FORENSE DE GEOMETRÍA DE MÁSTERES OFICIALES');
  console.log(`📁 Directorio origen: ${SRC_DIR}`);
  console.log('====================================================\n');

  for (const file of TEMPLATES) {
    const fullPath = resolve(SRC_DIR, file);
    if (!existsSync(fullPath)) {
      console.warn(`⚠️ Archivo no encontrado: ${fullPath}`);
      continue;
    }

    const bytes = await readFile(fullPath);
    const doc = await PDFDocument.load(bytes);
    console.log(`📄 DOCUMENTO: ${file} (${bytes.length} bytes, ${doc.getPageCount()} páginas)`);

    doc.getPages().forEach((page, i) => {
      const mb = page.getMediaBox();
      const cb = page.getCropBox();
      const rot = page.getRotation().angle;
      const widthMm = (mb.width * 25.4) / 72;
      const heightMm = (mb.height * 25.4) / 72;

      console.log(`   Página ${i + 1}:`);
      console.log(`     • Rotación: ${rot}° ${rot === 0 ? '✅' : '⚠️ ANÓMALA'}`);
      console.log(
        `     • MediaBox: [x:${mb.x}, y:${mb.y}] ${mb.width.toFixed(2)} x ${mb.height.toFixed(2)} pt (${widthMm.toFixed(1)} x ${heightMm.toFixed(1)} mm)`
      );
      console.log(
        `     • CropBox:  [x:${cb.x}, y:${cb.y}] ${cb.width.toFixed(2)} x ${cb.height.toFixed(2)} pt`
      );
      const isShifted = mb.x !== cb.x || mb.y !== cb.y || mb.width !== cb.width || mb.height !== cb.height;
      if (isShifted) {
        console.log(`     ⚠️ AVISO: Discrepancia entre MediaBox y CropBox detectada.`);
      } else {
        console.log(`     ✅ MediaBox y CropBox alineados.`);
      }
    });
    console.log('');
  }
}

auditMasters().catch((err) => {
  console.error('❌ Error en auditoría forense:', err);
  process.exit(1);
});
