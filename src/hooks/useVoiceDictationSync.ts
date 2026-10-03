/**
 * useVoiceDictationSync.ts
 * 
 * PILAR 3: DESCOMPOSICIÓN DEL MONOLITO - HOOK DE DICTADO Y VOZ CON GEMINI
 * =======================================================================
 * Aísla la transcripción, reconocimiento de voz y mapeo semántico estructurado.
 * Garantiza que si la voz parpadea o falla la red, el resto del workspace 
 * permanezca 100% interactivo y funcional.
 */

import { useState, useCallback, useRef } from 'react';
import { DocType } from '../types';

export interface DictationParseResult {
  rawTranscript: string;
  patientData?: {
    fullName?: string;
    nationalId?: string;
    age?: string;
    phone?: string;
  };
  clinicalData?: {
    diagnosisPrincipal?: string;
    medications?: Array<{
      drug: string;
      dose?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
    }>;
    generalIndications?: string[];
    clinicalReport?: string;
    restDays?: number;
    restFrom?: string;
    restTo?: string;
    consultReason?: string;
    currentIllness?: string;
  };
}

export function useVoiceDictationSync() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const startListening = useCallback((onInterimResult?: (text: string) => void) => {
    setLastError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setLastError('El reconocimiento de voz en tiempo real no está disponible en este navegador.');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-VE';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript.trim());
        if (onInterimResult) {
          onInterimResult(currentTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[useVoiceDictationSync] Error de voz:', event.error);
        if (event.error !== 'no-speech') {
          setLastError(`Error de reconocimiento: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      setLastError(err?.message || 'Error al iniciar reconocimiento');
      setIsListening(false);
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setLastError(null);
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    lastError,
    startListening,
    stopListening,
    clearTranscript,
    setIsProcessing,
    setTranscript,
  };
}
