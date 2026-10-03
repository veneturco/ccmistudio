import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('active_doc_backup');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h1 className="text-xl font-bold text-white tracking-tight">
              Estación Clínica CCMI (Modo Recuperación)
            </h1>
            
            <p className="text-sm text-slate-300">
              Se detectó una falla temporal (probablemente su proveedor de internet bloqueó la conexión a los servidores seguros).
            </p>

            <div className="text-left bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 max-h-36 overflow-auto">
              <p className="font-bold">{this.state.errorMessage}</p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Forzar Recarga</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
