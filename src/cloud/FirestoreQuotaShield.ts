/**
 * FirestoreQuotaShield.ts
 * 
 * Escudo protector de cuota gratuita (Spark Free Tier) para Firestore.
 * Cuando se detecta [code=resource-exhausted], silencia automáticamente
 * reintentos agresivos y conmuta la aplicación a modo local 100% resiliente.
 */

const QUOTA_STORAGE_KEY = 'ccmi_firestore_quota_exhausted_ts';
const QUOTA_COOLDOWN_MS = 6 * 3600 * 1000; // 6 horas de enfriamiento antes de reintentar

export class FirestoreQuotaShield {
  private static isExhaustedInMemory = false;
  private static failureCount = 0;

  public static isQuotaExhausted(): boolean {
    if (this.isExhaustedInMemory) return true;
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
      if (!raw) return false;
      const ts = parseInt(raw, 10);
      if (Date.now() - ts < QUOTA_COOLDOWN_MS) {
        this.isExhaustedInMemory = true;
        return true;
      }
      localStorage.removeItem(QUOTA_STORAGE_KEY);
      this.isExhaustedInMemory = false;
      return false;
    } catch {
      return false;
    }
  }

  public static markQuotaExhausted(errorDetails?: any): void {
    this.isExhaustedInMemory = true;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(QUOTA_STORAGE_KEY, String(Date.now()));
      } catch {}
    }
    console.info('[FirestoreQuotaShield] Modo Local Protegido Activo: Operando 100% sobre LocalStorage/IndexedDB sin interrupción.');
  }

  public static recordSuccess(): void {
    this.failureCount = 0;
  }

  public static recordFailure(err: any): void {
    this.failureCount++;
    if (this.isQuotaError(err)) {
      this.markQuotaExhausted(err);
    } else {
      // Silenciar o registrar fallos transitorios de red/offline
      const msg = String(err?.message || err || '').toLowerCase();
      if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('connection failed')) {
        // Modo offline normal en Firestore Web SDK, operar con caché
      }
    }
  }

  public static isQuotaError(err: any): boolean {
    if (!err) return false;
    const code = err.code || '';
    const msg = String(err.message || err).toLowerCase();
    return (
      code === 'resource-exhausted' ||
      msg.includes('quota limit exceeded') ||
      msg.includes('resource-exhausted') ||
      msg.includes('free daily write units') ||
      msg.includes('free daily read units')
    );
  }
}
