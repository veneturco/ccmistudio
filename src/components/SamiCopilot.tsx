import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Trash2,
  User,
  ShieldCheck,
  Zap,
  ChevronDown,
  Stethoscope,
  Pill,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  MessageSquare,
  HelpCircle,
  Activity,
  Layers,
  AlertTriangle,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { SamiAvatar } from './SamiAvatar';
import { BrandLogo } from './BrandLogo';
import { PatientData } from '../types';
import { useClinicalDictation } from '../hooks/useClinicalDictation';

export interface SamiChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  isError?: boolean;
  autofillPayload?: {
    type: 'RECETA' | 'ORDEN' | 'LABORATORIO' | 'INFORME' | 'CONSTANCIA' | 'HISTORIA';
    [key: string]: any;
  };
}

export interface SamiVoiceSettings {
  voiceURI: string;
  rate: number;
  pitch: number;
  readMode: 'executive' | 'full';
  autoPlay: boolean;
}

const DEFAULT_VOICE_SETTINGS: SamiVoiceSettings = {
  voiceURI: '',
  rate: 1.05,
  pitch: 1.0,
  readMode: 'executive',
  autoPlay: true,
};

const VOICE_PRESETS = [
  {
    id: 'sobrio',
    name: 'Médico Sobrio',
    desc: 'Cadencia sosegada y tono grave profesional',
    rate: 0.98,
    pitch: 0.92,
    readMode: 'executive' as const,
  },
  {
    id: 'dinamico',
    name: 'Ejecutivo Ágil',
    desc: 'Mayor velocidad para consultas de alta demanda',
    rate: 1.15,
    pitch: 1.0,
    readMode: 'executive' as const,
  },
  {
    id: 'exhaustivo',
    name: 'Lectura Exhaustiva',
    desc: 'Velocidad estándar y lectura completa del informe',
    rate: 1.02,
    pitch: 1.0,
    readMode: 'full' as const,
  },
];

interface SamiCopilotProps {
  activePatient?: PatientData | null;
  activeView?: string;
  userRole?: string;
}

const STORAGE_KEY = 'ccmi_sami_chat_history_v1';

export const SamiCopilot: React.FC<SamiCopilotProps> = ({
  activePatient,
  activeView = 'home',
  userRole = 'MEDICO',
}) => {
  const isMounted = useRef<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [includePatientContext, setIncludePatientContext] = useState<boolean>(true);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedAutofillId, setAppliedAutofillId] = useState<string | null>(null);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<SamiVoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('ccmi_sami_voice_settings_v1');
      if (saved) return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_VOICE_SETTINGS;
  });

  // Guardar configuración de audio en almacenamiento local
  useEffect(() => {
    try {
      localStorage.setItem('ccmi_sami_voice_settings_v1', JSON.stringify(voiceSettings));
    } catch {}
  }, [voiceSettings]);

  // Cargar y ordenar voces del sistema (con auto-selección preferente en español)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const rawVoices = window.speechSynthesis.getVoices();
      if (!rawVoices || rawVoices.length === 0) return;

      const spanishVoices = rawVoices.filter((v) => v.lang.toLowerCase().startsWith('es'));
      const otherVoices = rawVoices.filter((v) => !v.lang.toLowerCase().startsWith('es'));
      const sorted = [...spanishVoices, ...otherVoices];
      setAvailableVoices(sorted);

      setVoiceSettings((prev) => {
        if (prev.voiceURI && sorted.some((v) => v.voiceURI === prev.voiceURI)) {
          return prev;
        }
        // Auto-seleccionar la mejor voz disponible en español
        const preferred = spanishVoices.find((v) =>
          v.name.toLowerCase().includes('google') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('jorge') ||
          v.name.toLowerCase().includes('sabina') ||
          v.name.toLowerCase().includes('helena')
        ) || spanishVoices[0] || sorted[0];

        if (preferred) {
          return { ...prev, voiceURI: preferred.voiceURI };
        }
        return prev;
      });
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Desmontaje seguro para evitar fugas de memoria
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Función de síntesis de voz personalizable con parámetros médicos avanzados
  const speakText = (text: string, force = false) => {
    if ((!isVoiceOutputEnabled || !voiceSettings.autoPlay) && !force) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();

      // Limpiar formato markdown para lectura oral médica fluida
      let cleanText = text
        .replace(/[*#_`>]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      // Modo de lectura: Resumen ejecutivo vs Lectura exhaustiva
      if (voiceSettings.readMode === 'executive' && !force) {
        cleanText = cleanText.slice(0, 480);
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;

      if (voiceSettings.voiceURI && availableVoices.length > 0) {
        const match = availableVoices.find((v) => v.voiceURI === voiceSettings.voiceURI);
        if (match) {
          utterance.voice = match;
          utterance.lang = match.lang;
        } else {
          utterance.lang = 'es-ES';
        }
      } else {
        utterance.lang = 'es-ES';
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  };

  const handleTestVoice = () => {
    speakText('Dr. Samir, el sistema de asistencia neuroquirúrgica SAMI está configurado con este timbre y cadencia.', true);
  };

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Referencias para auto-envío por voz
  const voiceTimeoutRef = useRef<any>(null);
  const voiceTranscriptRef = useRef<string>('');

  // Hook de dictado clínico por voz en español con auto-envío inteligente
  const { isListening, toggleDictation, stopDictation, isSupported: speechSupported } = useClinicalDictation((text) => {
    setInputQuery(text);
    voiceTranscriptRef.current = text;

    // Si el usuario termina de hablar, auto-enviar a los 1.6 segundos de silencio
    if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
    voiceTimeoutRef.current = setTimeout(() => {
      if (voiceTranscriptRef.current.trim()) {
        const query = voiceTranscriptRef.current.trim();
        stopDictation();
        handleSendMessage(query);
      }
    }, 1600);
  });

  const handleManualToggleDictation = () => {
    if (isListening) {
      stopDictation();
      if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
      if (inputQuery.trim()) {
        handleSendMessage(inputQuery.trim());
      }
    } else {
      toggleDictation();
    }
  };

  // Escuchar eventos globales para abrir SAMI
  useEffect(() => {
    const handleOpenSami = (e: any) => {
      setIsOpen(true);
      if (e.detail?.query) {
        setTimeout(() => {
          handleSendMessage(e.detail.query);
        }, 300);
      }
    };
    window.addEventListener('open-sami-copilot', handleOpenSami);
    return () => window.removeEventListener('open-sami-copilot', handleOpenSami);
  }, []);

  // Triage Inteligente: Detección proactiva de banderas rojas clínicas (Diabetes, HTA, Alergias, Cardiopatías)
  useEffect(() => {
    if (!activePatient) {
      setRedFlags([]);
      return;
    }
    const flags: string[] = [];
    const patientAny = activePatient as any;
    const historyText = `${patientAny.history || ''} ${patientAny.antecedents || ''} ${patientAny.antecedentes || ''} ${activePatient.diagnosisPrincipal || ''} ${activePatient.diagnosis || ''}`.toLowerCase();
    const allergiesText = `${patientAny.allergies || ''} ${patientAny.alergias || ''}`.toLowerCase();

    if (historyText.includes('diabet') || historyText.includes('dm2') || historyText.includes('dm1') || historyText.includes('dbt')) {
      flags.push('Diabetes Mellitus (Riesgo metabólico / Cicatrización e Infección quirúrgica)');
    }
    if (
      historyText.includes('hta') ||
      historyText.includes('hipertens') ||
      historyText.includes('hipertension') ||
      historyText.includes('presion alta') ||
      historyText.includes('presión alta')
    ) {
      flags.push('Hipertensión Arterial (HTA) (Riesgo cardiovascular / Control hemodinámico)');
    }
    if (
      allergiesText.trim() &&
      allergiesText.trim() !== 'no' &&
      allergiesText.trim() !== 'ninguna' &&
      allergiesText.trim() !== 'niega' &&
      allergiesText.trim() !== 'no refiere' &&
      allergiesText.trim() !== 'no conocidas'
    ) {
      flags.push(`Alergia confirmada: ${patientAny.allergies || patientAny.alergias}`);
    }
    if (historyText.includes('cardiopat') || historyText.includes('infarto') || historyText.includes('arritmia') || historyText.includes('stent')) {
      flags.push('Cardiopatía / Riesgo cardiovascular mayor');
    }

    setRedFlags(flags);
  }, [activePatient]);

  const [messages, setMessages] = useState<SamiChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse error
    }
    return [
      {
        id: 'welcome-1',
        role: 'model',
        text: `Hola Dr. Samir, soy **SAMI** (Synapsis Advanced Medical Intelligence), tu copiloto clínico con arquitectura **Google Gemini 3.8 Flash** en la **Unidad CCMI**.\n\nEstoy preparado para asistirte en:\n* ✨ **Generación y autocompletado** de los 5 documentos oficiales (Récipes dobles, Órdenes preoperatorias, Informes, Constancias e Historias).\n* 💊 **Esquemas farmacológicos** y posología en patología de columna y dolor radicular.\n* 🩺 **Escalas neuroquirúrgicas** (Nurick, mJOA, ASIA, EVA/VAS, Glasgow).\n* 🔬 **Perfiles de laboratorio quirúrgico** y chequeo de banderas rojas.\n\n¿En qué paciente o requerimiento nos enfocamos hoy?`,
        timestamp: new Date().toISOString(),
        modelUsed: 'Gemini 3.8 Flash',
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Error saving SAMI history:', e);
    }
  }, [messages]);

  // Función para aplicar auto-relleno al espacio de trabajo
  const handleApplyAutofill = (payload: any, messageId: string) => {
    if (!payload) return;
    window.dispatchEvent(new CustomEvent('sami-autofill', { detail: payload }));
    setAppliedAutofillId(messageId);
    setTimeout(() => setAppliedAutofillId(null), 3500);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isThinking) return;

    const userMessage: SamiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputQuery('');
    setIsThinking(true);

    try {
      const payload: any = {
        messages: newHistory.map((m) => ({
          role: m.role,
          text: m.text,
        })),
        activeView,
        userRole,
      };

      if (includePatientContext && activePatient) {
        payload.patientContext = {
          fullName: activePatient.fullName,
          idNumber: activePatient.idNumber,
          age: activePatient.age,
          diagnosis: activePatient.diagnosis || (activePatient as any).diagnosisPrincipal,
          medications: (activePatient as any).medications,
          allergies: (activePatient as any).allergies,
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      let data: any = null;
      try {
        const response = await fetch('/api/sami/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          data = await response.json();
        } else {
          console.warn('[SAMI Copilot] Servidor retornó código:', response.status);
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.warn('[SAMI Copilot] Red o timeout tras 20s, activando respuesta segura local:', fetchErr);
      }

      let replyText = data?.reply;
      let usedModel = data?.usedModel || 'Gemini 3.8 Flash';
      let autofillPayload: any = null;

      const q = textToSend.toLowerCase();

      // DETECCIÓN INTELIGENTE DE AUTOFILL CLÍNICO Y ACCIONES EN TIEMPO REAL
      if (
        q.includes('receta') ||
        q.includes('recipe') ||
        q.includes('récipe') ||
        q.includes('recetar') ||
        q.includes('indicar') ||
        q.includes('prescrib') ||
        q.includes('pregabalina') ||
        q.includes('ketoprofeno') ||
        q.includes('tiocolchicosido') ||
        q.includes('tiocolchicósido') ||
        q.includes('analgesia') ||
        q.includes('lumbociat') ||
        q.includes('lumbociát')
      ) {
        let rxLeft = '1. Pregabalina 75 mg cápsulas (Caja x 30)\n2. Ketoprofeno 100 mg tabletas (Caja x 20)\n3. Tiocolchicósido 4 mg cápsulas (Caja x 14)\n4. Omeprazol 20 mg cápsulas (Caja x 28)';
        let indicationsRight = '1. Pregabalina 75 mg: Tomar 1 cápsula vía oral cada 12 horas por 21 días (iniciar nocturno los primeros 3 días).\n2. Ketoprofeno 100 mg: Tomar 1 tableta vía oral cada 12 horas con alimentos por 5 días.\n3. Tiocolchicósido 4 mg: Tomar 1 cápsula cada 12 horas por 5 días.\n4. Omeprazol 20 mg: Tomar 1 cápsula 30 min antes del desayuno por 14 días.\n5. Reposo relativo en decúbito semi-fowler. Evitar flexión o cargas axiales.';

        if (q.includes('pregabalina') && !q.includes('ketoprofeno')) {
          rxLeft = '1. Pregabalina 75 mg cápsulas (Caja x 30)';
          indicationsRight = 'Tomar 1 cápsula vía oral cada 12 horas por 21 días.\nTitulación médica según evolución clínica.';
        }

        autofillPayload = {
          type: 'RECETA',
          rxLeft,
          indicationsRight,
        };

        // Si el usuario pidió explícitamente redactar o hacer el récipe, despachamos evento directo
        window.dispatchEvent(new CustomEvent('sami-autofill', { detail: autofillPayload }));

        if (!replyText) {
          replyText = `### 💊 Récipe Médico Doble Talón Oficial CCMI

He estructurado el esquema terapéutico protocolizado para patología raquídea y activado el auto-llenado en la papelería oficial:

* **Talón Farmacéutico (Rp/):**
${rxLeft.split('\n').map((l: string) => `  * ${l}`).join('\n')}

* **Talón de Indicaciones (Paciente):**
${indicationsRight.split('\n').map((l: string) => `  * ${l}`).join('\n')}

⚡ *Los datos se han transferido a la pestaña de Récipe. Puede emitir el PDF oficial inmediatamente.*`;
          usedModel = 'SAMI-AutoFill-Agent';
        }
      } else if (
        q.includes('lab') ||
        q.includes('laboratorio') ||
        q.includes('preoperatorio') ||
        q.includes('perfil') ||
        q.includes('coagulacion') ||
        q.includes('coagulación') ||
        q.includes('sangre') ||
        q.includes('examen')
      ) {
        autofillPayload = {
          type: 'ORDEN',
          labTests: {
            'Hematología Completa': true,
            'Plaquetas': true,
            'Pt (Tiempo Protrombina)': true,
            'Ptt (Tiempo Parcial de Tromboplastina)': true,
            'Dosificación de Fibrinógeno': true,
            'Glicemia': true,
            'Urea': true,
            'Creatinina': true,
            'HIV': true,
            'VDRL': true,
            'Grupo Sanguíneo, Factor Rh (D)': true,
            'Examen General de Orina': true,
          },
          neuroimagingTests: {
            'RESONANCIA MAGNÉTICA': true,
          },
          labPresumptiveDx: activePatient?.diagnosis || (activePatient as any)?.diagnosisPrincipal || 'Patología Raquimedular en Evaluación Preoperatoria',
        };

        window.dispatchEvent(new CustomEvent('sami-autofill', { detail: autofillPayload }));

        if (!replyText) {
          replyText = `### 🔬 Perfil Preoperatorio Quirúrgico (CCMI)

He generado y activado la orden de laboratorios preoperatorios completos en la mesa de trabajo:

1. **Hematología y Coagulación:** Hematología completa, Plaquetas, PT, PTT, INR y Fibrinógeno.
2. **Química y Función Renal:** Glicemia basal, Urea y Creatinina sérica.
3. **Infeccioso y Serología:** VIH 1 y 2, VDRL y Grupo Sanguíneo / Rh.
4. **Uroanálisis:** Examen general de orina (descarte de foco infeccioso subyacente).

⚡ *Los 12 exámenes principales han sido marcados automáticamente en la Orden Oficial.*`;
          usedModel = 'SAMI-AutoFill-Agent';
        }
      } else if (q.includes('informe') || q.includes('informe medico') || q.includes('informe médico')) {
        const patientName = activePatient?.fullName || 'Paciente';
        const reportBody = `Se trata de paciente ${patientName}, evaluado en la Unidad Cerebro Columna Mínimamente Invasiva (CCMI), quien acude por presentar cuadro clínico compatible con afección de columna lumbar/cervical.\n\nAl examen neurológico: Conserva marcha con claudicación neurógena a distancia, reflejos osteotendinosos asimétricos y maniobras de irritación radicular concordantes. Estudios imagenológicos de RMN evidencian compromiso anatómico de disco e inestabilidad segmentaria.\n\nSe indica plan de manejo médico protocolizado y seguimiento para eventual descompresión neuroquirúrgica mínimamente invasiva.`;
        autofillPayload = {
          type: 'INFORME',
          bodyText: reportBody,
        };
        window.dispatchEvent(new CustomEvent('sami-autofill', { detail: autofillPayload }));
      } else if (!replyText) {
        if (q.includes('hola') || q.includes('saludos') || q.includes('buenos') || q.includes('buenas') || q === 'sami') {
          replyText = `¡Hola Dr. Samir! Es un placer saludarle. Estoy conectado a su estación de trabajo en el CCMI.\n\n¿Qué requerimiento clínico o documento desea preparar? Puede pedirme:\n* ✨ **Récipes** dobles con posología analgésica.\n* 🔬 **Órdenes de laboratorio** preoperatorias completas.\n* 🩺 **Escalas neuroquirúrgicas** (Nurick, mJOA, ASIA, VAS).\n* 📋 **Técnicas de columna** (TLIF, abordajes MIS).\n* 📄 **Informes y constancias** oficiales.`;
        } else if (q.includes('nurick') || q.includes('mjoa') || q.includes('mielopat')) {
          replyText = `### 🩺 Escalas Nurick & mJOA (Mielopatía Cervical)\n\n* **Nurick 0-1:** Asintomático o sin alteración de marcha.\n* **Nurick 2-3:** Dificultad para deambular pero autónomo.\n* **Nurick 4-5:** Requiere apoyo de terceros o silla de ruedas.\n* **mJOA (0-17):** Leve (15-17), Moderada (12-14), Severa (<12).\n\n⚡ **Conducta CCMI:** mJOA ≤ 14 con compresión medular en RMN amerita descompresión quirúrgica oportuna.`;
        } else {
          replyText = `### 🧠 SAMI Copilot (Modo Resiliente CCMI)\n\nDr. Samir, he analizado su consulta: **"${textToSend}"**.\n\n* Quedo a su disposición para desglosar escalas neuroquirúrgicas, esquemas farmacológicos protocolizados o autocompletar la papelería oficial.\n* Si desea emitir un récipe o una orden de laboratorio para el paciente actual, solo indíquemelo y lo cargaré al instante en el documento oficial.`;
        }
        usedModel = 'SAMI-Local-Resiliente';
      }

      const modelMessage: SamiChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toISOString(),
        modelUsed: usedModel,
        autofillPayload,
      };

      setMessages((prev) => [...prev, modelMessage]);
      speakText(replyText);
    } catch (error) {
      console.error('Error enviando mensaje a SAMI:', error);
      const errorMessage: SamiChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Dr. Samir, se produjo una interrupción momentánea de conexión. SAMI mantiene el motor clínico local activo.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.warn('Error copiando texto al portapapeles');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Desea reiniciar el historial de conversación de SAMI?')) {
      const initial: SamiChatMessage = [
        {
          id: 'welcome-new',
          role: 'model',
          text: 'Conversación reiniciada con éxito. Estoy listo para asistirte en tus decisiones clínicas, posología o manejo del sistema CCMI.',
          timestamp: new Date().toISOString(),
          modelUsed: 'Gemini 3.8 Flash',
        },
      ];
      setMessages(initial);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Google Material 3 Assist Chips (Suggestion Chips)
  const quickPrompts = [
    { label: '✨ Crear Récipe Doble', icon: Pill, query: 'Hazme un récipe médico doble talón con esquema analgésico de Pregabalina, Ketoprofeno y Tiocolchicósido para crisis radicular.' },
    { label: '🔬 Perfil Preoperatorio', icon: FlaskConical, query: 'Genera una orden de laboratorios preoperatorios completos con coagulación (PT, PTT, Fibrinógeno), química y serología.' },
    { label: '🩺 Escala Nurick / mJOA', icon: Stethoscope, query: 'Explícame las escalas de Nurick y mJOA para mielopatía cervical y sus puntos de corte quirúrgico.' },
    { label: '⚡ Escala ASIA Raquídea', icon: Activity, query: 'Cuáles son los grados de la escala ASIA para lesión medular y cómo clasificar cada nivel?' },
    { label: '📋 Redactar Informe Médico', icon: FileText, query: 'Redacta un modelo de informe médico oficial para un paciente con estenosis de canal lumbar y radiculopatía.' },
    { label: '🏥 Protocolo TLIF Columna', icon: Layers, query: 'Cuáles son los pasos e indicaciones clínicas para una artrodesis lumbar instrumentada TLIF L4-L5/L5-S1?' },
    { label: '📄 Reposo Médico Laboral', icon: FileSpreadsheet, query: 'Genera un modelo de constancia médica de reposo laboral por 15 días tras cirugía de columna.' },
  ];

  // Render basic markdown with headers, bold, bullet points
  const renderFormattedMarkdown = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-cyan-300 mt-2.5 mb-1.5 flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"><BrandLogo /></div>
            <span>{line.replace('### ', '')}</span>
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-bold text-cyan-200 mt-3 mb-1.5 border-b border-cyan-800/40 pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-lg font-black text-cyan-100 mt-3 mb-2">
            {line.replace('# ', '')}
          </h2>
        );
      }

      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 leading-relaxed text-xs sm:text-sm my-0.5">
            {parseInlineFormatting(content)}
          </li>
        );
      }

      // Numbered lists
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 text-slate-200 text-xs sm:text-sm my-1 pl-1">
            <span className="text-cyan-400 font-semibold shrink-0">{numMatch[1]}.</span>
            <span>{parseInlineFormatting(numMatch[2])}</span>
          </div>
        );
      }

      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      // Regular line
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-200 leading-relaxed my-0.5">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-cyan-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-300 font-mono text-xs border border-cyan-900/40">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. GOOGLE GEMINI FLOATING ASSISTANT CAPSULE (EXTENDED FAB) */}
      {/* ========================================================= */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative rounded-full transition-all duration-300 transform hover:-translate-y-1 active:scale-95 text-left flex p-[1.5px] sami-capsule shadow-[0_8px_30px_rgba(6,182,212,0.35)] hover:shadow-[0_12px_45px_rgba(6,182,212,0.6)] cursor-pointer"
            title="Abrir SAMI Copilot (Asistente Conversacional Google Gemini)"
          >
            {/* Iridescent Gemini Border */}
            <div className="sami-synaptic-border rounded-full" />

            <div className="sami-capsule-inner flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-2.5 w-full h-full rounded-full bg-[#0b1329]/95 backdrop-blur-xl">
              <div className="relative">
                <SamiAvatar size="sm" isThinking={false} isOnline={true} showHalo={false} />
                {/* Live Online Pulsing Dot */}
                <div className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
                </div>
              </div>

              <div className="flex flex-col pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 tracking-wide drop-shadow-sm">
                    SAMI
                  </span>
                  <span className="px-1.5 py-[1px] bg-cyan-500/15 border border-cyan-400/40 rounded-full text-[9px] font-bold text-cyan-300 uppercase tracking-wider">
                    GEMINI
                  </span>
                </div>
                <span className="text-[10.5px] text-cyan-100/70 font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  Copiloto Clínico CCMI
                </span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. GOOGLE ASSISTANT CONVERSATIONAL SHEET / DRAWER          */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-[#0c1427]/98 backdrop-blur-2xl border border-cyan-500/25 shadow-[0_20px_70px_rgba(2,8,23,0.9),0_0_40px_rgba(6,182,212,0.18)] overflow-hidden ${
            isExpanded
              ? 'inset-3 sm:inset-6 rounded-[2rem]'
              : 'inset-x-0 bottom-0 h-[88vh] max-h-[88vh] sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[480px] md:sm:w-[520px] sm:h-[720px] sm:max-h-[88vh] rounded-t-[2.5rem] sm:rounded-[2rem]'
          }`}
        >
          {/* Mobile Drag Indicator Handle (Google Assistant Bottom Sheet) */}
          <div className="sm:hidden w-full pt-2.5 pb-1 flex justify-center shrink-0">
            <div
              onClick={() => setIsOpen(false)}
              className="w-12 h-1.5 bg-slate-600/60 hover:bg-cyan-400/80 rounded-full transition-colors cursor-pointer"
              title="Deslizar para cerrar"
            />
          </div>

          {/* HEADER DEL ASISTENTE GOOGLE MATERIAL 3 */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-gradient-to-r from-slate-900 via-[#0b1736] to-slate-900 border-b border-cyan-500/20 shrink-0">
            <div className="flex items-center gap-3">
              <SamiAvatar size="md" isThinking={isThinking} isOnline={true} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-cyan-100 tracking-wide flex items-center gap-1.5">
                    <span>SAMI Copilot</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/40 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
                    Gemini 3.8
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="text-cyan-300/90 font-medium">Synapsis Intelligence</span>
                  <span className="text-cyan-500">•</span>
                  <span className="text-emerald-400 font-medium">Clínica CCMI</span>
                </p>
              </div>
            </div>

            {/* Acciones del Header (Google Assistant Controls) */}
            <div className="flex items-center gap-1">
              {/* Botón de Ajustes de Voz */}
              <button
                type="button"
                onClick={() => setShowVoiceSettings((prev) => !prev)}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  showVoiceSettings
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
                title="Ajustes de Voz y Lectura Médica"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Botón de Voz Activada/Silenciada */}
              <button
                type="button"
                onClick={() => {
                  const next = !isVoiceOutputEnabled;
                  setIsVoiceOutputEnabled(next);
                  if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isVoiceOutputEnabled ? 'text-cyan-300 hover:bg-cyan-950/60' : 'text-slate-500 hover:bg-slate-800/80'
                }`}
                title={isVoiceOutputEnabled ? 'Voz activa (clic para silenciar)' : 'Voz silenciada (clic para activar)'}
              >
                {isVoiceOutputEnabled ? (
                  <Volume2 className={`w-4 h-4 text-cyan-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* Botón de Reiniciar Historial */}
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
                title="Reiniciar conversación"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Botón Expandir/Contraer (Desktop) */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
                title={isExpanded ? 'Restaurar tamaño' : 'Expandir ventana'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/15 rounded-full transition-colors cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PANEL DESPLEGABLE DE AJUSTES DE VOZ */}
          {showVoiceSettings && (
            <div className="bg-[#0b1324]/98 border-b border-cyan-500/30 p-4 text-xs space-y-3.5 shrink-0 shadow-2xl backdrop-blur-2xl ring-1 ring-cyan-500/20 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <div className="flex items-center gap-2 text-cyan-200 font-bold text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                  <span>Configuración de Voz y Lectura Médica</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {availableVoices.length} {availableVoices.length === 1 ? 'voz' : 'voces'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVoiceSettings(false)}
                  className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded transition cursor-pointer"
                  title="Cerrar ajustes de voz"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Presets Profesionales */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Estilos Preconfigurados (Presets)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {VOICE_PRESETS.map((preset) => {
                    const isActive =
                      Math.abs(voiceSettings.rate - preset.rate) < 0.03 &&
                      Math.abs(voiceSettings.pitch - preset.pitch) < 0.03 &&
                      voiceSettings.readMode === preset.readMode;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setVoiceSettings((prev) => ({
                            ...prev,
                            rate: preset.rate,
                            pitch: preset.pitch,
                            readMode: preset.readMode,
                          }));
                        }}
                        className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                            : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{preset.name}</span>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Voz del Sistema */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Modelo de Voz del Dispositivo
                  </label>
                  <span className="text-[10px] text-cyan-400 font-medium">
                    {availableVoices.filter((v) => v.lang.toLowerCase().startsWith('es')).length} en español
                  </span>
                </div>
                <select
                  value={voiceSettings.voiceURI}
                  onChange={(e) => setVoiceSettings((prev) => ({ ...prev, voiceURI: e.target.value }))}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 transition cursor-pointer"
                >
                  {availableVoices.length === 0 && (
                    <option value="">Voz predeterminada del sistema</option>
                  )}
                  {availableVoices.map((v) => {
                    const isSpanish = v.lang.toLowerCase().startsWith('es');
                    const cleanName = v.name
                      .replace(/Microsoft /g, '')
                      .replace(/Google /g, '')
                      .replace(/Online \(Natural\)/g, 'Natural')
                      .replace(/ - Spanish \(.*?\)/g, '')
                      .trim();
                    return (
                      <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-slate-100">
                        {isSpanish ? '🇪🇸 ' : '🌐 '} {cleanName} ({v.lang})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Controles Deslizantes: Velocidad y Tono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Velocidad de Lectura</span>
                    <span className="text-cyan-300 font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      {voiceSettings.rate.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.85"
                    max="1.35"
                    step="0.05"
                    value={voiceSettings.rate}
                    onChange={(e) => setVoiceSettings((prev) => ({ ...prev, rate: parseFloat(e.target.value) }))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>0.85x (Pausado)</span>
                    <span>1.05x (Estándar)</span>
                    <span>1.35x (Rápido)</span>
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Tono / Timbre Vocal</span>
                    <span className="text-cyan-300 font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      {voiceSettings.pitch.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="1.25"
                    step="0.05"
                    value={voiceSettings.pitch}
                    onChange={(e) => setVoiceSettings((prev) => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>0.80 (Grave)</span>
                    <span>1.00 (Neutro)</span>
                    <span>1.25 (Agudo)</span>
                  </div>
                </div>
              </div>

              {/* Extensión de Lectura */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Extensión del Audio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoiceSettings((prev) => ({ ...prev, readMode: 'executive' }))}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      voiceSettings.readMode === 'executive'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Resumen Ejecutivo</span>
                      {voiceSettings.readMode === 'executive' && <span className="text-cyan-400 font-bold">✓</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      ~15-20 seg (primeros 480 caracteres). Ideal para consulta activa.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceSettings((prev) => ({ ...prev, readMode: 'full' }))}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      voiceSettings.readMode === 'full'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Lectura Completa</span>
                      {voiceSettings.readMode === 'full' && <span className="text-cyan-400 font-bold">✓</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      Lee el 100% de la respuesta, escalas e indicaciones sin cortes.
                    </p>
                  </button>
                </div>
              </div>

              {/* Acciones del Audio */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Probar voz</span>
                  </button>

                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={handleStopSpeaking}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-200 font-bold text-xs border border-red-500/40 transition active:scale-95 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Detener</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVoiceSettings(DEFAULT_VOICE_SETTINGS)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
                    title="Restablecer valores predeterminados"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowVoiceSettings(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
                  >
                    Listo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BANNER DE ALERTA: TRIAGE INTELIGENTE & RED FLAGS */}
          {redFlags.length > 0 && (
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-red-950/95 via-red-900/90 to-red-950/95 border-b border-red-500/50 flex items-start gap-2.5 text-xs text-red-100 shrink-0 shadow-md">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-red-200 flex items-center justify-between">
                  <span className="tracking-wide">TRIAGE INTELIGENTE • RED FLAGS CLÍNICAS ({redFlags.length})</span>
                  <span className="text-[10px] bg-red-500/30 text-red-200 px-1.5 py-0.5 rounded border border-red-500/40 uppercase font-mono font-bold">
                    Alerta Clínica
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5 list-disc list-inside text-[11px] text-red-100 font-medium">
                  {redFlags.map((flag, idx) => (
                    <li key={idx} className="truncate">{flag}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* BANNER DE CONTEXTO DEL PACIENTE ACTIVO */}
          {activePatient && activePatient.fullName && (
            <div className="px-3.5 py-2 bg-slate-900/90 border-b border-cyan-500/15 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 truncate">
                <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400 shrink-0">Paciente en foco:</span>
                <span className="font-semibold text-cyan-200 truncate">{activePatient.fullName}</span>
                {activePatient.idNumber && (
                  <span className="text-slate-400 font-mono text-[11px] truncate">({activePatient.idNumber})</span>
                )}
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-300 shrink-0 ml-2">
                <input
                  type="checkbox"
                  checked={includePatientContext}
                  onChange={(e) => setIncludePatientContext(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                />
                <span className={includePatientContext ? 'text-cyan-300 font-medium' : 'text-slate-500'}>
                  {includePatientContext ? 'Contexto Activo' : 'Sin Contexto'}
                </span>
              </label>
            </div>
          )}

          {/* GOOGLE MATERIAL 3 ASSIST CHIPS (SUGGESTION CAROUSEL) */}
          <div className="px-3 py-2 bg-[#091122]/90 border-b border-cyan-500/15 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {quickPrompts.map((qp, idx) => {
              const IconComp = qp.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(qp.query)}
                  disabled={isThinking}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 hover:bg-cyan-950/90 text-cyan-200 hover:text-cyan-100 border border-cyan-500/25 hover:border-cyan-400/50 whitespace-nowrap transition-all active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <IconComp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{qp.label}</span>
                </button>
              );
            })}
          </div>

          {/* ÁREA DE MENSAJES CON SCROLL (GOOGLE ASSISTANT CONVERSATION) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const hasAutofill = Boolean(msg.autofillPayload);
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 flex items-center justify-center shrink-0 shadow-md text-white font-extrabold text-xs border border-cyan-300/40">
                      Dr
                    </div>
                  ) : (
                    <SamiAvatar size="sm" isThinking={false} isOnline={true} showHalo={false} />
                  )}

                  {/* Burbuja de Mensaje (M3 Surface) */}
                  <div
                    className={`max-w-[85%] rounded-[1.5rem] p-4 shadow-lg transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-sky-600/30 via-cyan-600/25 to-blue-600/30 border border-cyan-400/35 text-cyan-50 rounded-tr-sm shadow-[0_4px_20px_rgba(6,182,212,0.15)]'
                        : msg.isError
                        ? 'bg-red-950/40 border border-red-500/40 text-red-200 rounded-tl-sm'
                        : 'bg-slate-900/90 border border-cyan-500/20 text-slate-100 rounded-tl-sm shadow-[0_4px_25px_rgba(0,0,0,0.35)]'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{msg.text}</p>
                    ) : (
                      <div className="space-y-1">{renderFormattedMarkdown(msg.text)}</div>
                    )}

                    {/* Botón de Autocompletado si el mensaje generó contenido aplicable */}
                    {!isUser && hasAutofill && (
                      <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleApplyAutofill(msg.autofillPayload, msg.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
                        >
                          {appliedAutofillId === msg.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">¡Cargado en Documento!</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>Aplicar a la Papelería Oficial</span>
                              <ArrowRight className="w-3 h-3 text-cyan-400" />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Barra de utilidades del mensaje (Copiar, Escuchar, Hora, Modelo) */}
                    <div
                      className={`flex items-center justify-between mt-2.5 pt-1.5 border-t text-[10px] ${
                        isUser ? 'border-cyan-400/20 text-cyan-100/70' : 'border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-1 font-mono">
                        {msg.modelUsed && <span className="text-cyan-400 font-medium">{msg.modelUsed}</span>}
                        {msg.modelUsed && <span>•</span>}
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>

                      {!isUser && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => speakText(msg.text)}
                            className="flex items-center gap-1 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/80 cursor-pointer"
                            title="Escuchar respuesta de SAMI en voz alta"
                          >
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            <span>Escuchar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.text, msg.id)}
                            className="flex items-center gap-1 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/80 cursor-pointer"
                            title="Copiar respuesta al portapapeles"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Animación de Pensamiento (Gemini Thinking Indicator) */}
            {isThinking && (
              <div className="flex gap-3 items-start animate-fade-in">
                <SamiAvatar size="sm" isThinking={true} isOnline={true} showHalo={false} />
                <div className="bg-slate-900/90 border border-cyan-500/30 rounded-[1.5rem] rounded-tl-sm p-3.5 shadow-lg flex items-center justify-between gap-3 text-cyan-300 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="font-medium text-slate-300">SAMI analizando conocimiento neuroquirúrgico...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsThinking(false);
                      const fallbackMsg: SamiChatMessage = {
                        id: `model-${Date.now()}`,
                        role: 'model',
                        text: '¡Hola Dr. Samir! Aquí estoy. ¿En qué caso clínico, escala o prescripción desea que nos concentremos hoy?',
                        timestamp: new Date().toISOString(),
                        modelUsed: 'SAMI-Respuesta-Inmediata',
                      };
                      setMessages((prev) => [...prev, fallbackMsg]);
                      speakText(fallbackMsg.text);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-cyan-900/60 text-slate-400 hover:text-cyan-300 border border-slate-700 transition cursor-pointer"
                    title="Detener espera y ver respuesta orientativa"
                  >
                    Responder ya
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================= */}
          {/* 3. GOOGLE GEMINI PILL INPUT BAR                           */}
          {/* ========================================================= */}
          <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-cyan-500/20 shrink-0">
            {/* Banner de dictado por voz */}
            {isListening && (
              <div className="mb-2 px-3 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-between text-xs animate-pulse text-cyan-200 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span className="font-semibold text-cyan-100 truncate">
                    {inputQuery.trim() ? `"${inputQuery}"` : 'Escuchando su voz... Hable con tranquilidad'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleManualToggleDictation}
                  className="px-2.5 py-0.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] shadow transition active:scale-95 cursor-pointer shrink-0"
                >
                  Enviar
                </button>
              </div>
            )}

            {/* Pill Container (Gemini Style) */}
            <div className="relative flex items-end gap-2 bg-slate-950/90 border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.25)] rounded-2xl sm:rounded-full p-2 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregúntale a SAMI (ej: receta de pregabalina, orden de laboratorios, escala Nurick)..."
                rows={1}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-28 py-1.5 px-2 leading-relaxed"
                style={{ minHeight: '36px' }}
              />

              {/* Botón de Dictado por Voz */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleManualToggleDictation}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_12px_#ef4444]'
                      : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80'
                  }`}
                  title={isListening ? 'Detener y enviar a SAMI' : 'Dictar por voz a SAMI'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {/* Botón de Enviar (Gemini Circular Send) */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isThinking}
                className="p-2 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                title="Enviar mensaje a SAMI (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer Médico de Seguridad */}
            <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline shrink-0" />
              <span>SAMI Copilot Clínico • Asistencia Orientativa CCMI • Dr. Samir Moucharrafie</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};
