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

  // Matriz de Permisos Granulares (Pilar 4)
  const canCalibrateA4 = user?.permissions?.canCalibrateA4 ?? (user?.role === 'ADMINISTRADOR' || user?.role === 'DESARROLLADOR' || user?.email === 'moucharrafiepc@gmail.com');
  const canManageStaff = user?.permissions?.canManageStaff ?? (user?.role === 'ADMINISTRADOR' || user?.role === 'DESARROLLADOR' || user?.email === 'moucharrafiepc@gmail.com');
  const canAccessQuoter = user?.permissions?.canAccessQuoter ?? (!isSecretary);
  const canViewFullHistory = user?.permissions?.canViewFullHistory ?? (!isSecretary);

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

  const [selectedDoc, setSelectedDoc] = useState<DocType>('HISTORIA');
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
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 pb-20 md:pb-0 relative ${
        isClinicalLight ? 'bg-slate-50 text-slate-900 light-bg-neural-mesh' : 'bg-[#030712] text-slate-100 bg-neural-mesh'
      }`}
    >
      {/* Main Content Wrapper (Above Background) */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Banner de Modo Quirófano / Hospital sin Cobertura */}
        <OfflineOperatingRoomBanner />

        {/* Banner / Prompt de Instalación PWA en Celular */}
        <PwaInstallPrompt />

      {/* 1. TOP EXECUTIVE CLINICAL BAR (APPLE PRO MINIMALIST) */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-200 backdrop-blur-xl ${
        isClinicalLight ? 'bg-white/90 border-slate-200/90 text-slate-900 shadow-xs' : 'bg-[#061226]/90 border-blue-950/80 text-white shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo e Identidad CcMi Studio */}
          <div 
            onClick={() => setActiveTab('portal')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
            title="Ir al Portal Institucional CcMi"
          >
            <div className={`w-9 h-9 rounded-xl p-1 flex items-center justify-center shadow-xs transition group-hover:scale-105 border ${
              isClinicalLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1e3d] border-cyan-500/30'
            }`}>
              <BrandLogo size={26} />
            </div>
            
            <div className="flex flex-col">
              <span className={`font-black text-sm tracking-tight transition ${
                isClinicalLight ? 'text-slate-900 group-hover:text-blue-600' : 'text-white group-hover:text-cyan-300'
              }`}>
                CcMi Studio
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline leading-none">
                Dr. Samir Moucharrafie
              </span>
            </div>
          </div>

          {/* Navegación Principal Modular: Ultra-Premium Segmented Control (Glassmorphism 2.0) */}
          <div className={`hidden md:flex items-center p-1.5 rounded-2xl border gap-1 shadow-inner ${
            isClinicalLight ? 'bg-white/60 backdrop-blur-xl border-slate-200/60' : 'bg-[#060d1d]/80 backdrop-blur-2xl border-white/5'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer relative overflow-hidden ${
                activeTab === 'agenda'
                  ? isClinicalLight
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gradient-to-r from-emerald-500/90 to-teal-400/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-white/10 scale-100'
                  : isClinicalLight
                  ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/80 hover:scale-105 active:scale-95'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-white/5 hover:scale-105 active:scale-95'
              }`}
              title="Agenda Quirúrgica y Consultas Médicas"
            >
              <CalendarIcon className={`w-4 h-4 transition-transform duration-300 ${activeTab !== 'agenda' && 'group-hover:scale-110 group-hover:-translate-y-0.5'}`} />
              <span>Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer relative overflow-hidden ${
                activeTab === 'history'
                  ? isClinicalLight
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/10 scale-100'
                  : isClinicalLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 hover:scale-105 active:scale-95'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 hover:scale-105 active:scale-95'
              }`}
              title="Historial de Documentos Emitidos"
            >
              <History className={`w-4 h-4 transition-transform duration-300 ${activeTab !== 'history' && 'group-hover:-rotate-90'}`} />
              <span>Historial</span>
              {documentsHistory.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {documentsHistory.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('workspace')}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer relative overflow-hidden ${
                activeTab === 'workspace'
                  ? isClinicalLight
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gradient-to-r from-blue-600/90 to-cyan-500/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-white/10 scale-100'
                  : isClinicalLight
                  ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 hover:scale-105 active:scale-95'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5 hover:scale-105 active:scale-95'
              }`}
              title="Estación de Papelería A4 y Récipes Oficiales"
            >
              <FileText className={`w-4 h-4 transition-transform duration-300 ${activeTab !== 'workspace' && 'group-hover:rotate-6'}`} />
              <span>Papelería A4</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer relative overflow-hidden ${
                activeTab === 'portal'
                  ? isClinicalLight
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-white/10 scale-100'
                  : isClinicalLight
                  ? 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 hover:scale-105 active:scale-95'
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-white/5 hover:scale-105 active:scale-95'
              }`}
              title="Portal CMI de Especialidades"
            >
              <Home className={`w-4 h-4 transition-transform duration-300 ${activeTab !== 'portal' && 'group-hover:scale-110'}`} />
              <span>Portal</span>
            </button>
          </div>

          {/* Utilidades Apple Pro (Luz/Oscuro, Cloud, Herramientas, Usuario) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Modo Iluminación Diurna / Oscura (Icono 32x32) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition cursor-pointer active:scale-95 ${
                isClinicalLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-amber-600 border-slate-300'
                  : 'bg-[#091833] hover:bg-slate-800 text-cyan-300 border-slate-700'
              }`}
              title={isClinicalLight ? 'Cambiar a Modo Oscuro' : "Cambiar a Modo 'Clinical Light'"}
            >
              {isClinicalLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Indicador de Estado Cloud Firestore (Minimal) */}
            <CloudStatusIndicator variant="minimal" />

            {/* Menú de Herramientas Clínicas & Sistema (Popover Consolidado) */}
            {!isSecretary && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-xs active:scale-95 ${
                    toolsMenuOpen
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : isClinicalLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
                  }`}
                  title="Herramientas técnicas, personal, sello, cotizador y ajustes"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Herramientas</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {toolsMenuOpen && (
                  <div 
                    className={`absolute right-0 mt-2 w-60 rounded-2xl p-2 shadow-2xl z-50 animate-fade-in border font-sans text-xs space-y-1 ${
                      isClinicalLight
                        ? 'bg-white border-slate-200 text-slate-800 shadow-slate-400/40'
                        : 'bg-[#09152b] border-slate-700 text-slate-200 shadow-2xl ring-1 ring-cyan-500/20'
                    }`}
                    onClick={() => setToolsMenuOpen(false)}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Clínica & Dictado
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dictation_ai')}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                        isClinicalLight ? 'hover:bg-slate-100 text-purple-700' : 'hover:bg-purple-950/40 text-purple-300'
                      }`}
                    >
                      <Mic className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="font-bold">Formulario Dictado IA</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('analytics')}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                        isClinicalLight ? 'hover:bg-slate-100 text-amber-700' : 'hover:bg-amber-950/40 text-amber-300'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="font-bold">Estadísticas Clínicas</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowWidgetsHub(!showWidgetsHub)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                        isClinicalLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-bold">Widgets Acceso Rápido</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        showWidgetsHub ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {showWidgetsHub ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <div className="my-1 border-t border-slate-700/50" />
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Operaciones & Soporte
                    </div>

                    {canCalibrateA4 && (
                      <button
                        type="button"
                        onClick={() => setIsTechModalOpen(true)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                          isClinicalLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Técnico & Calibración</span>
                      </button>
                    )}

                    {canManageStaff && (
                      <button
                        type="button"
                        onClick={() => setIsStaffModalOpen(true)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                          isClinicalLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <Users className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>Gestión de Personal</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsStampModalOpen(true)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                        isClinicalLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <Stamp className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Sello & Firma Médica</span>
                    </button>

                    {canAccessQuoter && (
                      <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === 'quoter' ? 'portal' : 'quoter')}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                          isClinicalLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <Boxes className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Cotizador Quirúrgico</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsCardModalOpen(true)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                        isClinicalLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Tarjeta de Presentación</span>
                    </button>

                    <div className="my-1 border-t border-slate-700/50" />
                    <button
                      type="button"
                      onClick={() => setIsSettingsModalOpen(true)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer font-bold ${
                        isClinicalLight ? 'hover:bg-slate-100 text-blue-800' : 'hover:bg-slate-800 text-blue-300'
                      }`}
                    >
                      <Sliders className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Ajustes & Visualización</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Perfil del Usuario / Cerrar Sesión */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-700/40">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-[11px] font-bold leading-tight truncate max-w-[120px]">
                    {user.displayName.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 font-semibold leading-none">
                    {user.role === 'MEDICO' ? 'Médico' : user.role === 'SECRETARIA' ? 'Secretaría' : user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer active:scale-95"
                  title={`Cerrar sesión (${user.email || ''})`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Botón de Menú Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable Estilo Apple */}
        {mobileMenuOpen && (
          <div className={`md:hidden p-3 space-y-1 animate-fade-in border-t ${
            isClinicalLight ? 'bg-white border-slate-200' : 'bg-[#061833] border-blue-900/60'
          }`}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('workspace');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'hover:bg-blue-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Papelería A4 y Récipes</span>
              </div>
              {activeTab === 'workspace' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('agenda');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'agenda' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-950/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <span>Agenda Quirúrgica y Consultas</span>
              </div>
              {activeTab === 'agenda' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'history' ? 'bg-slate-700 text-white' : 'hover:bg-blue-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Historial de Documentos</span>
              </div>
              <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                {documentsHistory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('portal');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'portal' ? 'bg-cyan-700 text-white' : 'hover:bg-blue-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-cyan-400" />
                <span>Portal CMI Especialidades</span>
              </div>
              {activeTab === 'portal' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('dictation_ai');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'dictation_ai' ? 'bg-purple-600 text-white' : 'hover:bg-purple-950/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-purple-400" />
                <span>Formulario Dictado IA</span>
              </div>
              {activeTab === 'dictation_ai' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            {canCalibrateA4 && (
              <button
                type="button"
                onClick={() => {
                  setIsTechModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-cyan-300 hover:bg-blue-900/40"
              >
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Herramientas Técnicas de Papelería</span>
              </button>
            )}

            {canAccessQuoter && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('quoter');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-300 hover:bg-blue-900/40"
              >
                <Boxes className="w-4 h-4 text-emerald-400" />
                <span>Cotizador Quirúrgico</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* NOTIFICACIÃ“N FLOTANTE */}
      {notificationToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-950/95 text-emerald-100 border border-emerald-500/40 shadow-2xl flex items-center gap-3 text-xs font-bold animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 2. ÁREA PRINCIPAL SEGÃšN PESTAÃ‘A ACTIVA */}
      <main key={activeTab} className="flex-1 py-4 sm:py-6 px-2 sm:px-6 max-w-7xl mx-auto w-full animate-fade-in-up">
        {/* SISTEMA DE WIDGETS DE ACCESO RÁPIDO CLÍNICO CONFIGURABLES */}
        {showWidgetsHub && (
          <QuickAccessWidgetsHub
            onSelectAction={handleExecuteQuickAction}
            className="mb-4 sm:mb-5"
          />
        )}

        {/* PESTAÃ‘A: PORTAL CMI */}
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

        
        {/* PESTAÃ‘A: ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}
        {/* PESTAÃ‘A: ESTACIÃ“N OFICIAL DE PAPELERÍA A4 */}
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

        {/* OPCIÃ“N A: FORMULARIO RÁPIDO DE DICTADO Y PROCESAMIENTO IA (MedicalForm) */}
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
                <span>â† Ir a Papelería A4</span>
              </button>
            </div>

            <MedicalForm onDocumentCreated={handleDocumentCreated} />
          </div>
        )}

        {/* OPCIÃ“N D: AGENDA QUIRÃšRGICA Y CITAS MÃ‰DICAS */}
        {activeTab === 'agenda' && (
          <div className="w-full space-y-3 animate-fade-in">
            <ClinicalAgendaView
              onStartConsultationForPatient={handlePatientFromAgendaToWorkspace}
              onOpenDictationForPatient={handlePatientFromAgendaToDictation}
            />
          </div>
        )}

        {/* OPCIÃ“N B: HISTORIAL DE DOCUMENTOS EMITIDOS */}
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

        {/* COTIZADOR LOGÍSTICO QUIRÃšRGICO */}
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
                  <span>â† Volver a Papelería A4</span>
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
      {/* OPCIÃ“N C: COPILOTO CLÍNICO SAMI (PRESENCIA GLOBAL)            */}
      {/* ============================================================ */}
      <SamiCopilot
        activePatient={activePatientData}
        activeView={activeTab}
        userRole="NEUROCIRUJANO"
      />

      {/* MODAL DE TARJETA DE PRESENTACIÃ“N DIGITAL */}
      <DoctorBusinessCard
        isModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      {/* MODAL DE CONFIGURACIÃ“N DE USUARIO Y HORARIO CIRCADIANO */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* ============================================================ */}
      {/* OPCIÃ“N G: MODALES DE HERRAMIENTAS TÃ‰CNICAS Y CALIBRACIÃ“N     */}
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
            setNotificationToast('Â¡Coordenadas calibradas aplicadas exitosamente!');
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

      {/* Modal: Sincronización Celular â‡„ PC */}
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

      {/* 5. BARRA DE NAVEGACIÃ“N INFERIOR PARA CELULARES (Bottom Nav Bar) */}
      <MobileBottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={documentsHistory.length}
        userRole={user?.role}
      />
      </div> {/* Closing relative wrapper */}
    </div>
  );
};
