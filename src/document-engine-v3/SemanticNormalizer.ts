import { CANONICAL_LAB_REGISTRY, LabCheckboxDef } from './LabCanonicalRegistry';

/**
 * Normaliza un string para búsqueda semántica:
 * Sin acentos, minúsculas y sin caracteres no alfanuméricos.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

/**
 * Calcula similitud léxica basada en tokens y n-gramas.
 * Permite buscar sinónimos médicos con alta tolerancia.
 */
function scoreMatch(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);

  if (!q || !t) return 0;
  if (q === t) return 1.0;
  if (t.includes(q)) return 0.9;
  if (q.includes(t)) return 0.85;

  const qTokens = q.split(/\s+/).filter(Boolean);
  const tTokens = t.split(/\s+/).filter(Boolean);

  let matches = 0;
  for (const token of qTokens) {
    if (tTokens.some(tk => tk.includes(token) || token.includes(tk))) {
      matches++;
    }
  }

  return matches / Math.max(qTokens.length, 1);
}

/**
 * Diccionario de sinónimos clínicos frecuentes en neurocirugía y paraclínicos
 */
const CLINICAL_SYNONYMS: Record<string, string[]> = {
  'hematologia': ['hematologia completa', 'hemograma', 'formula blanca', 'cbc', 'leucocitos'],
  'glicemia': ['glucosa', 'azucar', 'glicemia en ayunas', 'glu'],
  'urea': ['bun', 'nitrogeno ureico'],
  'creatinina': ['cr', 'crea'],
  'plaquetas': ['recuento plaquetario', 'trombocitos'],
  'vsg': ['eritrosedimentacion', 'velocidad de sedimentacion', 'esr'],
  'tp': ['tiempo de protrombina', 'pt'],
  'tpt': ['tiempo parcial de tromboplastina', 'ptt'],
  'fibrinogeno': ['dosificacion de fibrinogeno'],
  'hiv': ['vih', 'sida', 'anticuerpos vih'],
  'vdrl': ['rpr', 'serologia luetica', 'sifilis'],
  'orina': ['examen general de orina', 'ego', 'uroanalisis', 'parcial de orina'],
  'electrolitos': ['ionograma', 'sodio', 'potasio', 'cloro', 'na', 'k', 'cl'],
  'rmn': ['resonancia', 'mri', 'resonancia magnetica', 'rmn columna', 'rmn lumbar', 'rmn cervical'],
  'tac': ['tomografia', 'tac cerebral', 'tac columna', 'tomografia axial computarizada'],
  'radiologia': ['rx', 'rayos x', 'radiografia'],
  'eeg': ['electroencefalograma'],
  'emg': ['electromiografia', 'velocidad de conduccion nerviosa'],
  'pess': ['potenciales evocados', 'potenciales somatosensoriales'],
};

/**
 * Resuelve los exámenes dictados por el LLM contra el registro canónico físico.
 */
export function resolveDictatedExams(dictatedExams: string[]): {
  verifiedFields: LabCheckboxDef[];
  unknownExams: string[];
} {
  const verifiedMap = new Map<string, LabCheckboxDef>();
  const unknownExams: string[] = [];

  for (const rawExam of dictatedExams) {
    if (!rawExam || typeof rawExam !== 'string' || !rawExam.trim()) continue;
    const exam = rawExam.trim();
    const normExam = normalize(exam);

    let bestMatch: LabCheckboxDef | null = null;
    let highestScore = 0;

    for (const def of CANONICAL_LAB_REGISTRY) {
      // 1. Coincidencia exacta por ID o Label
      if (def.id === exam || def.label === exam) {
        bestMatch = def;
        highestScore = 1.0;
        break;
      }

      // 2. Score de texto
      const scoreLabel = scoreMatch(normExam, def.label);
      const scoreId = scoreMatch(normExam, def.id);
      const maxScore = Math.max(scoreLabel, scoreId);

      if (maxScore > highestScore) {
        highestScore = maxScore;
        bestMatch = def;
      }
    }

    // 3. Revisar sinónimos si el score no superó el umbral
    if (highestScore < 0.6) {
      for (const [key, synonyms] of Object.entries(CLINICAL_SYNONYMS)) {
        if (normExam.includes(key) || synonyms.some(syn => normExam.includes(syn))) {
          const matchBySyn = CANONICAL_LAB_REGISTRY.find(d => {
            const normDef = normalize(d.label);
            return normDef.includes(key) || synonyms.some(syn => normDef.includes(syn));
          });
          if (matchBySyn) {
            bestMatch = matchBySyn;
            highestScore = 0.85;
            break;
          }
        }
      }
    }

    if (bestMatch && highestScore >= 0.5) {
      verifiedMap.set(bestMatch.id, bestMatch);
    } else {
      unknownExams.push(exam);
    }
  }

  return {
    verifiedFields: Array.from(verifiedMap.values()),
    unknownExams,
  };
}
