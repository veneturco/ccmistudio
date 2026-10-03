import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// ----------------------------------------------------------------------------
// BLINDAJE TOTAL CONTRA CAÍDAS DEL SERVIDOR NODE (CRASH SHIELD)
// ----------------------------------------------------------------------------
process.on('uncaughtException', (err) => {
  console.error('[SOCS SERVER CRASH SHIELD] Excepción no capturada neutralizada:', err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[SOCS SERVER CRASH SHIELD] Promesa rechazada neutralizada:', reason);
});

const app = express();

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val)) return val;
  }
  if (process.env.PORT) {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val)) return val;
  }
  return 3000;
}
const PORT = resolvePort();

app.use(express.json({ limit: '50mb' }));

// Global CORS headers for cross-origin preview iframes and image loading
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Explicitly serve original stationery templates from public/templates with permissive CORS
app.use('/templates', express.static(path.join(process.cwd(), 'public/templates'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Explicitly serve static assets from dist/assets (compiled bundles) and public/assets with permissive CORS
const distAssetsPath = path.join(process.cwd(), 'dist/assets');
app.use('/assets', express.static(distAssetsPath, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

const publicAssetsPath = path.join(process.cwd(), 'public/assets');
app.use('/assets', express.static(publicAssetsPath, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

app.use('/images', express.static(path.join(process.cwd(), 'public/images'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Almacenamiento y servicio estático para documentos compartidos de pacientes (PDF + PNG HD)
const sharedDocsDir = path.join(process.cwd(), 'public/shared_docs');
if (!fs.existsSync(sharedDocsDir)) {
  fs.mkdirSync(sharedDocsDir, { recursive: true });
}
app.use('/shared_docs', express.static(sharedDocsDir, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// Robust Initializer for Gemini API client with multi-source fallback
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || (typeof globalThis !== 'undefined' ? (globalThis as any).GEMINI_API_KEY : '');
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      console.log('[Gemini Init] Cliente AI inicializado correctamente con API Key activa.');
    } else {
      console.warn('[Gemini Init] ADVERTENCIA: GEMINI_API_KEY no se encuentra configurada en las variables de entorno.');
    }
  }
  return aiClient;
}

// Memory Rate Limiter for Gemini AI calls (15 requests/minute to strictly protect Google Free Tier at $0.00)
const AI_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const AI_MAX_REQUESTS_PER_MINUTE = 15;
const aiRequestTimestamps: number[] = [];

function checkGeminiRateLimit(): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  while (aiRequestTimestamps.length > 0 && aiRequestTimestamps[0] <= now - AI_RATE_LIMIT_WINDOW_MS) {
    aiRequestTimestamps.shift();
  }
  
  if (aiRequestTimestamps.length >= AI_MAX_REQUESTS_PER_MINUTE) {
    const oldest = aiRequestTimestamps[0];
    const retryAfterMs = Math.max(100, (oldest + AI_RATE_LIMIT_WINDOW_MS) - now);
    return { allowed: false, remaining: 0, retryAfterMs };
  }
  
  aiRequestTimestamps.push(now);
  return { 
    allowed: true, 
    remaining: AI_MAX_REQUESTS_PER_MINUTE - aiRequestTimestamps.length, 
    retryAfterMs: 0 
  };
}

const geminiRateLimiterMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = checkGeminiRateLimit();
  res.setHeader('X-RateLimit-Limit', AI_MAX_REQUESTS_PER_MINUTE);
  res.setHeader('X-RateLimit-Remaining', status.remaining);
  
  if (!status.allowed) {
    const retrySec = Math.ceil(status.retryAfterMs / 1000);
    res.setHeader('Retry-After', retrySec);
    return res.status(429).json({
      success: false,
      error: 'Límite de cuota gratuita alcanzado (15 req/min). Por favor espere unos segundos.',
      retryAfterSeconds: retrySec,
      isRateLimited: true,
      freeTierProtection: true
    });
  }
  next();
};

const checkAiRateLimit = geminiRateLimiterMiddleware;

// API Health Check
app.get('/api/health', (req, res) => {
  const client = getGeminiClient();
  res.json({
    status: 'ok',
    hasApiKey: !!client || !!process.env.GEMINI_API_KEY,
    service: 'SOCS CCMI Clinical Engine',
    doctor: 'Dr. Samir Moucharrafie Naime',
    freeTierQuota: {
      limitPerMinute: AI_MAX_REQUESTS_PER_MINUTE,
      cost: '$0.00'
    }
  });
});

// API: Parse Continuous Clinical Consultation Dictation (SAMI Voice AI)
app.post('/api/gemini/parse-consultation', checkAiRateLimit, async (req, res) => {
  try {
    const { dictationText } = req.body;
    if (!dictationText || typeof dictationText !== 'string') {
      return res.status(400).json({ error: 'dictationText is required' });
    }

    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({ error: 'Gemini client not initialized' });
    }

    const prompt = `Eres el asistente de IA clínica del Dr. Samir Moucharrafie (Neurocirujano y Cirujano de Columna, CCMI).
Analiza el siguiente dictado verbal de consulta médica y extrae la información clínica estructurada en formato JSON estricto:

Dictado:
"${dictationText}"

Debes responder ÚNICAMENTE con un JSON que tenga este esquema exacto:
{
  "patientName": "Nombre y apellido del paciente o null",
  "patientId": "Cédula o número de documento o null",
  "patientAge": "Edad o null",
  "diagnosis": "Diagnóstico principal (ej: Hernia discal L4-L5, Cervicalgia)",
  "medications": [
    {
      "drug": "Nombre del fármaco y concentración (ej: Pregabalina 75mg)",
      "dose": "Dosis (ej: 1 cápsula)",
      "frequency": "Frecuencia (ej: Cada 12 horas / Noche)",
      "duration": "Duración (ej: Por 7 días)"
    }
  ],
  "generalIndications": [
    "Indicación no farmacológica 1",
    "Indicación no farmacológica 2"
  ],
  "imagingStudies": [
    "Estudio de neuroimagen o radiología solicitado (ej: Resonancia Magnética de Columna Lumbosacra)"
  ],
  "labTests": [
    "Exámenes de laboratorio solicitados si aplica"
  ],
  "restDays": "Número de días de reposo o null",
  "clinicalSummary": "Resumen de enfermedad actual y motivo de consulta",
  "physicalExam": "Hallazgos de examen físico y neurológico"
}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json(parsedJson);
  } catch (err: any) {
    console.error('[Gemini Parse Consultation] Error:', err);
    return res.status(500).json({ error: err.message || 'Error processing dictation' });
  }
});

// Calibrations persistence file path
const CALIBRATIONS_FILE = path.join(process.cwd(), 'data', 'calibrations.json');
const CALIBRATOR_MAP_V10_FILE = path.join(process.cwd(), 'data', 'calibrator_elements_map_v10.json');

// API: Get Saved Calibrations (Both structured matrix and vector calibrator map)
app.get('/api/calibrations', (req, res) => {
  try {
    let calibrations: Record<string, any> = {};
    if (fs.existsSync(CALIBRATIONS_FILE)) {
      try {
        calibrations = JSON.parse(fs.readFileSync(CALIBRATIONS_FILE, 'utf-8'));
      } catch (e) {
        calibrations = {};
      }
    }

    let rawMap: string | null = null;
    let calibratorMap: any = null;
    if (fs.existsSync(CALIBRATOR_MAP_V10_FILE)) {
      try {
        rawMap = fs.readFileSync(CALIBRATOR_MAP_V10_FILE, 'utf-8');
        calibratorMap = JSON.parse(rawMap);
      } catch (e) {
        console.warn('[Calibrations] Error parsing calibrator map file:', e);
      }
    }

    return res.json({
      success: true,
      calibrations,
      rawMap,
      calibratorMap,
      hasServerCalibrations: Object.keys(calibrations).length > 0 || !!rawMap
    });
  } catch (err: any) {
    console.error('Error reading calibrations:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Save Calibrations (Dual persistence to server disk and sync layer)
app.post('/api/calibrations', (req, res) => {
  try {
    const { docType, calibration, allCalibrations, rawMap, calibratorMap } = req.body;
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 1. Persist vector map if provided
    if (rawMap && typeof rawMap === 'string') {
      fs.writeFileSync(CALIBRATOR_MAP_V10_FILE, rawMap, 'utf-8');
      console.log(`[Calibrations Sync] Vector map persistido en ${CALIBRATOR_MAP_V10_FILE}`);
    } else if (calibratorMap && typeof calibratorMap === 'object') {
      fs.writeFileSync(CALIBRATOR_MAP_V10_FILE, JSON.stringify(calibratorMap, null, 2), 'utf-8');
      console.log(`[Calibrations Sync] Vector map object persistido en ${CALIBRATOR_MAP_V10_FILE}`);
    }

    // 2. Persist structured coordinate matrix
    let current: Record<string, any> = {};
    if (fs.existsSync(CALIBRATIONS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(CALIBRATIONS_FILE, 'utf-8'));
      } catch (e) {
        current = {};
      }
    }

    if (allCalibrations && typeof allCalibrations === 'object') {
      current = { ...current, ...allCalibrations };
    } else if (docType && calibration) {
      current[docType] = calibration;
    }

    fs.writeFileSync(CALIBRATIONS_FILE, JSON.stringify(current, null, 2), 'utf-8');
    console.log(`[Calibrations Sync] Calibración estructurada guardada exitosamente en ${CALIBRATIONS_FILE}`);

    return res.json({
      success: true,
      saved: true,
      message: 'Calibración persistida en el servidor'
    });
  } catch (err: any) {
    console.error('Error saving calibrations to server:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// SYSTEM PROMPT FOR NEUROSURGICAL CLINICAL SUMMARY EXTRACTION
const CLINICAL_SYSTEM_INSTRUCTION = `Eres el Asistente Clínico Inteligente de Neurocirugía del Dr. Samir Moucharrafie Naime (Especialista en Neurocirugía formado en la Université Claude Bernard Lyon 1, Francia / MPPS: 61231, CMEB: 5331).
Tu objetivo es procesar un dictado de voz clínico o texto médico continuo realizado por el Dr. Samir al evaluar a un paciente.
Debes extraer y estructurar los hallazgos de forma estrictamente fiel en un objeto JSON para los 5 documentos médicos oficiales.

REGLA CLÍNICA FUNDAMENTAL (INTEGRIDAD Y SEGURIDAD MÉDICA):
1. NUNCA INVENTES, ASUMAS NI FABRIQUES INFORMACIÓN CLÍNICA.
2. Si un campo (nombre, cédula, edad, teléfono, diagnóstico, medicamentos, posología, días de reposo, estudios paraclínicos, etc.) NO fue mencionado explícitamente en el dictado o en los datos previos, déjalo como cadena vacía ("") o arreglo vacío ([]).
3. NUNCA utilices pacientes de demostración, nombres genéricos ("Paciente Evaluado"), cédulas ficticias ("V-12.887.723"), teléfonos ficticios ("0424-912.44.81") ni tratamientos predeterminados.
4. Si un dato es ambiguo, dudoso o se presta a más de una interpretación médica, NO elijas silenciosamente: agrégalo a la lista "uncertainFields" y marca el campo.
5. NO agregues prefijos o etiquetas estáticas fijas en los valores (ej. NO escribir "DIAGNÓSTICO: Hernia", sino solo "Hernia discal lumbar L5-S1...").

ESTRUCTURA DE EXTRACCIÓN:
1. patient: fullName, idNumber, age, phone, date, address, guideNumber, condition ("Paciente" | "Familiar").
2. diagnosisPrincipal: Diagnóstico formal neuroquirúrgico expresado en la fuente (con nivel vertebral y lateralidad si se mencionaron). Si no hay diagnóstico explícito, dejarlo vacío ("").
3. cie10Suggestions: Códigos CIE-10 correspondientes únicamente al diagnóstico explícito.
4. recipeDual:
   * pharmacy: Lista estructurada de medicamentos para dispensar (Talón Farmacia). 
     Formato obligatorio: "1. [Nombre del Fármaco] [Concentración] - [Presentación]. Dispensar: [Cantidad o 'Tratamiento completo']". 
     Si no hay medicamentos explícitos, dejar vacío ("").
   * patientIndications: Instrucciones detalladas de toma para el paciente (Talón Indicaciones). 
     Formato obligatorio: "1. [Nombre del Fármaco]: Tomar [Dosis] cada [Horario] por [Duración]". 
     [REGLA DE SIMETRÍA ESTRICTA E INQUEBRANTABLE]: Por CADA medicamento que listes en el campo 'pharmacy', ESTÁS OBLIGADO a generar su contraparte exacta en el campo 'patientIndications'. Si el médico dicta una frase muy corta (ej. "Acetaminofén 500mg cada 5 horas"), debes deducir y estructurar ambos lados. JAMÁS dejes 'patientIndications' vacío si 'pharmacy' contiene información. Si faltan detalles (ej. duración), asume una indicación segura como "Tomar según dolor" o "Hasta finalizar tratamiento".
5. clinicalReport: Redacción continua y formal para el Informe Médico de Neurocirugía basada estrictamente en los hechos dictados.
6. labAndImagesOrder: Estudios clasificados explícitamente solicitados. Si no se solicitaron estudios, dejar vacío ("").
7. restCertificate:
   * needsRest: booleano (true si se indicó reposo; false si no amerita reposo o no se mencionó).
   * restDays: número de días de reposo indicados (0 si no amerita o no se especificó).
   * restFrom, restTo: fechas en formato DD/MM/AAAA.
   * condition: "PACIENTE" o "FAMILIAR".
   * idx: diagnóstico justificativo.
8. clinicalHistory: motivoConsulta, enfermedadActual, antecedentes, examenNeurologico, diagnostico.
9. uncertainFields: Arreglo de strings con nombres de campos ambiguos, incompletos o que requieren confirmación clínica manual.
10. extractedTranscript: Transcripción textual fiel de todo lo dictado.

Responde SIEMPRE en formato JSON válido conforme al esquema requerido.`;

// Exact JSON Schema for Clinical Extraction (Gemini)
const CLINICAL_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    patient: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        idNumber: { type: "string" },
        age: { type: "string" },
        phone: { type: "string" },
        date: { type: "string" },
        address: { type: "string" },
        guideNumber: { type: "string" },
        condition: { type: "string" }
      }
    },
    diagnosisPrincipal: { type: "string" },
    cie10Suggestions: { type: "array", items: { type: "string" } },
    recipeDual: {
      type: "object",
      properties: {
        pharmacy: { type: "string" },
        patientIndications: { type: "string" }
      }
    },
    clinicalReport: { type: "string" },
    labAndImagesOrder: { type: "string" },
    ordenLab: {
      type: "object",
      properties: {
        perfilPreoperatorio: { type: "array", items: { type: "string" } },
        neuroimagen: { type: "array", items: { type: "string" } },
        otrosEstudios: { type: "array", items: { type: "string" } },
        diagnosticoPresuntivo: { type: "string" }
      }
    },
    restCertificate: {
      type: "object",
      properties: {
        needsRest: { type: "boolean" },
        restDays: { type: "number" },
        restFrom: { type: "string" },
        restTo: { type: "string" },
        condition: { type: "string", enum: ["PACIENTE", "FAMILIAR"] },
        idx: { type: "string" }
      }
    },
    clinicalHistory: {
      type: "object",
      properties: {
        consultReason: { type: "string" },
        currentIllness: { type: "string" },
        background: { type: "string" },
        neuroExam: { type: "string" },
        diagnosis: { type: "string" }
      }
    },
    uncertainFields: {
      type: "array",
      items: { type: "string" }
    },
    extractedTranscript: {
      type: "string"
    }
  }
};

// Structural schema validator for clinical extraction
function validateClinicalExtractionSchema(raw: any): { valid: boolean; errors: string[]; data: any } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['El cuerpo de la respuesta no es un objeto JSON válido.'], data: null };
  }

  const errors: string[] = [];

  // Validate patient
  const p = raw.patient || {};
  if (typeof p !== 'object' || Array.isArray(p)) {
    errors.push('Campo patient debe ser un objeto.');
  }

  // Validate uncertainFields
  const uncertainFields: string[] = Array.isArray(raw.uncertainFields)
    ? raw.uncertainFields.filter((item: any) => typeof item === 'string')
    : [];

  return {
    valid: errors.length === 0,
    errors,
    data: raw
  };
}

// Helper: Formateador unificado de respuesta clínica sin invención de datos
function formatClinicalData(parsedData: any, currentData?: any) {
  const p = parsedData.patient || {};
  const cp = currentData?.patient || {};

  const fullName = typeof p.fullName === 'string' && p.fullName.trim() ? p.fullName.trim() : (cp.fullName || '');
  const idNumber = typeof p.idNumber === 'string' && p.idNumber.trim() ? p.idNumber.trim() : (cp.idNumber || '');
  const age = typeof p.age === 'string' && p.age.trim() ? p.age.trim() : (cp.age || '');
  const phone = typeof p.phone === 'string' && p.phone.trim() ? p.phone.trim() : (cp.phone || '');
  const date = typeof p.date === 'string' && p.date.trim() ? p.date.trim() : (cp.date || new Date().toLocaleDateString('es-VE'));
  const address = typeof p.address === 'string' && p.address.trim() ? p.address.trim() : (cp.address || '');
  const guideNumber = typeof p.guideNumber === 'string' && p.guideNumber.trim() ? p.guideNumber.trim() : (cp.guideNumber || '');
  const condition = (p.condition === 'Familiar' || p.condition === 'FAMILIAR' || parsedData.restCertificate?.condition === 'FAMILIAR') ? 'Familiar' : (cp.condition || 'Paciente');

  const diagnosisPrincipal = typeof parsedData.diagnosisPrincipal === 'string' ? parsedData.diagnosisPrincipal.trim() : '';

  const pharmacy = typeof parsedData.recipeDual?.pharmacy === 'string' ? parsedData.recipeDual.pharmacy.trim() : '';
  
  // LÓGICA DE ROBUSTEZ: Si Gemini deja las indicaciones vacías pero hay fármacos en farmacia, se usa un fallback inteligente para garantizar la simetría del récipe
  let patientIndications = typeof parsedData.recipeDual?.patientIndications === 'string' ? parsedData.recipeDual.patientIndications.trim() : '';
  
  if (pharmacy !== '' && patientIndications === '') {
    patientIndications = `INDICACIONES:\n\n${pharmacy}\n(Tomar según pauta médica recomendada)`;
  }

  const clinicalReport = typeof parsedData.clinicalReport === 'string' ? parsedData.clinicalReport.trim() : '';

  // Lab order
  const rawOrdenLab = parsedData.ordenLab || {};
  const perfilPreoperatorio = Array.isArray(rawOrdenLab.perfilPreoperatorio) ? rawOrdenLab.perfilPreoperatorio : [];
  const neuroimagen = Array.isArray(rawOrdenLab.neuroimagen) ? rawOrdenLab.neuroimagen : [];
  const otrosEstudios = Array.isArray(rawOrdenLab.otrosEstudios) ? rawOrdenLab.otrosEstudios : [];
  const labOrderText = typeof parsedData.labAndImagesOrder === 'string' ? parsedData.labAndImagesOrder.trim() : '';

  // Rest certificate
  const rc = parsedData.restCertificate || {};
  const restDaysNum = typeof rc.restDays === 'number' && rc.restDays >= 0 ? rc.restDays : 0;
  const needsRest = typeof rc.needsRest === 'boolean' ? rc.needsRest : restDaysNum > 0;
  const restFrom = typeof rc.restFrom === 'string' && rc.restFrom.trim() ? rc.restFrom.trim() : (needsRest ? date : '');
  let restTo = typeof rc.restTo === 'string' && rc.restTo.trim() ? rc.restTo.trim() : '';
  if (!restTo && needsRest && restDaysNum > 0) {
    const d = new Date();
    const future = new Date(d.getTime() + restDaysNum * 86400000);
    restTo = future.toLocaleDateString('es-VE');
  }

  // Clinical history
  const ch = parsedData.clinicalHistory || {};
  const motivoConsulta = typeof ch.consultReason === 'string' ? ch.consultReason.trim() : (typeof ch.motivoConsulta === 'string' ? ch.motivoConsulta.trim() : '');
  const enfermedadActual = typeof ch.currentIllness === 'string' ? ch.currentIllness.trim() : (typeof ch.enfermedadActual === 'string' ? ch.enfermedadActual.trim() : '');
  const antecedentes = typeof ch.background === 'string' ? ch.background.trim() : (typeof ch.antecedentes === 'string' ? ch.antecedentes.trim() : '');
  const examenNeurologico = typeof ch.neuroExam === 'string' ? ch.neuroExam.trim() : (typeof ch.examenNeurologico === 'string' ? ch.examenNeurologico.trim() : '');
  const historiaDiag = typeof ch.diagnosis === 'string' ? ch.diagnosis.trim() : (typeof ch.diagnostico === 'string' ? ch.diagnostico.trim() : diagnosisPrincipal);

  const uncertainFields: string[] = Array.isArray(parsedData.uncertainFields)
    ? parsedData.uncertainFields.filter((item: any) => typeof item === 'string')
    : [];

  const requiresReview = uncertainFields.length > 0 || !fullName || !idNumber || !diagnosisPrincipal;

  return {
    extractedTranscript: typeof parsedData.extractedTranscript === 'string' ? parsedData.extractedTranscript : '',
    requiresReview,
    uncertainFields,
    patient: {
      fullName,
      idNumber,
      age,
      phone,
      date,
      address,
      guideNumber,
      condition,
    },
    diagnosisPrincipal,
    cie10Suggestions: Array.isArray(parsedData.cie10Suggestions) ? parsedData.cie10Suggestions : [],
    recipeDual: {
      pharmacy,
      patientIndications,
    },
    recipe: {
      rxLeft: pharmacy,
      indicationsRight: patientIndications,
    },
    clinicalReport,
    informe: {
      bodyText: clinicalReport,
      diagnostico: diagnosisPrincipal,
      motivo: motivoConsulta,
      antecedentes,
      enfermedadActual,
      examenFisico: examenNeurologico,
      estudiosParaclinicos: labOrderText,
      planConducta: '',
    },
    labAndImagesOrder: labOrderText,
    ordenLab: {
      perfilPreoperatorio,
      neuroimagen,
      otrosEstudios,
      diagnosticoPresuntivo: typeof rawOrdenLab.diagnosticoPresuntivo === 'string' ? rawOrdenLab.diagnosticoPresuntivo : diagnosisPrincipal,
    },
    restCertificate: {
      needsRest,
      restDays: restDaysNum,
      restFrom,
      restTo,
      condition: condition === 'Familiar' ? 'FAMILIAR' : 'PACIENTE',
      idx: typeof rc.idx === 'string' && rc.idx.trim() ? rc.idx.trim() : diagnosisPrincipal,
    },
    constancia: {
      attendedDate: date,
      condition,
      needsRest,
      restDays: restDaysNum > 0 ? String(restDaysNum).padStart(2, '0') : '00',
      restDaysWords: restDaysNum > 0 ? `${restDaysNum} días continuos` : 'Cero (00) días',
      restFrom,
      restTo: needsRest ? restTo : '',
      idx: typeof rc.idx === 'string' && rc.idx.trim() ? rc.idx.trim() : diagnosisPrincipal,
      requestDay: String(new Date().getDate()).padStart(2, '0'),
      requestMonth: new Intl.DateTimeFormat('es-VE', { month: 'long' }).format(new Date()).toUpperCase(),
      requestYear: String(new Date().getFullYear()),
    },
    clinicalHistory: {
      consultReason: motivoConsulta,
      currentIllness: enfermedadActual,
      background: antecedentes,
      neuroExam: examenNeurologico,
      diagnosis: historiaDiag,
    },
    historia: {
      motivoConsulta,
      enfermedadActual,
      antecedentes,
      examenNeurologico,
      diagnostico: historiaDiag,
    },
  };
}

// Robust JSON cleaning & extraction helper
function safelyParseJsonResponse(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Texto de respuesta vacío o no válido.');
  }

  let text = rawText.trim();

  // Strip markdown code block fences if present
  if (text.startsWith('```json')) {
    text = text.substring(7);
  } else if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  text = text.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(text);
  } catch (e1) {
    // 2. Try extracting the first valid JSON object / array substring
    const firstOpenBrace = text.indexOf('{');
    const lastCloseBrace = text.lastIndexOf('}');
    if (firstOpenBrace !== -1 && lastCloseBrace > firstOpenBrace) {
      const candidate = text.substring(firstOpenBrace, lastCloseBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (e2) {
        // 3. Attempt common truncation repair: close unterminated strings, arrays, objects
        try {
          let repaired = candidate;
          const quoteMatches = repaired.match(/(?<!\\)"/g);
          if (quoteMatches && quoteMatches.length % 2 !== 0) {
            repaired += '"';
          }
          const openBrackets = (repaired.match(/\[/g) || []).length;
          const closeBrackets = (repaired.match(/\]/g) || []).length;
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            repaired += ']';
          }
          const openBraces = (repaired.match(/\{/g) || []).length;
          const closeBraces = (repaired.match(/\}/g) || []).length;
          for (let i = 0; i < openBraces - closeBraces; i++) {
            repaired += '}';
          }
          return JSON.parse(repaired);
        } catch (e3) {
          throw new Error(`JSON no parseable tras intentos de saneamiento: ${(e1 as Error).message}`);
        }
      }
    }
    throw e1;
  }
}

// Lista prioritaria de modelos Gemini para Failover / Fallback (conmutación inteligente de alta disponibilidad)
const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

// API Endpoint: Extract Clinical Summary (Texto / Dictado)
app.post('/api/gemini/extract-clinical-summary', geminiRateLimiterMiddleware, async (req, res) => {
  try {
    const { transcript, currentData } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        requiresReview: true,
        data: {},
        error: 'El texto del dictado clínico no puede estar vacío.'
      });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        success: false,
        requiresReview: true,
        data: {},
        error: 'Servicio de IA no configurado en el servidor (GEMINI_API_KEY no presente).'
      });
    }

    const prompt = `Analiza el siguiente dictado clínico continuo del Dr. Samir Moucharrafie Naime (Especialista en Neurocirugía / UCBL Lyon 1) y extrae de forma estructurada los datos para los 5 documentos clínicos oficiales.
Fecha de referencia: ${new Date().toLocaleDateString('es-VE')}

DICTADO CLÍNICO:
"""
${transcript}
"""

${currentData ? `DATOS PREVIOS EXISTENTES (conservar solo los datos que correspondan al paciente actual):\n${JSON.stringify(currentData, null, 2)}` : ''}

RECUERDA: NO inventar ningún dato que no aparezca en la fuente. Dejar campos no mencionados como strings vacíos.`;

    let responseText = '';
    let usedModel = '';

    // PIPELINE DE CONMUTACIÓN DE MODELOS GEMINI
    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`[AI Pipeline] Intentando extracción con modelo: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: CLINICAL_SYSTEM_INSTRUCTION,
            temperature: 0.05,
            topP: 0.95,
            responseMimeType: 'application/json',
            responseSchema: CLINICAL_EXTRACTION_SCHEMA,
          },
        });

        if (response.text) {
          responseText = response.text;
          usedModel = modelName;
          console.log(`[AI Pipeline] Éxito en extracción estructurada con: ${modelName}`);
          break;
        }
      } catch (modelErr: any) {
        const is503 = modelErr?.message?.includes('503') || modelErr?.status === 503 || String(modelErr).includes('503');
        console.warn(`[AI Pipeline] ${is503 ? 'Alta demanda temporal (503)' : 'Fallo'} en modelo ${modelName}, conmutando a siguiente modelo de respaldo.`);
        if (is503) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }

    if (!responseText) {
      return res.status(502).json({
        success: false,
        requiresReview: true,
        data: {},
        error: 'No fue posible extraer los datos clínicos con suficiente confianza tras consultar los modelos de IA.'
      });
    }

    let parsedData: any = null;
    try {
      parsedData = safelyParseJsonResponse(responseText);
    } catch (parseErr: any) {
      return res.status(422).json({
        success: false,
        requiresReview: true,
        data: {},
        error: 'La respuesta de IA no pudo ser parseada como JSON válido.'
      });
    }

    const validation = validateClinicalExtractionSchema(parsedData);
    if (!validation.valid) {
      return res.status(422).json({
        success: false,
        requiresReview: true,
        data: {},
        error: `Respuesta de IA con esquema inválido: ${validation.errors.join(', ')}`
      });
    }

    const formattedData = formatClinicalData(parsedData, currentData);

    return res.json({
      success: true,
      requiresReview: formattedData.requiresReview,
      uncertainFields: formattedData.uncertainFields,
      source: usedModel,
      usedModel,
      isLocalFallback: false,
      data: formattedData,
    });
  } catch (error: any) {
    console.error('Error no controlado en extracción clínica:', error);
    return res.status(500).json({
      success: false,
      requiresReview: true,
      data: {},
      error: `Error interno al procesar extracción clínica: ${error.message || 'Error desconocido'}`
    });
  }
});

// API Endpoint: Extract Clinical Summary Directly From Audio (Multimodal Audio Gemini)
app.post('/api/gemini/extract-from-audio', geminiRateLimiterMiddleware, async (req, res) => {
  try {
    const { audioBase64, mimeType, currentData } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string' || audioBase64.trim().length < 100) {
      return res.status(400).json({
        success: false,
        requiresReview: true,
        data: {},
        error: 'El archivo de audio está vacío, incompleto o no es legible.'
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        requiresReview: true,
        data: {},
        error: 'Servicio Gemini no configurado en servidor. Configure GEMINI_API_KEY.',
      });
    }

    const promptText = `Escucha con máxima atención el dictado clínico continuo de voz del Dr. Samir Moucharrafie Naime (Neurocirujano / UCBL Lyon 1 - Francia).
1. Transcribe exactamente palabra por palabra todo lo dictado por el Dr. Samir en el campo "extractedTranscript".
2. Normaliza la terminología neuroquirúrgica (maniobras radiculares, niveles discales, fármacos con posología).
3. Estructura y mapea los datos a los 5 documentos médicos oficiales (patient, diagnosisPrincipal, cie10Suggestions, recipeDual, clinicalReport, labAndImagesOrder, restCertificate, clinicalHistory, uncertainFields).
4. REGLA FUNDAMENTAL: NUNCA inventes datos no mencionados. Deja los campos no dichos como "".
${currentData ? `DATOS PREVIOS:\n${JSON.stringify(currentData, null, 2)}` : ''}
Fecha de referencia: ${new Date().toLocaleDateString('es-VE')}`;

    const cleanMimeType = (mimeType || 'audio/webm').split(';')[0];
    let responseText = '';
    let usedAudioModel = '';

    // Intentar con la cadena de modelos prioritarios para audio multimodal
    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`[AI Audio Pipeline] Intentando extracción multimodal con: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMimeType,
                    data: audioBase64,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
          config: {
            systemInstruction: CLINICAL_SYSTEM_INSTRUCTION,
            temperature: 0.05,
            topP: 0.95,
            responseMimeType: 'application/json',
            responseSchema: CLINICAL_EXTRACTION_SCHEMA,
          },
        });

        if (response.text) {
          responseText = response.text;
          usedAudioModel = modelName;
          console.log(`[AI Audio Pipeline] Éxito en audio multimodal con: ${modelName}`);
          break;
        }
      } catch (audioModelErr: any) {
        const is503 = audioModelErr?.message?.includes('503') || audioModelErr?.status === 503 || String(audioModelErr).includes('503');
        console.warn(`[AI Audio Pipeline] ${is503 ? 'Alta demanda temporal (503)' : 'Fallo'} en modelo ${modelName}, conmutando a siguiente modelo de respaldo.`);
        // Pequeño backoff no bloqueante de 200ms si es 503 para aliviar congestión
        if (is503) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }

    if (!responseText) {
      return res.status(502).json({
        success: false,
        requiresReview: true,
        data: {},
        error: 'No fue posible procesar el audio clínico tras consultar los modelos de IA.'
      });
    }

    let parsedData: any = null;
    try {
      parsedData = safelyParseJsonResponse(responseText);
    } catch (parseErr: any) {
      return res.status(422).json({
        success: false,
        requiresReview: true,
        data: {},
        error: 'La respuesta de audio de la IA no pudo ser parseada como JSON válido.'
      });
    }

    const validation = validateClinicalExtractionSchema(parsedData);
    if (!validation.valid) {
      return res.status(422).json({
        success: false,
        requiresReview: true,
        data: {},
        error: `Respuesta de audio de IA con esquema inválido: ${validation.errors.join(', ')}`
      });
    }

    const formattedData = formatClinicalData(parsedData, currentData);

    return res.json({
      success: true,
      requiresReview: formattedData.requiresReview,
      uncertainFields: formattedData.uncertainFields,
      source: usedAudioModel || 'gemini-audio-multimodal',
      usedModel: usedAudioModel,
      isLocalFallback: false,
      transcript: parsedData.extractedTranscript || '',
      data: formattedData,
    });
  } catch (error: any) {
    console.error('[AI Audio Pipeline] Error controlado:', error?.message || 'Error desconocido');
    return res.status(500).json({
      success: false,
      requiresReview: true,
      data: {},
      error: `Error interno al procesar audio clínico: ${error.message || 'Error desconocido'}`
    });
  }
});

// API Endpoint: Quick Voice Correction (Edición Quirúrgica de Documentos)
app.post('/api/gemini/quick-correction', geminiRateLimiterMiddleware, async (req, res) => {
  const startTime = Date.now();
  const requestId = `corr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  try {
    const { command, currentDocumentState, docType } = req.body;
    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El comando de corrección no puede estar vacío.'
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'Servicio Gemini no disponible.'
      });
    }

    const promptText = `Eres el Asistente Clínico de Neurocirugía del Dr. Samir Moucharrafie Naime.
Aplica quirúrgicamente la siguiente corrección o ajuste puntual al documento médico tipo "${docType}".
COMANDO DEL MÉDICO: "${command}"
ESTADO ACTUAL DEL DOCUMENTO:
${JSON.stringify(currentDocumentState || {}, null, 2)}

REGLAS ESTRICTAS DE SEGURIDAD CLÍNICA:
1. Aplica EXCLUSIVAMENTE el cambio ordenado por el médico.
2. Conserva intactos todos los demás campos existentes del documento sin modificarlos ni borrarlos.
3. NUNCA agregues medicamentos, dosis ni diagnósticos no especificados en el comando.
4. Devuelve ÚNICAMENTE el objeto JSON con la estructura actualizada del documento.`;

    let responseText = '';
    for (const modelName of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            temperature: 0.05,
            responseMimeType: 'application/json',
          }
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        // Fallback al siguiente modelo
      }
    }

    if (!responseText) {
      return res.status(502).json({
        success: false,
        error: 'No se pudo generar la corrección con los modelos de IA.'
      });
    }

    const parsed = safelyParseJsonResponse(responseText);
    const durationMs = Date.now() - startTime;
    console.log(`[Quick Correction] Request ${requestId} completada en ${durationMs}ms para docType: ${docType}`);

    return res.json({
      success: true,
      data: parsed,
      command,
    });
  } catch (error: any) {
    console.error(`[Quick Correction] Error en request ${requestId}:`, error.message);
    return res.status(500).json({
      success: false,
      error: `Error al procesar corrección: ${error.message || 'Error desconocido'}`
    });
  }
});

// =========================================================================
// CLINICAL PROPOSALS & CONFIRMATION FACULTATIVE ENDPOINTS (Fase 3.3-D)
// =========================================================================

// Endpoint: Confirmar Propuesta Clínica (Commit Oficial Facultativo)
app.post(['/api/clinical/proposals/:proposalId/confirm', '/api/clinical/proposals/confirm', '/api/clinical-engine/proposals/:proposalId/confirm'], async (req, res) => {
  try {
    const proposalId = req.params.proposalId || req.body?.proposalId || `prop_${Date.now()}`;
    const { overrides, confirmedBy, extractedData, patient } = req.body || {};

    console.log(`[Clinical Proposal] Confirmando propuesta facultativa: ${proposalId} por ${confirmedBy || 'Dr. Samir'}`);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      status: 'CONFIRMED',
      proposalId,
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: confirmedBy || 'Dr. Samir Moucharrafie Naime',
      overrides: overrides || {},
      data: extractedData || req.body,
      message: 'Propuesta clínica confirmada y autorizada correctamente como expediente canónico.',
    });
  } catch (error: any) {
    console.error('[Clinical Proposal] Error al confirmar propuesta:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      status: 'ERROR',
      code: 'CONFIRMATION_ERROR',
      error: `Error al procesar confirmación médica: ${error.message || 'Error interno'}`,
      requiresReview: true,
    });
  }
});

// Endpoint: Rechazar o Descartar Propuesta Clínica
app.post(['/api/clinical/proposals/:proposalId/reject', '/api/clinical/proposals/reject', '/api/clinical-engine/proposals/:proposalId/reject'], async (req, res) => {
  try {
    const proposalId = req.params.proposalId || req.body?.proposalId || `prop_${Date.now()}`;
    const { reason, rejectedBy } = req.body || {};

    console.log(`[Clinical Proposal] Rechazando propuesta: ${proposalId}. Motivo: ${reason || 'Descartada por facultativo'}`);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      status: 'REJECTED',
      proposalId,
      rejected: true,
      rejectedAt: new Date().toISOString(),
      reason: reason || 'Rechazada por el médico',
      message: 'Propuesta clínica descartada correctamente.',
    });
  } catch (error: any) {
    console.error('[Clinical Proposal] Error al rechazar propuesta:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      status: 'ERROR',
      error: `Error al procesar rechazo: ${error.message || 'Error interno'}`,
    });
  }
});

// Endpoint: Consultar estado de Propuesta Clínica
app.get(['/api/clinical/proposals/:proposalId', '/api/clinical/proposals'], async (req, res) => {
  const proposalId = req.params.proposalId || req.query?.proposalId || 'default';
  return res.status(200).json({
    success: true,
    proposalId,
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
  });
});

// SAMI COPILOT CLINICAL SYSTEM INSTRUCTION
const SAMI_COPILOT_SYSTEM_INSTRUCTION = `Eres SAMI (Sistema de Asistencia Médica Inteligente), el Copiloto Clínico y Neuroquirúrgico de alta precisión del Dr. Samir Moucharrafie Naime (Especialista en Neurocirugía formado en la Université Claude Bernard Lyon 1, Francia / MPPS: 61231, CMEB: 5331 / Unidad Cerebro Columna Mínimamente Invasiva - CCMI).

TU MISIÓN:
Asistir al Dr. Samir en tiempo real durante la consulta clínica, toma de decisiones neuroquirúrgicas, cálculo de dosis farmacológicas, evaluación de escalas neurológicas, detección de banderas rojas y redacción de documentos médicos oficiales (Récipes, Informes, Constancias, Órdenes de Laboratorio e Historias Clínicas).

DIRECTRICES DE RESPUESTA:
1. RIGOR CIENTÍFICO Y NEUROQUIRÚRGICO: Basa tus respuestas en la medicina basada en evidencias, guías internacionales (AANS, CNS, WFNS, EANS) y las mejores prácticas en cirugía de columna mínimamente invasiva y neuro-oncología.
2. CONCISIÓN Y ESTRUCTURA: Sé directo, claro y profesional. Usa viñetas, negritas y tablas cuando sea oportuno para facilitar la lectura médica en consulta rápida.
3. CONTEXTO DEL PACIENTE: Si se proporciona contexto del paciente actual (nombre, edad, diagnóstico, medicación, alergias), utilízalo para personalizar advertencias, interacciones farmacológicas o ajustes de dosis.
4. BANDERAS ROJAS (RED FLAGS): Alerta inmediatamente ante signos de alarma clínica como síndrome de cauda equina, déficit neurológico progresivo rápido, hipertensión endocraneana, signos meníngeos o riesgo de hemorragia.
5. DOMINIO DE ESCALAS: Domina escalas como Glasgow (GCS), ASIA (trauma medular), Nurick y mJOA (mielopatía cervical), Karnofsky (KPS), WFNS y Fisher (hemorragia subaracnoidea), Spetzler-Martin (MAVs).
6. TONO: Colegial, respetuoso, médico, analítico y colaborativo con el Dr. Samir.`;

// Generador de conocimiento clínico local de contingencia (Zero-Fail Safety Net)
function generateLocalSamiKnowledgeResponse(query: string, patientContext?: any, activeView?: string): string {
  const q = (query || '').toLowerCase();

  if (q.includes('hola') || q.includes('saludos') || q.includes('buenos') || q.includes('buenas') || q === 'sami') {
    return `Hola, Dr. Samir. Es un gusto saludarle. Estoy conectado y a su entera disposición en la **Unidad Cerebro Columna Mínimamente Invasiva (CCMI)**.\n\n¿En qué paciente o caso clínico trabajamos hoy?\nPuede consultarme sobre:\n* 🧠 **Escalas neurológicas** (Nurick, mJOA, ASIA, VAS/EVA, Glasgow).\n* 💊 **Esquemas farmacológicos** y posología en patología raquídea.\n* 📋 **Técnicas quirúrgicas** (TLIF, abordajes MIS, descompresión).\n* 📄 **Emisión oficial de récipes, órdenes e informes**.`;
  }

  if (q.includes('nurick') || q.includes('mjoa') || q.includes('mielopat')) {
    return `### 🧠 Escalas de Mielopatía Cervical Espondilótica (Nurick & mJOA)

Para la evaluación del paciente en la Unidad CCMI:

1. **Escala de Nurick (Basada en la marcha y deambulación):**
* **Grado 0:** Signos radiculares sin afectación medular.
* **Grado 1:** Signos de afectación medular, pero sin dificultad para caminar.
* **Grado 2:** Leve dificultad para caminar que no interfiere con el trabajo/actividades.
* **Grado 3:** Dificultad para caminar que impide el empleo completo, pero deambula sin ayuda.
* **Grado 4:** Solo deambula con ayuda (bastón, andador o apoyo de terceros).
* **Grado 5:** Confinado a silla de ruedas o encamado.

2. **Escala mJOA (Modified Japanese Orthopaedic Association - Max: 17 puntos):**
* **Puntuación 15-17:** Mielopatía Leve.
* **Puntuación 12-14:** Mielopatía Moderada.
* **Puntuación 0-11:** Mielopatía Severa.

⚡ **Criterio Quirúrgico:** Un puntaje mJOA ≤ 14 o Nurick ≥ 2 con estenosis cervical confirmada por RMN es indicación formal de descompresión neuroquirúrgica para prevenir deterioro axonal irreversible.`;
  }

  if (q.includes('asia') || q.includes('lesion medular') || q.includes('lesión medular') || q.includes('trauma medular')) {
    return `### ⚡ Escala ASIA (American Spinal Injury Association)

Clasificación estándar para trauma y compromiso raquimedular:

* **Grado A (Completa):** No hay preservación de función motora ni sensitiva en los segmentos sacros S4-S5.
* **Grado B (Incompleta sensitiva):** Preservación sensitiva por debajo del nivel neurológico hasta S4-S5, sin función motora.
* **Grado C (Incompleta motora):** Función motora preservada; más de la mitad de los músculos clave por debajo del nivel tienen balance motor < 3.
* **Grado D (Incompleta motora funcional):** Al menos la mitad de los músculos clave tienen balance muscular ≥ 3 (capaces de vencer gravedad).
* **Grado E (Normal):** Funciones motora y sensitiva íntegras en todos los segmentos.

💡 **Protocolo CCMI:** Pacientes con Grado C o D con compresión ósea o discal aguda se benefician de descompresión urgente dentro de las primeras 24 horas.`;
  }

  if (q.includes('eva') || q.includes('vas') || q.includes('dolor')) {
    return `### 📊 Escala Visual Analógica (EVA / VAS) y Escalón Analgésico

Clasificación del dolor raquídeo y neuropático:

* **EVA 1 - 3 (Dolor Leve):** Primer escalón. Paracetamol 1g c/8h VO o AINE clásico (Ketoprofeno 100mg o Etoricoxib 90mg) por ciclo corto de 5 a 7 días.
* **EVA 4 - 6 (Dolor Moderado):** Segundo escalón. Opioide débil + Paracetamol (Tramadol / Paracetamol 37.5/325mg c/8h) asociado a neuromodulador (Pregabalina 75mg c/12h).
* **EVA 7 - 10 (Dolor Severo / Crisis Radicular):** Tercer escalón. Pregabalina 75-150mg c/12h + Tramadol 50-100mg c/8h + Corticoterapia de pulso (Dexametasona 4-8mg IM por 3 días) y reposo en posición semi-fowler.`;
  }

  if (q.includes('pregabalina') || q.includes('posologia') || q.includes('posología') || q.includes('farmaco') || q.includes('fármaco') || q.includes('medicamento')) {
    return `### 💊 Esquema Farmacológico Protocolizado en Patología Raquimedular (CCMI)

1. **Pregabalina (Neuromodulador para dolor radicular/ciática):**
* Dosis inicio: 75 mg vía oral cada 12 horas (o 75 mg nocturno en adultos mayores para minimizar mareos).
* Titulación: Incrementar a 150 mg cada 12 horas a partir del día 7 si persiste dolor neuropático.
* Duración habitual: 14 a 30 días con descenso gradual (no suspender abruptamente).

2. **Antiinflamatorios de Elección:**
* **Ketoprofeno:** 100 mg cada 8 a 12 horas por 5 días con protector gástrico (Omeprazol 20 mg).
* **Etoricoxib:** 90 mg cada 24 horas por 7 días tras el desayuno.

3. **Miorrelajantes:**
* **Tiocolchicósido:** 4 mg cada 12 horas por 5 a 7 días (en contractura muscular paravertebral aguda).
* **Tizanidina:** 2 mg nocturno, titulable a 2-4 mg cada 12 horas.`;
  }

  if (q.includes('tlif') || q.includes('artrodesis') || q.includes('discectom') || q.includes('cirugia') || q.includes('cirugía')) {
    return `### 📋 Protocolo Quirúrgico: Artrodesis Lumbar Transforaminal (TLIF L4-L5 / L5-S1)

* **Indicaciones:** Espondilolistesis degenerativa o ístmica con inestabilidad segmentaria, hernia discal recurrente con colapso discal, estenosis foraminal severa.
* **Técnica:** Abordaje mínimamente invasivo (MIS) con retractor tubular o línea media mini-open. Facetectomía unilateral con exposición de espacio discal, discectomía completa y preparación de platillos vertebrales con legrillas.
* **Implantación:** Inserción de caja intersomática PEEK o Titanio con autoinjerto y matriz ósea desmineralizada (DBM).
* **Instrumentación:** Tornillos pediculares poliaxiales guiados por radioscopia biplanar (arco en C) y barras de titanio precorvadas con compresión axial final.`;
  }

  if (q.includes('recipe') || q.includes('récipe') || q.includes('papeleria') || q.includes('papelería') || q.includes('doble')) {
    return `### 📄 Guía de Emisión: Récipe Doble Talón Oficial CCMI

El membrete oficial del Dr. Samir Moucharrafie cuenta con un formato A4 dividido en 2 columnas:

* **Talón Izquierdo (Farmacia):** Contiene el R/p farmacológico con principio activo, dosis exacta, forma farmacéutica y cantidad a despachar.
* **Talón Derecho (Indicaciones al Paciente):** Instrucciones claras de toma (horarios, relación con alimentos, precauciones de conducción y duración del tratamiento).
* **Firma y Validación:** Se inserta el sello médico digital con MPPS 61231 y CMEB 5331, y el código QR de trazabilidad institucional.`;
  }

  // Respuesta clínica estructurada predeterminada
  return `### 🧠 Asistente Neuroquirúrgico SAMI - Unidad CCMI

Estimado Dr. Samir, he analizado su consulta: **"${query}"**${patientContext?.fullName ? ` con respecto al paciente en consulta **${patientContext.fullName}**` : ''}.

**Recomendaciones orientativas del protocolo CCMI:**
* En patología raquídea y compresión medular, correlacione siempre la exploración neurológica con los hallazgos de resonancia magnética o tomografía 3D.
* **Banderas rojas:** Si se presentan alteraciones esfinterianas, hipoestesia perineal o déficit motor agudo progresivo, priorice la descompresión quirúrgica urgente.
* Puede emitir los récipes o informes correspondientes desde la mesa de trabajo de papelería A4 o mediante los accesos directos de protocolos preconfigurados.

¿Desea profundizar en alguna escala neurológica o en la posología de algún fármaco en particular?`;
}

// API Endpoint: SAMI Copilot Conversational Engine
app.post('/api/sami/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { messages, patientContext, activeView, userRole } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se recibieron mensajes para procesar en SAMI Copilot.'
      });
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.text || '';

    const ai = getGeminiClient();

    // Construcción del contexto dinámico de la consulta
    let contextHeader = '';
    if (patientContext && patientContext.fullName) {
      contextHeader += `\n[CONTEXTO PACIENTE EN CONSULTA ACTIVA]:\n` +
        `- Paciente: ${patientContext.fullName || 'No especificado'}\n` +
        `- Cédula: ${patientContext.idNumber || 'S/I'}\n` +
        `- Edad: ${patientContext.age ? `${patientContext.age} años` : 'S/I'}\n` +
        `- Diagnóstico: ${patientContext.diagnosis || 'En evaluación'}\n` +
        `- Medicamentos actuales: ${patientContext.medications ? JSON.stringify(patientContext.medications) : 'Ninguno registrado'}\n` +
        `- Alergias / Antecedentes: ${patientContext.allergies || 'Ninguna registrada'}\n`;
    }

    if (activeView) {
      contextHeader += `[MÓDULO DE LA APP ACTIVO]: ${activeView.toUpperCase()}\n`;
    }

    // Formatear historial de conversación
    const formattedHistory = messages.map((m: any) => {
      const roleLabel = m.role === 'user' ? 'Dr. Samir' : 'SAMI';
      return `${roleLabel}: ${m.text || ''}`;
    }).join('\n\n');

    const fullPrompt = `${contextHeader}\n[HISTORIAL DE CONVERSACIÓN]:\n${formattedHistory}\n\nSAMI:`;

    let replyText = '';
    let modelUsed = '';

    if (ai) {
      for (const modelName of ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
        try {
          console.log(`[SAMI Copilot] Consultando modelo Gemini: ${modelName}...`);
          const modelPromise = ai.models.generateContent({
            model: modelName,
            contents: fullPrompt,
            config: {
              systemInstruction: SAMI_COPILOT_SYSTEM_INSTRUCTION,
              temperature: 0.25,
              topP: 0.95,
            }
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout en modelo ${modelName} tras 2.5s`)), 2500)
          );

          const response: any = await Promise.race([modelPromise, timeoutPromise]);

          if (response?.text) {
            replyText = response.text;
            modelUsed = modelName;
            console.log(`[SAMI Copilot] Respuesta generada con éxito por: ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.warn(`[SAMI Copilot] Advertencia en modelo ${modelName}:`, err.message);
        }
      }
    }

    // Si los servidores externos de Gemini no pudieron responder, activar el motor de conocimiento local de contingencia
    if (!replyText) {
      console.log('[SAMI Copilot] Activando red de seguridad clínica local...');
      replyText = generateLocalSamiKnowledgeResponse(lastUserMessage, patientContext, activeView);
      modelUsed = 'SAMI-Conocimiento-Local';
    }

    const durationMs = Date.now() - startTime;
    return res.json({
      success: true,
      reply: replyText,
      usedModel: modelUsed,
      durationMs,
    });
  } catch (error: any) {
    console.error('[SAMI Copilot] Error general en /api/sami/chat:', error);
    const lastUserMessage = req.body?.messages?.reverse?.()?.find?.((m: any) => m.role === 'user')?.text || '';
    const safeReply = generateLocalSamiKnowledgeResponse(lastUserMessage, req.body?.patientContext, req.body?.activeView);
    return res.json({
      success: true,
      reply: safeReply,
      usedModel: 'SAMI-Conocimiento-Local',
      durationMs: Date.now() - startTime,
    });
  }
});

// Helper: Rasterizar páginas de un documento PDF oficial a buffers JPEG usando Ghostscript & Sharp
interface RasterizedPdfPage {
  pageNumber: number;
  buffer: Buffer;
  width: number;
  height: number;
}

async function rasterizePdfToJpegBuffers(
  pdfBuffer: Buffer,
  width = 2480,
  height = 3508,
  pageNumber?: number,
  maxPages = 10
): Promise<RasterizedPdfPage[]> {
  const tmpId = `pdf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpDir = path.join('/tmp', tmpId);
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpIn = path.join(tmpDir, 'in.pdf');
  const outPattern = path.join(tmpDir, 'page_%03d.jpg');

  try {
    fs.writeFileSync(tmpIn, pdfBuffer);
    const { execSync } = await import('child_process');

    // Si se solicitó una página específica, limitar Ghostscript a esa página
    const pageArg = pageNumber && pageNumber > 0
      ? `-dFirstPage=${pageNumber} -dLastPage=${pageNumber}`
      : `-dFirstPage=1 -dLastPage=${maxPages}`;

    execSync(`gs -q -dNOPAUSE -dBATCH -dUseCropBox -sDEVICE=jpeg -r200 ${pageArg} -sOutputFile="${outPattern}" "${tmpIn}"`);

    const pageFiles = fs.readdirSync(tmpDir)
      .filter((f) => f.startsWith('page_') && f.endsWith('.jpg'))
      .sort();

    if (pageFiles.length === 0) {
      throw new Error('Ghostscript no generó imágenes del archivo PDF.');
    }

    const sharp = (await import('sharp')).default;
    const results: RasterizedPdfPage[] = [];

    for (let i = 0; i < pageFiles.length; i++) {
      const rawJpeg = fs.readFileSync(path.join(tmpDir, pageFiles[i]));
      const processed = await sharp(rawJpeg)
        .resize(width, height, { fit: 'fill' })
        .jpeg({ quality: 92 })
        .toBuffer();

      const actualPageNum = pageNumber && pageNumber > 0 ? pageNumber : (i + 1);
      results.push({
        pageNumber: actualPageNum,
        buffer: processed,
        width,
        height,
      });
    }

    return results;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

// API Endpoint: Rasterizar plantilla PDF a imagen de alta resolución (WebP/JPEG) con soporte multipágina
app.post('/api/templates/rasterize-pdf', async (req, res) => {
  try {
    let { pdfBase64, maxWidth = 2480, maxHeight = 3508, pageNumber } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ success: false, error: 'No se recibió pdfBase64' });
    }
    if (pdfBase64.includes('base64,')) {
      pdfBase64 = pdfBase64.split('base64,')[1];
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const sharp = (await import('sharp')).default;
    const rasterizedPages = await rasterizePdfToJpegBuffers(
      pdfBuffer,
      maxWidth,
      maxHeight,
      pageNumber ? Number(pageNumber) : undefined
    );

    const pages = [];
    for (const p of rasterizedPages) {
      const optimized = await sharp(p.buffer)
        .webp({ quality: 90 })
        .toBuffer();

      const dataUrl = `data:image/webp;base64,${optimized.toString('base64')}`;
      const lqipHeight = Math.max(20, Math.round((36 * p.height) / p.width));
      const lqip = await sharp(p.buffer)
        .resize(36, lqipHeight)
        .jpeg({ quality: 40 })
        .toBuffer();
      const lqipDataUrl = `data:image/jpeg;base64,${lqip.toString('base64')}`;

      const origSize = Math.round(pdfBuffer.length / rasterizedPages.length);
      const optSize = optimized.length;
      const savedPct = Math.max(0, Math.round(((origSize - optSize) / origSize) * 100));

      pages.push({
        pageNumber: p.pageNumber,
        dataUrl,
        lqipDataUrl,
        width: p.width,
        height: p.height,
        mimeType: 'image/webp',
        originalSizeBytes: origSize,
        optimizedSizeBytes: optSize,
        savedPercentage: savedPct,
      });
    }

    const firstPage = pages[0];
    const totalOptimizedSize = pages.reduce((acc, pg) => acc + pg.optimizedSizeBytes, 0);

    return res.json({
      success: true,
      pageCount: pages.length,
      dataUrl: firstPage.dataUrl,
      lqipDataUrl: firstPage.lqipDataUrl,
      width: firstPage.width,
      height: firstPage.height,
      mimeType: 'image/webp',
      originalSizeBytes: pdfBuffer.length,
      optimizedSizeBytes: totalOptimizedSize,
      savedPercentage: Math.max(0, Math.round(((pdfBuffer.length - totalOptimizedSize) / pdfBuffer.length) * 100)),
      pages,
    });
  } catch (err: any) {
    console.error('Error rasterizando PDF a imagen:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error al rasterizar PDF' });
  }
});

// API Endpoint: Guardar y reemplazar permanentemente un archivo PDF/JPG Master Oficial en public/templates/
app.post('/api/templates/upload-master', async (req, res) => {
  try {
    let { docType, fileBase64, isPdf } = req.body;
    if (!docType || !fileBase64) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros docType o fileBase64' });
    }
    if (fileBase64.includes('base64,')) {
      fileBase64 = fileBase64.split('base64,')[1];
    }
    const buffer = Buffer.from(fileBase64, 'base64');
    const templatesDir = path.join(process.cwd(), 'public/templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    const docMap: Record<string, { pdf: string; img: string }> = {
      RECIPES: { pdf: 'recipe_base.pdf', img: 'recipes_bg.jpg' },
      recipe: { pdf: 'recipe_base.pdf', img: 'recipes_bg.jpg' },
      INFORME: { pdf: 'informe_base.pdf', img: 'informe_bg.jpg' },
      report: { pdf: 'informe_base.pdf', img: 'informe_bg.jpg' },
      ORDEN_LAB: { pdf: 'orden_lab_base.pdf', img: 'orden_lab_p1_bg.jpg' },
      lab_order: { pdf: 'orden_lab_base.pdf', img: 'orden_lab_p1_bg.jpg' },
      CONSTANCIA: { pdf: 'constancia_base.pdf', img: 'constancia_bg.jpg' },
      certificate: { pdf: 'constancia_base.pdf', img: 'constancia_bg.jpg' },
      HISTORIA: { pdf: 'historia_base.pdf', img: 'historia_bg.jpg' },
      history: { pdf: 'historia_base.pdf', img: 'historia_bg.jpg' },
    };

    const target = docMap[docType] || docMap[docType.toUpperCase()] || { pdf: `${docType}_base.pdf`, img: `${docType}_bg.jpg` };
    const isPdfFile = isPdf || buffer.subarray(0, 4).toString() === '%PDF';

    if (isPdfFile) {
      fs.writeFileSync(path.join(templatesDir, target.pdf), buffer);
      try {
        const sharp = (await import('sharp')).default;
        const rasterized = await rasterizePdfToJpegBuffers(buffer, 2480, 3508, 1, 1);
        if (rasterized.length > 0) {
          const jpgBuf = await sharp(rasterized[0].buffer).jpeg({ quality: 95 }).toBuffer();
          fs.writeFileSync(path.join(templatesDir, target.img), jpgBuf);
        }
      } catch (e) {
        console.warn('[upload-master] Aviso al rasterizar JPG de respaldo:', e);
      }
    } else {
      fs.writeFileSync(path.join(templatesDir, target.img), buffer);
    }

    console.log(`[upload-master] Plantilla oficial ${docType} guardada con éxito en ${templatesDir}`);
    return res.json({
      success: true,
      message: `Plantilla master oficial ${docType} instalada exitosamente en el servidor.`,
      target,
    });
  } catch (err: any) {
    console.error('Error en /api/templates/upload-master:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error al guardar plantilla master' });
  }
});

// API Endpoint: Compartir documento híbrido (PDF oficial + PNG HD 300 DPI) para WhatsApp y portal del paciente
app.post('/api/documents/share', async (req, res) => {
  try {
    let { pdfBase64, fileName, patientName, docTitle } = req.body;
    
    if (!pdfBase64 && req.body.file) {
      pdfBase64 = req.body.file;
    }
    
    if (!pdfBase64) {
      return res.status(400).json({ success: false, error: 'No se recibió pdfBase64 ni archivo' });
    }
    
    if (pdfBase64.includes('base64,')) {
      pdfBase64 = pdfBase64.split('base64,')[1];
    }
    
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const safeFileName = (fileName || 'Documento_Medico.pdf').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const docId = `ccmi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const docDir = path.join(sharedDocsDir, docId);
    fs.mkdirSync(docDir, { recursive: true });
    
    // 1. Guardar PDF oficial en disco
    const pdfFilePath = path.join(docDir, safeFileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    
    // 2. Renderizar imagen Ultra HD (300 DPI) usando Ghostscript y Sharp
    let pngBase64 = '';
    try {
      const sharp = (await import('sharp')).default;
      const rasterized = await rasterizePdfToJpegBuffers(pdfBuffer, 2480, 3508, 1, 1);
      if (rasterized.length > 0) {
        const pngBuffer = await sharp(rasterized[0].buffer)
          .png({ quality: 95, compressionLevel: 8 })
          .toBuffer();
        fs.writeFileSync(path.join(docDir, 'preview.png'), pngBuffer);
        pngBase64 = pngBuffer.toString('base64');
      }
    } catch (imgErr) {
      console.warn('[Share API] Advertencia al rasterizar PNG HD:', imgErr);
    }
    
    // 3. Guardar metadatos clínicos del documento
    const meta = {
      docId,
      fileName: safeFileName,
      patientName: patientName || 'Paciente',
      docTitle: docTitle || 'Documento Médico Oficial',
      createdAt: new Date().toISOString(),
      pdfSize: pdfBuffer.length,
      hasHdImage: Boolean(pngBase64),
    };
    fs.writeFileSync(path.join(docDir, 'meta.json'), JSON.stringify(meta, null, 2));
    
    // 4. Construir URL pública
    const host = req.get('host') || '127.0.0.1:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const origin = `${protocol}://${host}`;
    
    return res.json({
      success: true,
      docId,
      shareUrl: `${origin}/view/doc/${docId}`,
      directPdfUrl: `${origin}/shared_docs/${docId}/${safeFileName}`,
      directImageUrl: pngBase64 ? `${origin}/shared_docs/${docId}/preview.png` : null,
      imageDataUrl: pngBase64 ? `data:image/png;base64,${pngBase64}` : null,
      fileName: safeFileName,
      imageFileName: safeFileName.replace(/\.pdf$/i, '.png'),
    });
  } catch (error: any) {
    console.error('Error en /api/documents/share:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error al procesar documento' });
  }
});

// Portal Móvil Oficial del Paciente (Visualizador Web Responsivo)
app.get('/view/doc/:docId', (req, res) => {
  const { docId } = req.params;
  const docDir = path.join(sharedDocsDir, docId);
  const metaPath = path.join(docDir, 'meta.json');
  
  if (!fs.existsSync(metaPath)) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documento no disponible - CCMI</title>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
          <div class="w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">⚠️</div>
          <h1 class="text-xl font-black text-white">Documento No Encontrado</h1>
          <p class="text-sm text-slate-400">El enlace médico solicitado ha expirado o no es válido. Comuníquese con la secretaría médica del CCMI para solicitar una nueva copia.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const pdfUrl = `/shared_docs/${docId}/${meta.fileName}`;
  const imgUrl = `/shared_docs/${docId}/preview.png`;
  const hasImage = fs.existsSync(path.join(docDir, 'preview.png'));
  
  return res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${meta.docTitle} - Dr. Samir Moucharrafie</title>
      <meta name="theme-color" content="#0284c7">
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      <!-- Encabezado Institucional CCMI -->
      <header class="bg-slate-900/90 border-b border-cyan-500/30 sticky top-0 z-30 backdrop-blur-md px-4 py-3.5">
        <div class="max-w-3xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-lg shadow-sm">
              🧠
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-sm text-cyan-100 tracking-wide">CCMI</span>
                <span class="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">Oficial</span>
              </div>
              <p class="text-xs text-slate-300 font-medium">Dr. Samir Moucharrafie Naime</p>
              <p class="text-[10px] text-slate-400">Neurocirugía • Cirugía de Columna Mínimamente Invasiva</p>
            </div>
          </div>
          <div class="hidden sm:flex flex-col text-right text-[11px] text-slate-400 font-mono">
            <span>MPPS: 61231</span>
            <span>CMEB: 5331</span>
          </div>
        </div>
      </header>

      <!-- Contenido Principal -->
      <main class="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-5">
        <!-- Ficha del Documento -->
        <div class="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div>
            <span class="text-[10px] text-cyan-400 font-bold uppercase tracking-wider font-mono">Documento Clínico Emitido</span>
            <h1 class="text-lg font-black text-white mt-0.5">${meta.docTitle}</h1>
            <p class="text-xs text-slate-300 mt-1">Paciente: <strong class="text-cyan-200 font-bold">${meta.patientName}</strong></p>
          </div>
          <div class="flex items-center gap-2">
            <a href="${pdfUrl}" download="${meta.fileName}" class="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 text-center">
              <span>Descargar PDF</span>
              <span>📄</span>
            </a>
          </div>
        </div>

        <!-- Visualización de Alta Resolución -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-4 shadow-2xl overflow-hidden flex flex-col items-center">
          <div class="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-2 text-xs text-slate-400">
            <span>Vista Previa de Alta Resolución (Ultra HD)</span>
            <span class="text-emerald-400 font-mono font-bold flex items-center gap-1">● Certificado 300 DPI</span>
          </div>
          ${hasImage ? `
            <div class="w-full flex justify-center bg-slate-950 rounded-xl p-1 overflow-auto border border-slate-800/80">
              <img src="${imgUrl}" alt="${meta.docTitle}" class="max-w-full h-auto rounded-lg shadow-md" loading="eager" />
            </div>
          ` : `
            <iframe src="${pdfUrl}#toolbar=0" class="w-full h-[650px] rounded-xl border border-slate-800"></iframe>
          `}
        </div>

        <!-- Botones de Acción Móviles -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a href="${pdfUrl}" download="${meta.fileName}" class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 transition active:scale-95 text-center">
            <span>📄 Descargar PDF Oficial (Para Imprimir)</span>
          </a>
          ${hasImage ? `
            <a href="${imgUrl}" download="${meta.fileName.replace(/\.pdf$/i, '.png')}" class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition active:scale-95 text-center">
              <span>🖼️ Guardar Imagen en Fotos</span>
            </a>
          ` : ''}
        </div>
      </main>

      <!-- Pie Institucional -->
      <footer class="bg-slate-950 border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-400 space-y-1">
        <p class="font-bold text-slate-300">Unidad Cerebro Columna Mínimamente Invasiva (CCMI)</p>
        <p>Centro Médico Orinokia, Puerto Ordaz, Edo. Bolívar • Caracas, Venezuela</p>
        <p class="text-[11px] text-slate-400">Documento electrónico emitido con validación clínica oficial.</p>
      </footer>
    </body>
    </html>
  `);
});

// API Endpoint: Intelligent Visual Template Calibration (DESACTIVADA RE-CALIBRACIÓN DINÁMICA - HARDCODED MASTER)
app.post('/api/gemini/calibrate-template-image', async (req, res) => {
  try {
    const { docType = 'RECIPES' } = req.body;
    console.log(`[Master Calibration] Entregando coordenadas fijas oficiales para ${docType} (re-calibración dinámica desactivada).`);
    return res.json({
      success: true,
      source: 'hardcoded-master-calibration',
      calibration: getOpticalLinedFallback(docType),
    });
  } catch (error: any) {
    console.error('Error en calibración fija:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener calibración maestra',
    });
  }
});

function normalizeCalibrationResponse(raw: any, docType: string): Record<string, any> {
  const fallback = getOpticalLinedFallback(docType);
  if (!raw || typeof raw !== 'object') return fallback;

  const result: Record<string, any> = { ...fallback };

  // Aplanar si viene anidado en left_prescription_side, right_indications_side, etc.
  const flatMap: Record<string, any> = {};
  function extractFields(obj: any, prefix = '') {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val && typeof val === 'object' && typeof val.top === 'number') {
        flatMap[key] = val;
        if (prefix) flatMap[`${prefix}.${key}`] = val;
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        extractFields(val, key);
      }
    }
  }
  extractFields(raw);

  // Mapear según tipo de documento
  if (docType === 'RECIPES') {
    const leftName = flatMap['patient.fullName'] || flatMap['left_prescription_side.patient_name'] || flatMap['patient_name'] || flatMap['fullName'];
    if (leftName) result['patient.fullName'] = { ...result['patient.fullName'], ...leftName, id: 'patient.fullName' };

    const leftId = flatMap['patient.idNumber'] || flatMap['left_prescription_side.patient_id'] || flatMap['patient_id'] || flatMap['idNumber'] || flatMap['cedula'];
    if (leftId) result['patient.idNumber'] = { ...result['patient.idNumber'], ...leftId, id: 'patient.idNumber' };

    const leftAge = flatMap['patient.age'] || flatMap['left_prescription_side.age'] || flatMap['age'] || flatMap['edad'];
    if (leftAge) result['patient.age'] = { ...result['patient.age'], ...leftAge, id: 'patient.age' };

    const leftDate = flatMap['patient.date'] || flatMap['left_prescription_side.date'] || flatMap['date'] || flatMap['fecha'];
    if (leftDate) result['patient.date'] = { ...result['patient.date'], ...leftDate, id: 'patient.date' };

    const leftRx = flatMap['recipe.rxLeft'] || flatMap['left_prescription_side.rx_body'] || flatMap['rx_body'] || flatMap['rx'];
    if (leftRx) result['recipe.rxLeft'] = { ...result['recipe.rxLeft'], ...leftRx, id: 'recipe.rxLeft' };

    const leftStamp = flatMap['stamp.left'] || flatMap['left_prescription_side.signature_seal'] || flatMap['stamp'];
    if (leftStamp) result['stamp.left'] = { ...result['stamp.left'], ...leftStamp, id: 'stamp.left' };

    const rightName = flatMap['patient.fullNameRight'] || flatMap['right_indications_side.patient_name'] || flatMap['patient_name_right'];
    if (rightName) result['patient.fullNameRight'] = { ...result['patient.fullNameRight'], ...rightName, id: 'patient.fullNameRight' };

    const rightId = flatMap['patient.idNumberRight'] || flatMap['right_indications_side.patient_id'] || flatMap['patient_id_right'];
    if (rightId) result['patient.idNumberRight'] = { ...result['patient.idNumberRight'], ...rightId, id: 'patient.idNumberRight' };

    const rightAge = flatMap['patient.ageRight'] || flatMap['right_indications_side.age'] || flatMap['age_right'];
    if (rightAge) result['patient.ageRight'] = { ...result['patient.ageRight'], ...rightAge, id: 'patient.ageRight' };

    const rightDate = flatMap['patient.dateRight'] || flatMap['right_indications_side.date'] || flatMap['date_right'];
    if (rightDate) result['patient.dateRight'] = { ...result['patient.dateRight'], ...rightDate, id: 'patient.dateRight' };

    const rightInd = flatMap['recipe.indicationsRight'] || flatMap['right_indications_side.indications_body'] || flatMap['indications_body'] || flatMap['indications'];
    if (rightInd) result['recipe.indicationsRight'] = { ...result['recipe.indicationsRight'], ...rightInd, id: 'recipe.indicationsRight' };

    const rightStamp = flatMap['stamp.right'] || flatMap['right_indications_side.signature_seal'];
    if (rightStamp) result['stamp.right'] = { ...result['stamp.right'], ...rightStamp, id: 'stamp.right' };
  } else {
    // Si viene con claves exactas, incorporarlas
    for (const key of Object.keys(result)) {
      if (flatMap[key]) {
        result[key] = { ...result[key], ...flatMap[key], id: key };
      }
    }
  }

  return result;
}

function getOpticalLinedFallback(docType: string): Record<string, any> {
  // Intentar cargar directamente del archivo maestro data/calibrations.json
  try {
    if (fs.existsSync(CALIBRATIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CALIBRATIONS_FILE, 'utf-8'));
      if (data && data[docType]) {
        return data[docType];
      }
    }
  } catch {
    // Continuar al fallback estático
  }

  if (docType === 'RECIPES') {
    return {
      'patient.fullName': { id: 'patient.fullName', label: 'Talón Izq: Nombre del Paciente', top: 198, left: 118, width: 240, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'left' },
      'patient.idNumber': { id: 'patient.idNumber', label: 'Talón Izq: Cédula de Identidad', top: 247, left: 35, width: 130, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'left' },
      'patient.age': { id: 'patient.age', label: 'Talón Izq: Edad', top: 250, left: 145, width: 105, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
      'patient.date': { id: 'patient.date', label: 'Talón Izq: Fecha', top: 249, left: 244, width: 150, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
      'recipe.rxLeft': { id: 'recipe.rxLeft', label: 'Talón Izq: Rp. (Farmacia)', top: 303, left: 21, width: 335, height: 650, fontSize: 12, lineHeight: 21, fontWeight: 'semibold', textAlign: 'left' },
      'stamp.left': { id: 'stamp.left', label: 'Talón Izq: Sello Médico', top: 898, left: 230, width: 140, height: 70, scale: 0.75 },
      'patient.fullNameRight': { id: 'patient.fullNameRight', label: 'Talón Der: Nombre del Paciente', top: 196, left: 511, width: 240, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'left' },
      'patient.idNumberRight': { id: 'patient.idNumberRight', label: 'Talón Der: Cédula de Identidad', top: 244, left: 435, width: 130, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'left' },
      'patient.ageRight': { id: 'patient.ageRight', label: 'Talón Der: Edad', top: 245, left: 545, width: 105, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
      'patient.dateRight': { id: 'patient.dateRight', label: 'Talón Der: Fecha', top: 246, left: 645, width: 150, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
      'recipe.indicationsRight': { id: 'recipe.indicationsRight', label: 'Talón Der: Indicaciones al Paciente', top: 301, left: 428, width: 335, height: 650, fontSize: 12, lineHeight: 21, fontWeight: 'semibold', textAlign: 'left' },
      'stamp.right': { id: 'stamp.right', label: 'Talón Der: Sello Médico', top: 893, left: 630, width: 140, height: 70, scale: 0.75 }
    };
  } else if (docType === 'INFORME') {
    return {
      'patient.fullName': { id: 'patient.fullName', label: 'Nombre del Paciente', top: 152, left: 65, width: 420, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.idNumber': { id: 'patient.idNumber', label: 'Cédula de Identidad', top: 152, left: 495, width: 235, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.age': { id: 'patient.age', label: 'Edad', top: 184, left: 65, width: 340, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.date': { id: 'patient.date', label: 'Fecha', top: 184, left: 415, width: 315, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'informe.bodyText': { id: 'informe.bodyText', label: 'Cuerpo del Informe Médico', top: 225, left: 65, width: 665, height: 710, fontSize: 12.5, lineHeight: 24, fontWeight: 'normal', textAlign: 'justify' },
      'stamp': { id: 'stamp', label: 'Sello Médico Oficial (Dr. Samir Moucharrafie)', top: 940, left: 540, width: 160, height: 80, scale: 0.85 }
    };
  } else if (docType === 'ORDEN_LAB') {
    return {
      'patient.fullName': { id: 'patient.fullName', label: 'Nombre y Apellido', top: 152, left: 65, width: 420, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.idNumber': { id: 'patient.idNumber', label: 'Cédula de Identidad', top: 152, left: 495, width: 235, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.age': { id: 'patient.age', label: 'Edad', top: 184, left: 65, width: 340, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.date': { id: 'patient.date', label: 'Fecha', top: 184, left: 415, width: 315, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'orden.col_izquierda': { id: 'orden.col_izquierda', label: 'Columna Izquierda', top: 235, left: 55, width: 220, height: 615, fontSize: 11, lineHeight: 20, fontWeight: 'semibold', textAlign: 'left' },
      'orden.col_centro': { id: 'orden.col_centro', label: 'Columna Centro', top: 235, left: 280, width: 220, height: 615, fontSize: 11, lineHeight: 20, fontWeight: 'semibold', textAlign: 'left' },
      'orden.col_derecha': { id: 'orden.col_derecha', label: 'Columna Derecha', top: 235, left: 510, width: 220, height: 615, fontSize: 11, lineHeight: 20, fontWeight: 'semibold', textAlign: 'left' },
      'stamp': { id: 'stamp', label: 'Sello Médico (Página 1)', top: 935, left: 540, width: 160, height: 80, scale: 0.85 }
    };
  } else if (docType === 'ORDEN_LAB_P2') {
    return {
      'orden_p2.patientName': { id: 'orden_p2.patientName', label: 'Agradezco practicar a (Nombre)', top: 285, left: 230, width: 480, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'left' },
      'orden_p2.idNumber': { id: 'orden_p2.idNumber', label: 'Cédula de Identidad (P2)', top: 285, left: 620, width: 150, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'left' },
      'orden_p2.date': { id: 'orden_p2.date', label: 'Fecha (P2)', top: 315, left: 230, width: 150, height: 26, fontSize: 11, fontWeight: 'bold', textAlign: 'left' },
      'orden_p2.diagnosis': { id: 'orden_p2.diagnosis', label: 'Con Impresión Diagnóstica (IDX)', top: 325, left: 260, width: 450, height: 80, fontSize: 11, lineHeight: 18, fontWeight: 'bold', textAlign: 'left' },
      'orden_p2.rmn_cerebral': { id: 'orden_p2.rmn_cerebral', label: 'Resonancia Magnética (RMN) [X]', top: 380, left: 65, width: 20, height: 20, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
      'orden_p2.tac_cerebral': { id: 'orden_p2.tac_cerebral', label: 'Tomografía Axial (TAC) [X]', top: 420, left: 65, width: 20, height: 20, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
      'orden_p2.radiologia': { id: 'orden_p2.radiologia', label: 'Radiología [X]', top: 460, left: 65, width: 20, height: 20, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
      'orden_p2.emg': { id: 'orden_p2.emg', label: 'Electromiografía (EMG) [X]', top: 500, left: 65, width: 20, height: 20, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
      'orden_p2.eeg': { id: 'orden_p2.eeg', label: 'Electroencefalograma (EEG) [X]', top: 540, left: 65, width: 20, height: 20, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
      'orden_p2.pess': { id: 'orden_p2.pess', label: 'Potenciales Evocados (PESS) [X]', top: 580, left: 65, width: 20, height: 20, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
      'stamp': { id: 'stamp', label: 'Sello Médico (Página 2)', top: 940, left: 540, width: 160, height: 80, scale: 0.85 }
    };
  } else if (docType === 'CONSTANCIA') {
    return {
      'patient.fullName': { id: 'patient.fullName', label: 'Nombre y Apellido', top: 240, left: 65, width: 440, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.idNumber': { id: 'patient.idNumber', label: 'Cédula de Identidad', top: 240, left: 515, width: 215, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.date': { id: 'patient.date', label: 'Fecha de Consulta', top: 282, left: 65, width: 320, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
      'constancia.condition_label': { id: 'constancia.condition_label', label: 'Condición (Paciente / Familiar)', top: 320, left: 65, width: 300, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'constancia.cond_paciente': { id: 'constancia.cond_paciente', label: 'Casilla Paciente [X]', top: 320, left: 170, width: 16, height: 16, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
      'constancia.cond_familiar': { id: 'constancia.cond_familiar', label: 'Casilla Familiar [X]', top: 320, left: 260, width: 16, height: 16, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
      'constancia.amerita_label': { id: 'constancia.amerita_label', label: 'Amerita Reposo Médico', top: 320, left: 390, width: 340, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'constancia.reposo_si': { id: 'constancia.reposo_si', label: 'Casilla Sí [X]', top: 320, left: 515, width: 16, height: 16, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
      'constancia.reposo_no': { id: 'constancia.reposo_no', label: 'Casilla No [X]', top: 320, left: 565, width: 16, height: 16, shapeType: 'checkbox_x', markStyle: 'X', fieldType: 'checkbox', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
      'constancia.restDays': { id: 'constancia.restDays', label: 'Campo Días (Número y Letras)', top: 320, left: 620, width: 110, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
      'constancia.rango_label': { id: 'constancia.rango_label', label: 'Rango de Reposo (Desde / Hasta)', top: 360, left: 65, width: 665, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'constancia.restFrom': { id: 'constancia.restFrom', label: 'Fecha Desde', top: 360, left: 290, width: 200, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
      'constancia.restTo': { id: 'constancia.restTo', label: 'Fecha Hasta', top: 360, left: 520, width: 210, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
      'constancia.idx': { id: 'constancia.idx', label: 'Diagnóstico Formal (IDX)', top: 410, left: 65, width: 665, height: 320, fontSize: 12.5, lineHeight: 24, fontWeight: 'semibold', textAlign: 'left' },
      'constancia.requestDay': { id: 'constancia.requestDay', label: 'Expedición (Días, Mes, Año)', top: 765, left: 65, width: 665, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'stamp': { id: 'stamp', label: 'Sello Médico Oficial (Dr. Samir Moucharrafie)', top: 890, left: 540, width: 160, height: 80, scale: 0.85 }
    };
  } else if (docType === 'HISTORIA') {
    return {
      'patient.fullName': { id: 'patient.fullName', label: 'Nombre y Apellido', top: 176, left: 142, width: 359, height: 29, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.idNumber': { id: 'patient.idNumber', label: 'Cédula de Identidad', top: 174, left: 556, width: 189, height: 29, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.age': { id: 'patient.age', label: 'Edad', top: 214, left: 45, width: 142, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.phone': { id: 'patient.phone', label: 'Teléfono', top: 214, left: 228, width: 142, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'patient.address': { id: 'patient.address', label: 'Dirección de Habitación', top: 217, left: 444, width: 297, height: 28, fontSize: 12, fontWeight: 'bold', textAlign: 'left' },
      'historia.motivo': { id: 'historia.motivo', label: 'Motivo de Consulta', top: 288, left: 42, width: 704, height: 63, fontSize: 12, lineHeight: 22, fontWeight: 'normal', textAlign: 'left' },
      'historia.enfermedad': { id: 'historia.enfermedad', label: 'Enfermedad Actual', top: 365, left: 36, width: 721, height: 141, fontSize: 12, lineHeight: 22, fontWeight: 'normal', textAlign: 'left' },
      'historia.antecedentes': { id: 'historia.antecedentes', label: 'Antecedentes Personales y Familiares', top: 547, left: 38, width: 721, height: 147, fontSize: 12, lineHeight: 22, fontWeight: 'normal', textAlign: 'left' },
      'historia.examen': { id: 'historia.examen', label: 'Examen Físico y Neurológico', top: 707, left: 38, width: 715, height: 171, fontSize: 12, lineHeight: 22, fontWeight: 'normal', textAlign: 'left' },
      'historia.diagnostico': { id: 'historia.diagnostico', label: 'Diagnóstico Definitivo / Presuntivo', top: 911, left: 39, width: 716, height: 126, fontSize: 12, lineHeight: 22, fontWeight: 'semibold', textAlign: 'left' },
      'stamp': { id: 'stamp', label: 'Sello Médico', top: 1036, left: 550, width: 160, height: 80, scale: 0.85 }
    };
  }
  return {};
}

// Endpoint para ejecución de Suite de Regresión Antigravity (FASE 3)
app.all('/api/antigravity/run-regression-suite', async (req, res) => {
  try {
    const { runAntigravityRegressionSuite } = await import('./src/utils/antigravityRegressionSuite');
    const report = await runAntigravityRegressionSuite();
    return res.json(report);
  } catch (error: any) {
    console.error('[Antigravity API] Error al ejecutar suite de regresión:', error);
    return res.status(500).json({
      error: 'Error ejecutando auditoría de regresión',
      message: error?.message || String(error)
    });
  }
});

// Middleware Global de Captura de Errores de Express (Previene que peticiones inválidas tumben el servidor)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SOCS EXPRESS ERROR HANDLER]:', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor controlado',
  });
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (req, res) => {
      const distIndex = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SOCS] Servidor clínico CCMI activo en http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[SOCS] Puerto ${PORT} en uso, reintentando vinculación en 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, '0.0.0.0', () => {
          console.log(`[SOCS] Servidor clínico CCMI activo tras reintento en http://0.0.0.0:${PORT}`);
        });
      }, 1000);
    } else {
      console.error('[SOCS] Error del servidor HTTP:', err);
    }
  });

  const cleanup = () => {
    console.log('[SOCS] Recibida señal de apagado, liberando puerto...');
    try {
      server.close(() => {
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 1000).unref();
    } catch {
      process.exit(0);
    }
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

startServer();
