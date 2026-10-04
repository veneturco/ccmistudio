import React from 'react';
import { Brain, Sparkles, Activity } from 'lucide-react';

interface SamiAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  isOnline?: boolean;
  showHalo?: boolean;
  className?: string;
  onClick?: () => void;
}

export const SamiAvatar: React.FC<SamiAvatarProps> = ({
  size = 'md',
  isThinking = false,
  isOnline = true,
  showHalo = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6', icon: 'w-3.5 h-3.5', badge: 'w-1.5 h-1.5' },
    sm: { box: 'w-8 h-8', icon: 'w-4 h-4', badge: 'w-2 h-2' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5', badge: 'w-2.5 h-2.5' },
    lg: { box: 'w-14 h-14', icon: 'w-7 h-7', badge: 'w-3.5 h-3.5' },
    xl: { box: 'w-20 h-20', icon: 'w-10 h-10', badge: 'w-4 h-4' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Halo de actividad / pensamiento */}
      {showHalo && (
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
            isThinking
              ? 'bg-gradient-to-r from-cyan-500/40 via-indigo-500/40 to-blue-500/40 animate-ping'
              : 'bg-cyan-500/20 blur-[2px]'
          }`}
        />
      )}

      {/* Contenedor principal del Avatar */}
      <div
        className={`relative ${currentSize.box} rounded-full bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 border ${
          isThinking
            ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
            : 'border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
        } flex items-center justify-center overflow-hidden transition-all duration-300`}
      >
        {/* Efecto de luz de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent pointer-events-none" />

        {/* Icono central de Neuroasistente */}
        {isThinking ? (
          <Activity
            className={`${currentSize.icon} text-cyan-300 animate-pulse transition-transform`}
          />
        ) : (
          <Brain
            className={`${currentSize.icon} text-cyan-300 transition-transform duration-300 hover:scale-110`}
          />
        )}

        {/* PequeÃ±o destello de IA */}
        <Sparkles
          className={`absolute top-0.5 right-0.5 w-2 h-2 text-amber-300 pointer-events-none ${
            isThinking ? 'animate-spin opacity-90' : 'opacity-60'
          }`}
        />
      </div>

      {/* Indicador de estado en lÃ­nea */}
      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${currentSize.badge} rounded-full ring-1.5 ring-slate-900 ${
            isThinking ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
          }`}
          title={isThinking ? 'SAMI pensando...' : 'SAMI en lÃ­nea (Gemini Pro/Flash)'}
        />
      )}
    </div>
  );
};
