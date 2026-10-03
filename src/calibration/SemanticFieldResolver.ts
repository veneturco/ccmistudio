/**
 * SemanticFieldResolver.ts
 * 
 * MOTOR SEMÁNTICO Y ASOCIACIÓN ESPACIAL PARA MASTERS MÉDICOS
 * ==========================================================
 * 
 * Vincula elementos físicos detectados con claves canónicas del sistema (DataKeys)
 * mediante algoritmos de proximidad geométrica, coincidencia difusa de etiquetas
 * y diccionarios clínicos estructurados.
 */

import {
  MasterTemplateV2,
  PageTemplate,
  OverlayElement,
  CheckboxElement,
  TextElement,
  MultilineTextElement,
  SignatureElement,
  StampElement,
  LockedRegion,
  ElementGeometry,
} from './types/MasterTemplateV2';
import { DocumentAnalysisReport } from './UniversalMasterAnalyzer';

export interface SemanticDictionaryEntry {
  canonicalKey: string;
  role: 'patient' | 'document' | 'clinical' | 'doctor' | 'lab' | 'neuroimaging';
  patterns: RegExp[];
  suggestedType: 'text' | 'multilineText' | 'checkbox' | 'signature' | 'stamp';
  defaultTypography?: {
    fontSizePt: number;
    fontWeight?: 'normal' | 'bold';
    align?: 'left' | 'center' | 'right';
    lineHeightPt?: number;
  };
  preferredHeightMm?: number;
}

export const CANONICAL_SEMANTIC_DICTIONARY: SemanticDictionaryEntry[] = [
  // PACIENTE
  {
    canonicalKey: 'patient.fullName',
    role: 'patient',
    patterns: [
      /\bnombre(s)?(\s*y\s*apellido(s)?)?\b/i,
      /\bpaciente(\s*:)?\b/i,
      /\bnombre\s*completo\b/i,
      /\bapellidos\s*y\s*nombres\b/i,
      /\bciudadano\(a\)\b/i,
    ],
    suggestedType: 'text',
    defaultTypography: { fontSizePt: 9.5, fontWeight: 'bold' },
  },
  {
    canonicalKey: 'patient.idNumber',
    role: 'patient',
    patterns: [
      /\bc\.?\s*i\.?\b/i,
      /\bc[eé]dula(\s*de\s*identidad)?\b/i,
      /\bdni\b/i,
      /\bidentificaci[oó]n\b/i,
      /\bdoc\.?\s*identidad\b/i,
    ],
    suggestedType: 'text',
    defaultTypography: { fontSizePt: 9.5, fontWeight: 'bold' },
  },
  {
    canonicalKey: 'patient.age',
    role: 'patient',
    patterns: [/\bedad\b/i, /\ba[ñn]os\b/i],
    suggestedType: 'text',
    defaultTypography: { fontSizePt: 9.5, fontWeight: 'bold' },
  },
  {
    canonicalKey: 'patient.gender',
    role: 'patient',
    patterns: [/\bsexo\b/i, /\bg[eé]nero\b/i, /\bm\s*\/\s*f\b/i],
    suggestedType: 'text',
    defaultTypography: { fontSizePt: 9.5, fontWeight: 'bold' },
  },
  {
    canonicalKey: 'patient.phone',
    role: 'patient',
    patterns: [/\btel[eé]fono\b/i, /\btlf\b/i, /\bcelular\b/i, /\bm[oó]vil\b/i],
    suggestedType: 'text',
    defaultTypography: { fontSizePt: 9, fontWeight: 'normal' },
  },
  {
    canonicalKey: 'patient.address',
    role: 'patient',
    patterns: [/\bdirecci[oó]n\b/i, /\bdomicilio\b/i, /\bhabitaci[oó]n\b/i, /\bresidencia\b/i],
    suggestedType: 'text',
    defaultTypography: { fontSizePt: 9, fontWeight: 'normal' },
  },

  // DOCUMENTO
  {
    canonicalKey: 'document.date',
    role: 'document',
    patterns: [/\bfecha\b/i, /\bfecha\s*de\s*emisi[oó]n\b/i, /\bfec\.\b/i],
    suggestedType: 'text',
    defaultTypography: { fontSizePt: 9.5, fontWeight: 'bold' },
  },

  // CLÍNICA
  {
    canonicalKey: 'clinical.diagnosisPrincipal',
    role: 'clinical',
    patterns: [
      /\bimpresi[oó]n\s*diagn[oó]stica\b/i,
      /\bdiagn[oó]stico(\s*principal)?\b/i,
      /\bdiagn[oó]stico\s*presuntivo\b/i,
      /\bdiagn[oó]stico\b/i,
      /\bdx\.?\b/i,
      /\bmotivo\s*de\s*consulta\b/i,
    ],
    suggestedType: 'multilineText',
    defaultTypography: { fontSizePt: 9, lineHeightPt: 12 },
    preferredHeightMm: 22,
  },
  {
    canonicalKey: 'clinical.treatment',
    role: 'clinical',
    patterns: [
      /\brp\.?\b/i,
      /\btratamiento(\s*m[eé]dico)?\b/i,
      /\bprescripci[oó]n\b/i,
      /\bindicaciones(\s*m[eé]dicas)?\b/i,
      /\br\s*\/\s*p\b/i,
      /\bplan(\s*de\s*tratamiento)?\b/i,
      /\bprocedimiento(\s*propuesto)?\b/i,
      /\bconducta\b/i,
    ],
    suggestedType: 'multilineText',
    defaultTypography: { fontSizePt: 9, lineHeightPt: 13 },
    preferredHeightMm: 35,
  },
  {
    canonicalKey: 'clinical.notes',
    role: 'clinical',
    patterns: [/\bobservaciones\b/i, /\bnotas\b/i, /\bcomentarios\b/i, /\bevoluci[oó]n\b/i],
    suggestedType: 'multilineText',
    defaultTypography: { fontSizePt: 8.5, lineHeightPt: 11 },
    preferredHeightMm: 20,
  },

  // FIRMA Y SELLO MÉDICO
  {
    canonicalKey: 'doctor.signature',
    role: 'doctor',
    patterns: [
      /\bfirma(\s*del\s*m[eé]dico)?\b/i,
      /\bfirma\s*autorizada\b/i,
      /\bm[eé]dico\s*tratante\b/i,
      /\bfirma\s*y\s*sello\b/i,
      /\bfirma\b/i,
    ],
    suggestedType: 'signature',
    preferredHeightMm: 16,
  },
  {
    canonicalKey: 'doctor.stamp',
    role: 'doctor',
    patterns: [
      /\bsello(\s*h[uú]medo)?\b/i,
      /\bsello\s*m[eé]dico\b/i,
      /\bm\.?\s*p\.?\s*p\.?\s*s\.?\b/i,
      /\bsello\b/i,
    ],
    suggestedType: 'stamp',
    preferredHeightMm: 16,
  },
];

export class SemanticFieldResolver {
  /**
   * Resuelve los elementos detectados y construye un MasterTemplateV2 canónico
   */
  public static buildMasterTemplate(
    analysis: DocumentAnalysisReport,
    masterId: string,
    documentType: string,
    templateName: string
  ): MasterTemplateV2 {
    const pages: PageTemplate[] = [];
    const usedDataKeys = new Set<string>();

    const analysisPages = analysis?.pages || [];
    analysisPages.forEach((pReport, pageIndex) => {
      const pageElements: OverlayElement[] = [];

      // 1. Resolver Checkboxes en esta página
      const pageCheckboxes = (analysis?.candidateCheckboxes || []).filter((c) => c.pageIndex === pageIndex);
      pageCheckboxes.forEach((cb, idx) => {
        // Encontrar texto más cercano a la derecha, o a la izquierda si no hay a la derecha
        let nearbyText = this.findNearestLabel(
          cb.geometry,
          (analysis?.textNodes || []).filter((t) => t.pageIndex === pageIndex),
          'right'
        );
        if (!nearbyText) {
          nearbyText = this.findNearestLabel(
            cb.geometry,
            (analysis?.textNodes || []).filter((t) => t.pageIndex === pageIndex),
            'left'
          );
        }

        const cleanLabel = nearbyText ? nearbyText.text.trim() : '';
        let dataKey = '';
        if (cleanLabel) {
          if (documentType.toLowerCase().includes('lab')) {
            dataKey = `labTests.${cleanLabel}`;
          } else {
            const normKey = cleanLabel
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_+|_+$/g, '');
            dataKey = `checkbox.${normKey}`;
          }
        } else {
          dataKey = `checkbox_p${pageIndex + 1}_${idx + 1}`;
        }

        if (usedDataKeys.has(dataKey)) {
          dataKey = `${dataKey}_${idx + 1}`;
        }
        usedDataKeys.add(dataKey);

        const cbElement: CheckboxElement = {
          id: `cb_${masterId}_p${pageIndex}_${idx + 1}`,
          pageIndex,
          type: 'checkbox',
          dataKey,
          markStyle: 'X',
          fontSizePt: 8,
          geometry: {
            xMm: Number(cb.geometry.xMm.toFixed(3)),
            yMm: Number(cb.geometry.yMm.toFixed(3)),
            widthMm: Number(cb.geometry.widthMm.toFixed(3)),
            heightMm: Number(cb.geometry.heightMm.toFixed(3)),
          },
          label: nearbyText ? nearbyText.text : undefined,
          confidence: cb.confidence,
          detectionType: 'AUTO_VECTOR',
          status: cb.confidence >= 0.90 ? 'CONFIRMED' : 'DETECTED',
        };

        pageElements.push(cbElement);
      });

      // 2. Resolver Campos de Texto / Multilínea / Firmas
      const pageFields = analysis.candidateFields.filter((f) => f.pageIndex === pageIndex);
      pageFields.forEach((cf, idx) => {
        // Buscar etiqueta a la izquierda, arriba (en cajas) o abajo (para firmas con etiqueta debajo)
        let nearbyLabel = this.findNearestLabel(
          cf.geometry,
          analysis.textNodes.filter((t) => t.pageIndex === pageIndex),
          'left'
        );

        if (!nearbyLabel && (cf.suggestedType === 'multilineText' || cf.geometry.heightMm >= 8)) {
          nearbyLabel = this.findNearestLabel(
            cf.geometry,
            analysis.textNodes.filter((t) => t.pageIndex === pageIndex),
            'above'
          );
        }

        if (!nearbyLabel) {
          nearbyLabel = this.findNearestLabel(
            cf.geometry,
            analysis.textNodes.filter((t) => t.pageIndex === pageIndex),
            'below'
          );
        }

        let dataKey = `field_p${pageIndex + 1}_${idx + 1}`;
        let matchedEntry: SemanticDictionaryEntry | undefined;

        if (nearbyLabel) {
          matchedEntry = this.matchSemanticDictionary(nearbyLabel.text);
          if (matchedEntry) {
            dataKey = matchedEntry.canonicalKey;
          }
        }

        if (usedDataKeys.has(dataKey)) {
          dataKey = `${dataKey}_${idx + 1}`;
        }
        usedDataKeys.add(dataKey);

        if (matchedEntry && matchedEntry.suggestedType === 'signature') {
          const sigEl: SignatureElement = {
            id: `sig_${masterId}_p${pageIndex}_${idx + 1}`,
            pageIndex,
            type: 'signature',
            assetKey: 'doctorSignature',
            geometry: cf.geometry,
            label: nearbyLabel?.text,
            confidence: cf.confidence,
            detectionType: 'SPATIAL_PROXIMITY',
            status: 'DETECTED',
          };
          pageElements.push(sigEl);
        } else if (matchedEntry && matchedEntry.suggestedType === 'stamp') {
          const stampEl: StampElement = {
            id: `stamp_${masterId}_p${pageIndex}_${idx + 1}`,
            pageIndex,
            type: 'stamp',
            assetKey: 'doctorStamp',
            geometry: cf.geometry,
            label: nearbyLabel?.text,
            confidence: cf.confidence,
            detectionType: 'SPATIAL_PROXIMITY',
            status: 'DETECTED',
          };
          pageElements.push(stampEl);
        } else if (cf.suggestedType === 'multilineText' || matchedEntry?.suggestedType === 'multilineText') {
          const multiEl: MultilineTextElement = {
            id: `multi_${masterId}_p${pageIndex}_${idx + 1}`,
            pageIndex,
            type: 'multilineText',
            dataKey,
            typography: matchedEntry?.defaultTypography || {
              fontSizePt: 9,
              lineHeightPt: 12,
              fontWeight: 'normal',
            },
            maxLines: 6,
            overflow: 'shrink',
            geometry: cf.geometry,
            label: nearbyLabel?.text,
            confidence: cf.confidence,
            detectionType: 'SPATIAL_PROXIMITY',
            status: 'DETECTED',
          };
          pageElements.push(multiEl);
        } else {
          const textEl: TextElement = {
            id: `text_${masterId}_p${pageIndex}_${idx + 1}`,
            pageIndex,
            type: 'text',
            dataKey,
            typography: matchedEntry?.defaultTypography || {
              fontSizePt: 9,
              fontWeight: 'normal',
            },
            geometry: cf.geometry,
            label: nearbyLabel?.text,
            confidence: cf.confidence,
            detectionType: 'SPATIAL_PROXIMITY',
            status: 'DETECTED',
          };
          pageElements.push(textEl);
        }
      });

      // 3. Auto-síntesis para etiquetas canónicas que no tenían línea ni caja vectorial dibujada
      const assignedKeys = new Set<string>();
      pageElements.forEach((el) => {
        if ((el as any).dataKey) assignedKeys.add((el as any).dataKey);
        if (el.type === 'signature') assignedKeys.add('doctor.signature');
        if (el.type === 'stamp') assignedKeys.add('doctor.stamp');
      });
      const pageTextNodes = analysis.textNodes.filter((t) => t.pageIndex === pageIndex);

      for (const node of pageTextNodes) {
        const matched = this.matchSemanticDictionary(node.text);
        if (!matched) continue;

        if (assignedKeys.has(matched.canonicalKey)) continue;

        let geom: ElementGeometry;
        if (matched.suggestedType === 'multilineText') {
          geom = {
            xMm: Number(node.geometry.xMm.toFixed(3)),
            yMm: Number((node.geometry.yMm + node.geometry.heightMm + 1.5).toFixed(3)),
            widthMm: Number(Math.max(60, pReport.widthMm - node.geometry.xMm - 18).toFixed(3)),
            heightMm: matched.preferredHeightMm || 22,
          };
        } else if (matched.suggestedType === 'signature' || matched.suggestedType === 'stamp') {
          const aboveY = node.geometry.yMm - (matched.preferredHeightMm || 16) - 1.5;
          geom = {
            xMm: Number(node.geometry.xMm.toFixed(3)),
            yMm: Number(Math.max(0, aboveY).toFixed(3)),
            widthMm: 35,
            heightMm: matched.preferredHeightMm || 16,
          };
        } else {
          const startX = node.geometry.xMm + node.geometry.widthMm + 2.0;
          geom = {
            xMm: Number(startX.toFixed(3)),
            yMm: Number((node.geometry.yMm - 0.5).toFixed(3)),
            widthMm: Number(Math.max(30, Math.min(80, pReport.widthMm - startX - 12)).toFixed(3)),
            heightMm: 5.5,
          };
        }

        assignedKeys.add(matched.canonicalKey);

        if (matched.suggestedType === 'signature') {
          pageElements.push({
            id: `sig_${masterId}_p${pageIndex}_synth_${pageElements.length + 1}`,
            pageIndex,
            type: 'signature',
            assetKey: 'doctorSignature',
            geometry: geom,
            label: node.text,
            confidence: 0.88,
            detectionType: 'SPATIAL_PROXIMITY',
            status: 'DETECTED',
          });
        } else if (matched.suggestedType === 'stamp') {
          pageElements.push({
            id: `stamp_${masterId}_p${pageIndex}_synth_${pageElements.length + 1}`,
            pageIndex,
            type: 'stamp',
            assetKey: 'doctorStamp',
            geometry: geom,
            label: node.text,
            confidence: 0.88,
            detectionType: 'SPATIAL_PROXIMITY',
            status: 'DETECTED',
          });
        } else if (matched.suggestedType === 'multilineText') {
          pageElements.push({
            id: `multi_${masterId}_p${pageIndex}_synth_${pageElements.length + 1}`,
            pageIndex,
            type: 'multilineText',
            dataKey: matched.canonicalKey,
            typography: matched.defaultTypography || { fontSizePt: 9, lineHeightPt: 12, fontWeight: 'normal' },
            maxLines: 6,
            overflow: 'shrink',
            geometry: geom,
            label: node.text,
            confidence: 0.88,
            detectionType: 'SPATIAL_PROXIMITY',
            status: 'DETECTED',
          });
        } else {
          pageElements.push({
            id: `text_${masterId}_p${pageIndex}_synth_${pageElements.length + 1}`,
            pageIndex,
            type: 'text',
            dataKey: matched.canonicalKey,
            typography: matched.defaultTypography || { fontSizePt: 9, fontWeight: 'normal' },
            geometry: geom,
            label: node.text,
            confidence: 0.88,
            detectionType: 'SPATIAL_PROXIMITY',
            status: 'DETECTED',
          });
        }
      }

      pages.push({
        pageIndex,
        widthMm: Number(pReport.widthMm.toFixed(3)),
        heightMm: Number(pReport.heightMm.toFixed(3)),
        backgroundPdfPage: pageIndex,
        lockedRegions: analysis.lockedRegionsDetected.filter((lr) => lr.id.includes(`page_${pageIndex + 1}`)),
        elements: pageElements,
      });
    });

    // Clasificación inicial del Master
    const requiresReview =
      analysis.classification === 'PDF_ESCANEADO' ||
      analysis.summary.globalConfidence < 0.85 ||
      pages.some((p) => p.elements.length === 0);

    return {
      masterId,
      version: '1.0',
      documentType,
      status: requiresReview ? 'REQUIRES_REVIEW' : 'CALIBRATED',
      source: {
        backgroundPdf: `${masterId}.pdf`,
        checksum: analysis.sha256,
        classification: analysis.classification,
        pageCount: analysis.pageCount,
        dimensionsMm: {
          width: pages[0]?.widthMm || 153.5,
          height: pages[0]?.heightMm || 215.8,
        },
        dimensionsPt: {
          width: analysis?.pages?.[0]?.widthPt || 435.118,
          height: analysis?.pages?.[0]?.heightPt || 611.716,
        },
        ingestionDate: new Date().toISOString(),
      },
      coordinateSystem: {
        unit: 'mm',
        origin: 'top-left',
        yAxis: 'down',
      },
      pages,
      lockedRegions: analysis.lockedRegionsDetected,
      metadata: {
        name: templateName,
        description: `Master generado automáticamente para ${templateName}`,
        globalConfidence: analysis.summary.globalConfidence,
      },
    };
  }

  /**
   * Busca la etiqueta de texto más próxima geométricamente
   */
  private static findNearestLabel(
    targetGeom: ElementGeometry,
    textNodes: { text: string; geometry: ElementGeometry }[],
    direction: 'left' | 'right' | 'above' | 'below'
  ): { text: string; geometry: ElementGeometry } | undefined {
    let bestMatch: { text: string; geometry: ElementGeometry } | undefined;
    let minDistance = Infinity;

    for (const node of textNodes) {
      let isEligible = false;
      let dist = Infinity;

      if (direction === 'right') {
        // La etiqueta está a la derecha de la casilla (mismo renglón Y ± 3.5mm)
        const yDelta = Math.abs(node.geometry.yMm - targetGeom.yMm);
        const xDelta = node.geometry.xMm - (targetGeom.xMm + targetGeom.widthMm);
        if (yDelta <= 3.5 && xDelta >= -2.0 && xDelta <= 60.0) {
          isEligible = true;
          dist = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
        }
      } else if (direction === 'left') {
        // La etiqueta está a la izquierda del campo (mismo renglón Y ± 3.5mm)
        const yDelta = Math.abs(node.geometry.yMm - targetGeom.yMm);
        const xDelta = targetGeom.xMm - (node.geometry.xMm + node.geometry.widthMm);
        if (yDelta <= 4.0 && xDelta >= -2.0 && xDelta <= 65.0) {
          isEligible = true;
          dist = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
        }
      } else if (direction === 'above') {
        // La etiqueta está encima de la caja (hasta 16mm arriba)
        const yDelta = targetGeom.yMm - (node.geometry.yMm + node.geometry.heightMm);
        const xOverlap =
          node.geometry.xMm <= targetGeom.xMm + targetGeom.widthMm &&
          node.geometry.xMm + node.geometry.widthMm >= targetGeom.xMm - 10;
        if (yDelta >= -2.0 && yDelta <= 16.0 && xOverlap) {
          isEligible = true;
          dist = Math.max(0, yDelta);
        }
      } else if (direction === 'below') {
        // La etiqueta está debajo de la línea o caja (hasta 14mm abajo, e.g. "Firma del Médico")
        const yDelta = node.geometry.yMm - (targetGeom.yMm + targetGeom.heightMm);
        const xOverlap =
          node.geometry.xMm <= targetGeom.xMm + targetGeom.widthMm &&
          node.geometry.xMm + node.geometry.widthMm >= targetGeom.xMm - 10;
        if (yDelta >= -1.0 && yDelta <= 14.0 && xOverlap) {
          isEligible = true;
          dist = Math.max(0, yDelta);
        }
      }

      if (isEligible && dist < minDistance) {
        minDistance = dist;
        bestMatch = node;
      }
    }

    return bestMatch;
  }

  /**
   * Coincidencia semántica basada en diccionario médico
   */
  private static matchSemanticDictionary(text: string): SemanticDictionaryEntry | undefined {
    const clean = text.trim();
    for (const entry of CANONICAL_SEMANTIC_DICTIONARY) {
      for (const pattern of entry.patterns) {
        if (pattern.test(clean)) {
          return entry;
        }
      }
    }
    return undefined;
  }
}
