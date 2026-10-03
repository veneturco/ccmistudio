/**
 * CalibrationEngine.ts
 * Motor centralizado de conversión bidireccional física-render (mm a pt, mm a px A4)
 * y protección contra desbordamiento (Overflow Shield / Shrink-to-fit).
 */

export const MM_TO_PT = 2.83464567; // 72 pt / 25.4 mm exact
export const MM_TO_PX_96 = 3.77952756; // 96 px / 25.4 mm exact
export const MM_TO_PX_300 = 11.81102362; // 300 px / 25.4 mm exact

export const A4_WIDTH_MM = 210.0;
export const A4_HEIGHT_MM = 297.0;
export const A4_WIDTH_PT = 595.28;
export const A4_HEIGHT_PT = 841.89;

export interface PointMm {
  xMm: number;
  yMm: number;
}

export interface RectMm {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface RenderStylePx {
  top: number;
  left: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight?: number;
}

export class CalibrationEngine {
  /**
   * Convierte milímetros a píxeles para renderizado web (A4 794x1123 px por defecto a 96DPI)
   */
  public static mmToPx(mm: number, dpi: number = 96): number {
    const factor = dpi === 300 ? MM_TO_PX_300 : MM_TO_PX_96;
    return Number((mm * factor).toFixed(3));
  }

  /**
   * Convierte píxeles de pantalla a milímetros físicos con precisión decimal
   */
  public static pxToMm(px: number, dpi: number = 96): number {
    const factor = dpi === 300 ? MM_TO_PX_300 : MM_TO_PX_96;
    return Number((px / factor).toFixed(3));
  }

  /**
   * Convierte milímetros a puntos tipográficos (pt) preservando precisión decimal
   */
  public static mmToPt(mm: number): number {
    return Number((mm * MM_TO_PT).toFixed(4));
  }

  /**
   * Convierte puntos tipográficos (pt) a milímetros
   */
  public static ptToMm(pt: number): number {
    return Number((pt / MM_TO_PT).toFixed(4));
  }

  /**
   * Transforma un rectángulo en milímetros (según esquema maestro) a estilos CSS en píxeles
   */
  public static rectMmToCss(rect: RectMm, dpi: number = 96): RenderStylePx {
    return {
      top: CalibrationEngine.mmToPx(rect.yMm, dpi),
      left: CalibrationEngine.mmToPx(rect.xMm, dpi),
      width: CalibrationEngine.mmToPx(rect.widthMm, dpi),
      height: CalibrationEngine.mmToPx(rect.heightMm, dpi),
      fontSize: 10,
    };
  }

  /**
   * Convierte coordenadas Y de milímetros (con origen en esquina superior izquierda, top-down)
   * a coordenadas de página PDF en puntos (con origen en esquina inferior izquierda, bottom-up).
   * Fórmula canónica: yPt = pageHeightPt - (yMm * 72 / 25.4) = (pageHeightMm - yMm) * (72 / 25.4)
   */
  public static yMmToPdfPt(yMm: number, pageHeightMm: number): number {
    return Number(((pageHeightMm - yMm) * MM_TO_PT).toFixed(4));
  }

  /**
   * Convierte coordenadas X de milímetros a puntos PDF.
   * Fórmula canónica: xPt = (xMm * 72) / 25.4
   */
  public static xMmToPdfPt(xMm: number): number {
    return CalibrationEngine.mmToPt(xMm);
  }

  /**
   * MOTOR DE ALINEACIÓN AUTOMÁTICA (EJE X):
   * Calcula la coordenada X en puntos PDF considerando la alineación solicitada ('left', 'center', 'right')
   * y el ancho real del texto obtenido de la fuente embebida (pdf-lib).
   */
  public static calculateAlignedXPt(
    leftMm: number,
    widthMm: number,
    align: 'left' | 'center' | 'right' | string = 'left',
    textWidthPt: number = 0
  ): number {
    const baseXPt = CalibrationEngine.xMmToPdfPt(leftMm);
    const boxWidthPt = CalibrationEngine.xMmToPdfPt(widthMm);

    if (align === 'center') {
      // Encuentra el centro de la caja y resta la mitad del ancho del texto
      return baseXPt + (boxWidthPt / 2) - (textWidthPt / 2);
    } else if (align === 'right') {
      // Encuentra el borde derecho de la caja y resta todo el ancho del texto
      return baseXPt + boxWidthPt - textWidthPt;
    }

    // Por defecto: alineación izquierda ('left')
    return baseXPt;
  }

  /**
   * MOTOR DE LÍNEA BASE (EJE Y):
   * Ajusta la coordenada Y para que coincida exactamente con la línea de base tipográfica dentro de la caja.
   * Aplica el factor de compensación de línea base (ascent factor = 0.718 para Helvetica)
   * para que la posición en pantalla coincida milimétricamente con la impresión física del PDF.
   * Si se especifica boxHeightMm, aplica centrado vertical óptico idéntico al comportamiento de inputs en CSS web.
   * Exige pageHeightMm de la página física real.
   */
  public static calculateBaselineYPt(
    topMm: number,
    fontSizePt: number,
    pageHeightMm: number,
    fontHeightPt?: number,
    boxHeightMm?: number
  ): number {
    const HELVETICA_ASCENT_FACTOR = 0.718;
    const rawYPt = CalibrationEngine.yMmToPdfPt(topMm, pageHeightMm);

    if (boxHeightMm !== undefined && boxHeightMm > 0) {
      // Centrado vertical óptico dentro de la caja con compensación de ascendente
      const boxHeightPt = boxHeightMm * MM_TO_PT;
      const topPaddingPt = Math.max(0, (boxHeightPt - fontSizePt) / 2);
      return Number((rawYPt - topPaddingPt - (fontSizePt * HELVETICA_ASCENT_FACTOR)).toFixed(4));
    }
    
    // Alineación superior directa (top-aligned) con compensación exacta de ascendente
    return Number((rawYPt - (fontSizePt * HELVETICA_ASCENT_FACTOR)).toFixed(4));
  }

  /**
   * Aplica lógica de autoajuste tipográfico (shrink-to-fit) si el texto excede los límites permitidos.
   * CASO A: Texto cabe normalmente -> tamaño base, requiresReview = false
   * CASO B: Texto necesita reducción pero cabe antes de 7.5 pt -> tamaño reducido, requiresReview = false
   * CASO C: Texto excede capacidad aún a 7.5 pt -> NO truncar, NO ocultar, NO sobrescribir, tamaño = 7.5 pt, requiresReview = true
   */
  public static calculateShrinkFontSize(
    text: string,
    boxHeightMm: number,
    baseFontSizePt: number = 10,
    minFontSizePt: number = 7.5,
    boxWidthMm?: number
  ): { fontSizePt: number; requiresReview: boolean } {
    if (!text || !text.trim()) return { fontSizePt: baseFontSizePt, requiresReview: false };

    // Estimar líneas totales considerando tanto saltos explícitos \n como ajuste de línea por ancho
    let totalLines = 0;
    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      if (!para || para.trim().length === 0) {
        totalLines += 1;
        continue;
      }
      const effectiveWidthMm = boxWidthMm && boxWidthMm > 0 ? boxWidthMm : 150;
      // Ancho promedio por carácter en Helvetica: ~0.52 * fontSize en pt convertido a mm
      const charWidthMm = (baseFontSizePt * 0.52) * 0.352778;
      const maxCharsPerLine = Math.max(1, Math.floor(effectiveWidthMm / charWidthMm));
      totalLines += Math.max(1, Math.ceil(para.length / maxCharsPerLine));
    }

    const lineHeightMm = baseFontSizePt * 0.352778 * 1.35;
    const totalRequiredHeightMm = totalLines * lineHeightMm;

    // CASO A: El texto cabe normalmente dentro de la caja delimitadora
    if (totalRequiredHeightMm <= boxHeightMm) {
      return { fontSizePt: baseFontSizePt, requiresReview: false };
    }

    // CASO B: Requiere reducción proporcional
    const ratio = boxHeightMm / totalRequiredHeightMm;
    const adjustedSize = Math.round(baseFontSizePt * ratio * 10) / 10;

    if (adjustedSize < minFontSizePt) {
      // CASO C: El texto no cabe incluso con el mínimo de 7.5 pt.
      // REGLA: NO truncar, NO ocultar, NO sobrescribir -> requiresReview = true
      return { fontSizePt: minFontSizePt, requiresReview: true };
    }

    // CASO B confirmado: cabe antes de alcanzar el mínimo
    return { fontSizePt: adjustedSize, requiresReview: false };
  }
}
