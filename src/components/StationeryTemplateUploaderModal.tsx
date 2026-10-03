import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  FileImage, 
  X, 
  Sparkles, 
  Info, 
  RotateCcw, 
  Eye, 
  Zap, 
  Cpu, 
  Loader2,
  AlertTriangle,
  Layers,
  FileCheck,
  Compass
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { DocType } from '../types';
import { 
  optimizeStationeryImage, 
  formatBytes, 
  OptimizedAssetResult,
  OptimizedPageResult 
} from '../utils/assetOptimizer';
import { 
  StoredTemplateRecord, 
  getCustomTemplateRecord,
  resetAllCustomTemplates,
  saveCustomTemplate
} from '../utils/templateStorage';
import { FirestoreStationerySync } from '../cloud/FirestoreStationerySync';
import { CalibrationEngineV2 } from '../calibration/CalibrationEngineV2';
import { setMasterTemplateV2, getMasterTemplateV2, MasterTemplateV2, PageTemplate } from '../calibration/MasterRegistryV2';
import { toBlobPart } from '../utils/pdfExport';
import { TemplateRegistry } from '../calibration/TemplateRegistry';
import { UniversalMasterAnalyzer } from '../calibration/UniversalMasterAnalyzer';
import { SemanticFieldResolver } from '../calibration/SemanticFieldResolver';
import { MasterReviewPanelModal } from './MasterReviewPanelModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeDoc?: DocType;
  customBgs: Record<string, string>;
  onSaveTemplate: (
    docType: DocType | string, 
    dataUrl: string, 
    metadata?: Partial<StoredTemplateRecord>
  ) => void;
  onRemoveTemplate: (docType: DocType | string) => void;
  onResetAll?: () => void;
}

/**
 * Calcula el hash SHA-256 de los bytes de un archivo para validación criptográfica del MasterDocument
 */
async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  if (window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback rápido si subtle crypto no está disponible
  let hash = 0;
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    hash = (hash << 5) - hash + bytes[i];
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Mapeo de DocType a clave canónica del sistema V2
 */
function mapDocTypeToCanonical(docType: DocType | string): string {
  switch (docType) {
    case 'RECIPES': return 'recipe';
    case 'INFORME': return 'report';
    case 'ORDEN_LAB':
    case 'ORDEN_LAB_P2': return 'lab_order';
    case 'CONSTANCIA': return 'certificate';
    case 'HISTORIA': return 'history';
    default: return (docType as string).toLowerCase();
  }
}

export const StationeryTemplateUploaderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeDoc = 'RECIPES',
  customBgs,
  onSaveTemplate,
  onRemoveTemplate,
  onResetAll,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocType>(activeDoc);
  const [labSubPage, setLabSubPage] = useState<1 | 2>(1);
  const [previewZoomUrl, setPreviewZoomUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [optimizationStats, setOptimizationStats] = useState<Record<string, Partial<StoredTemplateRecord>>>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [multiPageNotice, setMultiPageNotice] = useState<string | null>(null);
  const [pdfExtractedPages, setPdfExtractedPages] = useState<OptimizedPageResult[] | null>(null);
  const [cachedPdfInfo, setCachedPdfInfo] = useState<{
    bytes: Uint8Array;
    hash: string;
    physicalPages: Array<{ pageIndex: number; widthPt: number; heightPt: number; widthMm: number; heightMm: number; }>;
  } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewMaster, setReviewMaster] = useState<MasterTemplateV2 | null>(null);
  const [reviewPdfBytes, setReviewPdfBytes] = useState<Uint8Array | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      if (activeDoc) setSelectedDoc(activeDoc);
      setUploadError(null);
      setMultiPageNotice(null);
      setPdfExtractedPages(null);

      // Cargar metadatos de optimización guardados para todos los documentos y páginas
      const keysToLoad = Array.from(
        new Set([...Object.keys(customBgs), 'RECIPES', 'INFORME', 'ORDEN_LAB', 'ORDEN_LAB_P2', 'CONSTANCIA', 'HISTORIA'])
      );

      keysToLoad.forEach((docKey) => {
        getCustomTemplateRecord(docKey).then((rec) => {
          if (rec) {
            setOptimizationStats((prev) => ({ ...prev, [docKey]: rec }));
          }
        });
      });
    }
  }, [isOpen, activeDoc, customBgs]);

  if (!isOpen) return null;

  /**
   * Actualiza el MasterTemplateV2 en memoria con la geometría física real del PDF cargado
   */
  const updateMasterTemplateWithPhysicalPdf = (
    canonicalType: string,
    pdfHash: string,
    physicalPages: Array<{ pageIndex: number; widthPt: number; heightPt: number; widthMm: number; heightMm: number; }>
  ) => {
    const existing = getMasterTemplateV2(canonicalType);
    if (!existing || !Array.isArray(existing.pages)) return;

    // Actualizar dimensiones físicas de cada página según el PDF original
    const updatedPages: PageTemplate[] = (existing.pages || []).map((p, idx) => {
      const phys = physicalPages[idx] || physicalPages[0];
      return {
        ...p,
        widthMm: phys ? phys.widthMm : p.widthMm,
        heightMm: phys ? phys.heightMm : p.heightMm,
      };
    });

    const updatedMaster: MasterTemplateV2 = {
      ...existing,
      status: 'REQUIRES_CALIBRATION',
      source: {
        ...existing.source,
        checksum: pdfHash,
      },
      pages: updatedPages,
      metadata: {
        ...existing.metadata,
        name: `${existing.metadata?.name || existing.documentType} (PDF Maestro Físico)`,
        description: `Dimensiones físicas detectadas del PDF original (${physicalPages[0]?.widthMm.toFixed(1)} × ${physicalPages[0]?.heightMm.toFixed(1)} mm). Estado: REQUIRES_CALIBRATION (Pendiente verificación geométrica de casillas).`,
      },
    };

    // Registrar en MasterRegistryV2 y TemplateRegistry
    setMasterTemplateV2(canonicalType, updatedMaster);
    TemplateRegistry.register(updatedMaster);
  };

  const processFile = async (docType: DocType, file: File) => {
    setUploadError(null);
    setMultiPageNotice(null);
    setPdfExtractedPages(null);
    setCachedPdfInfo(null);
    try {
      setIsProcessing(true);

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      let pdfBytes: Uint8Array | null = null;
      let pdfHash = '';
      let physicalPages: Array<{
        pageIndex: number;
        widthPt: number;
        heightPt: number;
        widthMm: number;
        heightMm: number;
      }> = [];

      // Si es un archivo PDF original:
      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
        pdfHash = await computeSha256(arrayBuffer);

        // Inspeccionar con pdf-lib para obtener dimensiones físicas reales exactas
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();

        for (let i = 0; i < pageCount; i++) {
          const page = pdfDoc.getPage(i);
          const widthPt = page.getWidth();
          const heightPt = page.getHeight();
          const widthMm = CalibrationEngineV2.ptToMm(widthPt);
          const heightMm = CalibrationEngineV2.ptToMm(heightPt);

          physicalPages.push({
            pageIndex: i,
            widthPt,
            heightPt,
            widthMm,
            heightMm,
          });
        }

        setCachedPdfInfo({
          bytes: pdfBytes,
          hash: pdfHash,
          physicalPages,
        });

        // Actualizar el MasterTemplateV2 en el registro oficial con las dimensiones físicas reales
        const canonicalType = mapDocTypeToCanonical(docType);
        updateMasterTemplateWithPhysicalPdf(canonicalType, pdfHash, physicalPages);

        // Ingesta y análisis geométrico universal automático
        if (canonicalType !== 'lab_order') {
          try {
            const analysis = await UniversalMasterAnalyzer.analyze(pdfBytes, pdfHash);
            const autoMaster = SemanticFieldResolver.buildMasterTemplate(
              analysis,
              `${canonicalType.toUpperCase()}-AUTO`,
              canonicalType,
              docType
            );
            setMasterTemplateV2(canonicalType, autoMaster);
            setReviewMaster(autoMaster);
            setReviewPdfBytes(pdfBytes);
          } catch (e) {
            console.error('Error en UniversalMasterAnalyzer:', e);
          }
        } else {
          const labMaster = getMasterTemplateV2('lab_order');
          if (labMaster) {
            setReviewMaster(labMaster);
            setReviewPdfBytes(pdfBytes);
          }
        }
      }

      // Optimizar preview rasterizada para visualización en pantalla
      const result: OptimizedAssetResult = await optimizeStationeryImage(file, {
        maxWidth: 2480, // A4 300 DPI estándar para preview
        maxHeight: 3508,
        quality: 0.90, // Calidad médica nítida
        preferWebP: true,
        generateLqip: true,
      });

      const originalBlob = isPdf && pdfBytes ? new Blob([toBlobPart(pdfBytes)], { type: 'application/pdf' }) : undefined;

      // CASO A: Documento multipágina en ORDEN_LAB (con 2 o más páginas)
      if (docType === 'ORDEN_LAB' && result.pages && result.pages.length >= 2) {
        const p1 = result.pages[0];
        const p2 = result.pages[1];

        const meta1: Partial<StoredTemplateRecord> = {
          lqipDataUrl: p1.lqipDataUrl,
          originalSizeBytes: isPdf && pdfBytes ? pdfBytes.length : p1.originalSizeBytes,
          optimizedSizeBytes: p1.optimizedSizeBytes,
          savedPercentage: p1.savedPercentage,
          width: p1.width,
          height: p1.height,
          mimeType: p1.mimeType,
          originalPdfBlob: originalBlob,
          originalPdfBytes: pdfBytes || undefined,
          originalPdfHash: pdfHash || undefined,
          physicalPages: physicalPages.length > 0 ? physicalPages : undefined,
        };

        const meta2: Partial<StoredTemplateRecord> = {
          lqipDataUrl: p2.lqipDataUrl,
          originalSizeBytes: isPdf && pdfBytes ? pdfBytes.length : p2.originalSizeBytes,
          optimizedSizeBytes: p2.optimizedSizeBytes,
          savedPercentage: p2.savedPercentage,
          width: p2.width,
          height: p2.height,
          mimeType: p2.mimeType,
          originalPdfBlob: originalBlob,
          originalPdfBytes: pdfBytes || undefined,
          originalPdfHash: pdfHash || undefined,
          physicalPages: physicalPages.length > 0 ? physicalPages : undefined,
        };

        setOptimizationStats((prev) => ({
          ...prev,
          ORDEN_LAB: meta1,
          ORDEN_LAB_P2: meta2,
        }));

        onSaveTemplate('ORDEN_LAB', p1.dataUrl, meta1);
        onSaveTemplate('ORDEN_LAB_P2', p2.dataUrl, meta2);

        // Respaldar permanentemente en el servidor en public/templates/
        try {
          if (pdfBytes) {
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < pdfBytes.length; i += chunkSize) {
              const chunk = pdfBytes.subarray(i, i + chunkSize);
              binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
            }
            fetch('/api/templates/upload-master', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                docType: 'ORDEN_LAB',
                fileBase64: btoa(binary),
                isPdf: true,
              }),
            }).catch(console.warn);
          }
        } catch (serverErr) {
          console.warn('Aviso guardando en servidor:', serverErr);
        }

        // Respaldar en Firestore Cloud (disponible para todos los teléfonos y terminales)
        try {
          FirestoreStationerySync.uploadSingleTemplateToCloud('ORDEN_LAB', {
            dataUrl: p1.dataUrl,
            width: p1.width,
            height: p1.height,
            lqipDataUrl: p1.lqipDataUrl,
            mimeType: 'image/webp',
            updatedAt: new Date().toISOString(),
          }).catch(console.warn);

          FirestoreStationerySync.uploadSingleTemplateToCloud('ORDEN_LAB_P2', {
            dataUrl: p2.dataUrl,
            width: p2.width,
            height: p2.height,
            lqipDataUrl: p2.lqipDataUrl,
            mimeType: 'image/webp',
            updatedAt: new Date().toISOString(),
          }).catch(console.warn);
        } catch (cloudErr) {
          console.warn('Aviso guardando en nube Firestore:', cloudErr);
        }

        const physInfo = physicalPages.length > 0 
          ? ` [Físico: ${physicalPages[0].widthMm.toFixed(1)} × ${physicalPages[0].heightMm.toFixed(1)} mm]` 
          : '';

        setMultiPageNotice(
          `¡Documento PDF maestro V2 procesado con éxito (${result.pages.length} páginas)! Se preservó el PDF original en IndexedDB y se calibró físicamente: Página 1 (Laboratorio) y Página 2 (Neuroimagen).${physInfo}`
        );
        return;
      }

      // CASO B: Documento multipágina en otro tipo de formato
      if (result.pages && result.pages.length > 1) {
        setPdfExtractedPages(result.pages);
      }

      // CASO C: Guardar en la clave efectiva
      const targetKey = docType === 'ORDEN_LAB' 
        ? (labSubPage === 1 ? 'ORDEN_LAB' : 'ORDEN_LAB_P2') 
        : docType;

      const meta: Partial<StoredTemplateRecord> = {
        lqipDataUrl: result.lqipDataUrl,
        originalSizeBytes: isPdf && pdfBytes ? pdfBytes.length : result.originalSizeBytes,
        optimizedSizeBytes: result.optimizedSizeBytes,
        savedPercentage: result.savedPercentage,
        width: result.width,
        height: result.height,
        mimeType: result.mimeType,
        originalPdfBlob: originalBlob,
        originalPdfBytes: pdfBytes || undefined,
        originalPdfHash: pdfHash || undefined,
        physicalPages: physicalPages.length > 0 ? physicalPages : undefined,
      };

      setOptimizationStats((prev) => ({ ...prev, [targetKey]: meta }));
      onSaveTemplate(targetKey, result.dataUrl, meta);

      // Respaldar permanentemente en el servidor en public/templates/
      try {
        let base64ToSend = '';
        if (pdfBytes) {
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < pdfBytes.length; i += chunkSize) {
            const chunk = pdfBytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
          }
          base64ToSend = btoa(binary);
        } else if (result.dataUrl) {
          base64ToSend = result.dataUrl;
        }

        if (base64ToSend) {
          fetch('/api/templates/upload-master', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              docType: targetKey,
              fileBase64: base64ToSend,
              isPdf: Boolean(pdfBytes),
            }),
          }).catch(console.warn);
        }
      } catch (serverErr) {
        console.warn('Aviso guardando en servidor:', serverErr);
      }

      // Respaldar en Firestore Cloud (disponible para todos los teléfonos y terminales)
      try {
        FirestoreStationerySync.uploadSingleTemplateToCloud(targetKey, {
          dataUrl: result.dataUrl,
          width: result.width,
          height: result.height,
          lqipDataUrl: result.lqipDataUrl,
          mimeType: result.mimeType || 'image/webp',
          updatedAt: new Date().toISOString(),
        }).catch(console.warn);
      } catch (cloudErr) {
        console.warn('Aviso guardando en nube Firestore:', cloudErr);
      }

      const physDetail = physicalPages.length > 0 
        ? ` (Físico: ${physicalPages[0].widthMm.toFixed(1)} × ${physicalPages[0].heightMm.toFixed(1)} mm)` 
        : '';

      if (docType === 'ORDEN_LAB') {
        setMultiPageNotice(
          `Página ${labSubPage} (${labSubPage === 1 ? 'Laboratorio Clínico' : 'Estudios Especiales / Neuroimagen'}) actualizada con éxito en arquitectura V2.${physDetail}`
        );
      } else {
        setMultiPageNotice(
          `Plantilla maestra V2 cargada y preservada como PDF original.${physDetail}`
        );
      }
    } catch (err: any) {
      console.warn('Aviso procesando plantilla:', err.message);
      // Fallback básico con FileReader si el archivo es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = event.target?.result as string;
          if (res) {
            const targetKey = docType === 'ORDEN_LAB' 
              ? (labSubPage === 1 ? 'ORDEN_LAB' : 'ORDEN_LAB_P2') 
              : docType;
            onSaveTemplate(targetKey, res);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setUploadError(err.message || 'No se pudo procesar el archivo. Compruebe que sea un PDF oficial o una imagen JPG/PNG válida.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const applySpecificPdfPage = (docType: DocType, page: OptimizedPageResult) => {
    const targetKey = docType === 'ORDEN_LAB' 
      ? (labSubPage === 1 ? 'ORDEN_LAB' : 'ORDEN_LAB_P2') 
      : docType;

    const originalBlob = cachedPdfInfo?.bytes ? new Blob([cachedPdfInfo.bytes], { type: 'application/pdf' }) : undefined;

    const meta: Partial<StoredTemplateRecord> = {
      lqipDataUrl: page.lqipDataUrl,
      originalSizeBytes: cachedPdfInfo?.bytes ? cachedPdfInfo.bytes.length : page.originalSizeBytes,
      optimizedSizeBytes: page.optimizedSizeBytes,
      savedPercentage: page.savedPercentage,
      width: page.width,
      height: page.height,
      mimeType: page.mimeType,
      originalPdfBlob: originalBlob,
      originalPdfBytes: cachedPdfInfo?.bytes || undefined,
      originalPdfHash: cachedPdfInfo?.hash || undefined,
      physicalPages: cachedPdfInfo?.physicalPages || undefined,
    };

    setOptimizationStats((prev) => ({ ...prev, [targetKey]: meta }));
    onSaveTemplate(targetKey, page.dataUrl, meta);
    setMultiPageNotice(`Página ${page.pageNumber} del PDF asignada exitosamente con PDF maestro V2.`);
    setPdfExtractedPages(null);
  };

  const handleFileUpload = (docType: DocType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(docType, file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(selectedDoc, file);
    }
  };

  const handleResetAllClick = async () => {
    if (onResetAll) {
      onResetAll();
    } else {
      await resetAllCustomTemplates();
    }
    setOptimizationStats({});
    setMultiPageNotice('Todas las plantillas han sido restablecidas a las versiones de fábrica.');
  };

  const docList: Array<{ id: DocType; label: string; description: string; defaultFile: string }> = [
    {
      id: 'RECIPES',
      label: '1. Récipe Médico (Doble Talón Rp. / Indicaciones)',
      description: 'Hoja membretada oficial dividida en 2 talones: Dispensación izquierda e Indicaciones derecha.',
      defaultFile: '/templates/recipes_bg.jpg',
    },
    {
      id: 'INFORME',
      label: '2. Informe Médico Especializado',
      description: 'Hoja membretada para Anamnesis, Examen Neurológico, RMN/TAC y Plan Quirúrgico.',
      defaultFile: '/templates/informe_bg.jpg',
    },
    {
      id: 'ORDEN_LAB',
      label: '3. Orden de Laboratorio e Imágenes (2 Páginas)',
      description: 'Pág. 1: Laboratorio Clínico y Perfil Preoperatorio • Pág. 2: Estudios Especiales y Neuroimagen.',
      defaultFile: '/templates/orden_lab_p1_bg.jpg',
    },
    {
      id: 'CONSTANCIA',
      label: '4. Constancia Médica / Reposo',
      description: 'Certificado de asistencia a consulta y justificativo médico con días de reposo.',
      defaultFile: '/templates/constancia_bg.jpg',
    },
    {
      id: 'HISTORIA',
      label: '5. Historia Clínica Especializada',
      description: 'Ficha médica integral con líneas preimpresas para registro y control de consultas.',
      defaultFile: '/templates/historia_bg.jpg',
    },
  ];

  const effectiveKey = selectedDoc === 'ORDEN_LAB' 
    ? (labSubPage === 1 ? 'ORDEN_LAB' : 'ORDEN_LAB_P2') 
    : selectedDoc;

  const currentBg = customBgs[effectiveKey] || null;

  const defaultFile = selectedDoc === 'ORDEN_LAB'
    ? (labSubPage === 1 ? '/templates/orden_lab_p1_bg.jpg' : '/templates/orden_lab_p2_bg.jpg')
    : (docList.find((d) => d.id === selectedDoc)?.defaultFile || '/templates/recipes_bg.jpg');

  const currentDef = docList.find((d) => d.id === selectedDoc);
  const currentStats = optimizationStats[effectiveKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Cargador & Optimizador de Papelería Original (300 DPI)</span>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> Multi-Página Pro
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Optimiza y convierte escaneos de alta resolución a WebP/JPEG con soporte nativo para documentos de varias páginas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Columna Izquierda: Selector de Documentos (5 Docs) */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
              Seleccione el Documento a Personalizar
            </div>
            {docList.map((doc) => {
              const isSelected = selectedDoc === doc.id;
              const isLab = doc.id === 'ORDEN_LAB';
              const p1Custom = !!customBgs['ORDEN_LAB'];
              const p2Custom = !!customBgs['ORDEN_LAB_P2'];
              const hasCustom = isLab ? (p1Custom || p2Custom) : !!customBgs[doc.id];
              const stats = isLab ? (optimizationStats['ORDEN_LAB'] || optimizationStats['ORDEN_LAB_P2']) : optimizationStats[doc.id];

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoc(doc.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-950/50'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
                        {doc.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {doc.description}
                    </p>
                    {stats && stats.optimizedSizeBytes && (
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-cyan-300 font-mono">
                        <span>{formatBytes(stats.optimizedSizeBytes)}</span>
                        {stats.savedPercentage ? (
                          <span className="text-emerald-400 font-bold">(-{stats.savedPercentage}%)</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {isLab ? (
                      p1Custom && p2Custom ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Pág 1 & 2
                        </span>
                      ) : p1Custom ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-700/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Pág 1
                        </span>
                      ) : p2Custom ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-700/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Pág 2
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                          2 Págs Base
                        </span>
                      )
                    ) : hasCustom ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Original
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                        Base
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Botón Restaurar todas */}
            <button
              type="button"
              onClick={handleResetAllClick}
              className="mt-3 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-red-400 hover:border-red-900/60 hover:bg-red-950/30 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer todas a las plantillas base</span>
            </button>
          </div>

          {/* Columna Derecha: Carga y Vista Previa del Documento Seleccionado */}
          <div className="md:col-span-7 flex flex-col gap-4 bg-slate-950/60 p-4 rounded-3xl border border-slate-800/80">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-cyan-400" />
                  {currentDef?.label}
                </h3>
                {currentBg && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Original Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentDef?.description}
              </p>
            </div>

            {/* Sub-selector de Páginas para Orden de Laboratorio */}
            {selectedDoc === 'ORDEN_LAB' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setLabSubPage(1)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      labSubPage === 1
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Pág. 1: Laboratorio Clínico</span>
                    {customBgs['ORDEN_LAB'] ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 rounded-full border border-emerald-700">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Original
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-normal">(Base)</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLabSubPage(2)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      labSubPage === 2
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Pág. 2: Estudios Especiales</span>
                    {customBgs['ORDEN_LAB_P2'] ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 rounded-full border border-emerald-700">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Original
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-normal">(Base)</span>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 p-2.5 rounded-xl flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Carga Automática de 2 Páginas:</strong> Al cargar un archivo PDF de 2 páginas, el sistema asignará automáticamente la <strong>Página 1</strong> a Laboratorio Clínico y la <strong>Página 2</strong> a Neuroimagen / Estudios Especiales. También puede cargar imágenes individuales para cada página.
                  </span>
                </div>
              </div>
            )}

            {/* Aviso de Detección Multipágina */}
            {multiPageNotice && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-700/80 rounded-2xl flex items-start justify-between gap-3 text-xs text-emerald-200 animate-fade-in">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{multiPageNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMultiPageNotice(null)}
                  className="text-emerald-400 hover:text-emerald-200 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Selector de Páginas si el PDF subido a otro documento tiene múltiples páginas */}
            {pdfExtractedPages && pdfExtractedPages.length > 1 && (
              <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-2xl flex flex-col gap-2 text-xs text-blue-200 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Se detectaron {pdfExtractedPages.length} páginas en el PDF. Seleccione cuál asignar a {currentDef?.label}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPdfExtractedPages(null)}
                    className="text-blue-400 hover:text-blue-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {pdfExtractedPages.map((pg) => (
                    <button
                      key={pg.pageNumber}
                      type="button"
                      onClick={() => applySpecificPdfPage(selectedDoc, pg)}
                      className="px-3 py-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-white font-medium text-xs border border-blue-700 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <span>Página {pg.pageNumber}</span>
                      <span className="text-[10px] text-cyan-300">({formatBytes(pg.optimizedSizeBytes)})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zona de Carga / Drag and Drop con Optimización en Vivo */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex flex-col sm:flex-row items-stretch gap-3"
            >
              <label className={`flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition cursor-pointer group text-center ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                  : 'border-blue-500/50 hover:border-blue-400 bg-blue-950/20 hover:bg-blue-900/30'
              }`}>
                {isProcessing ? (
                  <div className="flex flex-col items-center py-2">
                    <Loader2 className="w-7 h-7 text-cyan-400 animate-spin mb-1.5" />
                    <span className="text-xs font-bold text-cyan-300">Optimizando a 300 DPI WebP...</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Rasterizando páginas y generando micro-placeholders</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-7 h-7 text-blue-400 group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-xs font-bold text-white">
                      {selectedDoc === 'ORDEN_LAB'
                        ? (currentBg ? `Reemplazar Pág. ${labSubPage} (o arrastre PDF de 2 páginas)` : `Cargar Pág. ${labSubPage} o PDF de 2 páginas completo`)
                        : (currentBg ? 'Reemplazar con nuevo archivo' : 'Cargar Escaneo o Archivo de Imprenta')}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Arrastre aquí o haga clic • PDF multipágina oficial, JPG, PNG o WebP (A4 300 DPI auto-optimizado)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
                  onChange={(e) => handleFileUpload(selectedDoc, e)}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>

              {currentBg && (
                <div className="flex flex-col gap-1.5 shrink-0 justify-center">
                  <button
                    type="button"
                    onClick={() => onRemoveTemplate(effectiveKey)}
                    className="px-3 py-3 rounded-2xl bg-red-950/50 hover:bg-red-900/70 border border-red-800/60 text-red-300 text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                    title={`Quitar imagen personalizada de ${effectiveKey === 'ORDEN_LAB_P2' ? 'Página 2' : 'Página 1'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{selectedDoc === 'ORDEN_LAB' ? `Quitar Pág. ${labSubPage}` : 'Quitar'}</span>
                  </button>
                  {selectedDoc === 'ORDEN_LAB' && customBgs['ORDEN_LAB'] && customBgs['ORDEN_LAB_P2'] && (
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveTemplate('ORDEN_LAB');
                        onRemoveTemplate('ORDEN_LAB_P2');
                      }}
                      className="text-[10px] text-red-400 hover:underline text-center cursor-pointer py-1"
                    >
                      Quitar ambas
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Alerta si el archivo no pudo ser interpretado */}
            {uploadError && (
              <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-start justify-between gap-3 text-xs text-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-red-400 hover:text-red-200 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Tarjeta de Métricas de Optimización de Assets y Master V2 Físico */}
            {currentStats && (
              <div className="p-3 bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/50 border border-cyan-900/40 rounded-2xl flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-[11px]">
                        Rendimiento de {effectiveKey === 'ORDEN_LAB_P2' ? 'Página 2 (Neuroimagen)' : (effectiveKey === 'ORDEN_LAB' ? 'Página 1 (Laboratorio)' : 'Asset')}:
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {currentStats.width && currentStats.height ? `${currentStats.width} × ${currentStats.height} px` : '300 DPI A4'} 
                        {currentStats.mimeType ? ` • ${currentStats.mimeType.replace('image/', '').toUpperCase()}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {currentStats.originalSizeBytes && currentStats.optimizedSizeBytes ? (
                      <div className="text-right">
                        <span className="text-slate-400 line-through text-[10px] mr-1">
                          {formatBytes(currentStats.originalSizeBytes)}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {formatBytes(currentStats.optimizedSizeBytes)}
                        </span>
                        {currentStats.savedPercentage ? (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-bold border border-emerald-800/60">
                            -{currentStats.savedPercentage}%
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-bold">300 DPI Vectorial</span>
                    )}
                  </div>
                </div>

                {/* Badge de PDF Maestro Físico V2 e información geométrica real */}
                {currentStats.physicalPages && currentStats.physicalPages.length > 0 && (
                  <div className="pt-2 border-t border-cyan-900/40 flex items-center justify-between text-[10px] font-mono text-cyan-200">
                    <span className="flex items-center gap-1 text-emerald-300 font-bold">
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      PDF Maestro V2 Original Activo
                    </span>
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-800/60 text-cyan-300">
                      Geometría Real: {currentStats.physicalPages[0].widthMm.toFixed(1)} × {currentStats.physicalPages[0].heightMm.toFixed(1)} mm ({currentStats.physicalPages[0].widthPt.toFixed(1)} × {currentStats.physicalPages[0].heightPt.toFixed(1)} pt)
                    </span>
                    {currentStats.originalPdfHash && (
                      <span className="text-slate-400 text-[9px] hidden sm:inline" title={currentStats.originalPdfHash}>
                        SHA-256: {currentStats.originalPdfHash.slice(0, 10)}...
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Vista Previa de la Plantilla Actual */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 bg-slate-900 rounded-2xl border border-slate-800 relative min-h-[240px] overflow-hidden">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 w-full flex justify-between px-2 items-center">
                <span>
                  Vista Previa: {selectedDoc === 'ORDEN_LAB' ? `Página ${labSubPage} (${labSubPage === 1 ? 'Laboratorio Clínico' : 'Neuroimagen'})` : currentDef?.label}
                  {currentBg ? ' • Original Optimizado' : ' • Plantilla Base'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewZoomUrl(currentBg || defaultFile)}
                    className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> Ampliar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const canonical = mapDocTypeToCanonical(selectedDoc);
                      const m = getMasterTemplateV2(canonical);
                      if (m) {
                        setReviewMaster(m);
                        setReviewPdfBytes(currentStats?.originalPdfBytes);
                        setIsReviewModalOpen(true);
                      }
                    }}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer font-bold ml-2"
                  >
                    <Compass className="w-3 h-3" /> Auditar y Calibrar Master
                  </button>
                </div>
              </div>
              <div className="relative w-[180px] h-[254px] rounded-lg shadow-xl overflow-hidden border border-slate-700 bg-white">
                <img
                  src={currentBg || defaultFile}
                  alt={`Vista previa de ${effectiveKey}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Nota Informativa */}
            <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-2xl flex items-start gap-2.5 text-[11px] text-blue-200">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Compatibilidad Multipágina:</strong> El cargador procesa automáticamente documentos PDF con varias páginas (como las dos caras de la Orden de Laboratorio e Imágenes) y almacena cada página con resolución de imprenta (300 DPI) para emisión y descarga instantánea.
              </span>
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Optimizador de memoria activo • IndexedDB multipágina acelerado.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 transition cursor-pointer"
          >
            Listo y Usar Plantillas
          </button>
        </div>
      </div>

      {/* Modal de Zoom de Imagen */}
      {previewZoomUrl && (
        <div className="fixed inset-0 z-60 bg-black/90 p-4 flex items-center justify-center" onClick={() => setPreviewZoomUrl(null)}>
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={previewZoomUrl} alt="Zoom" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" />
            <button
              type="button"
              onClick={() => setPreviewZoomUrl(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Universal de Revisión, Auditoría y Calibración */}
      {isReviewModalOpen && reviewMaster && (
        <MasterReviewPanelModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          masterTemplate={reviewMaster}
          originalPdfBytes={reviewPdfBytes}
          onMasterUpdated={(updated) => {
            setReviewMaster(updated);
            setMasterTemplateV2(updated.documentType, updated);
          }}
        />
      )}
    </div>
  );
};
