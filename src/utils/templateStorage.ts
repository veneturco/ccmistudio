/**
 * Almacenamiento persistente y optimizado de plantillas médicas originales de alta resolución (IndexedDB)
 * Permite almacenar escaneos y archivos de imprenta de 300 DPI (hasta 50 MB) sin límites de localStorage.
 * Soporta metadatos de optimización de assets y micro-placeholders LQIP.
 */

export interface StoredTemplateRecord {
  docType: string;
  dataUrl: string;
  lqipDataUrl?: string;
  originalSizeBytes?: number;
  optimizedSizeBytes?: number;
  savedPercentage?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  updatedAt: string;
  // V2 Master Architecture extensions:
  originalPdfBlob?: Blob;
  originalPdfBytes?: Uint8Array;
  originalPdfHash?: string;
  physicalPages?: Array<{
    pageIndex: number;
    widthPt: number;
    heightPt: number;
    widthMm: number;
    heightMm: number;
  }>;
}

const DB_NAME = 'SamirMoucharrafieTemplatesDB';
const STORE_NAME = 'official_stationery_templates';
const DB_VERSION = 3;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no soportado en este navegador'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'docType' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomTemplate(
  docType: string,
  dataUrl: string,
  metadata?: Partial<StoredTemplateRecord>
): Promise<void> {
  // Anti-Empty Guard para plantillas
  if (!docType || docType.trim() === '') {
    console.error('[Anti-Empty Guard] docType no puede ser vacío');
    return;
  }
  if (metadata?.width !== undefined && (metadata.width <= 0 || isNaN(metadata.width))) {
    console.error(`[Anti-Empty Guard] Ancho de plantilla inválido: ${metadata.width}`);
    return;
  }
  if (metadata?.height !== undefined && (metadata.height <= 0 || isNaN(metadata.height))) {
    console.error(`[Anti-Empty Guard] Alto de plantilla inválido: ${metadata.height}`);
    return;
  }

  const record: StoredTemplateRecord = {
    docType,
    dataUrl,
    lqipDataUrl: metadata?.lqipDataUrl,
    originalSizeBytes: metadata?.originalSizeBytes,
    optimizedSizeBytes: metadata?.optimizedSizeBytes,
    savedPercentage: metadata?.savedPercentage,
    width: metadata?.width,
    height: metadata?.height,
    mimeType: metadata?.mimeType,
    updatedAt: new Date().toISOString(),
    originalPdfBlob: metadata?.originalPdfBlob,
    originalPdfBytes: metadata?.originalPdfBytes,
    originalPdfHash: metadata?.originalPdfHash,
    physicalPages: metadata?.physicalPages,
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Fallback a localStorage para plantilla:', err);
    try {
      localStorage.setItem(`custom_tpl_${docType}`, dataUrl);
      if (metadata?.lqipDataUrl) {
        localStorage.setItem(`custom_tpl_lqip_${docType}`, metadata.lqipDataUrl);
      }
    } catch (e) {
      console.error('Error guardando en fallback de almacenamiento:', e);
    }
  }
}

export async function getCustomTemplate(docType: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(docType);

      request.onsuccess = () => {
        if (request.result?.dataUrl) {
          resolve(request.result.dataUrl);
        } else {
          const local = localStorage.getItem(`custom_tpl_${docType}`);
          resolve(local || null);
        }
      };
      request.onerror = () => {
        const local = localStorage.getItem(`custom_tpl_${docType}`);
        resolve(local || null);
      };
    });
  } catch {
    const local = localStorage.getItem(`custom_tpl_${docType}`);
    return local || null;
  }
}

export async function getCustomTemplateRecord(docType: string): Promise<StoredTemplateRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(docType);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getAllCustomTemplates(): Promise<Record<string, string>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const map: Record<string, string> = {};
        if (Array.isArray(request.result)) {
          request.result.forEach((item: any) => {
            if (item.docType && item.dataUrl) {
              map[item.docType] = item.dataUrl;
            }
          });
        }
        resolve(map);
      };
      request.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

export async function getAllCustomTemplateRecords(): Promise<Record<string, StoredTemplateRecord>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const map: Record<string, StoredTemplateRecord> = {};
        if (Array.isArray(request.result)) {
          request.result.forEach((item: any) => {
            if (item.docType && item.dataUrl) {
              map[item.docType] = item;
            }
          });
        }
        resolve(map);
      };
      request.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

export async function deleteCustomTemplate(docType: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(docType);

      request.onsuccess = () => {
        localStorage.removeItem(`custom_tpl_${docType}`);
        localStorage.removeItem(`custom_tpl_lqip_${docType}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    localStorage.removeItem(`custom_tpl_${docType}`);
    localStorage.removeItem(`custom_tpl_lqip_${docType}`);
  }
}

export const removeCustomTemplate = deleteCustomTemplate;

/**
 * Obtiene los bytes del PDF original almacenado en IndexedDB (si fue cargado como PDF oficial V2)
 */
export async function getCustomTemplateOriginalPdf(docType: string): Promise<Uint8Array | null> {
  const norm = (docType || '').toLowerCase().trim();
  const keysToTry = [
    docType,
    docType.toUpperCase(),
    docType.toLowerCase(),
    // Mapeo robusto de equivalencias canónicas
    norm.includes('recipe') ? 'recipe' : null,
    norm.includes('recipe') ? 'RECIPES' : null,
    norm.includes('recipe') ? 'RECIPE' : null,
    norm.includes('recipe') ? 'recipes' : null,
    (norm.includes('lab') || norm.includes('orden')) ? 'ORDEN_LAB' : null,
    (norm.includes('lab') || norm.includes('orden')) ? 'lab_order' : null,
    (norm.includes('lab') || norm.includes('orden')) ? 'orden_lab' : null,
    (norm.includes('report') || norm.includes('informe')) ? 'INFORME' : null,
    (norm.includes('report') || norm.includes('informe')) ? 'report' : null,
    (norm.includes('report') || norm.includes('informe')) ? 'informe' : null,
    (norm.includes('cert') || norm.includes('constancia')) ? 'CONSTANCIA' : null,
    (norm.includes('cert') || norm.includes('constancia')) ? 'certificate' : null,
    (norm.includes('cert') || norm.includes('constancia')) ? 'constancia' : null,
    (norm.includes('hist') || norm.includes('historia')) ? 'HISTORIA' : null,
    (norm.includes('hist') || norm.includes('historia')) ? 'history' : null,
    (norm.includes('hist') || norm.includes('historia')) ? 'historia' : null,
  ].filter(Boolean) as string[];

  // Deduplicar claves
  const uniqueKeys = Array.from(new Set(keysToTry));

  for (const k of uniqueKeys) {
    const rec = await getCustomTemplateRecord(k);
    if (!rec) continue;
    let candidate: Uint8Array | null = null;
    if (rec.originalPdfBytes && rec.originalPdfBytes.length > 100) {
      candidate = rec.originalPdfBytes;
    } else if (rec.originalPdfBlob) {
      try {
        const arrayBuffer = await rec.originalPdfBlob.arrayBuffer();
        candidate = new Uint8Array(arrayBuffer);
      } catch {}
    }
    // Validar cabecera real %PDF (0x25, 0x50, 0x44, 0x46)
    if (candidate && candidate.length > 100 && candidate[0] === 0x25 && candidate[1] === 0x50 && candidate[2] === 0x44 && candidate[3] === 0x46) {
      return candidate;
    }
  }
  return null;
}

export async function cleanCorruptedStationeryCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => {
      const records = getAllReq.result as StoredTemplateRecord[];
      if (Array.isArray(records)) {
        for (const rec of records) {
          // Si el registro no tiene un PDF real validado con cabecera %PDF o una imagen real válida, se elimina
          const hasValidPdf = rec.originalPdfBytes && 
            rec.originalPdfBytes.length > 100 && 
            rec.originalPdfBytes[0] === 0x25 && 
            rec.originalPdfBytes[1] === 0x50 &&
            rec.originalPdfBytes[2] === 0x44 &&
            rec.originalPdfBytes[3] === 0x46;
          
          const hasValidDataUrl = rec.dataUrl && (
            rec.dataUrl.startsWith('data:image/') || 
            rec.dataUrl.startsWith('/templates/')
          );

          if (!hasValidPdf && !hasValidDataUrl) {
            console.log(`[StationeryCache] Purgando registro corrupto para '${rec.docType}'`);
            store.delete(rec.docType);
          }
        }
      }
    };
  } catch (e) {
    console.warn('[StationeryCache] Limpieza pasiva de caché omitida:', e);
  }
}

export async function resetAllCustomTemplates(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(err);
  }
}
