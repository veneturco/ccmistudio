/**
 * src/calibration/index.ts
 * Barril universal de exportación de la Arquitectura V2 de Calibración y Renderizado Vectorial.
 */

export * from './types';
export { CalibrationEngine } from './CalibrationEngine';
export {
  CalibrationEngineV2,
  type PointMm as PointMmV2,
  type RectMm as RectMmV2,
} from './CalibrationEngineV2';
export * from './MasterRegistryV2';
export * from './VectorOverlayEngineV2';
export {
  SemanticDataMapperV2,
  type ClinicalWorkspaceContext as SemanticClinicalWorkspaceContext,
} from './SemanticDataMapperV2';
export * from './DataResolver';
export * from './OverlayRenderer';
export * from './TemplateRegistry';
export * from './CalibrationStorageV2';
export * from './CalibrationValidator';
export * from './PDFMasterSizeValidator';
export * from './TestCalibrationRunner';
export * from './CanonicalDocumentGeneratorV2';
export * from './PDFContentStreamReader';
export * from './UniversalMasterAnalyzer';
export * from './SemanticFieldResolver';
export * from '../utils/PDFDocumentPipelineV2';
