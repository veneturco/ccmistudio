import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Detectar si ya está corriendo como app instalada (standalone)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    // Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Capturar evento de instalación de Chromium / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowModal(false);
      }
    } else if (isIOS) {
      setShowModal(true);
    } else {
      setShowModal(true);
    }
  };

  // Si ya está instalada o fue descartada explícitamente en la sesión
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Botón Flotante / Banner Móvil Discreto */}
      {!isDismissed && (
        <div className="md:hidden bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border-b border-cyan-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2 truncate">
            <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate font-medium">
              Instalar App Dr. Samir en la pantalla de inicio
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Instalar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
              title="Descartar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Instructivo para iOS / Guía de Instalación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-clinical">
          <div className="bg-[#0b1528] border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-2">
                <BrandLogo size={40} />
              </div>
              <h3 className="text-base font-black text-white">
                Instalar App CCMI en su Teléfono
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Acceso directo a pantalla completa sin barra de navegación
              </p>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60 mb-5">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-950 text-cyan-400 shrink-0 font-bold">1</div>
                  <p className="text-slate-300">
                    Toque el botón <strong>Compartir</strong> en la barra inferior de Safari (<Share className="w-3.5 h-3.5 inline text-cyan-400" />).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-950 text-cyan-400 shrink-0 font-bold">2</div>
                  <p className="text-slate-300">
                    Baje y seleccione <strong>"Agregar a pantalla de inicio"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-cyan-400" />).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-950 text-cyan-400 shrink-0 font-bold">3</div>
                  <p className="text-slate-300">
                    Toque <strong>"Agregar"</strong> arriba a la derecha. ¡Listo!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60 mb-5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Compatible con Android y Chrome</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Podrá abrir el sistema como una aplicación nativa desde la pantalla de su teléfono con carga instantánea y modo offline.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                }
                setShowModal(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 cursor-pointer"
            >
              {deferredPrompt ? 'Confirmar Instalación' : 'Entendido'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
