import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Pill, 
  FlaskConical, 
  FileCheck, 
  Loader2, 
  ArrowRight,
  RotateCcw,
  Volume2,
  Stethoscope,
  Copy
} from 'lucide-react';
import { DocType, PatientData } from '../types';

interface ParsedClinicalDictation {
  patientName?: string;
  patientId?: string;
  patientAge?: string;
  diagnosis?: string;
  medications?: Array<{ drug: string; dose: string; frequency: string; duration: string }>;
  generalIndications?: string[];
  imagingStudies?: string[];
  labTests?: string[];
  restDays?: string;
  clinicalSummary?: string;
  physicalExam?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: {
    patient: Partial<PatientData>;
    recipeLeft: string;
    recipeRight: string;
    informeBody: string;
    diagnosis: string;
    labImaging: string;
    restDays: string;
    examNotes: string;
    labTests?: string[];
    neuroimagingTests?: string[];
  }) => void;
}

export const SmartConsultationDictationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyParsedData,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedClinicalDictation | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  if (!isOpen) return null;

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-VE';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript + ' ';
        }
        setTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.warn('Error en dictado por voz:', event.error);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Error iniciando reconocimiento:', err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Motor de Análisis Clínico Inteligente
  const handleAnalyzeDictation = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);

    try {
      // 1. Intentar analizar con Gemini backend si está disponible
      const res = await fetch('/api/gemini/parse-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dictationText: transcript }),
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json();
        setParsedResult(json);
      } else {
        // 2. Parser heurístico clínico local de respaldo
        const parsed = parseHeuristically(transcript);
        setParsedResult(parsed);
      }
    } catch {
      const parsed = parseHeuristically(transcript);
      setParsedResult(parsed);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseHeuristically = (text: string): ParsedClinicalDictation => {
    const result: ParsedClinicalDictation = {};
    const lower = text.toLowerCase();

    // Extraer Cédula
    const ciMatch = text.match(/c[ée]dula\s*(?:de\s*identidad)?\s*(?:n[uú]mero)?\s*([0-9\.\,\s]{6,12})/i);
    if (ciMatch) {
      result.patientId = ciMatch[1].replace(/[^0-9]/g, '');
    }

    // Extraer Edad
    const ageMatch = text.match(/([0-9]{1,2})\s*a[ñn]os/i);
    if (ageMatch) {
      result.patientAge = ageMatch[1];
    }

    // Extraer Paciente / Nombre
    const nameMatch = text.match(/paciente\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?=\s+de\s+[0-9]|\s+c[ée]dula|\s+consulta|\s+con|\s+por)/i);
    if (nameMatch) {
      result.patientName = nameMatch[1].trim();
    }

    // Extraer Diagnóstico
    const dxMatch = text.match(/(?:diagn[oó]stico|dx|impresi[oó]n\s*diagn[oó]stica)\s*[:]?\s*([^\.]+)/i);
    if (dxMatch) {
      result.diagnosis = dxMatch[1].trim();
    } else if (lower.includes('hernia') || lower.includes('lumbociat') || lower.includes('cervical') || lower.includes('estenosis')) {
      result.diagnosis = 'Lumbociatalgia mecánica + Radiculopatía compresiva';
    }

    // Extraer Días de Reposo
    const restMatch = text.match(/reposo\s*(?:m[ée]dico)?\s*(?:por|de)?\s*([0-9]{1,2})\s*d[ií]as/i);
    if (restMatch) {
      result.restDays = restMatch[1];
    }

    // Extraer Medicamentos
    result.medications = [];
    const knownDrugs = [
      'pregabalina', 'gabapentina', 'ketoprofeno', 'tiocolchic[oó]sido', 'celecoxib',
      'etoricoxib', 'tramadol', 'paracetamol', 'dexketoprofeno', 'meloxicam', 'complejo b'
    ];

    knownDrugs.forEach((drug) => {
      if (lower.includes(drug.replace('[oó]', 'o')) || lower.includes(drug.replace('[oó]', 'ó'))) {
        result.medications?.push({
          drug: drug.charAt(0).toUpperCase() + drug.slice(1).replace('[oó]', 'o'),
          dose: '1 tableta / cápsula',
          frequency: 'Cada 12 horas',
          duration: 'Por 5 a 7 días',
        });
      }
    });

    if (result.medications.length === 0) {
      result.medications.push({
        drug: 'Tratamiento sintomático según indicación clínica',
        dose: '1 dosis',
        frequency: 'Cada 12 horas',
        duration: 'Por 5 días',
      });
    }

    // Extraer Neuroimágenes y Estudios Especiales (Página 2 de Orden)
    result.imagingStudies = [];
    if (/\b(resonancia|rmn|neuroresonancia)\b/i.test(lower)) {
      result.imagingStudies.push('Resonancia Magnética (RMN)');
    }
    if (/\b(tomograf|tac|scanner)\b/i.test(lower)) {
      result.imagingStudies.push('Tomografía Axial Computarizada (TAC)');
    }
    if (/\b(radiograf|rayos x|rx)\b/i.test(lower)) {
      result.imagingStudies.push('Radiología Convencional (Rx)');
    }
    if (/\b(electromiograf|emg)\b/i.test(lower)) {
      result.imagingStudies.push('Electromiografía (EMG)');
    }
    if (/\b(electroencefalograf|eeg)\b/i.test(lower)) {
      result.imagingStudies.push('Electroencefalograma (EEG)');
    }
    if (/\b(potenciales evocados|pess)\b/i.test(lower)) {
      result.imagingStudies.push('Potenciales Evocados (PESS)');
    }

    // Extraer Exámenes de Laboratorio (Página 1 de Orden)
    result.labTests = [];
    if (/\b(hematologia|hematología|hemograma|formula|leucocitos|hemoglobina|cbc)\b/i.test(lower)) {
      result.labTests.push('Hematología Completa');
    }
    if (/\b(plaqueta|plaquetas|recuento plaquetario)\b/i.test(lower)) {
      result.labTests.push('Plaquetas');
    }
    if (/\b(coagulacion|coagulación|tiempos|tp|pt|ptt|tpt|tromboplastina|protrombina)\b/i.test(lower)) {
      result.labTests.push('Pt (Tiempo Protrombina)');
      result.labTests.push('Ptt (Tiempo Parcial de Tromboplastina)');
    }
    if (/\b(fibrinogeno|fibrinógeno)\b/i.test(lower)) {
      result.labTests.push('Dosificación de Fibrinógeno');
    }
    if (/\b(glicemia|glucosa|azucar|azúcar)\b/i.test(lower)) {
      result.labTests.push('Glicemia');
    }
    if (/\b(urea|bun)\b/i.test(lower)) {
      result.labTests.push('Urea');
    }
    if (/\b(creatinina)\b/i.test(lower)) {
      result.labTests.push('Creatinina');
    }
    if (/\b(orina|uroanalisis|uroanálisis|ego)\b/i.test(lower)) {
      result.labTests.push('Examen General de Orina');
    }
    if (/\b(hiv|elisa|vih)\b/i.test(lower)) {
      result.labTests.push('HIV');
    }
    if (/\b(vdrl|sifilis|sífilis)\b/i.test(lower)) {
      result.labTests.push('VDRL');
    }
    if (/\b(grupo sanguineo|factor rh|tipiaje)\b/i.test(lower)) {
      result.labTests.push('Grupo Sanguíneo, Factor Rh (D)');
    }
    if (/\b(preoperatorio|perfil preoperatorio)\b/i.test(lower)) {
      result.labTests.push(
        'Hematología Completa',
        'Plaquetas',
        'Pt (Tiempo Protrombina)',
        'Ptt (Tiempo Parcial de Tromboplastina)',
        'Glicemia',
        'Urea',
        'Creatinina',
        'HIV',
        'VDRL',
        'Grupo Sanguíneo, Factor Rh (D)',
        'Examen General de Orina'
      );
    }
    // Eliminar duplicados
    result.labTests = Array.from(new Set(result.labTests));

    result.clinicalSummary = text;
    return result;
  };

  const handleApply = () => {
    if (!parsedResult) return;

    let rxLeft = '';
    let indicationsRight = '';

    if (parsedResult.medications && parsedResult.medications.length > 0) {
      rxLeft = parsedResult.medications
        .map((m, i) => `${i + 1}. ${m.drug} ${m.dose}\n   Tomar: ${m.frequency} por ${m.duration}`)
        .join('\n\n');

      indicationsRight = (parsedResult.generalIndications || [
        'Cumplir tratamiento farmacológico completo con las comidas.',
        'Evitar levantar peso excesivo y flexiones bruscas de tronco.',
        'Calor local seco 15 minutos en región lumbar 2 veces al día.',
        'Acudir a consulta de control con resultados de estudios solicitados.',
      ]).join('\n• ');
    }

    const labImaging = (parsedResult.imagingStudies || []).join('\n• ');

    onApplyParsedData({
      patient: {
        fullName: parsedResult.patientName,
        idNumber: parsedResult.patientId,
        age: parsedResult.patientAge,
      },
      recipeLeft: rxLeft,
      recipeRight: indicationsRight,
      informeBody: parsedResult.clinicalSummary || transcript,
      diagnosis: parsedResult.diagnosis || '',
      labImaging: labImaging,
      restDays: parsedResult.restDays || '',
      examNotes: parsedResult.physicalExam || '',
      labTests: parsedResult.labTests || [],
      neuroimagingTests: parsedResult.imagingStudies || [],
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-[#0b1528] border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden ring-1 ring-cyan-500/20 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-[#070e1d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600/30 to-blue-500/20 border border-purple-500/30 text-purple-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Dictado Clínico Inteligente Integral
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                  IA SAMI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Habla con naturalidad durante la consulta. La IA organizará el Récipe, Informe, Estudios y Reposo al instante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Botón Central de Grabación */}
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl transition-all duration-300 cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white scale-110 animate-pulse ring-8 ring-rose-600/30'
                  : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-105 shadow-purple-950/60'
              }`}
            >
              {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
            </button>

            <div>
              <span className={`text-xs font-black uppercase tracking-wider block ${
                isRecording ? 'text-rose-400 animate-pulse' : 'text-slate-300'
              }`}>
                {isRecording ? '🔴 Escuchando consulta médica...' : 'Presiona para iniciar el dictado'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Puedes dictar paciente, diagnóstico, fármacos, estudios y días de reposo juntos.
              </p>
            </div>
          </div>

          {/* Área de Texto Transcrito */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Transcripción de Voz en Tiempo Real</span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript('')}
                  className="text-slate-400 hover:text-rose-300 transition text-[11px]"
                >
                  Limpiar texto
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="O escribe o dicta aquí: 'Paciente Juan Pérez, 45 años, CI 14567890. Consulta por lumbago agudo. Diagnóstico: Lumbalgia mecánica. Indico Ketoprofeno 100mg cada 8h y Pregabalina 75mg noche por 5 días. Reposo por 3 días'..."
              className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-400 leading-relaxed font-sans"
            />
          </div>

          {/* Botón de Procesamiento con IA */}
          {transcript && !parsedResult && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleAnalyzeDictation}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-purple-950/60 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Estructurando expediente clínico con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Estructurar Consulta en los 5 Documentos</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Resultados Estructurados por la IA */}
          {parsedResult && (
            <div className="p-4.5 rounded-2xl bg-[#0e1b33] border border-cyan-500/30 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Estructuración Clínica Completada
                </span>

                <button
                  type="button"
                  onClick={() => setParsedResult(null)}
                  className="text-[11px] font-bold text-slate-400 hover:text-white"
                >
                  Volver a analizar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Paciente Identificado</span>
                  <p className="font-bold text-white truncate">{parsedResult.patientName || 'No detectado'}</p>
                  <p className="text-[10px] font-mono text-cyan-300">CI: {parsedResult.patientId || 'S/N'} • {parsedResult.patientAge ? `${parsedResult.patientAge} años` : ''}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Diagnóstico Principal</span>
                  <p className="font-bold text-emerald-300">{parsedResult.diagnosis || 'Pendiente'}</p>
                </div>
              </div>

              {/* Medicamentos detectados */}
              {parsedResult.medications && parsedResult.medications.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                    Medicamentos para el Récipe Doble Talón ({parsedResult.medications.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedResult.medications.map((m, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                        <p className="font-bold text-white">{m.drug}</p>
                        <p className="text-slate-400 text-[10px]">{m.dose} • {m.frequency} • {m.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Estudios de Laboratorio y Neuroimagen detectados */}
              {((parsedResult.labTests && parsedResult.labTests.length > 0) || (parsedResult.imagingStudies && parsedResult.imagingStudies.length > 0)) && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                    Estudios de Laboratorio y Neuroimagen Detectados
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedResult.labTests?.map((t, idx) => (
                      <span key={`lab-${idx}`} className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-200 text-[10px] font-medium">
                        ✓ {t}
                      </span>
                    ))}
                    {parsedResult.imagingStudies?.map((s, idx) => (
                      <span key={`img-${idx}`} className="px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/40 text-sky-200 text-[10px] font-medium">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Pie del modal */}
        <div className="px-6 py-4 bg-[#070e1d] border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer text-xs"
          >
            Cancelar
          </button>

          {parsedResult && (
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95"
            >
              <span>Aplicar a los Documentos de Consulta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
