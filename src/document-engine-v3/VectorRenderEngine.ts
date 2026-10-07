// src/document-engine-v3/VectorRenderEngine.ts
import { PDFDocument, rgb } from 'pdf-lib';
import { validatePageGeometry, PT_PER_MM } from './geometry/MasterGeometry';
import { LabCheckboxDef } from './LabCanonicalRegistry';

export type LabField = LabCheckboxDef;

export interface TextFieldDef {
  text: string;
  page: number;
  xMm: number;
  yMm: number;
  size?: number;
}

export interface RenderPlanV31 {
  labExams?: LabField[];
  textFields?: TextFieldDef[];
}

/**
 * Motor Vectorial V3.1 — Renderizado Isotrópico Puro con Soporte Diagnóstico
 *
 * @param masterBytes Buffer del PDF oficial maestro (%PDF-)
 * @param plan Plan de marcado clínico o arreglo directo de campos
 * @param isDiagnostic Bandera forense: si es true, genera overlay con rectángulos azules, cruces centrales e IDs
 */
export interface RenderOptionsV31 {
  isDiagnostic?: boolean;
}

export async function generateCanonicalPdf(
  masterBytes: Uint8Array,
  planOrFields: RenderPlanV31 | LabField[],
  diagnosticOrOptions: boolean | RenderOptionsV31 = false
): Promise<Uint8Array> {
  let requestedDiagnostic = typeof diagnosticOrOptions === 'boolean' ? diagnosticOrOptions : Boolean(diagnosticOrOptions?.isDiagnostic);
  // Doble cerrojo clínico de seguridad: En producción se requieren AMBAS banderas activas
  let effectiveDiagnostic = false;
  if (requestedDiagnostic) {
    const isProd = typeof import.meta !== 'undefined' && import.meta.env && Boolean(import.meta.env.PROD);
    const allowDiag = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ALLOW_DIAGNOSTIC === 'true';
    const certMode = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CERTIFICATION_MODE === 'true';

    if (isProd) {
      if (allowDiag && certMode) {
        effectiveDiagnostic = true;
      } else {
        console.error('[VectorRenderEngine] ⛔ BLOQUEO CLÍNICO: Diagnóstico en producción requiere VITE_ALLOW_DIAGNOSTIC=true Y VITE_CERTIFICATION_MODE=true. Forzando marcado limpio de producción.');
      }
    } else {
      if (allowDiag) {
        effectiveDiagnostic = true;
      } else {
        console.warn('[VectorRenderEngine] ⚠️ Modo diagnóstico bloqueado: VITE_ALLOW_DIAGNOSTIC no está activo. Forzando marcado limpio de producción.');
      }
    }
  }

  // Fail-Closed: Bloqueo si el binario de entrada está ausente o no es un PDF válido
  if (
    !masterBytes ||
    masterBytes.length < 500 ||
    masterBytes[0] !== 0x25 ||
    masterBytes[1] !== 0x50 ||
    masterBytes[2] !== 0x44 ||
    masterBytes[3] !== 0x46
  ) {
    throw new Error('[VectorRenderEngine] Binario corrupto o inválido (Fallo Cerrado). Se esperaba cabecera %PDF-.');
  }

  // Normalizar entrada de parámetros (admite RenderPlanV31 o arreglo directo de LabField)
  const isDirectArray = Array.isArray(planOrFields);
  const labExams: LabField[] = isDirectArray ? planOrFields : (planOrFields.labExams || []);
  const textFields: TextFieldDef[] = isDirectArray ? [] : (planOrFields.textFields || []);

  const masterDoc = await PDFDocument.load(masterBytes);
  const outDoc = await PDFDocument.create();

  for (let i = 0; i < masterDoc.getPageCount(); i++) {
    const srcPage = masterDoc.getPage(i);
    const cropBox = srcPage.getCropBox();

    // Validación estricta y Fail-Closed de geometría (reconoce ordenLab si tiene 2 páginas o Media Carta)
    const isLab = masterDoc.getPageCount() === 2 || cropBox.width < 500;
    validatePageGeometry(srcPage, isLab ? 'ordenLab' : 'recipe');

    // Overlay seguro con matriz afín identidad
    const embeddedMaster = await outDoc.embedPage(
      srcPage,
      {
        left: cropBox.x,
        right: cropBox.x + cropBox.width,
        bottom: cropBox.y,
        top: cropBox.y + cropBox.height,
      },
      [1, 0, 0, 1, -cropBox.x, -cropBox.y]
    );

    const newPage = outDoc.addPage([cropBox.width, cropBox.height]);
    newPage.drawPage(embeddedMaster);

    const pageFields = labExams.filter((f) => f.page === i + 1);

    for (const field of pageFields) {
      // Coordenadas Isotrópicas absolutas (1 mm = 72/25.4 pt)
      const xPt = field.xMm * PT_PER_MM;
      const hPt = field.heightMm * PT_PER_MM;
      const yPt = cropBox.height - field.yMm * PT_PER_MM - hPt; // Inversión cartesiana precisa
      const wPt = field.widthMm * PT_PER_MM;

      if (effectiveDiagnostic) {
        // Overlay de Certificación (Recuadro azul, cruz central e ID de casilla)
        newPage.drawRectangle({
          x: xPt,
          y: yPt,
          width: wPt,
          height: hPt,
          borderColor: rgb(0, 0, 1),
          borderWidth: 0.5,
        });
        // Cruz central roja
        newPage.drawLine({
          start: { x: xPt + wPt / 2 - 4, y: yPt + hPt / 2 },
          end: { x: xPt + wPt / 2 + 4, y: yPt + hPt / 2 },
          thickness: 0.5,
          color: rgb(1, 0, 0),
        });
        newPage.drawLine({
          start: { x: xPt + wPt / 2, y: yPt + hPt / 2 - 4 },
          end: { x: xPt + wPt / 2, y: yPt + hPt / 2 + 4 },
          thickness: 0.5,
          color: rgb(1, 0, 0),
        });
        // ID de la casilla para auditar a contraluz las 6 casillas adicionales
        const shortId = field.id.replace(/^labTests\./, '');
        newPage.drawText(shortId, {
          x: xPt + wPt + 1.5,
          y: yPt + 0.8,
          size: 4.5,
          color: rgb(0, 0, 0.8),
        });
      } else {
        // Checkmark de Producción (Vectorial puro, trazos geométricos nítidos)
        const inset = 1.2;
        newPage.drawLine({
          start: { x: xPt + inset, y: yPt + hPt * 0.4 },
          end: { x: xPt + wPt * 0.4, y: yPt + inset },
          thickness: 1.3,
          color: rgb(0.8, 0.1, 0.1),
        });
        newPage.drawLine({
          start: { x: xPt + wPt * 0.4, y: yPt + inset },
          end: { x: xPt + wPt - inset, y: yPt + hPt - inset },
          thickness: 1.3,
          color: rgb(0.8, 0.1, 0.1),
        });
      }
    }

    // Renderizado de campos de texto clínico
    const pageTexts = textFields.filter((t) => t.page === i + 1);
    for (const t of pageTexts) {
      if (!t.text) continue;
      const xPt = t.xMm * PT_PER_MM;
      const yPt = cropBox.height - t.yMm * PT_PER_MM;
      newPage.drawText(t.text, {
        x: xPt,
        y: yPt,
        size: t.size || 9.5,
        color: rgb(0.05, 0.05, 0.1),
      });
    }
  }

  // Prevenir que los drivers de impresión reescalen la hoja física
  try {
    outDoc.catalog.set(
      outDoc.context.obj('ViewerPreferences'),
      outDoc.context.obj({ PrintScaling: 'None' })
    );
  } catch {}

  return await outDoc.save();
}

// Alias de retrocompatibilidad
export const renderCanonicalDocument = generateCanonicalPdf;
