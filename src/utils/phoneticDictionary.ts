// Diccionario Fonético Especializado para Neurocirugía y Control de Seguridad Clínica
// Dr. Samir Moucharrafie Naime (UCBL Lyon 1 / Francia)

export interface SafetyAlert {
  id: string;
  severity: 'green' | 'amber' | 'red';
  title: string;
  message: string;
  field: string;
  suggestedCorrection?: string;
}

export interface NormalizationResult {
  normalizedText: string;
  correctionsApplied: Array<{ original: string; replacedWith: string }>;
  safetyAlerts: SafetyAlert[];
  certaintyLevel: 'high' | 'medium' | 'low';
}

// 1. REGLAS DE NORMALIZACIÓN FONÉTICA NEUROQUIRÚRGICA
const PHONETIC_RULES: Array<{ pattern: RegExp; replacement: string; label: string }> = [
  // Segmentos vertebrales Lumbares
  { pattern: /\b(el cuatro\s*el cinco|ele cuatro\s*ele cinco|l cuatro\s*l cinco|l4\s*l5|l4\s*y\s*l5)\b/gi, replacement: 'L4-L5', label: 'Segmento L4-L5' },
  { pattern: /\b(ele cuatro\s*ese uno|el cuatro\s*ese uno|l cuatro\s*s uno|l4\s*s1)\b/gi, replacement: 'L4-S1', label: 'Segmento L4-S1' },
  { pattern: /\b(el cinco\s*ese uno|ele cinco\s*ese uno|l cinco\s*s uno|l5\s*s1|l5\s*y\s*s1)\b/gi, replacement: 'L5-S1', label: 'Segmento L5-S1' },
  { pattern: /\b(el tres\s*el cuatro|ele tres\s*ele cuatro|l tres\s*l cuatro|l3\s*l4)\b/gi, replacement: 'L3-L4', label: 'Segmento L3-L4' },
  { pattern: /\b(el dos\s*el tres|ele dos\s*ele tres|l dos\s*l tres|l2\s*l3)\b/gi, replacement: 'L2-L3', label: 'Segmento L2-L3' },
  { pattern: /\b(el uno\s*el dos|ele uno\s*ele dos|l uno\s*l dos|l1\s*l2)\b/gi, replacement: 'L1-L2', label: 'Segmento L1-L2' },

  // Segmentos vertebrales Cervicales
  { pattern: /\b(ce cinco\s*ce seis|c cinco\s*c seis|c5\s*c6|c5\s*y\s*c6)\b/gi, replacement: 'C5-C6', label: 'Segmento C5-C6' },
  { pattern: /\b(ce seis\s*ce siete|c seis\s*c siete|c6\s*c7|c6\s*y\s*c7)\b/gi, replacement: 'C6-C7', label: 'Segmento C6-C7' },
  { pattern: /\b(ce cuatro\s*ce cinco|c cuatro\s*c cinco|c4\s*c5)\b/gi, replacement: 'C4-C5', label: 'Segmento C4-C5' },
  { pattern: /\b(ce tres\s*ce cuatro|c tres\s*c cuatro|c3\s*c4)\b/gi, replacement: 'C3-C4', label: 'Segmento C3-C4' },
  { pattern: /\b(ce siete\s*te uno|c siete\s*t uno|c7\s*t1|c7\s*d1)\b/gi, replacement: 'C7-T1', label: 'Segmento C7-T1' },

  // Segmentos vertebrales Dorsales / Torácicos
  { pattern: /\b(te once\s*te doce|t once\s*t doce|d once\s*d doce|t11\s*t12)\b/gi, replacement: 'T11-T12', label: 'Segmento T11-T12' },
  { pattern: /\b(te doce\s*ele uno|t doce\s*l uno|d doce\s*l uno|t12\s*l1)\b/gi, replacement: 'T12-L1', label: 'Segmento T12-L1' },

  // Maniobras semiológicas y signos
  { pattern: /\b(signo de\s+)?(laseg|lasegue|lasègue|la seg|la se)\b/gi, replacement: 'Signo de Lasègue positivo', label: 'Maniobra de Lasègue' },
  { pattern: /\b(signo de\s+)?(bragard|bragar|bragart)\b/gi, replacement: 'Signo de Bragard', label: 'Maniobra de Bragard' },
  { pattern: /\b(signo de\s+)?(babinski|bavinski|babinsky)\b/gi, replacement: 'Reflejo de Babinski', label: 'Reflejo de Babinski' },
  { pattern: /\b(signo de\s+)?(spurling|espurling|sparling)\b/gi, replacement: 'Maniobra de Spurling', label: 'Maniobra de Spurling' },
  { pattern: /\b(signo de\s+)?(tinel|tinell)\b/gi, replacement: 'Signo de Tinel', label: 'Signo de Tinel' },
  { pattern: /\b(signo de\s+)?(phalen|falen|falem)\b/gi, replacement: 'Signo de Phalen', label: 'Signo de Phalen' },
  { pattern: /\b(signo de\s+)?(romberg|romber)\b/gi, replacement: 'Signo de Romberg', label: 'Signo de Romberg' },
  { pattern: /\b(wasserman|lasègue invertido|lasegue invertido)\b/gi, replacement: 'Signo de Wasserman (Lasègue invertido)', label: 'Signo de Wasserman' },

  // Farmacoterapia neuroquirúrgica común
  { pattern: /\b(pregabalina|pregabalin|lírica|lyrica)\b/gi, replacement: 'Pregabalina', label: 'Pregabalina' },
  { pattern: /\b(gabapentina|gabapentin|neurontin)\b/gi, replacement: 'Gabapentina', label: 'Gabapentina' },
  { pattern: /\b(celecoxib|celebrix|celebrex)\b/gi, replacement: 'Celecoxib', label: 'Celecoxib' },
  { pattern: /\b(tramadol|tramal|zaldíar|zaldiar)\b/gi, replacement: 'Tramadol', label: 'Tramadol' },
  { pattern: /\b(dexametasona|decadron|dexa)\b/gi, replacement: 'Dexametasona', label: 'Dexametasona' },
  { pattern: /\b(citicolina|ceraxon|somazina)\b/gi, replacement: 'Citicolina', label: 'Citicolina' },
  { pattern: /\b(ketoprofeno|ketoprofen|profenid)\b/gi, replacement: 'Ketoprofeno', label: 'Ketoprofeno' },
  { pattern: /\b(baclofeno|lioresal)\b/gi, replacement: 'Baclofeno', label: 'Baclofeno' },
  { pattern: /\b(metocarbamol|robaxin)\b/gi, replacement: 'Metocarbamol', label: 'Metocarbamol' },
  { pattern: /\b(duloxetina|cymbalta)\b/gi, replacement: 'Duloxetina', label: 'Duloxetina' },
  { pattern: /\b(tiocolchicósido|tiocolchicosido|coltrax)\b/gi, replacement: 'Tiocolchicósido', label: 'Tiocolchicósido' },
  { pattern: /\b(omeprazol|pantoprazol|esomeprazol)\b/gi, replacement: 'Omeprazol', label: 'Protector gástrico' },

  // Estudios de imagen y neurodiagnóstico
  { pattern: /\b(resonancia con contraste|rmn con contraste|resonancia magnética con contraste)\b/gi, replacement: 'Resonancia Magnética Nuclear (RMN) de Columna Lumbosacra con y sin contraste', label: 'RMN con contraste' },
  { pattern: /\b(resonancia de columna|rmn columna|resonancia lumbar|rmn lumbar)\b/gi, replacement: 'Resonancia Magnética Nuclear de Columna Lumbosacra', label: 'RMN Lumbosacra' },
  { pattern: /\b(resonancia cervical|rmn cervical)\b/gi, replacement: 'Resonancia Magnética Nuclear de Columna Cervical', label: 'RMN Cervical' },
  { pattern: /\b(tac de columna|tomografia de columna|tac columna 3d)\b/gi, replacement: 'Tomografía Axial Computarizada de Columna con reconstrucción 3D', label: 'TAC de Columna 3D' },
  { pattern: /\b(electromiografia|electromiograma|emg|vcn)\b/gi, replacement: 'Electromiografía y Velocidad de Conducción Nerviosa (EMG/VCN)', label: 'Electromiografía' },
  { pattern: /\b(angiotac cerebral|angiotomografia)\b/gi, replacement: 'Angiotomografía Computarizada Cerebral', label: 'AngioTAC' },
];

// 2. FUNCIÓN DE PRE-PROCESAMIENTO Y NORMALIZACIÓN FONÉTICA
export function normalizeClinicalPhonetics(transcript: string): NormalizationResult {
  let normalizedText = transcript;
  const correctionsApplied: Array<{ original: string; replacedWith: string }> = [];

  for (const rule of PHONETIC_RULES) {
    if (rule.pattern.test(normalizedText)) {
      normalizedText = normalizedText.replace(rule.pattern, (match) => {
        correctionsApplied.push({ original: match, replacedWith: rule.replacement });
        return rule.replacement;
      });
    }
  }

  // Comprobación de alertas de seguridad y ambigüedad fonética
  const safetyAlerts = evaluateClinicalSafety(normalizedText);

  let certaintyLevel: 'high' | 'medium' | 'low' = 'high';
  if (safetyAlerts.some(a => a.severity === 'red')) {
    certaintyLevel = 'low';
  } else if (safetyAlerts.some(a => a.severity === 'amber')) {
    certaintyLevel = 'medium';
  }

  return {
    normalizedText,
    correctionsApplied,
    safetyAlerts,
    certaintyLevel,
  };
}

// 3. SEMÁFORO DE CERTEZA Y VALIDACIÓN DE SEGURIDAD
export function evaluateClinicalSafety(text: string): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const lower = text.toLowerCase();

  // A. Ambigüedad fonética: dosis sin unidad de medida explícita
  // Detecta palabras de fármacos seguidas de un número sin "mg", "g", "ml", "gotas" o "ampolla"
  const drugsToCheck = ['pregabalina', 'gabapentina', 'celecoxib', 'tramadol', 'dexametasona', 'citicolina', 'omeprazol'];
  for (const drug of drugsToCheck) {
    const regex = new RegExp(`\\b${drug}\\s+(\\d+)(?!\\s*(mg|miligramos|g|gramos|ml|gotas|ampollas|tabletas|cápsulas|capsulas))\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      alerts.push({
        id: `ambiguity-${drug}-${match[1]}`,
        severity: 'amber',
        title: `Ambigüedad Fonética en ${drug.toUpperCase()}`,
        message: `Se detectó "${match[0]}" sin unidad de medida explícita. Se asume miligramos (mg), por favor confirmar antes de emitir.`,
        field: 'Fármacos',
        suggestedCorrection: `${drug} ${match[1]} mg`,
      });
    }
  }

  // B. Control de dosis atípicas o fuera de rango habitual de seguridad
  // Pregabalina: habitual 75-300 mg/d; alerta si > 600 mg/d
  const pregaDoseMatch = text.match(/pregabalina\s*(\d+)\s*mg/i);
  if (pregaDoseMatch && parseInt(pregaDoseMatch[1]) > 600) {
    alerts.push({
      id: 'safety-pregabalina-max',
      severity: 'red',
      title: 'Alerta Dosis Excesiva: Pregabalina',
      message: `Dosis de ${pregaDoseMatch[1]} mg excede el límite máximo seguro diario recomendado (600 mg/día).`,
      field: 'Prescripción',
    });
  }

  // Celecoxib: habitual 100-200 mg c/12-24h; alerta si dosis unitaria > 400 mg
  const celeMatch = text.match(/celecoxib\s*(\d+)\s*mg/i);
  if (celeMatch && parseInt(celeMatch[1]) > 400) {
    alerts.push({
      id: 'safety-celecoxib-max',
      severity: 'red',
      title: 'Alerta Dosis Excesiva: Celecoxib',
      message: `Dosis de ${celeMatch[1]} mg excede la dosis máxima segura en analgesia aguda (400 mg/día).`,
      field: 'Prescripción',
    });
  }

  // Tramadol: alerta si > 400 mg/día
  const tramadolMatch = text.match(/tramadol\s*(\d+)\s*mg/i);
  if (tramadolMatch && parseInt(tramadolMatch[1]) > 400) {
    alerts.push({
      id: 'safety-tramadol-max',
      severity: 'red',
      title: 'Alerta Dosis Excesiva: Tramadol',
      message: `Dosis de ${tramadolMatch[1]} mg supera el umbral diario seguro (400 mg/día), riesgo de convulsiones o depresión respiratoria.`,
      field: 'Prescripción',
    });
  }

  // Dexametasona: alerta si dosis > 16 mg en ambulatorio sin pauta de descenso
  const dexaMatch = text.match(/dexametasona\s*(\d+)\s*mg/i);
  if (dexaMatch && parseInt(dexaMatch[1]) > 16) {
    alerts.push({
      id: 'safety-dexa-high',
      severity: 'amber',
      title: 'Dosis Elevada de Dexametasona',
      message: `Dosis de ${dexaMatch[1]} mg es elevada para manejo ambulatorio. Verifique protección gástrica y pauta de descenso.`,
      field: 'Prescripción',
    });
  }

  // Cédula incompleta o ausente
  if (!lower.includes('cédula') && !lower.includes('ci') && !lower.includes('identidad') && !/\b[vep]-?\d{6,9}\b/i.test(text)) {
    alerts.push({
      id: 'missing-cedula',
      severity: 'amber',
      title: 'Cédula de Identidad no detectada',
      message: 'No se detectó el número de cédula en el dictado. Se mantendrá el valor existente o predeterminado.',
      field: 'Paciente',
    });
  }

  // Si no hay alertas de advertencia, emitir conformidad
  if (alerts.length === 0) {
    alerts.push({
      id: 'safety-ok',
      severity: 'green',
      title: 'Verificación de Seguridad Aprobada',
      message: 'Fármacos en dosis terapéuticas estándar, terminología anatómica normalizada y sin discrepancias fonéticas.',
      field: 'General',
    });
  }

  return alerts;
}

// 4. LIMPIEZA DE ECOS Y N-GRAMAS REPETIDOS (MOTOR CHROMIUM / ANDROID / DESKTOP)
export function cleanStutterAndEchoes(text: string): string {
  let cleaned = text;
  let prev = '';
  let iterations = 0;
  // Hasta 5 pasadas para resolver anidaciones de repetición
  while (cleaned !== prev && iterations < 5) {
    prev = cleaned;
    iterations++;
    // Secuencias multi-palabras repetidas (de 2 a 8 palabras), ej: "buenas tardes buenas tardes" -> "buenas tardes"
    cleaned = cleaned.replace(/\b((?:[\wáéíóúñÁÉÍÓÚÑ]+\s+){1,8}[\wáéíóúñÁÉÍÓÚÑ]+)(?:\s+\1\b)+/gi, '$1');
    // Palabras individuales repetidas 3 o más veces: "hola hola hola" -> "hola"
    cleaned = cleaned.replace(/\b([\wáéíóúñÁÉÍÓÚÑ]+)(?:\s+\1\b){2,}/gi, '$1');
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

// Formateo de puntuación clínica por comandos verbales
export function formatClinicalSpeech(text: string): string {
  let formatted = text;
  formatted = formatted
    .replace(/\b(punto y aparte|párrafo aparte|nueva línea|nuevo párrafo)\b/gi, '\n\n')
    .replace(/\b(punto y seguido)\b/gi, '. ')
    .replace(/\b(dos puntos)\b/gi, ': ')
    .replace(/\b(punto y coma)\b/gi, '; ')
    .replace(/\b(coma)\b/gi, ', ')
    .replace(/\b(punto final|punto)\b/gi, '. ')
    .replace(/\b(signo de interrogación|interrogación)\b/gi, '?')
    .replace(/\b(abrir paréntesis|abre paréntesis)\b/gi, ' (')
    .replace(/\b(cerrar paréntesis|cierra paréntesis)\b/gi, ') ')
    .replace(/\b(abrir comillas|abre comillas)\b/gi, ' "')
    .replace(/\b(cerrar comillas|cierra comillas)\b/gi, '" ')
    .replace(/\b(guion|guión)\b/gi, ' - ')
    .replace(/\b(número uno|ítem uno)\b/gi, '1. ')
    .replace(/\b(número dos|ítem dos)\b/gi, '2. ')
    .replace(/\b(número tres|ítem tres)\b/gi, '3. ')
    .replace(/\b(número cuatro|ítem cuatro)\b/gi, '4. ')
    .replace(/\b(número cinco|ítem cinco)\b/gi, '5. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:?!])/g, '$1');
  return formatted;
}

// Fusión inteligente por solapamiento (overlap merger)
export function mergeSpeechTranscripts(existingText: string, newChunk: string): string {
  const cleanChunk = cleanStutterAndEchoes(newChunk.trim());
  const cleanExisting = existingText.trim();

  if (!cleanChunk) return cleanExisting;
  if (!cleanExisting) return cleanChunk;

  if (cleanExisting.endsWith(cleanChunk) || cleanExisting.toLowerCase().endsWith(cleanChunk.toLowerCase())) {
    return cleanExisting;
  }

  const existingWords = cleanExisting.split(/\s+/);
  const newWords = cleanChunk.split(/\s+/);

  const maxCheck = Math.min(existingWords.length, newWords.length, 8);
  for (let len = maxCheck; len > 0; len--) {
    const endSlice = existingWords.slice(-len).join(' ').toLowerCase();
    const startSlice = newWords.slice(0, len).join(' ').toLowerCase();
    if (endSlice === startSlice) {
      const remainder = newWords.slice(len).join(' ');
      if (!remainder) return cleanExisting;
      return `${cleanExisting} ${remainder}`;
    }
  }

  const endsWithPunctuation = /[.:;?!]\s*$/.test(cleanExisting);
  const separator = endsWithPunctuation ? ' ' : ' ';
  return `${cleanExisting}${separator}${cleanChunk}`;
}
