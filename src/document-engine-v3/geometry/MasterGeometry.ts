// src/document-engine-v3/geometry/MasterGeometry.ts

export const PT_PER_MM = 72 / 25.4; // 2.834645669291339 pt/mm

export const MASTER_GEOMETRY = {
  ordenLab: { id: 'ORDEN_LAB_CUSTOM', widthMm: 153.50, heightMm: 215.80, pages: 2 },
  recipe: { id: 'A4', widthMm: 210.00, heightMm: 297.00, pages: 1 },
  informe: { id: 'A4', widthMm: 210.00, heightMm: 297.00, pages: 1 },
  constancia: { id: 'A4', widthMm: 210.00, heightMm: 297.00, pages: 1 },
  historia: { id: 'A4', widthMm: 210.00, heightMm: 297.00, pages: 1 },
} as const;

export type MasterDocKey = keyof typeof MASTER_GEOMETRY;

export function validatePageGeometry(page: any, docKey: MasterDocKey) {
  const cb = page.getCropBox();
  const wMm = cb.width / PT_PER_MM;
  const hMm = cb.height / PT_PER_MM;
  const target = MASTER_GEOMETRY[docKey];

  if (Math.abs(wMm - target.widthMm) > 1.0 || Math.abs(hMm - target.heightMm) > 1.0) {
    throw new Error(
      `[Geometría Inválida] ${docKey}: detectado ${wMm.toFixed(2)}x${hMm.toFixed(2)} mm, ` +
        `se esperaba ${target.widthMm}x${target.heightMm} mm. Emisión detenida (Fail-Closed).`
    );
  }

  return { widthPt: cb.width, heightPt: cb.height, scale: PT_PER_MM };
}
