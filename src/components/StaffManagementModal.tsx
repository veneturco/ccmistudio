import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Stethoscope, 
  Calendar, 
  Code2, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Search,
  Sparkles,
  Smartphone,
  Lock,
  Edit3,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Stamp,
  FileText,
  DollarSign,
  Sliders,
  Check,
  ChevronRight,
  UploadCloud,
  FileCheck2,
  Eye,
  Camera
} from 'lucide-react';
import { staffDirectoryService } from '../cloud/StaffDirectoryService';
import { 
  AuthorizedPersonnel, 
  PersonnelStatus, 
  getDefaultPermissionsForRole 
} from '../auth/userDirectory';
import { SynapsisRole, StaffPermissions } from '../auth/types';
import { useAuth } from '../auth/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const StaffManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<AuthorizedPersonnel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'TODOS' | 'MEDICO' | 'SECRETARIA' | 'ADMINISTRACION'>('TODOS');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estado del Editor de Ficha (Crear / Editar)
  const [editingMember, setEditingMember] = useState<AuthorizedPersonnel | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewMember, setIsNewMember] = useState(false);
  const [activeTab, setActiveTab] = useState<'legal' | 'schedule' | 'permissions' | 'stamp'>('legal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referencias para carga de imágenes en el editor
  const stampFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      staffDirectoryService.initialize();
      const unsub = staffDirectoryService.subscribe((updatedList) => {
        setMembers(updatedList);
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUserRole = members.find(m => m.email.toLowerCase() === user?.email?.toLowerCase())?.role;
  const isSuperAdmin = currentUserRole === 'ADMINISTRADOR' || currentUserRole === 'DESARROLLADOR' || user?.email === 'moucharrafiepc@gmail.com';

  // Abrir editor para nuevo usuario
  const handleOpenCreateModal = () => {
    const defaultPerms = getDefaultPermissionsForRole('MEDICO');
    setEditingMember({
      email: '',
      displayName: '',
      role: 'MEDICO',
      specialty: 'Especialista Médico',
      description: '',
      nationalId: '',
      mppsNumber: '',
      cmebNumber: '',
      phone: '',
      status: 'ACTIVO',
      consultationDays: ['Lunes', 'Miércoles', 'Viernes'],
      consultationHours: '02:00 PM - 06:00 PM',
      officeLocation: 'Consultorio 14, Orinokia Mall Piso 2',
      permissions: defaultPerms,
      stampBase64: '',
      signatureBase64: '',
    });
    setIsNewMember(true);
    setActiveTab('legal');
    setIsEditorOpen(true);
  };

  // Abrir editor para usuario existente
  const handleOpenEditModal = (member: AuthorizedPersonnel) => {
    setEditingMember({
      ...member,
      permissions: member.permissions || getDefaultPermissionsForRole(member.role),
      status: member.status || 'ACTIVO',
      consultationDays: member.consultationDays || [],
      consultationHours: member.consultationHours || '',
      officeLocation: member.officeLocation || '',
    });
    setIsNewMember(false);
    setActiveTab('legal');
    setIsEditorOpen(true);
  };

  // Guardar cambios del editor
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (!editingMember.email || !editingMember.email.includes('@')) {
      setStatusMessage({ text: 'Por favor ingrese un correo de Google válido.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await staffDirectoryService.addOrUpdateMember({
        ...editingMember,
        email: editingMember.email.trim().toLowerCase(),
        displayName: editingMember.displayName.trim() || editingMember.email.split('@')[0],
      });

      if (res.success) {
        setStatusMessage({ 
          text: isNewMember 
            ? `¡Personal "${editingMember.displayName}" autorizado exitosamente!` 
            : `Ficha de "${editingMember.displayName}" actualizada.`, 
          type: 'success' 
        });
        setIsEditorOpen(false);
        setEditingMember(null);
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Error al guardar personal.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Eliminar miembro
  const handleRemoveMember = async (targetEmail: string, name: string) => {
    const confirm = window.confirm(`¿Está seguro de revocar el acceso a "${name}" (${targetEmail})?`);
    if (!confirm) return;

    const res = await staffDirectoryService.removeMember(targetEmail);
    if (res.success) {
      setStatusMessage({ text: `Acceso revocado para ${name}.`, type: 'success' });
    } else {
      setStatusMessage({ text: res.message, type: 'error' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Cambio rápido de estado (Activo / Vacaciones / Inactivo)
  const handleQuickStatusChange = async (member: AuthorizedPersonnel, newStatus: PersonnelStatus) => {
    const res = await staffDirectoryService.updateMemberStatus(member.email, newStatus);
    if (res) {
      setStatusMessage({ text: `Estado de ${member.displayName} cambiado a ${newStatus}.`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Carga de imagen con extracción automática de tinta (fondo transparente)
  const handleProcessStampUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'stampBase64' | 'signatureBase64') => {
    const file = e.target.files?.[0];
    if (!file || !editingMember) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Limpieza de papel blanco para obtener transparencia nítida
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

          if (brightness > 205) {
            data[i + 3] = 0; // Transparente
          } else {
            // Intensificar tinta
            data[i + 3] = Math.min(255, data[i + 3] * 1.2);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const processedUrl = canvas.toDataURL('image/png');

        setEditingMember({
          ...editingMember,
          [field]: processedUrl,
        });
      };
    };
    reader.readAsDataURL(file);
  };

  // Filtrado de miembros
  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.specialty && m.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.nationalId && m.nationalId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.mppsNumber && m.mppsNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (roleFilter === 'MEDICO') return m.role === 'MEDICO';
    if (roleFilter === 'SECRETARIA') return m.role === 'SECRETARIA' || m.role === 'RECEPCION';
    if (roleFilter === 'ADMINISTRACION') return m.role === 'ADMINISTRADOR' || m.role === 'DESARROLLADOR';
    return true;
  });

  const getRoleBadge = (r: SynapsisRole) => {
    switch (r) {
      case 'MEDICO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950/80 text-cyan-300 border border-cyan-500/30">
            <Stethoscope className="w-3 h-3 text-cyan-400" />
            Médico Especialista
          </span>
        );
      case 'SECRETARIA':
      case 'RECEPCION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            <Calendar className="w-3 h-3 text-emerald-400" />
            Secretaría / Citas
          </span>
        );
      case 'DESARROLLADOR':
      case 'ADMINISTRADOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
            <Code2 className="w-3 h-3 text-purple-400" />
            Administrador / Dev
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
            {r}
          </span>
        );
    }
  };

  const getStatusBadge = (status?: PersonnelStatus) => {
    const st = status || 'ACTIVO';
    switch (st) {
      case 'ACTIVO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Activo
          </span>
        );
      case 'VACACIONES':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Vacaciones
          </span>
        );
      case 'INACTIVO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/90 text-rose-300 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Inactivo
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in print:hidden"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-[#091326] border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/60 text-slate-100 overflow-hidden ring-1 ring-cyan-500/20 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado Principal */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-[#060c1a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/30 text-cyan-300 shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Directorio de Médicos y Personal Autorizado
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  CCMI Multi-Doctor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ficha profesional, horarios de consulta, sellos digitales y matriz de permisos granulares
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-900/40 transition cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Nuevo Personal</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificación de Estado */}
        {statusMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' 
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Barra de Filtros & Búsqueda */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-[#081022] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['TODOS', 'MEDICO', 'SECRETARIA', 'ADMINISTRACION'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRoleFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  roleFilter === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {tab === 'TODOS'
                  ? `Todos (${members.length})`
                  : tab === 'MEDICO'
                  ? `Médicos (${members.filter(m => m.role === 'MEDICO').length})`
                  : tab === 'SECRETARIA'
                  ? `Secretaría (${members.filter(m => m.role === 'SECRETARIA' || m.role === 'RECEPCION').length})`
                  : `Admin (${members.filter(m => m.role === 'ADMINISTRADOR' || m.role === 'DESARROLLADOR').length})`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, CI, MPPS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Grid de Fichas de Personal */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredMembers.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No se encontraron miembros</p>
              <p className="text-xs text-slate-500 mt-1">Prueba con otro término de búsqueda o agrega un nuevo personal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map((m) => {
                const isPrimaryDoctor = m.email === 'moucharrafiepc@gmail.com';
                const hasStamp = !!m.stampBase64;
                const hasSignature = !!m.signatureBase64;
                const perms = m.permissions || getDefaultPermissionsForRole(m.role);

                return (
                  <div 
                    key={m.email}
                    className="p-4 rounded-2xl bg-gradient-to-b from-[#0e1b33] to-[#0a1426] border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-3 shadow-md group"
                  >
                    {/* Header de la tarjeta */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/40 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-300 text-sm shrink-0">
                            {m.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                                {m.displayName}
                              </h4>
                              {isPrimaryDoctor && (
                                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold">
                                  Titular
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-cyan-400 truncate">
                              {m.email}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {getStatusBadge(m.status)}
                        </div>
                      </div>

                      {/* Rol & Especialidad */}
                      <div className="flex flex-wrap items-center gap-1.5 py-1">
                        {getRoleBadge(m.role)}
                        {m.specialty && (
                          <span className="text-[11px] text-slate-300 truncate font-medium">
                            • {m.specialty}
                          </span>
                        )}
                      </div>

                      {/* Credenciales Médicas / Legales */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Cédula:</span>
                          <span className="text-slate-200">{m.nationalId || 'No registrada'}</span>
                        </div>
                        {m.role === 'MEDICO' && (
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">MPPS / CMEB:</span>
                            <span className="text-cyan-300">
                              {m.mppsNumber ? `MPPS: ${m.mppsNumber}` : ''} 
                              {m.cmebNumber ? ` / CMEB: ${m.cmebNumber}` : ''}
                              {!m.mppsNumber && !m.cmebNumber && 'Pendiente'}
                            </span>
                          </div>
                        )}
                        {m.phone && (
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Contacto:</span>
                            <span className="text-slate-200">{m.phone}</span>
                          </div>
                        )}
                        {m.officeLocation && (
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Consultorio:</span>
                            <span className="text-slate-300 truncate block">{m.officeLocation}</span>
                          </div>
                        )}
                      </div>

                      {/* Horarios de Consulta */}
                      {m.consultationDays && m.consultationDays.length > 0 && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-300 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-semibold text-cyan-200">{m.consultationDays.join(', ')}</span>
                          {m.consultationHours && (
                            <span className="text-slate-400">({m.consultationHours})</span>
                          )}
                        </div>
                      )}

                      {/* Indicadores de Sellos y Permisos */}
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                        {m.role === 'MEDICO' && (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 font-bold ${hasStamp ? 'text-emerald-400' : 'text-slate-500'}`}>
                              <Stamp className="w-3 h-3" />
                              {hasStamp ? 'Sello OK' : 'Sin Sello'}
                            </span>
                            <span className={`inline-flex items-center gap-1 font-bold ${hasSignature ? 'text-emerald-400' : 'text-slate-500'}`}>
                              <Edit3 className="w-3 h-3" />
                              {hasSignature ? 'Firma OK' : 'Sin Firma'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto text-[9px] font-mono">
                          <span title="Historias íntimas" className={`px-1.5 py-0.5 rounded border ${perms.canViewFullHistory ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
                            Hist
                          </span>
                          <span title="Cotizador quirúrgico" className={`px-1.5 py-0.5 rounded border ${perms.canAccessQuoter ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
                            Cotiz
                          </span>
                          <span title="Calibrador A4" className={`px-1.5 py-0.5 rounded border ${perms.canCalibrateA4 ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
                            A4
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones de la tarjeta */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <select
                          value={m.status || 'ACTIVO'}
                          onChange={(e) => handleQuickStatusChange(m, e.target.value as PersonnelStatus)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[10px] text-slate-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                        >
                          <option value="ACTIVO">Activo</option>
                          <option value="VACACIONES">Vacaciones</option>
                          <option value="INACTIVO">Inactivo</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(m)}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Ficha</span>
                        </button>

                        {isSuperAdmin && !isPrimaryDoctor && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.email, m.displayName)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                            title={`Revocar acceso a ${m.displayName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal / Drawer de Edición de Ficha */}
        {isEditorOpen && editingMember && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div 
              className="w-full max-w-2xl bg-[#09152b] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Editor */}
              <div className="px-6 py-4 border-b border-slate-800 bg-[#060d1d] flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>{isNewMember ? 'Autorizar Nuevo Personal' : `Ficha Profesional: ${editingMember.displayName}`}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configuración clínica, legal, turnos y matriz de seguridad RBAC
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs de Navegación del Editor */}
              <div className="px-6 border-b border-slate-800 bg-[#071021] flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('legal')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'legal'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>1. Ficha Legal & Datos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'schedule'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>2. Horarios & Consultorio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('permissions')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'permissions'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3. Matriz de Permisos</span>
                </button>

                {editingMember.role === 'MEDICO' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('stamp')}
                    className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                      activeTab === 'stamp'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Stamp className="w-3.5 h-3.5" />
                    <span>4. Sello & Firma A4</span>
                  </button>
                )}
              </div>

              {/* Formulario con Scroll */}
              <form onSubmit={handleSaveMember} className="overflow-y-auto p-6 space-y-4 flex-1">
                {/* TAB 1: DATOS LEGALES Y PERSONALES */}
                {activeTab === 'legal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Correo Google (Gmail) *
                        </label>
                        <input
                          type="email"
                          required
                          disabled={!isNewMember}
                          value={editingMember.email}
                          onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                          placeholder="doctor@gmail.com"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Cuenta autorizada para Google OAuth</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Nombre y Apellidos Completos *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingMember.displayName}
                          onChange={(e) => setEditingMember({ ...editingMember, displayName: e.target.value })}
                          placeholder="Dr. Samir Moucharrafie Naime"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Rol en el Sistema CCMI
                        </label>
                        <select
                          value={editingMember.role}
                          onChange={(e) => {
                            const newRole = e.target.value as SynapsisRole;
                            setEditingMember({
                              ...editingMember,
                              role: newRole,
                              permissions: getDefaultPermissionsForRole(newRole),
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                        >
                          <option value="MEDICO">🩺 Médico Especialista</option>
                          <option value="SECRETARIA">📋 Secretaría / Citas</option>
                          <option value="RECEPCION">🏢 Recepción</option>
                          <option value="ADMINISTRADOR">⚙️ Administrador Institucional</option>
                          <option value="DESARROLLADOR">💻 Desarrollador de Software</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Especialidad o Cargo
                        </label>
                        <input
                          type="text"
                          value={editingMember.specialty || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, specialty: e.target.value })}
                          placeholder="Ej: Neurocirugía y Cirugía de Columna"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Cédula de Identidad (V- / E-)
                        </label>
                        <input
                          type="text"
                          value={editingMember.nationalId || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, nationalId: e.target.value })}
                          placeholder="V-11.456.789"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Teléfono Móvil / WhatsApp
                        </label>
                        <input
                          type="text"
                          value={editingMember.phone || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                          placeholder="0414-883.21.09"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {editingMember.role === 'MEDICO' && (
                        <>
                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">
                              Registro Sanitario MPPS
                            </label>
                            <input
                              type="text"
                              value={editingMember.mppsNumber || ''}
                              onChange={(e) => setEditingMember({ ...editingMember, mppsNumber: e.target.value })}
                              placeholder="62.431"
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">
                              Colegio de Médicos (CMEB / CMD)
                            </label>
                            <input
                              type="text"
                              value={editingMember.cmebNumber || ''}
                              onChange={(e) => setEditingMember({ ...editingMember, cmebNumber: e.target.value })}
                              placeholder="3.842"
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Estado Operativo
                        </label>
                        <div className="flex items-center gap-3">
                          {(['ACTIVO', 'VACACIONES', 'INACTIVO'] as const).map((st) => (
                            <label 
                              key={st}
                              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                                editingMember.status === st 
                                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md' 
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="member_status"
                                value={st}
                                checked={editingMember.status === st}
                                onChange={() => setEditingMember({ ...editingMember, status: st })}
                                className="hidden"
                              />
                              <span>{st === 'ACTIVO' ? '🟢 Activo' : st === 'VACACIONES' ? '🟡 Vacaciones' : '🔴 Inactivo'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: HORARIOS Y CONSULTORIO */}
                {activeTab === 'schedule' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-2">
                        Días de Consulta y Atención
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {ALL_WEEK_DAYS.map((day) => {
                          const isSelected = editingMember.consultationDays?.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const currentDays = editingMember.consultationDays || [];
                                const newDays = isSelected
                                  ? currentDays.filter(d => d !== day)
                                  : [...currentDays, day];
                                setEditingMember({ ...editingMember, consultationDays: newDays });
                              }}
                              className={`p-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Turno y Horario de Atención
                      </label>
                      <input
                        type="text"
                        value={editingMember.consultationHours || ''}
                        onChange={(e) => setEditingMember({ ...editingMember, consultationHours: e.target.value })}
                        placeholder="Ej: 08:30 AM - 12:30 PM / 02:30 PM - 06:00 PM"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Visible en la Agenda Quirúrgica y Citas</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Sede y Consultorio Asignado
                      </label>
                      <input
                        type="text"
                        value={editingMember.officeLocation || ''}
                        onChange={(e) => setEditingMember({ ...editingMember, officeLocation: e.target.value })}
                        placeholder="Ej: Consultorio 14, Piso 2, Torre Médica Orinokia Mall"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: MATRIZ DE PERMISOS GRANULARES */}
                {activeTab === 'permissions' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-cyan-300 block">Privacidad y Matriz de Acceso RBAC</span>
                        <span className="text-[10px] text-slate-400">Controla con precisión qué módulos puede ver este usuario</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember({
                            ...editingMember,
                            permissions: getDefaultPermissionsForRole(editingMember.role),
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-cyan-400 border border-cyan-500/30 transition cursor-pointer"
                      >
                        Restablecer recomendados
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Permiso 1: Historias Clínicas */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-400" />
                            <h5 className="text-xs font-bold text-white">Acceso a Historias Clínicas Detalladas</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Permite ver notas de evolución íntima, diagnósticos y exámenes confidenciales del paciente. (Desmarcar para personal de recepción y secretaría).
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editingMember.permissions?.canViewFullHistory ?? false}
                          onChange={(e) => setEditingMember({
                            ...editingMember,
                            permissions: {
                              ...editingMember.permissions!,
                              canViewFullHistory: e.target.value === 'true' || e.target.checked,
                            }
                          })}
                          className="w-5 h-5 rounded-lg border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                        />
                      </div>

                      {/* Permiso 2: Cotizador Quirúrgico */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            <h5 className="text-xs font-bold text-white">Cotizador Quirúrgico y Presupuestos</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Permite acceder a los costos de quirófano, honorarios médicos y estimaciones financieras de procedimientos quirúrgicos.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editingMember.permissions?.canAccessQuoter ?? false}
                          onChange={(e) => setEditingMember({
                            ...editingMember,
                            permissions: {
                              ...editingMember.permissions!,
                              canAccessQuoter: e.target.checked,
                            }
                          })}
                          className="w-5 h-5 rounded-lg border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                        />
                      </div>

                      {/* Permiso 3: Calibrador A4 */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-purple-400" />
                            <h5 className="text-xs font-bold text-white">Calibrador Milimétrico A4 & Herramientas Técnicas</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Bloquea el calibrador de coordenadas para evitar desajustes accidentales en los fondos vectoriales maestros oficiales.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editingMember.permissions?.canCalibrateA4 ?? false}
                          onChange={(e) => setEditingMember({
                            ...editingMember,
                            permissions: {
                              ...editingMember.permissions!,
                              canCalibrateA4: e.target.checked,
                            }
                          })}
                          className="w-5 h-5 rounded-lg border-slate-700 text-purple-500 focus:ring-0 cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Permiso 4: Gestión de Personal */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <h5 className="text-xs font-bold text-white">Gestión y Autorización de Personal</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Permite registrar nuevos usuarios, editar roles y administrar el directorio clínico.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editingMember.permissions?.canManageStaff ?? false}
                          onChange={(e) => setEditingMember({
                            ...editingMember,
                            permissions: {
                              ...editingMember.permissions!,
                              canManageStaff: e.target.checked,
                            }
                          })}
                          className="w-5 h-5 rounded-lg border-slate-700 text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: SELLO Y FIRMA DIGITAL A4 */}
                {activeTab === 'stamp' && editingMember.role === 'MEDICO' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200">
                      Carga el sello húmedo y firma del doctor. El sistema extraerá automáticamente la tinta con fondo transparente para que se imprima perfecto sobre la papelería A4.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sello Húmedo */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                          <Stamp className="w-4 h-4 text-cyan-400" />
                          Sello Húmedo Oficial
                        </span>

                        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-center p-2 overflow-hidden mb-3">
                          {editingMember.stampBase64 ? (
                            <img 
                              src={editingMember.stampBase64} 
                              alt="Sello" 
                              className="max-w-full max-h-full object-contain filter drop-shadow-md"
                            />
                          ) : (
                            <div className="text-center p-2 text-slate-500 text-[10px]">
                              Sin Sello Cargado
                            </div>
                          )}
                        </div>

                        <input 
                          type="file" 
                          ref={stampFileInputRef}
                          accept="image/*"
                          onChange={(e) => handleProcessStampUpload(e, 'stampBase64')}
                          className="hidden"
                        />

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => stampFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Cargar Foto</span>
                          </button>
                          {editingMember.stampBase64 && (
                            <button
                              type="button"
                              onClick={() => setEditingMember({ ...editingMember, stampBase64: '' })}
                              className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                              title="Borrar Sello"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Firma Digital */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-emerald-400" />
                          Firma Digitalizada
                        </span>

                        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-center p-2 overflow-hidden mb-3">
                          {editingMember.signatureBase64 ? (
                            <img 
                              src={editingMember.signatureBase64} 
                              alt="Firma" 
                              className="max-w-full max-h-full object-contain filter drop-shadow-md"
                            />
                          ) : (
                            <div className="text-center p-2 text-slate-500 text-[10px]">
                              Sin Firma Cargada
                            </div>
                          )}
                        </div>

                        <input 
                          type="file" 
                          ref={signatureFileInputRef}
                          accept="image/*"
                          onChange={(e) => handleProcessStampUpload(e, 'signatureBase64')}
                          className="hidden"
                        />

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => signatureFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Cargar Firma</span>
                          </button>
                          {editingMember.signatureBase64 && (
                            <button
                              type="button"
                              onClick={() => setEditingMember({ ...editingMember, signatureBase64: '' })}
                              className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                              title="Borrar Firma"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción del editor */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/60 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Guardando en la Nube...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Guardar Ficha</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pie del modal Principal */}
        <div className="px-6 py-3.5 bg-[#060c1a] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            Matriz RBAC Médica • Sincronización en tiempo real CCMI Cloud
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer text-xs"
          >
            Cerrar Directorio
          </button>
        </div>
      </div>
    </div>
  );
};
