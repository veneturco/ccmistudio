import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Smartphone, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { OfficialQrCode } from './OfficialQrCode';
import { DocType, PatientData } from '../types';
import { generateCanonicalDocumentPDF, ClinicalDataBundle } from '../utils/pdfExport';
import { uploadPdfForSharing } from '../utils/pdfExportHelpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string | null;
  patient: PatientData;
  activeDoc: DocType;
  clinicalDataBundle?: ClinicalDataBundle;
  customBgImage?: string | null;
}

export const PatientQrHandoffModal: React.FC<Props> = ({
  isOpen,
  onClose,
  pdfUrl,
  patient,
  activeDoc,
  clinicalDataBundle,
  customBgImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(pdfUrl || null);
  const [status, setStatus] = useState<'idle' | 'working' | 'ready' | 'error'>('idle');

  // Genera el PDF oficial con master y lo publica en un enlace público (sin login)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setStatus('working');
      setPublicUrl(null);
      try {
        const safe = (patient.fullName || 'Paciente').replace(/[^a-zA-Z0-9]+/g, '_');
        const fileName = `${activeDoc}_${safe}.pdf`;
        const result = await generateCanonicalDocumentPDF(activeDoc, patient, clinicalDataBundle || {}, fileName, customBgImage || null);
        const up: any = await uploadPdfForSharing(result.pdfBytes, fileName, {
          patientName: patient.fullName || 'Paciente',
          docTitle: `${activeDoc} Oficial (Dr. Samir Moucharrafie)`,
        });
        if (cancelled) return;
        const url = up?.shareUrl || up?.directPdfUrl;
        if (!url) throw new Error('sin enlace');
        setPublicUrl(url.startsWith('http') ? url : `${window.location.origin}${url}`);
        setStatus('ready');
      } catch (e) {
        console.warn('[QR] Error publicando documento:', e);
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, activeDoc]);

  if (!isOpen) return null;

  const targetUrl = publicUrl || '';

  const handleCopyLink = () => {
    if (!targetUrl) return;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#0b1528] border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden ring-1 ring-cyan-500/20 max-h-[90vh] flex flex-col text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-[#070e1d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black text-white">
                Transferencia Rápida por Código QR
              </h2>
              <p className="text-[11px] text-slate-400">
                Para el paciente o secretaría sin cables
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo con QR Gigante y Nítido */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300">
            Apunta la cámara del teléfono hacia la pantalla para abrir y descargar el documento oficial de:
          </p>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-cyan-300">
            {patient.fullName || 'Paciente'} • CI: {patient.idNumber || 'S/N'}
          </div>

          {/* Contenedor del Código QR */}
          <div className="p-4 rounded-2xl bg-white shadow-2xl inline-block mx-auto border-4 border-cyan-500/40 min-w-[232px] min-h-[232px]">
            {status === 'ready' && targetUrl ? (
              <OfficialQrCode value={targetUrl} size={200} />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-xs font-bold text-slate-700 text-center">
                {status === 'error' ? 'No se pudo publicar el documento. Intente de nuevo.' : 'Generando documento oficial con master…'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Compatible con iPhone, Android y WhatsApp</span>
          </div>

          {/* Botón Copiar Enlace Directo */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">¡Enlace Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Copiar Enlace Directo del Documento</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pie */}
        <div className="px-6 py-3.5 bg-[#070e1d] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Documento firmado y cifrado
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
