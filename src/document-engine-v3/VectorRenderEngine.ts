import { PDFDocument, rgb } from 'pdf-lib';

const MM_TO_PT = 72 / 25.4;

export interface RenderPlan {
  labExams?: { page: number; xMm: number; yMm: number; widthMm: number; heightMm: number }[];
  textFields?: { text: string; page: number; xMm: number; yMm: number; size: number }[];
}

export async function renderCanonicalDocument(masterBytes: Uint8Array, plan: RenderPlan): Promise<Uint8Array> {
  const masterDoc = await PDFDocument.load(masterBytes);
  const outDoc = await PDFDocument.create();

  const labExams = plan.labExams || [];
  const textFields = plan.textFields || [];

  for (let i = 0; i < masterDoc.getPageCount(); i++) {
    const srcPage = masterDoc.getPage(i);
    const cropBox = srcPage.getCropBox();

    // 1. Reset Geométrico Absoluto a (0,0) preservando tamaño original de imprenta
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

    // 2. Renderizado Vectorial Puro de Checkboxes (Sin usar DrawText("✓"))
    const pageExams = labExams.filter((f) => f.page === i + 1);
    for (const field of pageExams) {
      const xPt = field.xMm * MM_TO_PT;
      const hPt = field.heightMm * MM_TO_PT;
      const yPt = cropBox.height - field.yMm * MM_TO_PT - hPt;

      const inset = 1.5;
      // Trazo 1 del check (ala corta)
      newPage.drawLine({
        start: { x: xPt + inset, y: yPt + hPt * 0.4 },
        end: { x: xPt + field.widthMm * 0.4 * MM_TO_PT, y: yPt + inset },
        thickness: 1.4,
        color: rgb(0.8, 0.1, 0.1),
      });
      // Trazo 2 del check (ala larga ascendente)
      newPage.drawLine({
        start: { x: xPt + field.widthMm * 0.4 * MM_TO_PT, y: yPt + inset },
        end: { x: xPt + field.widthMm * MM_TO_PT - inset, y: yPt + hPt - inset },
        thickness: 1.4,
        color: rgb(0.8, 0.1, 0.1),
      });
    }

    // 3. Renderizado de Textos con origen cartesiano invertido y tipografía Helvetica
    const pageTexts = textFields.filter((f) => f.page === i + 1);
    for (const field of pageTexts) {
      if (!field.text) continue;
      const xPt = field.xMm * MM_TO_PT;
      const yPt = cropBox.height - field.yMm * MM_TO_PT;
      newPage.drawText(field.text, {
        x: xPt,
        y: yPt,
        size: field.size || 9.5,
        color: rgb(0.05, 0.05, 0.1),
      });
    }
  }

  // 4. Protección anti-escalado en drivers de impresión física
  try {
    outDoc.catalog.set(
      outDoc.context.obj('ViewerPreferences'),
      outDoc.context.obj({ PrintScaling: 'None' })
    );
  } catch {}

  return await outDoc.save();
}
