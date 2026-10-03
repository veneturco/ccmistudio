import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Settings,
  CreditCard,
  Boxes,
} from 'lucide-react';
import { DocType, PatientData } from '../types';
import { 
  getActiveDraft, 
  getPendingConsultations, 
  PendingConsultation 
} from '../utils/pendingConsultationsStorage';
import { 
  getAllPatients, 
  PatientRecord 
} from '../utils/patientStorage';
import {
  computeDashboardPulseMetrics,
  getPatientSpotlightData,
  getUnifiedClinicalFeed,
  DashboardActivityFeedItem,
} from '../dashboard/DashboardSelectors';
import { ClinicalPulsePanel } from '../dashboard/ClinicalPulsePanel';
import { PatientSpotlightCard } from '../dashboard/PatientSpotlightCard';
import { UnifiedClinicalFeed } from '../dashboard/UnifiedClinicalFeed';
import { QuickActionHub } from '../dashboard/QuickActionHub';
import { FirestoreConnectionBadge } from './FirestoreConnectionBadge';
import { useAuth } from '../auth/AuthContext';
import { resolveUserGreetingInfo } from '../utils/userGreeting';

interface Props {
  onStartNewConsultation: () => void;
  onOpenDictation: () => void;
  onOpenPatients: () => void;
  onOpenDocuments: (docType?: DocType) => void;
  onOpenPending: () => void;
  onResumeDraft: (draft: PendingConsultation) => void;
  onOpenDoctorCard: () => void;
  onOpenQuoter: () => void;
  onOpenAdmin: () => void;
  onOpenAgenda?: () => void;
  onOpenOmnibox?: () => void;
  onOpenComparison?: (patientId?: string, eventAId?: string, eventBId?: string) => void;
  onOpenStudies?: (patientId?: string) => void;
  onOpenPatient360?: (patientId: string) => void;
  selectedPatientId?: string;
  onSelectPatientDirect?: (patient: PatientData) => void;
}

export const SynapsisHome: React.FC<Props> = ({
  onStartNewConsultation,
  onOpenPatients,
  onOpenDocuments,
  onOpenPending,
  onResumeDraft,
  onOpenDoctorCard,
  onOpenQuoter,
  onOpenAdmin,
  onOpenAgenda,
  onOpenOmnibox,
  onOpenComparison,
  onOpenStudies,
  onOpenPatient360,
  selectedPatientId,
  onSelectPatientDirect,
}) => {
  const [activeDraft, setActiveDraft] = useState<PendingConsultation | null>(null);
  const [pendingList, setPendingList] = useState<PendingConsultation[]>([]);
  const [allPatients, setAllPatients] = useState<PatientRecord[]>([]);
  const [activeSpotlightId, setActiveSpotlightId] = useState<string>(selectedPatientId || '');

  // Carga de estado, selectores puros y sincronización de eventos con limpieza estricta
  useEffect(() => {
    let isMounted = true;

    const handleSync = () => {
      if (!isMounted) return;
      const pending = getPendingConsultations();
      setPendingList(pending);
      const patients = getAllPatients({ includeArchived: false });
      setAllPatients(patients);
    };

    setActiveDraft(getActiveDraft());
    const pending = getPendingConsultations();
    setPendingList(pending);
    const patients = getAllPatients({ includeArchived: false });
    setAllPatients(patients);
    if (!activeSpotlightId && patients.length > 0) {
      setActiveSpotlightId(patients[0].nationalId);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('synapsis-patients-synced', handleSync);
      window.addEventListener('storage', handleSync);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('synapsis-patients-synced', handleSync);
        window.removeEventListener('storage', handleSync);
      }
    };
  }, [activeSpotlightId]);

  // Métricas de pulso, spotlight y feed cronológico reactivo
  const { user } = useAuth();
  const greetingInfo = resolveUserGreetingInfo(user);
  const pulseMetrics = computeDashboardPulseMetrics();
  const spotlightData = getPatientSpotlightData(activeSpotlightId);
  const activityFeed = getUnifiedClinicalFeed({ limit: 8 });

  // Validación oficial de Roles (RBAC) desde Firestore / Token IAM
  const isAuthorizedDoctor = user?.role === 'MEDICO';
  const isAuthorizedAdmin = user?.role === 'DESARROLLADOR' || user?.role === 'ADMINISTRADOR';
  const hasClinicalAccess = isAuthorizedDoctor || isAuthorizedAdmin || user?.role === 'RECEPCION' || user?.role === 'SECRETARIA';

  const getDocTypeHumanName = (type: DocType): string => {
    switch (type) {
      case 'RECIPES': return 'Récipe Médico';
      case 'ORDEN_LAB': return 'Orden de Laboratorio y Neuroimágenes';
      case 'INFORME': return 'Informe Neuroquirúrgico';
      case 'CONSTANCIA': return 'Constancia de Reposo';
      case 'HISTORIA': return 'Historia Clínica';
      default: return 'Documento Clínico';
    }
  };

  const handleStartConsultationWithPatient = (spotlight: any) => {
    if (onSelectPatientDirect) {
      onSelectPatientDirect({
        fullName: spotlight.fullName,
        idNumber: spotlight.nationalId,
        age: spotlight.age.replace(/[^\d]/g, '') || '40',
        phone: spotlight.phone,
        date: new Date().toLocaleDateString('es-VE'),
      });
    } else {
      onStartNewConsultation();
    }
  };

  const handleFeedEventSelect = (item: DashboardActivityFeedItem) => {
    if (item.sourceType === 'medical_document') {
      onOpenDocuments();
    } else if (item.sourceType === 'imaging_study') {
      if (onOpenStudies) {
        onOpenStudies(item.patientId);
      } else {
        onOpenPatients();
      }
    } else if (onOpenPatient360) {
      onOpenPatient360(item.patientId);
    } else {
      onOpenPatients();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 animate-fade-in pb-16">
      {/* 1. Header Institucional Estilo Stitch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span>CCMI • Command Center Clínico</span>
            </div>
            <FirestoreConnectionBadge variant="compact" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Centro de Mando Clínico e Inteligente
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            {isAuthorizedDoctor || isAuthorizedAdmin
              ? `${greetingInfo.fullName} • CCMI / Neurocirugía y Cirugía de Columna`
              : `${greetingInfo.fullName || 'Personal Clínico'} • CCMI`}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-slate-200">
            {greetingInfo.greeting},{' '}
            <span className="text-cyan-400 font-extrabold">{greetingInfo.salutation}</span>
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* 2. Centro de Acción Rápida (Atajos Ergonómicos) */}
      <QuickActionHub
        onStartNewConsultation={onStartNewConsultation}
        onOpenAgenda={onOpenAgenda}
        onOpenOmnibox={onOpenOmnibox || (() => {})}
        onOpenComparison={() => onOpenComparison ? onOpenComparison(activeSpotlightId) : onOpenPatients()}
        onOpenStudies={() => onOpenStudies ? onOpenStudies(activeSpotlightId) : onOpenPatients()}
        onOpenDocuments={() => onOpenDocuments()}
        onOpenPending={onOpenPending}
      />

      {/* 3. Pulso Clínico Operativo (Métricas en Tiempo Real) */}
      <ClinicalPulsePanel
        metrics={pulseMetrics}
        onOpenPatients={onOpenPatients}
        onOpenPending={onOpenPending}
        onOpenDocuments={() => onOpenDocuments()}
        onOpenStudies={() => onOpenStudies ? onOpenStudies(activeSpotlightId) : onOpenPatients()}
      />

      {/* 4. Ficha de Foco: Patient Spotlight */}
      <PatientSpotlightCard
        spotlight={spotlightData}
        allPatients={allPatients}
        onSelectPatientId={(id) => setActiveSpotlightId(id)}
        onStartConsultation={handleStartConsultationWithPatient}
        onOpenPatient360={(id) => onOpenPatient360 ? onOpenPatient360(id) : onOpenPatients()}
        onOpenTimeline={(id) => onOpenPatient360 ? onOpenPatient360(id) : onOpenPatients()}
        onOpenComparison={(id) => onOpenComparison ? onOpenComparison(id) : onOpenPatients()}
        onOpenStudies={(id) => onOpenStudies ? onOpenStudies(id) : onOpenPatients()}
        onOpenDocuments={() => onOpenDocuments()}
      />

      {/* 5. Grid de Doble Columna: Feed Cronológico Unificado y Continuar Donde Quedaste */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda (7/12): Feed Cronológico Unificado */}
        <div className="lg:col-span-7">
          <UnifiedClinicalFeed
            feed={activityFeed}
            onSelectEvent={handleFeedEventSelect}
            onOpenDirectory={onOpenPatients}
          />
        </div>

        {/* Columna Derecha (5/12): Secretaría y Continuar donde quedaste */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0d152a] rounded-3xl p-5 border border-slate-800/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Secretaría / Continuar Consulta
                </h3>
              </div>
              {activeDraft && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  Borrador Activo
                </span>
              )}
            </div>

            {activeDraft ? (
              <div className="p-4 rounded-2xl bg-[#091024] border border-amber-500/30 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-white">
                      {activeDraft.patient.fullName}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cédula: <span className="font-mono font-bold text-slate-200">{activeDraft.patient.idNumber}</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md">
                    {activeDraft.statusLabel || 'En progreso'}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  <span className="font-bold text-cyan-300">
                    {getDocTypeHumanName(activeDraft.docType)}
                  </span>
                  {activeDraft.summary && (
                    <p className="line-clamp-2 mt-1 italic text-slate-400">
                      "{activeDraft.summary}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onResumeDraft(activeDraft)}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reanudar Consulta en Curso</span>
                </button>
              </div>
            ) : pendingList.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Hay <strong className="text-white">{pendingList.length}</strong> consultas pendientes en secretaría clínica.
                </p>
                <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto">
                  {pendingList.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onResumeDraft(item)}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-900/60 px-2 rounded-xl transition cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {item.patient.fullName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {getDocTypeHumanName(item.docType)} • {item.statusLabel}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onOpenPending}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Ver todas las pendientes ({pendingList.length})
                </button>
              </div>
            ) : (
              <div className="py-6 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-slate-200">
                  Sin consultas pendientes
                </p>
                <p className="text-[11px] text-slate-400">
                  El flujo operacional se encuentra al día.
                </p>
              </div>
            )}
          </div>

          {/* Herramientas de Apoyo Clínico (Cotizador y Tarjeta) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onOpenDoctorCard}
              className="p-3.5 bg-[#0d152a] hover:bg-[#111b35] border border-slate-800/90 hover:border-cyan-500/40 rounded-2xl transition flex flex-col justify-between text-left group cursor-pointer shadow-sm"
            >
              <div className="p-2 w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-600 group-hover:text-white transition flex items-center justify-center mb-2">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">
                  Tarjeta Digital
                </h4>
                <p className="text-[10px] text-slate-400">
                  QR y Credenciales
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenQuoter}
              className="p-3.5 bg-[#0d152a] hover:bg-[#111b35] border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl transition flex flex-col justify-between text-left group cursor-pointer shadow-sm"
            >
              <div className="p-2 w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center justify-center mb-2">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">
                  Cotizador
                </h4>
                <p className="text-[10px] text-slate-400">
                  Osteosíntesis CMI
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Footer Discreto con Modo Administración */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          <span>{user?.displayName ? `${user.displayName} • ` : ''}CCMI • Centro Clínico Médico Integral</span>
        </div>
        {(isAuthorizedAdmin || isAuthorizedDoctor) && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer font-medium"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Administración y Calibración</span>
          </button>
        )}
      </div>
    </div>
  );
};
