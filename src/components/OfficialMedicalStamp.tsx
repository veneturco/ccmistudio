import React, { useState, useEffect } from 'react';

interface StampProps {
  className?: string;
  inkColor?: 'navy' | 'blue' | 'black';
  size?: 'sm' | 'md' | 'lg';
  withBorder?: boolean;
}

export const OfficialMedicalStamp: React.FC<StampProps> = ({
  className = '',
  inkColor = 'navy',
  size = 'md',
  withBorder = false,
}) => {
  const [customStampPng, setCustomStampPng] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('socs_custom_doctor_stamp_png');
      if (stored) {
        setCustomStampPng(stored);
      }
    }
  }, []);

  const colorMap = {
    navy: 'text-[#143560] border-[#143560]',
    blue: 'text-[#1d4ed8] border-[#1d4ed8]',
    black: 'text-slate-900 border-slate-900',
  };

  const scaleMap = {
    sm: 'scale-75 origin-center',
    md: 'scale-90 origin-center',
    lg: 'scale-100 origin-center',
  };

  // Si el médico configuró su firma y sello transparente con el extractor inteligente
  if (customStampPng) {
    return (
      <div className={`inline-flex items-center justify-center select-none holographic-foil ${scaleMap[size]} ${className}`}>
        <img 
          src={customStampPng} 
          alt="Sello y Firma Médica Oficial" 
          className="max-h-24 max-w-full object-contain filter drop-shadow-xs relative z-10" 
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none font-sans transition-all py-1 px-3 holographic-foil ${
        withBorder ? 'border-2 border-dashed rounded-xl' : ''
      } ${colorMap[inkColor]} ${scaleMap[size]} ${className}`}
    >
      {/* Nombre en caligrafía médica exacta Dancing Script */}
      <div
        className="text-2xl font-bold tracking-tight mb-1 text-center leading-none"
        style={{ fontFamily: "'Dancing Script', cursive, sans-serif" }}
      >
        Dr. Samir Moucharrafie Naime
      </div>

      <div className="flex items-center gap-3">
        {/* Silhouette Brain & Spine Icon */}
        <div className="w-10 h-10 shrink-0">
          <svg viewBox="0 0 500 500" className="w-full h-full fill-current">
            <path d="M260 76 C245 74 220 72 195 82 C165 94 140 120 130 148 C118 155 106 172 104 195 C102 214 110 230 118 238 C104 250 96 270 98 296 C100 322 116 342 128 350 C118 365 120 388 134 406 C152 428 180 438 210 438 C228 438 245 434 254 428 C258 375 258 310 262 250 C266 185 264 125 260 76 Z" />
            <path d="M280 84 C295 84 315 84 328 88 C334 94 336 102 334 112 C320 112 300 112 284 112 Z" />
            <path d="M280 134 C295 134 320 134 335 136 C342 142 344 150 342 160 C322 160 300 160 282 160 Z" />
            <path d="M280 184 C300 184 325 184 342 188 C348 194 348 204 346 214 C324 214 300 214 278 214 Z" />
            <path d="M280 238 C302 238 330 238 348 240 C354 246 354 256 350 266 C326 266 300 266 276 266 Z" />
            <path d="M280 292 C304 292 332 292 352 296 C358 302 356 312 352 322 C328 322 300 322 276 322 Z" />
            <path d="M282 344 C306 344 330 344 346 346 C352 352 350 362 346 372 C324 372 300 372 278 372 Z" />
            <path d="M288 392 C306 392 326 392 340 394 C348 400 348 410 346 420 C324 420 300 420 278 420 Z" />
          </svg>
        </div>

        <div className="flex flex-col text-left">
          <span className="font-black tracking-wider text-xs uppercase leading-none">
            NEUROCIRUJANO
          </span>
          <span className="font-bold text-[10px] tracking-tight mt-1 leading-tight">
            MPPS: 61231 / CMEB: 5331
          </span>
          <span className="font-bold text-[10px] tracking-tight leading-tight">
            RPPS (Francia): 10100476323
          </span>
        </div>
      </div>
    </div>
  );
};
