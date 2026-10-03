export interface SyncQueueItem {
  id: string;
  patientId: string;
  mutationType: string;
  payload: any;
  idempotencyKey?: string;
  status: 'PENDING' | 'SYNCING' | 'CONFLICT' | 'FAILED';
  attempts?: number;
  lastError?: string;
}

export class SyncQueueService {
  private queue: SyncQueueItem[] = [];
  private processedKeys = new Set<string>();

  public getPendingCount(): number {
    return this.queue.filter((q) => q.status === 'PENDING').length;
  }

  public enqueueMutation(item: any): void {
    this.queue.push({
      id: 'mut_' + Math.random().toString(36).substring(2, 9),
      status: 'PENDING',
      attempts: 0,
      ...item,
    });
  }

  public getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  public isIdempotencyKeyProcessed(key?: string): boolean {
    return key ? this.processedKeys.has(key) : false;
  }

  public markIdempotencyKeyProcessed(key?: string): void {
    if (key) this.processedKeys.add(key);
  }

  public removeSyncedItem(id: string): void {
    this.queue = this.queue.filter((q) => q.id !== id);
  }

  public updateItemStatus(id: string, status: any, opts?: any): void {
    const item = this.queue.find((q) => q.id === id);
    if (item) {
      item.status = status;
      if (opts?.incrementAttempt) item.attempts = (item.attempts || 0) + 1;
      if (opts?.lastError) item.lastError = opts.lastError;
    }
  }

  public clearLocalDraftBackup(patientId: string): void {
    // Limpieza de borrador
  }
}

export const syncQueueService = new SyncQueueService();
