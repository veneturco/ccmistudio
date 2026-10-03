import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Phone,
  Loader2,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { DocType, PatientData } from '../types';
import {
  DOCUMENT_DEFINITIONS,
  generateCanonicalDocumentPDF,
  ClinicalDataBundle,
  buildWhatsAppMessage,
  formatWhatsAppPhone,
  sanitizeFileName,
  uploadPdfForSharing,
  copyImageToClipboard,
  downloadBlob,
} from '../utils/pdfExport';
import { OfficialQrCode } from './OfficialQrCode';

interface WhatsAppPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoc: DocType;
  patient: PatientData;
  setActiveDoc?: (doc: DocType) => void;
  clinicalDataBundle?: ClinicalDataBundle;
}

export const WhatsAppPdfModal: React.FC<WhatsAppPdfModalProps> = ({
  isOpen,
  onClose,
  activeDoc,
  patient,
  clinicalDataBundle,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(patient.phone || '0424-938.16.74');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [delivered, setDelivered] = useState(false);
  const [publicPdfUrl, setPublicPdfUrl] = useState<string | null>(null);
  const [publicShareUrl, setPublicShareUrl] = useState<string | null>(null);
  const [hdImageDataUrl, setHdImageDataUrl] = useState<string | null>(null);
  const [hdImageUrl, setHdImageUrl] = useState<string | null>(null);
  const [generatedPdfBytes, setGeneratedPdfBytes] = useState<Uint8Array | null>(null);
  const [whatsappUniversalUrl, setWhatsappUniversalUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [activeMessage, setActiveMessage] = useState<string>('');
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'pdf'>('image');

  const activeDef = DOCUMENT_DEFINITIONS?.[activeDoc] || {
    shortName: 'Documento',
    label: 'Documento Médico',
    filenamePrefix: 'DOC',
  };

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(patient.phone || '0424-938.16.74');
      setDelivered(false);
      setPublicPdfUrl(null);
      setPublicShareUrl(null);
      setHdImageDataUrl(null);
      setHdImageUrl(null);
      setGeneratedPdfBytes(null);
      setShowQrCode(false);
      setCopiedText(false);
      setCopiedImage(false);
      setDeliveryError(null);
      setActiveTab('image');
      handleHybridExport(patient.phone || '0424-938.16.74');
    }
  }, [isOpen, activeDoc, patient.idNumber]);

  // Proceso Híbrido Dual: PDF Vectorial + Rasterizado Ultra HD para WhatsApp
  const handleHybridExport = async (targetPhone: string) => {
    setIsProcessing(true);
    setProcessStep('Generando documento PDF oficial y renderizando imagen Ultra HD...');
    setDeliveryError(null);

    try {
      const patientSafeName = sanitizeFileName(patient.fullName || 'Paciente');
      const fileName = `${activeDef.filenamePrefix}_${patientSafeName}.pdf`;

      // 1. Generación del PDF Canónico Oficial
      const result = await generateCanonicalDocumentPDF(
        activeDoc,
        patient,
        clinicalDataBundle || {},
        fileName
      );
      setGeneratedPdfBytes(result.pdfBytes);

      // 2. Publicación Dual en el Servidor (Guarda PDF y genera PNG 300 DPI)
      setProcessStep('Optimizando imagen Ultra HD para WhatsApp y portal móvil...');
      try {
        const uploadRes = await uploadPdfForSharing(
          result.pdfBytes,
          fileName,
          {
            patientName: patient.fullName || 'Paciente',
            docTitle: `${activeDef.shortName} Oficial (Dr. Samir Moucharrafie)`,
          }
        );

        if (uploadRes && uploadRes.success) {
          setPublicShareUrl(uploadRes.shareUrl);
          setPublicPdfUrl(uploadRes.directPdfUrl);
          if (uploadRes.imageDataUrl) {
            setHdImageDataUrl(uploadRes.imageDataUrl);
          }
          if (uploadRes.directImageUrl) {
            setHdImageUrl(uploadRes.directImageUrl);
          }
        }
      } catch (uploadErr) {
        console.warn('Aviso: el servidor operó en modo local:', uploadErr);
      }

      // 3. Construir mensaje médico formal para el paciente
      const finalShareUrl = publicShareUrl || undefined;
      const encodedBuiltMsg = buildWhatsAppMessage(
        {
          patientName: patient.fullName,
          docTitle: activeDef.shortName,
        },
        finalShareUrl
      );
      const msg = decodeURIComponent(encodedBuiltMsg);
      setActiveMessage(msg);

      const cleanPhone = formatWhatsAppPhone(targetPhone);
      const encodedMsg = encodeURIComponent(msg);
      const univUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;

      setWhatsappUniversalUrl(univUrl);
      setDelivered(true);
    } catch (err: any) {
      console.error('Error en exportación híbrida:', err);
      setDeliveryError(`No se pudo generar el documento híbrido: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  const handleCopyMessage = async () => {
    if (!activeMessage) return;
    try {
      await navigator.clipboard.writeText(activeMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      setDeliveryError('No se pudo copiar automáticamente el texto.');
    }
  };

  const handleCopyImageToClipboard = async () => {
    if (!hdImageDataUrl) return;
    try {
      const ok = await copyImageToClipboard(hdImageDataUrl);
      if (ok) {
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3000);
      } else {
        handleDownloadImage();
      }
    } catch {
      handleDownloadImage();
    }
  };

  const handleDownloadImage = () => {
    const url = hdImageDataUrl || hdImageUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDef.filenamePrefix}_${sanitizeFileName(patient.fullName || 'Paciente')}_UltraHD.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPdf = () => {
    if (!generatedPdfBytes) return;
    const patientSafeName = sanitizeFileName(patient.fullName || 'Paciente');
    const fileName = `${activeDef.filenamePrefix}_${patientSafeName}.pdf`;
    downloadBlob(generatedPdfBytes, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#0b1324] border border-cyan-500/30 w-full max-w-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        
        {/* Cabecera Médica CCMI */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyan-950/80 to-slate-900 border-b border-cyan-500/30 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Share2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black leading-tight text-white">
                  Envío Híbrido por WhatsApp
                </h2>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                  Dual: Imagen + PDF
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Paciente: <strong className="text-cyan-200">{patient.fullName || 'Sin nombre'}</strong> ({patient.idNumber || 'S/C'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Visualización Dual: Imagen HD vs PDF */}
        <div className="flex items-center border-b border-slate-800/80 bg-slate-900/60 px-4 pt-2.5 shrink-0 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'image'
                ? 'border-cyan-400 text-cyan-200 bg-cyan-950/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>Imagen Ultra HD (WhatsApp)</span>
            {hdImageDataUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'pdf'
                ? 'border-cyan-400 text-cyan-200 bg-cyan-950/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Documento PDF Oficial</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded">Vectorial</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {deliveryError && (
            <div
              role="alert"
              className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
              <span>{deliveryError}</span>
            </div>
          )}

          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <p className="font-bold text-white text-sm">{processStep}</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Procesando papelería clínica oficial con inyección vectorial y rasterizado fotográfico a 300 DPI.
              </p>
            </div>
          ) : (
            <>
              {/* VISTA 1: IMAGEN ULTRA HD PARA WHATSAPP */}
              {activeTab === 'image' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold text-slate-200">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Previsualización Fotográfica para el Chat del Paciente</span>
                      </span>
                      <span className="text-emerald-400 font-mono font-bold text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        300 DPI • Lectura Directa Móvil
                      </span>
                    </div>

                    {/* Contenedor de la Imagen */}
                    {hdImageDataUrl || hdImageUrl ? (
                      <div className="relative group max-h-[300px] sm:max-h-[360px] w-full overflow-y-auto rounded-xl bg-slate-950 p-2 flex justify-center border border-slate-800">
                        <img
                          src={hdImageDataUrl || hdImageUrl || ''}
                          alt="Previsualización de Documento"
                          className="max-h-[340px] w-auto rounded shadow-lg object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full flex flex-col items-center justify-center text-slate-500 gap-2">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-xs">Generando imagen de alta resolución...</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones de la Imagen HD */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyImageToClipboard}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-400/40 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md"
                      title="Copia la imagen en el portapapeles. Luego en WhatsApp Web solo presionas Ctrl+V"
                    >
                      {copiedImage ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300">¡Imagen Copiada! (Pega con Ctrl+V)</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-cyan-400" />
                          <span>Copiar Imagen para WhatsApp (Ctrl+V)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>Descargar Imagen HD (PNG)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* VISTA 2: ARCHIVO PDF OFICIAL */}
              {activeTab === 'pdf' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>Ficha Técnica del Documento PDF</span>
                      </span>
                      <span className="text-blue-300 font-mono text-[10px] bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30">
                        Vectorial Inmutable
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] font-mono">
                      <div>Tipo: <strong className="text-white">{activeDef.label}</strong></div>
                      <div>Resolución: <strong className="text-emerald-400">Infinita (Vectorial)</strong></div>
                      <div>Peso Estimado: <strong className="text-white">~120 KB</strong></div>
                      <div>Firmante: <strong className="text-white">Dr. Samir Moucharrafie</strong></div>
                    </div>

                    {publicShareUrl && (
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[320px]">
                          Portal: {publicShareUrl}
                        </span>
                        <a
                          href={publicShareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:underline font-bold shrink-0 ml-2"
                        >
                          <span>Ver Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar PDF Oficial Firmado</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-4 h-4 text-cyan-400" />
                          <span className="text-cyan-300">¡Texto Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-400" />
                          <span>Copiar Mensaje y Enlace</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* BARRA DE ENVÍO DIRECTO A WHATSAPP */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#070d1e] border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 min-w-0 font-mono">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      Destinatario: <strong className="text-white font-bold">{phoneNumber}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleHybridExport(phoneNumber)}
                    className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 underline shrink-0 cursor-pointer"
                  >
                    Actualizar
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <a
                    href={whatsappUniversalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition text-center active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-white" />
                    <span>Abrir Chat de WhatsApp con Paciente</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="w-full sm:w-auto p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                    title="Escanear con teléfono móvil"
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>{showQrCode ? 'Ocultar QR' : 'Escanear QR'}</span>
                  </button>
                </div>

                {/* Código QR Flotante */}
                {showQrCode && (
                  <div className="p-4 rounded-2xl bg-[#070d1e] border border-slate-800 flex flex-col items-center text-center space-y-2.5 animate-fade-in font-mono">
                    <div className="p-2.5 bg-white rounded-2xl shadow-md">
                      <OfficialQrCode
                        value={whatsappUniversalUrl}
                        size={130}
                        darkColor="#0f172a"
                        lightColor="#ffffff"
                      />
                    </div>
                    <p className="text-[11px] text-slate-300 font-bold">
                      Apunta con la cámara de tu teléfono móvil
                    </p>
                    <p className="text-[10px] text-slate-400 max-w-xs">
                      Se abrirá el chat de WhatsApp con {patient.fullName} y el documento listo para enviar.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Certificado por CCMI • Dr. Samir Moucharrafie</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer border border-slate-700"
          >
            Listo, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
