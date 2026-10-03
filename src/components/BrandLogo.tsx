import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textVariant?: 'light' | 'dark';
  subtitle?: string;
  variant?: 'emblem' | 'horizontal' | 'card-vertical';
  useRasterEmblem?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  textVariant = 'light',
  subtitle = 'MÍNIMAMENTE INVASIVA',
  variant = 'emblem',
  useRasterEmblem = true,
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;
  const isDarkText = textVariant === 'dark';

  const emblemNode = useRasterEmblem ? (
    <img
      src="/images/cmi_emblem_transparent.png"
      alt="CMI — Cerebro y Columna"
      className="w-full h-full object-contain filter drop-shadow-sm select-none pointer-events-none"
      loading="eager"
      decoding="async"
    />
  ) : (
    <BrainSpineSvg />
  );

  if (variant === 'card-vertical') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none w-full ${className}`}>
        {/* Emblem (Now acting as the full logo since the image contains the text) */}
        <div style={{ width: dimension, height: dimension, maxWidth: '100%' }} className="relative shrink-0 mb-2 flex items-center justify-center">
          {emblemNode}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* High-definition Brain & Spine Emblem */}
      <div 
        style={{ width: dimension, height: dimension }} 
        className="relative shrink-0 select-none transition-transform duration-200 flex items-center justify-center"
      >
        {emblemNode}
      </div>

      {/* Optional Brand Typography */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-base leading-tight ${
                isDarkText ? 'text-[#0a3c74]' : 'text-white'
              }`}
            >
              CMI
            </span>
            <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">
              CEREBRO Y COLUMNA
            </span>
          </div>
          <span
            className={`text-[10px] tracking-wider truncate font-semibold uppercase ${
              isDarkText ? 'text-[#2c6cb0]' : 'text-slate-300'
            }`}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};

export const BrainSpineSvg: React.FC<{ className?: string }> = ({ className = "w-full h-full drop-shadow-xs" }) => (
  <svg
    viewBox="0 0 500 500"
    width="100%"
    height="100%"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="logoBrainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EDF5FD" />
        <stop offset="50%" stopColor="#CFE4F8" />
        <stop offset="100%" stopColor="#A8CEF3" />
      </linearGradient>

      <linearGradient id="logoSpineBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B7FC5" />
        <stop offset="100%" stopColor="#225994" />
      </linearGradient>

      <linearGradient id="logoSpineDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#122B4A" />
        <stop offset="100%" stopColor="#071629" />
      </linearGradient>

      <linearGradient id="logoDivider" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0E2644" />
        <stop offset="60%" stopColor="#0A1C34" />
        <stop offset="100%" stopColor="#061223" />
      </linearGradient>
    </defs>

    {/* LEFT HEMISPHERE: BRAIN */}
    <g id="logo-brain" className="animate-pulse">
      {/* White/Clean Fill Base with Navy Border */}
      <path
        d="M260 76
           C245 74 220 72 195 82
           C165 94 140 120 130 148
           C118 155 106 172 104 195
           C102 214 110 230 118 238
           C104 250 96 270 98 296
           C100 322 116 342 128 350
           C118 365 120 388 134 406
           C152 428 180 438 210 438
           C228 438 245 434 254 428
           C258 375 258 310 262 250
           C266 185 264 125 260 76 Z"
        fill="#FFFFFF"
        stroke="#13335B"
        strokeWidth="7"
        strokeLinejoin="round"
      />

      {/* Soft Glacier Shading on Lobes */}
      <path
        d="M195 82 C165 94 140 120 130 148 C138 152 148 156 160 156 C175 142 188 118 205 102 C201 94 198 87 195 82 Z"
        fill="url(#logoBrainGrad)"
      />
      <path
        d="M130 148 C118 155 106 172 104 195 C102 214 110 230 118 238 C126 230 134 218 140 200 C145 180 140 162 130 148 Z"
        fill="url(#logoBrainGrad)"
      />
      <path
        d="M118 238 C104 250 96 270 98 296 C100 322 116 342 128 350 C136 342 145 330 150 310 C155 285 145 260 118 238 Z"
        fill="url(#logoBrainGrad)"
      />
      <path
        d="M128 350 C118 365 120 388 134 406 C152 428 180 438 210 438 C202 424 196 405 186 388 C170 368 148 358 128 350 Z"
        fill="url(#logoBrainGrad)"
      />

      {/* Gyri and Sulci Convolutions */}
      <path
        d="M248 115 C226 112 202 124 192 144 C182 164 186 188 206 198 C224 206 244 198 250 180 C254 166 246 154 234 152 C222 150 214 158 216 168"
        fill="none"
        stroke="#13335B"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M165 156 C175 178 178 198 168 218 C158 236 138 245 118 238"
        fill="none"
        stroke="#13335B"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M260 215 C242 225 220 230 205 245 C185 265 190 292 212 305 C230 315 252 305 258 285"
        fill="none"
        stroke="#13335B"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M136 295 C155 305 175 305 190 295 C208 282 205 262 192 250"
        fill="none"
        stroke="#13335B"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M128 350 C150 355 175 352 195 338 C218 322 235 335 242 355 C248 375 238 395 218 405 C202 412 188 410 178 402"
        fill="none"
        stroke="#13335B"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M168 418 C188 424 212 422 232 414 C248 406 254 394 256 380"
        fill="none"
        stroke="#13335B"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M102 210 C120 216 135 208 144 195"
        fill="none"
        stroke="#13335B"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M98 290 C114 294 128 288 136 278"
        fill="none"
        stroke="#13335B"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </g>

    {/* CENTRAL S-CURVE CREST */}
    <path
      d="M265 72
         C282 120 292 180 294 245
         C296 315 284 380 252 446
         C244 440 238 430 242 415
         C270 360 280 305 278 245
         C276 185 266 130 252 80 Z"
      fill="url(#logoDivider)"
    />

    {/* RIGHT SIDE: VERTEBRAL COLUMN */}
    <g id="logo-spine">
      {/* Vertebra 1 (Cervical Top) */}
      <path
        d="M296 74 C318 68 335 70 348 76 C358 81 364 88 365 96 L332 96 C322 93 308 86 296 74 Z"
        fill="#18365C"
      />
      <path
        d="M298 78 L334 94 C342 98 346 104 346 112 L304 112 C300 98 298 88 298 78 Z"
        fill="url(#logoSpineBody)"
      />
      <path
        d="M304 112 L346 112 C356 112 360 114 366 118 L320 118 C310 118 305 115 304 112 Z"
        fill="#FFFFFF"
      />
      <path
        d="M336 80 C354 82 368 88 376 96 C384 104 386 114 380 120 C372 126 358 122 346 118 L348 106 C356 108 364 108 368 104 C372 100 368 94 354 90 Z"
        fill="url(#logoSpineDark)"
      />

      {/* Vertebra 2 */}
      <path
        d="M308 120 C326 120 348 120 362 122 C368 126 370 134 370 142 C354 142 332 142 312 142 C309 134 308 126 308 120 Z"
        fill="url(#logoSpineBody)"
      />
      <path
        d="M312 142 C330 142 355 142 370 142 C376 145 382 150 388 154 L334 154 C322 154 316 148 312 142 Z"
        fill="#FFFFFF"
      />
      <path
        d="M362 122 C380 124 396 130 406 140 C414 148 414 158 406 164 C396 170 380 164 368 156 L372 144 C382 148 392 150 398 146 C402 142 398 136 380 130 Z"
        fill="url(#logoSpineDark)"
      />

      {/* Vertebra 3 */}
      <path
        d="M314 158 C334 158 358 158 376 160 C384 165 386 174 386 184 C368 184 342 184 318 184 C315 174 314 165 314 158 Z"
        fill="url(#logoSpineBody)"
      />
      <path
        d="M318 184 C342 184 368 184 386 184 C394 188 400 193 408 198 L346 198 C332 198 324 191 318 184 Z"
        fill="#FFFFFF"
      />
      <path
        d="M376 160 C396 162 414 170 424 180 C434 190 432 200 422 208 C410 214 394 208 382 198 L388 186 C398 190 410 192 416 186 C420 182 416 174 396 168 Z"
        fill="url(#logoSpineDark)"
      />

      {/* Vertebra 4 (Apex) */}
      <path
        d="M318 202 C340 202 366 202 384 204 C392 210 394 220 394 230 C374 230 346 230 320 230 C318 220 318 210 318 202 Z"
        fill="url(#logoSpineBody)"
      />
      <path
        d="M320 230 C346 230 374 230 394 230 C402 234 408 239 418 245 L350 245 C336 245 326 238 320 230 Z"
        fill="#FFFFFF"
      />
      <path
        d="M384 204 C406 206 426 215 436 226 C446 237 444 248 432 256 C418 262 402 254 390 244 L396 232 C408 237 420 238 426 232 C432 226 426 218 404 212 Z"
        fill="url(#logoSpineDark)"
      />

      {/* Vertebra 5 */}
      <path
        d="M318 248 C338 248 364 248 382 250 C390 256 392 266 392 276 C370 276 342 276 316 276 C316 266 317 256 318 248 Z"
        fill="url(#logoSpineBody)"
      />
      <path
        d="M316 276 C342 276 370 276 392 276 C398 280 404 286 414 292 L344 292 C330 292 322 284 316 276 Z"
        fill="#FFFFFF"
      />
      <path
        d="M382 250 C404 252 422 262 432 273 C440 284 436 295 424 302 C410 308 394 300 384 290 L390 278 C402 282 414 284 420 278 C424 272 418 264 398 258 Z"
        fill="url(#logoSpineDark)"
      />

      {/* Vertebra 6 */}
      <path
        d="M312 296 C332 296 356 296 374 298 C382 304 384 314 384 324 C360 324 332 324 308 324 C309 314 310 304 312 296 Z"
        fill="url(#logoSpineBody)"
      />
      <path
        d="M308 324 C332 324 360 324 384 324 C390 328 396 334 404 340 L336 340 C322 340 314 332 308 324 Z"
        fill="#FFFFFF"
      />
      <path
        d="M374 298 C394 300 412 309 420 320 C428 331 424 342 412 348 C398 354 384 346 374 336 L380 324 C392 328 402 330 408 324 C412 318 406 311 388 306 Z"
        fill="url(#logoSpineDark)"
      />

      {/* Vertebra 7 */}
      <path
        d="M302 344 C322 344 344 344 360 346 C368 352 370 362 370 372 C346 372 320 372 296 372 C298 362 300 352 302 344 Z"
        fill="url(#logoSpineBody)"
      />
      <path
        d="M296 372 C320 372 346 372 370 372 C374 376 380 382 388 388 L320 388 C308 388 300 380 296 372 Z"
        fill="#FFFFFF"
      />
      <path
        d="M360 346 C378 348 394 357 402 368 C408 379 404 388 392 394 C380 400 368 392 358 382 L364 372 C374 375 384 376 388 371 C392 366 386 359 372 354 Z"
        fill="url(#logoSpineDark)"
      />

      {/* Vertebra 8 (Base & Sacrum) */}
      <path
        d="M288 392 C306 392 326 392 340 394 C348 400 348 410 346 420 C324 420 300 420 278 420 C280 410 284 400 288 392 Z"
        fill="url(#logoSpineBody)"
      />
      <path
        d="M278 420 C300 420 324 420 346 420 C350 424 356 430 362 436 L302 436 C290 436 282 428 278 420 Z"
        fill="#FFFFFF"
      />
      <path
        d="M340 394 C356 396 370 404 376 414 C382 424 378 432 368 438 C356 444 346 436 338 428 L342 418 C352 421 360 422 364 417 C368 412 362 405 350 401 Z"
        fill="url(#logoSpineDark)"
      />
      <path
        d="M272 424 C288 424 308 424 318 428 C324 434 322 444 316 450 C300 452 284 450 264 446 C266 438 268 430 272 424 Z"
        fill="url(#logoSpineDark)"
      />
    </g>
  </svg>
);
