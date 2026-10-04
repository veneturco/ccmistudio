import React from 'react';
import { 
  Activity, 
  Brain, 
  ChevronRight, 
  CreditCard, 
  Download, 
  FileText, 
  HeartHandshake, 
  Microscope, 
  Phone, 
  Printer, 
  ShieldCheck, 
  Sparkles, 
  Stethoscope, 
  Users, 
  Zap,
  Award,
  Clock,
  Crosshair,
  MapPin,
  CheckCircle2,
  Quote,
  Star,
  Calendar
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface CmiSpecialtiesPortalProps {
  onOpenCard: () => void;
  onNavigateToDocs: (docType?: string) => void;
  onNavigateToQuoter: () => void;
  onNavigateToAgenda?: () => void;
}

export const CmiSpecialtiesPortal: React.FC<CmiSpecialtiesPortalProps> = ({
  onOpenCard,
  onNavigateToDocs,
  onNavigateToQuoter,
  onNavigateToAgenda,
}) => {
  const phoneRaw = '584249381674';
  const phoneDisplay = '0424-938.16.74';
  const emailOfficial = 'neurochirsami@gmail.com';
  const emailSecondary = 'neurocirujanosam@gmail.com';

  const specialties = [
    {
      id: 'columna',
      title: 'Cirugía de Columna Mínimamente Invasiva',
      badge: 'Enfoque Principal CMI',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Zap,
      description: 'Técnicas avanzadas microquirúrgicas y endoscópicas con mínima incisión (<2 cm), menor dolor postoperatorio y rápida reinserción a la vida cotidiana.',
      procedures: [
        'Cirugía Endoscópica de Hernias Discales (Cervical y Lumbar)',
        'Microdiscectomía y Foraminotomía Tubular Guiada',
        'Artrodesis Vertebral Percutánea por Imagen',
        'Bloqueos Facetarios y Epidurales Terapéuticos',
        'Tratamiento de Ciática, Canal Estrecho y Radiculopatías'
      ],
      docAction: 'RECIPES'
    },
    {
      id: 'craneal',
      title: 'Neurocirugía Craneal, Tumoral & Gamma Knife',
      badge: 'Alta Complejidad',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Brain,
      description: 'Abordajes microquirúrgicos de máxima precisión formados en Francia (UCBL Lyon 1) para afecciones cerebrales, vasculares y de base de cráneo.',
      procedures: [
        'Microcirugía de Tumores Cerebrales y Meningiomas',
        'Neuroendoscopia y Derivaciones en Hidrocefalia',
        'Radiocirugía Estereotáxica (Gamma Knife)',
        'Descompresión Microvascular en Neuralgia del Trigémino',
        'Cirugía Vascular Cerebral (Aneurismas y MAV)'
      ],
      docAction: 'INFORME'
    },
    {
      id: 'dolor',
      title: 'Terapia del Dolor & Neurocirugía Funcional',
      badge: 'Alivio No Invasivo',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Crosshair,
      description: 'Manejo protocolizado del dolor crónico espinal y radicular mediante radiofrecuencia, bloqueos selectivos y desinflamación neurogénica.',
      procedures: [
        'Radiofrecuencia Térmica y Pulsada de Nervios Facetarios',
        'Infiltraciones Radiculares Selectivas Fluoroscópicas',
        'Ozonoterapia y Terapias Regenerativas para Discopatías',
        'Manejo Integral del Dolor Neuropático Crónico',
        'Valoración de Segunda Opinión y Evaluación Quirúrgica'
      ],
      docAction: 'EXAMENES'
    }
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      {/* ========================================================= */}
      {/* FASE 1: ACOGIDA & CONFIANZA MÉDICA (Hero Empatía Dr. Samir) */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a376d] via-[#092c57] to-[#061c38] text-white p-6 sm:p-10 shadow-2xl border border-blue-900/60">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
          {/* Columna Izquierda: Identidad y Datos */}
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-cyan-200 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Unidad Quirúrgica de Alta Especialidad • 22 Años de Experiencia en Francia</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                Dr. Samir Moucharrafie Naime
              </h1>
              <p className="text-sm sm:text-base font-bold text-cyan-300 tracking-wider uppercase">
                Neurocirujano / UCBL Lyon - Francia • Director CMI
              </p>
              <p className="text-xs sm:text-sm font-semibold text-blue-200">
                Unidad Cerebro Columna Mínimamente Invasiva
              </p>
            </div>

            <p className="text-sm text-blue-100/90 leading-relaxed font-normal pt-1">
              Atención médica de alta precisión para el diagnóstico y tratamiento microquirúrgico de enfermedades de columna y cerebro, combinando calidez humana con tecnología de vanguardia y formación académica europea.
            </p>

            {/* Badges de Credenciales Oficiales */}
            <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 flex-wrap pt-1">
              <span className="px-3 py-1 rounded-xl bg-blue-950/90 border border-blue-600/40 text-xs font-mono text-blue-200 shadow-xs">
                MPPS: <strong className="text-white">61231</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-950/90 border border-blue-600/40 text-xs font-mono text-blue-200 shadow-xs">
                CMEB: <strong className="text-white">5331</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-950/90 border border-blue-600/40 text-xs font-mono text-blue-200 shadow-xs">
                RIF: <strong className="text-white">V-12887723-3</strong>
              </span>
            </div>

            {/* Botones de Acción Inmediata */}
            <div className="flex items-center justify-center lg:justify-start gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenCard}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0a376d] hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer hover:-translate-y-0.5"
              >
                <CreditCard className="w-4 h-4 text-[#0a376d]" />
                <span>Tarjeta Dr. Samir (QR & Sedes)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToDocs()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer hover:-translate-y-0.5"
              >
                <Printer className="w-4 h-4" />
                <span>5 Documentos A4</span>
              </button>

              {onNavigateToAgenda && (
                <button
                  type="button"
                  onClick={onNavigateToAgenda}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer hover:-translate-y-0.5"
                  title="Abrir la Agenda y módulo de citas para Secretaría / Recepción"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Citas & Secretaría</span>
                </button>
              )}

              <a
                href={`https://wa.me/${phoneRaw}?text=${encodeURIComponent('Hola Dr. Samir Moucharrafie, le escribo para agendar una consulta médica.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer hover:-translate-y-0.5"
              >
                <Phone className="w-4 h-4" />
                <span>Citas: {phoneDisplay}</span>
              </a>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Institucional de Confianza */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-44 sm:w-52 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 flex flex-col items-center justify-center text-slate-800 ring-1 ring-white/20">
              <BrandLogo size={90} variant="card-vertical" />
              
              <div className="mt-3 text-center border-t border-slate-100 pt-2 w-full space-y-0.5">
                <span className="text-[10px] font-bold text-blue-700 block uppercase tracking-wide">
                  Director del Instituto
                </span>
                <span className="text-xs font-black text-slate-900 block">
                  Dr. Samir Moucharrafie
                </span>
                <span className="text-[9px] font-medium text-slate-500 block">
                  UCBL Lyon 1 - Francia
                </span>
              </div>

              <div className="mt-2 w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-600">
                <span>⭐ Experiencia</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">+22 Años</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FASE 2: AUTORIDAD QUIRÚRGICA EN QUIRÓFANO & PRECISIÓN     */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 mb-1.5">
              <Microscope className="w-3.5 h-3.5" />
              <span>Quirófano de Mínima Invasión</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Rigor Microquirúrgico y Tecnología de Vanguardia
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Microscopio quirúrgico de alta definición, instrumental tubular y radiofrecuencia para máxima preservación funcional.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToQuoter}
            className="self-start md:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Ficha Quirúrgica / Presupuesto</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Pilares de Alta Especialidad en Quirófano */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Cirugía Espinal Cerebral y Medular
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              Tratamiento microquirúrgico de compresiones medulares, discopatías y deformidades espinales.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Neurocirugía Funcional & Trigémino
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              Descompresión microvascular de nervios craneales y control del dolor facial y neuropático.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Radiocirugía Gamma Knife
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              Tratamiento no invasivo de lesiones intracraneales y malformaciones con radiación focalizada.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              Endoscopia de Columna Mínima Invasión
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              Incisiones milimétricas, visualización en pantalla 4K y recuperación ambulatoria o de 24h.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FASE 3: TESTIMONIO DE PACIENTES & ACOMPAÑAMIENTO          */}
      {/* ========================================================= */}
      <section className="bg-gradient-to-r from-blue-950 via-[#0a376d] to-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
              <span className="text-xs font-bold text-white ml-2">5.0 Testimonio Clínico</span>
            </div>

            <div className="relative">
              <Quote className="w-8 h-8 text-cyan-400/30 absolute -top-4 -left-4 -z-10" />
              <p className="text-base sm:text-lg font-bold text-white italic leading-relaxed">
                “El mejor neurocirujano de Puerto Ordaz 🙏🙏🙏 Dios me lo bendiga 🙏”
              </p>
            </div>

            <p className="text-xs text-blue-200">
              — Paciente tratado en Centro Médico Orinokia • Recuperación funcional exitosa
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={`https://wa.me/${phoneRaw}?text=${encodeURIComponent('Hola Dr. Samir, deseo consultar sobre mi caso médico.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-2 hover:-translate-y-0.5"
            >
              <Phone className="w-4 h-4" />
              <span>Contactar por WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FASE 4: SEDES DE CONSULTA & PAPELERÍA MÉDICA OFICIAL A4   */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#0a376d]" />
              <span>Papelería Oficial Calibrada A4 (5 Documentos)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Generación con membrete institucional, sellos oficiales MPPS/CMEB y QR de validación.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToDocs()}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Ver Estación de Trabajo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 5 Plantillas Oficiales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[
            { id: 'RECIPES', name: 'Récipe (Doble Talón)', desc: 'Farmacia e Indicaciones', tag: 'Doble Talón' },
            { id: 'INFORME', name: 'Informe Médico', desc: 'Resumen Diagnóstico y Plan', tag: 'A4 Clínico' },
            { id: 'EXAMENES', name: 'Orden de Exámenes', desc: 'Laboratorio y Neuroimagen', tag: 'Checklist' },
            { id: 'CONSTANCIA', name: 'Constancia de Reposo', desc: 'Certificado Laboral Legal', tag: 'Días y Letras' },
            { id: 'HISTORIA', name: 'Historia Clínica', desc: 'Anamnesis y Examen Físico', tag: 'Expediente' },
          ].map((doc, index) => (
            <div
              key={doc.id}
              onClick={() => onNavigateToDocs(doc.id)}
              className="animate-fade-in-up p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between glass-card-2026 text-slate-800 dark:text-slate-100 hover:scale-[1.03] hover:-translate-y-1.5"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {doc.tag}
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors mt-2">
                  {doc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  {doc.desc}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700 group-hover:translate-x-0.5 transition-transform">
                <span>Emitir Documento</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SEDES FÍSICAS DE CONSULTA (PUERTO ORDAZ)                  */}
      {/* ========================================================= */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
            <MapPin className="w-3 h-3 text-cyan-300" />
            <span>Sedes de Atención Médica • Puerto Ordaz, Edo. Bolívar</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white">
            CMI • Centro Médico Orinokia & Orinokia Mall
          </h3>

          <div className="flex flex-col sm:flex-row gap-3 pt-1 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Centro Médico Orinokia, Piso 2, APS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Orinokia Mall Nivel Titanio</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            type="button"
            onClick={onOpenCard}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
            <span>Tarjeta Dr. Samir</span>
          </button>

          <a
            href={`https://wa.me/${phoneRaw}?text=${encodeURIComponent('Hola Dr. Samir, deseo agendar cita en Puerto Ordaz.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp ({phoneDisplay})</span>
          </a>
        </div>
      </section>
    </div>
  );
};
