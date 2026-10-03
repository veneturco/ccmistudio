import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseClinicalDictationOptions {
  onResult?: (text: string) => void;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface UseClinicalDictationReturn {
  isListening: boolean;
  toggleDictation: () => void;
  startDictation: () => void;
  stopDictation: () => void;
  isSupported: boolean;
}

/**
 * Hook de React para dictado clínico por voz usando Web Speech API.
 * Cuenta con resiliencia y auto-reconexión automática ante pausas silenciosas de audio.
 * 
 * @param onResultOrOptions Callback invocado con cada fragmento de texto reconocido o configuración.
 * @returns Objeto con estado { isListening, toggleDictation, startDictation, stopDictation, isSupported }
 */
export function useClinicalDictation(
  onResultOrOptions?: ((text: string) => void) | UseClinicalDictationOptions
): UseClinicalDictationReturn {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);
  const restartTimerRef = useRef<any>(null);

  const onResultCallback = typeof onResultOrOptions === 'function'
    ? onResultOrOptions
    : onResultOrOptions?.onResult;

  const continuous = typeof onResultOrOptions === 'object' && onResultOrOptions?.continuous !== undefined
    ? onResultOrOptions.continuous
    : true;
  const interimResults = typeof onResultOrOptions === 'object' && onResultOrOptions?.interimResults !== undefined
    ? onResultOrOptions.interimResults
    : false;

  const onResultRef = useRef(onResultCallback);
  useEffect(() => {
    onResultRef.current = onResultCallback;
  }, [onResultCallback]);

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = continuous;
      rec.interimResults = interimResults;
      rec.lang = 'es-ES';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim() && onResultRef.current) {
          onResultRef.current(transcript.trim());
        }
      };

      rec.onerror = (event: any) => {
        const errorCode = event?.error;
        console.warn('[useClinicalDictation] Evento de audio o advertencia en dictado:', errorCode || event);

        // Errores no fatales (silencio o pausa médica) no deben cancelar la sesión activa
        if (errorCode === 'no-speech') {
          return;
        }

        // Errores de permiso o servicio denegado: detener de forma definitiva
        if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
          shouldListenRef.current = false;
          setIsListening(false);
          clearRestartTimer();
        }
      };

      rec.onend = () => {
        // Si el usuario sigue en modo dictado activo, reanudar automáticamente
        if (shouldListenRef.current) {
          clearRestartTimer();
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err: any) {
                if (err?.name !== 'InvalidStateError') {
                  console.warn('[useClinicalDictation] Error en reintento automático:', err);
                }
              }
            }
          }, 200);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
    } else {
      setIsSupported(false);
    }

    return () => {
      shouldListenRef.current = false;
      clearRestartTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [continuous, interimResults]);

  const startDictation = useCallback(() => {
    clearRestartTimer();
    shouldListenRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = 'es-ES';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        if (err?.name !== 'InvalidStateError') {
          console.warn('[useClinicalDictation] Fallo al iniciar dictado:', err);
        } else {
          setIsListening(true);
        }
      }
    }
  }, []);

  const stopDictation = useCallback(() => {
    shouldListenRef.current = false;
    clearRestartTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('[useClinicalDictation] Fallo al detener dictado:', err);
      }
    }
    setIsListening(false);
  }, []);

  const toggleDictation = useCallback(() => {
    if (isListening || shouldListenRef.current) {
      stopDictation();
    } else {
      startDictation();
    }
  }, [isListening, startDictation, stopDictation]);

  return {
    isListening,
    toggleDictation,
    startDictation,
    stopDictation,
    isSupported,
  };
}

export default useClinicalDictation;
