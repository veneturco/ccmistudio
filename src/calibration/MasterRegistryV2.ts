/**
 * MasterRegistryV2.ts
 * 
 * Registro canónico y oficial de los 5 Master Templates V2.
 * Convierte e indexa los esquemas maestros físicos (mm) al contrato universal MasterTemplateV2.
 * 
 * REGLAS FUNDAMENTALES:
 * - BACKGROUND ORIGINAL INMUTABLE (PDF oficial)
 * - COORDINADAS EN MILÍMETROS (origen: top-left, yAxis: down)
 * - NINGÚN DATO CLÍNICO NI COORDENADA INVENTADA
 */

import { MasterTemplateV2, PageTemplate, OverlayElement, LockedRegion } from './types/MasterTemplateV2';
export type { MasterTemplateV2, PageTemplate, OverlayElement, LockedRegion };

// Cargar maestros base JSON
import recipeMasterJson from './masters/recipe.master.json';
import constanciaMasterJson from './masters/constancia.master.json';
import informeMasterJson from './masters/informe.master.json';
import historiaMasterJson from './masters/historia.master.json';
import labMasterJson from './masters/lab.master.json';

/**
 * 1. RECIPE MASTER TEMPLATE V2 (Doble Talón Farmacia / Paciente)
 */
export const RECIPE_MASTER_V2: MasterTemplateV2 = {
  masterId: 'RECIPE-001',
  version: '2.0',
  documentType: 'recipe',
  status: 'LOCKED',
  source: {
    backgroundPdf: '/templates/recipe_base.pdf',
    sourcePdfSha256: '6fb2dcf33ebdb18d9271b8ece15c442462520557dea12f739776d299e190b7da',
  },
  sourcePdfSha256: '6fb2dcf33ebdb18d9271b8ece15c442462520557dea12f739776d299e190b7da',
  coordinateSystem: {
    unit: 'mm',
    origin: 'top-left',
    yAxis: 'down',
  },
  lockedRegions: recipeMasterJson.lockedRegions as LockedRegion[],
  pages: [
    {
      pageIndex: 0,
      widthMm: 210,
      heightMm: 297,
      backgroundPdfPage: 1,
      lockedRegions: recipeMasterJson.lockedRegions as LockedRegion[],
      elements: [
        // --- TALÓN IZQUIERDO (FARMACIA) ---
        {
          type: 'text',
          id: 'left_patient_name',
          pageIndex: 0,
          dataKey: 'patient.fullName',
          geometry: { xMm: 25.0, yMm: 52.0, widthMm: 75.0, heightMm: 5.5 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'left' },
          maxLines: 1,
          overflow: 'shrink',
        },
        {
          type: 'text',
          id: 'left_patient_id',
          pageIndex: 0,
          dataKey: 'patient.idNumber',
          geometry: { xMm: 15.0, yMm: 60.5, widthMm: 32.0, heightMm: 5.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'left' },
          maxLines: 1,
        },
        {
          type: 'text',
          id: 'left_patient_age',
          pageIndex: 0,
          dataKey: 'patient.age',
          geometry: { xMm: 51.0, yMm: 60.5, widthMm: 18.0, heightMm: 5.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'center' },
          maxLines: 1,
        },
        {
          type: 'text',
          id: 'left_date',
          pageIndex: 0,
          dataKey: 'document.date',
          geometry: { xMm: 74.0, yMm: 60.5, widthMm: 25.0, heightMm: 5.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'center' },
          maxLines: 1,
        },
        {
          type: 'multilineText',
          id: 'left_rx_body',
          pageIndex: 0,
          dataKey: 'recipe.pharmacy',
          geometry: { xMm: 10.0, yMm: 78.0, widthMm: 89.0, heightMm: 165.0 },
          typography: { fontSizePt: 10.0, lineHeightPt: 15.0, align: 'left' },
          maxLines: 25,
          overflow: 'shrink',
        },
        {
          type: 'stamp',
          id: 'left_doctor_stamp',
          pageIndex: 0,
          assetKey: 'doctor_stamp_signature',
          geometry: { xMm: 58.0, yMm: 248.0, widthMm: 38.0, heightMm: 22.0 },
          opacity: 0.90,
        },

        // --- TALÓN DERECHO (INDICACIONES PACIENTE) ---
        {
          type: 'text',
          id: 'right_patient_name',
          pageIndex: 0,
          dataKey: 'patient.fullName',
          geometry: { xMm: 129.0, yMm: 52.0, widthMm: 75.0, heightMm: 5.5 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'left' },
          maxLines: 1,
          overflow: 'shrink',
        },
        {
          type: 'text',
          id: 'right_patient_id',
          pageIndex: 0,
          dataKey: 'patient.idNumber',
          geometry: { xMm: 119.0, yMm: 60.5, widthMm: 32.0, heightMm: 5.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'left' },
          maxLines: 1,
        },
        {
          type: 'text',
          id: 'right_patient_age',
          pageIndex: 0,
          dataKey: 'patient.age',
          geometry: { xMm: 155.0, yMm: 60.5, widthMm: 18.0, heightMm: 5.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'center' },
          maxLines: 1,
        },
        {
          type: 'text',
          id: 'right_date',
          pageIndex: 0,
          dataKey: 'document.date',
          geometry: { xMm: 178.0, yMm: 60.5, widthMm: 25.0, heightMm: 5.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'center' },
          maxLines: 1,
        },
        {
          type: 'multilineText',
          id: 'right_indications_body',
          pageIndex: 0,
          dataKey: 'recipe.indications',
          geometry: { xMm: 114.0, yMm: 78.0, widthMm: 89.0, heightMm: 165.0 },
          typography: { fontSizePt: 10.0, lineHeightPt: 15.0, align: 'left' },
          maxLines: 25,
          overflow: 'shrink',
        },
        {
          type: 'stamp',
          id: 'right_doctor_stamp',
          pageIndex: 0,
          assetKey: 'doctor_stamp_signature',
          geometry: { xMm: 162.0, yMm: 248.0, widthMm: 38.0, heightMm: 22.0 },
          opacity: 0.90,
        },
      ],
    },
  ],
  metadata: {
    name: 'Récipe Médico Oficial Doble Talón (Samir)',
    description: 'Récipe institucional A4 dividido en talón de farmacia y talón de indicaciones para el paciente.',
  },
};

/**
 * 2. CONSTANCIA MÉDICA MASTER TEMPLATE V2
 */
export const CONSTANCIA_MASTER_V2: MasterTemplateV2 = {
  masterId: (constanciaMasterJson as any).masterId || 'CERTIFICATE-001',
  version: (constanciaMasterJson as any).version || '2.0',
  documentType: 'certificate',
  status: 'CALIBRATED',
  source: {
    backgroundPdf: (constanciaMasterJson as any).backgroundPdf || '/templates/constancia_base.pdf',
    sourcePdfSha256: '80400e390c64b95e2ecd67e74de17dd4bb0906706cfd9c23abdc29164589bbe7',
  },
  sourcePdfSha256: '80400e390c64b95e2ecd67e74de17dd4bb0906706cfd9c23abdc29164589bbe7',
  coordinateSystem: {
    unit: 'mm',
    origin: 'top-left',
    yAxis: 'down',
  },
  lockedRegions: (constanciaMasterJson as any).lockedRegions || [],
  pages: Array.isArray((constanciaMasterJson as any).pages)
    ? (constanciaMasterJson as any).pages.map((page: any) => ({
        pageIndex: page.pageIndex,
        widthMm: page.widthMm || (constanciaMasterJson as any).pageSize?.widthMm || 215.8,
        heightMm: page.heightMm || (constanciaMasterJson as any).pageSize?.heightMm || 139.7,
        backgroundPdfPage: page.pageIndex,
        lockedRegions: page.lockedRegions || [],
        elements: (page.elements || []).map((el: any) => ({
          type: (el.heightMm && el.heightMm > 10) || el.maxLines || el.lineHeightPt ? 'multilineText' : (el.type || 'text'),
          id: el.id,
          label: el.label || el.id,
          pageIndex: page.pageIndex,
          dataKey: el.dataKey,
          geometry: el.geometry || {
            xMm: el.xMm ?? 0,
            yMm: el.yMm ?? 0,
            widthMm: el.widthMm ?? 10,
            heightMm: el.heightMm ?? 6,
          },
          typography: el.typography || (el.fontSizePt ? {
            fontSizePt: el.fontSizePt,
            fontWeight: el.fontWeight || 'normal',
            align: el.align || 'left',
            lineHeightPt: el.lineHeightPt,
          } : undefined),
          maxLines: el.maxLines,
          overflow: el.overflow,
          markStyle: el.markStyle || 'X',
          fontSizePt: el.fontSizePt,
          requiresCalibration: el.requiresCalibration || false,
        })),
      }))
    : [],
  metadata: {
    name: 'Constancia Médica Oficial (Samir)',
    description: 'Certificado de asistencia médica y reposo institucional Media Carta Horizontal.',
  },
};

/**
 * 3. INFORME MÉDICO MASTER TEMPLATE V2
 */
export const INFORME_MASTER_V2: MasterTemplateV2 = {
  masterId: 'INFORME-001',
  version: '2.0',
  documentType: 'report',
  status: 'LOCKED',
  source: {
    backgroundPdf: '/templates/informe_base.pdf',
    sourcePdfSha256: 'e184f64cbaf54a5ae006bbfeaf1db5de5cd24895ae693b59020b427dff396754',
  },
  sourcePdfSha256: 'e184f64cbaf54a5ae006bbfeaf1db5de5cd24895ae693b59020b427dff396754',
  coordinateSystem: {
    unit: 'mm',
    origin: 'top-left',
    yAxis: 'down',
  },
  lockedRegions: informeMasterJson.lockedRegions as LockedRegion[],
  pages: [
    {
      pageIndex: 0,
      widthMm: 210,
      heightMm: 297,
      backgroundPdfPage: 0,
      lockedRegions: informeMasterJson.lockedRegions as LockedRegion[],
      elements: [
        {
          type: 'text',
          id: 'inf_patient_name',
          pageIndex: 0,
          dataKey: 'patient.fullName',
          geometry: { xMm: 65.5, yMm: 38.0, widthMm: 116.0, heightMm: 6.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'left' },
          maxLines: 1,
          overflow: 'shrink',
        },
        {
          type: 'text',
          id: 'inf_patient_id',
          pageIndex: 0,
          dataKey: 'patient.idNumber',
          geometry: { xMm: 46.0, yMm: 47.0, widthMm: 40.0, heightMm: 6.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'left' },
          maxLines: 1,
        },
        {
          type: 'text',
          id: 'inf_patient_age',
          pageIndex: 0,
          dataKey: 'patient.age',
          geometry: { xMm: 105.0, yMm: 47.0, widthMm: 25.0, heightMm: 6.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'left' },
          maxLines: 1,
        },
        {
          type: 'text',
          id: 'inf_date',
          pageIndex: 0,
          dataKey: 'document.date',
          geometry: { xMm: 140.5, yMm: 47.0, widthMm: 35.0, heightMm: 6.0 },
          typography: { fontSizePt: 9.5, fontWeight: 'bold', align: 'left' },
          maxLines: 1,
        },
        {
          type: 'multilineText',
          id: 'inf_diagnosis',
          pageIndex: 0,
          dataKey: 'clinical.diagnosisPrincipal',
          geometry: { xMm: 18.0, yMm: 58.0, widthMm: 175.0, heightMm: 7.0 },
          typography: { fontSizePt: 10.0, fontWeight: 'bold', align: 'left' },
          maxLines: 2,
          overflow: 'shrink',
        },
        {
          type: 'multilineText',
          id: 'inf_content',
          pageIndex: 0,
          dataKey: 'clinical.clinicalReport',
          geometry: { xMm: 18.0, yMm: 66.0, widthMm: 175.0, heightMm: 165.0 },
          typography: { fontSizePt: 9.5, lineHeightPt: 14.5, align: 'left' },
          maxLines: 35,
          overflow: 'shrink',
        },
        {
          type: 'stamp',
          id: 'inf_stamp',
          pageIndex: 0,
          assetKey: 'doctor_stamp_signature',
          geometry: { xMm: 85.0, yMm: 225.0, widthMm: 45.0, heightMm: 25.0 },
          opacity: 0.95,
        },
      ],
    },
  ],
  metadata: {
    name: 'Informe Médico Neuroquirúrgico Oficial (Samir)',
    description: 'Informe clínico formal institucional A4.',
  },
};

/**
 * 4. HISTORIA MÉDICA MASTER TEMPLATE V2
 */
export const HISTORIA_MASTER_V2: MasterTemplateV2 = {
  masterId: (historiaMasterJson as any).masterId || 'HISTORY-001',
  version: (historiaMasterJson as any).version || '2.0',
  documentType: 'history',
  status: 'CALIBRATED',
  source: {
    backgroundPdf: (historiaMasterJson as any).backgroundPdf || '/templates/historia_base.pdf',
    sourcePdfSha256: '25055bd9783cfd6e4474608c4bb4784f4c8fdd02ff7689f5852753f48f1fed7a',
  },
  sourcePdfSha256: '25055bd9783cfd6e4474608c4bb4784f4c8fdd02ff7689f5852753f48f1fed7a',
  coordinateSystem: {
    unit: 'mm',
    origin: 'top-left',
    yAxis: 'down',
  },
  lockedRegions: (historiaMasterJson as any).lockedRegions || [],
  pages: Array.isArray((historiaMasterJson as any).pages)
    ? (historiaMasterJson as any).pages.map((page: any) => ({
        pageIndex: page.pageIndex,
        widthMm: page.widthMm || (historiaMasterJson as any).pageSize?.widthMm || 210,
        heightMm: page.heightMm || (historiaMasterJson as any).pageSize?.heightMm || 297,
        backgroundPdfPage: page.pageIndex,
        lockedRegions: page.lockedRegions || [],
        elements: (page.elements || []).map((el: any) => ({
          type: (el.heightMm && el.heightMm > 10) || el.maxLines || el.lineHeightPt ? 'multilineText' : (el.type || 'text'),
          id: el.id,
          label: el.label || el.id,
          pageIndex: page.pageIndex,
          dataKey: el.dataKey,
          geometry: el.geometry || {
            xMm: el.xMm ?? 0,
            yMm: el.yMm ?? 0,
            widthMm: el.widthMm ?? 10,
            heightMm: el.heightMm ?? 6,
          },
          typography: el.typography || (el.fontSizePt ? {
            fontSizePt: el.fontSizePt,
            fontWeight: el.fontWeight || 'normal',
            align: el.align || 'left',
            lineHeightPt: el.lineHeightPt,
          } : undefined),
          maxLines: el.maxLines,
          overflow: el.overflow,
          markStyle: el.markStyle || 'X',
          fontSizePt: el.fontSizePt,
          requiresCalibration: el.requiresCalibration || false,
        })),
      }))
    : [],
  metadata: {
    name: 'Historia Médica Oficial (Samir)',
    description: 'Expediente clínico integral institucional A4.',
  },
};

/**
 * 5. ORDEN DE LABORATORIO Y NEUROIMAGEN MASTER TEMPLATE V2 (Multi-página: 2 páginas)
 * Dimensiones: 210 mm x 297 mm (A4)
 * Calibración exhaustiva V4.0 con mapeo canónico de elementos y checkboxes
 */
export const LAB_ORDER_MASTER_V2: MasterTemplateV2 = {
  masterId: (labMasterJson as any).masterId || 'ORDEN_LAB-001',
  version: (labMasterJson as any).version || '9.0',
  documentType: 'lab_order',
  status: 'CALIBRATED',
  source: {
    backgroundPdf: (labMasterJson as any).backgroundPdf || '/templates/orden_lab_base.pdf',
    sourcePdfSha256: 'f680cb425545ff65e9d064f69a67be776405671477aef09e4d4675070e3d2758',
    dimensionsMm: {
      width: (labMasterJson as any).pageSize?.widthMm || 153.5,
      height: (labMasterJson as any).pageSize?.heightMm || 215.8,
    }
  },
  sourcePdfSha256: 'f680cb425545ff65e9d064f69a67be776405671477aef09e4d4675070e3d2758',
  coordinateSystem: {
    unit: 'mm',
    origin: 'top-left',
    yAxis: 'down',
  },
  lockedRegions: (labMasterJson as any).lockedRegions || [
    { id: 'p1_header', xMm: 0, yMm: 0, widthMm: 153.5, heightMm: 35.0 },
    { id: 'p1_footer', xMm: 0, yMm: 200.0, widthMm: 153.5, heightMm: 15.0 },
  ],
  pages: Array.isArray(labMasterJson.pages)
    ? (labMasterJson.pages as any[]).map((page: any) => ({
        pageIndex: page.pageIndex,
        widthMm: page.widthMm || (labMasterJson as any).pageSize?.widthMm || 153.5,
        heightMm: page.heightMm || (labMasterJson as any).pageSize?.heightMm || 215.8,
        backgroundPdfPage: page.pageIndex,
        lockedRegions: page.lockedRegions || [],
        elements: (page.elements || []).map((el: any) => ({
          type: el.type || 'text',
          id: el.id,
          label: el.label || el.id,
          pageIndex: page.pageIndex,
          dataKey: el.dataKey,
          assetKey: el.assetKey || (el.type === 'stamp' ? 'doctor_stamp_signature' : undefined),
          opacity: el.opacity,
          geometry: el.geometry || {
            xMm: el.xMm ?? 0,
            yMm: el.yMm ?? 0,
            widthMm: el.widthMm ?? 4,
            heightMm: el.heightMm ?? 4,
          },
          typography: el.typography || (el.fontSizePt ? {
            fontSizePt: el.fontSizePt,
            fontWeight: el.fontWeight || (el.type === 'checkbox' ? 'bold' : 'normal'),
            align: el.align || 'left',
            lineHeightPt: el.lineHeightPt,
          } : undefined),
          maxLines: el.maxLines,
          overflow: el.overflow,
          markStyle: el.markStyle || 'X',
          fontSizePt: el.fontSizePt,
          requiresCalibration: el.requiresCalibration || false,
        })),
      }))
    : [],
  metadata: {
    name: 'Orden de Laboratorio y Neuroimagen V9.0 (Samir)',
    description: 'Solicitud médica de 2 páginas con calibración física milimétrica verificada.',
  },
};

/**
 * Registro Universal de Templates V2 indexado por tipo canónico o masterId
 */
export const MASTER_REGISTRY_V2: Record<string, MasterTemplateV2> = {
  recipe: RECIPE_MASTER_V2,
  recipes: RECIPE_MASTER_V2,
  'recipes-001': RECIPE_MASTER_V2,
  'recipe-001': RECIPE_MASTER_V2,
  certificate: CONSTANCIA_MASTER_V2,
  constancia: CONSTANCIA_MASTER_V2,
  'constancia-001': CONSTANCIA_MASTER_V2,
  'certificate-001': CONSTANCIA_MASTER_V2,
  report: INFORME_MASTER_V2,
  informe: INFORME_MASTER_V2,
  'informe-001': INFORME_MASTER_V2,
  'report-001': INFORME_MASTER_V2,
  history: HISTORIA_MASTER_V2,
  historia: HISTORIA_MASTER_V2,
  'historia-001': HISTORIA_MASTER_V2,
  'history-001': HISTORIA_MASTER_V2,
  lab_order: LAB_ORDER_MASTER_V2,
  orden_lab: LAB_ORDER_MASTER_V2,
  lab: LAB_ORDER_MASTER_V2,
  'lab-001': LAB_ORDER_MASTER_V2,
  'lab_order-001': LAB_ORDER_MASTER_V2,
};

export const CALIBRATOR_STORAGE_KEY = 'calibrator_elements_map_v10';

/**
 * Restablece las calibraciones guardadas en localStorage a los valores de fábrica
 */
export function resetSavedCalibrations(docType?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (!docType) {
      localStorage.removeItem(CALIBRATOR_STORAGE_KEY);
      localStorage.removeItem('calibrator_elements_map_v9');
    } else {
      const raw = localStorage.getItem(CALIBRATOR_STORAGE_KEY) || localStorage.getItem('calibrator_elements_map_v9');
      if (raw) {
        const map = JSON.parse(raw);
        delete map[docType];
        delete map[docType.toLowerCase()];
        delete map[docType.toUpperCase()];
        localStorage.setItem(CALIBRATOR_STORAGE_KEY, JSON.stringify(map));
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('medical_template_calibrated', { detail: { docType: docType || 'all' } }));
    }
  } catch (e) {
    console.warn('Error resetting saved calibrations', e);
  }
}

/**
 * Guarda una matriz completa de calibración en localStorage y la sincroniza a Firestore en tiempo real
 */
export function saveCalibrationsMap(map: any, docType?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const rawStr = typeof map === 'string' ? map : JSON.stringify(map);
    if (!rawStr || rawStr === '{}' || rawStr === 'null') {
      console.warn('[MasterRegistryV2] Anti-Empty Guard: Se rechaza guardar mapa de calibraciones vacío.');
      return;
    }
    const parsed = typeof map === 'string' ? JSON.parse(map) : map;
    if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
      console.warn('[MasterRegistryV2] Anti-Empty Guard: Objeto de calibración sin documentos.');
      return;
    }

    // Validar que ningún elemento tenga dimensiones <= 0
    for (const [docKey, docVal] of Object.entries(parsed)) {
      const elements = (docVal as any)?.elements || docVal;
      if (Array.isArray(elements)) {
        for (const el of elements) {
          const w = el.geometry?.widthMm ?? el.width;
          const h = el.geometry?.heightMm ?? el.height;
          if ((typeof w === 'number' && w <= 0) || (typeof h === 'number' && h <= 0)) {
            console.error(`[MasterRegistryV2] Anti-Empty Guard: Elemento '${el.id || 'campo'}' en '${docKey}' tiene dimensión <= 0. Se aborta guardado.`);
            return;
          }
        }
      }
    }

    localStorage.setItem(CALIBRATOR_STORAGE_KEY, rawStr);

    // Notificación multi-pestaña inmediata vía BroadcastChannel
    try {
      const bc = new BroadcastChannel('ccmi_calibration_sync_channel');
      bc.postMessage({ type: 'CALIBRATION_UPDATED', docType: docType || 'all', timestamp: Date.now() });
      bc.close();
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('medical_template_calibrated', { detail: { docType: docType || 'all' } }));
    }
    // Sincronización asíncrona hacia Firestore en la nube
    import('../cloud/FirestoreStationerySync').then(({ FirestoreStationerySync }) => {
      FirestoreStationerySync.pushLocalCalibrationToCloud().catch(err => {
        console.warn('[MasterRegistryV2] Error sincronizando calibración a Firestore:', err);
      });
    }).catch(() => {});
  } catch (e) {
    console.warn('Error saving calibrations map', e);
  }
}

/**
 * Hidrata y aplica sobre la marcha cualquier calibración guardada por el usuario en localStorage
 */
export function hydrateTemplateWithSavedCalibrations(template: MasterTemplateV2): MasterTemplateV2 {
  if (!template || !Array.isArray(template.pages)) return template;
  if (typeof window === 'undefined' || !window.localStorage) return template;
  try {
    const raw = localStorage.getItem(CALIBRATOR_STORAGE_KEY) || localStorage.getItem('calibrator_elements_map_v9');
    if (!raw) return template;
    const map = JSON.parse(raw);
    if (!map || typeof map !== 'object') return template;

    const docTypeLower = (template.documentType || '').toLowerCase().trim();
    const masterIdLower = (template.masterId || '').toLowerCase().trim();

    // Buscar la clave correspondiente en map con soporte total para alias
    let docPages: Record<number | string, any[]> | null = null;
    
    for (const k of Object.keys(map)) {
      const kLower = k.toLowerCase().trim();
      
      const isRecipeMatch = (kLower === 'recipes' || kLower === 'recipe' || kLower === 'recipe-001' || kLower === 'recipes-001') && 
                            (docTypeLower === 'recipe' || masterIdLower.includes('recipe'));
      const isLabMatch = (kLower === 'orden_lab' || kLower === 'lab_order' || kLower === 'lab-001' || kLower === 'lab_order-001' || kLower === 'lab') && 
                         (docTypeLower === 'lab_order' || docTypeLower === 'orden_lab' || masterIdLower.includes('lab'));
      const isReportMatch = (kLower === 'informe' || kLower === 'report' || kLower === 'informe-001' || kLower === 'report-001') && 
                            (docTypeLower === 'report' || docTypeLower === 'informe' || masterIdLower.includes('informe') || masterIdLower.includes('report'));
      const isCertMatch = (kLower === 'constancia' || kLower === 'certificate' || kLower === 'constancia-001' || kLower === 'certificate-001') && 
                          (docTypeLower === 'certificate' || docTypeLower === 'constancia' || masterIdLower.includes('constancia') || masterIdLower.includes('certificate'));
      const isHistoryMatch = (kLower === 'historia' || kLower === 'history' || kLower === 'historia-001' || kLower === 'history-001') && 
                             (docTypeLower === 'history' || docTypeLower === 'historia' || masterIdLower.includes('historia') || masterIdLower.includes('history'));

      if (isRecipeMatch || isLabMatch || isReportMatch || isCertMatch || isHistoryMatch || kLower === docTypeLower || kLower === masterIdLower) {
        if (map[k] && typeof map[k] === 'object') {
          docPages = map[k];
          break;
        }
      }
    }

    if (!docPages) return template;

    const updatedPages = (template.pages || []).map((page, pIdx) => {
      const savedPageEls = docPages![pIdx] ?? docPages![String(pIdx)];
      if (!savedPageEls || !Array.isArray(savedPageEls) || savedPageEls.length === 0) {
        return page;
      }

      const elements = savedPageEls.map((el: any) => {
        let xMm = Number(Number(el.xMm ?? (el.geometry?.xMm ?? 0)).toFixed(2));
        let yMm = Number(Number(el.yMm ?? (el.geometry?.yMm ?? 0)).toFixed(2));
        let widthMm = Number(Number(el.widthMm ?? (el.geometry?.widthMm ?? 10)).toFixed(2));
        let heightMm = Number(Number(el.heightMm ?? (el.geometry?.heightMm ?? 4)).toFixed(2));

        // Auto-corrección forense de desfase para Informe Médico si fue guardado con el margen artificial antiguo
        if (docTypeLower === 'report' || docTypeLower === 'informe' || masterIdLower.includes('informe') || masterIdLower.includes('report')) {
          if ((el.id === 'inf_patient_name' || el.dataKey === 'patient.fullName') && yMm > 50) {
            yMm = 38.0;
            xMm = 65.5;
            widthMm = 116.0;
          } else if ((el.id === 'inf_patient_id' || el.dataKey === 'patient.idNumber') && yMm > 60) {
            yMm = 47.0;
            xMm = 46.0;
            widthMm = 40.0;
          } else if ((el.id === 'inf_patient_age' || el.dataKey === 'patient.age') && yMm > 60) {
            yMm = 47.0;
            xMm = 105.0;
            widthMm = 25.0;
          } else if ((el.id === 'inf_date' || el.dataKey === 'document.date') && yMm > 60) {
            yMm = 47.0;
            xMm = 140.5;
            widthMm = 35.0;
          } else if ((el.id === 'inf_diagnosis' || el.dataKey === 'clinical.diagnosisPrincipal') && yMm > 70) {
            yMm = 58.0;
            xMm = 18.0;
            widthMm = 175.0;
          } else if ((el.id === 'inf_content' || el.dataKey === 'clinical.clinicalReport' || el.dataKey === 'clinical.bodyText') && yMm > 75) {
            yMm = 66.0;
            xMm = 18.0;
            widthMm = 175.0;
          }
        }

        const geometry = { xMm, yMm, widthMm, heightMm };
        const fontSizePt = Number(el.fontSizePt ?? (el.typography?.fontSizePt ?? 9.5));
        const fontWeight = el.fontWeight ?? (el.typography?.fontWeight ?? 'bold');
        const align = el.align ?? (el.typography?.align ?? 'left');
        const dataKey = el.dataKey || (el as any).assetKey || el.id;

        if (el.type === 'checkbox') {
          return {
            id: el.id,
            pageIndex: pIdx,
            dataKey,
            type: 'checkbox' as const,
            geometry,
            xMm,
            yMm,
            widthMm,
            heightMm,
            markStyle: el.markStyle || 'X',
            fontSizePt,
            fontWeight,
          };
        }
        if (el.type === 'multilineText') {
          const lineHeightPt = Number(el.lineHeightPt ?? (el.typography?.lineHeightPt ?? Number((fontSizePt * 1.3).toFixed(1))));
          return {
            id: el.id,
            pageIndex: pIdx,
            dataKey,
            type: 'multilineText' as const,
            geometry,
            typography: {
              fontSizePt,
              fontWeight,
              align,
              lineHeightPt,
            },
            xMm,
            yMm,
            widthMm,
            heightMm,
            fontSizePt,
            lineHeightPt,
            fontWeight,
            align,
            maxLines: el.maxLines || 4,
            overflow: el.overflow || 'shrink',
          };
        }
        return {
          id: el.id,
          pageIndex: pIdx,
          dataKey,
          type: (el.type || 'text') as any,
          geometry,
          typography: {
            fontSizePt,
            fontWeight,
            align,
          },
          xMm,
          yMm,
          widthMm,
          heightMm,
          fontSizePt,
          fontWeight,
          align,
          overflow: el.overflow || 'shrink',
        };
      });

      return {
        ...page,
        elements,
      };
    });

    return {
      ...template,
      pages: updatedPages,
    };
  } catch (err) {
    console.warn('Error hydrating template with saved calibrations', err);
    return template;
  }
}

/**
 * Registra o actualiza en memoria un MasterTemplateV2 (p. ej. al cargar un PDF maestro original)
 */
export function setMasterTemplateV2(key: string, template: MasterTemplateV2): void {
  const normalizedKey = key.toLowerCase().trim();
  MASTER_REGISTRY_V2[normalizedKey] = template;
  if (template.documentType) {
    MASTER_REGISTRY_V2[template.documentType.toLowerCase().trim()] = template;
  }
  if (template.masterId) {
    MASTER_REGISTRY_V2[template.masterId.toLowerCase().trim()] = template;
  }
}

/**
 * Obtener MasterTemplateV2 oficial por tipo de documento o ID
 */
export function getMasterTemplateV2(key: string): MasterTemplateV2 | null {
  const normalized = key.toLowerCase().trim();
  const rawTemplate = MASTER_REGISTRY_V2[normalized] || null;
  if (!rawTemplate) return null;
  return hydrateTemplateWithSavedCalibrations(rawTemplate);
}

/**
 * Obtiene la lista completa de Masters disponibles en el registro
 */
export function getAllMasterTemplatesV2(): MasterTemplateV2[] {
  const uniqueMasters = new Map<string, MasterTemplateV2>();
  Object.values(MASTER_REGISTRY_V2).forEach(m => {
    uniqueMasters.set(m.masterId, hydrateTemplateWithSavedCalibrations(m));
  });
  return Array.from(uniqueMasters.values());
}

