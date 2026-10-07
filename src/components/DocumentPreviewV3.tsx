import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js para Vite / Web
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface Props {
  pdfBytes: Uint8Array | null;
  pageNumber?: number; // Base 1
  widthPx?: number;
}

export const DocumentPreviewV3: React.FC<Props> = ({ pdfBytes, pageNumber = 1, widthPx = 800 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pdfBytes || !canvasRef.current) return;

    let renderTask: any = null;

    const renderPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);

        const viewportBase = page.getViewport({ scale: 1 });
        const scale = widthPx / viewportBase.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (error: any) {
        if (error?.name === 'RenderingCancelledException') return;
        console.error('Error renderizando preview V3:', error);
      }
    };

    renderPdf();

    return () => {
      if (renderTask && renderTask.cancel) {
        renderTask.cancel();
      }
    };
  }, [pdfBytes, pageNumber, widthPx]);

  if (!pdfBytes) {
    return <div className="animate-pulse bg-slate-900 border border-slate-800 w-full h-[700px] rounded-2xl flex items-center justify-center text-slate-500 font-mono text-xs">Cargando previsualización V3...</div>;
  }

  return (
    <div className="shadow-2xl border border-slate-700/80 rounded-2xl overflow-hidden bg-slate-950 flex justify-center">
      <canvas ref={canvasRef} className="max-w-full h-auto block" />
    </div>
  );
};
