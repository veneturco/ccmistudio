import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  History, 
  Printer, 
  UserCheck, 
  ChevronRight, 
  CreditCard, 
  Pill, 
  FlaskConical, 
  CalendarCheck, 
  ClipboardList,
  Boxes,
  Menu,
  X,
  Stethoscope,
  Sliders,
  Layers,
  Sparkles,
  Code2,
  Lock,
  Wrench,
  Home,
  Sun,
  Moon,
  Mic,
  Calendar as CalendarIcon,
  Settings,
  ShieldCheck,
  CheckCircle2, Activity,
  Zap,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ActiveNavTab, ProcessedDocumentResult, DocType, PatientData } from '../types';
import { BrandLogo } from './BrandLogo';
import { CmiSpecialtiesPortal } from './CmiSpecialtiesPortal';
import { DocumentSelectorWorkspace } from './DocumentSelectorWorkspace';
import { LogisticsQuoter } from './LogisticsQuoter';
import { HistoryList } from './HistoryList';
import { DoctorBusinessCard } from './DoctorBusinessCard';
import { DocumentZoneEditorStudio } from './DocumentZoneEditorStudio';
import { MedicalForm } from './MedicalForm';
import { ClinicalAgendaView } from './ClinicalAgendaView';
import { SamiCopilot } from './SamiCopilot';
import { TechnicalToolsModal } from './TechnicalToolsModal';
import { LiveCoordinateCalibratorModal } from './LiveCoordinateCalibratorModal';
import { StationeryTemplateUploaderModal } from './StationeryTemplateUploaderModal';
import { OriginalPdfViewerModal } from './OriginalPdfViewerModal';
import { SyncTemplatesModal } from './SyncTemplatesModal';
import { QuickAccessWidgetsHub } from './QuickAccessWidgetsHub';
import { FirestoreStationerySync } from '../cloud/FirestoreStationerySync';
import { useTheme } from '../context/ThemeContext';
import { UserSettingsModal } from './UserSettingsModal';
import { MobileBottomNavBar } from './MobileBottomNavBar';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { CloudStatusIndicator } from './CloudStatusIndicator';
import { StaffManagementModal } from './StaffManagementModal';
import { OfflineOperatingRoomBanner } from './OfflineOperatingRoomBanner';
import { StampSignatureStudioModal } from './StampSignatureStudioModal';
import { SmartConsultationDictationModal } from './SmartConsultationDictationModal';
import { Users, Stamp } from 'lucide-react';

// Registros iniciales de demostración en el historial
const INITIAL_HISTORY: ProcessedDocumentResult[] = [
  {
    id: 'doc_init_1',
    docNumber: 'SOCS-2026-10492',
    documentType: 'recipe',
    patient: {
      fullName: 'Mariana González Rivas',
      idType: 'V',
      nationalId: '14.230.198',
      age: '42',
      gender: 'F',
      allergies: 'Negadas',
      phone: '0412-9841029',
    },
    structuredData: {
      diagnosisPrincipal: 'Cervicalgia tensional aguda + Espasmo paravertebral',
      secondaryDiagnoses: [],
      cie10Suggestions: ['M54.2'],
      medications: [
        {
          id: 'm1',
          drug: 'Tiocolchicósido 4mg',
          dose: '1 cápsula',
          frequency: 'Cada 12 horas',
          duration: 'Por 5 días',
          instructions: 'Tomar después del desayuno y la cena.',
        },
        {
          id: 'm2',
          drug: 'Ketoprofeno 100mg',
          dose: '1 tableta',
          frequency: 'Cada 8 horas',
          duration: 'Por 4 días',
          instructions: 'Junto con protector gástrico.',
        },
      ],
      generalIndications: ['Calor local seco 15 min 2 veces al día', 'Evitar posturas forzadas'],
      summaryNote: 'Paciente con dolor en región cervical de 3 días de evolución posterior a sobrecarga laboral.',
    },
    templateName: 'Plantilla Oficial CcMi - Récipe Médico (Doble Talón)',
    googleDriveFileId: '1drive_ccmi_rec_091',
    googleDocUrl: 'https://docs.google.com',
    pdfExportUrl: '#pdf-preview',
    generatedAt: '05/09/2026',
    doctorName: 'Dr. Samir Moucharrafie',
    doctorRegistration: 'M.P.P.S. 61231 / C.M.E.B. 5331',
  },
  {
    id: 'doc_init_2',
    docNumber: 'SOCS-2026-10488',
    documentType: 'certificate',
    patient: {
      fullName: 'Héctor José Valera',
      idType: 'V',
      nationalId: '19.502.833',
      age: '31',
      gender: 'M',
      allergies: 'Dipirona',
      phone: '0416-5541299',
    },
    structuredData: {
      diagnosisPrincipal: 'Lumbociatalgia izquierda por hernia discal L5-S1',
      secondaryDiagnoses: [],
      medications: [],
      generalIndications: ['Reposo físico relativo', 'Crioterapia lumbar'],
      restDays: 7,
      summaryNote: 'Evaluación de columna lumbar. Requiere reposo e inicio de terapia física.',
    },
    templateName: 'Plantilla Oficial CcMi - Constancia de Reposo / Asistencia',
    googleDriveFileId: '1drive_ccmi_cert_084',
    googleDocUrl: 'https://docs.google.com',
    pdfExportUrl: '#pdf-preview',
    generatedAt: '03/09/2026',
    doctorName: 'Dr. Samir Moucharrafie',
    doctorRegistration: 'M.P.P.S. 61231 / C.M.E.B. 5331',
  },
];

import { AnalyticsDashboard } from './AnalyticsDashboard';
export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isClinicalLight, isAutoSchedule, toggleTheme } = useTheme();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [isSmartDictationModalOpen, setIsSmartDictationModalOpen] = useState(false);
  
  const isSecretary = user?.role === 'SECRETARIA' || user?.role === 'RECEPCION';
  const isDoctor = user?.role === 'MEDICO' || !user;

  // Inicialización de sincronización de calibraciones en Firestore
  useEffect(() => {
    FirestoreStationerySync.initialize().catch((err) => {
      console.warn('[Dashboard] Sincronización offline:', err);
    });
  }, []);

  // Pestaña Activa Principal:
  // - 'workspace': Estación Oficial de Papelería A4
  // - 'dictation_ai': Opción A: Formulario de Dictado y Procesamiento IA (MedicalForm)
  // - 'agenda': Opción D: Agenda Quirúrgica y Citas Médicas
  // - 'history': Opción B: Historial de Documentos Emitidos
  // - 'portal': Portal Institucional CMI
  // - 'quoter': Cotizador Logístico Quirúrgico
  // - 'developer_studio': Taller de Calibración
  const [activeTab, setActiveTab] = useState<
    'portal' | 'workspace' | 'dictation_ai' | 'agenda' | 'history' | 'quoter' | 'developer_studio' | 'analytics'
  >(() => {
    // Si entra la secretaria, abrir por defecto en Agenda
    if (user?.role === 'SECRETARIA' || user?.role === 'RECEPCION') {
      return 'agenda';
    }
    return 'workspace';
  });

  const [selectedDoc, setSelectedDoc] = useState<DocType>('RECIPES');
  const [activePatientData, setActivePatientData] = useState<PatientData | undefined>(undefined);
  const [documentsHistory, setDocumentsHistory] = useState<ProcessedDocumentResult[]>(() => {
    try {
      const stored = localStorage.getItem('ccmi_documents_history_v1');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[Dashboard] Error leyendo historial previo:', e);
    }
    return INITIAL_HISTORY;
  });

  // Modales
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modales Técnicos (Opción G)
  const [isTechModalOpen, setIsTechModalOpen] = useState<boolean>(false);
  const [isLiveCalibratorOpen, setIsLiveCalibratorOpen] = useState<boolean>(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const [isOriginalPdfModalOpen, setIsOriginalPdfModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [customBgs, setCustomBgs] = useState<Record<string, string>>({});
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Sistema de Widgets de Acceso Rápido Clínico (Oculto por defecto para no saturar)
  const [showWidgetsHub, setShowWidgetsHub] = useState<boolean>(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState<boolean>(false);
  const [activePresetData, setActivePresetData] = useState<any>(undefined);

  // Persistir historial al actualizar
  useEffect(() => {
    try {
      localStorage.setItem('ccmi_documents_history_v1', JSON.stringify(documentsHistory));
    } catch (e) {
      console.warn('[Dashboard] Error guardando historial:', e);
    }
  }, [documentsHistory]);

  const docTabs: { id: DocType; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'RECIPES', name: 'Récipe (Doble Talón)', icon: Pill },
    { id: 'INFORME', name: 'Informe Médico', icon: FileText },
    { id: 'ORDEN_LAB', name: 'Orden de Exámenes', icon: FlaskConical },
    { id: 'CONSTANCIA', name: 'Constancia de Reposo', icon: CalendarCheck },
    { id: 'HISTORIA', name: 'Historia Clínica', icon: ClipboardList },
  ];

  const handleDocumentCreated = (newDoc: ProcessedDocumentResult) => {
    setDocumentsHistory((prev) => [newDoc, ...prev]);
    setNotificationToast(`Documento ${newDoc.docNumber} registrado en el historial.`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const handlePatientFromAgendaToWorkspace = (p: PatientData, doc: DocType = 'RECIPES') => {
    setActivePatientData(p);
    setSelectedDoc(doc);
    setActiveTab('workspace');
  };

  const handlePatientFromAgendaToDictation = (p: PatientData) => {
    setActivePatientData(p);
    setActiveTab('dictation_ai');
  };

  /**
   * Ejecución en 1 Clic desde el Sistema de Widgets de Acceso Rápido
   */
  const handleExecuteQuickAction = (targetAction: DocType | 'DICTADO' | 'AGENDA', presetData?: any) => {
    if (targetAction === 'DICTADO') {
      setActiveTab('dictation_ai');
      setNotificationToast('Iniciado formulario de Dictado IA.');
      setTimeout(() => setNotificationToast(null), 2500);
      return;
    }
    if (targetAction === 'AGENDA') {
      setActiveTab('agenda');
      setNotificationToast('Abierta la Agenda Quirúrgica y Consultas.');
      setTimeout(() => setNotificationToast(null), 2500);
      return;
    }

    // Plantillas A4 Oficiales (RECIPES, INFORME, ORDEN_LAB, CONSTANCIA, HISTORIA)
    setSelectedDoc(targetAction);
    setActivePresetData(presetData);
    setActiveTab('workspace');
    setNotificationToast(`Plantilla de ${targetAction} cargada con protocolo en 1 clic.`);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  return (
    <div 
      id="socs-dashboard-root" 
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 pb-20 md:pb-0 ${
        isClinicalLight ? 'bg-slate-100/90 text-slate-900' : 'bg-[#060c1c] text-slate-100'
      }`}
    >
      {/* Banner de Modo Quirófano / Hospital sin Cobertura */}
      <OfflineOperatingRoomBanner />

      {/* Banner / Prompt de Instalación PWA en Celular */}
      <PwaInstallPrompt />

      {/* 1. TOP EXECUTIVE CLINICAL BAR */}
      <header className={`text-white border-b sticky top-0 z-40 shadow-md transition-colors duration-200 ${
        isClinicalLight ? 'bg-[#0b3366] border-blue-900/60 shadow-blue-950/20' : 'bg-[#092347] border-blue-950/80 shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo e Identidad del Doctor */}
          <div 
            onClick={() => setActiveTab('portal')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
            title="Ir al Portal Institucional CMI"
          >
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md group-hover:ring-2 group-hover:ring-cyan-400 transition">
              <BrandLogo size={32} />
            </div>
            
            <div className="hidden lg:block">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-cyan-300 transition">
                  Dr. Samir Moucharrafie
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/30 text-cyan-300 font-semibold border border-blue-400/20">
                  Orinokia Piso 2
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Neurocirugía • Columna Mínimamente Invasiva
              </p>
            </div>
          </div>

          {/* Navegación Principal Modular: Portal | Papelería A4 | Dictado IA (A) | Agenda (D) | Historial (B) */}
          <div className="hidden md:flex items-center bg-[#061833] p-1 rounded-xl border border-blue-900/60 gap-1 overflow-x-auto">
            {/* 1. Portal CMI */}
            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'portal'
                  ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-300'
                  : 'text-cyan-300 hover:text-white hover:bg-blue-900/40'
              }`}
              title="Portal CMI de Especialidades Médicas"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Portal</span>
            </button>

            {/* 2. Papelería A4 (Documentos Oficiales) */}
            <button
              type="button"
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-300'
                  : 'text-slate-300 hover:text-white hover:bg-blue-900/40'
              }`}
              title="Estación de Trabajo Oficial de Papelería A4"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-300" />
              <span>Papelería A4</span>
            </button>

            {/* 3. Opción A: Formulario de Dictado y Procesamiento IA (MedicalForm) - Solo Médico/Admin */}
            {!isSecretary && (
              <button
                type="button"
                onClick={() => setActiveTab('dictation_ai')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  activeTab === 'dictation_ai'
                    ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-300'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
                }`}
                title="Opción A: Formulario Rápido de Dictado por Voz y Procesamiento IA con Gemini"
              >
                <Mic className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                <span>Dictado IA</span>
              </button>
            )}

            {/* 4. Opción D: Agenda Quirúrgica y Citas Médicas */}
            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
              }`}
              title="Opción D: Agenda Quirúrgica y Control de Citas Médicas en Orinokia"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span>Agenda</span>
            </button>

            {/* 5. Opción B: Historial de Documentos Emitidos */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-[#092347] font-black shadow-sm ring-1 ring-cyan-300'
                  : 'text-slate-300 hover:text-white hover:bg-blue-900/40'
              }`}
              title="Opción B: Historial de Documentos y Récipes Emitidos"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Historial</span>
              <span className="px-1.5 py-0.2 bg-blue-950 text-cyan-300 rounded text-[10px] font-mono">
                {documentsHistory.length}
              </span>
            </button>
            {/* OPCIÓN ANALYTICS */}
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-300'
                  : 'text-amber-300 hover:text-white hover:bg-amber-900/40'
              }`}
              title="Dashboard Analítico y Estadístico"
            >
              <Activity className="w-3.5 h-3.5 text-amber-300" />
              <span>Estadísticas</span>
            </button>

          </div>

          {/* Acciones Rápidas & Herramientas */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sistema de Widgets de Acceso Rápido Clínico */}
            <button
              type="button"
              onClick={() => setShowWidgetsHub(!showWidgetsHub)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer shadow-xs ${
                showWidgetsHub
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-cyan-900/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
              }`}
              title="Mostrar u ocultar los Widgets de Acceso Rápido Clínico"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Widgets</span>
            </button>

            {/* Opción G: Botón Directo a Herramientas Técnicas de Papelería (Solo Médico/Admin) */}
            {/* Menú de Herramientas Clínicas / Ajustes Avanzados */}
            {!isSecretary && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 transition cursor-pointer shadow-xs"
                  title="Herramientas técnicas, personal, sello, cotizador y tarjeta"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Herramientas</span>
                  <ChevronDown className="w-3 h-3 text-cyan-400" />
                </button>

                {toolsMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-52 bg-[#09152b] border border-cyan-500/30 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in text-xs space-y-1 font-sans"
                    onClick={() => setToolsMenuOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setIsTechModalOpen(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 font-bold transition text-left cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Técnico & Calibración (G)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsStaffModalOpen(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-purple-950/60 hover:text-purple-300 font-bold transition text-left cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Gestión de Personal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsStampModalOpen(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 font-bold transition text-left cursor-pointer"
                    >
                      <Stamp className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Sello & Firma Médica</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'quoter' ? 'portal' : 'quoter')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 font-bold transition text-left cursor-pointer"
                    >
                      <Boxes className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Cotizador Quirúrgico</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCardModalOpen(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-blue-950/60 hover:text-cyan-300 font-bold transition text-left cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Tarjeta de Presentación</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Selector Rápido Día / Noche */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                isClinicalLight
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-xs'
                  : 'bg-blue-950/80 hover:bg-blue-900 text-cyan-300 border-blue-700/60'
              }`}
              title={
                isAutoSchedule
                  ? `Horario Clínico Automático (07:00-18:30: Luz Diurna) • Clic para alternar a ${isClinicalLight ? 'Oscuro' : 'Luz Diurna'}`
                  : isClinicalLight
                  ? 'Cambiar a Modo Oscuro'
                  : "Cambiar a Modo 'Clinical Light' (Luz Diurna)"
              }
            >
              {isClinicalLight ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden xl:inline">Luz</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden xl:inline">Oscuro</span>
                </>
              )}
              {isAutoSchedule && (
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                  isClinicalLight ? 'bg-amber-200 text-amber-900' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                }`}>
                  Auto
                </span>
              )}
            </button>

            {/* Indicador de Estado Cloud Firestore (Paz Mental Multidispositivo) */}
            <CloudStatusIndicator />

            {/* Botón Ajustes de Usuario */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-900/50 hover:bg-blue-800/70 text-slate-200 border border-blue-700/50 transition cursor-pointer shadow-xs"
              title="Configuración de usuario, contraste y visualización"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>

            {/* Usuario Autenticado & Cerrar Sesión */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-blue-900/60">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[130px]">
                    {user.displayName.split(' ')[0]} {user.displayName.split(' ')[1] || ''}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 font-semibold">
                    {user.role === 'MEDICO' ? 'Médico' : user.role === 'SECRETARIA' ? 'Secretaría' : user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900/80 transition cursor-pointer"
                  title={`Cerrar sesión (${user.email || ''})`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-blue-200 hover:text-white rounded-lg hover:bg-blue-900/50 cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#061833] border-t border-blue-900 p-3 space-y-1 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setActiveTab('portal');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'portal' ? 'bg-cyan-600 text-white' : 'text-cyan-300 hover:bg-blue-900/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>Portal CMI (Dr. Samir)</span>
              </div>
              {activeTab === 'portal' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('workspace');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-blue-900/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Papelería Médica Oficial A4</span>
              </div>
              {activeTab === 'workspace' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('dictation_ai');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-black transition ${
                activeTab === 'dictation_ai' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:bg-purple-950/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                <span>🎙️ Dictado y Procesamiento IA (Opción A)</span>
              </div>
              {activeTab === 'dictation_ai' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('agenda');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'agenda' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:bg-emerald-950/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <span>📅 Agenda Quirúrgica y Citas (Opción D)</span>
              </div>
              {activeTab === 'agenda' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'history' ? 'bg-white text-slate-900 font-black' : 'text-slate-200 hover:bg-blue-900/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>📋 Historial de Documentos (Opción B)</span>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-950 text-cyan-300 px-2 py-0.5 rounded">
                {documentsHistory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsTechModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-cyan-300 hover:bg-blue-900/40"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>⚙️ Herramientas Técnicas de Papelería (Opción G)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('quoter');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-emerald-300 hover:bg-blue-900/40"
            >
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Cotizador Quirúrgico Synapsis</span>
            </button>
          </div>
        )}
      </header>

      {/* NOTIFICACIÓN FLOTANTE */}
      {notificationToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-950/95 text-emerald-100 border border-emerald-500/40 shadow-2xl flex items-center gap-3 text-xs font-bold animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 2. ÁREA PRINCIPAL SEGÚN PESTAÑA ACTIVA */}
      <main className="flex-1 py-4 sm:py-6 px-2 sm:px-6 max-w-7xl mx-auto w-full">
        {/* SISTEMA DE WIDGETS DE ACCESO RÁPIDO CLÍNICO CONFIGURABLES */}
        {showWidgetsHub && (
          <QuickAccessWidgetsHub
            onSelectAction={handleExecuteQuickAction}
            className="mb-4 sm:mb-5"
          />
        )}

        {/* PESTAÑA: PORTAL CMI */}
        {activeTab === 'portal' && (
          <div className="w-full animate-fade-in">
            <CmiSpecialtiesPortal
              onOpenCard={() => setIsCardModalOpen(true)}
              onNavigateToDocs={(docType) => {
                if (docType === 'EXAMENES') {
                  setSelectedDoc('ORDEN_LAB');
                } else if (docType && ['RECIPES', 'INFORME', 'ORDEN_LAB', 'CONSTANCIA', 'HISTORIA'].includes(docType)) {
                  setSelectedDoc(docType as DocType);
                } else {
                  setSelectedDoc('RECIPES');
                }
                setActiveTab('workspace');
              }}
              onNavigateToQuoter={() => setActiveTab('quoter')}
              onNavigateToAgenda={() => setActiveTab('agenda')}
            />
          </div>
        )}

        
        {/* PESTAÑA: ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}
        {/* PESTAÑA: ESTACIÓN OFICIAL DE PAPELERÍA A4 */}
        {activeTab === 'workspace' && (
          <div className="w-full">
            <DocumentSelectorWorkspace 
              initialDocType={selectedDoc}
              initialPatient={activePatientData}
              initialPresetData={activePresetData}
              key={`${selectedDoc}-${activePatientData?.idNumber || 'default'}-${activePresetData?.diagnosis || 'none'}`} 
              onOpenZoneEditor={() => setActiveTab('developer_studio')}
              onPatientChange={(p) => setActivePatientData(p)}
            />
          </div>
        )}

        {/* OPCIÓN A: FORMULARIO RÁPIDO DE DICTADO Y PROCESAMIENTO IA (MedicalForm) */}
        {activeTab === 'dictation_ai' && (
          <div className="w-full space-y-3 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-[#091328] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold uppercase font-mono">
                  Opción A
                </span>
                <span className="font-bold text-slate-900 dark:text-white">Formulario de Dictado Clínico y Procesamiento con IA Gemini</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('workspace')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
              >
                <span>← Ir a Papelería A4</span>
              </button>
            </div>

            <MedicalForm onDocumentCreated={handleDocumentCreated} />
          </div>
        )}

        {/* OPCIÓN D: AGENDA QUIRÚRGICA Y CITAS MÉDICAS */}
        {activeTab === 'agenda' && (
          <div className="w-full space-y-3 animate-fade-in">
            <ClinicalAgendaView
              onStartConsultationForPatient={handlePatientFromAgendaToWorkspace}
              onOpenDictationForPatient={handlePatientFromAgendaToDictation}
            />
          </div>
        )}

        {/* OPCIÓN B: HISTORIAL DE DOCUMENTOS EMITIDOS */}
        {activeTab === 'history' && (
          <div className="space-y-4 max-w-5xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-[#091328] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Historial de Documentos Emitidos (Opción B)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registro de récipes, informes, constancias y exámenes generados en el sistema.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('workspace')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Nueva Hoja A4
                </button>
              </div>
            </div>
            <HistoryList documents={documentsHistory} />
          </div>
        )}

        {/* COTIZADOR LOGÍSTICO QUIRÚRGICO */}
        {activeTab === 'quoter' && (
          <div className="space-y-4 max-w-5xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-[#091328] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Cotizador Logístico Quirúrgico Synapsis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Presupuestos de implantes, prótesis y tornillos de columna / cráneo en Centro Médico Orinokia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('workspace')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Volver a Papelería A4
              </button>
            </div>
            <LogisticsQuoter />
          </div>
        )}

        {/* DEVELOPER STUDIO */}
        {activeTab === 'developer_studio' && (
          <div className="w-full space-y-3 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-[#091328] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('workspace')}
                  className="text-blue-700 dark:text-cyan-400 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>← Volver a Papelería A4</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Developer Studio (Calibración & Formas PDF)</span>
              </div>
            </div>

            <DocumentZoneEditorStudio
              initialDoc={selectedDoc}
              onClose={() => setActiveTab('workspace')}
              onNavigateToWorkspace={(doc) => {
                setSelectedDoc(doc);
                setActiveTab('workspace');
              }}
            />
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* OPCIÓN C: COPILOTO CLÍNICO SAMI (PRESENCIA GLOBAL)            */}
      {/* ============================================================ */}
      <SamiCopilot
        activePatient={activePatientData}
        activeView={activeTab}
        userRole="NEUROCIRUJANO"
      />

      {/* MODAL DE TARJETA DE PRESENTACIÓN DIGITAL */}
      <DoctorBusinessCard
        isModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      {/* MODAL DE CONFIGURACIÓN DE USUARIO Y HORARIO CIRCADIANO */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* ============================================================ */}
      {/* OPCIÓN G: MODALES DE HERRAMIENTAS TÉCNICAS Y CALIBRACIÓN     */}
      {/* ============================================================ */}
      <TechnicalToolsModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        activeDoc={selectedDoc}
        onOpenLiveCalibrator={() => setIsLiveCalibratorOpen(true)}
        onOpenUploader={() => setIsUploaderOpen(true)}
        onOpenOriginalPdf={() => setIsOriginalPdfModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Modal: Calibrador Milimétrico en Vivo */}
      {isLiveCalibratorOpen && (
        <LiveCoordinateCalibratorModal
          initialDocType={selectedDoc}
          customBgs={customBgs}
          activeDocument={{ patient: activePatientData } as any}
          onClose={() => setIsLiveCalibratorOpen(false)}
          onApplyCoordinates={() => {
            FirestoreStationerySync.pushLocalCalibrationToCloud().catch((err) => console.warn(err));
            setNotificationToast('¡Coordenadas calibradas aplicadas exitosamente!');
            setTimeout(() => setNotificationToast(null), 3000);
          }}
        />
      )}

      {/* Modal: Cargador de Papelería Escaneada con IA */}
      <StationeryTemplateUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        activeDoc={selectedDoc}
        customBgs={customBgs}
        onSaveTemplate={(docType, url) => {
          setCustomBgs((prev) => ({ ...prev, [docType]: url }));
          setNotificationToast(`Papelería para ${docType} actualizada.`);
          setTimeout(() => setNotificationToast(null), 3000);
        }}
        onRemoveTemplate={(docType) => {
          setCustomBgs((prev) => {
            const next = { ...prev };
            delete next[docType];
            return next;
          });
        }}
        onResetAll={() => setCustomBgs({})}
      />

      {/* Modal: Visor de PDFs Originales */}
      <OriginalPdfViewerModal
        isOpen={isOriginalPdfModalOpen}
        onClose={() => setIsOriginalPdfModalOpen(false)}
        initialDoc={selectedDoc}
      />

      {/* Modal: Sincronización Celular ⇄ PC */}
      <SyncTemplatesModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onTemplatesUpdated={() => {
          setNotificationToast('Plantillas sincronizadas desde la nube.');
          setTimeout(() => setNotificationToast(null), 3000);
        }}
      />

      {/* Modal: Gestión de Personal y Accesos Multi-Doctor */}
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />

      {/* Modal: Extractor Inteligente de Sello y Firma */}
      <StampSignatureStudioModal
        isOpen={isStampModalOpen}
        onClose={() => setIsStampModalOpen(false)}
        onStampSaved={() => {
          setNotificationToast('Sello y firma transparentes actualizados.');
          setTimeout(() => setNotificationToast(null), 3000);
        }}
      />

      {/* Modal: Dictado Clínico Inteligente Integral */}
      <SmartConsultationDictationModal
        isOpen={isSmartDictationModalOpen}
        onClose={() => setIsSmartDictationModalOpen(false)}
        onApplyParsedData={(parsed) => {
          setActiveTab('workspace');
          setActivePatientData((prev) => ({
            ...prev,
            ...parsed.patient,
            fullName: parsed.patient.fullName || prev?.fullName || '',
            idNumber: parsed.patient.idNumber || prev?.idNumber || '',
            age: parsed.patient.age || prev?.age || '',
          }));
          setNotificationToast('Dictado clínico estructurado en los documentos.');
          setTimeout(() => setNotificationToast(null), 3500);
        }}
      />

      {/* 5. BARRA DE NAVEGACIÓN INFERIOR PARA CELULARES (Bottom Nav Bar) */}
      <MobileBottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={documentsHistory.length}
        userRole={user?.role}
      />
    </div>
  );
};
