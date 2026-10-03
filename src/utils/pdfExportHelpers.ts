export interface SharePdfOptions {
  phone?: string;
  patientName?: string;
  doctorName?: string;
  docTitle?: string;
  documentDate?: string;
  message?: string;
}

export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  // Eliminar todos los caracteres no numéricos
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';

  // 1. Eliminar prefijos de discado internacional tipo 0058...
  if (cleaned.startsWith('0058')) {
    cleaned = cleaned.substring(2); // Queda como 58...
  }

  // 2. Si empieza por 580 (ej. +58 0424...), remover el cero interno erróneo
  if (cleaned.startsWith('580') && cleaned.length >= 12) {
    cleaned = '58' + cleaned.substring(3);
  }

  // 3. Formato estándar nacional con cero inicial (ej: 04249124481, 0414..., 0412..., 0416..., 0426..., 0286...)
  if (cleaned.startsWith('0') && (cleaned.length === 11 || cleaned.length === 10)) {
    cleaned = '58' + cleaned.substring(1);
  } 
  // 4. Formato móvil sin cero ni código internacional (ej: 4249124481, 414..., 412...)
  else if (!cleaned.startsWith('58') && cleaned.length === 10 && (cleaned.startsWith('4') || cleaned.startsWith('2'))) {
    cleaned = '58' + cleaned;
  }

  return cleaned;
}

export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    .replace(/_+/g, '_');
}

export function toBlobPart(data: Uint8Array | ArrayBuffer | Blob): BlobPart {
  if (data instanceof Blob) return data;
  if (data instanceof ArrayBuffer) return data;
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

export function toBufferSource(data: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export function downloadBlob(blobOrBytes: Blob | Uint8Array, fileName: string): void {
  const blob = blobOrBytes instanceof Blob ? blobOrBytes : new Blob([blobOrBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      if (a.parentNode) {
        document.body.removeChild(a);
      }
    } catch {}
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }, 1000);
}

export interface SharedDocumentResult {
  success: boolean;
  docId: string;
  shareUrl: string;
  directPdfUrl: string;
  directImageUrl: string | null;
  imageDataUrl: string | null;
  fileName: string;
  imageFileName: string;
}

export async function uploadPdfForSharing(
  pdfBlobOrBytes: Blob | Uint8Array,
  fileName: string,
  extraMeta?: { patientName?: string; docTitle?: string }
): Promise<SharedDocumentResult> {
  let base64 = '';
  if (pdfBlobOrBytes instanceof Uint8Array) {
    // Conversión segura por chunks para evitar desbordes de call stack en PDFs pesados
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < pdfBlobOrBytes.length; i += chunkSize) {
      const chunk = pdfBlobOrBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    base64 = btoa(binary);
  } else {
    base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.includes('base64,') ? res.split('base64,')[1] : res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlobOrBytes);
    });
  }

  const res = await fetch('/api/documents/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdfBase64: base64,
      fileName,
      patientName: extraMeta?.patientName,
      docTitle: extraMeta?.docTitle,
    }),
  });

  if (!res.ok) {
    throw new Error('Error al procesar y publicar documento híbrido.');
  }

  return res.json();
}

/**
 * Copia una imagen directamente al portapapeles del sistema operativo
 * para que el médico pueda pegarla con Ctrl+V en WhatsApp Web o Desktop sin necesidad de adjuntar archivo.
 */
export async function copyImageToClipboard(imageDataUrlOrBlob: string | Blob): Promise<boolean> {
  try {
    let blob: Blob;
    if (typeof imageDataUrlOrBlob === 'string') {
      const res = await fetch(imageDataUrlOrBlob);
      blob = await res.blob();
    } else {
      blob = imageDataUrlOrBlob;
    }

    // La API del portapapeles de navegadores exige estrictamente el formato image/png
    if (blob.type !== 'image/png') {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = loaded.naturalWidth || loaded.width;
      canvas.height = loaded.naturalHeight || loaded.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.drawImage(loaded, 0, 0);
      URL.revokeObjectURL(objectUrl);
      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (pngBlob) blob = pngBlob;
    }

    if (navigator.clipboard && (window as any).ClipboardItem) {
      const item = new (window as any).ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('No se pudo copiar la imagen al portapapeles:', err);
  }
  return false;
}

// === MEJORA: PLANTILLAS INTELIGENTES DE WHATSAPP AUTOMÁTICAS ===
export function buildWhatsAppMessage(opts: SharePdfOptions, shareUrl?: string): string {
  const patientName = opts.patientName || 'Paciente';
  const docTitle = opts.docTitle || 'Documento Médico';
  
  // 1. Saludo Inicial dinámico según la hora
  const hour = new Date().getHours();
  let timeGreeting = 'Buenos días';
  if (hour >= 12 && hour < 18) timeGreeting = 'Buenas tardes';
  else if (hour >= 18) timeGreeting = 'Buenas noches';
  
  const greeting = `*${timeGreeting} estimado(a) ${patientName}*,\nEspero se encuentre muy bien.`;

  // 2. Determinar la plantilla según el tipo de documento
  let templateBody = `Le hacemos entrega de su *${docTitle}* emitido por el *Dr. Samir Moucharrafie*.`;
  const lowerTitle = docTitle.toLowerCase();
  
  if (lowerTitle.includes('récipe') || lowerTitle.includes('recipe')) {
    templateBody += `\n\n💊 *Recordatorio médico:* Por favor, asegúrese de cumplir el tratamiento y las indicaciones al pie de la letra para garantizar una pronta recuperación.`;
  } else if (lowerTitle.includes('orden') || lowerTitle.includes('exámenes')) {
    templateBody += `\n\n🔬 *Instrucciones:* Adjunto su orden de estudios médicos. Una vez se haya realizado los exámenes y tenga los resultados, por favor envíelos por este medio para que el Doctor pueda revisarlos.`;
  } else if (lowerTitle.includes('informe')) {
    templateBody += `\n\n📄 *Documentación:* Adjuntamos su informe médico detallado para sus propios registros clínicos o trámites pertinentes.`;
  } else if (lowerTitle.includes('constancia') || lowerTitle.includes('reposo')) {
    templateBody += `\n\n🗓️ *Reposo Médico:* Adjuntamos su constancia médica oficial. Le deseamos una pronta y exitosa recuperación.`;
  }

  // 3. Enlace de descarga (si el PDF está en la nube)
  const linkInfo = shareUrl 
    ? `\n\n📥 *Descargue o visualice su PDF Oficial aquí:*\n${shareUrl}\n_Nota: Este enlace es seguro y respaldado por CCMI._` 
    : '';
    
  // 4. Firma institucional
  const footer = `\n\nAtentamente,\n*Dr. Samir Moucharrafie Naime*\n_Neurocirugía y Columna Mínimamente Invasiva (CCMI)_\n_Orinokia Piso 2_`;
  
  return encodeURIComponent(`${greeting}\n\n${templateBody}${linkInfo}${footer}`);
}
// ===============================================================


export function sharePdfToWhatsApp(phone: string, text: string): void {
  const cleanPhone = formatWhatsAppPhone(phone);
  const url = `https://wa.me/${cleanPhone}?text=${text}`;
  window.open(url, '_blank');
}
