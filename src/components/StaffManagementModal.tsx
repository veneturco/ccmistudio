import React, { useState, useEffect } from 'react';
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
  Lock
} from 'lucide-react';
import { staffDirectoryService } from '../cloud/StaffDirectoryService';
import { AuthorizedPersonnel } from '../auth/userDirectory';
import { SynapsisRole } from '../auth/types';
import { useAuth } from '../auth/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<AuthorizedPersonnel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Formulario nuevo personal
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<SynapsisRole>('MEDICO');
  const [specialty, setSpecialty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatusMessage({ text: 'Por favor ingrese un correo de Google válido.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await staffDirectoryService.addOrUpdateMember({
        email: email.trim().toLowerCase(),
        displayName: displayName.trim() || email.split('@')[0],
        role,
        specialty: specialty.trim() || (role === 'MEDICO' ? 'Especialista Médico' : 'Personal Clínico'),
        description: `Agregado por ${user?.displayName || 'Dirección Médica'}`,
      });

      if (res.success) {
        setStatusMessage({ text: `¡${displayName || email} autorizado exitosamente!`, type: 'success' });
        setEmail('');
        setDisplayName('');
        setSpecialty('');
        setRole('MEDICO');
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

  const filteredMembers = members.filter((m) => 
    m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.specialty && m.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadge = (r: SynapsisRole) => {
    switch (r) {
      case 'MEDICO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950 text-cyan-300 border border-cyan-500/30">
            <Stethoscope className="w-3 h-3 text-cyan-400" />
            Médico
          </span>
        );
      case 'SECRETARIA':
      case 'RECEPCION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
            <Calendar className="w-3 h-3 text-emerald-400" />
            Secretaría / Citas
          </span>
        );
      case 'DESARROLLADOR':
      case 'ADMINISTRADOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
            <Code2 className="w-3 h-3 text-purple-400" />
            Admin / Dev
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-[#0b1528] border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden ring-1 ring-cyan-500/20 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-[#070e1d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/30 text-cyan-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Directorio de Médicos y Personal Autorizado
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  CCMI Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autoriza qué doctores, secretarias y desarrolladores pueden iniciar sesión desde sus teléfonos o PCs
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

        {/* Contenido Principal con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Formulario para Agregar Nuevo Miembro */}
          <div className="p-4.5 rounded-2xl bg-[#0e1b33] border border-cyan-500/30 shadow-inner">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4" />
              <span>Autorizar Nuevo Doctor o Personal</span>
            </h3>

            <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Correo Google (Gmail) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="doctor@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Carlos Mendoza"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Rol en el Sistema
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as SynapsisRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                >
                  <option value="MEDICO">🩺 Médico (Acceso Clínico)</option>
                  <option value="SECRETARIA">📋 Secretaría / Citas</option>
                  <option value="ADMINISTRADOR">⚙️ Administrador</option>
                  <option value="DESARROLLADOR">💻 Desarrollador</option>
                  <option value="RECEPCION">🏢 Recepción</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Especialidad / Cargo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Neurocirugía / Traumatología"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  El nuevo personal podrá ingresar inmediatamente desde su celular con su cuenta de Google.
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-950/50 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Autorizar Personal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Personal Autorizado */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Personal con Acceso Autorizado ({filteredMembers.length})
                </h3>
              </div>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar personal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMembers.map((m) => {
                const isPrimaryDoctor = m.email === 'moucharrafiepc@gmail.com';

                return (
                  <div 
                    key={m.email}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-start justify-between gap-3 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">
                          {m.displayName}
                        </span>
                        {isPrimaryDoctor && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold">
                            Titular
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-mono text-cyan-300 truncate">
                        {m.email}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        {getRoleBadge(m.role)}
                        {m.specialty && (
                          <span className="text-[10px] text-slate-400 truncate">
                            • {m.specialty}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isPrimaryDoctor && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.email, m.displayName)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                        title={`Revocar acceso a ${m.displayName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Pie del modal */}
        <div className="px-6 py-3.5 bg-[#070e1d] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            Control de Acceso Basado en Roles (RBAC) • Sincronización en tiempo real
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
