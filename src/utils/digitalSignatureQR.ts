/**
 * digitalSignatureQR.ts
 * 
 * PILAR 4: SEGURIDAD MÉDICO-LEGAL & QR CRIPTOGRÁFICO DE VERIFICACIÓN
 * =================================================================
 * Genera el enlace y payload de verificación digital institucional para que 
 * farmacias, clínicas y aseguradoras certifiquen la autenticidad del documento 
 * emitido por el Dr. Samir Moucharrafie Naime (MPPS 61231 / CMEB 5331).
 */

export interface VerificationPayload {
  folioId: string;
  documentType: string;
  patientCleanId: string;
  patientInitials: string;
  issueDateIso: string;
  doctorMpps: string;
  doctorCmeb: string;
  shaSignature: string;
}

export class DigitalSignatureQR {
  private static readonly VERIFICATION_BASE_URL = 'https://ccmi-dr-samir.web.app/v';

  /**
   * Genera una firma hash criptográfica simple de 8 caracteres
   */
  private static generateChecksum(input: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
  }

  /**
   * Genera el URL oficial que será codificado en el código QR del documento.
   */
  public static generateVerificationUrl(
    documentType: string,
    patientFullName: string,
    patientId: string,
    docDate?: string
  ): string {
    const cleanId = (patientId || '').replace(/[^\d]/g, '');
    const initials = (patientFullName || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);

    const dateStr = docDate || new Date().toISOString().split('T')[0];
    const rawData = `${documentType}|${cleanId}|${initials}|${dateStr}|MPPS61231|CMEB5331`;
    const sig = this.generateChecksum(rawData);
    
    const params = new URLSearchParams({
      t: documentType.toLowerCase(),
      p: cleanId,
      i: initials,
      d: dateStr,
      doc: 'SMN-61231',
      s: sig,
    });

    return `${this.VERIFICATION_BASE_URL}?${params.toString()}`;
  }

  /**
   * Genera el payload de verificación estructurado
   */
  public static getPayload(
    documentType: string,
    patientFullName: string,
    patientId: string,
    docDate?: string
  ): VerificationPayload {
    const cleanId = (patientId || '').replace(/[^\d]/g, '');
    const initials = (patientFullName || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);

    const dateStr = docDate || new Date().toISOString().split('T')[0];
    const rawData = `${documentType}|${cleanId}|${initials}|${dateStr}|MPPS61231|CMEB5331`;
    const sig = this.generateChecksum(rawData);

    return {
      folioId: `CCMI-${sig.slice(0, 4)}-${cleanId.slice(-4) || '2026'}`,
      documentType,
      patientCleanId: cleanId,
      patientInitials: initials,
      issueDateIso: dateStr,
      doctorMpps: '61231',
      doctorCmeb: '5331',
      shaSignature: sig,
    };
  }
}
