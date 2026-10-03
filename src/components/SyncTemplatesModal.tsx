import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Download, 
  Upload, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  Copy, 
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { DocType } from '../types';
import { getAllCustomTemplates, saveCustomTemplate } from '../utils/templateStorage';
import { EMBEDDED_TEMPLATES, TEMPLATE_NAMES } from '../assets/embeddedTemplates';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesUpdated?: () => void;
}

export const SyncTemplatesModal: React.FC<Props> = ({ isOpen, onClose, onTemplatesUpdated }) => {
  const [localTemplates, setLocalTemplates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const templates = await getAllCustomTemplates();
      setLocalTemplates(templates || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const docTypes: DocType[] = ['RECIPES', 'INFORME', 'ORDEN_LAB', 'CONSTANCIA', 'HISTORIA'];
  const hasAnyLocal = Object.keys(localTemplates).length > 0;

  // Exportar a archivo JSON
  const handleExportJson = () => {
    const exportData = {
      author: 'Dr. Samir Moucharrafie Naime',
      specialty: 'Neurocirugía y Columna Mínimamente Invasiva (CCMI)',
      createdAt: new Date().toISOString(),
      templates: localTemplates,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantillas_oficiales_dr_samir_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Importar desde archivo JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const templates = parsed.templates || parsed;

        let count = 0;
        for (const key of Object.keys(templates)) {
          if (docTypes.includes(key as DocType) && typeof templates[key] === 'string') {
            await saveCustomTemplate(key, templates[key]);
            count++;
          }
        }

        await loadStatus();
        if (onTemplatesUpdated) onTemplatesUpdated();
        setImportStatus(`¡Éxito! Se importaron ${count} plantillas originales en este dispositivo.`);
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        setImportStatus('Error: El archivo seleccionado no tiene el formato válido de plantillas.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-[#0a376d] to-[#041c3b] p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Cloud className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Sincronización de Plantillas Oficiales</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Cómo transferir los archivos originales del celular a la computadora y hacerlos predeterminados de fábrica.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs leading-relaxed">
          {/* Explicación Clave */}
          <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-blue-950 text-sm">
                ¿Por qué en el celular sí se ven los archivos originales y en la PC no?
              </p>
              <p className="text-blue-900 text-xs">
                Cuando subió las fotos o escaneos en su celular, el navegador del teléfono los guardó en su memoria local interna (IndexedDB). Para que aparezcan de forma <strong>automática y predeterminada en cualquier computadora o dispositivo nuevo</strong> sin tener que volver a cargarlos, disponemos de dos métodos inmediatos:
              </p>
            </div>
          </div>

          {/* Método 1: Definitivo y Automático (Enviar al Chat) */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/50 border-2 border-emerald-300/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>MÉTODO 1 (DEFINITIVO PARA SIEMPRE): Incrustación en el Código Fuente</span>
            </div>
            <p className="text-slate-700 text-xs">
              Para que el sistema las tenga <strong>pre-cargadas de fábrica en todos los dispositivos para siempre</strong>:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-800 font-medium">
              <li>
                <strong>Opción A:</strong> Presione el botón verde abajo desde su celular <strong>"Descargar Paquete de Plantillas (.json)"</strong> y envíe ese archivo aquí al chat con el asistente.
              </li>
              <li>
                <strong>Opción B:</strong> O simplemente arrastre o suba las 5 imágenes escaneadas de su papelería por este mismo chat.
              </li>
            </ol>
            <p className="text-emerald-800 text-[11px] font-semibold bg-emerald-100/60 p-2.5 rounded-xl">
              ⚡ Al recibirlas aquí en el chat, nosotros las compilamos directamente en la estructura de la aplicación. Así, cuando abra la app en cualquier laptop, tablet o celular del mundo, aparecerán predeterminadas al 100% de inmediato.
            </p>
          </div>

          {/* Estado de las plantillas en ESTE dispositivo */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">
                Estado de plantillas en este dispositivo:
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                {hasAnyLocal ? `${Object.keys(localTemplates).length} cargadas localmente` : 'Usando fondos base predeterminados'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {docTypes.map((type) => {
                const isCustom = !!localTemplates[type];
                return (
                  <div 
                    key={type}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                      isCustom 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-bold' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="truncate">{TEMPLATE_NAMES[type]}</span>
                    {isCustom ? (
                      <span className="text-emerald-600 flex items-center gap-1 shrink-0 font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Celular/Local
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px] shrink-0">Base A4</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acciones de Transferencia Rápida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Si está en el celular o tiene datos locales: Botón de Exportar */}
            <button
              type="button"
              onClick={handleExportJson}
              disabled={!hasAnyLocal}
              className={`p-3.5 rounded-2xl flex items-center justify-center gap-2.5 font-bold transition shadow-sm cursor-pointer ${
                hasAnyLocal
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Descargar Paquete (.json) del Celular</span>
            </button>

            {/* Si está en la PC: Botón de Importar */}
            <label className="p-3.5 rounded-2xl bg-[#0a376d] hover:bg-[#0c4488] text-white flex items-center justify-center gap-2.5 font-bold transition shadow-sm cursor-pointer text-center">
              <Monitor className="w-4 h-4" />
              <span>Importar Paquete (.json) en esta PC</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-3 bg-blue-100 text-blue-900 rounded-xl font-bold text-center animate-fade-in">
              {importStatus}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
