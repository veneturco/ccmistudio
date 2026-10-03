export type ConflictResolutionStrategy =
  | 'LOCAL_WINS'
  | 'REMOTE_WINS'
  | 'MANUAL_MERGE'
  | 'SECTION_MERGE'
  | 'ACCEPT_REMOTE'
  | 'FORCE_LOCAL';

export interface SectionMergeSelection {
  selectedSections: Record<string, 'local' | 'remote'>;
}

export interface SyncConflictPayload {
  patientId: string;
  localVersion: number;
  remoteVersion: number;
  localData: any;
  remoteData: any;
  timestamp: string;
}
