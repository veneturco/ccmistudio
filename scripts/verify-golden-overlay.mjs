import fs from 'node:fs';
import vm from 'node:vm';

const js = fs.readFileSync('public/assets/index-master-v2.js', 'utf8');
class MockObserver { observe() {} disconnect() {} }
const sandbox = {
  window: {}, self: {}, globalThis: {},
  console: { log: () => {}, warn: () => {}, error: () => {} },
  setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval,
  Uint8Array: Uint8Array, ArrayBuffer: ArrayBuffer, Promise: Promise,
  Headers: Headers, Request: Request, Response: Response, AbortController: AbortController,
  MutationObserver: MockObserver,
  document: { createElement: () => ({ getContext: () => null, style: {}, setAttribute: () => {} }), querySelectorAll: () => [], querySelector: () => null, getElementById: () => null, head: { appendChild: () => {} }, body: { appendChild: () => {} }, documentElement: { style: {} }, addEventListener: () => {} },
  navigator: { userAgent: 'node' }, location: { href: 'http://localhost/', origin: 'http://localhost' }, matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  localStorage: { getItem: () => null, setItem: () => {} }, sessionStorage: { getItem: () => null, setItem: () => {} }, addEventListener: () => {},
  fetch: () => Promise.resolve({ ok: true, text: () => Promise.resolve(''), json: () => Promise.resolve({}), arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) })
};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.global = sandbox; sandbox.globalThis = sandbox;
const patched = js + '; globalThis.__PDFLib_ca = ca; globalThis.__PDFLib_rgb = _n;';
vm.runInNewContext(patched, sandbox, { timeout: 15000 });
const PDFDocument = sandbox.__PDFLib_ca;
const rgb = sandbox.__PDFLib_rgb;

async function runAudit() {
  const masterBytes = fs.readFileSync('public/templates/orden_lab_base.pdf');
  const masterDoc = await PDFDocument.load(masterBytes);
  const outDoc = await PDFDocument.create();

  const regContent = fs.readFileSync('src/document-engine-v3/LabCanonicalRegistry.ts', 'utf8');
  const jsonStr = regContent.substring(regContent.indexOf('['), regContent.lastIndexOf(']') + 1);
  const allCheckboxes = eval(jsonStr);
  const PT_PER_MM = 72 / 25.4;

  for (let i = 0; i < masterDoc.getPageCount(); i++) {
    const srcPage = masterDoc.getPage(i);
    const cropBox = srcPage.getCropBox();
    const embeddedMaster = await outDoc.embedPage(srcPage, {
      left: cropBox.x, right: cropBox.x + cropBox.width,
      bottom: cropBox.y, top: cropBox.y + cropBox.height
    }, [1, 0, 0, 1, -cropBox.x, -cropBox.y]);

    const newPage = outDoc.addPage();
    newPage.setSize(cropBox.width, cropBox.height);
    newPage.drawPage(embeddedMaster);

    const pageFields = allCheckboxes.filter(f => f.page === i + 1);

    for (const field of pageFields) {
      const xPt = Number(field.xMm) * PT_PER_MM;
      const hPt = Number(field.heightMm) * PT_PER_MM;
      const yPt = Number(cropBox.height) - (Number(field.yMm) * PT_PER_MM) - hPt;
      const wPt = Number(field.widthMm) * PT_PER_MM;

      newPage.drawRectangle({
        x: xPt, y: yPt, width: wPt, height: hPt,
        borderColor: rgb(0, 0.2, 0.9), borderWidth: 0.6,
        color: rgb(0.2, 0.5, 1), opacity: 0.25, borderOpacity: 0.95
      });

      const cx = xPt + wPt / 2;
      const cy = yPt + hPt / 2;
      const arm = Math.min(wPt, hPt) * 0.45;
      const crossThick = 0.6;
      newPage.drawRectangle({ x: cx - arm, y: cy - crossThick / 2, width: arm * 2, height: crossThick, color: rgb(1, 0, 0) });
      newPage.drawRectangle({ x: cx - crossThick / 2, y: cy - arm, width: crossThick, height: arm * 2, color: rgb(1, 0, 0) });

      const shortId = field.id.replace(/^labTests\./, '');
      newPage.drawText(shortId, { x: xPt + wPt + 1.2, y: yPt + 0.5, size: 3.5, color: rgb(0, 0, 0.75) });
    }
  }

  const finalPdfBytes = await outDoc.save();
  const certDir = 'docs/certification/V3.1';
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });
  fs.writeFileSync(certDir + '/Golden_Overlay_Diagnostic.pdf', finalPdfBytes);
  console.log('✅ Artefacto de certificación generado exitosamente: docs/certification/V3.1/Golden_Overlay_Diagnostic.pdf');
}

runAudit();
