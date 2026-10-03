import React, { useState } from 'react';
import { X, Search, Check, Sparkles, BookOpen, Stethoscope, ChevronRight, Activity, ShieldCheck } from 'lucide-react';
import { NEUROSURGERY_PRESETS, ClinicalProtocolPreset, searchPresets } from '../utils/clinicalPresets';

interface ClinicalPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: ClinicalProtocolPreset) => void;
}

export const ClinicalPresetsModal: React.FC<ClinicalPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(NEUROSURGERY_PRESETS.map((p) => p.category)))];

  const filteredPresets = searchPresets(searchQuery).filter((preset) => {
    if (selectedCategory === 'all') return true;
    return preset.category === selectedCategory;
  });

  const handleApply = (preset: ClinicalProtocolPreset) => {
    setAppliedPresetId(preset.id);
    onSelectPreset(preset);
    setTimeout(() => {
      setAppliedPresetId(null);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#070d1e] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0c1630]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 font-mono">
                Protocolos Clínicos de Columna
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  1-Clic Presets
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pautas terapéuticas estandarizadas del Dr. Samir (CCMI / Neurocirugía)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-800/80 bg-[#091124] space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por patología, CIE-10, fármaco o diagnóstico..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#050a18] border border-slate-700 focus:border-cyan-500 rounded-xl text-white text-xs placeholder:text-slate-500 outline-none transition-all font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Todos los Protocolos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Protocols List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/40">
          {filteredPresets.map((preset) => {
            const isApplied = appliedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                className="pt-3 first:pt-0 group relative bg-[#091228]/60 hover:bg-[#0c1836] border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        CIE-10: {preset.icd10}
                      </span>
                      <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {preset.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium italic">
                      Dx: {preset.diagnosis}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApply(preset)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      isApplied
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950/40 hover:shadow-cyan-900/60'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>¡Aplicado!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Insertar en Récipe</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Previsualización del contenido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="bg-[#050a18] p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-cyan-400 font-bold block mb-1">
                      💊 Rp. (Farmacia):
                    </span>
                    <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                      {preset.treatment}
                    </p>
                  </div>
                  <div className="bg-[#050a18] p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-emerald-400 font-bold block mb-1">
                      📋 Indicaciones al Paciente:
                    </span>
                    <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                      {preset.instructions}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPresets.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No se encontraron protocolos con el término "{searchQuery}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#091124] flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>5 Pautas Validadas por Especialista en Neurocirugía</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
