import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('=== TEST SUITE FORENSE: LabSanity ===');
const registryPath = resolve('src/document-engine-v3/LabCanonicalRegistry.ts');
const code = readFileSync(registryPath, 'utf8');

// Parsear 106 casillas de Página 1
const p1Matches = [...code.matchAll(/{\s*"id":\s*"([^"]+)"[\s\S]*?"page":\s*1[\s\S]*?"xMm":\s*([\d\.]+)[\s\S]*?"yMm":\s*([\d\.]+)[\s\S]*?"widthMm":\s*([\d\.]+)[\s\S]*?"heightMm":\s*([\d\.]+)/g)];
console.log('Casillas detectadas en Página 1:', p1Matches.length);

// Parsear 7 casillas de Página 2
const p2Matches = [...code.matchAll(/{\s*id:\s*'([^']+)',\s*label:\s*'([^']+)',\s*page:\s*2,\s*xMm:\s*([\d\.]+),\s*yMm:\s*([\d\.]+),\s*widthMm:\s*([\d\.]+),\s*heightMm:\s*([\d\.]+)/g)];
console.log('Casillas detectadas en Página 2:', p2Matches.length);

const total = p1Matches.length + p2Matches.length;
console.log('Total casillas registradas:', total);

if (p1Matches.length !== 106) {
  console.error(`FAIL: Se esperaban 106 casillas en Página 1, detectadas: ${p1Matches.length}`);
  process.exit(1);
}

if (p2Matches.length !== 7) {
  console.error(`FAIL: Se esperaban 7 casillas en Página 2, detectadas: ${p2Matches.length}`);
  process.exit(1);
}

const p2 = p2Matches.map(m => ({
  id: m[1],
  label: m[2],
  page: 2,
  xMm: parseFloat(m[3]),
  yMm: parseFloat(m[4]),
  widthMm: parseFloat(m[5]),
  heightMm: parseFloat(m[6]),
}));

// Invariante 1: Geometría uniforme
p2.forEach(c => {
  if (Math.abs(c.xMm - 19.70) > 0.01 || Math.abs(c.widthMm - 9.09) > 0.01 || Math.abs(c.heightMm - 6.13) > 0.01) {
    console.error('FAIL en geometría uniforme:', c);
    process.exit(1);
  }
});
console.log('✔ PASS: Geometría uniforme en Página 2 (x=19.70, w=9.09, h=6.13 mm)');

// Invariante 2: Pitch constante de imprenta (13.13 mm)
for (let i = 0; i < p2.length - 1; i++) {
  const deltaY = p2[i + 1].yMm - p2[i].yMm;
  if (Math.abs(deltaY - 13.13) > 0.05) {
    console.error('FAIL en pitch:', p2[i].id, '->', p2[i + 1].id, 'deltaY:', deltaY);
    process.exit(1);
  }
}
console.log('✔ PASS: Pitch constante de imprenta verificado (Delta Y = 13.13 mm)');

// Invariante 3: Cero solapamiento vertical
for (let i = 0; i < p2.length - 1; i++) {
  const bottom = p2[i].yMm + p2[i].heightMm;
  const nextTop = p2[i + 1].yMm;
  if (bottom > nextTop) {
    console.error('FAIL en solapamiento vertical:', p2[i].id, bottom, nextTop);
    process.exit(1);
  }
}
console.log('✔ PASS: Cero solapamiento vertical entre casillas');

// Invariante 4: Límites físicos del papel personalizado (153.50 x 215.80 mm)
const widthMm = 153.50;
const heightMm = 215.80;
p2.forEach(c => {
  if (c.xMm + c.widthMm > widthMm || c.yMm + c.heightMm > heightMm || c.xMm < 0 || c.yMm < 0) {
    console.error('FAIL fuera de límites físicos:', c);
    process.exit(1);
  }
});
console.log('✔ PASS: Estrictamente dentro de los límites del papel (153.50 x 215.80 mm)');

console.log('=== RESULTADO FINAL: 100% INVARIANTES CUMPLIDAS (5/5) ===');
