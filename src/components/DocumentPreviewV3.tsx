// src/components/DocumentPreviewV3.tsx
import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface DocumentPreviewV3Props {
  pdfBytes: Uint8Array | null;
  pageNumber?: number; // Base 1
  cssWidth?: number;
}

export const DocumentPreviewV3: React.FC<DocumentPreviewV3Props> = ({
  pdfBytes,
  pageNumber = 1,
  cssWidth = 800,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pdfBytes || !canvasRef.current) return;

    let isCancelled = false;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
    let renderTask: any = null;

    const renderPdf = async () => {
      try {
        // Uso de .slice() obligatorio para aislar y no mutar el buffer
        pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
        if (isCancelled) return;

        const maxPages = pdfDoc.numPages;
        const targetPage = Math.min(Math.max(1, pageNumber), maxPages);
        const page = await pdfDoc.getPage(targetPage);
        if (isCancelled) return;

        const viewportBase = page.getViewport({ scale: 1 });
        const scale = cssWidth / viewportBase.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({
          canvasContext: canvas.getContext('2d')!,
          viewport,
        });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return;
        console.error('[DocumentPreviewV3] Error renderizando vista previa:', err);
      }
    };

    renderPdf();

    // CLEANUP VITAL: Previene fugas de memoria en SPA
    return () => {
      isCancelled = true;
      if (renderTask && renderTask.cancel) {
        renderTask.cancel();
      }
      if (pdfDoc && pdfDoc.destroy) {
        pdfDoc.destroy();
      }
    };
  }, [pdfBytes, pageNumber, cssWidth]);

  if (!pdfBytes) {
    return (
      <div className="w-full h-96 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 font-mono text-xs animate-pulse">
        Cargando vista previa oficial V3.1...
      </div>
    );
  }

  return (
    <div className="shadow-2xl border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 flex justify-center p-2">
      <canvas ref={canvasRef} className="shadow-lg border border-slate-700/60 block max-w-full h-auto rounded-lg" />
    </div>
  );
};
