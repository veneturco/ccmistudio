import { CANONICAL_LAB_REGISTRY } from '../LabCanonicalRegistry';
import { MASTER_GEOMETRY } from '../geometry/MasterGeometry';

describe('Sanidad de Coordenadas Lab Order (V3.1)', () => {
  const { widthMm, heightMm } = MASTER_GEOMETRY.ordenLab;

  it('ninguna de las 113 casillas excede las dimensiones físicas del papel (153.5 x 215.8 mm)', () => {
    const outOfBounds = CANONICAL_LAB_REGISTRY.filter(
      (cb) =>
        cb.xMm + cb.widthMm > widthMm ||
        cb.yMm + cb.heightMm > heightMm ||
        cb.xMm < 0 ||
        cb.yMm < 0
    );

    if (outOfBounds.length > 0) {
      console.error(
        '⚠️ ALERTA: Casillas fuera de los límites:',
        outOfBounds.map((c) => c.id)
      );
    }
    expect(outOfBounds).toEqual([]);
  });

  it('no existen casillas duplicadas ni en páginas inválidas', () => {
    const ids = CANONICAL_LAB_REGISTRY.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);

    const invalidPages = CANONICAL_LAB_REGISTRY.filter(
      (cb) => cb.page !== 1 && cb.page !== 2
    );
    expect(invalidPages).toEqual([]);
  });

  describe('Invariantes Forenses LAB_CANONICAL_PAGE_2', () => {
    it('consta exactamente de 7 casillas físicas en la Página 2', () => {
      const page2 = CANONICAL_LAB_REGISTRY.filter((cb) => cb.page === 2);
      expect(page2.length).toBe(7);
    });

    it('todas las casillas de Página 2 comparten dimensiones y alineación horizontal idénticas (x=19.70, w=9.09, h=6.13 mm)', () => {
      const page2 = CANONICAL_LAB_REGISTRY.filter((cb) => cb.page === 2);
      for (const cb of page2) {
        expect(cb.xMm).toBeCloseTo(19.70, 2);
        expect(cb.widthMm).toBeCloseTo(9.09, 2);
        expect(cb.heightMm).toBeCloseTo(6.13, 2);
      }
    });

    it('el paso vertical entre casillas consecutivas (pitch) es constante a ~13.13 mm', () => {
      const page2 = CANONICAL_LAB_REGISTRY.filter((cb) => cb.page === 2);
      for (let i = 0; i < page2.length - 1; i++) {
        const deltaY = page2[i + 1].yMm - page2[i].yMm;
        expect(deltaY).toBeCloseTo(13.13, 1);
      }
    });

    it('no hay solapamiento vertical entre ninguna casilla de Página 2', () => {
      const page2 = CANONICAL_LAB_REGISTRY.filter((cb) => cb.page === 2);
      for (let i = 0; i < page2.length - 1; i++) {
        const currentBottom = page2[i].yMm + page2[i].heightMm;
        const nextTop = page2[i + 1].yMm;
        expect(currentBottom).toBeLessThanOrEqual(nextTop);
      }
    });

    it('todas las casillas de Página 2 están estrictamente contenidas dentro de los límites del papel', () => {
      const page2 = CANONICAL_LAB_REGISTRY.filter((cb) => cb.page === 2);
      for (const cb of page2) {
        expect(cb.xMm).toBeGreaterThanOrEqual(0);
        expect(cb.yMm).toBeGreaterThanOrEqual(0);
        expect(cb.xMm + cb.widthMm).toBeLessThanOrEqual(widthMm);
        expect(cb.yMm + cb.heightMm).toBeLessThanOrEqual(heightMm);
      }
    });
  });
});

