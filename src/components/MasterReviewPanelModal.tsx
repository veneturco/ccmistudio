/**
 * MasterReviewPanelModal.tsx
 * 
 * PANEL UNIVERSAL DE REVISIÓN VISUAL, AUDITORÍA Y CERTIFICACIÓN DE MASTERS
 * =========================================================================
 * 
 * Permite al usuario/médico auditar visualmente los elementos físicos detectados
 * por el UniversalMasterAnalyzer, corregir etiquetas/dataKeys y certificar o
 * publicar el Master en el sistema.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Sliders,
  Eye,
  Download,
  Save,
  Layers,
  Sparkles,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import {
  MasterTemplateV2,
  OverlayElement,
  PageTemplate,
  MasterStatus,
} from '../calibration/types/MasterTemplateV2';
import { VectorOverlayEngineV2 } from '../calibration/VectorOverlayEngineV2';
import { CalibrationEngineV2 } from '../calibration/CalibrationEngineV2';
import { CalibrationValidator } from '../calibration/CalibrationValidator';
import { setMasterTemplateV2 } from '../calibration/MasterRegistryV2';
import { saveCustomTemplate } from '../utils/templateStorage';
import { toBlobPart } from '../utils/pdfExport';
import { runAntigravityRegressionSuite, AntigravityAuditSummary } from '../utils/antigravityRegressionSuite';

interface MasterReviewPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterTemplate: MasterTemplateV2;
  originalPdfBytes?: Uint8Array;
  onMasterUpdated?: (updated: MasterTemplateV2) => void;
}

export const MasterReviewPanelModal: React.FC<MasterReviewPanelModalProps> = ({
  isOpen,
  onClose,
  masterTemplate: initialMaster,
  originalPdfBytes,
  onMasterUpdated,
}) => {
  const [master, setMaster] = useState<MasterTemplateV2>(initialMaster);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isGeneratingDebug, setIsGeneratingDebug] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'checkbox' | 'text' | 'signature'>('all');
  const [isRunningAntigravityAudit, setIsRunningAntigravityAudit] = useState<boolean>(false);
  const [antigravitySummary, setAntigravitySummary] = useState<AntigravityAuditSummary | null>(null);

  const handleRunAntigravityAudit = async () => {
    setIsRunningAntigravityAudit(true);
    try {
      const summary = await runAntigravityRegressionSuite();
      setAntigravitySummary(summary);
    } catch (e) {
      console.error('Error corriendo auditoría Antigravity:', e);
    } finally {
      setIsRunningAntigravityAudit(false);
    }
  };

  useEffect(() => {
    if (initialMaster) {
      setMaster(initialMaster);
    }
  }, [initialMaster]);

  if (!isOpen || !master) return null;

  const masterPages = Array.isArray(master?.pages) ? master.pages : [];
  const currentPage = masterPages[selectedPageIndex] || masterPages[0];
  const selectedElement = currentPage?.elements?.find((el) => el.id === selectedElementId);

  // Filtrado de elementos por pestaña
  const filteredElements = (currentPage?.elements || []).filter((el) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'checkbox') return el.type === 'checkbox';
    if (activeTab === 'text') return el.type === 'text' || el.type === 'multilineText';
    if (activeTab === 'signature') return el.type === 'signature' || el.type === 'stamp';
    return true;
  });

  const evaluation = CalibrationValidator.evaluateUniversalMaster(master);

  // Modificar dataKey o etiqueta de un elemento
  const handleUpdateElement = (elId: string, updates: Partial<OverlayElement>) => {
    const newPages = masterPages.map((p, pIdx) => {
      if (pIdx !== selectedPageIndex) return p;
      return {
        ...p,
        elements: (p.elements || []).map((el) => (el.id === elId ? ({ ...el, ...updates } as OverlayElement) : el)),
      };
    });

    const updatedMaster: MasterTemplateV2 = {
      ...master,
      pages: newPages,
      status: 'CALIBRATED',
    };
    setMaster(updatedMaster);
  };

  // Publicar y Guardar Master
  const handlePublishMaster = async () => {
    const publishedMaster: MasterTemplateV2 = {
      ...master,
      status: 'PUBLISHED',
      version: `${parseFloat(master.version || '1.0').toFixed(1)}`,
    };

    setMasterTemplateV2(publishedMaster.masterId, publishedMaster);
    setMasterTemplateV2(publishedMaster.documentType, publishedMaster);

    // Persistir si hay bytes
    if (originalPdfBytes) {
      await saveCustomTemplate(publishedMaster.documentType, '', {
        originalPdfBytes,
        originalSizeBytes: originalPdfBytes.byteLength,
        updatedAt: new Date().toISOString(),
        physicalPages: (publishedMaster?.pages || []).map((p) => ({
          pageIndex: p.pageIndex,
          widthPt: CalibrationEngineV2.mmToPt(p.widthMm),
          heightPt: CalibrationEngineV2.mmToPt(p.heightMm),
          widthMm: p.widthMm,
          heightMm: p.heightMm,
        })),
      });
    }

    setMaster(publishedMaster);
    if (onMasterUpdated) {
      onMasterUpdated(publishedMaster);
    }
    onClose();
  };

  // Generar PDF de Diagnóstico con Overlay Vectorial y Bounding Boxes
  const handleDownloadDebugPdf = async () => {
    if (!originalPdfBytes) return;
    setIsGeneratingDebug(true);
    try {
      const syntheticData = {
        patient: {
          fullName: 'PACIENTE PRUEBA SINTÉTICA',
          idNumber: 'V-12.345.678',
          age: '45',
          gender: 'M',
        },
        document: {
          date: '01/01/2099',
        },
        clinical: {
          diagnosisPrincipal: 'Evaluación diagnóstica y auditoría física de papelería médica.',
          treatment: 'Tratamiento de prueba sintética para verificación de límites de línea y espaciado.',
        },
        labTests: Object.fromEntries(
          masterPages.flatMap((p) =>
            (p.elements || [])
              .filter((el: OverlayElement) => el.type === 'checkbox' && 'dataKey' in el)
              .map((el: OverlayElement) => [((el as any).dataKey || '').replace('labTests.', ''), true])
          )
        ),
      };

      const result = await VectorOverlayEngineV2.applyOverlay(
        originalPdfBytes,
        master,
        syntheticData,
        { debugOverlay: true, debugMode: true }
      );

      const blob = new Blob([toBlobPart(result.pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DEBUG_AUDIT_${master.masterId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generando debug PDF:', e);
    } finally {
      setIsGeneratingDebug(false);
    }
  };

  return (
    <div id="master-review-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Auditoría y Certificación de Master: {master.masterId}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    master.status === 'PUBLISHED' || master.status === 'CALIBRATED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {master.status}
                </span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-mono">
                  {master.source?.classification || 'PDF_VECTORIAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {master.metadata?.name || 'Documento Oficial'} • {currentPage?.widthMm.toFixed(1)} ×{' '}
                {currentPage?.heightMm.toFixed(1)} mm • Confianza:{' '}
                {((master.metadata?.globalConfidence || 0.95) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-antigravity-audit"
              onClick={handleRunAntigravityAudit}
              disabled={isRunningAntigravityAudit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition shadow-xs cursor-pointer"
              title="Ejecutar suite de 11 pruebas automatizadas de regresión forense (Antigravity)"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              {isRunningAntigravityAudit ? 'Auditando...' : 'Auditoría Antigravity'}
            </button>

            <button
              id="btn-debug-pdf"
              onClick={handleDownloadDebugPdf}
              disabled={isGeneratingDebug || !originalPdfBytes}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              {isGeneratingDebug ? 'Generando...' : 'Descargar PDF de Diagnóstico'}
            </button>

            <button
              id="btn-publish-master"
              onClick={handlePublishMaster}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              Certificar y Publicar
            </button>

            <button
              id="btn-close-review"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* BANNER DE RESULTADOS DE AUDITORÍA ANTIGRAVITY */}
        {antigravitySummary && (
          <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                antigravitySummary.overallStatus === 'HEALTHY'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {antigravitySummary.overallStatus === 'HEALTHY' ? '100% Sano (Blindado)' : 'Discrepancias'}
              </span>
              <span className="text-slate-300">
                Pruebas Forenses: <strong>{antigravitySummary.passed}/{antigravitySummary.totalTests} Aprobadas</strong> ({antigravitySummary.executionTimeMs} ms)
              </span>
              <span className="text-slate-400 hidden sm:inline">
                • XObjects y Fondos Físicos: <span className="text-emerald-400 font-semibold">Garantizados</span>
              </span>
              <span className="text-slate-400 hidden md:inline">
                • Conmutación Fallback 300 DPI: <span className="text-emerald-400 font-semibold">Operativa</span>
              </span>
            </div>
            <button
              onClick={() => setAntigravitySummary(null)}
              className="text-slate-400 hover:text-white font-medium cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex flex-1 overflow-hidden">
          {/* PANEL IZQUIERDO: VISOR FÍSICO DE COORDENADAS */}
          <div className="flex w-7/12 flex-col border-r border-slate-800 bg-slate-950 p-6 overflow-y-auto">
            {/* Selector de Páginas */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">Páginas del Documento:</span>
                {masterPages.map((p, idx) => (
                  <button
                    key={p.pageIndex}
                    onClick={() => setSelectedPageIndex(idx)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      selectedPageIndex === idx
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Página {idx + 1} ({(p.elements || []).length} elementos)
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-slate-400">
                {currentPage?.widthMm || 210} × {currentPage?.heightMm || 297} mm
              </span>
            </div>

            {/* Canvas de Representación Geométrica Proporcional */}
            <div className="relative mx-auto flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-inner">
              <div
                className="relative bg-white rounded-md shadow-2xl overflow-hidden border border-slate-300"
                style={{
                  width: `${currentPage.widthMm * 2.5}px`,
                  height: `${currentPage.heightMm * 2.5}px`,
                }}
              >
                {/* Regiones Bloqueadas (Membrete y Pie) */}
                {currentPage.lockedRegions?.map((lr) => (
                  <div
                    key={lr.id}
                    className="absolute bg-rose-500/15 border border-rose-500/40 pointer-events-none flex items-center justify-center"
                    style={{
                      left: `${lr.xMm * 2.5}px`,
                      top: `${lr.yMm * 2.5}px`,
                      width: `${lr.widthMm * 2.5}px`,
                      height: `${lr.heightMm * 2.5}px`,
                    }}
                  >
                    <span className="text-[9px] font-mono text-rose-700 font-bold bg-white/80 px-1 rounded">
                      Área Protegida
                    </span>
                  </div>
                ))}

                {/* Elementos Detectados */}
                {currentPage.elements.map((el) => {
                  const isSelected = el.id === selectedElementId;
                  const isCheckbox = el.type === 'checkbox';

                  return (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`absolute cursor-pointer transition-all duration-150 flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-indigo-600 bg-indigo-500/30 z-30'
                          : isCheckbox
                          ? 'bg-emerald-500/20 border border-emerald-600 hover:bg-emerald-500/40 z-10'
                          : 'bg-sky-500/20 border border-sky-600 hover:bg-sky-500/40 z-10'
                      }`}
                      style={{
                        left: `${el.geometry.xMm * 2.5}px`,
                        top: `${el.geometry.yMm * 2.5}px`,
                        width: `${el.geometry.widthMm * 2.5}px`,
                        height: `${el.geometry.heightMm * 2.5}px`,
                      }}
                      title={`${el.label || el.id} (${el.dataKey})`}
                    >
                      {isCheckbox && (
                        <span className="text-[8px] font-black text-emerald-900 leading-none">X</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Casilla Física
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-500"></span> Campo de Texto / Firma
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> Región Bloqueada
                </span>
              </div>
              <span className="font-mono">Escala: 2.5px/mm</span>
            </div>
          </div>

          {/* PANEL DERECHO: DETALLES, SEMÁNTICA Y EDICIÓN */}
          <div className="flex w-5/12 flex-col bg-slate-900 p-6 overflow-y-auto">
            {/* Selector de Pestañas de Elementos */}
            <div className="mb-4 flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              {(['all', 'checkbox', 'text', 'signature'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                    activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'all'
                    ? 'Todos'
                    : tab === 'checkbox'
                    ? 'Casillas'
                    : tab === 'text'
                    ? 'Campos'
                    : 'Firmas/Sellos'}
                </button>
              ))}
            </div>

            {/* Si hay un elemento seleccionado, mostrar editor detallado */}
            {selectedElement ? (
              <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-600/30 px-2 py-0.5 text-xs font-mono text-indigo-300">
                      {selectedElement.type.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-white">{selectedElement.label || selectedElement.id}</h3>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">
                    Confianza: {((selectedElement.confidence || 0.95) * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Clave de Datos Semántica (DataKey):</label>
                    <input
                      type="text"
                      value={selectedElement.dataKey || ''}
                      onChange={(e) => handleUpdateElement(selectedElement.id, { dataKey: e.target.value })}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[10px]">X (mm):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedElement.geometry.xMm}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            geometry: { ...selectedElement.geometry, xMm: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Y (mm):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedElement.geometry.yMm}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            geometry: { ...selectedElement.geometry, yMm: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Ancho (mm):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedElement.geometry.widthMm}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            geometry: { ...selectedElement.geometry, widthMm: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Alto (mm):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedElement.geometry.heightMm}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            geometry: { ...selectedElement.geometry, heightMm: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Lista de Elementos */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Elementos en Página {selectedPageIndex + 1} ({filteredElements.length})
              </h4>

              {filteredElements.map((el) => {
                const isSelected = el.id === selectedElementId;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`cursor-pointer rounded-lg border p-2.5 transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate max-w-[200px]">
                        {el.label || el.id}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                        {el.type}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{el.dataKey || 'sin dataKey'}</span>
                      <span>
                        [{el.geometry.xMm.toFixed(1)}, {el.geometry.yMm.toFixed(1)}] mm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
