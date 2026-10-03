import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Stamp, 
  UploadCloud, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  RotateCcw, 
  Download, 
  Eye, 
  Trash2, 
  ShieldCheck,
  FileCheck2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStampSaved?: (stampDataUrl: string) => void;
}

export const StampSignatureStudioModal: React.FC<Props> = ({ isOpen, onClose, onStampSaved }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('socs_custom_doctor_stamp_png') : null;
  });
  const [threshold, setThreshold] = useState<number>(200); // 0 - 255
  const [inkBoost, setInkBoost] = useState<number>(1.2);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (originalImage) {
      processImage();
    }
  }, [originalImage, threshold, inkBoost]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = () => {
    if (!originalImage) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImage;
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Mantener resolución nítida
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Algoritmo de Extracción de Tinta con Fondo Transparente
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Brillo y luminancia del pixel
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        if (brightness > threshold) {
          // Fondo de papel blanco/gris: Hacer 100% transparente
          data[i + 3] = 0;
        } else {
          // Tinta (azul, negra, violeta): Suavizado de bordes anti-aliasing
          const alpha = Math.min(255, Math.max(0, Math.round(((threshold - brightness) / threshold) * 255 * 1.5)));
          data[i + 3] = alpha;

          // Realce de color y saturación de tinta
          data[i] = Math.max(0, Math.min(255, r * (1 / inkBoost)));
          data[i + 1] = Math.max(0, Math.min(255, g * (1 / inkBoost)));
          data[i + 2] = Math.max(0, Math.min(255, b * inkBoost));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const transparentDataUrl = canvas.toDataURL('image/png');
      setProcessedImage(transparentDataUrl);
      setIsProcessing(false);
    };
  };

  const handleSaveStamp = () => {
    if (!processedImage) return;

    try {
      localStorage.setItem('socs_custom_doctor_stamp_png', processedImage);
      if (onStampSaved) {
        onStampSaved(processedImage);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Error guardando sello:', err);
    }
  };

  const handleClearStamp = () => {
    const confirm = window.confirm('¿Desea eliminar el sello/firma personalizado y volver al sello vectorial oficial?');
    if (!confirm) return;

    localStorage.removeItem('socs_custom_doctor_stamp_png');
    setProcessedImage(null);
    setOriginalImage(null);
    if (onStampSaved) {
      onStampSaved('');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0b1528] border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden ring-1 ring-cyan-500/20 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-[#070e1d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/30 text-cyan-300">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Extractor Inteligente de Sello y Firma
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  PNG Transparente
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Toma una foto a tu sello o firma sobre papel y remueve el fondo automáticamente
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

        {/* Notificación de Éxito */}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Sello y firma transparentes guardados y aplicados a todos los documentos!</span>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Zona de Carga de Foto */}
          {!originalImage && !processedImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-3xl bg-[#0e1b33]/60 hover:bg-[#0e1b33] text-center cursor-pointer transition space-y-3 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-105 transition">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">
                  Toma o Sube una Foto de tu Sello Húmedo / Firma
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sello estampado o firma sobre una hoja blanca limpia. El algoritmo convertirá el papel en 100% transparente.
                </p>
              </div>
              <span className="inline-block px-4 py-2 rounded-xl bg-cyan-600 group-hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition">
                Seleccionar Foto o Archivo
              </span>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Panel de Ajustes y Previsualización */}
          {(originalImage || processedImage) && (
            <div className="space-y-6">
              
              {/* Controles de Sensibilidad de Fondo */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Calibración de Transparencia de Papel
                  </span>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Cambiar Foto
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>Eliminación de Papel (Sensibilidad)</span>
                      <span className="font-mono text-cyan-400">{threshold}</span>
                    </div>
                    <input 
                      type="range" 
                      min="120" 
                      max="245" 
                      value={threshold} 
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>Realce de Tinta Médica</span>
                      <span className="font-mono text-cyan-400">{inkBoost.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.8" 
                      max="2.0" 
                      step="0.1" 
                      value={inkBoost} 
                      onChange={(e) => setInkBoost(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Previsualización Dual: Fondo Transparente vs Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cuadrícula de Transparencia */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    1. Vista con Cuadrícula de Transparencia
                  </span>
                  <div className="h-48 rounded-2xl border border-slate-700 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] flex items-center justify-center p-3 overflow-hidden">
                    {processedImage && (
                      <img 
                        src={processedImage} 
                        alt="Sello Procesado" 
                        className="max-h-full max-w-full object-contain filter drop-shadow-md" 
                      />
                    )}
                  </div>
                </div>

                {/* Vista Sobre Papel Oficial */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    2. Vista Estampada Sobre Documento Real
                  </span>
                  <div className="h-48 rounded-2xl border border-slate-700 bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-end p-4 relative overflow-hidden shadow-inner">
                    <div className="absolute top-3 left-4 text-[9px] font-mono text-slate-600">
                      CCMI • CENTRO MÉDICO ORINOKIA
                    </div>
                    <div className="w-full border-t border-slate-300 pt-2 text-center text-[10px] font-mono text-slate-700">
                      Firma y Sello del Médico Especialista
                    </div>
                    {processedImage && (
                      <img 
                        src={processedImage} 
                        alt="Sello en Documento" 
                        className="max-h-32 max-w-full object-contain mb-1" 
                      />
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-4 bg-[#070e1d] border-t border-slate-800 flex items-center justify-between shrink-0">
          {processedImage ? (
            <button
              type="button"
              onClick={handleClearStamp}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar y Restaurar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer text-xs"
            >
              Cancelar
            </button>

            {processedImage && (
              <button
                type="button"
                onClick={handleSaveStamp}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-950/50 transition cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplicar a Mis Documentos</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
