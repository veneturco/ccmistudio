import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  LogOut, 
  RefreshCw,
  Sparkles,
  UserCheck,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { BrandLogo } from './BrandLogo';

export const LoginScreen: React.FC = () => {
  const { 
    status, 
    user, 
    firebaseUser, 
    errorMessage, 
    signInWithGoogle, 
    bypassLocalDoctor,
    logout, 
    clearError 
  } = useAuth();

  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  const handleLogin = async () => {
    setIsLoadingLocal(true);
    clearError();
    try {
      await signInWithGoogle();
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const isAuthenticating = status === 'AUTHENTICATING' || isLoadingLocal;
  const isUnauthorized = status === 'UNAUTHORIZED';

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#060b16] text-slate-100 relative overflow-hidden font-clinical selection:bg-blue-600 selection:text-white">
      {/* Video WebM Cinemático de Fondo de Alta Tecnología Médica */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/cortex-bg.jpg"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.15] scale-105 transform"
        >
          <source src="/images/login-bg.webm" type="video/webm" />
          <img src="/images/cortex-bg.jpg" alt="Cortex Background" className="w-full h-full object-cover" />
        </video>

        {/* Capas de gradientes cinemáticos y viñeta médica */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060b16]/85 via-[#060b16]/60 to-[#060b16]/90 backdrop-blur-[1.5px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(6,11,22,0.8)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
      </div>

      {/* Cabecera sutil */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <BrandLogo size={36} />
          <div>
            <span className="text-xs font-black tracking-wider text-cyan-400 block uppercase">
              CORTEX AXIS • CCMI
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Centro Clínico Médico Integral
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Acceso Clínico Restringido</span>
          </span>
        </div>
      </header>

      {/* Contenedor Central: Tarjeta de Acceso Institucional */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#0b1528]/95 backdrop-blur-xl rounded-3xl border border-slate-700/80 shadow-2xl shadow-cyan-950/40 p-6 sm:p-8 relative ring-1 ring-cyan-500/20">
          
          {/* Logo y Encabezado de la Tarjeta */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-cyan-500/30 mb-3 shadow-inner">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Portal Médico Oficial
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Dr. Samir Moucharrafie Naime • Centro Médico Orinokia
            </p>
          </div>

          {/* ESTADO 1: NO AUTORIZADO (Correo autenticado pero fuera de la lista blanca) */}
          {isUnauthorized && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 animate-shake">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-300">
                    Acceso No Autorizado
                  </p>
                  <p className="text-[11px] leading-relaxed text-rose-200/90">
                    El correo <strong className="text-white font-mono">{firebaseUser?.email}</strong> no tiene permisos asignados en el directorio del CCMI.
                  </p>
                  <p className="text-[10px] text-rose-300/80 pt-1">
                    Solo el Dr. Samir Moucharrafie y el personal de secretaría autorizado pueden acceder al sistema.
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-rose-900/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-rose-300 hover:text-white transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión e intentar con otra cuenta</span>
                </button>
              </div>
            </div>
          )}

          {/* MENSAJE DE ERROR TÉCNICO O DOMINIO */}
          {errorMessage && !isUnauthorized && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">Aviso del Sistema</p>
                  <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* BOTÓN OFICIAL DE LOGIN CON GOOGLE */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isAuthenticating}
              className={`w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer shadow-lg hover:-translate-y-0.5 active:scale-98 ${
                isAuthenticating
                  ? 'bg-slate-800 text-slate-400 cursor-wait'
                  : 'bg-white hover:bg-slate-100 text-slate-900 shadow-blue-500/20 ring-2 ring-white/80'
              }`}
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  {/* Icono de Google oficial */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.41 7.37 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12c0 2.06.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.59 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Iniciar Sesión con Google</span>
                </>
              )}
            </button>

            {bypassLocalDoctor && (
              <button
                type="button"
                onClick={bypassLocalDoctor}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60 border border-slate-800 transition cursor-pointer"
                title="Acceso de respaldo para el Dr. Samir en consultorio"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Acceso de Respaldo Consultorio (Dr. Samir)</span>
              </button>
            )}
          </div>

          {/* PERMISOS Y ROLES RECONOCIDOS */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2.5 text-center">
              Roles con Acceso Autorizado
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-semibold text-slate-300">Dr. Samir M.</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-300">Secretaría / Citas</span>
              </div>
            </div>
          </div>

          {/* Sede y Seguridad */}
          <div className="mt-4 text-center">
            <span className="text-[10px] text-slate-300 flex items-center justify-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>Centro Médico Orinokia, Piso 2, Consultorio 208</span>
            </span>
          </div>

        </div>
      </main>

      {/* Pie institucional */}
      <footer className="relative z-10 py-4 px-6 text-center border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-300">
        Instituto de Cirugía de Columna Mínimamente Invasiva (CCMI) • CORTEX AXIS • MPPS: 61231 • CMEB: 5331 • RPPS (Francia): 10100476323
      </footer>
    </div>
  );
};
