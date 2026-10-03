/**
 * CalibrationEngineV2.ts
 * 
 * MOTOR UNIVERSAL DE TRANSFORMACIÓN Y GEOMETRÍA V2
 * ===============================================
 * Autoridad: MILÍMETROS FÍSICOS (mm).
 * Sistema de coordenadas canónico:
 *   - origin: 'top-left'
 *   - yAxis: 'down'
 * 
 * REGLAS FUNDAMENTALES:
 * 1. Nunca usar píxeles como autoridad de calibración.
 * 2. NO usar 297mm como fallback de altura.
 * 3. NO asumir A4 a ciegas; las dimensiones provienen del PDF real o de la plantilla validada.
 * 4. Conversión estricta:
 *      mm -> PDF points (bottom-up)
 *      mm -> viewport transform -> pixels (para visualización)
 *      pixels de pantalla -> viewport inverso -> mm (nunca directo sin transformación)
 */

export const MM_TO_PT_EXACT = 72 / 25.4; // 2.834645669291339
export const PT_TO_MM_EXACT = 25.4 / 72; // 0.3527777777777778

export interface PointMm {
  xMm: number;
  yMm: number;
}

export interface PointPt {
  xPt: number;
  yPt: number;
}

export interface RectMm {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface RectPdfPt {
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
}

export interface ViewportTransform {
  zoom: number;       // Factor de escala (ej: 1.0, 1.5)
  panX: number;       // Desplazamiento horizontal en px
  panY: number;       // Desplazamiento vertical en px
  dpi?: number;       // DPI de referencia en pantalla (por defecto 96)
}

export class CalibrationEngineV2 {
  /**
   * Convierte milímetros físicos a puntos tipográficos PostScript/PDF (1/72 pulgada)
   */
  public static mmToPt(mm: number): number {
    return Number((mm * MM_TO_PT_EXACT).toFixed(4));
  }

  /**
   * Convierte puntos tipográficos PDF a milímetros físicos
   */
  public static ptToMm(pt: number): number {
    return Number((pt * PT_TO_MM_EXACT).toFixed(4));
  }

  /**
   * Convierte milímetros a píxeles de pantalla según DPI
   */
  public static mmToPx(mm: number, dpi: number = 96): number {
    const pxPerMm = dpi / 25.4;
    return Number((mm * pxPerMm).toFixed(3));
  }

  /**
   * Convierte píxeles de pantalla a milímetros físicos según DPI
   */
  public static pxToMm(px: number, dpi: number = 96): number {
    const mmPerPx = 25.4 / dpi;
    return Number((px * mmPerPx).toFixed(3));
  }

  /**
   * Convierte coordenada X en mm (origen top-left) a coordenada X en puntos PDF (origen bottom-left)
   */
  public static xMmToPdfPt(xMm: number): number {
    return CalibrationEngineV2.mmToPt(xMm);
  }

  /**
   * Convierte coordenada Y en mm (origen top-left, hacia abajo)
   * a coordenada Y en puntos PDF (origen bottom-left, hacia arriba).
   * 
   * EXIGE obligatoriamente la altura real de la página en mm (o pt).
   * PROHIBIDO asumir 297mm por defecto.
   */
  public static yMmToPdfPt(yMm: number, pageHeightMm: number): number {
    if (pageHeightMm === undefined || pageHeightMm === null || pageHeightMm <= 0) {
      throw new Error(
        `[CalibrationEngineV2] yMmToPdfPt requiere 'pageHeightMm' válido y positivo. Recibido: ${pageHeightMm}`
      );
    }
    return Number(((pageHeightMm - yMm) * MM_TO_PT_EXACT).toFixed(4));
  }

  /**
   * Transforma un rectángulo completo en mm a coordenadas PDF (puntos)
   * Considerando que en PDF el origen es la esquina inferior izquierda.
   */
  public static rectMmToPdf(rect: RectMm, pageHeightMm: number): RectPdfPt {
    if (pageHeightMm === undefined || pageHeightMm === null || pageHeightMm <= 0) {
      throw new Error(
        `[CalibrationEngineV2] rectMmToPdf requiere 'pageHeightMm' válido y positivo. Recibido: ${pageHeightMm}`
      );
    }
    const widthPt = CalibrationEngineV2.mmToPt(rect.widthMm);
    const heightPt = CalibrationEngineV2.mmToPt(rect.heightMm);
    const xPt = CalibrationEngineV2.mmToPt(rect.xMm);
    // En PDF, yPt inferior = pageHeight - (yTop + height)
    const yPt = CalibrationEngineV2.mmToPt(pageHeightMm - (rect.yMm + rect.heightMm));

    return {
      xPt,
      yPt,
      widthPt,
      heightPt,
    };
  }

  /**
   * Convierte puntos PDF (bottom-left) de vuelta a milímetros (top-left)
   */
  public static pdfToMm(pointPt: PointPt, pageHeightMm: number): PointMm {
    if (pageHeightMm === undefined || pageHeightMm === null || pageHeightMm <= 0) {
      throw new Error(
        `[CalibrationEngineV2] pdfToMm requiere 'pageHeightMm' válido y positivo. Recibido: ${pageHeightMm}`
      );
    }
    const xMm = CalibrationEngineV2.ptToMm(pointPt.xPt);
    const pageHeightPt = CalibrationEngineV2.mmToPt(pageHeightMm);
    const yMm = CalibrationEngineV2.ptToMm(pageHeightPt - pointPt.yPt);
    return { xMm, yMm };
  }

  /**
   * Transforma coordenadas de pantalla/viewport (mouse event en pixels)
   * a coordenadas físicas del documento en milímetros (top-left).
   * 
   * Flujo: screenPx -> descontar pan -> dividir entre zoom -> pxToMm
   */
  public static viewportToDocument(
    screenX: number,
    screenY: number,
    transform: ViewportTransform
  ): PointMm {
    const dpi = transform.dpi || 96;
    const zoom = transform.zoom || 1.0;
    const unpannedX = (screenX - transform.panX) / zoom;
    const unpannedY = (screenY - transform.panY) / zoom;
    return {
      xMm: CalibrationEngineV2.pxToMm(unpannedX, dpi),
      yMm: CalibrationEngineV2.pxToMm(unpannedY, dpi),
    };
  }

  /**
   * Transforma coordenadas físicas del documento en milímetros
   * a coordenadas de pantalla/viewport (pixels) para renderizado en Canvas / DOM.
   * 
   * Flujo: docMm -> mmToPx -> multiplicar zoom -> sumar pan
   */
  public static documentToViewport(
    xMm: number,
    yMm: number,
    transform: ViewportTransform
  ): { screenX: number; screenY: number } {
    const dpi = transform.dpi || 96;
    const zoom = transform.zoom || 1.0;
    const pxX = CalibrationEngineV2.mmToPx(xMm, dpi);
    const pxY = CalibrationEngineV2.mmToPx(yMm, dpi);
    return {
      screenX: pxX * zoom + transform.panX,
      screenY: pxY * zoom + transform.panY,
    };
  }
}
