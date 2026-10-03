/**
 * Asset Optimizer & Image Pipeline for Dr. Samir Moucharrafie Clinical App
 * Provides client-side WebP/JPEG compression, A4 aspect ratio normalization,
 * LQIP (Low Quality Image Placeholder) blur-up generation, and smart pre-warming cache.
 */

export interface OptimizedPageResult {
  pageNumber: number;
  dataUrl: string;
  lqipDataUrl: string;
  width: number;
  height: number;
  mimeType: string;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  savedPercentage: number;
}

export interface OptimizedAssetResult {
  dataUrl: string;
  lqipDataUrl: string;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  savedPercentage: number;
  width: number;
  height: number;
  mimeType: 'image/webp' | 'image/jpeg' | 'image/png';
  pageCount?: number;
  pages?: OptimizedPageResult[];
}

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 - 1.0
  preferWebP?: boolean;
  generateLqip?: boolean;
  pageNumber?: number; // Permite solicitar una página específica (1-based)
}

class LRUCache<K, V> {
  private max: number;
  private cache: Map<K, V>;

  constructor(max = 50) {
    this.max = max;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key: K, val: V) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, val);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

// In-Memory Fast LRU Cache to prevent OOM
const memoryAssetCache = new LRUCache<string, { full: string; lqip?: string; decoded?: boolean }>(30);

/**
 * Check if the browser supports WebP canvas export
 */
let isWebPSupportedCache: boolean | null = null;
export function isWebPSupported(): boolean {
  if (isWebPSupportedCache !== null) return isWebPSupportedCache;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const webpData = canvas.toDataURL('image/webp');
    isWebPSupportedCache = webpData.startsWith('data:image/webp');
  } catch {
    isWebPSupportedCache = false;
  }
  return isWebPSupportedCache;
}

/**
 * Generate a tiny, lightweight blurred placeholder (LQIP) from an image source
 */
export async function generateLQIP(imageSource: string, width = 36, height = 51): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('');
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'low';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.4));
        } catch {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = imageSource;
    } catch {
      resolve('');
    }
  });
}

/**
 * Optimize an uploaded high-resolution stationery file (scans, photos, 300 DPI prints)
 * Automatically resizes to optimal A4 dimensions (max 2480x3508 for ultra-crisp 300 DPI),
 * compresses to WebP/JPEG, and creates an instant micro-LQIP.
 */
export async function optimizeStationeryImage(
  file: File | Blob | string,
  options: OptimizationOptions = {}
): Promise<OptimizedAssetResult> {
  const {
    maxWidth = 2480, // Standard 300 DPI A4 Width
    maxHeight = 3508, // Standard 300 DPI A4 Height
    quality = 0.88, // Crisp high-definition quality with ~85% file size reduction
    preferWebP = true,
    generateLqip = true,
  } = options;

  let originalSizeBytes = 0;
  if (file instanceof File || file instanceof Blob) {
    originalSizeBytes = file.size;
  } else if (typeof file === 'string' && file.startsWith('data:')) {
    originalSizeBytes = Math.round((file.length * 3) / 4);
  }

  // Soporte directo para archivos PDF oficiales (convierte la página 1 a WebP/JPEG de 300 DPI mediante el servidor)
  const isPdf =
    (file instanceof File && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) ||
    (typeof file === 'string' && file.startsWith('data:application/pdf'));

  if (isPdf) {
    try {
      let pdfBase64 = '';
      if (typeof file === 'string') {
        pdfBase64 = file;
      } else {
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Error al leer el archivo PDF en memoria.'));
          reader.readAsDataURL(file as Blob);
        });
      }

      const res = await fetch('/api/templates/rasterize-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pdfBase64, 
          maxWidth, 
          maxHeight,
          pageNumber: options.pageNumber 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.dataUrl) {
          return {
            dataUrl: data.dataUrl,
            lqipDataUrl: data.lqipDataUrl || '',
            originalSizeBytes: data.originalSizeBytes || originalSizeBytes,
            optimizedSizeBytes: data.optimizedSizeBytes || 0,
            savedPercentage: data.savedPercentage || 0,
            width: data.width || 794,
            height: data.height || 1123,
            mimeType: data.mimeType || 'image/webp',
            pageCount: data.pageCount || (data.pages ? data.pages.length : 1),
            pages: data.pages || undefined,
          };
        }
      }
    } catch (pdfErr) {
      console.warn('Fallo en rasterización de PDF vía servidor, reintentando decodificación estándar:', pdfErr);
    }
  }

  // Load image
  const img = await loadImageElement(file);

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  // Scale down if larger than max boundaries while maintaining aspect ratio
  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // Draw to offscreen canvas with high quality smoothing
  const useWebP = preferWebP && isWebPSupported();
  const mimeType: 'image/webp' | 'image/jpeg' = useWebP ? 'image/webp' : 'image/jpeg';
  let dataUrl = '';

  if (typeof OffscreenCanvas !== 'undefined') {
    // Non-blocking Web Worker compatible canvas
    const offscreen = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const blob = await offscreen.convertToBlob({ type: mimeType, quality });
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  }

  if (!dataUrl) {
    // Fallback síncrono
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo inicializar el contexto de renderizado de imagen.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    dataUrl = canvas.toDataURL(mimeType, quality);
  }

  const optimizedSizeBytes = Math.round((dataUrl.length * 3) / 4);
  const effectiveOriginal = originalSizeBytes > 0 ? originalSizeBytes : optimizedSizeBytes * 1.5;
  const savedPercentage = Math.max(
    0,
    Math.round(((effectiveOriginal - optimizedSizeBytes) / effectiveOriginal) * 100)
  );

  // Generate micro LQIP
  let lqipDataUrl = '';
  if (generateLqip) {
    const lqipCanvas = document.createElement('canvas');
    lqipCanvas.width = 36;
    lqipCanvas.height = Math.round((36 * targetHeight) / targetWidth);
    const lqipCtx = lqipCanvas.getContext('2d');
    if (lqipCtx) {
      lqipCtx.drawImage(canvas, 0, 0, lqipCanvas.width, lqipCanvas.height);
      lqipDataUrl = lqipCanvas.toDataURL('image/jpeg', 0.35);
    }
  }

  return {
    dataUrl,
    lqipDataUrl,
    originalSizeBytes: effectiveOriginal,
    optimizedSizeBytes,
    savedPercentage,
    width: targetWidth,
    height: targetHeight,
    mimeType,
  };
}

/**
 * Pre-warm and decode template assets in the background using requestIdleCallback / low priority queue
 */
export function preloadTemplateAssets(urls: string[]): void {
  if (typeof window === 'undefined') return;

  const prewarm = () => {
    urls.forEach((url) => {
      if (!url || memoryAssetCache.has(url)) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;

      if ('decode' in img && typeof img.decode === 'function') {
        img
          .decode()
          .then(() => {
            memoryAssetCache.set(url, { full: url, decoded: true });
          })
          .catch(() => {
            // Fallback load
            img.onload = () => memoryAssetCache.set(url, { full: url, decoded: true });
          });
      } else {
        img.onload = () => memoryAssetCache.set(url, { full: url, decoded: true });
      }
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prewarm, { timeout: 2000 });
  } else {
    setTimeout(prewarm, 100);
  }
}

/**
 * Get cached asset or register url
 */
export function getCachedAsset(url: string) {
  return memoryAssetCache.get(url);
}

export function setCachedAsset(url: string, data: { full: string; lqip?: string; decoded?: boolean }) {
  memoryAssetCache.set(url, data);
}

/**
 * Helper: Load an image element from file/blob/url
 */
function loadImageElement(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('No se pudo interpretar el archivo como imagen (formato no soportado o archivo corrupto).'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo en memoria.'));
      reader.readAsDataURL(source);
    } else if (typeof source === 'string') {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Error cargando imagen desde URL: ${source}`));
      img.src = source;
    } else {
      reject(new Error('Formato de imagen no soportado.'));
    }
  });
}

/**
 * Format bytes to readable string (e.g. 1.2 MB, 340 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
