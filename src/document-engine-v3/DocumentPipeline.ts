/**
 * DocumentPipeline.ts — CCMI Document Engine V3
 * Pipeline único y determinista de distribución de documentos médicos.
 */

export function downloadPdf(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function shareWhatsApp(bytes: Uint8Array, fileName: string): Promise<void> {
  const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const file = new File([bytes], safeName, { type: 'application/pdf' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: safeName,
        text: `Adjunto documento médico oficial: ${safeName}`,
      });
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('[DocumentPipeline] navigator.share cancelado o no soportado, ejecutando fallback:', err);
    }
  }

  // Fallback Universal (Desktop y navegadores sin File Share API)
  downloadPdf(bytes, safeName);
  const encodedText = encodeURIComponent(`Adjunto documento médico oficial: ${safeName}`);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}
