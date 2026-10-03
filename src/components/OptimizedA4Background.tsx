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
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* 1. Base Skeleton Watermark during initial fetch if no image source is ready */}
      {isLoading && !effectiveSrc && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-50 flex flex-col items-center justify-between p-12 opacity-60 animate-pulse print:hidden">
          <div className="w-full flex items-center justify-between border-b border-blue-100/80 pb-4">
            <div className="h-6 w-32 bg-blue-100/70 rounded-md" />
            <div className="h-4 w-48 bg-slate-200/70 rounded-md" />
          </div>
          <div className="flex flex-col items-center gap-2 opacity-40">
            <ImageIcon className="w-12 h-12 text-[#0a376d]" />
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              Cargando Papelería 300 DPI...
            </span>
          </div>
          <div className="w-full h-8 bg-blue-100/50 rounded-md" />
        </div>
      )}

      {/* 2. Micro-LQIP Blurred Placeholder if available */}
      {lqipSrc && !isLoaded && (
        <img
          src={lqipSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-fill filter blur-md scale-105 transition-opacity duration-300 print:hidden opacity-80"
          style={{ imageRendering: 'auto' }}
        />
      )}

      {/* 3. Full-Resolution Authentic Stationery Background (300 DPI Original) */}
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
        />
      )}

      {/* 4. Subtle Authentic Stationery Badge in Preview (Hidden in Print) */}
      {isCustomOriginal && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-xs border border-emerald-500/50 text-emerald-300 text-[8px] font-mono font-bold flex items-center gap-1 shadow-xs print:hidden z-10 opacity-70 hover:opacity-100 transition-opacity">
          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
          <span>PAPELERÍA ORIGINAL</span>
        </div>
      )}
    </div>
  );
};
