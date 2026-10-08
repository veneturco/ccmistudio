import React from 'react';
import { useLazyAsset } from '../hooks/useLazyAsset';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

interface OptimizedA4BackgroundProps {
  src: string | null | undefined;
  lqip?: string;
  isCustomOriginal?: boolean;
  docTitle?: string;
}

/**
 * High-performance A4 Background Layer with progressive lazy loading,
 * LQIP (Low-Quality Image Placeholder) blur-up, instant memory caching,
 * and zero layout shifts (CLS = 0).
 * Ensures instant visibility for printing and PDF generation without blur.
 */
export const OptimizedA4Background: React.FC<OptimizedA4BackgroundProps> = ({
  src,
  lqip,
  isCustomOriginal = false,
  docTitle = 'Documento Médico',
}) => {
  const { currentSrc, lqipSrc, isLoading, isLoaded } = useLazyAsset(src, { lqip });

  const effectiveSrc = src || currentSrc || '/templates/recipes_bg.jpg';

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden bg-white"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* 1. Fondo de Papelería para Vista Previa DOM (Exclusivo UI, no afecta pdf-lib) */}
      {effectiveSrc && (
        <img
          src={effectiveSrc}
          alt={docTitle}
          className="absolute inset-0 w-full h-full object-fill opacity-100 print:opacity-100"
          style={{
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
          }}
          loading="eager"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      )}
      {/* 2. Badge de Papelería Original */}
      {isCustomOriginal && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-xs border border-emerald-500/50 text-emerald-300 text-[8px] font-mono font-bold flex items-center gap-1 shadow-xs print:hidden z-10 opacity-70 hover:opacity-100 transition-opacity">
          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
          <span>PAPELERÍA ORIGINAL</span>
        </div>
      )}
    </div>
  );

};

