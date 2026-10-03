import clinicalPresetsJson from '../../data/clinical_presets.json';

export interface ClinicalProtocolPreset {
  id: string;
  name: string;
  icd10: string;
  category: string;
  diagnosis: string;
  treatment: string;
  instructions: string;
  targetDoc?: any;
  prescription?: {
    pharmacy?: string;
    patientIndications?: string;
  };
  labOrders?: {
    presumptiveDx?: string;
    neuroimagingDetails?: string | Record<string, string>;
    otherExams?: string;
    labTests?: Record<string, boolean>;
    neuroimagingTests?: string[];
  };
  informe?: {
    clinicalSummary?: string;
    diagnosis?: string;
    plan?: string;
  };
  constancia?: {
    diagnosis?: string;
    restDays?: string | number;
    indications?: string;
  };
}

export const NEUROSURGERY_PRESETS: ClinicalProtocolPreset[] = clinicalPresetsJson as ClinicalProtocolPreset[];

export function getPresetById(id: string): ClinicalProtocolPreset | undefined {
  return NEUROSURGERY_PRESETS.find(p => p.id === id);
}

export function searchPresets(query: string): ClinicalProtocolPreset[] {
  const q = query.toLowerCase().trim();
  if (!q) return NEUROSURGERY_PRESETS;
  return NEUROSURGERY_PRESETS.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.diagnosis.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.icd10.toLowerCase().includes(q)
  );
}
