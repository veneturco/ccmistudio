import React, { useState, useEffect, useRef } from 'react';
import { 
  Pill, 
  FileText, 
  FlaskConical, 
  CalendarCheck, 
  ClipboardList, 
  Printer, 
  Stamp, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Eye, 
  Edit3, 
  Share2, 
  Save, 
  Search, 
  Layers, 
  Sliders,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Image as ImageIcon,
  AlertTriangle,
  UploadCloud,
  Trash2,
  CheckCircle2,
  Maximize2,
  CreditCard,
  Mic,
  Settings,
  User,
  Phone,
  Calendar,
  Download,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Cloud,
  Code2,
  Move,
  Crosshair,
  Sun,
  Moon,
  QrCode,
  History
} from 'lucide-react';
import { OfficialMedicalStamp } from './OfficialMedicalStamp';
import { ClinicalDictationCapsule } from './ClinicalDictationCapsule';
import { SamiCopilot } from './SamiCopilot';
import { QuickVoiceCorrectionWidget } from './QuickVoiceCorrectionWidget';
import { WhatsAppPdfModal } from './WhatsAppPdfModal';
import { OfficialQrCode } from './OfficialQrCode';
import { InteractiveField } from './InteractiveField';
import { DoctorBusinessCard } from './DoctorBusinessCard';
import { SyncTemplatesModal } from './SyncTemplatesModal';
import { BrandLogo } from './BrandLogo';
import { OptimizedA4Background } from './OptimizedA4Background';
import { StationeryTemplateUploaderModal } from './StationeryTemplateUploaderModal';
import { LiveCoordinateCalibratorModal } from './LiveCoordinateCalibratorModal';
import { OriginalPdfViewerModal } from './OriginalPdfViewerModal';
import { TechnicalToolsModal } from './TechnicalToolsModal';
import { CloudStatusIndicator } from './CloudStatusIndicator';
import { PatientTimelineDrawer } from './PatientTimelineDrawer';
import { PatientQrHandoffModal } from './PatientQrHandoffModal';
import { StampSignatureStudioModal } from './StampSignatureStudioModal';
import { SmartConsultationDictationModal } from './SmartConsultationDictationModal';
import { MobileDocumentCardView } from './MobileDocumentCardView';
import { UserSettingsModal } from './UserSettingsModal';
import { useTheme } from '../context/ThemeContext';
import { ConstanciaMedicalSheet } from './ConstanciaMedicalSheet';
import { OfficialLabOrderTwoPageSheet } from './OfficialLabOrderTwoPageSheet';
import { RecipesMedicalSheet } from './RecipesMedicalSheet';
import { PatientHeaderInstitutionalBar } from './PatientHeaderInstitutionalBar';
import { NEUROSURGERY_PRESETS, ClinicalProtocolPreset } from '../utils/clinicalPresets';
import { ClinicalPresetsModal } from './ClinicalPresetsModal';
import { 
  DOCUMENT_DEFINITIONS, 
  TEMPLATE_IMAGE_PATHS,
  generateCanonicalDocumentPDF,
  downloadBlob,
  exportOfficialLabOrderPDF,
  exportOfficialHistoriaPDF,
  exportOfficialRecipePDF,
  exportOfficialInformePDF,
  exportOfficialConstanciaPDF,
  ClinicalDataBundle
} from '../utils/pdfExport';
import { PDFDocumentPipelineV2 } from '../utils/PDFDocumentPipelineV2';
import { getPatientByCedula, savePatientRecord, getAllPatients, PatientRecord } from '../utils/patientStorage';
import { getAllCustomTemplates, saveCustomTemplate, removeCustomTemplate, resetAllCustomTemplates } from '../utils/templateStorage';
import { FirestoreStationerySync } from '../cloud/FirestoreStationerySync';
import { scanAndCalibrateWithGeminiVision } from '../utils/aiLayoutEngine';
import { 
  getOfficialTemplateUrl, 
  preloadAllOfficialTemplates, 
  EMBEDDED_TEMPLATES 
} from '../assets/embeddedTemplates';
import { 
  DEFAULT_CALIBRATIONS,
  getStoredCalibration,
  saveStoredCalibration,
  resetStoredCalibration
} from '../utils/calibrationStorage';
import { FieldCalibration, DocumentCalibration } from '../types/calibration';
import { DocType, PatientData } from '../types';
import { TemplateRegistry } from '../calibration/TemplateRegistry';
import labMasterJson from '../calibration/masters/lab.master.json';

const MASTER_P1_CHECKBOXES = Array.isArray(labMasterJson.pages)
  ? (labMasterJson.pages[0]?.elements || []).filter((el: any) => el.type === 'checkbox')
  : [];

function mapTestsToCanonical(testItems: string[], currentLabTests: Record<string, boolean>) {
  const newLab = { ...currentLabTests };
  const unmapped: string[] = [];

  const isDataKeyOrInternalKey = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    const s = str.trim();
    if (/\b(orden_p1|orden_p2|cb_|clinical\.|patient\.|document\.|recipe\.|certificate\.|labTests\.|lab_order)\b/i.test(s)) return true;
    if (s.includes('.')) return true;
    if (/^(rmn|tac|radiologia|radiología|rx|eeg|emg|pess|valoracion|valoración|resonancia|tomografia|tomografía|radiografia|radiografía|rayos\s*x|electroencefalograma|electromiografia|electromiografía|potenciales\s*evocados|riesgo\s*quirurgico|riesgo\s*quirúrgico)$/i.test(s)) return true;
    if (/^(perfil\s*(preoperatorio|20|lipidico|lipídico|hepatico|hepático|tiroideo|renal)|laboratorio|laboratorios|tests|estudios)$/i.test(s)) return true;
    return false;
  };

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').trim();

  testItems.forEach((test) => {
    if (!test || !test.trim() || isDataKeyOrInternalKey(test)) return;
    let matched = false;

    // A. Match directo con checkboxes del Master V2 (dataKey, rawKey, label, id)
    for (const cb of MASTER_P1_CHECKBOXES) {
      const rawKey = cb.dataKey.replace(/^labTests\./, '');
      const cbLabel = (cb as any).label || '';
      if (test === cb.dataKey || test === rawKey || (cbLabel && test === cbLabel) || test === cb.id) {
        newLab[rawKey] = true;
        matched = true;
        break;
      }
    }
    if (matched) return;

    const norm = normalize(test);

    // B. Reglas semánticas clínicas hacia casillas físicas del Master
    if (/\b(sodio|potasio|cloro|electrolito|electrolitos|ionograma|na|k|cl)\b/.test(norm)) {
      newLab['Electrolitos Séricos (Na, K, Cl)'] = true;
      matched = true;
    } else if (/\b(calcio|fosforo|calcemia|ca|p)\b/.test(norm)) {
      newLab['Calcio Sérico / Fósforo'] = true;
      matched = true;
    } else if (/\b(transaminasas|tgo|tgp|ast|alt)\b/.test(norm)) {
      newLab['Transaminasas (TGO / TGP)'] = true;
      matched = true;
    } else if (/\b(lipidico|lipidos|colesterol|trigliceridos)\b/.test(norm)) {
      newLab['HDL / LDL Colesterol'] = true;
      matched = true;
    } else if (/\b(tiroideo|tiroides|tsh|t3|t4)\b/.test(norm)) {
      newLab['T3, T4 Libre y TSH'] = true;
      matched = true;
    } else if (/\b(hematologia|hemograma|formula|leucocitos|hemoglobina|hematocrito|cbc)\b/.test(norm)) {
      newLab['Hematología Completa'] = true;
      matched = true;
    } else if (/\b(glicemia|glucosa|hba1c|insulina|azucar)\b/.test(norm)) {
      newLab['Glicemia'] = true;
      matched = true;
    } else if (/\b(urea|bun)\b/.test(norm)) {
      newLab['Urea'] = true;
      matched = true;
    } else if (/\b(creatinina)\b/.test(norm)) {
      newLab['Creatinina'] = true;
      matched = true;
    } else if (/\b(orina|uroanalisis|ego)\b/.test(norm)) {
      newLab['Examen General de Orina'] = true;
      matched = true;
    } else if (/\b(preoperatorio)\b/.test(norm)) {
      newLab['Perfil Preoperatorio Completo'] = true;
      matched = true;
    } else if (/\b(coagulacion|coagulación|tiempos de coagulacion|tiempos de coagulación|hemostasia)\b/.test(norm)) {
      newLab['Pt (Tiempo Protrombina)'] = true;
      newLab['Ptt (Tiempo Parcial de Tromboplastina)'] = true;
      matched = true;
    } else if (/\b(tp|pt|protrombina|inr)\b/.test(norm)) {
      newLab['Pt (Tiempo Protrombina)'] = true;
      matched = true;
    } else if (/\b(tpt|ptt|tromboplastina)\b/.test(norm)) {
      newLab['Ptt (Tiempo Parcial de Tromboplastina)'] = true;
      matched = true;
    } else if (/\b(fibrinogeno|fibrinógeno)\b/.test(norm)) {
      newLab['Dosificación de Fibrinógeno'] = true;
      matched = true;
    } else if (/\b(plaqueta|plaquetas|plaquetario)\b/.test(norm)) {
      newLab['Plaquetas'] = true;
      matched = true;
    } else if (/\b(vsg|eritrosedimentacion|eritrosedimentación)\b/.test(norm)) {
      newLab['Eritrosedimentación (VSG)'] = true;
      matched = true;
    } else if (/\b(grupo|rh|tipiaje|factor rh)\b/.test(norm)) {
      newLab['Grupo Sanguíneo, Factor Rh (D)'] = true;
      matched = true;
    } else if (/\b(hiv|vih|sida)\b/.test(norm)) {
      newLab['HIV'] = true;
      matched = true;
    } else if (/\b(vdrl|rpr|luetica|luética|sifilis|sífilis)\b/.test(norm)) {
      newLab['VDRL'] = true;
      matched = true;
    } else if (/\b(pcr|proteina c reactiva|proteína c reactiva)\b/.test(norm)) {
      newLab['Proteina "C" Reactiva'] = true;
      matched = true;
    } else if (/\b(acido urico|ácido úrico|uricemia)\b/.test(norm)) {
      newLab['Ácido Úrico'] = true;
      matched = true;
    } else if (/\b(bilirrubina|bilirrubinas)\b/.test(norm)) {
      newLab['Bilirrubina Total y Fraccionada'] = true;
      matched = true;
    } else if (/\b(amilasa)\b/.test(norm)) {
      newLab['Amilasa'] = true;
      matched = true;
    } else if (/\b(lipasa)\b/.test(norm)) {
      newLab['Lipasa'] = true;
      matched = true;
    } else if (/\b(urocultivo)\b/.test(norm)) {
      newLab['Urocultivo y Antibiograma'] = true;
      matched = true;
    } else if (/\b(coproanalisis|coproanálisis|heces)\b/.test(norm)) {
      newLab['Coproanálisis'] = true;
      matched = true;
    }

    // C. Búsqueda normalizada contra todos los checkboxes del Master
    if (!matched) {
      for (const cb of MASTER_P1_CHECKBOXES) {
        const rawKey = cb.dataKey.replace(/^labTests\./, '');
        const normRaw = normalize(rawKey);
        const normLabel = normalize((cb as any).label || '');
        if (norm === normRaw || (normLabel && norm === normLabel) || (norm.length >= 4 && (normRaw.includes(norm) || (normLabel && normLabel.includes(norm))))) {
          newLab[rawKey] = true;
          matched = true;
          break;
        }
      }
    }

    // D. Si no es checkbox físico, pasa a Otros Exámenes (ej: Magnesio)
    if (!matched) {
      unmapped.push(test);
    }
  });

  return { newLab, unmapped };
}

export type { DocType };
type PatientBase = PatientData;

interface Props {
  initialPatient?: Partial<PatientBase>;
  initialDocType?: DocType;
  initialPresetData?: {
    diagnosis?: string;
    cie10?: string;
    rp?: string;
    indications?: string;
    restDays?: number;
    labProfile?: string;
  };
  onOpenZoneEditor?: () => void;
  onPatientChange?: (patient: PatientBase) => void;
}

export const DocumentSelectorWorkspace: React.FC<Props> = ({
  initialPatient,
  initialDocType,
  initialPresetData,
  onOpenZoneEditor,
  onPatientChange,
}) => {
  const { isClinicalLight, isAutoSchedule, toggleTheme } = useTheme();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  // Modo Consulta Silenciosa (Ergonomía No Invasiva para Doctores)
  const [isZenMode, setIsZenMode] = useState<boolean>(true);
  // 1. Selector del Documento Activo (Exactamente las 5 Plantillas Oficiales)
  const [activeDoc, setActiveDoc] = useState<DocType>(initialDocType || 'RECIPES');

  // 2. Controles de Visualización, Zonas Editables y Sello Oficial
  const [showZoneGuides, setShowZoneGuides] = useState<boolean>(true);
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState<Set<string>>(new Set());
  const [uncertainFields, setUncertainFields] = useState<string[]>([]);
  const [isWhatsAppPdfModalOpen, setIsWhatsAppPdfModalOpen] = useState<boolean>(false);
  const [isDoctorCardOpen, setIsDoctorCardOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState<boolean>(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState<boolean>(false);
  const [foundPatientAlert, setFoundPatientAlert] = useState<PatientRecord | null>(null);
  const [customBgs, setCustomBgs] = useState<Record<string, string>>({});
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const [isLiveCalibratorOpen, setIsLiveCalibratorOpen] = useState<boolean>(false);
  const [isOriginalPdfModalOpen, setIsOriginalPdfModalOpen] = useState<boolean>(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);
  const [isQrHandoffOpen, setIsQrHandoffOpen] = useState<boolean>(false);
  const [isStampStudioOpen, setIsStampStudioOpen] = useState<boolean>(false);
  const [isSmartDictationOpen, setIsSmartDictationOpen] = useState<boolean>(false);
  const [calibratingAiToast, setCalibratingAiToast] = useState<string | null>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // === MODO PROGRAMADOR / TALLER DE CALIBRACIÓN MAESTRA & MOTOR IA ===
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<'real' | 'stress'>('real');
  const [activeCalibrations, setActiveCalibrations] = useState<Record<DocType, DocumentCalibration>>(() => ({
    RECIPES: getStoredCalibration('RECIPES'),
    INFORME: getStoredCalibration('INFORME'),
    ORDEN_LAB: getStoredCalibration('ORDEN_LAB'),
    CONSTANCIA: getStoredCalibration('CONSTANCIA'),
    HISTORIA: getStoredCalibration('HISTORIA'),
  }));
  const [calibVersion, setCalibVersion] = useState<number>(0);

  // Calibraciones Maestras Dinámicas V2 y Guardadas
  const isCalibrating = false;
  const currentCalibration = activeCalibrations?.[activeDoc] || DEFAULT_CALIBRATIONS?.[activeDoc] || {};

  const getCalib = (fieldId: string): FieldCalibration => {
    // 1. Prioridad V2: Consultar MasterTemplateV2 hidratado en tiempo real desde TemplateRegistry
    const master = TemplateRegistry.get(activeDoc);
    if (master && master.pages?.[0]?.elements) {
      const p0 = master.pages[0];
      const widthMm = p0.widthMm || 210;
      const scale = 794 / widthMm; // Escala A4 en pantalla (794px / 210mm = 3.78095 px/mm)
      
      const normalizedFieldId = fieldId.toLowerCase().trim();
      const match = p0.elements.find((el: any) => {
        const elId = (el.id || '').toLowerCase().trim();
        const elKey = (el.dataKey || '').toLowerCase().trim();
        return (
          elId === normalizedFieldId ||
          elKey === normalizedFieldId ||
          elKey.endsWith(`.${normalizedFieldId}`) ||
          normalizedFieldId.endsWith(`.${elKey}`) ||
          (normalizedFieldId === 'patient.date' && (elId.includes('date') || elKey.includes('date'))) ||
          (normalizedFieldId === 'stamp' && (el.type === 'stamp' || elId.includes('stamp') || elKey.includes('stamp')))
        );
      });

      if (match) {
        const geom = match.geometry || {
          xMm: (match as any).xMm ?? 20,
          yMm: (match as any).yMm ?? 20,
          widthMm: (match as any).widthMm ?? 40,
          heightMm: (match as any).heightMm ?? 8,
        };
        const fontSizePt = (match as any).typography?.fontSizePt ?? (match as any).fontSizePt ?? 11;
        return {
          id: fieldId,
          label: fieldId,
          left: Math.round(geom.xMm * scale),
          top: Math.round(geom.yMm * scale),
          width: Math.round(geom.widthMm * scale),
          height: Math.round(geom.heightMm * scale),
          fontSize: Math.round(fontSizePt * 1.33), // pt to px
        };
      }
    }

    // 2. Fallback secundario
    return activeCalibrations[activeDoc]?.[fieldId] || DEFAULT_CALIBRATIONS[activeDoc]?.[fieldId] || {
      id: fieldId,
      label: fieldId,
      top: 100,
      left: 100,
      width: 200,
      height: 30,
      fontSize: 12,
    };
  };

  const handleUpdateFieldCalibration = (updatedField: FieldCalibration) => {
    setActiveCalibrations((prev) => {
      const currentDocCalib = prev[activeDoc] || {};
      return {
        ...prev,
        [activeDoc]: {
          ...currentDocCalib,
          [updatedField.id]: updatedField,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleApplyWholeCalibration = (newCalib: DocumentCalibration) => {
    setActiveCalibrations((prev) => ({
      ...prev,
      [activeDoc]: newCalib,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAsFactoryDefault = () => {
    saveStoredCalibration(activeDoc, currentCalibration);
    setHasUnsavedChanges(false);
    setSaveStatus(`¡Calibración de fábrica guardada con éxito para ${DOCUMENT_DEFINITIONS[activeDoc]?.shortName || activeDoc}!`);
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleResetDefaults = () => {
    const resetCalib = resetStoredCalibration(activeDoc);
    setActiveCalibrations((prev) => ({
      ...prev,
      [activeDoc]: resetCalib,
    }));
    setHasUnsavedChanges(false);
    setSaveStatus(`Coordenadas restablecidas a valores por defecto de fábrica.`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const loadLocalTemplates = () => {
    getAllCustomTemplates()
      .then((templates) => {
        if (templates && Object.keys(templates).length > 0) {
          setCustomBgs(templates);
        }
      })
      .catch((err) => console.warn('Error cargando plantillas de IndexedDB:', err));
  };

  const handleSaveCustomTemplate = async (docType: DocType | string, dataUrl: string, meta?: any) => {
    const effectiveUrl = dataUrl;
    setCustomBgs((prev) => ({ ...prev, [docType]: effectiveUrl }));
    await saveCustomTemplate(docType, effectiveUrl, meta);
    
    // Sync with cloud instantly
    FirestoreStationerySync.uploadSingleTemplateToCloud(docType, {
      docType,
      dataUrl: effectiveUrl,
      updatedAt: new Date().toISOString(),
      ...meta
    }).catch(err => console.warn('[SYNAPSIS SYNC] Fallo subiendo template:', err));

    const docName = DOCUMENT_DEFINITIONS[docType as DocType]?.shortName || 
      (docType === 'ORDEN_LAB_P2' ? 'Orden Lab (Página 2)' : (docType === 'ORDEN_LAB' ? 'Orden Lab (Página 1)' : docType));
    setSaveStatus(`Papelería oficial para ${docName} actualizada.`);
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleRemoveCustomTemplate = async (docType: DocType | string) => {
    const { [docType]: _, ...rest } = customBgs;
    setCustomBgs(rest);
    await removeCustomTemplate(docType);
    setSaveStatus('Plantilla restablecida a la papelería oficial base.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleResetAllTemplates = async () => {
    setCustomBgs({});
    await resetAllCustomTemplates();
    setSaveStatus('Todas las plantillas han sido restablecidas a la papelería oficial base.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  useEffect(() => {
    // Precarga instantánea de las 5 plantillas oficiales base (300 DPI) para zero layout shifts
    preloadAllOfficialTemplates();
    loadLocalTemplates();

    // Sincronización en tiempo real con el Editor de Zonas A4 y Calibrador Milimétrico V2
    const handleCalibrationSync = (e: any) => {
      const { docType, calibration } = e.detail || {};
      if (docType && calibration) {
        setActiveCalibrations((prev) => ({
          ...prev,
          [docType]: calibration,
        }));
      }
      setCalibVersion((v) => v + 1);
    };

    // Sincronización en tiempo real de papelería oficial desde la nube Firestore
    const handleStationerySync = (e: any) => {
      const { docType, dataUrl } = e.detail || {};
      if (docType && dataUrl) {
        setCustomBgs((prev) => ({
          ...prev,
          [docType]: dataUrl,
        }));
      }
    };

    window.addEventListener('cmi-calibration-updated', handleCalibrationSync);
    window.addEventListener('medical_template_calibrated', handleCalibrationSync);
    window.addEventListener('stationery_cloud_synced', handleStationerySync);
    return () => {
      window.removeEventListener('cmi-calibration-updated', handleCalibrationSync);
      window.removeEventListener('medical_template_calibrated', handleCalibrationSync);
      window.removeEventListener('stationery_cloud_synced', handleStationerySync);
    };
  }, []);

  // Determinar la imagen de fondo activa para la plantilla actual (Custom local si existe, o fija de fábrica)
  const activeBgUrl = customBgs[activeDoc] || getOfficialTemplateUrl(activeDoc);

  // 3. Datos del Paciente Compartidos
  const defaultPatient: PatientBase = {
    fullName: initialPatient?.fullName || '',
    idNumber: initialPatient?.idNumber || '',
    age: initialPatient?.age || '',
    date: initialPatient?.date || new Date().toLocaleDateString('es-VE'),
    phone: initialPatient?.phone || '',
    address: initialPatient?.address || '',
    guideNumber: initialPatient?.guideNumber || '',
    condition: initialPatient?.condition || 'Paciente',
  };

  const [patient, setPatient] = useState<PatientBase>(defaultPatient);

  // Sincronizar paciente activo con el Dashboard y el Copiloto SAMI global
  useEffect(() => {
    onPatientChange?.(patient);
  }, [patient, onPatientChange]);

  // Modo de Vista Móvil: 'sheet' (Hoja A4 Física Calibrada por defecto) o 'card' (Ficha de Bolsillo)
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'sheet'>('sheet');

  // ==========================================
  // ESTADOS DE LOS 5 DOCUMENTOS OFICIALES
  // ==========================================

  // --- 1. RÉCIPE MÉDICO (DOBLE TALÓN) ---
  const [recipeData, setRecipeData] = useState({
    rxLeft: '',
    indicationsRight: '',
  });

  // === MEJORA: AGENTE AUTÓNOMO SAMI (AUTO-FILL) ===
  useEffect(() => {
    const handleSamiAutofill = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.type === 'RECETA') {
        setRecipeData(prev => ({ 
          ...prev, 
          rxLeft: detail.rxLeft || prev.rxLeft, 
          indicationsRight: detail.indicationsRight || prev.indicationsRight 
        }));
      }
    };
    window.addEventListener('sami-autofill', handleSamiAutofill);
    return () => window.removeEventListener('sami-autofill', handleSamiAutofill);
  }, []);
  // ===============================================


  // --- 2. INFORME MÉDICO ---
  const [informeData, setInformeData] = useState({
    bodyText: '',
  });

  // --- 3. ORDEN DE LABORATORIO / IMÁGENES ---
  const [labTests, setLabTests] = useState<Record<string, boolean>>({
    'Hematología Completa': false,
    'Plaquetas': false,
    'Eritrosedimentación (VSG)': false,
    'Pt (Tiempo Protrombina)': false,
    'Ptt (Tiempo Parcial de Tromboplastina)': false,
    'Dosificación de Fibrinógeno': false,
    'Glicemia': false,
    'Urea': false,
    'Creatinina': false,
    'HIV': false,
    'VDRL': false,
    'Grupo Sanguíneo, Factor Rh (D)': false,
    'Proteina "C" Reactiva': false,
    'Examen General de Orina': false,
  });

  const [neuroimagingTests, setNeuroimagingTests] = useState<Record<string, boolean>>({
    'RADIOLOGÍA': false,
    'TOMOGRAFÍA AXIAL COMPUTARIZADA': false,
    'RESONANCIA MAGNÉTICA': false,
    'ELECTROENCEFALOGRAMA': false,
    'ELECTROMIOGRAFIA': false,
    'POTENCIALES EVOCADOS': false,
    'VALORACIÓN': false,
  });

  const [neuroimagingDetails, setNeuroimagingDetails] = useState<Record<string, string>>({});

  const [labPresumptiveDx, setLabPresumptiveDx] = useState<string>('');
  const [labOtherExams, setLabOtherExams] = useState<string>('');
  const [labViewMode, setLabViewMode] = useState<'p1' | 'p2' | 'both'>('both');

  // --- 4. CONSTANCIA MÉDICA / REPOSO ---
  const [constanciaData, setConstanciaData] = useState({
    attendedDate: defaultPatient.date,
    condition: (defaultPatient.condition || 'Paciente') as 'Paciente' | 'Familiar',
    needsRest: false,
    restDays: '00',
    restDaysWords: '',
    restFrom: defaultPatient.date,
    restTo: '-',
    idx: '',
    requestDay: new Date().getDate().toString().padStart(2, '0'),
    requestMonth: new Intl.DateTimeFormat('es-VE', { month: 'long' }).format(new Date()).toUpperCase(),
    requestYear: new Date().getFullYear().toString(),
  });

  // --- 5. HISTORIA CLÍNICA ---
  const [historiaData, setHistoriaData] = useState({
    motivoConsulta: '',
    enfermedadActual: '',
    antecedentes: '',
    examenNeurologico: '',
    diagnostico: '',
  });

  // Hidratación directa desde Widgets de Acceso Rápido Clínico
  useEffect(() => {
    if (!initialPresetData) return;

    if (initialPresetData.rp || initialPresetData.indications) {
      setRecipeData({
        rxLeft: initialPresetData.rp || '',
        indicationsRight: initialPresetData.indications || '',
      });
    }

    if (initialPresetData.diagnosis) {
      setLabPresumptiveDx(initialPresetData.diagnosis);
      setInformeData((prev) => ({
        ...prev,
        bodyText: `DIAGNÓSTICO:\n${initialPresetData.diagnosis}${initialPresetData.cie10 ? ` (CIE-10: ${initialPresetData.cie10})` : ''}\n\nPLAN Y CONDUCTA:\n${initialPresetData.indications || 'Manejo protocolizado en Centro Médico Orinokia.'}`,
      }));
      setConstanciaData((prev) => ({
        ...prev,
        idx: initialPresetData.diagnosis || prev.idx,
        needsRest: Boolean(initialPresetData.restDays),
        restDays: initialPresetData.restDays ? String(initialPresetData.restDays).padStart(2, '0') : prev.restDays,
      }));
    }

    if (initialPresetData.labProfile === 'Neuroimagen de Columna') {
      setNeuroimagingTests((prev) => ({ ...prev, 'RESONANCIA MAGNÉTICA': true }));
      setNeuroimagingDetails((prev) => ({
        ...prev,
        'RESONANCIA MAGNÉTICA': initialPresetData.indications || 'RMN Columna Lumbar con cortes sagitales y axiales.',
      }));
    } else if (initialPresetData.labProfile === 'Preoperatorio Completo') {
      setLabTests((prev) => ({
        ...prev,
        'Hematología Completa': true,
        'Pt (Tiempo Protrombina)': true,
        'Ptt (Tiempo Parcial de Tromboplastina)': true,
        'Dosificación de Fibrinógeno': true,
        'Glicemia': true,
        'Urea': true,
        'Creatinina': true,
        'HIV': true,
        'VDRL': true,
      }));
      setNeuroimagingTests((prev) => ({ ...prev, 'RADIOLOGÍA': true, 'VALORACIÓN': true }));
      setLabOtherExams('Electrocardiograma (EKG) con valoración cardiovascular preoperatoria.');
    }
  }, [initialPresetData]);

  // Mapeo Progresivo / Reactivo en tiempo real mientras se dicta
  const handleProgressiveSync = (partial: any) => {
    if (partial?.patient) {
      setPatient((prev) => ({
        ...prev,
        ...partial.patient,
      }));
      const updated = new Set<string>();
      if (partial.patient.fullName) updated.add('patient.fullName');
      if (partial.patient.idNumber) updated.add('patient.idNumber');
      if (partial.patient.age) updated.add('patient.age');
      setRecentlyUpdatedFields(updated);
      setTimeout(() => setRecentlyUpdatedFields(new Set()), 2000);
    }
  };

  // Sincronización Global desde el Dictado de Voz (Gemini 2.5 Flash)
  const handleSyncAllDocuments = (extractedData: any) => {
    if (!extractedData) return;
    const updated = new Set<string>();

    // 1. Datos del Paciente (Normalización garantizada de nombres y cédula)
    const patientCondition = (extractedData.patient?.condition || 
      (extractedData.restCertificate?.condition?.toUpperCase() === 'FAMILIAR' ? 'Familiar' : 'Paciente')) as 'Paciente' | 'Familiar';

    setPatient((prev) => ({
      ...prev,
      fullName: extractedData.patient?.fullName || extractedData.patient?.patientName || prev.fullName,
      idNumber: extractedData.patient?.idNumber || extractedData.patient?.nationalId || prev.idNumber,
      age: String(extractedData.patient?.age || prev.age || ''),
      phone: extractedData.patient?.phone || prev.phone || '',
      date: extractedData.patient?.date || prev.date || new Date().toLocaleDateString('es-VE'),
      guideNumber: extractedData.patient?.guideNumber || prev.guideNumber || '',
      condition: patientCondition,
    }));
    if (extractedData.patient?.fullName || extractedData.patient?.patientName) updated.add('patient.fullName');
    if (extractedData.patient?.idNumber || extractedData.patient?.nationalId) updated.add('patient.idNumber');
    if (extractedData.patient?.age) updated.add('patient.age');
    if (extractedData.patient?.date) updated.add('patient.date');
    if (extractedData.patient?.guideNumber) updated.add('patient.guideNumber');

    // 2. Récipe (Coalescencia estricta de claves duales: recipeDual, recipe legado, treatment e indications)
    const finalRxLeft = 
      extractedData.recipeDual?.pharmacy || 
      extractedData.recipe?.rxLeft || 
      extractedData.treatment || 
      '';

    const finalRxRight = 
      extractedData.recipeDual?.patientIndications || 
      extractedData.recipe?.indicationsRight || 
      extractedData.indications || 
      '';

    if (finalRxLeft || finalRxRight) {
      setRecipeData((prev) => ({
        rxLeft: finalRxLeft || prev.rxLeft,
        indicationsRight: finalRxRight || prev.indicationsRight,
      }));
      if (finalRxLeft) updated.add('recipe.rxLeft');
      if (finalRxRight) updated.add('recipe.indicationsRight');
    }

    // 3. Informe Médico (Soporta clinicalReport e informe)
    const reportText = extractedData.clinicalReport || (extractedData.informe?.bodyText);
    if (reportText) {
      setInformeData({ bodyText: reportText });
      updated.add('informe.bodyText');
    } else if (extractedData.informe) {
      const infText = [
        `Por medio de la presente se hace constar que el/la paciente ${(extractedData.patient?.fullName || patient.fullName).toUpperCase()}, titular de la C.I. ${extractedData.patient?.idNumber || patient.idNumber}, de ${extractedData.patient?.age || patient.age} años de edad, se encuentra bajo control por el servicio de Neurocirugía y Cirugía de Columna Mínimamente Invasiva.`,
        '',
        `MOTIVO Y ANTECEDENTES:\n${extractedData.informe.motivo || ''}\n${extractedData.informe.antecedentes || ''}`,
        '',
        `ENFERMEDAD ACTUAL:\n${extractedData.informe.enfermedadActual || ''}`,
        '',
        `EXAMEN FÍSICO NEUROLÓGICO:\n${extractedData.informe.examenFisico || ''}`,
        '',
        `CORRELACIÓN DE ESTUDIOS PARACLÍNICOS:\n${extractedData.informe.estudiosParaclinicos || ''}`,
        '',
        `DIAGNÓSTICO:\n${extractedData.diagnosisPrincipal || extractedData.informe.diagnostico || ''}`,
        '',
        `PLAN Y CONDUCTA:\n${extractedData.informe.planConducta || ''}`,
      ].join('\n');
      setInformeData({ bodyText: infText });
      updated.add('informe.bodyText');
    }

    // 4. Orden Lab e Imágenes
    const labSource = extractedData.ordenLab || extractedData.labAndImagesOrder || (extractedData as any).laboratory;
    if (extractedData.diagnosisPrincipal && !labPresumptiveDx) {
      setLabPresumptiveDx(extractedData.diagnosisPrincipal);
      updated.add('ordenLab.diagnosticoPresuntivo');
    }
    if (labSource) {
      if (labSource.diagnosticoPresuntivo || labSource.presumptiveDx) {
        setLabPresumptiveDx(labSource.diagnosticoPresuntivo || labSource.presumptiveDx);
        updated.add('ordenLab.diagnosticoPresuntivo');
      }

      // Procesar laboratorios con desglosamiento canónico
      const rawLabList: string[] = [];
      const appendItems = (arr: any) => {
        if (Array.isArray(arr)) {
          arr.forEach((it) => {
            if (typeof it === 'string' && it.trim()) {
              if (it.includes('_')) {
                it.split('_').forEach((sub) => sub.trim() && rawLabList.push(sub.trim()));
              } else if (it.includes(',')) {
                it.split(',').forEach((sub) => sub.trim() && rawLabList.push(sub.trim()));
              } else {
                rawLabList.push(it.trim());
              }
            }
          });
        } else if (arr && typeof arr === 'object') {
          Object.entries(arr).forEach(([k, v]) => {
            if (Boolean(v) && k.trim()) rawLabList.push(k.trim());
          });
        }
      };

      appendItems(labSource.perfilPreoperatorio);
      appendItems(labSource.laboratorios);
      appendItems(labSource.tests);
      appendItems(labSource.estudios);
      appendItems(labSource.labTests);

      if (rawLabList.length > 0 || Array.isArray(labSource.otrosEstudios) || labSource.otherExams) {
        const { newLab, unmapped } = mapTestsToCanonical(rawLabList, labTests);

        const otherList = [...unmapped];
        if (Array.isArray(labSource.otrosEstudios)) {
          labSource.otrosEstudios.forEach((oe: string) => {
            if (typeof oe === 'string' && oe.trim()) otherList.push(oe.trim());
          });
        } else if (typeof labSource.otrosEstudios === 'string' && labSource.otrosEstudios.trim()) {
          otherList.push(labSource.otrosEstudios.trim());
        }
        if (typeof labSource.otherExams === 'string' && labSource.otherExams.trim()) {
          otherList.push(labSource.otherExams.trim());
        }

        setLabTests(newLab);
        if (otherList.length > 0) {
          setLabOtherExams((prev) => {
            const combined = [prev, ...otherList].filter(Boolean).join(', ');
            return combined;
          });
        }
        updated.add('ordenLab.tests');
      }

      // Procesar neuroimagen
      const rawNeuroList: string[] = [];
      const appendNeuro = (nSource: any) => {
        if (Array.isArray(nSource)) {
          nSource.forEach((it) => {
            if (typeof it === 'string' && it.trim()) {
              if (it.includes('_')) {
                it.split('_').forEach((sub) => sub.trim() && rawNeuroList.push(sub.trim()));
              } else {
                rawNeuroList.push(it.trim());
              }
            }
          });
        } else if (nSource && typeof nSource === 'object') {
          Object.entries(nSource).forEach(([k, v]) => {
            if (Boolean(v) && k.trim()) rawNeuroList.push(k.trim());
          });
        }
      };

      appendNeuro(labSource.neuroimagen);
      appendNeuro(labSource.neuroimaging);
      appendNeuro(labSource.neuroimagingTests);

      if (rawNeuroList.length > 0) {
        const newNeuro = { ...neuroimagingTests };
        rawNeuroList.forEach((item: string) => {
          const norm = item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          if (norm.includes('rmn') || norm.includes('resonancia') || norm.includes('mri')) {
            newNeuro['RESONANCIA MAGNÉTICA'] = true;
          } else if (norm.includes('tac') || norm.includes('tomograf')) {
            newNeuro['TOMOGRAFÍA AXIAL COMPUTARIZADA'] = true;
          } else if (norm.includes('rx') || norm.includes('radiolog')) {
            newNeuro['RADIOLOGÍA'] = true;
          } else if (norm.includes('eeg') || norm.includes('electroencefal')) {
            newNeuro['ELECTROENCEFALOGRAMA'] = true;
          } else if (norm.includes('emg') || norm.includes('electromiogr')) {
            newNeuro['ELECTROMIOGRAFIA'] = true;
          } else if (norm.includes('pess') || norm.includes('potenciales')) {
            newNeuro['POTENCIALES EVOCADOS'] = true;
          } else if (norm.includes('valoraci') || norm.includes('cardiovascular')) {
            newNeuro['VALORACIÓN'] = true;
          } else {
            Object.keys(newNeuro).forEach((k) => {
              if (k.toLowerCase().includes(norm) || norm.includes(k.toLowerCase())) {
                newNeuro[k] = true;
              }
            });
          }
        });
        setNeuroimagingTests(newNeuro);
        updated.add('ordenLab.neuro');
      }
    }

    // 5. Constancia Médica
    const restSource = extractedData.restCertificate || extractedData.constancia;
    if (restSource) {
      const isNeedsRest = typeof restSource.needsRest === 'boolean' 
        ? restSource.needsRest 
        : (parseInt(String(restSource.restDays || '0'), 10) > 0);
      const cond = (restSource.condition?.toUpperCase() === 'FAMILIAR' ? 'Familiar' : 'Paciente') as 'Paciente' | 'Familiar';

      setConstanciaData((prev) => {
        const daysCount = isNeedsRest ? String(restSource.restDays || prev.restDays || '07').padStart(2, '0') : '00';
        return {
          ...prev,
          attendedDate: restSource.attendedDate || restSource.restFrom || prev.attendedDate,
          condition: cond,
          needsRest: isNeedsRest,
          restDays: daysCount,
          restFrom: restSource.restFrom || prev.restFrom,
          restTo: isNeedsRest ? (restSource.restTo || prev.restTo) : '-',
          idx: restSource.idx || extractedData.diagnosisPrincipal || prev.idx,
        };
      });
      updated.add('constancia.days');
      updated.add('constancia.idx');
      updated.add('constancia.needsRest');
      updated.add('constancia.condition');
    }

    // 6. Historia Clínica
    const histSource = extractedData.clinicalHistory || extractedData.historia;
    if (histSource) {
      setHistoriaData((prev) => ({
        motivoConsulta: histSource.consultReason || histSource.motivoConsulta || prev.motivoConsulta,
        enfermedadActual: histSource.currentIllness || histSource.enfermedadActual || prev.enfermedadActual,
        antecedentes: histSource.background || histSource.antecedentes || prev.antecedentes,
        examenNeurologico: histSource.neuroExam || histSource.examenNeurologico || prev.examenNeurologico,
        diagnostico: histSource.diagnosis || extractedData.diagnosisPrincipal || histSource.diagnostico || prev.diagnostico,
      }));
      updated.add('historia.diagnostico');
      updated.add('historia.motivo');
    }

    // Manejo de campos inciertos para semáforo visual
    if (Array.isArray(extractedData.uncertainFields)) {
      setUncertainFields(extractedData.uncertainFields);
    }

    setRecentlyUpdatedFields(updated);
    setTimeout(() => setRecentlyUpdatedFields(new Set()), 3500);

    setSaveStatus('✓ Datos sincronizados automáticamente en los 5 documentos oficiales');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Helper visual para resaltar campos reactivos y alertar sobre campos inciertos
  const getHighlightClass = (fieldName: string) => {
    if (uncertainFields.includes(fieldName)) {
      return 'ring-2 ring-amber-500 bg-amber-50/90 text-slate-950 transition-all duration-300';
    }
    if (recentlyUpdatedFields.has(fieldName)) {
      return 'ring-2 ring-cyan-400 bg-cyan-50/90 text-slate-950 transition-all duration-700';
    }
    return '';
  };

  // Cargar paciente seleccionado desde el historial local
  const handleSelectPatientFromHistory = (rec: PatientRecord) => {
    setPatient({
      fullName: rec.fullName,
      idNumber: rec.nationalId,
      age: rec.age,
      date: rec.lastConsultationDate,
      phone: rec.phone,
      address: rec.address,
    });

    if (rec.documentStates?.recipe) setRecipeData(rec.documentStates.recipe);
    if (rec.documentStates?.informe) {
      setInformeData({
        bodyText: [
          `Por medio de la presente se hace constar que ${rec.fullName.toUpperCase()} (C.I. ${rec.nationalId}, ${rec.age} años) se encuentra bajo control neuroquirúrgico.`,
          '',
          rec.documentStates.informe.motivo,
          rec.documentStates.informe.enfermedadActual,
          rec.documentStates.informe.examenFisico,
          rec.documentStates.informe.diagnostico,
          rec.documentStates.informe.planConducta,
        ].filter(Boolean).join('\n\n'),
      });
    }
    if (rec.documentStates?.constancia) setConstanciaData(rec.documentStates.constancia as any);
    if (rec.documentStates?.historia) setHistoriaData(rec.documentStates.historia);
    if (rec.documentStates?.ordenLab) {
      if (rec.documentStates.ordenLab.diagnosticoPresuntivo) {
        setLabPresumptiveDx(rec.documentStates.ordenLab.diagnosticoPresuntivo);
      }
      if (Array.isArray(rec.documentStates.ordenLab.perfilPreoperatorio)) {
        const { newLab, unmapped } = mapTestsToCanonical(rec.documentStates.ordenLab.perfilPreoperatorio, {});
        setLabTests(newLab);
      }
      if (Array.isArray(rec.documentStates.ordenLab.neuroimagen)) {
        const restoredNeuro: Record<string, boolean> = { ...neuroimagingTests };
        Object.keys(restoredNeuro).forEach(k => restoredNeuro[k] = false);
        rec.documentStates.ordenLab.neuroimagen.forEach((item: string) => {
          restoredNeuro[item] = true;
        });
        setNeuroimagingTests(restoredNeuro);
      }
      const savedOthers = (rec.documentStates.ordenLab as any).otherExams || rec.documentStates.ordenLab.otrosEstudios;
      if (savedOthers) {
        setLabOtherExams(Array.isArray(savedOthers) ? savedOthers.join(', ') : String(savedOthers));
      }
    }

    setSaveStatus(`Ficha de ${rec.fullName} (${rec.nationalId}) cargada.`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Guardar en almacenamiento local
  const handleSaveToStorage = () => {
    const record: PatientRecord = {
      id: `pt-${patient.idNumber.replace(/[^\d]/g, '') || Date.now()}`,
      nationalId: patient.idNumber || 'V-00.000.000',
      fullName: patient.fullName || 'Paciente Evaluado',
      age: patient.age || '40',
      phone: patient.phone,
      address: patient.address,
      lastConsultationDate: patient.date,
      lastDiagnosis: constanciaData.idx || historiaData.diagnostico,
      documentStates: {
        recipe: recipeData,
        informe: {
          motivo: 'Evaluación de Neurocirugía',
          antecedentes: 'Revisados',
          enfermedadActual: informeData.bodyText.slice(0, 300),
          examenFisico: 'Evaluado',
          estudiosParaclinicos: 'RMN/TAC',
          diagnostico: historiaData.diagnostico,
          planConducta: 'Manejo ambulatorio/quirúrgico',
        },
        ordenLab: {
          perfilPreoperatorio: Object.keys(labTests).filter(k => labTests[k]),
          neuroimagen: Object.keys(neuroimagingTests).filter(k => neuroimagingTests[k]),
          otrosEstudios: labOtherExams ? [labOtherExams] : [],
          otherExams: labOtherExams,
          diagnosticoPresuntivo: labPresumptiveDx,
        },
        constancia: constanciaData,
        historia: historiaData,
      },
      auditLog: [
        {
          timestamp: new Date().toLocaleString('es-VE'),
          action: 'Guardado manual desde el espacio de trabajo oficial',
        },
      ],
    };

    savePatientRecord(record);
    setSaveStatus(`Ficha de ${patient.fullName} sincronizada y guardada en la Nube CCMI.`);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Compartir por WhatsApp (Formato PDF Oficial de cada Documento)
  const handleShareWhatsApp = () => {
    setIsWhatsAppPdfModalOpen(true);
  };

  // Carga rápida de protocolos habituales de Neurocirugía en 1 clic
  const handleApplyPreset = (preset: ClinicalProtocolPreset) => {
    if (preset.targetDoc) {
      setActiveDoc(preset.targetDoc);
    }

    // 1. Récipe (Soporte directo para formato clinical_presets.json y legacy)
    const rxLeftText = (preset as any).treatment || preset.prescription?.pharmacy || '';
    const rxRightText = (preset as any).instructions || preset.prescription?.patientIndications || '';
    const diagText = (preset as any).diagnosis || preset.labOrders?.presumptiveDx || (preset as any).informe?.diagnosis || '';

    if (rxLeftText || rxRightText) {
      setRecipeData({
        rxLeft: rxLeftText,
        indicationsRight: rxRightText,
      });
    }

    // 2. Diagnóstico en laboratorio y constancia
    if (diagText) {
      setLabPresumptiveDx(diagText);
      setConstanciaData(prev => ({
        ...prev,
        idx: diagText,
      }));
    }

    // 3. Orden de laboratorio e imágenes
    if (preset.labOrders) {
      if (preset.labOrders.presumptiveDx) {
        setLabPresumptiveDx(preset.labOrders.presumptiveDx);
      }
      if (preset.labOrders.neuroimagingDetails) {
        if (typeof preset.labOrders.neuroimagingDetails === 'string') {
          const detailStr = preset.labOrders.neuroimagingDetails;
          setNeuroimagingDetails(prev => ({
            ...prev,
            RMN: detailStr,
            TAC: detailStr,
            RADIOLOGIA: detailStr,
          }));
        } else if (typeof preset.labOrders.neuroimagingDetails === 'object') {
          setNeuroimagingDetails(prev => ({
            ...prev,
            ...(preset.labOrders!.neuroimagingDetails as Record<string, string>),
          }));
        }
      }
      if (preset.labOrders.otherExams) {
        setLabOtherExams(preset.labOrders.otherExams);
      }
      if (preset.labOrders.labTests) {
        setLabTests(prev => ({
          ...prev,
          ...preset.labOrders!.labTests,
        }));
      }
      if (preset.labOrders.neuroimagingTests) {
        const newImg: Record<string, boolean> = {};
        preset.labOrders.neuroimagingTests.forEach(test => {
          newImg[test] = true;
        });
        setNeuroimagingTests(prev => ({
          ...prev,
          ...newImg,
        }));
      }
    }

    // 4. Informe
    if (preset.informe) {
      const informeText = [
        `Por medio de la presente se hace constar que el/la paciente ${(patient.fullName || 'PACIENTE').toUpperCase()}, titular de la C.I. ${patient.idNumber || 'V-00.000.000'}, de ${patient.age || '45'} años de edad, se encuentra bajo control por el servicio de Neurocirugía y Cirugía de Columna Mínimamente Invasiva.`,
        '',
        `RESUMEN CLÍNICO:\n${preset.informe.clinicalSummary}`,
        '',
        `DIAGNÓSTICO:\n${preset.informe.diagnosis}`,
        '',
        `PLAN TERAPÉUTICO Y CONDUCTA:\n${preset.informe.plan}`,
      ].join('\n');
      setInformeData({ bodyText: informeText });
    } else if (diagText && rxLeftText) {
      const autoInforme = `EVALUACIÓN DE NEUROCIRUGÍA Y CIRUGÍA DE COLUMNA:\n\nPaciente ${(patient.fullName || 'PACIENTE').toUpperCase()} evaluado en consulta especializada.\n\nIMPRESIÓN DIAGNÓSTICA:\n${diagText} ${preset.icd10 ? `(CIE-10: ${preset.icd10})` : ''}\n\nPLAN Y TRATAMIENTO:\n${rxLeftText}\n\nINDICACIONES:\n${rxRightText}`;
      setInformeData({ bodyText: autoInforme });
    }

    // 5. Constancia
    if (preset.constancia) {
      setConstanciaData(prev => ({
        ...prev,
        idx: preset.constancia!.diagnosis,
        reposoDias: preset.constancia!.restDays,
        indicaciones: preset.constancia!.indications,
      }));
    }

    setSaveStatus(`Protocolo "${preset.name}" cargado exitosamente.`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Manejo de clic fuera del menú de herramientas y atajos de teclado
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleDirectPrint();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Impresión Directa Canónica 100% Calibrada con Fondo Master Oficial
  const handleDirectPrint = async () => {
    if (!patient.fullName || patient.fullName.trim() === '' || patient.fullName.trim() === 'Paciente') {
      const confirmContinue = window.confirm(
        '⚠️ El Nombre del Paciente está vacío en el encabezado.\n\nPor normativa médico-legal del MPPS, todo documento debe identificar al paciente.\n\n¿Desea imprimir de todos modos?'
      );
      if (!confirmContinue) {
        document.getElementById('patient-name-input')?.focus();
        setSaveStatus('⚠️ Por favor ingrese el Nombre y Cédula del Paciente en la barra superior.');
        setTimeout(() => setSaveStatus(null), 4000);
        return;
      }
    }

    try {
      const def = DOCUMENT_DEFINITIONS?.[activeDoc] || {
        label: activeDoc,
        shortName: activeDoc,
        filenamePrefix: activeDoc,
      };
      const safeName = (patient.fullName || 'Paciente').replace(/\s+/g, '_');
      const safeId = (patient.idNumber || 'S_N').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${def.filenamePrefix}_${safeName}_${safeId}.pdf`;

      const bundle: ClinicalDataBundle = {
        recipeData: {
          rxLeft: recipeData.rxLeft || (recipeData as any).pharmacy || '',
          indicationsRight: recipeData.indicationsRight || (recipeData as any).patientIndications || '',
        },
        labData: {
          labTests,
          neuroimagingTests,
          neuroimagingDetails,
          presumptiveDx: labPresumptiveDx,
          otherExams: labOtherExams,
        },
        informeData: {
          bodyText: informeData.bodyText,
        },
        constanciaData: {
          restDays: constanciaData.restDays,
          diagnosis: constanciaData.idx,
          idx: constanciaData.idx,
          condition: constanciaData.condition,
          needsRest: constanciaData.needsRest,
          attendedDate: constanciaData.attendedDate,
          restFrom: constanciaData.restFrom,
          restTo: constanciaData.restTo,
          requestDay: constanciaData.requestDay,
          requestMonth: constanciaData.requestMonth,
          requestYear: constanciaData.requestYear,
        },
        historiaData: {
          motivoConsulta: historiaData.motivoConsulta,
          enfermedadActual: historiaData.enfermedadActual,
          antecedentes: historiaData.antecedentes,
          examenNeurologico: historiaData.examenNeurologico,
          diagnostico: historiaData.diagnostico,
        },
      };

      const result = await generateCanonicalDocumentPDF(activeDoc, patient as PatientData, bundle, fileName);
      const blobUrl = URL.createObjectURL(result.blob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          // Detectar si estamos en un dispositivo móvil donde los iframes ocultos no soportan window.print()
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            // En móvil, descargar directamente el PDF oficial 300 DPI con membrete para evitar que Android imprima en blanco
            downloadBlob(result.pdfBytes, result.fileName);
            setSaveStatus('PDF oficial con membrete generado y descargado para impresión.');
            setTimeout(() => setSaveStatus(null), 4000);
          } else {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }
        } catch {
          // Fallback seguro: descargar el PDF con membrete
          downloadBlob(result.pdfBytes, result.fileName);
        }
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
          } catch {}
        }, 60000);
      };
    } catch (e) {
      console.warn('Fallo en generación de PDF para impresión:', e);
      setSaveStatus('Error preparando impresión: ' + ((e as any)?.message || 'Intente descargar PDF'));
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // Autocompletado inteligente al cambiar la cédula
  const handleCedulaChange = (rawVal: string) => {
    setPatient((prev) => ({ ...prev, idNumber: rawVal }));
    const cleanCedula = rawVal.trim();
    if (cleanCedula.length >= 4) {
      const match = getPatientByCedula(cleanCedula);
      if (match && match.nationalId !== patient.idNumber) {
        setFoundPatientAlert(match);
      } else {
        setFoundPatientAlert(null);
      }
    } else {
      setFoundPatientAlert(null);
    }
  };

  // Cargar paciente encontrado
  const handleAcceptFoundPatient = (p: PatientRecord) => {
    handleSelectPatientFromHistory(p);
    setFoundPatientAlert(null);
  };

  // Limpiar campos para un nuevo paciente
  const handleClearPatient = () => {
    setPatient({
      fullName: '',
      idNumber: 'V-',
      age: '',
      phone: '',
      address: '',
      date: new Date().toLocaleDateString('es-VE'),
    });
    setFoundPatientAlert(null);
    setSaveStatus('Formulario listo para nuevo paciente.');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Descarga directa e inalterable sobre la plantilla binaria oficial (pdf-lib)
  const handleDownloadCurrentPdf = async () => {
    if (!patient.fullName || patient.fullName.trim() === '' || patient.fullName.trim() === 'Paciente') {
      const confirmContinue = window.confirm(
        '⚠️ El Nombre del Paciente está vacío en el encabezado.\n\nPor normativa médico-legal del MPPS, todo documento debe identificar al paciente.\n\n¿Desea descargar el documento de todos modos?'
      );
      if (!confirmContinue) {
        document.getElementById('patient-name-input')?.focus();
        setSaveStatus('⚠️ Por favor ingrese el Nombre y Cédula del Paciente en la barra superior.');
        setTimeout(() => setSaveStatus(null), 4000);
        return;
      }
    }

    try {
      setIsExportingPdf(true);
      const def = DOCUMENT_DEFINITIONS?.[activeDoc] || {
        label: activeDoc,
        shortName: activeDoc,
        filenamePrefix: activeDoc,
      };
      const safeName = (patient.fullName || 'Paciente').replace(/\s+/g, '_');
      const safeId = (patient.idNumber || 'S_N').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${def.filenamePrefix}_${safeName}_${safeId}.pdf`;

      const bundle: ClinicalDataBundle = {
        recipeData: {
          rxLeft: recipeData.rxLeft || (recipeData as any).pharmacy || '',
          indicationsRight: recipeData.indicationsRight || (recipeData as any).patientIndications || '',
        },
        labData: {
          labTests,
          neuroimagingTests,
          neuroimagingDetails,
          presumptiveDx: labPresumptiveDx,
          otherExams: labOtherExams,
        },
        informeData: {
          bodyText: informeData.bodyText,
        },
        constanciaData: {
          restDays: constanciaData.restDays,
          diagnosis: constanciaData.idx,
          idx: constanciaData.idx,
          condition: constanciaData.condition,
          needsRest: constanciaData.needsRest,
          attendedDate: constanciaData.attendedDate,
          restFrom: constanciaData.restFrom,
          restTo: constanciaData.restTo,
          requestDay: constanciaData.requestDay,
          requestMonth: constanciaData.requestMonth,
          requestYear: constanciaData.requestYear,
        },
        historiaData: {
          motivoConsulta: historiaData.motivoConsulta,
          enfermedadActual: historiaData.enfermedadActual,
          antecedentes: historiaData.antecedentes,
          examenNeurologico: historiaData.examenNeurologico,
          diagnostico: historiaData.diagnostico,
        },
      };

      const result = await generateCanonicalDocumentPDF(activeDoc, patient as PatientData, bundle, fileName);
      downloadBlob(result.pdfBytes, result.fileName);
      const reviewNotice = result.requiresReview ? ' (Nota: El documento requiere revisión)' : '';
      setSaveStatus(`PDF oficial de ${def.label} generado exitosamente sobre PDF original${reviewNotice}`);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Error al generar PDF oficial:', err);
      setSaveStatus('Error generando PDF: ' + (err?.message || 'Error desconocido'));
      setTimeout(() => setSaveStatus(null), 6000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Cargar caso clínico de prueba instantáneo para verificar el autollenado
  const handleLoadDemoCase = () => {
    const demoExtract = {
      patient: {
        fullName: 'Luis Eduardo Morales',
        idNumber: '14.892.304',
        age: '54',
        phone: '0424-938.16.74',
        address: 'Puerto Ordaz, Edo. Bolívar',
        date: new Date().toLocaleDateString('es-VE')
      },
      recipeDual: {
        pharmacy: '1. Pregabalina 75 mg - Cápsulas.\n   Tomar 1 cápsula vía oral cada 12 horas por 14 días.\n\n2. Ketoprofeno 100 mg - Comprimidos.\n   Tomar 1 comprimido vía oral cada 8 horas con protector gástrico por 5 días.\n\n3. Tramadol + Paracetamol 37.5/325 mg.\n   Tomar 1 comprimido cada 8 horas en caso de dolor moderado o severo.',
        patientIndications: '• Tomar Pregabalina de noche para evitar mareo inicial.\n• Reposo en cama semi-fowler. Evitar flexiones de columna y cargas de peso.\n• Aplicar calor local suave en región lumbar por 20 minutos dos veces al día.\n• Control médico al culminar los estudios de neuroimagen.'
      },
      informe: {
        bodyText: 'INFORME CLÍNICO NEUROQUIRÚRGICO\n\nPaciente masculino de 54 años de edad quien acude a consulta especializada por presentar cuadro clínico de 3 semanas de evolución caracterizado por dolor lumbociático severo irradiado al dermatoma L5-S1 izquierdo, acompañado de parestesias en cara lateral de pierna y pie.\n\nEXAMEN FÍSICO:\nMarcha antiálgica. Maniobra de Lasègue positiva a 35° en miembro inferior izquierdo. Reflejo aquileo izquierdo disminuido. Paresia 4/5 en extensor propio del hallux izquierdo.\n\nDIAGNÓSTICO:\nHernia Discal Lumbar L5-S1 izquierda extruida con radiculopatía aguda.\n\nPLAN Y CONDUCTA:\nSe instaura tratamiento médico farmacológico de desinflamación radicular. Se solicita Resonancia Magnética Lumbar de alta resolución para valorar criterio de Microdiscectomía / Cirugía de Columna Mínimamente Invasiva.'
      },
      ordenLab: {
        neuroimagen: ['rmn_columna', 'rx_columna'],
        laboratorios: ['hematologia', 'glicemia', 'urea_creatinina', 'tp_tpt', 'vih_vdrl'],
        diagnosticoPresuntivo: 'Hernia Discal Lumbar L5-S1 con radiculopatía'
      },
      constancia: {
        idx: 'Hernia Discal Lumbar L5-S1 izquierda con radiculopatía aguda',
        daysNumber: '10',
        daysWords: 'DIEZ',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
      },
      historia: {
        motivoConsulta: 'Lumbociatalgia izquierda severa e incapacitante',
        enfermedadActual: 'Paciente masculino de 54 años con cuadro de lumbociatalgia izquierda irradiada a dermatoma L5-S1 de 3 semanas de evolución, que no cede con AINEs convencionales.',
        antecedentes: 'Hipertensión arterial controlada.',
        examenNeurologico: 'Lasègue izquierdo positivo a 35°. Paresia 4/5 extensor hallux. Reflejo aquileo izquierdo hipoactivo.',
        diagnostico: 'Hernia Discal Lumbar L5-S1 izquierda extruida'
      }
    };
    handleSyncAllDocuments(demoExtract);
  };

  // Pestañas Oficiales: Las 5 Plantillas Idénticas
  const tabs: { id: DocType; label: string; number: string; icon: React.ReactNode }[] = [
    { id: 'RECIPES', label: 'Récipe (Doble Talón)', number: '1', icon: <Pill className="w-4 h-4" /> },
    { id: 'INFORME', label: 'Informe Médico', number: '2', icon: <FileText className="w-4 h-4" /> },
    { id: 'ORDEN_LAB', label: 'Orden Lab / Imágenes', number: '3', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'CONSTANCIA', label: 'Constancia de Reposo', number: '4', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'HISTORIA', label: 'Historia Clínica', number: '5', icon: <ClipboardList className="w-4 h-4" /> },
  ];

  // Obtener estado actual del documento activo para correcciones de voz
  const getCurrentDocData = () => {
    switch (activeDoc) {
      case 'RECIPES': return recipeData;
      case 'INFORME': return informeData;
      case 'ORDEN_LAB': return { labTests, neuroimagingTests, labPresumptiveDx };
      case 'CONSTANCIA': return constanciaData;
      case 'HISTORIA': return historiaData;
    }
  };

  // Aplicar corrección rápida de voz puntual
  const handleApplyCorrection = (updated: any, cmd: string) => {
    switch (activeDoc) {
      case 'RECIPES':
        setRecipeData(prev => ({ ...prev, ...updated }));
        break;
      case 'INFORME':
        setInformeData(prev => ({ ...prev, ...updated }));
        break;
      case 'ORDEN_LAB': {
        const rawItems: string[] = [];
        const extractList = (val: any) => {
          if (Array.isArray(val)) {
            val.forEach(item => {
              if (typeof item === 'string') {
                if (item.includes(',')) {
                  item.split(',').forEach(s => s.trim() && rawItems.push(s.trim()));
                } else {
                  rawItems.push(item.trim());
                }
              }
            });
          } else if (typeof val === 'string' && val.trim()) {
            val.split(',').forEach(s => s.trim() && rawItems.push(s.trim()));
          } else if (val && typeof val === 'object') {
            Object.entries(val).forEach(([k, v]) => {
              if (Boolean(v)) rawItems.push(k.trim());
            });
          }
        };

        extractList(updated.perfilPreoperatorio);
        extractList(updated.laboratorios);
        extractList(updated.labTests);
        extractList(updated.tests);
        extractList(updated.estudios);

        // Si el comando verbal directo dice marcar magnesio, potasio, sodio, etc.
        if (cmd) {
          const testWords = [
            'magnesio', 'potasio', 'sodio', 'cloro', 'glicemia', 'urea', 'creatinina',
            'hematologia', 'plaquetas', 'hiv', 'vdrl', 'orina', 'tp', 'tpt', 'fibrinogeno',
            'vsg', 'calcio', 'fosforo', 'transaminasas', 'acido urico', 'bilirrubina',
            'amilasa', 'lipasa'
          ];
          testWords.forEach(w => {
            if (cmd.toLowerCase().includes(w) && !rawItems.some(it => it.toLowerCase().includes(w))) {
              rawItems.push(w);
            }
          });
        }

        if (rawItems.length > 0) {
          const { newLab, unmapped } = mapTestsToCanonical(rawItems, labTests);
          setLabTests(newLab);
          if (unmapped.length > 0) {
            setLabOtherExams(prev => [prev, ...unmapped].filter(Boolean).join(', '));
          }
        }

        if (updated.otrosEstudios || updated.otherExams) {
          const o = updated.otrosEstudios || updated.otherExams;
          const oStr = Array.isArray(o) ? o.join(', ') : String(o);
          setLabOtherExams(prev => [prev, oStr].filter(Boolean).join(', '));
        }

        if (updated.neuroimagen || updated.neuroimagingTests || updated.neuroimaging) {
          const nSource = updated.neuroimagen || updated.neuroimagingTests || updated.neuroimaging;
          const newNeuro = { ...neuroimagingTests };
          const list: string[] = Array.isArray(nSource) ? nSource : Object.keys(nSource).filter(k => nSource[k]);
          list.forEach((x: string) => {
            const norm = x.toLowerCase();
            if (norm.includes('rmn') || norm.includes('resonancia')) newNeuro['RESONANCIA MAGNÉTICA'] = true;
            else if (norm.includes('tac') || norm.includes('tomograf')) newNeuro['TOMOGRAFÍA AXIAL COMPUTARIZADA'] = true;
            else if (norm.includes('rx') || norm.includes('radiolog')) newNeuro['RADIOLOGÍA'] = true;
            else if (norm.includes('eeg') || norm.includes('electroencefal')) newNeuro['ELECTROENCEFALOGRAMA'] = true;
            else if (norm.includes('emg') || norm.includes('electromiogr')) newNeuro['ELECTROMIOGRAFIA'] = true;
            else if (norm.includes('pess') || norm.includes('potenciales')) newNeuro['POTENCIALES EVOCADOS'] = true;
            else if (norm.includes('valoraci')) newNeuro['VALORACIÓN'] = true;
            else newNeuro[x] = true;
          });
          setNeuroimagingTests(newNeuro);
        }
        if (updated.labPresumptiveDx || updated.diagnosticoPresuntivo) {
          setLabPresumptiveDx(updated.labPresumptiveDx || updated.diagnosticoPresuntivo);
        }
        break;
      }
      case 'CONSTANCIA':
        setConstanciaData(prev => ({ ...prev, ...updated }));
        break;
      case 'HISTORIA':
        setHistoriaData(prev => ({ ...prev, ...updated }));
        break;
    }
    setSaveStatus(`Corrección aplicada al documento: "${cmd}"`);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Bundle clínico unificado para generación canónica (descarga y WhatsApp)
  const currentClinicalDataBundle: ClinicalDataBundle = {
    recipeData: {
      pharmacy: recipeData.pharmacy,
      patientIndications: recipeData.patientIndications,
    },
    labData: {
      labTests,
      neuroimagingTests,
      neuroimagingDetails,
      presumptiveDx: labPresumptiveDx,
      otherExams: labOtherExams,
    },
    informeData: {
      bodyText: informeData.bodyText,
    },
    constanciaData: {
      restDays: constanciaData.restDays,
      diagnosis: constanciaData.idx,
      idx: constanciaData.idx,
      condition: constanciaData.condition,
      needsRest: constanciaData.needsRest,
      attendedDate: constanciaData.attendedDate,
      restFrom: constanciaData.restFrom,
      restTo: constanciaData.restTo,
      requestDay: constanciaData.requestDay,
      requestMonth: constanciaData.requestMonth,
      requestYear: constanciaData.requestYear,
    },
    historiaData: {
      motivoConsulta: historiaData.motivoConsulta,
      enfermedadActual: historiaData.enfermedadActual,
      antecedentes: historiaData.antecedentes,
      examenNeurologico: historiaData.examenNeurologico,
      diagnostico: historiaData.diagnostico,
    },
  };

  return (
    <div className={`flex flex-col items-center min-h-screen pb-16 px-2 sm:px-4 print:p-0 print:bg-white font-sans relative transition-colors duration-200 ${
      isClinicalLight ? 'bg-slate-100 text-slate-900' : 'bg-[#070d1e] text-slate-200'
    }`}>
      {/* Ambient soft glow (hidden in print) */}
      <div className={`absolute top-0 left-1/3 w-96 h-64 rounded-full blur-3xl pointer-events-none -z-0 print:hidden ${
        isClinicalLight ? 'bg-blue-400/5' : 'bg-cyan-500/10'
      }`} />

      {/* Floating Save Status Toast */}
      {saveStatus && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-2xl animate-fade-in font-mono backdrop-blur-md">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{saveStatus}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. APPLE PRO CLINICAL WORKSTATION BAR                         */}
      {/* ============================================================ */}
      <header className={`w-full max-w-[840px] sticky top-0 z-30 backdrop-blur-xl rounded-2xl shadow-xl transition-all duration-200 border px-3 sm:px-4 py-2 mt-1 mb-3 flex flex-col gap-2 print:hidden ${
        isClinicalLight
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/30'
          : 'bg-[#0d162a]/95 border-slate-800 text-white shadow-2xl'
      }`}>
        {/* ROW 1: BRAND + DOCUMENT SEGMENTED CONTROL + ACTIONS */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Doctor Brand & Card Link */}
          <div 
            onClick={() => setIsDoctorCardOpen(true)}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            title="Ver Tarjeta Oficial del Dr. Samir Moucharrafie"
          >
            <div className={`w-8 h-8 rounded-xl p-0.5 flex items-center justify-center border shadow-xs transition group-hover:scale-105 ${
              isClinicalLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070d1e] border-slate-700'
            }`}>
              <BrandLogo size={24} textVariant={isClinicalLight ? 'dark' : 'light'} />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-black tracking-tight leading-tight flex items-center gap-1.5">
                <span>Dr. Samir M.</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isClinicalLight ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                }`}>
                  UCBL
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Cerebro y Columna</div>
            </div>
          </div>

          {/* Center: Apple Segmented Control for the 5 Documents */}
          <div className={`flex items-center p-1 rounded-xl border max-w-full overflow-x-auto scrollbar-none gap-0.5 ${
            isClinicalLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070d1e] border-slate-800'
          }`}>
            {tabs.map((tab) => {
              const isActive = activeDoc === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDoc(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isActive
                      ? isClinicalLight
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-950/40'
                      : isClinicalLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={tab.label}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="hidden md:inline">{tab.label.split(' ')[0]}</span>
                  <span className="md:hidden text-[11px]">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Actions (SAMI, Imprimir, WhatsApp, ⋯ Más) */}
          <div className="flex items-center gap-1.5 shrink-0 relative" ref={moreMenuRef}>
            {/* Dictado SAMI / Cápsula integrada */}
            <ClinicalDictationCapsule
              onSyncAllDocuments={handleSyncAllDocuments}
              onProgressiveSync={handleProgressiveSync}
              currentPatientCedula={patient.idNumber}
              onSelectPatientFromHistory={handleSelectPatientFromHistory}
              layoutVariant="bar"
            />

            {/* Imprimir A4 */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-95 cursor-pointer"
              title="Imprimir documento oficial en hoja A4 (Ctrl + P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Imprimir</span>
            </button>

            {/* Compartir WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95 cursor-pointer"
              title="Compartir enlace PDF por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">WhatsApp</span>
            </button>

            {/* Menú '⋯ Más' (Dropdown) */}
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`p-1.5 rounded-xl text-xs border transition cursor-pointer ${
                isMoreMenuOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : isClinicalLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-[#070d1e] hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Más herramientas y opciones"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown Popover */}
            {isMoreMenuOpen && (
              <div 
                className={`absolute right-0 top-full mt-2 w-64 rounded-2xl p-2 shadow-2xl z-50 animate-fade-in border font-sans text-xs space-y-1 ${
                  isClinicalLight
                    ? 'bg-white border-slate-200 text-slate-800 shadow-slate-400/40'
                    : 'bg-[#0d162a] border-slate-700 text-slate-200 shadow-2xl ring-1 ring-cyan-500/20'
                }`}
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Documento & Emisión
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCurrentPdf}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-bold leading-tight">Descargar PDF 300 DPI</div>
                    <div className="text-[10px] text-slate-400">Archivo oficial de alta resolución</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleSaveToStorage}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-bold leading-tight">Guardar en Ficha Local</div>
                    <div className="text-[10px] text-slate-400">Almacenar estado de la consulta</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-700/50" />
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Paciente & Consulta
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimelineOpen(true)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-bold leading-tight">Expediente 360°</div>
                    <div className="text-[10px] text-slate-400">Consultas previas y re-emisión</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQrHandoffOpen(true)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-bold leading-tight">QR al Móvil / Secretaría</div>
                    <div className="text-[10px] text-slate-400">Transferir sin cables</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPresetsModalOpen(true)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-bold leading-tight">Protocolos Frecuentes</div>
                    <div className="text-[10px] text-slate-400">Fórmulas habituales Dr. Samir</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-700/50" />
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Personalización & Ajustes
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploaderOpen(true)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cargar Papelería Master</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowZoneGuides(!showZoneGuides)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Guías Visuales</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    showZoneGuides ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {showZoneGuides ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isClinicalLight ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>Modo Iluminación</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isClinicalLight ? 'Luz Diurna' : 'Oscuro'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTechModalOpen(true)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                    isClinicalLight ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-slate-800 text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Herramientas Técnicas</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: COMPACT PATIENT BAR (SINGLE ROW - ~36px) */}
        <div className={`flex flex-wrap items-center gap-2 pt-2 border-t text-xs ${
          isClinicalLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          {/* Cédula */}
          <div className="relative flex-1 min-w-[120px] max-w-[160px]">
            <input
              type="text"
              value={patient.idNumber}
              onChange={(e) => handleCedulaChange(e.target.value)}
              placeholder="Cédula / Pasaporte"
              className={`w-full rounded-lg px-2.5 py-1 text-xs font-mono font-bold outline-none border transition ${
                isClinicalLight
                  ? 'bg-slate-50 border-slate-300 text-blue-900 focus:border-blue-600'
                  : 'bg-[#070d1e] border-slate-800 text-cyan-300 focus:border-cyan-500'
              }`}
            />
            <Search className="w-3 h-3 absolute right-2 top-2 text-slate-400 pointer-events-none" />
          </div>

          {/* Nombre Completo */}
          <div className="flex-[2] min-w-[180px]">
            <input
              id="patient-name-input"
              type="text"
              value={patient.fullName}
              onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
              placeholder="Nombre del paciente..."
              className={`w-full rounded-lg px-2.5 py-1 text-xs font-bold outline-none border transition ${
                isClinicalLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  : 'bg-[#070d1e] border-slate-800 text-white focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Edad */}
          <div className="w-16">
            <input
              type="text"
              value={patient.age}
              onChange={(e) => setPatient({ ...patient, age: e.target.value })}
              placeholder="Edad"
              className={`w-full rounded-lg px-2 py-1 text-xs font-mono font-bold outline-none border text-center transition ${
                isClinicalLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  : 'bg-[#070d1e] border-slate-800 text-white focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Teléfono */}
          <div className="flex-1 min-w-[110px] max-w-[140px] hidden sm:block">
            <input
              type="text"
              value={patient.phone}
              onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
              placeholder="0424-938.16.74"
              className={`w-full rounded-lg px-2.5 py-1 text-xs font-mono font-bold outline-none border transition ${
                isClinicalLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  : 'bg-[#070d1e] border-slate-800 text-white focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Botón Frecuentes rápido */}
          <button
            type="button"
            onClick={() => setIsPresetsModalOpen(true)}
            className={`px-2 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
              isClinicalLight
                ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60'
            }`}
            title="Ver protocolos frecuentes de consulta"
          >
            <span>⚡</span>
            <span className="hidden md:inline">Protocolos</span>
          </button>

          {/* Botón Limpiar */}
          <button
            type="button"
            onClick={handleClearPatient}
            className={`p-1 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer`}
            title="Limpiar campos del paciente"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BANNERS INLINE COMPACTOS (ALERTA PACIENTE RECURRENTE / CAMPOS DUDOSOS) */}
        {foundPatientAlert && (
          <div className={`p-2 rounded-xl flex items-center justify-between text-xs animate-fade-in border ${
            isClinicalLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
          }`}>
            <span className="truncate">
              <strong>Paciente recurrente:</strong> {foundPatientAlert.fullName} ({foundPatientAlert.age} años)
            </span>
            <button
              type="button"
              onClick={() => handleAcceptFoundPatient(foundPatientAlert)}
              className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer ml-2 shrink-0"
            >
              Cargar Historial
            </button>
          </div>
        )}

        {uncertainFields.length > 0 && (
          <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-center justify-between animate-fade-in font-mono">
            <span className="truncate">
              ⚠️ <strong>Validar:</strong> {uncertainFields.join(', ')}
            </span>
            <button
              type="button"
              onClick={() => setUncertainFields([])}
              className="px-2 py-0.5 bg-amber-500/30 hover:bg-amber-500/50 rounded-lg text-[11px] font-bold text-amber-300 cursor-pointer ml-2 shrink-0"
            >
              Confirmar
            </button>
          </div>
        )}
      </header>

      {/* 2. VISTA MÓVIL ADAPTATIVA (Ficha de Bolsillo para Celulares) */}
      {mobileViewMode === 'card' && (
        <div className="w-full max-w-[840px] px-2 print:hidden mb-4">
          <MobileDocumentCardView
            activeDoc={activeDoc}
            patient={patient as PatientData}
            treatmentText={recipeData.rxLeft}
            indicationsText={recipeData.indicationsRight}
            diagnosisText={labPresumptiveDx || constanciaData.idx || historiaData.diagnostico}
            doctorNotes={informeData.bodyText}
            onOpenWhatsApp={handleShareWhatsApp}
            onPrint={handleDirectPrint}
            onSwitchToA4View={() => setMobileViewMode('sheet')}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. LIENZO A4 VECTORIAL / OVERLAY CON MEDIDAS EXACTAS (794x1123px) */}
      {/* ============================================================ */}
      <div className={`relative print:p-0 my-2 ${mobileViewMode === 'card' ? 'hidden md:block print:block' : 'block'}`}>
        {activeDoc === 'ORDEN_LAB' ? (
          <OfficialLabOrderTwoPageSheet
            key={`lab-order-sheet-${calibVersion}`}
            patient={patient}
            onUpdatePatient={(field, val) => setPatient((prev) => ({ ...prev, [field]: val }))}
            labTests={labTests}
            onToggleLabTest={(testKey) => {
              setLabTests((prev) => {
                const normTarget = testKey.toLowerCase();
                const isCurrentlyChecked = Boolean(
                  prev[testKey] ||
                  prev[`labTests.${testKey}`] ||
                  Object.keys(prev).some(k => (k.toLowerCase() === normTarget || normTarget.includes(k.toLowerCase())) && prev[k])
                );
                const next = { ...prev };
                if (isCurrentlyChecked) {
                  Object.keys(next).forEach(k => {
                    if (k === testKey || k === `labTests.${testKey}` || k.toLowerCase() === normTarget) {
                      next[k] = false;
                    }
                  });
                } else {
                  next[testKey] = true;
                }
                return next;
              });
            }}
            neuroimagingTests={neuroimagingTests}
            onToggleNeuroimagingTest={(testName) => setNeuroimagingTests((prev) => ({ ...prev, [testName]: !prev[testName] }))}
            neuroimagingDetails={neuroimagingDetails}
            onUpdateNeuroimagingDetail={(study, detail) => setNeuroimagingDetails((prev) => ({ ...prev, [study]: detail }))}
            presumptiveDx={labPresumptiveDx}
            onChangePresumptiveDx={(val) => setLabPresumptiveDx(val)}
            otherExams={labOtherExams}
            onUpdateOtherExams={(val) => setLabOtherExams(val)}
            showStamp={showStamp}
            activeBgUrl={activeBgUrl}
            customBgs={customBgs}
            labViewMode={labViewMode}
            onChangeViewMode={(mode) => setLabViewMode(mode)}
            getCalib={getCalib}
            isCalibrating={isCalibrating}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onUpdateCalibration={handleUpdateFieldCalibration}
            showZoneGuides={showZoneGuides}
            getHighlightClass={getHighlightClass}
          />
        ) : (
          <div
            id="official-doc-print-area"
            className="relative bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(15,46,84,0.15),0_0_1px_1px_rgba(15,46,84,0.08)] rounded-xs overflow-hidden print:m-0 print:shadow-none print:w-full print:border-none print:rounded-none select-text transition-shadow"
            style={{
              width: '794px',
              height: '1123px',
              minHeight: '1123px',
              maxHeight: '1123px',
              fontFamily: "'Montserrat', sans-serif",
              boxSizing: 'border-box',
            }}
          >
            {/* Progressive Lazy-Loaded A4 Stationery Layer (300 DPI) */}
            <OptimizedA4Background 
              src={activeBgUrl} 
              isCustomOriginal={false} 
              docTitle={DOCUMENT_DEFINITIONS?.[activeDoc]?.label || activeDoc} 
            />

        {/* ========================================================= */}
        {/* PLANTILLA 1: RÉCIPE MÉDICO (DOBLE TALÓN)                  */}
        {/* ========================================================= */}
        {activeDoc === 'RECIPES' && (
          <RecipesMedicalSheet
            key={`recipe-sheet-${calibVersion}`}
            id="recipe-official-sheet"
            patient={patient as PatientData}
            onUpdatePatient={(field, val) => setPatient((prev) => ({ ...prev, [field]: val }))}
            recipeData={{
              rxLeft: recipeData.rxLeft,
              indicationsRight: recipeData.indicationsRight,
            }}
            onUpdateRecipeData={(field, val) => setRecipeData((prev) => ({ ...prev, [field]: val }))}
            showStamp={showStamp}
            customBgUrl={activeBgUrl}
          />
        )}

        {/* ========================================================= */}
        {/* PLANTILLA 2: INFORME MÉDICO                               */}
        {/* ========================================================= */}
        {activeDoc === 'INFORME' && (
          <div id="informe-official-sheet" className="relative w-[794px] h-[1123px]">
            {/* 1. Datos del Paciente */}
            <InteractiveField
              calibration={getCalib('patient.fullName')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.fullName'}
              onSelect={() => setSelectedFieldId('patient.fullName')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.fullName}
                onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none ${getHighlightClass('patient.fullName')}`}
                placeholder="Nombre del paciente..."
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('patient.idNumber')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.idNumber'}
              onSelect={() => setSelectedFieldId('patient.idNumber')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.idNumber}
                onChange={(e) => setPatient({ ...patient, idNumber: e.target.value })}
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none ${getHighlightClass('patient.idNumber')}`}
                placeholder="V-00.000.000"
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('patient.age')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.age'}
              onSelect={() => setSelectedFieldId('patient.age')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.age}
                onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none text-center ${getHighlightClass('patient.age')}`}
                placeholder="Edad"
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('patient.date')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.date'}
              onSelect={() => setSelectedFieldId('patient.date')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.date}
                onChange={(e) => setPatient({ ...patient, date: e.target.value })}
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none text-center ${getHighlightClass('patient.date')}`}
                placeholder="Fecha"
              />
            </InteractiveField>

            {/* 2. Cuerpo del Informe */}
            <InteractiveField
              calibration={getCalib('informe.bodyText')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'informe.bodyText'}
              onSelect={() => setSelectedFieldId('informe.bodyText')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <textarea
                value={informeData.bodyText}
                onChange={(e) => setInformeData({ ...informeData, bodyText: e.target.value })}
                className={`w-full h-full bg-transparent text-slate-900 leading-relaxed font-medium outline-none resize-none font-sans p-2 border-none text-justify ${getHighlightClass('informe.bodyText')}`}
                placeholder="Redacte o edite el cuerpo estructurado del informe médico..."
              />
            </InteractiveField>

            {/* 3. Sello Oficial */}
            {showStamp && (
              <InteractiveField
                calibration={getCalib('stamp')}
                isCalibrating={isCalibrating}
                isSelected={selectedFieldId === 'stamp'}
                onSelect={() => setSelectedFieldId('stamp')}
                onChange={handleUpdateFieldCalibration}
                showZoneGuides={showZoneGuides}
              >
                <div className="w-full h-full pointer-events-none scale-85 origin-top-left flex items-center justify-center">
                  <OfficialMedicalStamp size="md" inkColor="navy" />
                </div>
              </InteractiveField>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* PLANTILLA 4: CONSTANCIA MÉDICA / REPOSO (Estampado Puro)  */}
        {/* ========================================================= */}
        {activeDoc === 'CONSTANCIA' && (
          <div id="constancia-official-sheet" className="relative w-[794px] h-[1123px]">
            {/* 1. Nombre y Apellido */}
            <InteractiveField
              calibration={getCalib('patient.fullName')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.fullName'}
              onSelect={() => setSelectedFieldId('patient.fullName')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.fullName || ''}
                onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none uppercase ${getHighlightClass('patient.fullName')}`}
                placeholder="Nombre y Apellido del paciente"
              />
            </InteractiveField>

            {/* 2. Cédula de Identidad */}
            <InteractiveField
              calibration={getCalib('patient.idNumber')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.idNumber'}
              onSelect={() => setSelectedFieldId('patient.idNumber')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.idNumber || ''}
                onChange={(e) => setPatient({ ...patient, idNumber: e.target.value })}
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none ${getHighlightClass('patient.idNumber')}`}
                placeholder="V-00.000.000"
              />
            </InteractiveField>

            {/* 3. Fecha de Consulta */}
            <InteractiveField
              calibration={getCalib('patient.date')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.date'}
              onSelect={() => setSelectedFieldId('patient.date')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={constanciaData.attendedDate || patient.date || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setConstanciaData({ ...constanciaData, attendedDate: val, restFrom: val });
                  setPatient({ ...patient, date: val });
                }}
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none text-center ${getHighlightClass('patient.date')}`}
                placeholder="DD/MM/AAAA"
              />
            </InteractiveField>

            {/* 4. Casilla Paciente [X] */}
            <InteractiveField
              calibration={getCalib('constancia.cond_paciente')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.cond_paciente'}
              onSelect={() => setSelectedFieldId('constancia.cond_paciente')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <button
                type="button"
                onClick={() => {
                  setConstanciaData((prev) => ({ ...prev, condition: 'Paciente' }));
                  setPatient((prev) => ({ ...prev, condition: 'Paciente' }));
                }}
                className="w-full h-full flex items-center justify-center font-black text-xs text-[#0a2540] hover:bg-blue-100/40 cursor-pointer rounded-xs"
                title="Condición: Paciente"
              >
                {(constanciaData.condition || patient.condition || 'Paciente') === 'Paciente' ? 'X' : ''}
              </button>
            </InteractiveField>

            {/* 5. Casilla Familiar [X] */}
            <InteractiveField
              calibration={getCalib('constancia.cond_familiar')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.cond_familiar'}
              onSelect={() => setSelectedFieldId('constancia.cond_familiar')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <button
                type="button"
                onClick={() => {
                  setConstanciaData((prev) => ({ ...prev, condition: 'Familiar' }));
                  setPatient((prev) => ({ ...prev, condition: 'Familiar' }));
                }}
                className="w-full h-full flex items-center justify-center font-black text-xs text-[#0a2540] hover:bg-blue-100/40 cursor-pointer rounded-xs"
                title="Condición: Familiar"
              >
                {(constanciaData.condition || patient.condition) === 'Familiar' ? 'X' : ''}
              </button>
            </InteractiveField>

            {/* 6. Casilla Reposo Sí [X] */}
            <InteractiveField
              calibration={getCalib('constancia.reposo_si')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.reposo_si'}
              onSelect={() => setSelectedFieldId('constancia.reposo_si')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <button
                type="button"
                onClick={() => {
                  const days = constanciaData.restDays === '00' || constanciaData.restDays === '0' ? '07' : constanciaData.restDays;
                  setConstanciaData((prev) => ({
                    ...prev,
                    needsRest: true,
                    restDays: days,
                    restDaysWords: `${days} días continuos`,
                    restTo: prev.restTo === '-' ? new Date(Date.now() + 7 * 86400000).toLocaleDateString('es-VE') : prev.restTo,
                  }));
                }}
                className="w-full h-full flex items-center justify-center font-black text-xs text-[#0a2540] hover:bg-blue-100/40 cursor-pointer rounded-xs"
                title="Amerita Reposo: SÍ"
              >
                {constanciaData.needsRest !== false && (Number(constanciaData.restDays) > 0 || constanciaData.restDays !== '00') ? 'X' : ''}
              </button>
            </InteractiveField>

            {/* 7. Casilla Reposo No [X] */}
            <InteractiveField
              calibration={getCalib('constancia.reposo_no')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.reposo_no'}
              onSelect={() => setSelectedFieldId('constancia.reposo_no')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <button
                type="button"
                onClick={() => {
                  setConstanciaData((prev) => ({
                    ...prev,
                    needsRest: false,
                    restDays: '00',
                    restDaysWords: 'Cero (00)',
                    restTo: '-',
                  }));
                }}
                className="w-full h-full flex items-center justify-center font-black text-xs text-[#0a2540] hover:bg-blue-100/40 cursor-pointer rounded-xs"
                title="Amerita Reposo: NO"
              >
                {constanciaData.needsRest === false || constanciaData.restDays === '00' || constanciaData.restDays === '0' ? 'X' : ''}
              </button>
            </InteractiveField>

            {/* 8. Campo Días (Número y Letras) */}
            <InteractiveField
              calibration={getCalib('constancia.restDays')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.restDays'}
              onSelect={() => setSelectedFieldId('constancia.restDays')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={constanciaData.restDaysWords || (constanciaData.restDays ? `${constanciaData.restDays} días` : '')}
                onChange={(e) => {
                  const val = e.target.value;
                  const cleanDays = val.replace(/\D/g, '');
                  const numDays = parseInt(cleanDays, 10) || 0;
                  let calculatedTo = constanciaData.restTo;
                  try {
                    const parts = (constanciaData.restFrom || patient.date || '').split('/');
                    if (parts.length === 3) {
                      const d = parseInt(parts[0], 10);
                      const m = parseInt(parts[1], 10) - 1;
                      const y = parseInt(parts[2], 10);
                      const startDate = new Date(y, m, d);
                      if (!isNaN(startDate.getTime())) {
                        calculatedTo = new Date(startDate.getTime() + numDays * 86400000).toLocaleDateString('es-VE');
                      }
                    }
                  } catch {}

                  setConstanciaData({
                    ...constanciaData,
                    restDays: cleanDays || val,
                    restDaysWords: val,
                    needsRest: numDays > 0,
                    restTo: numDays > 0 ? calculatedTo : '-',
                  });
                }}
                className="w-full h-full bg-transparent text-slate-900 font-bold px-1 outline-none border-none text-center"
                placeholder="Días"
              />
            </InteractiveField>

            {/* 9. Fecha Desde */}
            <InteractiveField
              calibration={getCalib('constancia.restFrom')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.restFrom'}
              onSelect={() => setSelectedFieldId('constancia.restFrom')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={constanciaData.restFrom || patient.date || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setConstanciaData({ ...constanciaData, restFrom: val });
                }}
                className="w-full h-full bg-transparent text-slate-900 font-bold px-1 outline-none border-none text-center"
                placeholder="DD/MM/AAAA"
              />
            </InteractiveField>

            {/* 10. Fecha Hasta */}
            <InteractiveField
              calibration={getCalib('constancia.restTo')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.restTo'}
              onSelect={() => setSelectedFieldId('constancia.restTo')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={constanciaData.restTo || ''}
                onChange={(e) => setConstanciaData({ ...constanciaData, restTo: e.target.value })}
                className="w-full h-full bg-transparent text-slate-900 font-bold px-1 outline-none border-none text-center"
                placeholder="DD/MM/AAAA"
              />
            </InteractiveField>

            {/* 11. Diagnóstico Formal (IDX) */}
            <InteractiveField
              calibration={getCalib('constancia.idx')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.idx'}
              onSelect={() => setSelectedFieldId('constancia.idx')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <textarea
                value={constanciaData.idx || ''}
                onChange={(e) => setConstanciaData({ ...constanciaData, idx: e.target.value })}
                className={`w-full h-full bg-transparent text-slate-900 leading-relaxed font-semibold outline-none resize-none font-sans p-1 border-none text-left ${getHighlightClass('constancia.idx')}`}
                placeholder="Diagnóstico formal e indicación médica..."
              />
            </InteractiveField>

            {/* 12. Expedición (Días, Mes, Año) */}
            <InteractiveField
              calibration={getCalib('constancia.requestDay')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'constancia.requestDay'}
              onSelect={() => setSelectedFieldId('constancia.requestDay')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={constanciaData.requestDay ? `Caracas, a los ${constanciaData.requestDay} días del mes de ${constanciaData.requestMonth || 'septiembre'} de ${constanciaData.requestYear || '2026'}` : `Caracas, ${patient.date || ''}`}
                onChange={(e) => setConstanciaData({ ...constanciaData, requestDay: e.target.value })}
                className="w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none text-left"
                placeholder="Caracas, fecha de expedición"
              />
            </InteractiveField>

            {/* 13. Sello Médico Oficial */}
            {showStamp && (
              <InteractiveField
                calibration={getCalib('stamp')}
                isCalibrating={isCalibrating}
                isSelected={selectedFieldId === 'stamp'}
                onSelect={() => setSelectedFieldId('stamp')}
                onChange={handleUpdateFieldCalibration}
                showZoneGuides={showZoneGuides}
              >
                <div className="w-full h-full pointer-events-none scale-85 origin-top-left flex items-center justify-center">
                  <OfficialMedicalStamp size="md" inkColor="navy" />
                </div>
              </InteractiveField>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PLANTILLA 5: HISTORIA CLÍNICA                             */}
        {/* ========================================================= */}
        {activeDoc === 'HISTORIA' && (
          <div id="historia-official-sheet" className="relative w-[794px] h-[1123px]">
            {/* 1. CAMPOS DE CABECERA */}
            <InteractiveField
              calibration={getCalib('patient.fullName')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.fullName'}
              onSelect={() => setSelectedFieldId('patient.fullName')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.fullName || ''}
                onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
                placeholder="Nombre y Apellido del paciente"
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none ${getHighlightClass('patient.fullName')}`}
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('patient.age')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.age'}
              onSelect={() => setSelectedFieldId('patient.age')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.age || ''}
                onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                placeholder="Edad"
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none text-center ${getHighlightClass('patient.age')}`}
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('patient.address')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.address'}
              onSelect={() => setSelectedFieldId('patient.address')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.address || ''}
                onChange={(e) => setPatient({ ...patient, address: e.target.value })}
                placeholder="Dirección del paciente"
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none ${getHighlightClass('patient.address')}`}
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('patient.phone')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.phone'}
              onSelect={() => setSelectedFieldId('patient.phone')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.phone || ''}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                placeholder="0412 / 0414 / 0424..."
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none ${getHighlightClass('patient.phone')}`}
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('patient.idNumber')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'patient.idNumber'}
              onSelect={() => setSelectedFieldId('patient.idNumber')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <input
                type="text"
                value={patient.idNumber || ''}
                onChange={(e) => setPatient({ ...patient, idNumber: e.target.value })}
                placeholder="V-00.000.000"
                className={`w-full h-full bg-transparent text-slate-900 font-bold px-2 outline-none border-none ${getHighlightClass('patient.idNumber')}`}
              />
            </InteractiveField>

            {/* 2. CAMPOS CLÍNICOS DEL CUERPO */}
            <InteractiveField
              calibration={getCalib('historia.motivo')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'historia.motivo'}
              onSelect={() => setSelectedFieldId('historia.motivo')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <textarea
                value={historiaData.motivoConsulta || ''}
                onChange={(e) => setHistoriaData({ ...historiaData, motivoConsulta: e.target.value })}
                placeholder="Indicar motivo de consulta..."
                className={`w-full h-full bg-transparent resize-none font-sans text-slate-900 leading-relaxed outline-none border-none p-1 ${getHighlightClass('historia.motivo')}`}
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('historia.enfermedad')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'historia.enfermedad'}
              onSelect={() => setSelectedFieldId('historia.enfermedad')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <textarea
                value={historiaData.enfermedadActual || ''}
                onChange={(e) => setHistoriaData({ ...historiaData, enfermedadActual: e.target.value })}
                placeholder="Evolución del cuadro actual..."
                className="w-full h-full bg-transparent resize-none font-sans text-slate-900 leading-relaxed outline-none border-none p-1"
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('historia.antecedentes')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'historia.antecedentes'}
              onSelect={() => setSelectedFieldId('historia.antecedentes')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <textarea
                value={historiaData.antecedentes || ''}
                onChange={(e) => setHistoriaData({ ...historiaData, antecedentes: e.target.value })}
                placeholder="Quirúrgicos, patológicos, alérgicos..."
                className="w-full h-full bg-transparent resize-none font-sans text-slate-900 leading-relaxed outline-none border-none p-1"
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('historia.examen')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'historia.examen'}
              onSelect={() => setSelectedFieldId('historia.examen')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <textarea
                value={historiaData.examenNeurologico || ''}
                onChange={(e) => setHistoriaData({ ...historiaData, examenNeurologico: e.target.value })}
                placeholder="Examen físico segmentario y neurológico..."
                className="w-full h-full bg-transparent resize-none font-sans text-slate-900 leading-relaxed outline-none border-none p-1"
              />
            </InteractiveField>

            <InteractiveField
              calibration={getCalib('historia.diagnostico')}
              isCalibrating={isCalibrating}
              isSelected={selectedFieldId === 'historia.diagnostico'}
              onSelect={() => setSelectedFieldId('historia.diagnostico')}
              onChange={handleUpdateFieldCalibration}
              showZoneGuides={showZoneGuides}
            >
              <textarea
                value={historiaData.diagnostico || ''}
                onChange={(e) => setHistoriaData({ ...historiaData, diagnostico: e.target.value })}
                placeholder="Diagnóstico formal definitivo / diferencial..."
                className={`w-full h-full bg-transparent resize-none font-sans font-bold text-slate-900 leading-relaxed outline-none border-none p-1 ${getHighlightClass('historia.diagnostico')}`}
              />
            </InteractiveField>

            {/* 3. Sello Oficial */}
            {showStamp && (
              <InteractiveField
                calibration={getCalib('stamp')}
                isCalibrating={isCalibrating}
                isSelected={selectedFieldId === 'stamp'}
                onSelect={() => setSelectedFieldId('stamp')}
                onChange={handleUpdateFieldCalibration}
                showZoneGuides={showZoneGuides}
              >
                <div className="w-full h-full pointer-events-none scale-85 origin-top-left flex items-center justify-center">
                  <OfficialMedicalStamp size="md" inkColor="navy" />
                </div>
              </InteractiveField>
            )}
          </div>
        )}

          </div>
        )}
      </div>

      {/* Modal de Protocolos Clínicos Frecuentes de Neurocirugía y Columna */}
      <ClinicalPresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onSelectPreset={handleApplyPreset}
      />

      {/* Modal de Envío de Documentos Oficiales en PDF por WhatsApp */}
      <WhatsAppPdfModal
        isOpen={isWhatsAppPdfModalOpen}
        onClose={() => setIsWhatsAppPdfModalOpen(false)}
        activeDoc={activeDoc}
        patient={patient}
        setActiveDoc={setActiveDoc}
        clinicalDataBundle={currentClinicalDataBundle}
      />

      {/* Modal de Tarjeta de Presentación Oficial CMI del Dr. Samir Moucharrafie */}
      <DoctorBusinessCard
        isModal
        isOpen={isDoctorCardOpen}
        onClose={() => setIsDoctorCardOpen(false)}
      />

      {/* Modal de Sincronización y Transferencia Celular ⇄ PC */}
      <SyncTemplatesModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onTemplatesUpdated={loadLocalTemplates}
      />

      {/* Modal de Carga de Papelería Original Escaneada con Calibración IA y soporte Multipágina */}
      <StationeryTemplateUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        activeDoc={activeDoc}
        customBgs={customBgs}
        onSaveTemplate={handleSaveCustomTemplate}
        onRemoveTemplate={handleRemoveCustomTemplate}
        onResetAll={handleResetAllTemplates}
      />

      {/* Modal de Archivos Originales PDF Precargados */}
      <OriginalPdfViewerModal
        isOpen={isOriginalPdfModalOpen}
        onClose={() => setIsOriginalPdfModalOpen(false)}
        initialDoc={activeDoc}
      />

      {/* Modal de Calibración Milimétrica V2 en Vivo (Drag & Drop) */}
      {isLiveCalibratorOpen && (
        <LiveCoordinateCalibratorModal
          initialDocType={activeDoc}
          customBgUrl={activeBgUrl}
          customBgs={customBgs}
          activeDocument={{ patient } as any}
          onClose={() => setIsLiveCalibratorOpen(false)}
          onApplyCoordinates={() => {
            FirestoreStationerySync.pushLocalCalibrationToCloud().catch(err => console.warn(err));
            setSaveStatus(`¡Coordenadas calibradas aplicadas exitosamente al generador de PDF!`);
            setTimeout(() => setSaveStatus(null), 3000);
          }}
        />
      )}

      {/* Modal de Herramientas Técnicas y de Soporte (Calibración, Sincronización, Papelería) */}
      <TechnicalToolsModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        activeDoc={activeDoc}
        showZoneGuides={showZoneGuides}
        onToggleZoneGuides={() => setShowZoneGuides(!showZoneGuides)}
        onOpenLiveCalibrator={() => setIsLiveCalibratorOpen(true)}
        onOpenUploader={() => setIsUploaderOpen(true)}
        onOpenOriginalPdf={() => setIsOriginalPdfModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onLoadDemoCase={handleLoadDemoCase}
      />

      {/* Modal de Configuración de Usuario y Modo Visual */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Drawer: Expediente 360° del Paciente con Línea de Tiempo */}
      <PatientTimelineDrawer
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        currentPatient={patient as PatientData}
        allHistory={(() => {
          try {
            const stored = localStorage.getItem('ccmi_documents_history_v1');
            return stored ? JSON.parse(stored) : [];
          } catch {
            return [];
          }
        })()}
        onReissueTreatment={(rxLeft, indicationsRight, diag) => {
          setRecipeData((prev) => ({
            ...prev,
            rxLeft: rxLeft,
            indicationsRight: indicationsRight,
            pharmacy: rxLeft,
            patientIndications: indicationsRight,
          }));
          if (diag) {
            setConstanciaData((prev) => ({ ...prev, idx: diag, diagnosis: diag }));
            setInformeData((prev) => ({ ...prev, bodyText: `Diagnóstico: ${diag}\n\n${prev.bodyText || ''}` }));
          }
          setActiveDoc('RECIPES');
          setSaveStatus('¡Tratamiento previo cargado en el Récipe con 1 solo clic!');
          setTimeout(() => setSaveStatus(null), 3500);
        }}
        onCopyDiagnosis={(diag) => {
          setConstanciaData((prev) => ({ ...prev, idx: diag, diagnosis: diag }));
          setSaveStatus('Diagnóstico copiado a los documentos.');
          setTimeout(() => setSaveStatus(null), 3000);
        }}
      />

      {/* Modal: Transferencia Rápida por Código QR al Celular / Secretaría */}
      <PatientQrHandoffModal
        isOpen={isQrHandoffOpen}
        onClose={() => setIsQrHandoffOpen(false)}
        patient={patient as PatientData}
        activeDoc={activeDoc}
      />

      {/* Modal: Extractor Inteligente de Sello y Firma */}
      <StampSignatureStudioModal
        isOpen={isStampStudioOpen}
        onClose={() => setIsStampStudioOpen(false)}
        onStampSaved={() => {
          setSaveStatus('Sello húmedo y firma transparente actualizados.');
          setTimeout(() => setSaveStatus(null), 3000);
        }}
      />

      {/* Modal: Dictado Clínico Inteligente Integral (SAMI Voice) */}
      <SmartConsultationDictationModal
        isOpen={isSmartDictationOpen}
        onClose={() => setIsSmartDictationOpen(false)}
        onApplyParsedData={(parsed) => {
          if (parsed.patient) {
            handlePatientChange({
              ...patient,
              fullName: parsed.patient.fullName || patient.fullName,
              idNumber: parsed.patient.idNumber || patient.idNumber,
              age: parsed.patient.age || patient.age,
            });
          }
          if (parsed.recipeLeft || parsed.recipeRight) {
            setRecipeData((prev) => ({
              ...prev,
              rxLeft: parsed.recipeLeft || prev.rxLeft,
              indicationsRight: parsed.recipeRight || prev.indicationsRight,
              pharmacy: parsed.recipeLeft || prev.pharmacy,
              patientIndications: parsed.recipeRight || prev.patientIndications,
            }));
          }
          if (parsed.informeBody) {
            setInformeData((prev) => ({ ...prev, bodyText: parsed.informeBody }));
          }
          if (parsed.diagnosis) {
            setConstanciaData((prev) => ({
              ...prev,
              idx: parsed.diagnosis,
              diagnosis: parsed.diagnosis,
              restDays: parsed.restDays ? Number(parsed.restDays) : prev.restDays,
            }));
          }
          if (parsed.labImaging) {
            setLabOtherExams((prev) => (prev ? `${prev}\n${parsed.labImaging}` : parsed.labImaging));
          }
          setSaveStatus('¡Consulta dictada estructurada en los 5 documentos oficiales!');
          setTimeout(() => setSaveStatus(null), 4000);
        }}
      />

      {/* Notificación Flotante de Auto-Calibración por IA */}
      {calibratingAiToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-950/95 text-white border-2 border-cyan-400 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-bold max-w-md ring-4 ring-cyan-500/20 backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-cyan-300 animate-spin shrink-0" />
          <span>{calibratingAiToast}</span>
        </div>
      )}
    </div>
  );
};
