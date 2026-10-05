import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  History, 
  ChevronRight, 
  CreditCard, 
  Pill, 
  FlaskConical, 
  CalendarCheck, 
  ClipboardList, 
  Boxes, 
  Menu, 
  X, 
  Code2, 
  Home,
  Stethoscope 
} from 'lucide-react';
import { ProcessedDocumentResult, DocType } from '../types';
import { BrandLogo } from './BrandLogo';
import { CmiSpecialtiesPortal } from './CmiSpecialtiesPortal';
import { DocumentSelectorWorkspace } from './DocumentSelectorWorkspace';
import { LogisticsQuoter } from './LogisticsQuoter';
import { HistoryList } from './HistoryList';
import { DoctorBusinessCard } from './DoctorBusinessCard';
import { DocumentZoneEditorStudio } from './DocumentZoneEditorStudio';
import { FirestoreStationerySync } from '../cloud/FirestoreStationerySync';

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

export const Dashboard: React.FC = () => {
  useEffect(() => {
    FirestoreStationerySync.initialize().catch((err) => {
      console.warn('[Dashboard] Sincronización offline:', err);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<'portal' | 'workspace' | 'history' | 'quoter' | 'developer_studio'>('portal');
  const [selectedDoc, setSelectedDoc] = useState<DocType>('RECIPES');
  const [documentsHistory] = useState<ProcessedDocumentResult[]>(INITIAL_HISTORY);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const docTabs: { id: DocType; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'RECIPES', name: 'Récipe (Doble Talón)', icon: Pill },
    { id: 'INFORME', name: 'Informe Médico', icon: FileText },
    { id: 'ORDEN_LAB', name: 'Orden de Exámenes', icon: FlaskConical },
    { id: 'CONSTANCIA', name: 'Constancia de Reposo', icon: CalendarCheck },
    { id: 'HISTORIA', name: 'Historia Clínica', icon: ClipboardList },
  ];

  return (
    <div id="socs-dashboard-root" className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans">
      <header className="bg-[#092347] text-white border-b border-blue-950/80 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div 
            onClick={() => setActiveTab('portal')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
            title="Ir al Portal Institucional CMI"
          >
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md group-hover:ring-2 group-hover:ring-cyan-400 transition">
              <BrandLogo size={32} />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-cyan-300 transition">
                  Dr. Samir Moucharrafie Naime
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/30 text-cyan-300 font-semibold border border-blue-400/20">
                  MPPS: 61231 • CMEB: 5331
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Neurocirujano • Cirugía de Columna Mínimamente Invasiva (UCBL Lyon 1)
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-[#061833] p-1 rounded-xl border border-blue-900/60 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'portal'
                  ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-300'
                  : 'text-cyan-300 hover:text-white hover:bg-blue-900/40'
              }`}
              title="Portal CMI de Especialidades Médicas"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Portal CMI</span>
            </button>

            <div className="h-4 w-px bg-blue-800/80 mx-0.5" />

            {docTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === 'workspace' && selectedDoc === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedDoc(tab.id);
                    setActiveTab('workspace');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-blue-900/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'quoter' ? 'portal' : 'quoter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                activeTab === 'quoter'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
              }`}
              title="Cotizador Logístico Quirúrgico Synapsis"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cotizador</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'developer_studio' ? 'workspace' : 'developer_studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer shadow-md ${
                activeTab === 'developer_studio'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-400/30 hover:border-amber-400'
              }`}
              title="Área exclusiva de Desarrollador"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Dev Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'history' ? 'workspace' : 'history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-[#092347] border-white shadow-sm'
                  : 'bg-blue-900/50 hover:bg-blue-800/60 text-blue-100 border-blue-700/50'
              }`}
              title="Historial de Documentos Emitidos"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Historial</span>
              <span className="px-1.5 py-0.2 bg-blue-950 text-cyan-300 rounded text-[10px] font-mono">
                {documentsHistory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsCardModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              title="Tarjeta de Presentación con QR y Sedes"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Tarjeta Dr. Samir</span>
            </button>

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

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#061833] border-t border-blue-900 p-3 space-y-1 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setActiveTab('portal');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'portal'
                  ? 'bg-cyan-600 text-white'
                  : 'text-cyan-300 hover:bg-blue-900/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>Portal CMI (Dr. Samir)</span>
              </div>
              {activeTab === 'portal' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
            </button>

            <div className="text-[10px] font-bold text-cyan-300 uppercase px-2 pt-2 pb-1">
              Papelería Oficial A4
            </div>
            {docTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === 'workspace' && selectedDoc === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedDoc(tab.id);
                    setActiveTab('workspace');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-blue-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-300" />}
                </button>
              );
            })}
            
            <div className="pt-2 border-t border-blue-900/60 mt-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('quoter');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
                  activeTab === 'quoter' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:bg-blue-900/40'
                }`}
              >
                <Boxes className="w-4 h-4 text-emerald-400" />
                <span>Cotizador Quirúrgico Synapsis</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('developer_studio');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
                  activeTab === 'developer_studio' ? 'bg-amber-400 text-slate-950 font-black' : 'text-amber-300 hover:bg-blue-900/40'
                }`}
              >
                <Code2 className="w-4 h-4 text-amber-400" />
                <span>🛠️ Developer Studio (Calibración & Formas PDF)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 py-4 sm:py-6 px-2 sm:px-6 max-w-7xl mx-auto w-full">
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
            />
          </div>
        )}

        {activeTab === 'workspace' && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('portal')}
                  className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Portal CMI</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium">Estación de Papelería Médica Oficial A4</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('portal')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
              >
                <span>← Volver al Portal CMI</span>
              </button>
            </div>

            <DocumentSelectorWorkspace 
              initialDocType={selectedDoc} 
              key={selectedDoc} 
              onOpenZoneEditor={() => setActiveTab('developer_studio')}
            />
          </div>
        )}

        {activeTab === 'developer_studio' && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('portal')}
                  className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Portal CMI</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium">Developer Studio (Calibración & Formas PDF)</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('portal')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
              >
                <span>← Volver al Portal CMI</span>
              </button>
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

        {activeTab === 'history' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Historial de Documentos Emitidos
                </h2>
                <p className="text-xs text-slate-500">
                  Registro de récipes, informes y constancias generadas en esta sesión.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('portal')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  ← Portal CMI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('workspace')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hoja de Trabajo A4
                </button>
              </div>
            </div>
            <HistoryList documents={documentsHistory} />
          </div>
        )}

        {activeTab === 'quoter' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Cotizador Logístico Quirúrgico Synapsis
                </h2>
                <p className="text-xs text-slate-500">
                  Presupuestos de implantes, prótesis y tornillos de columna / cráneo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('portal')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  ← Portal CMI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('workspace')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hoja de Trabajo A4
                </button>
              </div>
            </div>
            <LogisticsQuoter />
          </div>
        )}
      </main>

      <DoctorBusinessCard
        isModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />
    </div>
  );
};