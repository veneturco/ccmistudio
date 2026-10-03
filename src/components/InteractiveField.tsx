import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Move, CornerDownRight, Crosshair, ZoomIn } from 'lucide-react';
import { FieldCalibration } from '../types/calibration';

interface Props {
  calibration: FieldCalibration;
  isCalibrating: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: FieldCalibration) => void;
  children: React.ReactNode;
  containerWidth?: number;
  containerHeight?: number;
  showZoneGuides?: boolean;
}

export const InteractiveField: React.FC<Props> = ({
  calibration: calibProp,
  isCalibrating,
  isSelected,
  onSelect,
  onChange,
  children,
  containerWidth = 794,
  containerHeight = 1123,
  showZoneGuides = true,
}) => {
  const calibration: FieldCalibration = calibProp || {
    id: 'field',
    label: 'Campo',
    top: 100,
    left: 100,
    width: 200,
    height: 30,
    fontSize: 12,
  };

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Position and dimension references for gesture calculations
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    initialTop: number;
    initialLeft: number;
    initialW: number;
    initialH: number;
    isTouch: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialTop: 0,
    initialLeft: 0,
    initialW: 0,
    initialH: 0,
    isTouch: false,
  });

  // Current calibration ref to avoid stale closures during continuous touch/drag
  const currentCalibRef = useRef(calibration);
  useEffect(() => {
    currentCalibRef.current = calibration;
  }, [calibration]);

  // Handle Drag / Move (Mouse & Touch)
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - gestureRef.current.startX;
    const dy = clientY - gestureRef.current.startY;

    let newLeft = Math.round(gestureRef.current.initialLeft + dx);
    let newTop = Math.round(gestureRef.current.initialTop + dy);

    // Keep bounded within sheet canvas
    newLeft = Math.max(0, Math.min(newLeft, containerWidth - (currentCalibRef.current.width || 30)));
    newTop = Math.max(0, Math.min(newTop, containerHeight - (currentCalibRef.current.height || 20)));

    onChange({
      ...currentCalibRef.current,
      left: newLeft,
      top: newTop,
    });
  }, [containerWidth, containerHeight, onChange]);

  // Handle Resize (Mouse & Touch)
  const handleResizeMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - gestureRef.current.startX;
    const dy = clientY - gestureRef.current.startY;

    const newW = Math.max(20, Math.min(Math.round(gestureRef.current.initialW + dx), containerWidth - gestureRef.current.initialLeft));
    const newH = Math.max(16, Math.min(Math.round(gestureRef.current.initialH + dy), containerHeight - gestureRef.current.initialTop));

    onChange({
      ...currentCalibRef.current,
      width: newW,
      height: newH,
    });
  }, [containerWidth, containerHeight, onChange]);

  // Global listeners for Dragging
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        // Prevent scrolling while dragging field
        if (e.cancelable) e.preventDefault();
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isDragging, handleDragMove]);

  // Global listeners for Resizing
  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      handleResizeMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      setIsResizing(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        if (e.cancelable) e.preventDefault();
        handleResizeMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isResizing, handleResizeMove]);

  // Mouse drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isCalibrating) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    gestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialTop: calibration.top,
      initialLeft: calibration.left,
      initialW: calibration.width,
      initialH: calibration.height,
      isTouch: false,
    };
  };

  // Touch drag start (Finger gesture on mobile/tablet)
  const handleTouchDragStart = (e: React.TouchEvent) => {
    if (!isCalibrating) return;
    if (e.touches.length === 1) {
      e.stopPropagation();
      onSelect();
      setIsDragging(true);
      gestureRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        initialTop: calibration.top,
        initialLeft: calibration.left,
        initialW: calibration.width,
        initialH: calibration.height,
        isTouch: true,
      };
    }
  };

  // Mouse resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isCalibrating) return;
    e.stopPropagation();
    onSelect();
    setIsResizing(true);
    gestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialTop: calibration.top,
      initialLeft: calibration.left,
      initialW: calibration.width,
      initialH: calibration.height,
      isTouch: false,
    };
  };

  // Touch resize start
  const handleTouchResizeStart = (e: React.TouchEvent) => {
    if (!isCalibrating) return;
    if (e.touches.length === 1) {
      e.stopPropagation();
      onSelect();
      setIsResizing(true);
      gestureRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        initialTop: calibration.top,
        initialLeft: calibration.left,
        initialW: calibration.width,
        initialH: calibration.height,
        isTouch: true,
      };
    }
  };

  const baseFontSizePx = calibration.fontSize || 13.33;
  const exactLineHeightPx = calibration.lineHeight || Math.round(baseFontSizePx * 1.35);

  // Base positioning styles applied in both normal and calibration modes
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${calibration.top}px`,
    left: `${calibration.left}px`,
    width: `${calibration.width}px`,
    height: `${calibration.height}px`,
    fontSize: calibration.fontSize ? `${calibration.fontSize}px` : undefined,
    lineHeight: `${exactLineHeightPx}px`,
    fontWeight: calibration.fontWeight,
    textAlign: calibration.textAlign,
  };

  if (!isCalibrating) {
    if (showZoneGuides) {
      return (
        <div 
          style={style} 
          className="absolute overflow-visible group/field transition-all duration-150 rounded-[3px] border border-dashed border-blue-500/45 hover:border-blue-600 focus-within:border-solid focus-within:border-[#0a376d] focus-within:ring-2 focus-within:ring-blue-400/40 bg-blue-500/[0.04] hover:bg-blue-500/[0.09] focus-within:bg-blue-50/30 shadow-2xs print:border-none print:bg-transparent print:ring-0 print:shadow-none"
        >
          {/* Tag de Identificación del Campo Editable (Guía Visual Inteligente) */}
          <div className="absolute -top-3.5 left-1 z-10 px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider text-blue-900/90 bg-blue-100/95 border border-blue-300/80 shadow-2xs pointer-events-none opacity-60 group-hover/field:opacity-100 group-focus-within/field:opacity-100 group-focus-within/field:bg-[#0a376d] group-focus-within/field:text-white transition-all select-none print:hidden flex items-center gap-0.5">
            <span>{calibration.label || calibration.id}</span>
          </div>

          {/* Marcadores de Esquina Tipo Plano/Guía de Imprenta */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-blue-500/70 pointer-events-none print:hidden"></div>
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-blue-500/70 pointer-events-none print:hidden"></div>
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-blue-500/70 pointer-events-none print:hidden"></div>
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-blue-500/70 pointer-events-none print:hidden"></div>

          {children}
        </div>
      );
    }

    return (
      <div 
        style={style} 
        className="overflow-visible group/field transition-all rounded-xs hover:ring-1 hover:ring-blue-300/60 focus-within:ring-1.5 focus-within:ring-[#1b4f8c]/70 focus-within:bg-blue-50/20 print:ring-0 print:bg-transparent"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group transition-[box-shadow,border-color] select-none touch-none ${
        isSelected
          ? 'z-40 ring-2 ring-blue-500 bg-blue-500/15 shadow-xl rounded-sm'
          : 'z-20 border border-dashed border-blue-400/60 bg-blue-400/5 hover:border-cyan-500 hover:bg-cyan-500/15'
      }`}
    >
      {/* 1. Full-body Direct Touch & Drag Overlay (Allows moving directly by touching/dragging anywhere inside the box) */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchDragStart}
        className={`absolute inset-0 z-30 cursor-move transition-colors flex items-center justify-center ${
          isSelected
            ? 'bg-blue-600/10 cursor-grab active:cursor-grabbing'
            : 'hover:bg-cyan-500/20 active:bg-blue-600/20'
        }`}
        title="Toque o arrastre con el dedo o mouse para mover este campo directamente"
      >
        {/* Subtle crosshair indicator when selected */}
        {isSelected && (
          <div className="pointer-events-none opacity-40 text-blue-700 flex items-center justify-center">
            <Crosshair className="w-5 h-5 animate-pulse" />
          </div>
        )}
      </div>

      {/* 2. Floating Top Badge with Field Label, Dimensions (mm & px) & Direct Drag Handle */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchDragStart}
        className={`absolute -top-7 left-0 z-40 px-2 py-0.5 rounded-t-lg text-[10px] font-bold tracking-tight whitespace-nowrap flex items-center gap-1.5 cursor-grab active:cursor-grabbing shadow-lg select-none touch-none ${
          isSelected
            ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white ring-2 ring-white/60 shadow-blue-900/40'
            : 'bg-slate-950/95 text-cyan-300 border border-slate-700 group-hover:bg-slate-900 group-hover:text-white'
        }`}
      >
        <Move className="w-3 h-3 text-cyan-300" />
        <span className="font-semibold">{calibration.label}</span>
        <span className="font-mono text-[9px] bg-black/50 text-cyan-200 px-1 py-0.2 rounded border border-cyan-500/30">
          {Math.round(calibration.width * 0.2645)}×{Math.round(calibration.height * 0.2645)}mm ({calibration.width}×{calibration.height}px)
        </span>
        <span className="font-mono text-[9px] bg-black/40 text-slate-300 px-1 py-0.2 rounded">
          X:{Math.round(calibration.left * 0.2645)}mm Y:{Math.round(calibration.top * 0.2645)}mm
        </span>
      </div>

      {/* 3. Corner Touch Resize Handle (Extra-large touch area for fingers and mouse) */}
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleTouchResizeStart}
        className={`absolute -bottom-2.5 -right-2.5 z-40 w-7 h-7 rounded-full flex items-center justify-center cursor-se-resize shadow-lg transition-transform touch-none select-none ${
          isSelected
            ? 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white ring-2 ring-white scale-110 shadow-blue-900/60'
            : 'bg-slate-800 text-slate-300 hover:bg-cyan-600 hover:text-white border border-slate-600'
        }`}
        title="Arrastre para redimensionar ancho y alto con el dedo o mouse"
      >
        <CornerDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>

      {/* 4. Embedded Child (Rendered text, inputs, textareas) */}
      <div className="w-full h-full pointer-events-none opacity-90 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
