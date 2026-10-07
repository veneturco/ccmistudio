/**
 * PDFTemplatePreloader.ts
 * 
 * PILAR 5: OPTIMIZACIÃ“N A TIEMPO REAL (GENERACIÃ“N EN < 50 MS)
 * ============================================================
 * Pre-carga y mantiene en memoria viva (RAM) los ArrayBuffers de los 
 * PDFs maestros oficiales (/templates/*.pdf) y sus esquemas vectoriales.
 * Esto elimina lecturas de disco / red en el momento del clic, logrando 
 * respuestas inmediatas al presionar "Descargar PDF" o "Enviar WhatsApp".
 */

const PDF_CACHE = new Map<string, Uint8Array>();
const PRELOAD_PROMISES = new Map<string, Promise<Uint8Array>>();

const MASTER_PDF_PATHS: Record<string, string> = {
  recipe: '/templates/recipes_bg.jpg',
  recipes: '/templates/recipes_bg.jpg',
  lab_order: '/templates/orden_lab_p1_bg.jpg',
  orden_lab: '/templates/orden_lab_p1_bg.jpg',
  lab_order_p2: '/templates/orden_lab_p2_bg.jpg',
  orden_lab_p2: '/templates/orden_lab_p2_bg.jpg',
  report: '/templates/informe_bg.jpg',
  informe: '/templates/informe_bg.jpg',
  certificate: '/templates/constancia_bg.jpg',
  constancia: '/templates/constancia_bg.jpg',
  history: '/templates/historia_bg.jpg',
  historia: '/templates/historia_bg.jpg',
};

export class PDFTemplatePreloader {
  /**
   * Pre-carga todos los PDFs maestros en segundo plano al arrancar la app.
   */
  public static preloadAll(): void {
    if (typeof window === 'undefined') return;
    
    // Iniciar pre-carga no bloqueante
    Object.entries(MASTER_PDF_PATHS).forEach(([key, path]) => {
      this.getOrFetch(path).catch((err) => {
        console.warn(`[PDFTemplatePreloader] Pre-carga de ${key} (${path}):`, err);
      });
    });
  }

  /**
   * Obtiene el buffer en memoria inmediatamente o lo descarga de forma asÃ­ncrona.
   */
  public static async getOrFetch(path: string): Promise<Uint8Array> {
    const cached = PDF_CACHE.get(path);
    if (cached) {
      return cached;
    }

    if (PRELOAD_PROMISES.has(path)) {
      return await PRELOAD_PROMISES.get(path)!;
    }

    const fetchPromise = (async () => {
      try {
        if (typeof window !== 'undefined') {
          const cleanPath = path.startsWith('/') ? path : '/' + path;
          const candidateUrls = [path, window.location.origin + cleanPath];
          for (const url of candidateUrls) {
            try {
              const res = await fetch(url, { cache: 'force-cache' });
              if (res.ok) {
                const buf = await res.arrayBuffer();
                const bytes = new Uint8Array(buf);
                if (bytes.length > 500) {
                  PDF_CACHE.set(path, bytes);
                  return bytes;
                }
              }
            } catch {}
          }
          throw new Error("No se pudo obtener recurso de plantilla desde " + path);
        }
        return new Uint8Array(0);
      } catch (err) {
        console.warn(`[PDFTemplatePreloader] Error cargando ${path}:`, err);
        throw err;
      } finally {
        PRELOAD_PROMISES.delete(path);
      }
    })();

    PRELOAD_PROMISES.set(path, fetchPromise);
    return await fetchPromise;
  }

  /**
   * Obtiene el buffer precalculado para un tipo de documento
   */
  public static async getForDocType(docType: string): Promise<Uint8Array | null> {
    const normalized = docType.toLowerCase().trim();
    const path = MASTER_PDF_PATHS[normalized] || MASTER_PDF_PATHS['recipe'];
    try {
      return await this.getOrFetch(path);
    } catch {
      return null;
    }
  }

  /**
   * Retorna si la plantilla ya estÃ¡ cargada en RAM lista para tiempo de ejecuciÃ³n < 50ms
   */
  public static isWarm(docType: string): boolean {
    const normalized = docType.toLowerCase().trim();
    const path = MASTER_PDF_PATHS[normalized];
    return path ? PDF_CACHE.has(path) : false;
  }
}
