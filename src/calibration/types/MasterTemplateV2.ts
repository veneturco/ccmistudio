/**
 * MasterTemplateV2.ts
 * Contrato universal TypeScript para la Arquitectura V2 del Sistema Documental Médico.
 * 
 * REGLA FUNDAMENTAL:
 * Los PDF maestros originales son documentos INMUTABLES usados como BACKGROUND ORIGINAL.
 * Los datos variables del paciente se agregan exclusivamente mediante una CAPA VECTORIAL DE OVERLAY.
 * 
 * Arquitectura:
 * PDF MAESTRO ORIGINAL -> MASTER TEMPLATE V2 -> CALIBRACIÓN FÍSICA -> DATA SEMÁNTICA -> OVERLAY VECTORIAL -> PDF FINAL
 */

export interface ElementGeometry {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface Typography {
  fontSizePt: number;
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
  lineHeightPt?: number;
}

export interface LockedRegion {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export type MasterStatus =
  | 'NEW'
  | 'ANALYZING'
  | 'REQUIRES_REVIEW'
  | 'DRAFT'
  | 'CALIBRATED'
  | 'VALIDATED'
  | 'PUBLISHED'
  | 'LOCKED'
  | 'REQUIRES_CALIBRATION'
  | 'INVALID'
  | 'ERROR';

export type PdfDocumentClassification =
  | 'PDF_VECTORIAL'
  | 'PDF_HIBRIDO'
  | 'PDF_ESCANEADO';

export interface BaseElement {
  id: string;
  pageIndex: number;
  geometry: ElementGeometry;
  label?: string;
  requiresCalibration?: boolean;
  confidence?: number;
  detectionType?: 'AUTO_VECTOR' | 'SPATIAL_PROXIMITY' | 'MANUAL' | 'CERTIFIED';
  status?: 'DETECTED' | 'CONFIRMED' | 'REVIEW_NEEDED';
}

export interface TextElement extends BaseElement {
  type: 'text';
  dataKey: string;
  typography: Typography;
  maxLines?: number;
  overflow?: 'clip' | 'shrink' | 'error';
  labelPrefix?: string;
}

export interface MultilineTextElement extends BaseElement {
  type: 'multilineText';
  dataKey: string;
  typography: Typography;
  maxLines: number;
  overflow: 'shrink' | 'clip' | 'error';
}

export interface CheckboxElement extends BaseElement {
  type: 'checkbox';
  dataKey: string;
  markStyle: 'X' | 'CHECK' | 'CIRCLE';
  fontSizePt?: number;
}

export interface StampElement extends BaseElement {
  type: 'stamp';
  assetKey: string;
  opacity?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  assetKey: string;
  opacity?: number;
}

export interface SignatureElement extends BaseElement {
  type: 'signature';
  assetKey: string;
  opacity?: number;
}

export interface LineElement extends BaseElement {
  type: 'line';
  thicknessPt?: number;
}

export type OverlayElement =
  | TextElement
  | MultilineTextElement
  | CheckboxElement
  | StampElement
  | ImageElement
  | SignatureElement
  | LineElement;

export interface PageTemplate {
  pageIndex: number;
  widthMm: number;
  heightMm: number;
  backgroundPdfPage: number;
  lockedRegions?: LockedRegion[];
  elements: OverlayElement[];
}

export interface MasterTemplateV2 {
  masterId: string;
  version: string;
  documentType: string;

  status: MasterStatus;

  source: {
    backgroundPdf: string;
    sourcePdfSha256?: string;
    checksum?: string;
    classification?: PdfDocumentClassification;
    pageCount?: number;
    dimensionsMm?: { width: number; height: number };
    dimensionsPt?: { width: number; height: number };
    ingestionDate?: string;
  };

  sourcePdfSha256?: string;
  masterJsonSha256?: string;
  schemaVersion?: string;
  analyzerVersion?: string;
  resolverVersion?: string;
  createdAt?: string;
  updatedAt?: string;
  validatedAt?: string;

  coordinateSystem: {
    unit: 'mm';
    origin: 'top-left';
    yAxis: 'down';
  };

  pages: PageTemplate[];

  lockedRegions?: LockedRegion[];

  metadata?: {
    name?: string;
    description?: string;
    globalConfidence?: number;
    validationScore?: number;
  };
}
