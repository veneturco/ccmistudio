import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Stethoscope,
  Scissors,
  Check,
  Sparkles,
  MapPin,
  Mic,
  Share2,
  Users
} from 'lucide-react';
import { ClinicalAppointment, AppointmentType, AppointmentStatus, ConsultationModality } from '../types/agenda';
import { PatientData, DocType } from '../types';
import { FirestoreAgendaSync } from '../cloud/FirestoreAgendaSync';
import { formatWhatsAppPhone } from '../utils/pdfExportHelpers';

interface ClinicalAgendaViewProps {
  onStartConsultationForPatient: (patient: PatientData, docType?: DocType) => void;
  onOpenDictationForPatient?: (patient: PatientData) => void;
}

const STORAGE_AGENDA_KEY = 'ccmi_clinical_agenda_appointments_v1';

// Citas iniciales de demostración clínica del Dr. Samir en Orinokia
const INITIAL_DEMO_APPOINTMENTS: ClinicalAppointment[] = [
  {
    id: 'apt-001',
    tenantId: 'CCMI-DR-SAMIR',
    doctorUserId: 'dr-samir',
    patientId: 'V-16482903',
    patientName: 'Carlos Eduardo Mendoza Silva',
    patientNationalId: '16.482.903',
    patientPhone: '0424-912.83.41',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:30',
    endTime: '09:15',
    durationMinutes: 45,
    type: 'CONTROL',
    modality: 'PRESENCIAL',
    status: 'EN_SALA',
    reasonForVisit: 'Control postoperatorio de Microdiscectomía L4-L5 (Día 14). Retiro de puntos y evaluación de marcha.',
    notes: 'Paciente refiere disminución del 90% de ciatalgia izquierda. Deambula sin soporte.',
  },
  {
    id: 'apt-002',
    tenantId: 'CCMI-DR-SAMIR',
    doctorUserId: 'dr-samir',
    patientId: 'V-19842510',
    patientName: 'María Alejandra Gómez Rivas',
    patientNationalId: '19.842.510',
    patientPhone: '0414-883.21.09',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:30',
    endTime: '10:15',
    durationMinutes: 45,
    type: 'PRIMERA_VEZ',
    modality: 'PRESENCIAL',
    status: 'CONFIRMADA',
    reasonForVisit: 'Cervicobraquialgia derecha progresiva de 3 meses. Trae Resonancia Magnética de Columna Cervical.',
    notes: 'Posible hernia C5-C6. Requiere evaluación de reflejos y fuerza en extremidad superior derecha.',
  },
  {
    id: 'apt-003',
    tenantId: 'CCMI-DR-SAMIR',
    doctorUserId: 'dr-samir',
    patientId: 'V-12948201',
    patientName: 'Roberto José Alfonzo Salazar',
    patientNationalId: '12.948.201',
    patientPhone: '0424-955.44.11',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:30',
    endTime: '11:30',
    durationMinutes: 60,
    type: 'PROCEDIMIENTO_MENOR',
    modality: 'PRESENCIAL',
    status: 'CONFIRMADA',
    reasonForVisit: 'Bloqueo Facetario Lumbar L4-L5 y L5-S1 Guiado por Radioscopia en quirófano ambulatorio Orinokia.',
    notes: 'Tratamiento de síndrome facetario rebelde. Exámenes de coagulación en regla.',
  },
  {
    id: 'apt-004',
    tenantId: 'CCMI-DR-SAMIR',
    doctorUserId: 'dr-samir',
    patientId: 'V-23114982',
    patientName: 'Dayana Carolina Fuentes Pérez',
    patientNationalId: '23.114.982',
    patientPhone: '0416-682.11.45',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:45',
    endTime: '12:15',
    durationMinutes: 30,
    type: 'LECTURA_ESTUDIOS',
    modality: 'TELEMEDICINA',
    status: 'SOLICITADA',
    reasonForVisit: 'Revisión de informe de TAC cerebral contrastada por cefalea tensional recurrente.',
  },
];

export const ClinicalAgendaView: React.FC<ClinicalAgendaViewProps> = ({
  onStartConsultationForPatient,
  onOpenDictationForPatient,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [appointments, setAppointments] = useState<ClinicalAppointment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AGENDA_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[ClinicalAgendaView] Error leyendo citas previas:', e);
    }
    return INITIAL_DEMO_APPOINTMENTS;
  });

  const [filterStatus, setFilterStatus] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Suscripción en Tiempo Real Firestore ⇄ LocalStorage
  useEffect(() => {
    const unsub = FirestoreAgendaSync.subscribeToAppointments(
      (syncedList) => {
        if (Array.isArray(syncedList) && syncedList.length > 0) {
          setAppointments(syncedList);
        }
      },
      (err) => console.warn('[ClinicalAgendaView] Sync offline:', err)
    );
    return () => unsub();
  }, []);

  // Formulario de Nueva Cita
  const [formData, setFormData] = useState({
    patientName: '',
    patientNationalId: '',
    patientPhone: '',
    startTime: '09:00',
    durationMinutes: 45,
    type: 'PRIMERA_VEZ' as AppointmentType,
    modality: 'PRESENCIAL' as ConsultationModality,
    reasonForVisit: '',
    notes: '',
  });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AGENDA_KEY, JSON.stringify(appointments));
    } catch (e) {
      console.warn('[ClinicalAgendaView] Error guardando citas:', e);
    }
  }, [appointments]);

  // Citas del día seleccionado
  const dayAppointments = appointments.filter((apt) => apt.date === selectedDate);

  // Filtradas por búsqueda y estado
  const filteredAppointments = dayAppointments.filter((apt) => {
    const matchesStatus = filterStatus === 'TODAS' || apt.status === filterStatus;
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientNationalId.includes(searchTerm) ||
      (apt.reasonForVisit || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Métricas rápidas
  const totalDay = dayAppointments.length;
  const inWaitingRoom = dayAppointments.filter((a) => a.status === 'EN_SALA').length;
  const inConsultation = dayAppointments.filter((a) => a.status === 'EN_CONSULTA').length;
  const completed = dayAppointments.filter((a) => a.status === 'COMPLETADA').length;

  const handleUpdateStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === appointmentId) {
          return {
            ...apt,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return apt;
      })
    );
    FirestoreAgendaSync.updateStatus(appointmentId, newStatus).catch(() => {});
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName.trim()) return;

    const newApt: ClinicalAppointment = {
      id: `apt-${Date.now()}`,
      tenantId: 'CCMI-DR-SAMIR',
      doctorUserId: 'dr-samir',
      patientId: `V-${formData.patientNationalId.replace(/\D/g, '')}`,
      patientName: formData.patientName.trim(),
      patientNationalId: formData.patientNationalId.trim(),
      patientPhone: formData.patientPhone.trim(),
      date: selectedDate,
      startTime: formData.startTime,
      endTime: '',
      durationMinutes: Number(formData.durationMinutes) || 45,
      type: formData.type,
      modality: formData.modality,
      status: 'CONFIRMADA',
      reasonForVisit: formData.reasonForVisit.trim(),
      notes: formData.notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    FirestoreAgendaSync.saveAppointment(newApt).catch(() => {});
    setIsModalOpen(false);
    setFormData({
      patientName: '',
      patientNationalId: '',
      patientPhone: '',
      startTime: '09:00',
      durationMinutes: 45,
      type: 'PRIMERA_VEZ',
      modality: 'PRESENCIAL',
      reasonForVisit: '',
      notes: '',
    });
  };

  const handleSendWhatsAppReminder = (apt: ClinicalAppointment) => {
    if (!apt.patientPhone) return;
    const clean = formatWhatsAppPhone(apt.patientPhone);
    const text = encodeURIComponent(
      `Hola ${apt.patientName}, le recordamos su cita con el *Dr. Samir Moucharrafie* en el *Centro Clínico Médico Integral (CCMI - Orinokia Piso 2)* programada para el día *${apt.date}* a las *${apt.startTime}*.\n\n_Por favor confirmar su asistencia._`
    );
    const url = clean ? `https://wa.me/${clean}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const setDateToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'EN_SALA':
        return {
          label: 'En Sala de Espera',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'EN_CONSULTA':
        return {
          label: 'En Consulta',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
      case 'CONFIRMADA':
        return {
          label: 'Confirmada',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        };
      case 'COMPLETADA':
        return {
          label: 'Atendida',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'SOLICITADA':
        return {
          label: 'Por Confirmar',
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-700/50 text-slate-300 border-slate-600',
        };
    }
  };

  const getTypeBadge = (type: AppointmentType) => {
    switch (type) {
      case 'PROCEDIMIENTO_MENOR':
        return { label: 'Quirúrgico / Bloqueo', icon: Scissors, color: 'text-rose-400' };
      case 'POSTOPERATORIO':
        return { label: 'Postoperatorio', icon: Activity, color: 'text-amber-400' };
      case 'CONTROL':
        return { label: 'Control', icon: Stethoscope, color: 'text-cyan-400' };
      case 'LECTURA_ESTUDIOS':
        return { label: 'Lectura de Estudios', icon: FileText, color: 'text-indigo-400' };
      default:
        return { label: 'Primera Vez', icon: User, color: 'text-emerald-400' };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* 1. CABECERA EJECUTIVA DE AGENDA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#091b3b] via-[#0b2554] to-[#071329] p-5 rounded-3xl border border-blue-900/60 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Agenda Quirúrgica & Consultas
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Centro Médico Orinokia
            </span>
          </div>
          <p className="text-xs sm:text-sm text-blue-200/90 mt-1">
            Dr. Samir Moucharrafie • Control de flujo de pacientes, quirófanos y turnos de atención
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-900/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agendar Cita</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN DE FECHA & CONTADORES KPIS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Selector de Fecha */}
        <div className="lg:col-span-2 flex items-center justify-between bg-white dark:bg-[#091328] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={setDateToday}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-right">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer text-right"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>
        </div>

        {/* Tarjetas de Resumen Rápido */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#091328] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
              {inWaitingRoom}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              En Sala de Espera
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-[#091328] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
              {completed} / {totalDay}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Atendidas Hoy
            </p>
          </div>
        </div>
      </div>

      {/* 3. FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#091328] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['TODAS', 'EN_SALA', 'EN_CONSULTA', 'CONFIRMADA', 'COMPLETADA'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'TODAS'
                ? 'Todas'
                : st === 'EN_SALA'
                ? 'En Sala'
                : st === 'EN_CONSULTA'
                ? 'En Consulta'
                : st === 'CONFIRMADA'
                ? 'Confirmadas'
                : 'Atendidas'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. LISTADO DE CITAS DEL DÍA */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#091328] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No hay citas programadas para esta fecha o criterio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Haga clic en "+ Agendar Cita" para programar un paciente en Centro Médico Orinokia.
            </p>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const statusBadge = getStatusBadge(apt.status);
            const typeBadge = getTypeBadge(apt.type);
            const TypeIcon = typeBadge.icon;

            return (
              <div
                key={apt.id}
                className="bg-white dark:bg-[#091328] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-cyan-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Hora y Paciente */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-cyan-300 shrink-0 w-20 text-center">
                    <span className="text-sm sm:text-base font-black font-mono leading-none">
                      {apt.startTime}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {apt.durationMinutes} min
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                        {apt.patientName}
                      </h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        V-{apt.patientNationalId}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className={`flex items-center gap-1 font-semibold ${typeBadge.color}`}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span>{typeBadge.label}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{apt.patientPhone || 'Sin teléfono'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-500" />
                        <span>{apt.modality === 'PRESENCIAL' ? 'Orinokia Piso 2' : 'Telemedicina'}</span>
                      </span>
                    </div>

                    {apt.reasonForVisit && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium pt-1 line-clamp-2">
                        <span className="font-bold text-slate-700 dark:text-slate-200">Motivo: </span>
                        {apt.reasonForVisit}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex flex-wrap items-center gap-1.5 self-end md:self-center shrink-0">
                  {/* Botón Rápido: Llegó a Sala de Espera */}
                  {apt.status !== 'EN_SALA' && apt.status !== 'COMPLETADA' && apt.status !== 'EN_CONSULTA' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(apt.id, 'EN_SALA')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition cursor-pointer"
                      title="Marcar paciente como presente en la Sala de Espera"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Llegó a Sala</span>
                    </button>
                  )}

                  {/* Selector de Estado */}
                  <select
                    value={apt.status}
                    onChange={(e) => handleUpdateStatus(apt.id, e.target.value as AppointmentStatus)}
                    className="text-xs font-bold py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="SOLICITADA">Por Confirmar</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="EN_SALA">En Sala</option>
                    <option value="EN_CONSULTA">En Consulta</option>
                    <option value="COMPLETADA">Atendida</option>
                  </select>

                  {/* WhatsApp Recordatorio */}
                  {apt.patientPhone && (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReminder(apt)}
                      className="p-1.5 rounded-xl text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/30 transition cursor-pointer"
                      title="Enviar recordatorio de cita por WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Atender en Hoja A4 */}
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(apt.id, 'EN_CONSULTA');
                      const pData: PatientData = {
                        fullName: apt.patientName,
                        idNumber: apt.patientNationalId,
                        nationalId: apt.patientNationalId,
                        phone: apt.patientPhone,
                        age: '40',
                        date: apt.date,
                      };
                      onStartConsultationForPatient(pData, 'RECIPES');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition cursor-pointer"
                    title="Cargar paciente en la Papelería Oficial A4 e iniciar consulta"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Atender</span>
                  </button>

                  {/* Dictado IA */}
                  {onOpenDictationForPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(apt.id, 'EN_CONSULTA');
                        const pData: PatientData = {
                          fullName: apt.patientName,
                          idNumber: apt.patientNationalId,
                          nationalId: apt.patientNationalId,
                          phone: apt.patientPhone,
                          age: '40',
                          date: apt.date,
                        };
                        onOpenDictationForPatient(pData);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 transition cursor-pointer"
                      title="Dictar evolución clínica por voz para este paciente"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Voz</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL PARA CREAR NUEVA CITA */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#0c162e] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Programar Cita Médica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre Completo del Paciente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza Silva"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Cédula / ID
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 16.482.903"
                    value={formData.patientNationalId}
                    onChange={(e) => setFormData({ ...formData, patientNationalId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Teléfono Móvil
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 0424-912.83.41"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tipo de Cita
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AppointmentType })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="PRIMERA_VEZ">Primera Vez</option>
                    <option value="CONTROL">Control</option>
                    <option value="POSTOPERATORIO">Postoperatorio</option>
                    <option value="PROCEDIMIENTO_MENOR">Quirúrgico / Bloqueo</option>
                    <option value="LECTURA_ESTUDIOS">Lectura de Estudios</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Motivo de Consulta / Patología
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Hernia discal lumbar L5-S1, evaluación quirúrgica..."
                  value={formData.reasonForVisit}
                  onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer"
                >
                  Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
