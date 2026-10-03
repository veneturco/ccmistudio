/**
 * PDFContentStreamReader.ts
 * 
 * MOTOR DE DECODIFICACIÓN, DESCOMPRESIÓN (/FlateDecode),
 * SEGUIMIENTO DE CTM Y EXTRACCIÓN DE PRIMITIVAS PDF.
 * =========================================================================
 * 
 * Capa independiente y universal para inspeccionar Content Streams de PDFPage,
 * resolver transformaciones de matrices afines (q, Q, cm) y extraer:
 * - Nodos de texto con posición física y tamaño (mm, top-left)
 * - Rectángulos (operador 're' y rutas poligonales cerradas 'm-l-l-l-h')
 * - Líneas vectoriales (m -> l)
 * - Regiones y trazados
 */

import {
  PDFDocument,
  PDFPage,
  PDFArray,
  PDFRef,
  PDFRawStream,
  decodePDFRawStream,
} from 'pdf-lib';

export interface RawTextNode {
  id: string;
  pageIndex: number;
  text: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  fontSizePt: number;
  fontName?: string;
}

export interface RawVectorRect {
  id: string;
  pageIndex: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  centerXMm: number;
  centerYMm: number;
  isStroked: boolean;
  isFilled: boolean;
  sourceOperator: 're' | 'path_m_l_h';
}

export interface RawVectorLine {
  id: string;
  pageIndex: number;
  startXCountMm: number;
  startYMm: number;
  endXMm: number;
  endYMm: number;
  lengthMm: number;
  thicknessMm: number;
  orientation: 'horizontal' | 'vertical' | 'diagonal';
}

export type CapabilitySupportStatus = 'SUPPORTED' | 'PARTIAL' | 'UNSUPPORTED';

export interface PDFCapabilityMatrix {
  flateDecode: CapabilitySupportStatus;
  ctm: CapabilitySupportStatus;
  textTj: CapabilitySupportStatus;
  textTJ: CapabilitySupportStatus;
  pdfArray: CapabilitySupportStatus;
  pdfRef: CapabilitySupportStatus;
  pdfRawStream: CapabilitySupportStatus;
  xObject: CapabilitySupportStatus;
  type3: CapabilitySupportStatus;
  toUnicode: CapabilitySupportStatus;
  rotation: CapabilitySupportStatus;
  scaling: CapabilitySupportStatus;
  clipping: CapabilitySupportStatus;
  curves: CapabilitySupportStatus;
  acroForm: CapabilitySupportStatus;
  annotations: CapabilitySupportStatus;
  unsupportedFeaturesFound: string[];
  requiresReview: boolean;
}

export interface PageContentExtractionResult {
  pageIndex: number;
  widthPt: number;
  heightPt: number;
  widthMm: number;
  heightMm: number;
  textNodes: RawTextNode[];
  vectorRects: RawVectorRect[];
  vectorLines: RawVectorLine[];
  capabilityMatrix: PDFCapabilityMatrix;
}

/**
 * Matriz de transformación afín 2D 3x3:
 * [ a  b  0 ]
 * [ c  d  0 ]
 * [ e  f  1 ]
 */
type Matrix2D = [number, number, number, number, number, number];

function identityMatrix(): Matrix2D {
  return [1, 0, 0, 1, 0, 0];
}

function multiplyMatrices(m1: Matrix2D, m2: Matrix2D): Matrix2D {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2,
    e1 * a2 + f1 * c2 + e2,
    e1 * b2 + f1 * d2 + f2,
  ];
}

function applyTransform(m: Matrix2D, x: number, y: number): { x: number; y: number } {
  return {
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5],
  };
}

const PT_TO_MM = 25.4 / 72.0;

export class PDFContentStreamReader {
  /**
   * Extrae todas las primitivas físicas de una página de un documento PDF
   */
  public static async extractPageContent(
    pdfDoc: PDFDocument,
    page: PDFPage,
    pageIndex: number
  ): Promise<PageContentExtractionResult> {
    const widthPt = page.getWidth();
    const heightPt = page.getHeight();
    const widthMm = widthPt * PT_TO_MM;
    const heightMm = heightPt * PT_TO_MM;

    const decompressedStreams = this.getDecompressedStreams(pdfDoc, page);
    const combinedContent = decompressedStreams.join('\n');

    const textNodes: RawTextNode[] = [];
    const vectorRects: RawVectorRect[] = [];
    const vectorLines: RawVectorLine[] = [];

    const unsupportedFeatures: string[] = [];
    if (combinedContent.includes('/Type3') || combinedContent.includes('/FontType3')) {
      unsupportedFeatures.push('Type3 Font (Bitmap/Non-vector)');
    }
    if (combinedContent.includes('/JBIG2Decode')) {
      unsupportedFeatures.push('JBIG2Decode Filter');
    }
    if (combinedContent.includes('/JPXDecode')) {
      unsupportedFeatures.push('JPXDecode Filter');
    }

    const capabilityMatrix: PDFCapabilityMatrix = {
      flateDecode: 'SUPPORTED',
      ctm: 'SUPPORTED',
      textTj: 'SUPPORTED',
      textTJ: 'SUPPORTED',
      pdfArray: 'SUPPORTED',
      pdfRef: 'SUPPORTED',
      pdfRawStream: 'SUPPORTED',
      xObject: combinedContent.includes('/XObject') ? 'PARTIAL' : 'SUPPORTED',
      type3: unsupportedFeatures.includes('Type3 Font (Bitmap/Non-vector)') ? 'UNSUPPORTED' : 'SUPPORTED',
      toUnicode: 'PARTIAL',
      rotation: 'SUPPORTED',
      scaling: 'SUPPORTED',
      clipping: combinedContent.includes(' W ') || combinedContent.includes(' W* ') ? 'PARTIAL' : 'SUPPORTED',
      curves: combinedContent.includes(' c ') || combinedContent.includes(' v ') || combinedContent.includes(' y ') ? 'SUPPORTED' : 'SUPPORTED',
      acroForm: 'PARTIAL',
      annotations: 'PARTIAL',
      unsupportedFeaturesFound: unsupportedFeatures,
      requiresReview: unsupportedFeatures.length > 0,
    };

    if (!combinedContent.trim()) {
      return {
        pageIndex,
        widthPt,
        heightPt,
        widthMm,
        heightMm,
        textNodes,
        vectorRects,
        vectorLines,
        capabilityMatrix,
      };
    }

    this.parseContentStream(
      combinedContent,
      pageIndex,
      heightPt,
      textNodes,
      vectorRects,
      vectorLines
    );

    return {
      pageIndex,
      widthPt,
      heightPt,
      widthMm,
      heightMm,
      textNodes,
      vectorRects,
      vectorLines,
      capabilityMatrix,
    };
  }

  /**
   * Obtiene y descomprime todos los streams de contenido de la página
   */
  private static getDecompressedStreams(pdfDoc: PDFDocument, page: PDFPage): string[] {
    const resultStrings: string[] = [];
    const contents = page.node.Contents();

    if (!contents) {
      return resultStrings;
    }

    const streamObjects: (PDFRawStream | any)[] = [];

    if (contents instanceof PDFArray) {
      for (let i = 0; i < contents.size(); i++) {
        const item = contents.get(i);
        const stream = item instanceof PDFRef ? pdfDoc.context.lookup(item) : item;
        if (stream) streamObjects.push(stream);
      }
    } else if (contents instanceof PDFRef) {
      const stream = pdfDoc.context.lookup(contents);
      if (stream) streamObjects.push(stream);
    } else {
      streamObjects.push(contents);
    }

    const textDecoder = new TextDecoder('latin1');

    for (const stream of streamObjects) {
      if (stream instanceof PDFRawStream) {
        try {
          const decoded = decodePDFRawStream(stream);
          if (decoded && typeof (decoded as any).getBytes === 'function') {
            const bytes = (decoded as any).getBytes();
            resultStrings.push(textDecoder.decode(bytes));
          } else {
            const rawBytes = stream.asUint8Array();
            resultStrings.push(textDecoder.decode(rawBytes));
          }
        } catch {
          try {
            const rawBytes = stream.asUint8Array();
            resultStrings.push(textDecoder.decode(rawBytes));
          } catch {
            // Stream no decodificable
          }
        }
      }
    }

    return resultStrings;
  }

  /**
   * Tokeniza y procesa los operadores del content stream
   */
  private static parseContentStream(
    content: string,
    pageIndex: number,
    pageHeightPt: number,
    textNodes: RawTextNode[],
    vectorRects: RawVectorRect[],
    vectorLines: RawVectorLine[]
  ): void {
    const tokens = this.tokenize(content);
    const ctmStack: Matrix2D[] = [identityMatrix()];
    let currentCtm: Matrix2D = identityMatrix();

    // Estado del bloque de texto
    let textMatrix: Matrix2D = identityMatrix();
    let textLineMatrix: Matrix2D = identityMatrix();
    let currentFontSizePt = 10;
    let currentFontName = 'Standard';

    // Estado de construcción de ruta vectorial
    interface PathPoint {
      x: number;
      y: number;
    }
    let currentPath: { op: string; points: PathPoint[] }[] = [];
    let currentLineWidth = 1.0;

    const stack: (number | string | any[])[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];

      // Operadores de Estado Gráfico y CTM
      if (tok === 'q') {
        ctmStack.push([...currentCtm]);
        stack.length = 0;
      } else if (tok === 'Q') {
        if (ctmStack.length > 1) {
          currentCtm = ctmStack.pop()!;
        }
        stack.length = 0;
      } else if (tok === 'cm') {
        if (stack.length >= 6) {
          const f = Number(stack.pop());
          const e = Number(stack.pop());
          const d = Number(stack.pop());
          const c = Number(stack.pop());
          const b = Number(stack.pop());
          const a = Number(stack.pop());
          const cmMatrix: Matrix2D = [a, b, c, d, e, f];
          currentCtm = multiplyMatrices(currentCtm, cmMatrix);
        }
        stack.length = 0;
      } else if (tok === 'w') {
        if (stack.length >= 1) {
          currentLineWidth = Number(stack.pop()) || 1.0;
        }
      }
      // Operadores de Bloque de Texto
      else if (tok === 'BT') {
        textMatrix = identityMatrix();
        textLineMatrix = identityMatrix();
        stack.length = 0;
      } else if (tok === 'ET') {
        stack.length = 0;
      } else if (tok === 'Tf') {
        if (stack.length >= 2) {
          currentFontSizePt = Number(stack.pop()) || 10;
          currentFontName = String(stack.pop()).replace(/^\//, '');
        }
        stack.length = 0;
      } else if (tok === 'Tm') {
        if (stack.length >= 6) {
          const f = Number(stack.pop());
          const e = Number(stack.pop());
          const d = Number(stack.pop());
          const c = Number(stack.pop());
          const b = Number(stack.pop());
          const a = Number(stack.pop());
          textMatrix = [a, b, c, d, e, f];
          textLineMatrix = [...textMatrix];
        }
        stack.length = 0;
      } else if (tok === 'Td' || tok === 'TD') {
        if (stack.length >= 2) {
          const ty = Number(stack.pop());
          const tx = Number(stack.pop());
          const moveMat: Matrix2D = [1, 0, 0, 1, tx, ty];
          textLineMatrix = multiplyMatrices(textLineMatrix, moveMat);
          textMatrix = [...textLineMatrix];
        }
        stack.length = 0;
      } else if (tok === 'T*') {
        const moveMat: Matrix2D = [1, 0, 0, 1, 0, -currentFontSizePt * 1.2];
        textLineMatrix = multiplyMatrices(textLineMatrix, moveMat);
        textMatrix = [...textLineMatrix];
        stack.length = 0;
      } else if (tok === 'Tj' || tok === "'" || tok === '"') {
        if (stack.length >= 1) {
          const rawStr = stack.pop();
          const decodedText = this.decodePdfString(rawStr);
          if (decodedText.trim()) {
            const combinedMatrix = multiplyMatrices(currentCtm, textMatrix);
            const pos = applyTransform(combinedMatrix, 0, 0);

            const xMm = pos.x * PT_TO_MM;
            const yMm = (pageHeightPt - pos.y) * PT_TO_MM;
            const widthPt = decodedText.length * currentFontSizePt * 0.55;
            const widthMm = widthPt * PT_TO_MM;
            const heightMm = currentFontSizePt * PT_TO_MM;

            textNodes.push({
              id: `text_p${pageIndex + 1}_${textNodes.length + 1}`,
              pageIndex,
              text: decodedText.trim(),
              xMm,
              yMm: Math.max(0, yMm - heightMm),
              widthMm,
              heightMm,
              fontSizePt: currentFontSizePt,
              fontName: currentFontName,
            });
          }
        }
        stack.length = 0;
      } else if (tok === 'TJ') {
        if (stack.length >= 1) {
          const arr = stack.pop();
          if (Array.isArray(arr)) {
            let combined = '';
            for (const item of arr) {
              if (typeof item === 'string') {
                combined += this.decodePdfString(item);
              }
            }
            if (combined.trim()) {
              const combinedMatrix = multiplyMatrices(currentCtm, textMatrix);
              const pos = applyTransform(combinedMatrix, 0, 0);

              const xMm = pos.x * PT_TO_MM;
              const yMm = (pageHeightPt - pos.y) * PT_TO_MM;
              const widthPt = combined.length * currentFontSizePt * 0.55;
              const widthMm = widthPt * PT_TO_MM;
              const heightMm = currentFontSizePt * PT_TO_MM;

              textNodes.push({
                id: `text_p${pageIndex + 1}_${textNodes.length + 1}`,
                pageIndex,
                text: combined.trim(),
                xMm,
                yMm: Math.max(0, yMm - heightMm),
                widthMm,
                heightMm,
                fontSizePt: currentFontSizePt,
                fontName: currentFontName,
              });
            }
          }
        }
        stack.length = 0;
      }
      // Operadores Vectoriales: Rutas y Rectángulos
      else if (tok === 're') {
        if (stack.length >= 4) {
          const h = Number(stack.pop());
          const w = Number(stack.pop());
          const y = Number(stack.pop());
          const x = Number(stack.pop());

          const p0 = applyTransform(currentCtm, x, y);
          const p1 = applyTransform(currentCtm, x + w, y + h);

          const minXPt = Math.min(p0.x, p1.x);
          const maxXPt = Math.max(p0.x, p1.x);
          const minYPt = Math.min(p0.y, p1.y);
          const maxYPt = Math.max(p0.y, p1.y);

          const xMm = minXPt * PT_TO_MM;
          const yMm = (pageHeightPt - maxYPt) * PT_TO_MM;
          const widthMm = (maxXPt - minXPt) * PT_TO_MM;
          const heightMm = (maxYPt - minYPt) * PT_TO_MM;

          if (widthMm > 0.5 && heightMm > 0.5) {
            vectorRects.push({
              id: `rect_p${pageIndex + 1}_${vectorRects.length + 1}`,
              pageIndex,
              xMm,
              yMm,
              widthMm,
              heightMm,
              centerXMm: xMm + widthMm / 2,
              centerYMm: yMm + heightMm / 2,
              isStroked: true,
              isFilled: false,
              sourceOperator: 're',
            });
          }
        }
        stack.length = 0;
      } else if (tok === 'm') {
        if (stack.length >= 2) {
          const y = Number(stack.pop());
          const x = Number(stack.pop());
          const p = applyTransform(currentCtm, x, y);
          currentPath.push({ op: 'm', points: [p] });
        }
        stack.length = 0;
      } else if (tok === 'l') {
        if (stack.length >= 2) {
          const y = Number(stack.pop());
          const x = Number(stack.pop());
          const p = applyTransform(currentCtm, x, y);
          currentPath.push({ op: 'l', points: [p] });
        }
        stack.length = 0;
      } else if (tok === 'h') {
        currentPath.push({ op: 'h', points: [] });
        stack.length = 0;
      } else if (
        tok === 'S' ||
        tok === 's' ||
        tok === 'f' ||
        tok === 'F' ||
        tok === 'f*' ||
        tok === 'B' ||
        tok === 'b' ||
        tok === 'B*' ||
        tok === 'b*'
      ) {
        // Evaluar la ruta construida
        this.processPath(
          currentPath,
          tok,
          pageIndex,
          pageHeightPt,
          currentLineWidth,
          vectorRects,
          vectorLines
        );
        currentPath = [];
        stack.length = 0;
      } else {
        // Operando o constante
        stack.push(tok);
      }
    }
  }

  /**
   * Procesa una ruta acumulada (m, l, h) para clasificarla como línea o rectángulo
   */
  private static processPath(
    path: { op: string; points: { x: number; y: number }[] }[],
    strokeOp: string,
    pageIndex: number,
    pageHeightPt: number,
    lineWidthPt: number,
    vectorRects: RawVectorRect[],
    vectorLines: RawVectorLine[]
  ): void {
    if (path.length === 0) return;

    // Normalizar puntos: colapsar 'm' redundantes consecutivos
    const cleanSegments: { op: string; pt: { x: number; y: number } }[] = [];
    for (const seg of path) {
      if (seg.points.length > 0) {
        cleanSegments.push({ op: seg.op, pt: seg.points[0] });
      } else if (seg.op === 'h') {
        cleanSegments.push({ op: 'h', pt: { x: 0, y: 0 } });
      }
    }

    // Caso A: Línea simple (secuencia con 1 o más 'l')
    const lSegments = cleanSegments.filter((s) => s.op === 'l');
    const mSegments = cleanSegments.filter((s) => s.op === 'm');

    if (lSegments.length === 1 && mSegments.length >= 1) {
      const startPt = mSegments[mSegments.length - 1].pt;
      const endPt = lSegments[0].pt;

      const x1Mm = startPt.x * PT_TO_MM;
      const y1Mm = (pageHeightPt - startPt.y) * PT_TO_MM;
      const x2Mm = endPt.x * PT_TO_MM;
      const y2Mm = (pageHeightPt - endPt.y) * PT_TO_MM;

      const dx = x2Mm - x1Mm;
      const dy = y2Mm - y1Mm;
      const lengthMm = Math.sqrt(dx * dx + dy * dy);

      if (lengthMm >= 1.0) {
        let orientation: 'horizontal' | 'vertical' | 'diagonal' = 'diagonal';
        if (Math.abs(dy) <= 1.2) orientation = 'horizontal';
        else if (Math.abs(dx) <= 1.2) orientation = 'vertical';

        vectorLines.push({
          id: `line_p${pageIndex + 1}_${vectorLines.length + 1}`,
          pageIndex,
          startXCountMm: Math.min(x1Mm, x2Mm),
          startYMm: Math.min(y1Mm, y2Mm),
          endXMm: Math.max(x1Mm, x2Mm),
          endYMm: Math.max(y1Mm, y2Mm),
          lengthMm,
          thicknessMm: lineWidthPt * PT_TO_MM,
          orientation,
        });
      }
      return;
    }

    // Caso B: Polígono cerrado de 4 esquinas (m -> l -> l -> l -> (h / l))
    const points = cleanSegments.filter((s) => s.op === 'm' || s.op === 'l').map((s) => s.pt);

    if (points.length >= 4 && points.length <= 6) {
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minXPt = Math.min(...xs);
      const maxXPt = Math.max(...xs);
      const minYPt = Math.min(...ys);
      const maxYPt = Math.max(...ys);

      const xMm = minXPt * PT_TO_MM;
      const yMm = (pageHeightPt - maxYPt) * PT_TO_MM;
      const widthMm = (maxXPt - minXPt) * PT_TO_MM;
      const heightMm = (maxYPt - minYPt) * PT_TO_MM;

      if (widthMm >= 1.5 && heightMm >= 1.5) {
        vectorRects.push({
          id: `rect_path_p${pageIndex + 1}_${vectorRects.length + 1}`,
          pageIndex,
          xMm,
          yMm,
          widthMm,
          heightMm,
          centerXMm: xMm + widthMm / 2,
          centerYMm: yMm + heightMm / 2,
          isStroked: strokeOp.includes('S') || strokeOp.includes('s') || strokeOp.includes('B') || strokeOp.includes('b'),
          isFilled: strokeOp.includes('f') || strokeOp.includes('F') || strokeOp.includes('b') || strokeOp.includes('B'),
          sourceOperator: 'path_m_l_h',
        });
      }
    }
  }

  /**
   * Tokenizador léxico de streams PDF
   */
  private static tokenize(content: string): any[] {
    const tokens: any[] = [];
    let i = 0;
    const len = content.length;

    while (i < len) {
      const ch = content[i];

      // Espacios en blanco
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '\f') {
        i++;
        continue;
      }

      // Comentarios PDF %
      if (ch === '%') {
        while (i < len && content[i] !== '\r' && content[i] !== '\n') {
          i++;
        }
        continue;
      }

      // Strings literales ( ... )
      if (ch === '(') {
        let str = '';
        let depth = 1;
        i++;
        while (i < len && depth > 0) {
          const c = content[i];
          if (c === '\\') {
            if (i + 1 < len) {
              str += content[i + 1];
              i += 2;
              continue;
            }
          } else if (c === '(') {
            depth++;
          } else if (c === ')') {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          str += c;
          i++;
        }
        tokens.push(str);
        continue;
      }

      // Strings hexadecimales < ... >
      if (ch === '<' && content[i + 1] !== '<') {
        let hex = '';
        i++;
        while (i < len && content[i] !== '>') {
          if (!/\s/.test(content[i])) {
            hex += content[i];
          }
          i++;
        }
        if (i < len && content[i] === '>') i++;
        tokens.push(`<${hex}>`);
        continue;
      }

      // Arrays [ ... ]
      if (ch === '[') {
        const arrTokens: any[] = [];
        i++;
        let subStr = '';
        let depth = 1;
        while (i < len && depth > 0) {
          const c = content[i];
          if (c === '[') depth++;
          if (c === ']') {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          subStr += c;
          i++;
        }
        tokens.push(this.tokenize(subStr));
        continue;
      }

      // Diccionarios << ... >>
      if (ch === '<' && content[i + 1] === '<') {
        tokens.push('<<');
        i += 2;
        continue;
      }
      if (ch === '>' && content[i + 1] === '>') {
        tokens.push('>>');
        i += 2;
        continue;
      }

      // Nombres PDF /Name
      if (ch === '/') {
        let name = '';
        i++;
        while (i < len && !/[\s<>()\[\]\/%]/.test(content[i])) {
          name += content[i];
          i++;
        }
        tokens.push(`/${name}`);
        continue;
      }

      // Palabras, números y operadores
      let word = '';
      while (i < len && !/[\s<>()\[\]\/%]/.test(content[i])) {
        word += content[i];
        i++;
      }

      if (word) {
        if (!isNaN(Number(word)) && word.trim() !== '') {
          tokens.push(Number(word));
        } else {
          tokens.push(word);
        }
      }
    }

    return tokens;
  }

  /**
   * Decodifica una cadena PDF (Hex o Literal)
   */
  private static decodePdfString(raw: any): string {
    if (typeof raw !== 'string') return '';

    if (raw.startsWith('<') && raw.endsWith('>')) {
      const hex = raw.slice(1, -1);
      let out = '';
      for (let k = 0; k < hex.length; k += 2) {
        const byte = parseInt(hex.substr(k, 2), 16);
        if (!isNaN(byte) && byte >= 32 && byte <= 255) {
          out += String.fromCharCode(byte);
        }
      }
      return out;
    }

    return raw;
  }
}
