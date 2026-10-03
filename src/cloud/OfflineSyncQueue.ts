import { firestorePatientSync } from './FirestorePatientSync';

export interface NetworkState {
  isOnline: boolean;
  pendingChangesCount: number;
  lastOnlineTimestamp: Date | null;
}

class OfflineSyncQueueService {
  private static instance: OfflineSyncQueueService;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Array<(state: NetworkState) => void> = [];
  private lastOnlineTimestamp: Date | null = new Date();

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  public static getInstance(): OfflineSyncQueueService {
    if (!OfflineSyncQueueService.instance) {
      OfflineSyncQueueService.instance = new OfflineSyncQueueService();
    }
    return OfflineSyncQueueService.instance;
  }

  private handleOnline(): void {
    console.log('[OFFLINE QUEUE] Conexión a internet restaurada. Iniciando auto-sincronización con Firestore...');
    this.isOnline = true;
    this.lastOnlineTimestamp = new Date();
    this.notify();

    // Auto-sincronizar con la nube de Firestore
    setTimeout(() => {
      firestorePatientSync.forceSyncNow().catch((err) => {
        console.warn('[OFFLINE QUEUE] Error en auto-sincronización:', err);
      });
    }, 1500);
  }

  private handleOffline(): void {
    console.warn('[OFFLINE QUEUE] Dispositivo sin conexión. Modo Quirófano / Offline activo.');
    this.isOnline = false;
    this.notify();
  }

  public getNetworkState(): NetworkState {
    return {
      isOnline: this.isOnline,
      pendingChangesCount: 0,
      lastOnlineTimestamp: this.lastOnlineTimestamp,
    };
  }

  public subscribe(callback: (state: NetworkState) => void): () => void {
    this.listeners.push(callback);
    callback(this.getNetworkState());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify(): void {
    const state = this.getNetworkState();
    this.listeners.forEach((cb) => cb(state));
  }
}

export const offlineSyncQueue = OfflineSyncQueueService.getInstance();
