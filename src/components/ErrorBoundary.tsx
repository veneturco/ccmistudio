import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[ErrorBoundary] Error capturado en ventana:', event.error || event.message);
      if (event.error?.message && !event.error.message.includes('ResizeObserver')) {
        setErrorMessage(event.error?.message || event.message);
        setHasError(true);
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn('[ErrorBoundary] Promesa rechazada no capturada:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const handleReset = () => {
    try {
      localStorage.removeItem('active_doc_backup');
    } catch {}
    window.location.reload();
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
            <AlertTriangle className="w-7 h-7" />
          </div>
          
          <h1 className="text-xl font-bold text-white tracking-tight">
            Estación Clínica CCMI
          </h1>
          
          <p className="text-sm text-slate-300">
            Se detectó una excepción de ejecución. Su papelería y datos locales permanecen seguros.
          </p>

          {errorMessage && (
            <div className="text-left bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 max-h-36 overflow-auto">
              <p className="font-bold">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recargar Estación de Trabajo</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
