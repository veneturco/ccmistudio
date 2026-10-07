import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';

const TEMPLATES = [
  { id: 'recipe', file: 'recipe_base.pdf' },
  { id: 'informe', file: 'informe_base.pdf' },
  { id: 'ordenLab', file: 'orden_lab_base.pdf' },
  { id: 'constancia', file: 'constancia_base.pdf' },
  { id: 'historia', file: 'historia_base.pdf' },
];

const SRC_DIR_CANDIDATES = [
  resolve('public/templates/masters'),
  resolve('public/templates'),
];

const SRC_DIR = SRC_DIR_CANDIDATES.find(d => existsSync(d)) || resolve('public/templates');
const OUT_DIR = resolve('src/document-engine-v3/bundled');

await mkdir(OUT_DIR, { recursive: true });

for (const t of TEMPLATES) {
  const filePath = resolve(SRC_DIR, t.file);
  const bytes = await readFile(filePath);
  const b64 = bytes.toString('base64');
  const hash = createHash('sha256').update(bytes).digest('hex');
  
  const tsContent = `// AUTO-GENERADO POR CCMI Document Engine V3 — NO EDITAR
export const ${t.id}Bytes = Uint8Array.from(atob("${b64}"), (c) => c.charCodeAt(0));
export const ${t.id}Hash = "${hash}";
export const ${t.id}ByteLength = ${bytes.length};
`;

  await writeFile(resolve(OUT_DIR, `${t.id}.base.ts`), tsContent, 'utf8');
  console.log(`✅ Bundle generado: ${t.id} (${bytes.length} bytes) en ${OUT_DIR}/${t.id}.base.ts`);
}

// Crear index.ts barril para exportar todos los binarios
const barrelContent = `// AUTO-GENERADO — BARREL V3
export * from './recipe.base';
export * from './informe.base';
export * from './ordenLab.base';
export * from './constancia.base';
export * from './historia.base';
`;
await writeFile(resolve(OUT_DIR, 'index.ts'), barrelContent, 'utf8');
console.log('✅ Archivo barrel src/document-engine-v3/bundled/index.ts generado');
