import React, { useState } from 'react';
import { 
  CreditCard, 
  Download, 
  Mail, 
  Phone, 
  Check, 
  X, 
  Sparkles, 
  MapPin,
  Building2,
  Calendar,
  Award,
  Share2,
  Copy,
  QrCode
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { OfficialQrCode } from './OfficialQrCode';

interface DoctorBusinessCardProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  isModal?: boolean;
}

export const DoctorBusinessCard: React.FC<DoctorBusinessCardProps> = ({
  isOpen = true,
  onClose,
  className = '',
  isModal = false,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [cardView, setCardView] = useState<'official-horizontal' | 'institutional-square'>('official-horizontal');

  const phoneDisplay = '0424-938.16.74';
  const phoneRaw = '584249381674';
  const emailOfficial = 'neurochirsami@gmail.com';
  const emailSecondary = 'neurocirujanosam@gmail.com';
  const vCardUrl = `https://wa.me/${phoneRaw}?text=${encodeURIComponent('Hola Dr. Samir Moucharrafie, le escribo para solicitar información y consulta en CMI.')}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  const downloadVCard = () => {
    const vCardData = `BEGIN:VCARD
VERSION:3.0
N:Moucharrafie Naime;Samir;;Dr.;
FN:Dr. Samir Moucharrafie Naime
ORG:CMI - Unidad Cerebro Columna Mínimamente Invasiva
TITLE:Director / Neurocirujano (UCBL Lyon - Francia)
TEL;TYPE=CELL,VOICE,WHATSAPP:+584249381674
EMAIL;TYPE=PREF,INTERNET:neurochirsami@gmail.com
EMAIL;TYPE=WORK,INTERNET:neurocirujanosam@gmail.com
ADR;TYPE=WORK:;;Centro Médico Orinokia Piso 2 APS / Orinokia Mall Nivel Titanio;Puerto Ordaz;Bolívar;;Venezuela
NOTE:MPPS: 61231 | CMEB: 5331 | RIF: V-12887723-3 | 22 años de experiencia en Francia | Especialista en Neurocirugía y Cirugía de Columna Mínimamente Invasiva
URL:https://wa.me/584249381674
END:VCARD`;

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Dr_Samir_Moucharrafie_CMI.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cardContent = (
    <div className="flex flex-col items-center w-full">
      {/* Selector de Vistas de Tarjeta */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 border border-slate-200/80 text-xs self-center">
        <button
          type="button"
          onClick={() => setCardView('official-horizontal')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            cardView === 'official-horizontal'
              ? 'bg-white text-[#0a376d] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tarjeta Horizontal (Física Oficial)
        </button>
        <button
          type="button"
          onClick={() => setCardView('institutional-square')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            cardView === 'institutional-square'
              ? 'bg-white text-[#0a376d] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Banner Cuadrado (Citas & QR)
        </button>
      </div>

      {/* ============================================================ */}
      {/* VISTA 1: TARJETA FÍSICA OFICIAL (IMG-20260906-WA0085.jpg)   */}
      {/* ============================================================ */}
      {cardView === 'official-horizontal' ? (
        <div 
          id="official-doctor-business-card"
          className="w-full max-w-[620px] aspect-[1.75/1] bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col justify-between select-none relative transition-all ring-1 ring-slate-900/5"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {/* Main Area */}
          <div className="flex-1 flex flex-row relative">
            {/* Left Column: Portrait & Brand Spine */}
            <div className="w-[36%] bg-gradient-to-b from-white via-slate-50 to-blue-50/30 p-3 sm:p-4 flex flex-col items-center justify-between border-r border-slate-100 relative overflow-hidden">
              <div className="w-full flex justify-center mb-2">
                <BrandLogo size={130} variant="card-vertical" />
              </div>

              {/* Avatar Ilustrativo Dr. Samir */}
              <div className="relative my-auto flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#0a376d] to-[#165296] p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-center p-1 text-[#0a376d]">
                    <span className="text-[9px] font-black leading-tight uppercase">Dr. Samir</span>
                    <span className="text-[7.5px] font-bold text-blue-700 leading-tight">Moucharrafie</span>
                    <span className="text-[6.5px] font-semibold text-slate-500 mt-0.5">UCBL Lyon</span>
                  </div>
                </div>
                <span className="mt-1 px-2 py-0.5 bg-blue-100/90 text-[#0a376d] text-[7.5px] font-bold rounded-full border border-blue-200/60">
                  22 Años Exp. Francia
                </span>
              </div>

              <div className="text-[7.5px] font-mono text-slate-400 tracking-wider">
                RIF: V-12887723-3
              </div>
            </div>

            {/* Right Column: Deep Cobalt Navy & Credentials */}
            <div className="w-[64%] bg-[#0a376d] text-white p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header Title */}
              <div className="space-y-0.5 z-10">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  Dr. Samir Moucharrafie Naime
                </h2>
                <p className="text-[8.5px] sm:text-[9.5px] font-bold text-cyan-300 uppercase tracking-wide">
                  NEUROCIRUJANO / UCBL LYON - FRANCIA
                </p>
                <p className="text-[7.5px] sm:text-[8px] font-semibold text-blue-200 uppercase tracking-tight">
                  UNIDAD CEREBRO COLUMNA MÍNIMAMENTE INVASIVA
                </p>
              </div>

              {/* Middle: Contacts & QR Row */}
              <div className="flex items-center justify-between gap-2 my-1 z-10">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-white bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-400/30">
                    <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{phoneDisplay}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-blue-100 font-mono">
                    <Mail className="w-2.5 h-2.5 text-cyan-300 shrink-0" />
                    <span className="truncate">{emailOfficial}</span>
                  </div>
                </div>

                {/* Scannable WhatsApp QR */}
                <div className="p-1 bg-white rounded-xl shadow-md border border-white/40 shrink-0">
                  <OfficialQrCode 
                    value={vCardUrl} 
                    size={58}
                    darkColor="#0a376d"
                    lightColor="#ffffff"
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Banner Ribbon: Orinokia & Titanio Locations */}
          <div className="bg-gradient-to-r from-[#072448] via-[#0a376d] to-[#072448] text-white px-3 py-1.5 flex items-center justify-between text-[7.5px] sm:text-[8.5px] font-medium border-t border-blue-400/30 z-10 flex-wrap gap-1">
            <div className="flex items-center gap-1 text-cyan-200">
              <MapPin className="w-2.5 h-2.5 text-cyan-300 shrink-0" />
              <span>Centro Médico Orinokia, Piso 2, APS</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-200">
              <MapPin className="w-2.5 h-2.5 text-cyan-300 shrink-0" />
              <span>Orinokia Mall Nivel Titanio</span>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* VISTA 2: BANNER CUADRADO (IMG-20260906-WA0090.jpg)          */
        /* ============================================================ */
        <div 
          className="w-full max-w-[480px] bg-gradient-to-b from-[#0a376d] via-[#092b54] to-[#061c38] rounded-2xl overflow-hidden shadow-2xl border border-blue-800 text-white flex flex-col justify-between p-5 relative ring-1 ring-white/10"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top: Logo & Title */}
          <div className="flex flex-col items-center text-center space-y-3 relative z-10">
            <div className="bg-white/95 p-3 rounded-2xl shadow-lg shadow-black/20">
              <BrandLogo size={140} variant="card-vertical" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-white tracking-wider uppercase mt-1">
                Dr. Samir Moucharrafie Naime
              </p>
              <p className="text-[11px] text-cyan-300 font-bold uppercase tracking-widest mt-0.5">
                Neurocirujano
              </p>
              <p className="text-[10px] text-blue-200 font-medium tracking-wide mt-1">
                Director | Más de 22 años de experiencia (Francia)
              </p>
            </div>
          </div>

          {/* Center: Large QR Code with Direct WhatsApp contact */}
          <div className="my-4 bg-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 text-slate-800 relative z-10">
            <div className="p-1 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
              <OfficialQrCode 
                value={vCardUrl} 
                size={90}
                darkColor="#0a376d"
                lightColor="#ffffff"
                className="rounded"
              />
            </div>

            <div className="space-y-1 text-right flex-1">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Citas y Contacto Directo</span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                0424 938 1674
              </div>
              <div className="text-[9.5px] font-mono text-slate-500 truncate">
                {emailSecondary}
              </div>
            </div>
          </div>

          {/* Footer Ribbon */}
          <div className="text-center pt-2 border-t border-blue-400/20 text-[10px] text-blue-200 font-mono relative z-10">
            {emailSecondary} • Puerto Ordaz, Venezuela
          </div>
        </div>
      )}

      {/* Action Bar Below Card */}
      <div className="w-full max-w-[620px] mt-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadVCard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0a376d] to-[#1258aa] hover:from-[#082b54] hover:to-[#0a376d] text-white transition shadow-sm cursor-pointer"
            title="Descargar contacto vCard al teléfono o PC"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Guardar Contacto (.vcf)</span>
          </button>

          <a
            href={`https://wa.me/${phoneRaw}?text=${encodeURIComponent('Hola Dr. Samir Moucharrafie, le escribo para agendar una consulta médica.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp Directo</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => copyToClipboard(emailOfficial, 'email')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 transition cursor-pointer shadow-xs"
          >
            {copied === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'email' ? 'Copiado' : 'Copiar Email'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return <div className={className}>{cardContent}</div>;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-white/80 relative ring-1 ring-slate-900/10">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0a376d] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <CreditCard className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tarjeta de Presentación Médica Oficial CMI
              </h3>
              <p className="text-xs text-slate-500">
                Dr. Samir Moucharrafie Naime • Neurocirujano (UCBL Lyon 1 - Francia)
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {cardContent}
      </div>
    </div>
  );
};
