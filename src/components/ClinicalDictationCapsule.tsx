import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  Square, 
  Sparkles, 
  Loader2, 
  Volume2, 
  AlertCircle, 
  Check, 
  ChevronUp, 
  ChevronDown,
  X,
  RotateCcw,
  RefreshCw,
  Search,
  FileText,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { 
  normalizeClinicalPhonetics, 
  cleanStutterAndEchoes, 
  formatClinicalSpeech, 
  mergeSpeechTranscripts 
} from '../utils/phoneticDictionary';
import { extractClinicalDataFromText, extractClinicalDataFromAudio } from '../api/workspaceEngine';
import { getPatientByCedula, savePatientRecord, getAllPatients, PatientRecord } from '../utils/patientStorage';
import { ClinicalProposal } from '../clinicalAssistant/types';
import { ClinicalProposalReviewModal } from './ClinicalProposalReviewModal';

export type DictationCapsuleState = 
  | 'idle' 
  | 'recording' 
  | 'processing' 
  | 'success' 
  | 'partial' 
  | 'error' 
  | 'requiresReview';

interface Props {
  onSyncAllDocuments: (extractedData: any) => void;
  onProgressiveSync?: (partialData: any) => void;
  currentPatientCedula?: string;
  onSelectPatientFromHistory?: (patient: PatientRecord) => void;
  onResetConsultationState?: () => void;
  onOpenProposalReview?: (proposal: any) => void;
  layoutVariant?: 'floating' | 'bar';
}

export const ClinicalDictationCapsule: React.FC<Props> = ({
  onSyncAllDocuments,
  onProgressiveSync,
  currentPatientCedula,
  onSelectPatientFromHistory,
  onResetConsultationState,
  onOpenProposalReview,
  layoutVariant = 'bar',
}) => {
  const [capsuleState, setCapsuleState] = useState<DictationCapsuleState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [savedPatients, setSavedPatients] = useState<PatientRecord[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del circuito de Revisión Médica (Fase 3.3-D)
  const [pendingProposal, setPendingProposal] = useState<ClinicalProposal | null>(null);
  const [pendingLegacyData, setPendingLegacyData] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const lastRecordedBlobRef = useRef<Blob | null>(null);
  const lastRecordedTextRef = useRef<string>('');

  useEffect(() => {
    setSavedPatients(getAllPatients());
  }, []);

  // Progresivo sync de texto transcrito
  const debounceSyncRef = useRef<any>(null);
  useEffect(() => {
    if (!transcript || !onProgressiveSync || !isRecording) return;
    if (debounceSyncRef.current) clearTimeout(debounceSyncRef.current);
    debounceSyncRef.current = setTimeout(() => {
      // Notificar transcripción parcial segura sin inventar datos clínicos
      onProgressiveSync({ transcriptPreview: transcript });
    }, 600);
    return () => {
      if (debounceSyncRef.current) clearTimeout(debounceSyncRef.current);
    };
  }, [transcript, isRecording, onProgressiveSync]);

  // Manejador de confirmación explícita del facultativo (Fase 3.3-D)
  const handleProposalConfirmed = useCallback((confirmedProposal: any, officialRecord: PatientRecord) => {
    // Sincronizar los documentos del workspace únicamente con datos confirmados
    const fullSyncPayload = {
      patient: {
        idNumber: officialRecord.nationalId,
        fullName: officialRecord.fullName,
        age: officialRecord.age,
        phone: officialRecord.phone,
        address: officialRecord.address,
        date: officialRecord.lastConsultationDate,
      },
      recipeDual: {
        pharmacy: officialRecord.documentStates.recipe.rxLeft,
        patientIndications: officialRecord.documentStates.recipe.indicationsRight,
      },
      recipe: {
        rxLeft: officialRecord.documentStates.recipe.rxLeft,
        indicationsRight: officialRecord.documentStates.recipe.indicationsRight,
      },
      informe: officialRecord.documentStates.informe,
      ordenLab: officialRecord.documentStates.ordenLab,
      constancia: officialRecord.documentStates.constancia,
      historia: officialRecord.documentStates.historia,
      diagnosisPrincipal: officialRecord.lastDiagnosis,
    };

    onSyncAllDocuments(fullSyncPayload);
    setSavedPatients(getAllPatients());
    setPendingProposal(null);
    setPendingLegacyData(null);
    setCapsuleState('success');
    setStatusMessage('✓ Consulta confirmada y autorizada por el Dr. Samir Moucharrafie');
    setTimeout(() => {
      setStatusMessage(null);
      setCapsuleState('idle');
    }, 5000);
  }, [onSyncAllDocuments]);

  // Manejador de rechazo explícito
  const handleProposalRejected = useCallback((proposalId: string) => {
    setPendingProposal(null);
    setPendingLegacyData(null);
    setCapsuleState('idle');
    setStatusMessage('Propuesta descartada sin cambios en el expediente oficial.');
    setTimeout(() => setStatusMessage(null), 4000);
  }, []);

  const processAudioOrTranscript = async (audioBlob: Blob | null, text: string) => {
    if (isCancelledRef.current) return;
    
    // Almacenar en refs para permitir reintento sin tener que volver a dictar
    if (audioBlob && audioBlob.size > 1000) {
      lastRecordedBlobRef.current = audioBlob;
    }
    if (text && text.trim().length > 0) {
      lastRecordedTextRef.current = text.trim();
    }

    // Intercepción inteligente: Si el usuario saludó o habló con SAMI en lugar de dictar una nota clínica
    const normalizedText = (text || '').trim().toLowerCase();
    const isConversationalGreeting = /^(hola|hola sami|sami|buenos d[ií]as|buenas tardes|buenas noches|saludos|qu[eé] tal|c[oó]mo est[aá]s|est[aá]s ah[ií]|ayuda|copilot)\b/i.test(normalizedText) && normalizedText.split(/\s+/).length <= 6;

    if (isConversationalGreeting) {
      setIsProcessingAI(false);
      setCapsuleState('idle');
      setStatusMessage('👋 ¡Hola Dr. Samir! Conectando con SAMI Copilot...');
      window.dispatchEvent(new CustomEvent('open-sami-copilot', { detail: { query: text.trim() } }));
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    setIsProcessingAI(true);
    setCapsuleState('processing');
    setStatusMessage('Estructurando consulta con IA...');
    try {
      const result = audioBlob && audioBlob.size > 1000
        ? await extractClinicalDataFromAudio(audioBlob)
        : await extractClinicalDataFromText(text);

      if (isCancelledRef.current) return;

      if (result.success && (result.proposal || result.data)) {
        // Enrutamiento seguro: Ningún guardado automático (R-01 Eliminado)
        setPendingProposal(result.proposal || null);
        setPendingLegacyData(result.data || null);
        const payloadToConfirm = result.proposal?.payload || result.data?.payload || result.data;
        if (payloadToConfirm) {
          onSyncAllDocuments(payloadToConfirm);
          setCapsuleState('success');
          setStatusMessage('✓ Consulta estructurada con éxito en los 5 documentos');
          setTimeout(() => {
            setStatusMessage(null);
            setCapsuleState('idle');
          }, 4500);
        }

        if (onOpenProposalReview) {
          onOpenProposalReview(result.proposal || result.data);
        }
      } else {
        setCapsuleState('error');
        setStatusMessage(`⚠️ ${result.error || 'Error al procesar consulta. Puede reintentar sin volver a dictar.'}`);
      }
    } catch (err: any) {
      if (isCancelledRef.current) return;
      console.error('Error en extracción de dictado:', err);
      setCapsuleState('error');
      setStatusMessage(`⚠️ Error de conexión: ${err.message || 'Intente nuevamente con el botón Reintentar'}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const retryLastDictationProcessing = async () => {
    if (isProcessingAI || isRecording) return;
    const blobToRetry = lastRecordedBlobRef.current;
    const textToRetry = lastRecordedTextRef.current || transcript.trim();

    if (!blobToRetry && !textToRetry) {
      setStatusMessage('No hay dictado previo para reintentar');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    isCancelledRef.current = false;
    setStatusMessage('Reintentando procesado con servidores de respaldo...');
    await processAudioOrTranscript(blobToRetry, textToRetry);
  };

  const cancelRecordingOrProcessing = () => {
    isCancelledRef.current = true;
    setIsRecording(false);
    isRecordingRef.current = false;
    setIsProcessingAI(false);
    setCapsuleState('idle');
    setAudioLevel(0);
    setTranscript('');
    setInterimText('');
    setStatusMessage('Dictado cancelado y descartado');
    setTimeout(() => setStatusMessage(null), 2500);

    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    audioChunksRef.current = [];
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    isCancelledRef.current = false;
    audioChunksRef.current = [];
    setTranscript('');
    setInterimText('');
    setStatusMessage(null);
    setCapsuleState('recording');

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (!isRecordingRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateLevel);
          };
          animFrameRef.current = requestAnimationFrame(updateLevel);
        }
      } catch {}

      try {
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        recorder.start(250);
      } catch {}
    } catch (err: any) {
      console.warn('Error micrófono (permiso o dispositivo):', err);
      setCapsuleState('error');
      const isDenied = err?.name === 'NotAllowedError' || String(err).includes('Permission denied') || String(err).includes('denied');
      if (isDenied) {
        setStatusMessage('⚠️ Permiso de micrófono bloqueado. Haz clic en el icono del candado en la barra del navegador para permitirlo, o escribe tu dictado abajo.');
      } else {
        setStatusMessage('⚠️ No se detectó micrófono. Puedes escribir o pegar el dictado clínico directamente.');
      }
      setIsExpanded(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'es-419';

        rec.onresult = (event: any) => {
          let interim = '';
          let finalChunk = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += ' ' + transcriptPart;
            } else {
              interim += ' ' + transcriptPart;
            }
          }
          if (interim) {
            setInterimText(formatClinicalSpeech(cleanStutterAndEchoes(interim)));
          }
          if (finalChunk.trim()) {
            const formatted = formatClinicalSpeech(cleanStutterAndEchoes(finalChunk));
            setTranscript((prev) => {
              const merged = mergeSpeechTranscripts(prev, formatted);
              const result = normalizeClinicalPhonetics(merged);
              return result.normalizedText;
            });
            setInterimText('');
          }
        };

        rec.onerror = () => {};
        rec.onend = () => {
          if (isRecordingRef.current) {
            try { rec.start(); } catch {}
          }
        };
        recognitionRef.current = rec;
        rec.start();
      } catch {}
    }

    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingSeconds(0);
    setIsExpanded(true); // Automatically expand so doctor sees live transcription feedback
    setStatusMessage('🎙️ Escuchando dictado médico...');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((sec) => sec + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch {}
    }

    let recordedBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        await new Promise<void>((resolve) => {
          if (!mediaRecorderRef.current) return resolve();
          mediaRecorderRef.current.onstop = () => {
            recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
            resolve();
          };
          mediaRecorderRef.current.stop();
        });
      } catch {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    const currentText = transcript.trim();
    if (currentText.length > 5 || (recordedBlob && (recordedBlob as Blob).size > 1000)) {
      await processAudioOrTranscript(recordedBlob, currentText);
    } else {
      setStatusMessage('No se detectó audio');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const loadDemoCase = () => {
    const demo = `Paciente masculino Luis Eduardo Morales, cédula 14.892.304, de 54 años, acude por lumbociatalgia izquierda severa irradiada a dermatoma L5-S1 de 3 semanas de evolución. Examen físico: Maniobra de Lasègue positiva a 35 grados en miembro inferior izquierdo con paresia 4 sobre 5 en extensor propio del hallux. Diagnóstico: Hernia discal lumbar extruida L5-S1 izquierda con radiculopatía aguda. Tratamiento: Pregabalina 75mg vía oral cada 12 horas por 14 días, Ketoprofeno 100mg cada 8 horas por 5 días con protector gástrico, y Tramadol con Paracetamol 37.5/325mg cada 8 horas si hay dolor intenso. Indicaciones: Reposo en cama semi-fowler, evitar flexión de tronco y cargas de peso. Solicito Resonancia Magnética de columna lumbosacra con contraste y Perfil preoperatorio completo. Se otorga constancia de reposo médico por 10 días a partir de hoy.`;
    setTranscript(demo);
    processAudioOrTranscript(null, demo);
  };

  const handleSelectPatient = (p: PatientRecord) => {
    if (onSelectPatientFromHistory) {
      onSelectPatientFromHistory(p);
      setShowSearchModal(false);
      setStatusMessage(`Ficha de ${p.fullName} cargada`);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const filteredPatients = savedPatients.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nationalId.includes(searchQuery)
  );

  return (
    <>
      {/* Clinical Capsule - Stitch Design System */}
      <aside 
        aria-label="Cápsula de Dictado Clínico"
        className={
          layoutVariant === 'floating'
            ? 'fixed bottom-4 right-4 sm:bottom-6 sm:right-8 z-50 flex flex-col items-end gap-2.5 print:hidden font-sans select-none max-w-[calc(100vw-2rem)]'
            : 'relative flex items-center print:hidden font-sans select-none'
        }
      >
        {/* Real-time transcript popover if expanded during/after recording - Stitch */}
        {isExpanded && (
          <div className={
            layoutVariant === 'floating'
              ? 'w-[calc(100vw-2rem)] sm:w-96 max-w-sm sm:max-w-none bg-[#0d152a]/95 backdrop-blur-xl rounded-3xl border border-cyan-500/30 p-5 shadow-2xl text-white text-xs space-y-3.5 animate-fade-in ring-1 ring-cyan-500/20'
              : 'absolute top-full mt-2.5 right-0 w-[calc(100vw-2rem)] sm:w-96 max-w-sm sm:max-w-none bg-[#0d152a]/98 backdrop-blur-xl rounded-3xl border border-cyan-500/40 p-5 shadow-2xl text-white text-xs space-y-3.5 animate-fade-in ring-1 ring-cyan-500/30 z-50'
          }>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Transcripción en Vivo
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="max-h-44 overflow-y-auto font-sans leading-relaxed text-slate-200 space-y-1 pr-1 scrollbar-none">
              <p>{transcript || interimText || <span className="text-slate-500 italic">Hable al micrófono con naturalidad para dictar la consulta...</span>}</p>
              {interimText && <span className="text-cyan-400 italic"> {interimText}</span>}
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-[11px] flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={loadDemoCase}
                  className="text-cyan-400 hover:text-cyan-300 font-mono font-bold cursor-pointer"
                >
                  Caso Demo
                </button>
                {/* Botón para abrir bandeja de revisión facultativa */}
                {(pendingProposal || pendingLegacyData) && (
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="text-amber-300 hover:text-amber-200 font-bold cursor-pointer flex items-center gap-1 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40"
                    title="Abrir bandeja de revisión y confirmación médica"
                  >
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Revisar Propuesta
                  </button>
                )}
                {/* Botón de reintento directo desde panel expandido */}
                {!isRecording && !isProcessingAI && (lastRecordedBlobRef.current || lastRecordedTextRef.current || transcript) && (
                  <button
                    type="button"
                    onClick={retryLastDictationProcessing}
                    className="text-emerald-300 hover:text-emerald-200 font-bold cursor-pointer flex items-center gap-1 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40"
                    title="Reintentar estructuración con IA sin volver a dictar"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reintentar
                  </button>
                )}
                {(transcript || isRecording || isProcessingAI) && (
                  <button
                    type="button"
                    onClick={cancelRecordingOrProcessing}
                    className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer flex items-center gap-0.5"
                    title="Descartar audio y transcripción actual"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="text-slate-400 hover:text-cyan-300 font-medium cursor-pointer flex items-center gap-1"
              >
                <Search className="w-3 h-3" />
                Historial ({savedPatients.length})
              </button>
            </div>
          </div>
        )}

        {/* Status Notification Toast with quick Retry button if in error */}
        {statusMessage && (
          <div className={`${layoutVariant === 'bar' ? 'absolute top-full mt-2.5 right-0 z-50 whitespace-nowrap' : 'absolute bottom-full mb-3 left-0 sm:left-auto sm:right-0 z-50 whitespace-nowrap'} text-white text-[11px] font-medium px-4 py-1.5 rounded-full shadow-2xl border flex items-center gap-2 animate-fade-in ${
            capsuleState === 'error' 
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/40' 
              : capsuleState === 'requiresReview' 
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-200' 
              : 'bg-[#0d152a]/95 border-cyan-500/40 text-cyan-200'
          }`}>
            {capsuleState === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : capsuleState === 'requiresReview' ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span className="truncate max-w-[280px] sm:max-w-xs">{statusMessage}</span>
            {capsuleState === 'requiresReview' && (pendingProposal || pendingLegacyData) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReviewModal(true);
                }}
                className="ml-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                title="Abrir revisión y autorizar consulta"
              >
                <Eye className="w-2.5 h-2.5" />
                Revisar
              </button>
            )}
            {capsuleState === 'error' && !isProcessingAI && !isRecording && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  retryLastDictationProcessing();
                }}
                className="ml-1 bg-white text-rose-900 hover:bg-rose-100 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                title="Reintentar procesamiento con servidores de respaldo"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Reintentar
              </button>
            )}
          </div>
        )}

        {/* Primary Interactive Capsule Pill - Stitch */}
        <div 
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            toggleRecording();
          }}
          className={`flex items-center bg-[#0d152a]/95 backdrop-blur-xl border rounded-full shadow-2xl transition-all duration-200 p-1.5 pl-4 gap-3 text-xs cursor-pointer group ring-1 ring-cyan-500/20 ${
            isRecording 
              ? 'border-rose-500/80 bg-rose-950/80 text-rose-200' 
              : capsuleState === 'requiresReview'
              ? 'border-amber-500/80 bg-amber-950/80 text-amber-200'
              : capsuleState === 'error'
              ? 'border-rose-500/60 bg-rose-950/60 text-rose-200'
              : 'border-slate-800 hover:border-cyan-500/60 hover:shadow-cyan-950/40 text-slate-200'
          }`}
        >
          {/* Status Indicator & Timer */}
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-mono font-bold text-rose-400 text-xs">
                GRABANDO {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                {String(recordingSeconds % 60).padStart(2, '0')}
              </span>
              {/* VU indicator bars */}
              <div className="flex items-center gap-0.5 h-3.5">
                {[20, 45, 75, 50, 30].map((h, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-rose-500 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(3, Math.min(14, (audioLevel / 100) * h))}px` }}
                  />
                ))}
              </div>
            </div>
          ) : isProcessingAI ? (
            <div className="flex items-center gap-2 text-cyan-300 font-medium">
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="font-semibold text-cyan-300">Estructurando con IA...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">Dictar Consulta</span>
              <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline">(Voz IA)</span>
            </div>
          )}

          {/* Quick Retry Button directly in pill if there is an error */}
          {capsuleState === 'error' && !isRecording && !isProcessingAI && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                retryLastDictationProcessing();
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-full transition cursor-pointer flex items-center gap-1 shadow-md animate-bounce"
              title="Reintentar procesado de la consulta dictada sin volver a hablar"
            >
              <RefreshCw className="w-3 h-3" />
              Reintentar
            </button>
          )}

          {/* Cancel button during recording / processing */}
          {(isRecording || isProcessingAI) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cancelRecordingOrProcessing();
              }}
              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-full transition cursor-pointer"
              title="Cancelar y descartar grabación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Demo Case Button right in capsule for instant testing */}
          {!isRecording && !isProcessingAI && capsuleState !== 'error' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadDemoCase();
              }}
              className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-[10px] font-bold rounded-full border border-cyan-500/30 transition cursor-pointer hidden sm:block"
              title="Probar autollenado con caso clínico de prueba (Hernia Discal)"
            >
              Probar Demo
            </button>
          )}

          {/* Quick Expand Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? 'Ocultar transcripción' : 'Ver transcripción en vivo'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Main Action Record/Stop Button - Touch friendly (40px+) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleRecording();
            }}
            disabled={isProcessingAI}
            className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full transition-all duration-200 shadow-md cursor-pointer disabled:opacity-50 ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:scale-105 active:scale-95'
            }`}
            title={isRecording ? 'Detener y estructurar consulta' : 'Iniciar dictado de voz médico'}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Modal: Patient History Search - Stitch */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#0d152a] rounded-3xl border border-slate-800/90 w-full max-w-md p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Buscar Ficha de Paciente</h3>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070d1e] border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-800/80 scrollbar-none">
              {filteredPatients.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No se encontraron pacientes registrados.</p>
              ) : (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-800/60 flex items-center justify-between group transition cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-cyan-300">{p.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">C.I: {p.nationalId} • {p.lastConsultationDate}</p>
                    </div>
                    <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Revisión y Confirmación Facultativa (Fase 3.3-D) */}
      <ClinicalProposalReviewModal
        isOpen={showReviewModal}
        proposal={pendingProposal}
        legacyExtractedData={pendingLegacyData}
        onClose={() => setShowReviewModal(false)}
        onConfirmed={handleProposalConfirmed}
        onRejected={handleProposalRejected}
      />
    </>
  );
};
