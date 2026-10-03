import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface MedicalFormCheckboxProps {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
  iconType?: 'check' | 'arrow';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  description?: string;
}

/**
 * Recuadro Oficial Médico Institucional para marcar opciones (Sí/No, Paciente/Familiar, etc.)
 * Diseñado para alta legibilidad en pantalla y contraste 100% nítido en impresión/PDF (A4 300 DPI).
 */
export const MedicalFormCheckbox: React.FC<MedicalFormCheckboxProps> = ({
  label,
  checked,
  onChange,
  id,
  iconType = 'check',
  size = 'md',
  disabled = false,
  className = '',
  description,
}) => {
  const boxSizeClass = 
    size === 'sm' ? 'w-4 h-4 text-xs' :
    size === 'lg' ? 'w-6 h-6 text-base' : 
    'w-5 h-5 text-sm';

  const iconSizeClass =
    size === 'sm' ? 'w-3 h-3 stroke-[3.5]' :
    size === 'lg' ? 'w-4 h-4 stroke-[3.5]' :
    'w-3.5 h-3.5 stroke-[3.5]';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div
      id={id}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 select-none group/checkbox transition-all ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter') && onChange) {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      {/* Recuadro Físico con Borde Institucional */}
      <div
        className={`${boxSizeClass} rounded-[3px] border-2 flex items-center justify-center transition-all shrink-0 ${
          checked
            ? 'border-[#0a376d] bg-[#0a376d]/10 text-[#0a376d] shadow-2xs'
            : 'border-slate-500/70 bg-white hover:border-[#0a376d] hover:bg-blue-50/40'
        } print:border-[#0a376d] print:bg-white`}
      >
        {checked && (
          iconType === 'arrow' ? (
            <ArrowRight className={`${iconSizeClass} text-[#0a376d]`} />
          ) : (
            <Check className={`${iconSizeClass} text-[#0a376d]`} />
          )
        )}
      </div>

      {/* Etiqueta del Recuadro */}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-tight uppercase leading-none transition-colors ${
            checked 
              ? 'text-[#0a376d]' 
              : 'text-slate-800 group-hover/checkbox:text-[#0a376d]'
          } ${size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs'}`}
        >
          {label}
        </span>
        {description && (
          <span className="text-[9px] text-slate-500 font-medium leading-tight">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};
