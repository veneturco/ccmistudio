import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Pill,
  FileText,
  FlaskConical,
  CalendarCheck,
  ClipboardList,
  Star,
  Settings,
  ChevronRight,
  Zap,
  Clock,
  ShieldCheck,
  Check,
  X,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Activity,
  Mic,
  Calendar as CalendarIcon
} from 'lucide-react';
import { DocType, PatientData } from '../types';
import { useTheme } from '../context/ThemeContext';

export interface QuickAccessWidget {
  id: string;
  title: string;
  subtitle: string;
  category: 'COLUMNA_DOLOR' | 'QUIRURGICO' | 'PARACLINICOS' | 'DOCUMENTAL' | 'SISTEMA';
  docType: DocType | 'DICTADO' | 'AGENDA';
  icon: 'pill' | 'file-text' | 'flask' | 'calendar-check' | 'clipboard' | 'mic' | 'agenda';
  presetData?: {
    diagnosis?: string;
    cie10?: string;
    rp?: string;
    indications?: string;
    restDays?: number;
    labProfile?: string;
  };
  isFavorite: boolean;
  isEnabled: boolean;
  usageCount: number;
  badge?: string;
  colorScheme: 'blue' | 'cyan' | 'emerald' | 'purple' | 'amber' | 'rose';
}

const DEFAULT_WIDGETS: QuickAccessWidget[] = [
  {
    id: 'w-lumbar-ciatica',
    title: 'Hernia Lumbar & Ciatalgia',
    subtitle: 'Récipe: Pregabalina + Ketoprofeno + Protector + Reposo relativo',
    category: 'COLUMNA_DOLOR',
    docType: 'RECIPES',
    icon: 'pill',
    presetData: {
      diagnosis: 'Lumbociatalgia radicular por Hernia Discal L4-L5 / L5-S1',
      cie10: 'M54.4',
      rp: '1. Pregabalina 75mg cápsulas — Tomar 1 cápsula nocturna por 15 días.\n2. Ketoprofeno 100mg comprimidos — Tomar 1 comprimido cada 12 horas por 5 días con protector gástrico.\n3. Tiocolchicósido 4mg — 1 comprimido cada 12 horas por 5 días.',
      indications: 'Reposo relativo de carga. Aplicar calor seco local en región lumbar 20 minutos dos veces al día. No levantar peso mayor a 5 kg. Reevaluación en 15 días.',
    },
    isFavorite: true,
    isEnabled: true,
    usageCount: 28,
    badge: 'Más Frecuente',
    colorScheme: 'blue',
  },
  {
    id: 'w-reposo-postop',
    title: 'Reposo Quirúrgico 15 Días',
    subtitle: 'Constancia: Microdiscectomía / Artrodesis con reintegro guiado',
    category: 'QUIRURGICO',
    docType: 'CONSTANCIA',
    icon: 'calendar-check',
    presetData: {
      diagnosis: 'Postoperatorio mediato de Microdiscectomía Tubular Lumbar L5-S1',
      cie10: 'Z48.8',
      restDays: 15,
      indications: 'Reposo físico absoluto y domiciliario por 15 días continuos. Deambulación asistida para necesidades básicas. Prohibido esfuerzo físico y flexión de tronco.',
    },
    isFavorite: true,
    isEnabled: true,
    usageCount: 19,
    badge: 'Postquirúrgico',
    colorScheme: 'emerald',
  },
  {
    id: 'w-orden-rmn',
    title: 'RMN Columna + Contraste',
    subtitle: 'Orden: Resonancia de Columna Lumbar / Cervical de Alta Definición',
    category: 'PARACLINICOS',
    docType: 'ORDEN_LAB',
    icon: 'flask',
    presetData: {
      diagnosis: 'Descarte de extrusión discal y radiculopatía compresiva',
      cie10: 'M51.1',
      indications: 'Resonancia Magnética Nuclear (RMN) de Columna Lumbar con cortes axiales y sagitales T1, T2 y STIR. Descarte de compromiso foraminal y receso lateral.',
      labProfile: 'Neuroimagen de Columna',
    },
    isFavorite: true,
    isEnabled: true,
    usageCount: 24,
    badge: 'Neuroimagen',
    colorScheme: 'cyan',
  },
  {
    id: 'w-preop-completo',
    title: 'Perfil Quirúrgico Preoperatorio',
    subtitle: 'Orden: Coagulación, Hematología, Química, EKG y Rx de Tórax',
    category: 'QUIRURGICO',
    docType: 'ORDEN_LAB',
    icon: 'flask',
    presetData: {
      diagnosis: 'Protocolo de evaluación preoperatoria para intervención neuroquirúrgica',
      cie10: 'Z01.8',
      indications: 'Hematología Completa, Tiempos de Coagulación (PT, PTT, INR, Fibrinógeno), Glicemia, Urea, Creatinina, Electrolitos Séricos (Na, K, Cl), VIH, VDRL, Electrocardiograma (EKG) con valoración cardiovascular y Rx Tórax PA.',
      labProfile: 'Preoperatorio Completo',
    },
    isFavorite: false,
    isEnabled: true,
    usageCount: 15,
    badge: 'Pre-Op',
    colorScheme: 'amber',
  },
  {
    id: 'w-informe-estenosis',
    title: 'Informe: Canal Estrecho',
    subtitle: 'Informe: Diagnóstico de Estenosis Lumbar y Conducta Quirúrgica',
    category: 'COLUMNA_DOLOR',
    docType: 'INFORME',
    icon: 'file-text',
    presetData: {
      diagnosis: 'Canal Estrecho Lumbar L3-L4 y L4-L5 con Claudicación Neurogénica',
      cie10: 'M48.06',
      indications: 'Se planifica Descompresión Quirúrgica Mínimamente Invasiva mediante Laminectomía Foraminotomía Tubular y eventual Artrodesis Transpedicular en Centro Médico Orinokia.',
    },
    isFavorite: false,
    isEnabled: true,
    usageCount: 12,
    badge: 'Informe Formal',
    colorScheme: 'purple',
  },
  {
    id: 'w-cervicalgia-acdf',
    title: 'Cervicobraquialgia Aguda',
    subtitle: 'Récipe: AINEs + Relajante muscular + Inmovilización cervical',
    category: 'COLUMNA_DOLOR',
    docType: 'RECIPES',
    icon: 'pill',
    presetData: {
      diagnosis: 'Cervicobraquialgia derecha por Radiculopatía C5-C6 aguda',
      cie10: 'M54.12',
      rp: '1. Dexketoprofeno 25mg — 1 ampolla intramuscular cada 12 horas por 2 días, luego tabletas cada 8h por 4 días.\n2. Tiocolchicósido 4mg — 1 comprimido cada 12h por 5 días.\n3. Complejo B Neurotrófico — 1 cápsula diaria con el almuerzo.',
      indications: 'Uso de collarín cervical blando durante traslados por 5 días. Crioterapia local cervical 15 minutos 3 veces al día.',
    },
    isFavorite: false,
    isEnabled: true,
    usageCount: 14,
    colorScheme: 'blue',
  },
  {
    id: 'w-historia-nueva',
    title: 'Historia Clínica Integral',
    subtitle: 'Apertura de expediente con examen neurológico guiado',
    category: 'DOCUMENTAL',
    docType: 'HISTORIA',
    icon: 'clipboard',
    presetData: {
      diagnosis: 'Evaluación Neuroquirúrgica Inicial',
      indications: 'Anamnesis completa, reflejos osteotendinosos (rotuliano, aquíleo, bicipital), fuerza motora por dermatomas y escala analógica del dolor (EVA).',
    },
    isFavorite: false,
    isEnabled: true,
    usageCount: 11,
    badge: 'Nuevo Ingreso',
    colorScheme: 'rose',
  },
  {
    id: 'w-dictado-express',
    title: 'Dictado Rápido por Voz IA',
    subtitle: 'Formulario abierto para dictar consultas complejas con Gemini',
    category: 'SISTEMA',
    docType: 'DICTADO',
    icon: 'mic',
    isFavorite: true,
    isEnabled: true,
    usageCount: 22,
    badge: 'IA Gemini',
    colorScheme: 'purple',
  },
];

const STORAGE_WIDGETS_KEY = 'ccmi_quick_access_widgets_v1';

interface QuickAccessWidgetsHubProps {
  onSelectAction: (docType: DocType | 'DICTADO' | 'AGENDA', presetData?: any) => void;
  className?: string;
}

export const QuickAccessWidgetsHub: React.FC<QuickAccessWidgetsHubProps> = ({
  onSelectAction,
  className = '',
}) => {
  const { isClinicalLight } = useTheme();
  const [widgets, setWidgets] = useState<QuickAccessWidget[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_WIDGETS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[QuickAccessWidgetsHub] Error leyendo configuración previa:', e);
    }
    return DEFAULT_WIDGETS;
  });

  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Transición suave de entrada inicial (fade-in orquestado)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  // Guardar configuración en localStorage
  const saveWidgets = (updated: QuickAccessWidget[]) => {
    setWidgets(updated);
    try {
      localStorage.setItem(STORAGE_WIDGETS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[QuickAccessWidgetsHub] Error guardando widgets:', e);
    }
  };

  const handleExecuteWidget = (widget: QuickAccessWidget) => {
    // Incrementar contador de uso
    const updated = widgets.map((w) =>
      w.id === widget.id ? { ...w, usageCount: (w.usageCount || 0) + 1 } : w
    );
    saveWidgets(updated);

    // Ejecutar acción
    onSelectAction(widget.docType, widget.presetData);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, isFavorite: !w.isFavorite } : w
    );
    saveWidgets(updated);
  };

  const toggleEnabled = (id: string) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, isEnabled: !w.isEnabled } : w
    );
    saveWidgets(updated);
  };

  const resetToDefaults = () => {
    saveWidgets(DEFAULT_WIDGETS);
  };

  // Filtrado y ordenamiento (Favoritos primero, luego habilitados)
  const visibleWidgets = widgets
    .filter((w) => w.isEnabled)
    .filter((w) => {
      if (activeCategory === 'TODOS') return true;
      if (activeCategory === 'FAVORITOS') return w.isFavorite;
      return w.category === activeCategory;
    })
    .sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return (b.usageCount || 0) - (a.usageCount || 0);
    });

  const getDocTypeBadge = (docType: string) => {
    switch (docType) {
      case 'RECIPES':
        return { label: 'Récipe Rp/', icon: Pill, color: 'text-blue-500' };
      case 'INFORME':
        return { label: 'Informe', icon: FileText, color: 'text-purple-500' };
      case 'ORDEN_LAB':
        return { label: 'Exámenes', icon: FlaskConical, color: 'text-cyan-500' };
      case 'CONSTANCIA':
        return { label: 'Reposo', icon: CalendarCheck, color: 'text-emerald-500' };
      case 'HISTORIA':
        return { label: 'Historia', icon: ClipboardList, color: 'text-rose-500' };
      case 'DICTADO':
        return { label: 'Dictado IA', icon: Mic, color: 'text-purple-400' };
      default:
        return { label: 'Agenda', icon: CalendarIcon, color: 'text-amber-500' };
    }
  };

  const getCardBorderClass = (scheme: string, isFav: boolean) => {
    if (isFav) {
      return isClinicalLight
        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-white'
        : 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-md bg-[#09152b]';
    }
    return isClinicalLight
      ? 'border-slate-200/90 hover:border-blue-400 bg-white shadow-xs'
      : 'border-slate-800/80 hover:border-slate-700 bg-[#091124] shadow-xs';
  };

  const getIconContainerClass = (scheme: string) => {
    switch (scheme) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'amber':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/30';
    }
  };

  return (
    <section className={`w-full transition-all duration-200 ${className}`}>
      {/* 1. BARRA SUPERIOR DE ACCESO RÁPIDO & SELECTOR DE CATEGORÍAS */}
      <div className={`p-4 rounded-3xl border transition-colors ${
        isClinicalLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#070e1f] border-slate-800/90'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-xs ${
              isClinicalLight ? 'bg-blue-600 text-white' : 'bg-cyan-500 text-slate-950'
            }`}>
              <Zap className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-black tracking-tight ${
                  isClinicalLight ? 'text-slate-900' : 'text-white'
                }`}>
                  Widgets de Acceso Rápido Clínico
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-700 dark:text-cyan-300 border border-blue-400/30">
                  Flujo en 1 Clic
                </span>
              </div>
              <p className={`text-xs ${isClinicalLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Plantillas y protocolos frecuentes precargados para agilizar la consulta médica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Botón Personalizar */}
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isClinicalLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Configurar y personalizar widgets visibles y favoritos"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Configurar</span>
            </button>

            {/* Alternar Colapsar */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isClinicalLight
                  ? 'bg-white text-slate-600 border-slate-300'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
              title={isCollapsed ? 'Expandir widgets' : 'Plegar widgets'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. PESTAÑAS DE CATEGORÍA */}
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800/80 mb-3.5">
            {[
              { id: 'TODOS', label: 'Todos los Widgets' },
              { id: 'FAVORITOS', label: '⭐ Favoritos' },
              { id: 'COLUMNA_DOLOR', label: 'Columna & Dolor' },
              { id: 'QUIRURGICO', label: 'Cirugía & Reposos' },
              { id: 'PARACLINICOS', label: 'Neuroimagen & Labs' },
              { id: 'DOCUMENTAL', label: 'Historias & Informes' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isClinicalLight
                    ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* 3. GRID DE WIDGETS INTERACTIVOS CON ENTRADA SUAVE */}
        {!isCollapsed && (
          <>
            {isInitialLoading ? (
              /* Skeleton Shimmer Loading State Clínico */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={`skeleton-${n}`}
                    className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-[154px] ${
                      isClinicalLight
                        ? 'bg-slate-100/90 border-slate-200 clinical-shimmer-light'
                        : 'bg-[#091124] border-slate-800 animate-clinical-shimmer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-300/50 dark:bg-slate-800/80 animate-pulse" />
                          <div className="w-20 h-4 rounded-md bg-slate-300/40 dark:bg-slate-800/60 animate-pulse" />
                        </div>
                        <div className="w-4 h-4 rounded-full bg-slate-300/40 dark:bg-slate-800/60 animate-pulse" />
                      </div>
                      <div className="w-3/4 h-4 rounded bg-slate-300/50 dark:bg-slate-800/80 animate-pulse mb-2" />
                      <div className="w-full h-3 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
                    </div>
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                      <div className="w-14 h-3 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
                      <div className="w-16 h-3 rounded bg-slate-300/50 dark:bg-slate-800/60 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                key={`${activeCategory}-${visibleWidgets.length}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {visibleWidgets.map((w, index) => {
                  const docInfo = getDocTypeBadge(w.docType);
                  const DocIcon = docInfo.icon;
                  const borderClass = getCardBorderClass(w.colorScheme, w.isFavorite);
                  const iconBoxClass = getIconContainerClass(w.colorScheme);

                  return (
                    <div
                      key={w.id}
                      onClick={() => handleExecuteWidget(w)}
                      style={{
                        animationDelay: `${index * 40}ms`,
                        animationFillMode: 'backwards',
                      }}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative group flex flex-col justify-between hover:-translate-y-0.5 active:scale-98 animate-clinical-fade-in ${borderClass}`}
                    >
                      <div>
                        {/* Header de la tarjeta */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBoxClass}`}>
                              <DocIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                              isClinicalLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {docInfo.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {w.badge && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                {w.badge}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(w.id, e)}
                              className={`p-1 rounded-lg transition ${
                                w.isFavorite
                                  ? 'text-amber-400 hover:text-amber-500'
                                  : 'text-slate-400 hover:text-amber-400'
                              }`}
                              title={w.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                            >
                              <Star className={`w-3.5 h-3.5 ${w.isFavorite ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Título y Descripción */}
                        <h4 className={`text-xs sm:text-sm font-extrabold tracking-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors ${
                          isClinicalLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {w.title}
                        </h4>
                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                          isClinicalLight ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          {w.subtitle}
                        </p>
                      </div>

                      {/* Footer con estadística y acción */}
                      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                        isClinicalLight ? 'border-slate-100 text-slate-500' : 'border-slate-800/80 text-slate-400'
                      }`}>
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>{w.usageCount || 0} usos</span>
                        </span>

                        <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
                          <span>Cargar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. MODAL DE CONFIGURACIÓN Y PERSONALIZACIÓN DE WIDGETS */}
      {isConfigModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsConfigModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#0c162e] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Personalizar Widgets de Acceso Rápido
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active, desactive o marque como favoritos sus flujos clínicos habituales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Widgets para Configurar */}
            <div className="p-6 space-y-3 overflow-y-auto flex-1">
              {widgets.map((w) => {
                const docInfo = getDocTypeBadge(w.docType);
                const DocIcon = docInfo.icon;

                return (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      w.isEnabled
                        ? isClinicalLight
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-[#091328] border-slate-800'
                        : isClinicalLight
                        ? 'bg-slate-100/50 border-slate-200 opacity-60'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getIconContainerClass(w.colorScheme)}`}>
                        <DocIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {w.title}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-cyan-300 font-semibold">
                            {docInfo.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {w.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle Favorito */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(w.id, e)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          w.isFavorite
                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-transparent hover:text-amber-400'
                        }`}
                        title={w.isFavorite ? 'Quitar de favoritos' : 'Marcar favorito'}
                      >
                        <Star className={`w-4 h-4 ${w.isFavorite ? 'fill-amber-400' : ''}`} />
                      </button>

                      {/* Toggle Habilitado / Deshabilitado */}
                      <button
                        type="button"
                        onClick={() => toggleEnabled(w.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          w.isEnabled
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {w.isEnabled ? 'Activo' : 'Oculto'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <button
                type="button"
                onClick={resetToDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Valores Recomendados</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer"
              >
                Listo / Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
