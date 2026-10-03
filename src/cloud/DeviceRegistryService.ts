export class DeviceRegistryService {
  private static deviceId: string = 'device_' + Math.random().toString(36).substring(2, 9);
  private static syncState: string = 'ONLINE';

  public static getDeviceId(): string {
    return this.deviceId;
  }

  public static setSyncState(state: string): void {
    this.syncState = state;
  }

  public static startPeriodicHeartbeat(intervalMs: number, getPendingCount: () => number): void {
    if (typeof window === 'undefined') return;
    setInterval(() => {
      // Heartbeat silencioso
    }, intervalMs);
  }
}

export const deviceRegistryService = DeviceRegistryService;
