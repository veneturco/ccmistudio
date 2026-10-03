/**
 * LiveCoordinateCalibratorModal.tsx
 * ==============================================================================
 * Calibrador Milimétrico en Vivo V2 (Drag & Drop + Auto-Snapping Magnético)
 * Sistema Operativo Clínico Simplificado (SOCS) — Centro Médico Imbanaco (CCMI)
 * Dr. Samir Moucharrafie Naime
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  CheckCircle,
  RotateCcw,
  Download,
  Eye,
  Layers,
  Sparkles,
  Move,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Save,
  Check,
  ShieldCheck,
  Copy,
  Upload,
  Image as ImageIcon,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import { DocType } from '../types';
import { MasterTemplateV2, OverlayElement } from '../calibration/types/MasterTemplateV2';
import { getMasterTemplateV2, setMasterTemplateV2 } from '../calibration/MasterRegistryV2';
import { CalibrationEngine } from '../calibration/CalibrationEngine';
import { generateCanonicalDocumentPDF } from '../utils/pdfExport';
import { saveCustomTemplate, getCustomTemplate, deleteCustomTemplate } from '../utils/templateStorage';

interface LiveCoordinateCalibratorModalProps {
  initialDocType?: DocType;
  activeDocument?: any;
  customBgUrl?: string | null;
  customBgs?: Record<string, string>;
  onClose: () => void;
  onApplyCoordinates?: () => void;
}

const DOC_TABS: Array<{ id: DocType; label: string; widthMm: number; heightMm: number; bg: string }> = [
  { id: 'RECIPES', label: 'Récipe Médico', widthMm: 210, heightMm: 297, bg: '/templates/recipes_bg.jpg' },
  { id: 'ORDEN_LAB', label: 'Orden de Laboratorio y Neuroimagen', widthMm: 153.5, heightMm: 215.8, bg: '/templates/orden_lab_p1_bg.jpg' },
  { id: 'INFORME', label: 'Informe Médico', widthMm: 210, heightMm: 297, bg: '/templates/informe_bg.jpg' },
  { id: 'CONSTANCIA', label: 'Constancia Médica', widthMm: 210, heightMm: 297, bg: '/templates/constancia_bg.jpg' },
  { id: 'HISTORIA', label: 'Historia Clínica', widthMm: 210, heightMm: 297, bg: '/templates/historia_bg.jpg' },
];

export const LiveCoordinateCalibratorModal: React.FC<LiveCoordinateCalibratorModalProps> = ({
  initialDocType = 'RECIPES',
  activeDocument,
  customBgUrl = null,
  customBgs = {},
  onClose,
  onApplyCoordinates,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocType>(initialDocType);
  const [template, setTemplate] = useState<MasterTemplateV2 | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.65);
  const [snapMm, setSnapMm] = useState<number>(0.5);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showSampleText, setShowSampleText] = useState<boolean>(true);
  const [symmetricTalon, setSymmetricTalon] = useState<boolean>(true);
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Estados para Fondo Maestro
  const activeDocMeta = DOC_TABS.find((d) => d.id === selectedDoc) || DOC_TABS[0];
  const [activeBgImage, setActiveBgImage] = useState<string>(activeDocMeta.bg);
  const [isCustomBg, setIsCustomBg] = useState<boolean>(false);
  const [bgOpacity, setBgOpacity] = useState<number>(1.0);
  const [showBg, setShowBg] = useState<boolean>(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar y cargar el fondo maestro del documento seleccionado
  useEffect(() => {
    let isCancelled = false;

    const resolveBackground = async () => {
      // 1. Prioridad: customBgs provisto por props
      if (customBgs && customBgs[selectedDoc]) {
        setActiveBgImage(customBgs[selectedDoc]);
        setIsCustomBg(true);
        return;
      }
      if (customBgUrl && selectedDoc === initialDocType) {
        setActiveBgImage(customBgUrl);
        setIsCustomBg(true);
        return;
      }

      // 2. Revisar almacenamiento persistente IndexedDB / localStorage
      try {
        const stored =
          (await getCustomTemplate(selectedDoc)) ||
          (await getCustomTemplate(selectedDoc.toLowerCase())) ||
          (await getCustomTemplate(selectedDoc.toUpperCase()));
        if (!isCancelled && stored) {
          setActiveBgImage(stored);
          setIsCustomBg(true);
          return;
        }

        const local =
          localStorage.getItem(`custom_tpl_${selectedDoc}`) ||
          localStorage.getItem(`custom_tpl_${selectedDoc.toLowerCase()}`) ||
          localStorage.getItem(`custom_tpl_${selectedDoc.toUpperCase()}`);
        if (!isCancelled && local) {
          setActiveBgImage(local);
          setIsCustomBg(true);
          return;
        }
      } catch (err) {
        console.warn('Error resolviendo fondo maestro:', err);
      }

      // 3. Fallback a la imagen oficial base
      if (!isCancelled) {
        setActiveBgImage(activeDocMeta.bg);
        setIsCustomBg(false);
      }
    };

    resolveBackground();
    return () => {
      isCancelled = true;
    };
  }, [selectedDoc, customBgs, customBgUrl, activeDocMeta.bg, initialDocType]);

  // Manejo de carga de fondo maestro por el usuario (JPG, PNG, WebP)
  const handleUploadMasterBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida (JPG, PNG, WebP) del fondo maestro escaneado.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setActiveBgImage(dataUrl);
        setIsCustomBg(true);
        try {
          await saveCustomTemplate(selectedDoc, dataUrl);
          await saveCustomTemplate(selectedDoc.toLowerCase(), dataUrl);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('stationery_cloud_synced', {
                detail: { docType: selectedDoc, dataUrl },
              })
            );
          }
          setSaveStatus('✓ Fondo maestro cargado con éxito para este documento');
          setTimeout(() => setSaveStatus(null), 3500);
        } catch (err) {
          console.warn('Error guardando plantilla personalizada:', err);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Restablecer fondo maestro a la plantilla base oficial
  const handleResetBgToDefault = async () => {
    try {
      await deleteCustomTemplate(selectedDoc);
      await deleteCustomTemplate(selectedDoc.toLowerCase());
      await deleteCustomTemplate(selectedDoc.toUpperCase());
    } catch {}
    setActiveBgImage(activeDocMeta.bg);
    setIsCustomBg(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('stationery_cloud_synced', {
          detail: { docType: selectedDoc, dataUrl: activeDocMeta.bg },
        })
      );
    }
    setSaveStatus('Fondo restablecido a la plantilla base oficial de fábrica');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Cargar master al seleccionar documento
  useEffect(() => {
    const master = getMasterTemplateV2(selectedDoc);
    if (master) {
      // Clonar profundamente para edición en memoria
      setTemplate(JSON.parse(JSON.stringify(master)));
    }
  }, [selectedDoc]);

  const currentPage = template?.pages?.[0];
  const elements = currentPage?.elements || [];

  // Snap helper
  const applySnap = (val: number, step: number): number => {
    if (step <= 0) return Number(val.toFixed(1));
    return Number((Math.round(val / step) * step).toFixed(1));
  };

  // Manejo de movimiento del mouse sobre el canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    const mmX = applySnap((pixelX / rect.width) * activeDocMeta.widthMm, 0.1);
    const mmY = applySnap((pixelY / rect.height) * activeDocMeta.heightMm, 0.1);

    setMouseCoord({ x: mmX, y: mmY });

    if (isDragging && dragStart && selectedElementId && template) {
      const deltaPixelX = e.clientX - dragStart.mouseX;
      const deltaPixelY = e.clientY - dragStart.mouseY;

      const deltaMmX = (deltaPixelX / rect.width) * activeDocMeta.widthMm;
      const deltaMmY = (deltaPixelY / rect.height) * activeDocMeta.heightMm;

      let newX = applySnap(dragStart.elX + deltaMmX, snapMm);
      let newY = applySnap(dragStart.elY + deltaMmY, snapMm);

      // Topes de seguridad física (Bounding Box de página)
      newX = Math.max(2, Math.min(newX, activeDocMeta.widthMm - 10));
      newY = Math.max(5, Math.min(newY, activeDocMeta.heightMm - 10));

      // Actualizar el elemento
      const updatedElements = elements.map((el) => {
        if (el.id === selectedElementId) {
          const updatedGeom = {
            ...(el.geometry || { widthMm: 40, heightMm: 6 }),
            xMm: newX,
            yMm: newY,
          };
          return { ...el, geometry: updatedGeom };
        }

        // Si es récipe y la simetría bilateral está activa: mover el gemelo derecho
        if (selectedDoc === 'recipes' && symmetricTalon) {
          if (selectedElementId === 'left_patient_name' && el.id === 'right_patient_name') {
            return { ...el, geometry: { ...(el.geometry || {}), xMm: newX + 104.0, yMm: newY } };
          }
          if (selectedElementId === 'left_patient_id' && el.id === 'right_patient_id') {
            return { ...el, geometry: { ...(el.geometry || {}), xMm: newX + 104.0, yMm: newY } };
          }
          if (selectedElementId === 'left_patient_age' && el.id === 'right_patient_age') {
            return { ...el, geometry: { ...(el.geometry || {}), xMm: newX + 104.0, yMm: newY } };
          }
          if (selectedElementId === 'left_date' && el.id === 'right_date') {
            return { ...el, geometry: { ...(el.geometry || {}), xMm: newX + 104.0, yMm: newY } };
          }
          if (selectedElementId === 'left_rx_body' && el.id === 'right_indications_body') {
            return { ...el, geometry: { ...(el.geometry || {}), xMm: newX + 104.0, yMm: newY } };
          }
        }

        return el;
      });

      setTemplate({
        ...template,
        pages: [
          {
            ...currentPage!,
            elements: updatedElements,
          },
        ],
      });
    }
  };

  const handleMouseDownElement = (elId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElementId(elId);
    const targetEl = elements.find((el) => el.id === elId);
    if (!targetEl) return;

    const geom = targetEl.geometry || { xMm: 20, yMm: 20 };
    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: geom.xMm,
      elY: geom.yMm,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Restablecer a Matriz Oficial de Fábrica (v11)
  const handleResetToFactory = () => {
    // Forzar la carga limpia del master en MasterRegistryV2
    const master = getMasterTemplateV2(selectedDoc);
    if (master) {
      setTemplate(JSON.parse(JSON.stringify(master)));
      setSaveStatus('¡Restablecido a la Matriz Canónica Oficial v11!');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Guardar y Aplicar al Sistema
  const handleApplyChanges = () => {
    if (!template) return;
    setMasterTemplateV2(template.id, template);

    setSaveStatus('¡Calibración milimétrica aplicada y guardada en el sistema!');
    if (onApplyCoordinates) onApplyCoordinates();
    setTimeout(() => {
      setSaveStatus(null);
      onClose();
    }, 1200);
  };

  // Descargar prueba PDF rápida
  const handleTestPdf = async () => {
    if (!template) return;
    try {
      const dummyPatient = activeDocument?.patient || {
        fullName: 'Dr. Samir Moucharrafie',
        idNumber: 'V-12.887.723',
        age: '48',
        date: new Date().toLocaleDateString('es-VE'),
        phone: '0424-912.44.81',
      };
      const dummyBundle = {
        recipeData: {
          rxLeft: '1. Pregabalina 75 mg - Cápsulas.\n   Tomar 1 cápsula vía oral cada 12 horas por 14 días.\n\n2. Meloxicam 15 mg - Comprimidos.\n   Tomar 1 comprimido vía oral cada 24 horas por 7 días.',
          indicationsRight: '• Reposo relativo en cama en posición semi-fowler.\n• Evitar esfuerzos físicos y flexiones de columna.\n• Control en 15 días con RM de columna.',
        },
        informeData: {
          bodyText: 'INFORME CLÍNICO NEUROQUIRÚRGICO:\n\nPaciente bajo evaluación especializada por dolor radicular.',
        },
        labData: {
          presumptiveDx: 'Lumbociatalgia izquierda / Hernia Discal',
          labTests: ['hematologia', 'glicemia', 'urea_creatinina'],
          neuroimagingTests: ['rmn_columna'],
        },
        constanciaData: {
          idx: 'Hernia Discal Lumbar L5-S1',
          restDays: 7,
          needsRest: true,
        },
      };
      const docTypeKey = selectedDoc === 'recipes' ? 'RECIPES' : (selectedDoc.toUpperCase() as any);
      const result = await generateCanonicalDocumentPDF(
        docTypeKey,
        dummyPatient,
        dummyBundle as any,
        `Calibracion_${selectedDoc}.pdf`
      );
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Calibracion_${selectedDoc}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      console.error('Error probando PDF:', err);
    }
  };

  return (
    <div
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md select-none animate-in fade-in duration-150"
    >
      <div className="flex h-[95vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100">
        {/* HEADER SUPERIOR */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Coordenadas Milimétricas (Calibrador V2)</h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  PDF SYNC ACTIVO
                </span>
                {symmetricTalon && selectedDoc === 'recipes' && (
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/20">
                    SIMETRÍA BILATERAL ON (ΔX = 104mm)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Calibración sobre la plantilla física oficial • Centrado magnético sobre cajas preimpresas
              </p>
            </div>
          </div>

          {/* Selector de Documentos */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {DOC_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedDoc(tab.id);
                  setSelectedElementId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedDoc === tab.id
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2">
            {/* Input oculto para cargar fondo maestro */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={handleUploadMasterBg}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 hover:border-cyan-400 transition cursor-pointer shadow-xs"
              title="Cargar y calibrar sobre la imagen física o escaneo real de este documento"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Cargar Fondo Maestro</span>
            </button>

            <button
              onClick={handleTestPdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-slate-700 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Probar PDF
            </button>
            <button
              onClick={handleResetToFactory}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition cursor-pointer"
              title="Restaura la calibración oficial de fábrica v11"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer Fábrica
            </button>
            <button
              onClick={handleApplyChanges}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Aplicar Coordenadas
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICACIÓN DE ESTADO */}
        {saveStatus && (
          <div className="bg-emerald-600/90 text-white px-6 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>{saveStatus}</span>
            </div>
            <button onClick={() => setSaveStatus(null)} className="hover:text-emerald-200">
              ✕
            </button>
          </div>
        )}

        {/* CUERPO PRINCIPAL */}
        <div className="flex flex-1 overflow-hidden">
          {/* PANEL LATERAL IZQUIERDO: LISTA DE CAMPOS */}
          <div className="flex w-80 flex-col border-r border-slate-800 bg-slate-950 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Campos ({elements.length})
              </span>
              {selectedDoc === 'recipes' && (
                <label className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symmetricTalon}
                    onChange={(e) => setSymmetricTalon(e.target.checked)}
                    className="rounded text-cyan-600 bg-slate-800 border-slate-700"
                  />
                  <span>Simetría</span>
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              {elements.map((el) => {
                const isSelected = el.id === selectedElementId;
                const geom = el.geometry || { xMm: 0, yMm: 0 };
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-xs'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-medium">
                      <span className="truncate">{el.id}</span>
                      <span className="text-[10px] text-cyan-400">
                        {geom.xMm.toFixed(1)} , {geom.yMm.toFixed(1)} mm
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="truncate">{el.dataKey || el.type}</span>
                      <span>
                        {(geom as any).widthMm || 40}×{(geom as any).heightMm || 6}mm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL CENTRAL: CANVAS DE CALIBRACIÓN */}
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/40">
            {/* BARRA DE HERRAMIENTAS DEL CANVAS */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 py-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Zoom */}
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.05).toFixed(2))))}
                    className="p-1 hover:text-cyan-400 cursor-pointer"
                    title="Reducir zoom"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono font-bold text-cyan-300 w-12 text-center text-xs">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.05).toFixed(2))))}
                    className="p-1 hover:text-cyan-400 cursor-pointer"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom(0.6)}
                    className="px-1.5 py-0.5 bg-slate-800 text-[10px] rounded hover:bg-slate-700 cursor-pointer ml-0.5 text-cyan-200"
                    title="Ajustar hoja entera a la pantalla"
                  >
                    Ajustar
                  </button>
                  <button
                    onClick={() => setZoom(1.0)}
                    className="px-1.5 py-0.5 bg-slate-800 text-[10px] rounded hover:bg-slate-700 cursor-pointer text-slate-300"
                    title="Tamaño real 100%"
                  >
                    100%
                  </button>
                </div>

                {/* Snap */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Snap:</span>
                  <select
                    value={snapMm}
                    onChange={(e) => setSnapMm(parseFloat(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-cyan-300 text-xs cursor-pointer"
                  >
                    <option value={0}>Libre (0 mm)</option>
                    <option value={0.1}>Fino (0.1 mm)</option>
                    <option value={0.5}>Estándar (0.5 mm)</option>
                    <option value={1.0}>Rejilla (1.0 mm)</option>
                  </select>
                </div>

                {/* Controles de Fondo Maestro */}
                <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBg}
                      onChange={(e) => setShowBg(e.target.checked)}
                      className="rounded text-cyan-600 bg-slate-800 border-slate-700"
                    />
                    <span className="font-semibold text-slate-200">Fondo Maestro</span>
                  </label>

                  {showBg && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 border-l border-slate-800 pl-2">
                      <span>Opacidad:</span>
                      <select
                        value={bgOpacity}
                        onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                        className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-cyan-300 cursor-pointer"
                      >
                        <option value={1.0}>100%</option>
                        <option value={0.75}>75%</option>
                        <option value={0.5}>50%</option>
                        <option value={0.25}>25%</option>
                      </select>
                    </div>
                  )}

                  {isCustomBg ? (
                    <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        Papelería Real
                      </span>
                      <button
                        onClick={handleResetBgToDefault}
                        className="text-[10px] text-slate-400 hover:text-amber-300 transition underline cursor-pointer ml-1"
                        title="Volver al fondo predeterminado de fábrica"
                      >
                        Restablecer
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 border-l border-slate-800 pl-2">
                      Fondo Oficial Base
                    </span>
                  )}
                </div>

                {/* Toggles */}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded text-cyan-600 bg-slate-800 border-slate-700"
                  />
                  <span>Malla</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSampleText}
                    onChange={(e) => setShowSampleText(e.target.checked)}
                    className="rounded text-cyan-600 bg-slate-800 border-slate-700"
                  />
                  <span>Muestra</span>
                </label>
              </div>

              {/* Coordenadas en Vivo */}
              <div className="font-mono text-xs font-semibold text-emerald-400 whitespace-nowrap">
                {mouseCoord ? `X: ${mouseCoord.x.toFixed(1)} mm | Y: ${mouseCoord.y.toFixed(1)} mm` : 'Pase el ratón'}
              </div>
            </div>

            {/* LIENZO DE RENDERIZADO VISUAL */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950/70">
              <div
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                className="relative bg-white shadow-2xl rounded-sm border border-slate-700 overflow-hidden"
                style={{
                  width: `${activeDocMeta.widthMm * 3.7795 * zoom}px`,
                  height: `${activeDocMeta.heightMm * 3.7795 * zoom}px`,
                  minWidth: `${activeDocMeta.widthMm * 3.7795 * zoom}px`,
                  minHeight: `${activeDocMeta.heightMm * 3.7795 * zoom}px`,
                }}
              >
                {/* Imagen del fondo maestro */}
                {showBg && (
                  <img
                    src={activeBgImage}
                    alt="Fondo Maestro Calibración"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0 transition-opacity duration-150"
                    style={{ opacity: bgOpacity }}
                  />
                )}

                {/* Malla milimétrica opcional */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-15 z-10"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #000 1px, transparent 1px),
                        linear-gradient(to bottom, #000 1px, transparent 1px)
                      `,
                      backgroundSize: `${10 * 3.7795 * zoom}px ${10 * 3.7795 * zoom}px`,
                    }}
                  />
                )}

                {/* Overlays interactivos de los elementos */}
                {elements.map((el) => {
                  const geom = el.geometry || { xMm: 20, yMm: 20, widthMm: 40, heightMm: 6 };
                  const isSelected = el.id === selectedElementId;

                  const leftPct = (geom.xMm / activeDocMeta.widthMm) * 100;
                  const topPct = (geom.yMm / activeDocMeta.heightMm) * 100;
                  const widthPct = (geom.widthMm / activeDocMeta.widthMm) * 100;
                  const heightPct = (geom.heightMm / activeDocMeta.heightMm) * 100;

                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleMouseDownElement(el.id, e)}
                      className={`absolute z-20 flex items-center px-1 border transition-shadow cursor-move ${
                        isSelected
                          ? 'border-2 border-cyan-400 bg-cyan-500/25 ring-2 ring-cyan-400/40 text-cyan-950 font-bold'
                          : 'border border-blue-500/60 bg-blue-500/10 hover:border-blue-400 hover:bg-blue-500/20 text-slate-800 font-semibold'
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        fontSize: `${Math.max(8, 10 * zoom)}px`,
                      }}
                      title={`${el.id} (X: ${geom.xMm.toFixed(1)}mm, Y: ${geom.yMm.toFixed(1)}mm)`}
                    >
                      <span className="truncate pointer-events-none">
                        {showSampleText ? (el.labelPrefix ? `${el.labelPrefix} ` : '') + (el.id.includes('name') ? 'Dr. Samir Moucharrafie' : el.id.includes('id') ? 'V-12.887.723' : el.id.includes('age') ? '48' : el.id.includes('date') ? '28/09/2026' : el.id) : el.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
