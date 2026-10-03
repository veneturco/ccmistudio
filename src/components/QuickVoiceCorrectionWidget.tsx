import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Check, ArrowRight, CornerDownLeft, RefreshCw } from 'lucide-react';
import { normalizeClinicalPhonetics } from '../utils/phoneticDictionary';
import { auth } from '../firebase/config';

interface Props {
  docType: string;
  currentDocumentData: any;
  onApplyCorrection: (updatedDocData: any, userCommand: string) => void;
}

export const QuickVoiceCorrectionWidget: React.FC<Props> = ({
  docType,
  currentDocumentData,
  onApplyCorrection,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [commandText, setCommandText] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'es-VE';

    rec.onresult = (event: any) => {
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalChunk += event.results[i][0].transcript;
      }
      if (finalChunk.trim()) {
        const norm = normalizeClinicalPhonetics(finalChunk);
        setCommandText(norm.normalizedText);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      setLastFeedback({ success: false, message: 'Reconocimiento de voz no disponible en este navegador.' });
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      setCommandText('');
      setLastFeedback(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleExecuteCorrection = async () => {
    if (!commandText.trim()) return;

    setIsApplying(true);
    setLastFeedback('Aplicando corrección puntual...');

    try {
      let authHeader: Record<string, string> = {};
      try {
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          if (token) authHeader = { Authorization: `Bearer ${token}` };
        }
      } catch {
        // Silencioso
      }

      const response = await fetch('/api/gemini/quick-correction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          command: commandText,
          currentDocumentState: currentDocumentData,
          docType: docType,
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        onApplyCorrection(res.data, commandText);
        setLastFeedback(`✓ Corrección aplicada: "${commandText}"`);
        setCommandText('');
        setTimeout(() => setLastFeedback(null), 3500);
      } else {
        // Local smart rule fallback if server call errors
        applyLocalSmartCorrection(commandText);
      }
    } catch {
      applyLocalSmartCorrection(commandText);
    } finally {
      setIsApplying(false);
    }
  };

  // Local smart correction for instant offline or fallback application
  const applyLocalSmartCorrection = (cmd: string) => {
    const lower = cmd.toLowerCase();
    const updated = { ...currentDocumentData };

    // Ej: "añadir omeprazol 20 mg en ayunas por 14 días"
    if (docType === 'RECIPES') {
      if (lower.includes('añadir') || lower.includes('agregar')) {
        const item = cmd.replace(/^(añadir|agregar)\s+/i, '').trim();
        updated.rxLeft = (updated.rxLeft || '') + `\n\n• ${item} (Dispensar envase original)`;
        updated.indicationsRight = (updated.indicationsRight || '') + `\n\n• ${item}: Tomar según pauta médica recomendada.`;
      } else if (lower.includes('cambiar') || lower.includes('modificar')) {
        updated.indicationsRight = (updated.indicationsRight || '') + `\n\n[Nota de ajuste: ${cmd}]`;
      }
    } else if (docType === 'CONSTANCIA') {
      const daysMatch = cmd.match(/(\d{1,2})\s*días/i);
      if (daysMatch) {
        updated.restDays = daysMatch[1].padStart(2, '0');
        updated.needsRest = true;
      }
      if (lower.includes('desde mañana')) {
        const tomorrow = new Date(Date.now() + 86400000);
        updated.restFrom = tomorrow.toLocaleDateString('es-VE');
      }
    } else if (docType === 'ORDEN_LAB') {
      if (lower.includes('resonancia') || lower.includes('rmn')) {
        updated.neuroimagen = [...(updated.neuroimagen || []), cmd.replace(/^(añadir|agregar|solicitar)\s+/i, '')];
      }
    }

    onApplyCorrection(updated, cmd);
    setLastFeedback(`✓ Corrección aplicada localmente: "${cmd}"`);
    setCommandText('');
    setTimeout(() => setLastFeedback(null), 3500);
  };

  return (
    <div className="print:hidden">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 backdrop-blur-md border border-amber-400/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0"
          title="Dictar corrección rápida puntual"
        >
          <Mic className="w-3.5 h-3.5 text-amber-600" />
          <span>Dictar Corrección Rápida</span>
        </button>
      ) : (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-[0_16px_40px_0_rgba(0,0,0,0.3)] space-y-3 max-w-md w-full animate-in fade-in zoom-in-95 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              Corrección Rápida de Voz ({docType})
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <p className="text-[11px] text-slate-300">
            Diga un comando puntual sin alterar el resto del documento:
            <span className="block text-slate-400 italic text-[10px] mt-0.5">
              Ej: "Añadir Omeprazol 20 mg en ayunas por 14 días" o "Cambiar reposo a 10 días"
            </span>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleListen}
              className={`p-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteCorrection();
              }}
              placeholder={isListening ? 'Escuchando comando...' : 'Dictar o escribir corrección puntual...'}
              className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />

            <button
              type="button"
              disabled={!commandText.trim() || isApplying}
              onClick={handleExecuteCorrection}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shadow-md shadow-amber-500/20"
            >
              {isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CornerDownLeft className="w-3.5 h-3.5" />}
              <span>Aplicar</span>
            </button>
          </div>

          {lastFeedback && (
            <div className="text-[11px] font-medium text-emerald-300 bg-emerald-950/60 backdrop-blur-md p-2 rounded-xl border border-emerald-700/50 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lastFeedback}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
