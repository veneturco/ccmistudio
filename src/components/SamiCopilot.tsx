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
    name: 'Ãƒ…‚‚ƒ‚‚í MÃƒÆ’Ã‚dico Sobrio',
    desc: 'Cadencia sosegada y tono grave profesional',
    rate: 0.98,
    pitch: 0.92,
    readMode: 'executive' as const,
  },
  {
    id: 'dinamico',
    name: 'Ãƒ…‚í Ejecutivo ÃƒÆ’Ã‚Ágil',
    desc: 'Mayor velocidad para consultas de alta demanda',
    rate: 1.15,
    pitch: 1.0,
    readMode: 'executive' as const,
  },
  {
    id: 'exhaustivo',
    name: 'Ãƒ…‚‚í Lectura Exhaustiva',
    desc: 'Velocidad estÃƒÆ’Ã‚óndar y lectura completa del informe',
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

  // Guardar configuraciÃƒÆ’Ã‚ón de audio en almacenamiento local
  useEffect(() => {
    try {
      localStorage.setItem('ccmi_sami_voice_settings_v1', JSON.stringify(voiceSettings));
    } catch {}
  }, [voiceSettings]);

  // Cargar y ordenar voces del sistema (con auto-selecciÃƒÆ’Ã‚ón preferente en espaÃƒÆ’Ã‚ol)
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
        // Auto-seleccionar la mejor voz disponible en espaÃƒÆ’Ã‚ol
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

  // FunciÃƒÆ’Ã‚ón de sÃƒÆ’Ã‚óntesis de voz personalizable con parÃƒÆ’Ã‚metros mÃƒÆ’Ã‚dicos avanzados
  const speakText = (text: string, force = false) => {
    if ((!isVoiceOutputEnabled || !voiceSettings.autoPlay) && !force) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();

      // Limpiar formato markdown para lectura oral mÃƒÆ’Ã‚dica fluida
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
    speakText('Dr. Samir, el sistema de asistencia neuroquirÃƒÆ’Ã‚rgica SAMI estÃƒÆ’Ã‚í configurado con este timbre y cadencia.', true);
  };

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Referencias para auto-envÃƒÆ’Ã‚o por voz
  const voiceTimeoutRef = useRef<any>(null);
  const voiceTranscriptRef = useRef<string>('');

  // Hook de dictado clÃƒÆ’Ã‚ónico por voz en espaÃƒÆ’Ã‚ol con auto-envÃƒÆ’Ã‚o inteligente
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

  // Escuchar eventos globales para abrir SAMI (ej: saludos en el dock inferior)
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

  // Triage Inteligente: DetecciÃƒÆ’Ã‚ón proactiva de banderas rojas clÃƒÆ’Ã‚ónicas (Diabetes, HTA, Alergias, CardiopatÃƒÆ’Ã‚as)
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
      flags.push('Diabetes Mellitus (Riesgo metabÃƒÆ’Ã‚lico / CicatrizaciÃƒÆ’Ã‚ón e InfecciÃƒÆ’Ã‚ón quirÃƒÆ’Ã‚rgica)');
    }
    if (
      historyText.includes('hta') ||
      historyText.includes('hipertens') ||
      historyText.includes('hipertension') ||
      historyText.includes('presion alta') ||
      historyText.includes('presiÃƒÆ’Ã‚ón alta')
    ) {
      flags.push('HipertensiÃƒÆ’Ã‚ón Arterial (HTA) (Riesgo cardiovascular / Control hemodinÃƒÆ’Ã‚mico)');
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
      flags.push('CardiopatÃƒÆ’Ã‚a / Riesgo cardiovascular mayor');
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
        text: `Hola, soy **SAMI** (Synapsis Advanced Medical Intelligence), tu copiloto clÃƒÆ’Ã‚ónico y guÃƒÆ’Ã‚a de operaciones de **CORTEX AXIS** en el CCMI.\n\nPuedes consultarme sobre:\n* Ãƒ…‚‚í **Escalas neuroquirÃƒÆ’Ã‚rgicas** (Nurick, mJOA, ASIA, VAS/EVA, Glasgow).\n* Ãƒ…‚„…í **Esquemas farmacolÃƒÆ’Ã‚gicos** y posologÃƒÆ’Ã‚a en patologÃƒÆ’Ã‚a raquimedular.\n* Ãƒ…‚“‚í **TÃƒÆ’Ã‚cnicas quirÃƒÆ’Ã‚rgicas y protocolos** de columna.\n* Ãƒ…‚“‚í **GuÃƒÆ’Ã‚a de uso** de los 5 documentos oficiales, secretarÃƒÆ’Ã‚a y nube.\n\nÃƒâ€šÃ‚En quÃƒÆ’Ã‚í puedo ayudarte hoy?`,
        timestamp: new Date().toISOString(),
        modelUsed: 'SAMI-Core',
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
      const timeoutId = setTimeout(() => controller.abort(), 25000);

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
          console.warn('[SAMI Copilot] Servidor retornÃƒÆ’Ã‚í cÃƒÆ’Ã‚digo:', response.status);
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.warn('[SAMI Copilot] Red o timeout tras 25s, activando respuesta segura inmediata:', fetchErr);
      }

      // Si el servidor respondiÃƒÆ’Ã‚í o si aplicamos respuesta clÃƒÆ’Ã‚ónica estructurada
      let replyText = data?.reply;
      let usedModel = data?.usedModel || 'Gemini 3.1 Flash';

      if (!replyText) {
        // Red de seguridad local del cliente ante desconexiÃƒÆ’Ã‚ón o demora
        const q = textToSend.toLowerCase();
        
        // AGENTE AUTÃƒÆ’‚“NOMO: DETECCIÃƒÆ’‚“N DE COMANDOS DE AUTOCOMPLETADO
        if (q.startsWith('recetar') || q.startsWith('receta:') || q.startsWith('indicar')) {
           const medicamento = textToSend.replace(/receta:|recetar|indicar/i, '').trim();
           // Disparamos el evento al workspace
           window.dispatchEvent(new CustomEvent('sami-autofill', { 
             detail: { 
               type: 'RECETA', 
               rxLeft: medicamento, 
               indicationsRight: '1. Tomar cada 12 horas.\n2. Mantener reposo relativo.' 
             } 
           }));
           replyText = `Ãƒâ€šÃ‚Listo Dr. Samir! He rellenado automÃƒÆ’Ã‚ticamente la pestaÃƒÆ’Ã‚a de rÃƒÆ’Ã‚cipe con: **${medicamento}**.\n\nVerifique los datos en el documento antes de emitir el PDF.`;
           usedModel = 'SAMI-AutoFill-Agent';
        } else if (q.includes('hola') || q.includes('saludos') || q.includes('buenos') || q.includes('buenas') || q === 'sami') {
          replyText = `Ãƒâ€šÃ‚Hola Dr. Samir! Es un gusto saludarle. Estoy conectado y listo para asistirle en la Unidad Cerebro Columna MÃƒÆ’Ã‚ónimamente Invasiva (CCMI).\n\nÃƒâ€šÃ‚En quÃƒÆ’Ã‚í paciente o caso clÃƒÆ’Ã‚ónico nos enfocamos hoy? Puede consultarme sobre:\n* Ãƒ…‚‚í **Escalas neuroquirÃƒÆ’Ã‚rgicas** (Nurick, mJOA, ASIA, VAS).\n* Ãƒ…‚„…í **PosologÃƒÆ’Ã‚a y fÃƒÆ’Ã‚rmacos** de columna.\n* Ãƒ…‚“‚í **TÃƒÆ’Ã‚cnicas quirÃƒÆ’Ã‚rgicas** (TLIF, artrodesis, descompresiÃƒÆ’Ã‚ón).\n* Ãƒ…‚“‚í **EmisiÃƒÆ’Ã‚ón de rÃƒÆ’Ã‚cipes e informes**.`;
        } else if (q.includes('nurick') || q.includes('mjoa') || q.includes('mielopat')) {
          replyText = `### Ãƒ…‚‚í Escalas Nurick & mJOA (MielopatÃƒÆ’Ã‚a Cervical)\n\n* **Nurick 0-1:** AsintomÃƒÆ’Ã‚tico o sin alteraciÃƒÆ’Ã‚ón de marcha.\n* **Nurick 2-3:** Dificultad para deambular pero autÃƒÆ’Ã‚ónomo.\n* **Nurick 4-5:** Requiere apoyo de terceros o silla de ruedas.\n* **mJOA (0-17):** Leve (15-17), Moderada (12-14), Severa (<12).\n\nÃƒ…‚í **Conducta CCMI:** mJOA Ãƒ‚‚í 14 con compresiÃƒÆ’Ã‚ón medular en RMN amerita descompresiÃƒÆ’Ã‚ón quirÃƒÆ’Ã‚rgica oportuna.`;
        } else if (q.includes('pregabalina') || q.includes('posologia') || q.includes('farmaco') || q.includes('dolor')) {
          replyText = `### Ãƒ…‚„…í Esquema AnalgÃƒÆ’Ã‚sico y PosologÃƒÆ’Ã‚a en Crisis Radicular\n\n1. **Pregabalina:** 75 mg VO cada 12 h (o nocturno si hay somnolencia) por 14-21 dÃƒÆ’Ã‚as.\n2. **Ketoprofeno:** 100 mg VO cada 12 h por 5 dÃƒÆ’Ã‚as con protector gÃƒÆ’Ã‚strico.\n3. **TiocolchicÃƒÆ’Ã‚sido:** 4 mg VO cada 12 h por 5 dÃƒÆ’Ã‚as en contractura muscular severa.\n\n*Nota:* Indicar reposo relativo en posiciÃƒÆ’Ã‚ón semi-fowler y evitar flexiÃƒÆ’Ã‚ón de tronco.`;
        } else {
          replyText = `### Ãƒ…‚‚í SAMI Copilot (Modo Resiliente CCMI)\n\nDr. Samir, he recibido su consulta: **"${textToSend}"**.\n\n* Quedo a su disposiciÃƒÆ’Ã‚ón para desglosar escalas neuroquirÃƒÆ’Ã‚rgicas (Nurick, mJOA, ASIA, Glasgow), dosificaciÃƒÆ’Ã‚ón farmacolÃƒÆ’Ã‚gica o redacciÃƒÆ’Ã‚ón de los 5 documentos oficiales.\n* Si el caso presenta dÃƒÆ’Ã‚ficit motor rÃƒÆ’Ã‚pido o signos de cauda equina, priorice la evaluaciÃƒÆ’Ã‚ón imagenolÃƒÆ’Ã‚gica y descompresiÃƒÆ’Ã‚ón de urgencia.`;
        }
        usedModel = 'SAMI-Local-Resiliente';
      }

      const modelMessage: SamiChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toISOString(),
        modelUsed: usedModel,
      };

      setMessages((prev) => [...prev, modelMessage]);
      speakText(replyText);
    } catch (err: any) {
      const errorMessage: SamiChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        text: `Ãƒ…‚ƒ‚‚í **Aviso:** ${err.message || 'Error procesando respuesta.'}\nPuede seguir consultando escalas y protocolos esenciales normalmente.`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      speakText('Aviso de conexiÃƒÆ’Ã‚ón. Puedes consultar las escalas en modo local.');
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

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleClearHistory = () => {
    if (confirm('Ãƒâ€šÃ‚Deseas reiniciar la conversaciÃƒÆ’Ã‚ón con SAMI?')) {
      const initial: SamiChatMessage[] = [
        {
          id: 'welcome-new',
          role: 'model',
          text: `ConversaciÃƒÆ’Ã‚ón reiniciada. Estoy listo para asistirte en tus decisiones clÃƒÆ’Ã‚ónicas, posologÃƒÆ’Ã‚a o manejo del sistema CCMI.`,
          timestamp: new Date().toISOString(),
          modelUsed: 'SAMI-Core',
        },
      ];
      setMessages(initial);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const quickPrompts = [
    { label: 'Ãƒ…‚‚í Escala Nurick / mJOA', query: 'ExplÃƒÆ’Ã‚came las escalas de Nurick y mJOA para mielopatÃƒÆ’Ã‚a cervical y sus puntos de corte quirÃƒÆ’Ã‚rgico.' },
    { label: 'Ãƒ…‚í Escala ASIA', query: 'CuÃƒÆ’Ã‚les son los grados de la escala ASIA para lesiÃƒÆ’Ã‚ón medular y cÃƒÆ’Ã‚mo clasificar cada nivel?' },
    { label: 'Ãƒ…‚“Ã…í Escala VAS / EVA', query: 'CÃƒÆ’Ã‚mo clasificar la escala analÃƒÆ’Ã‚gica del dolor EVA/VAS y su esquema analgÃƒÆ’Ã‚sico sugerido?' },
    { label: 'Ãƒ…‚„…í PosologÃƒÆ’Ã‚a Columna', query: 'CuÃƒÆ’Ã‚l es la posologÃƒÆ’Ã‚a recomendada de Pregabalina, TiocolchicÃƒÆ’Ã‚sido y Ketoprofeno en crisis radicular aguda?' },
    { label: 'Ãƒ…‚“‚í Protocolo Artrodesis Lumbar', query: 'CuÃƒÆ’Ã‚les son los pasos e indicaciones clÃƒÆ’Ã‚ónicas para una artrodesis lumbar instrumentada TLIF L4-L5/L5-S1?' },
    { label: 'Ãƒ…‚“‚í Ãƒâ€šÃ‚CÃƒÆ’Ã‚mo emitir rÃƒÆ’Ã‚cipe doble?', query: 'ExplÃƒÆ’Ã‚came cÃƒÆ’Ã‚mo funciona el rÃƒÆ’Ã‚cipe oficial duplicado con talÃƒÆ’Ã‚ón farmacia e indicaciones al paciente en CCMI.' },
  ];

  // Render basic markdown with headers, bold, bullet points
  const renderFormattedMarkdown = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base font-bold text-cyan-300 mt-2 mb-1 flex items-center gap-1.5">
            <div className="w-4 h-4 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"><BrandLogo /></div>
            <span>{line.replace('### ', '')}</span>
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-lg font-bold text-cyan-200 mt-3 mb-1.5 border-b border-cyan-800/40 pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-xl font-black text-cyan-100 mt-3 mb-2">
            {line.replace('# ', '')}
          </h2>
        );
      }

      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 leading-relaxed text-sm my-0.5">
            {parseInlineFormatting(content)}
          </li>
        );
      }

      // Numbered lists
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 text-slate-200 text-sm my-1 pl-1">
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
        <p key={idx} className="text-sm text-slate-200 leading-relaxed my-0.5">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const parseInlineFormatting = (text: string) => {
    // Process **bold** and `code`
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
      {/* BOTÃƒÆ’‚“N FLOTANTE DISCRETO DE SAMI (Bottom Right) */}
      {!isOpen && (
                  <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="group relative rounded-full transition-all duration-300 transform hover:-translate-y-1 active:scale-95 text-left flex p-[1.5px] sami-capsule shadow-[0_8px_30px_rgba(6,182,212,0.25)] hover:shadow-[0_12px_40px_rgba(6,182,212,0.5)]"
              title="Abrir SAMI Copilot (Asistente ClÃƒónico Neuronal)"
            >
              {/* Animated Synaptic Border */}
              <div className="sami-synaptic-border rounded-full" />
  
              <div className="sami-capsule-inner flex items-center gap-2.5 p-2.5 sm:px-4 sm:py-2.5 w-full h-full rounded-full bg-slate-950/90">
                <div className="relative">
                  <SamiAvatar size="sm" isThinking={false} isOnline={true} showHalo={false} />
                  {/* Subtle pulsing dot indicating AI is active */}
                  <div className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
                  </div>
                </div>
                
                <div className="hidden sm:flex flex-col pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 tracking-wide drop-shadow-sm">SAMI</span>
                    <span className="px-1.5 py-[1px] bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-widest backdrop-blur-sm">
                      NEURO-LINK
                    </span>
                  </div>
                  <span className="text-[11px] text-cyan-100/60 font-medium flex items-center gap-1">
                    <div className="w-3 h-3 flex items-center justify-center opacity-70 [&>svg]:w-full [&>svg]:h-full"><BrandLogo /></div>
                    Asistente ClÃƒónico Inteligente
                  </span>
                </div>
              </div>
            </button>
          </div>
      )}

      {/* PANEL DESLIZANTE / DRAWER LATERAL DE SAMI */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col glass-card-2026 border border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.15)] ring-1 ring-white/5 overflow-hidden ${
            isExpanded
              ? 'inset-2 sm:inset-6 rounded-2xl border'
              : 'bottom-0 right-0 w-full sm:w-[460px] md:w-[500px] h-[92vh] sm:h-[680px] sm:max-h-[90vh] sm:bottom-4 sm:right-4 rounded-t-2xl sm:rounded-2xl border-t sm:border'
          }`}
        >
          {/* HEADER DEL COPILOT */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/70 to-slate-900 border-b border-cyan-500/20 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-3">
              <SamiAvatar size="md" isThinking={isThinking} isOnline={true} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-cyan-100 tracking-wide">SAMI Copilot</h3>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider border border-cyan-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                    Gemini AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Synapsis Medical Intelligence</span>
                  <span className="text-cyan-500">Ãƒ€š‚</span>
                  <span className="text-emerald-400 font-medium">ClÃƒÆ’Ã‚ónica CCMI</span>
                </p>
              </div>
            </div>

            {/* Acciones del Header */}
            <div className="flex items-center gap-1">
              {/* BotÃƒÆ’Ã‚ón de Ajustes de Voz y Lectura */}
              <button
                type="button"
                onClick={() => setShowVoiceSettings((prev) => !prev)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showVoiceSettings
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Ajustes de Voz y Lectura MÃƒÆ’Ã‚dica (Timbre, Tono, Velocidad)"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Activar/Silenciar Voz de SAMI */}
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
                className={`p-1.5 rounded-lg transition-colors ${
                  isVoiceOutputEnabled ? 'text-cyan-300 hover:bg-cyan-950/60' : 'text-slate-500 hover:bg-slate-800/60'
                }`}
                title={isVoiceOutputEnabled ? 'Voz de SAMI activa (SAMI te habla en voz alta) Ãƒ€š‚í Clic para silenciar' : 'Voz de SAMI silenciada Ãƒ€š‚í Clic para activar respuesta hablada'}
              >
                {isVoiceOutputEnabled ? (
                  <Volume2 className={`w-4 h-4 text-cyan-400 ${isSpeaking ? 'animate-bounce' : ''}`} />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                title="Reiniciar conversaciÃƒÆ’Ã‚ón"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                title={isExpanded ? 'Restaurar tamaÃƒÆ’Ã‚o normal' : 'Expandir ventana'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PANEL DESPLEGABLE DE AJUSTES DE VOZ Y LECTURA (SAMI AUDIO SETTINGS) */}
          {showVoiceSettings && (
            <div className="bg-[#0b1324]/98 border-b border-cyan-500/30 p-4 text-xs space-y-3.5 shrink-0 shadow-2xl backdrop-blur-2xl animate-fade-in ring-1 ring-cyan-500/20 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <div className="flex items-center gap-2 text-cyan-200 font-bold text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                  <span>ConfiguraciÃƒÆ’Ã‚ón de Voz y Lectura MÃƒÆ’Ã‚dica</span>
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
                    {availableVoices.filter((v) => v.lang.toLowerCase().startsWith('es')).length} en espaÃƒÆ’Ã‚ol
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
                        {isSpanish ? 'Ãƒ…‚‚ƒ…‚‚í ' : 'Ãƒ……â€™Ã‚í '} {cleanName} ({v.lang})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Controles Deslizantes (Sliding Controls): Velocidad y Tono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Velocidad de Habla */}
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
                    <span>1.05x (EstÃƒÆ’Ã‚óndar)</span>
                    <span>1.35x (RÃƒÆ’Ã‚pido)</span>
                  </div>
                </div>

                {/* Tono / Timbre */}
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

              {/* ExtensiÃƒÆ’Ã‚ón de Lectura */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  ExtensiÃƒÆ’Ã‚ón del Audio
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
                      {voiceSettings.readMode === 'executive' && <span className="text-cyan-400 font-bold">Ãƒ‚€‚</span>}
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
                      {voiceSettings.readMode === 'full' && <span className="text-cyan-400 font-bold">Ãƒ‚€‚</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      Lee el 100% de la respuesta, escalas e indicaciones sin cortes.
                    </p>
                  </button>
                </div>
              </div>

              {/* Barra de Acciones del Audio: Probar Voz / Detener / Restablecer */}
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

          {/* BANNER DE ALERTA ROJO: TRIAGE INTELIGENTE & RED FLAGS */}
          {redFlags.length > 0 && (
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-red-950/95 via-red-900/90 to-red-950/95 border-b border-red-500/50 flex items-start gap-2.5 text-xs text-red-100 shrink-0 shadow-md animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-red-200 flex items-center justify-between">
                  <span className="tracking-wide">TRIAGE INTELIGENTE Ãƒ€š‚í RED FLAGS CLÃƒÆ’Ã‚NICAS ({redFlags.length})</span>
                  <span className="text-[10px] bg-red-500/30 text-red-200 px-1.5 py-0.5 rounded border border-red-500/40 uppercase font-mono font-bold">
                    Alerta ClÃƒÆ’Ã‚ónica
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5 list-disc list-inside text-[11px] text-red-100 font-medium">
                  {redFlags.map((flag, idx) => (
                    <li key={idx} className="truncate">{flag}</li>
                  ))}
                </ul>
                <p className="text-[10px] text-red-300/80 mt-1 italic">
                  Aviso de seguridad para el mÃƒÆ’Ã‚dico tratante: verifique ajuste metabÃƒÆ’Ã‚lico y estabilidad hemodinÃƒÆ’Ã‚mica.
                </p>
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

          {/* ATAJOS RÃƒÆ’Ã‚PIDOS CLÃƒÆ’Ã‚NICOS HORIZONTALES */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp.query)}
                disabled={isThinking}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/90 hover:bg-cyan-950/80 text-cyan-200 hover:text-cyan-100 border border-cyan-900/50 hover:border-cyan-500/50 whitespace-nowrap transition-all active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* ÃƒÆ’Ã‚REA DE MENSAJES CON SCROLL */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shrink-0 shadow-md text-white font-bold text-xs border border-cyan-400/40">
                      Dr
                    </div>
                  ) : (
                    <SamiAvatar size="sm" isThinking={false} isOnline={true} showHalo={false} />
                  )}

                  {/* Burbuja de Mensaje */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-md ${
                      isUser
                        ? 'bg-gradient-to-br from-blue-600/90 to-cyan-600/90 text-white rounded-tr-none border border-cyan-400/30'
                        : msg.isError
                        ? 'bg-red-950/40 border border-red-500/40 text-red-200 rounded-tl-none'
                        : 'bg-slate-900/90 border border-cyan-500/20 text-slate-100 rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      <div className="space-y-1">{renderFormattedMarkdown(msg.text)}</div>
                    )}

                    {/* Barra de utilidades del mensaje (Copiar, Modelo, Hora) */}
                    <div
                      className={`flex items-center justify-between mt-2 pt-1.5 border-t text-[10px] ${
                        isUser ? 'border-cyan-400/20 text-cyan-100/70' : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-1 font-mono">
                        {msg.modelUsed && <span className="text-cyan-400">{msg.modelUsed}</span>}
                        {msg.modelUsed && <span>Ãƒ€š‚</span>}
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>

                      {!isUser && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => speakText(msg.text)}
                            className="flex items-center gap-1 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/80"
                            title="Escuchar respuesta de SAMI en voz alta"
                          >
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            <span>Escuchar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.text, msg.id)}
                            className="flex items-center gap-1 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/80"
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

            {/* AnimaciÃƒÆ’Ã‚ón de Pensamiento (Thinking Indicator) */}
            {isThinking && (
              <div className="flex gap-3 items-start animate-fade-in">
                <SamiAvatar size="sm" isThinking={true} isOnline={true} showHalo={false} />
                <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl rounded-tl-none p-3.5 shadow-lg flex items-center justify-between gap-3 text-cyan-300 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="font-medium text-slate-300">SAMI analizando conocimiento neuroquirÃƒÆ’Ã‚rgico...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsThinking(false);
                      const fallbackMsg: SamiChatMessage = {
                        id: `model-${Date.now()}`,
                        role: 'model',
                        text: `Ãƒâ€šÃ‚Hola Dr. Samir! AquÃƒÆ’Ã‚í estoy. Ãƒâ€šÃ‚En quÃƒÆ’Ã‚í caso clÃƒÆ’Ã‚ónico, escala o prescripciÃƒÆ’Ã‚ón desea que nos concentremos hoy?`,
                        timestamp: new Date().toISOString(),
                        modelUsed: 'SAMI-Respuesta-Inmediata',
                      };
                      setMessages((prev) => [...prev, fallbackMsg]);
                      speakText(fallbackMsg.text);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-cyan-900/60 text-slate-400 hover:text-cyan-300 border border-slate-700 transition"
                    title="Detener espera y ver respuesta orientativa"
                  >
                    Responder ya
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BARRA DE CONSULTA CON DICTADO */}
          <div className="p-3 bg-slate-900/95 border-t border-cyan-500/20 rounded-b-2xl shrink-0">
            {/* Banner de estado de dictado por voz */}
            {isListening && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-between text-xs animate-pulse text-cyan-200 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span className="font-semibold text-cyan-100">
                    {inputQuery.trim() ? `"${inputQuery}"` : 'Escuchando su voz... Hable con tranquilidad'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleManualToggleDictation}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] shadow transition active:scale-95"
                >
                  Enviar ahora
                </button>
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-slate-950/90 border border-cyan-500/30 focus-within:border-cyan-400 rounded-xl p-2 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="PregÃƒÆ’Ã‚óntale a SAMI (ej: posologÃƒÆ’Ã‚a pregabalina, escala Nurick, tÃƒÆ’Ã‚cnica TLIF)..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-28 py-1.5 px-1 leading-relaxed"
                style={{ minHeight: '36px' }}
              />

              {/* BotÃƒÆ’Ã‚ón de Dictado por Voz */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleManualToggleDictation}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_12px_#ef4444]'
                      : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                  }`}
                  title={isListening ? 'Detener y enviar a SAMI' : 'Dictar por voz a SAMI'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {/* BotÃƒÆ’Ã‚ón de Enviar */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isThinking}
                className="p-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md active:scale-95 shrink-0"
                title="Enviar mensaje a SAMI (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer MÃƒÆ’Ã‚dico de Seguridad */}
            <p className="text-[10px] text-slate-400 text-center mt-1.5 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400 inline" />
              <span>SAMI es un copiloto clÃƒÆ’Ã‚ónico asistencial orientativo para el mÃƒÆ’Ã‚dico tratante del CCMI.</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};
