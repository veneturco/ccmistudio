import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Download, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  Pill, 
  FlaskConical, 
  CalendarCheck, 
  ClipboardList,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { DocType } from '../types';
import { TEMPLATE_FILE_INFO, getOfficialPdfUrl, getOfficialTemplateUrl } from '../assets/embeddedTemplates';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: DocType | string;
}

export const OriginalPdfViewerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialDoc = 'RECIPES',
}) => {
  const [selectedDoc, setSelectedDoc] = useState<string>(initialDoc);
  const [viewMode, setViewMode] = useState<'pdf' | 'raster_300dpi'>('raster_300dpi');

  if (!isOpen) return null;

  const docList = [
    { id: 'RECIPES', name: 'Récipe (Doble Talón)', icon: Pill },
    { id: 'INFORME', name: 'Informe Médico', icon: FileText },
    { id: 'ORDEN_LAB', name: 'Orden Lab (Pág. 1)', icon: FlaskConical },
    { id: 'ORDEN_LAB_P2', name: 'Neuroimagen (Pág. 2)', icon: FlaskConical },
    { id: 'CONSTANCIA', name: 'Constancia Médica', icon: CalendarCheck },
    { id: 'HISTORIA', name: 'Historia Clínica', icon: ClipboardList },
  ];

  const info = TEMPLATE_FILE_INFO?.[selectedDoc] || TEMPLATE_FILE_INFO?.RECIPES || {
    name: selectedDoc,
    shortName: selectedDoc,
    imgUrl: '/templates/recipes_bg.jpg',
    pdfUrl: '/templates/recipe_base.pdf',
    resolution: '300 DPI (1588 × 2246 px)',
    dimensions: 'A4 Estándar (794 × 1123 px)',
    description: 'Documento médico institucional CCMI',
    type: 'PDF / JPG Imprenta',
  };
  const pdfUrl = getOfficialPdfUrl(selectedDoc);
  const imgUrl = getOfficialTemplateUrl(selectedDoc);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-100">
        
        {/* TOP MODAL HEADER */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  Documentos y Plantillas Originales Fijos de Fábrica
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  PRECARGADO 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Archivos originales exactos (PDF / 300 DPI) con membrete del Instituto CCMI cargados en el sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELECTOR DE PLANTILLAS */}
        <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          {docList.map((doc) => {
            const Icon = doc.icon;
            const isSelected = selectedDoc === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDoc(doc.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{doc.name}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN BODY: SIDEBAR INFO + PREVIEW AREA */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          
          {/* LEFT SIDEBAR: METADATA & ACTIONS */}
          <div className="w-full md:w-80 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                  Plantilla Seleccionada
                </span>
                <h4 className="text-sm font-black text-white mt-0.5">
                  {info.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {info.description}
                </p>
              </div>

              {/* Technical specs */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Resolución:</span>
                  <span className="font-mono font-bold text-emerald-400">{info.resolution}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Dimensiones:</span>
                  <span className="font-mono text-cyan-300">{info.dimensions}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Archivo PDF:</span>
                  <span className="font-mono text-[11px] text-slate-300 truncate max-w-[140px]">{info.pdfUrl}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Archivo JPG:</span>
                  <span className="font-mono text-[11px] text-slate-300 truncate max-w-[140px]">{info.imgUrl}</span>
                </div>
              </div>

              {/* View mode toggle */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Modo de Previsualización:
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('raster_300dpi')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'raster_300dpi'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    300 DPI (JPG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('pdf')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'pdf'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PDF Base
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Este archivo es la matriz física oficial precargada. Todos los campos editables y calibraciones se posicionan milimétricamente sobre este documento exacto.
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <a
                href={pdfUrl}
                download
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Descargar PDF Original</span>
              </a>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir PDF en Pestaña</span>
              </a>
            </div>
          </div>

          {/* RIGHT PREVIEW CANVAS */}
          <div className="flex-1 bg-slate-950 p-4 sm:p-6 flex items-center justify-center overflow-auto">
            {viewMode === 'raster_300dpi' ? (
              <div className="relative shadow-2xl rounded-sm border border-slate-700 max-h-full flex items-center justify-center bg-white">
                <img
                  src={imgUrl}
                  alt={info.name}
                  className="max-h-[75vh] w-auto object-contain rounded-xs select-none"
                />
                <div className="absolute bottom-3 left-3 bg-slate-900/90 text-slate-200 text-[10px] font-mono px-2 py-1 rounded-md border border-slate-700 backdrop-blur-xs">
                  {info.imgUrl} • {info.resolution}
                </div>
              </div>
            ) : (
              <div className="w-full h-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
                <iframe
                  src={pdfUrl}
                  title={info.name}
                  className="w-full flex-1 border-0 rounded-b-2xl bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
