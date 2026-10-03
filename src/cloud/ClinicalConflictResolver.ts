import { SyncConflictPayload } from './types';

export class ClinicalConflictResolver {
  public static createConflictPayload(opts: any): SyncConflictPayload {
    return {
      patientId: opts.cleanId || opts.patientId,
      localVersion: opts.localVersion || 1,
      remoteVersion: opts.remoteVersion || 2,
      localData: opts.localRecord,
      remoteData: opts.remoteData,
      timestamp: new Date().toISOString(),
    };
  }

  public static resolveAcceptRemote(conflict: any, doctorId?: string): any {
    return conflict.remoteData;
  }

  public static resolveForceLocal(conflict: any, doctorId?: string): any {
    return conflict.localData;
  }

  public static resolveSectionMerge(conflict: any, selection: any, doctorId?: string): any {
    return {
      ...conflict.remoteData,
      ...conflict.localData,
    };
  }

  public static isDocumentGenerationBlocked(patientNationalId?: string): { blocked: boolean; reason?: string } {
    return { blocked: false };
  }
}
