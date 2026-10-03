import React, { useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  RotateCcw, 
  X, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Maximize2,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Sparkles,
  Check,
  Touchpad,
  Hand,
  Layers,
  ChevronDown
} from 'lucide-react';
import { DocType } from '../types';
import { DocumentCalibration, FieldCalibration } from '../types/calibration';
import { DOCUMENT_DEFINITIONS } from '../utils/pdfExport';

interface Props {
  activeDoc: DocType;
  calibration?: DocumentCalibration;
  fields?: DocumentCalibration;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateField: (updated: FieldCalibration) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
  hasUnsavedChanges: boolean;
}

export const CalibrationToolbar: React.FC<Props> = ({
  activeDoc,
  calibration,
  fields: fieldsProp,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onSave,
  onReset,
  onClose,
  hasUnsavedChanges,
}) => {
  const activeCalibration = calibration || fieldsProp || {};
  const fields: FieldCalibration[] = (Object.values(activeCalibration) as FieldCalibration[]).filter(
    (f): f is FieldCalibration => Boolean(f && typeof f === 'object' && f.id)
  );
  const selectedField: FieldCalibration | null = selectedFieldId ? activeCalibration[selectedFieldId] || null : null;

  // Keyboard navigation for precision pixel nudging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (!e.altKey && !e.ctrlKey && !e.metaKey) return;
      }

      if (!selectedField) return;

      const step = e.shiftKey ? 5 : (e.altKey ? 10 : 1);

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateField({ ...selectedField, top: Math.max(0, selectedField.top - step) });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateField({ ...selectedField, top: Math.min(1123 - selectedField.height, selectedField.top + step) });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateField({ ...selectedField, left: Math.max(0, selectedField.left - step) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateField({ ...selectedField, left: Math.min(794 - selectedField.width, selectedField.left + step) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedField, onUpdateField]);

  const nudge = (dTop: number, dLeft: number) => {
    if (!selectedField) return;
    onUpdateField({
      ...selectedField,
      top: Math.max(0, Math.min(1123 - selectedField.height, selectedField.top + dTop)),
      left: Math.max(0, Math.min(794 - selectedField.width, selectedField.left + dLeft)),
    });
  };

  const resize = (dW: number, dH: number) => {
    if (!selectedField) return;
    onUpdateField({
      ...selectedField,
      width: Math.max(20, Math.min(794 - selectedField.left, selectedField.width + dW)),
      height: Math.max(16, Math.min(1123 - selectedField.top, selectedField.height + dH)),
    });
  };

  const adjustFontSize = (delta: number) => {
    if (!selectedField) return;
    const current = selectedField.fontSize || 12;
    onUpdateField({
      ...selectedField,
      fontSize: Math.max(8, Math.min(32, current + delta)),
    });
  };

  const adjustLineHeight = (delta: number) => {
    if (!selectedField) return;
    const current = selectedField.lineHeight || 20;
    onUpdateField({
      ...selectedField,
      lineHeight: Math.max(12, Math.min(50, current + delta)),
    });
  };

  const toggleBold = () => {
    if (!selectedField) return;
    const isBold = selectedField.fontWeight === 'bold' || selectedField.fontWeight === '900';
    onUpdateField({
      ...selectedField,
      fontWeight: isBold ? 'normal' : 'bold',
    });
  };

  const setAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!selectedField) return;
    onUpdateField({
      ...selectedField,
      textAlign: align,
    });
  };

  return (
    <div className="sticky top-2 z-50 w-full max-w-[794px] mb-3 bg-slate-900/95 backdrop-blur-md border-2 border-blue-500/80 rounded-2xl p-3 shadow-2xl text-white animate-fade-in print:hidden">
      {/* Top row: Title, quick touch guide, action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Hand className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black tracking-tight text-white">
                Calibrador Táctil & Visual 1:1
              </h3>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                {DOCUMENT_DEFINITIONS?.[activeDoc]?.shortName || activeDoc}
              </span>
            </div>
            <p className="text-[11px] text-cyan-300/90 font-medium">
              ✨ Toque con el dedo y arrastre cualquier casilla directamente en la hoja A4 para colocarla exactamente donde desee.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Restablecer posiciones originales por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-900/40 animate-pulse'
                : 'bg-emerald-700/80 text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Posiciones</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 transition cursor-pointer"
            title="Salir del Modo Calibración"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle/Bottom row: Field selector and detailed controls */}
      <div className="pt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Field Selector Dropdown */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
          <span className="text-slate-400 text-[11px] font-bold shrink-0">Campo:</span>
          <select
            value={selectedFieldId || ''}
            onChange={(e) => onSelectField(e.target.value || null)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">-- Toque un campo en la hoja o elija aquí --</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} → (Y: {f.top}px, X: {f.left}px) [{f.width}x{f.height}px]
              </option>
            ))}
          </select>
        </div>

        {/* Precision Nudge & Dimension Controls (Visible when field selected) */}
        {selectedField ? (
          <div className="flex flex-wrap items-center gap-2">
            {/* Position D-Pad with 1px and 10px fast nudge */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 gap-0.5 shadow-inner">
              <span className="text-[10px] text-slate-500 font-mono px-1 font-bold">MOVER</span>
              <button
                type="button"
                onClick={() => nudge(0, -1)}
                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white active:bg-blue-600"
                title="Mover 1px izquierda (Flecha Izq)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(-1, 0)}
                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white active:bg-blue-600"
                title="Mover 1px arriba (Flecha Arriba)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(1, 0)}
                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white active:bg-blue-600"
                title="Mover 1px abajo (Flecha Abajo)"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(0, 1)}
                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white active:bg-blue-600"
                title="Mover 1px derecha (Flecha Der)"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              
              <div className="h-3 w-px bg-slate-800 mx-0.5"></div>
              
              {/* Quick 10px Fast Jump */}
              <button
                type="button"
                onClick={() => nudge(-10, 0)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-blue-900 text-blue-300"
                title="Subir 10px"
              >
                ↑10
              </button>
              <button
                type="button"
                onClick={() => nudge(10, 0)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-blue-900 text-blue-300"
                title="Bajar 10px"
              >
                ↓10
              </button>
              <button
                type="button"
                onClick={() => nudge(0, -10)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-blue-900 text-blue-300"
                title="Izquierda 10px"
              >
                ←10
              </button>
              <button
                type="button"
                onClick={() => nudge(0, 10)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-blue-900 text-blue-300"
                title="Derecha 10px"
              >
                →10
              </button>
            </div>

            {/* Direct Coordinates Numeric Inputs */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-0.5 gap-1.5 text-[11px]">
              <label className="flex items-center gap-1 font-mono text-slate-400">
                <span>Y:</span>
                <input
                  type="number"
                  value={selectedField.top}
                  onChange={(e) => onUpdateField({ ...selectedField, top: parseInt(e.target.value, 10) || 0 })}
                  className="w-12 bg-slate-900 border border-slate-700 text-cyan-300 font-bold px-1 py-0.5 rounded text-center focus:outline-none focus:border-blue-500"
                />
              </label>
              <label className="flex items-center gap-1 font-mono text-slate-400">
                <span>X:</span>
                <input
                  type="number"
                  value={selectedField.left}
                  onChange={(e) => onUpdateField({ ...selectedField, left: parseInt(e.target.value, 10) || 0 })}
                  className="w-12 bg-slate-900 border border-slate-700 text-cyan-300 font-bold px-1 py-0.5 rounded text-center focus:outline-none focus:border-blue-500"
                />
              </label>
            </div>

            {/* Dimension Controls */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 gap-1">
              <span className="text-[10px] text-slate-500 font-mono px-1 font-bold">TAMAÑO</span>
              <button
                type="button"
                onClick={() => resize(-10, 0)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300"
                title="Reducir Ancho -10px"
              >
                W-
              </button>
              <button
                type="button"
                onClick={() => resize(10, 0)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300"
                title="Aumentar Ancho +10px"
              >
                W+
              </button>
              <button
                type="button"
                onClick={() => resize(0, -10)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300"
                title="Reducir Alto -10px"
              >
                H-
              </button>
              <button
                type="button"
                onClick={() => resize(0, 10)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300"
                title="Aumentar Alto +10px"
              >
                H+
              </button>
            </div>

            {/* Typography Controls */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 gap-1">
              <span className="text-[10px] text-slate-500 font-mono px-1 font-bold">TEXTO</span>
              <button
                type="button"
                onClick={() => adjustFontSize(-1)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300"
                title="Reducir tamaño de letra"
              >
                A-
              </button>
              <span className="text-[10px] font-mono text-cyan-300 px-0.5 font-bold">
                {selectedField.fontSize || 12}px
              </span>
              <button
                type="button"
                onClick={() => adjustFontSize(1)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300"
                title="Aumentar tamaño de letra"
              >
                A+
              </button>

              {/* Line Height for multi-line fields */}
              {selectedField.height > 40 && (
                <>
                  <div className="h-3 w-px bg-slate-800 mx-0.5"></div>
                  <button
                    type="button"
                    onClick={() => adjustLineHeight(-2)}
                    className="text-[10px] font-bold px-1 py-0.5 rounded hover:bg-slate-800 text-slate-300"
                    title="Reducir interlineado"
                  >
                    ↕-
                  </button>
                  <span className="text-[10px] font-mono text-amber-300 px-0.5 font-bold">
                    {selectedField.lineHeight || 20}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustLineHeight(2)}
                    className="text-[10px] font-bold px-1 py-0.5 rounded hover:bg-slate-800 text-slate-300"
                    title="Aumentar interlineado"
                  >
                    ↕+
                  </button>
                </>
              )}

              <div className="h-3 w-px bg-slate-800 mx-0.5"></div>

              {/* Bold Toggle */}
              <button
                type="button"
                onClick={toggleBold}
                className={`p-1 rounded ${
                  selectedField.fontWeight === 'bold' || selectedField.fontWeight === '900'
                    ? 'bg-blue-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alternar Negrita"
              >
                <Bold className="w-3 h-3" />
              </button>

              {/* Alignment */}
              <button
                type="button"
                onClick={() => setAlign('left')}
                className={`p-1 rounded ${
                  selectedField.textAlign === 'left' || !selectedField.textAlign
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alinear Izquierda"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setAlign('center')}
                className={`p-1 rounded ${
                  selectedField.textAlign === 'center'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alinear Centro"
              >
                <AlignCenter className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-cyan-300 text-xs italic flex items-center gap-1.5 py-1 bg-blue-950/40 px-3 rounded-xl border border-blue-800/50">
            <Hand className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>Toque directamente cualquier casilla con el dedo o mouse en la hoja para moverla libremente.</span>
          </div>
        )}
      </div>
    </div>
  );
};
