import React, { useMemo, useState, useEffect } from 'react';
import { OfficialMedicalStamp } from './OfficialMedicalStamp';
import { Layers, Activity, RotateCcw, AlertCircle, Bug, Eye } from 'lucide-react';
import { PatientData } from '../types';
import { CalibrationEngineV2 } from '../calibration/CalibrationEngineV2';
import { TemplateRegistry } from '../calibration/TemplateRegistry';
import { LAB_ORDER_MASTER_V2 } from '../calibration/MasterRegistryV2';
import { CheckboxElement, TextElement, MultilineTextElement, StampElement } from '../calibration/types/MasterTemplateV2';

export interface OfficialLabOrderSheetProps {
  patient: PatientData;
  onUpdatePatient: (field: string, val: string) => void;
  labTests: Record<string, boolean>;
  onToggleLabTest: (testName: string) => void;
  neuroimagingTests: Record<string, boolean>;
  onToggleNeuroimagingTest: (testName: string) => void;
  neuroimagingDetails?: Record<string, string>;
  onUpdateNeuroimagingDetail?: (study: string, detail: string) => void;
  presumptiveDx: string;
  onChangePresumptiveDx: (val: string) => void;
  showStamp: boolean;
  labViewMode: 'p1' | 'p2' | 'both';
  onChangeViewMode: (mode: 'p1' | 'p2' | 'both') => void;
  activeBgUrl?: string;
  customBgs?: Record<string, string>;
  getCalib?: any;
  isCalibrating?: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (id: string) => void;
  onUpdateCalibration?: (calib: any) => void;
  showZoneGuides?: boolean;
  getHighlightClass?: (fieldId: string) => string;
  otherExams?: string;
  onUpdateOtherExams?: (val: string) => void;
}

export type OfficialLabOrderTwoPageSheetProps = OfficialLabOrderSheetProps;

export const OfficialLabOrderTwoPageSheet: React.FC<OfficialLabOrderSheetProps> = ({
  patient,
  onUpdatePatient,
  labTests,
  onToggleLabTest,
  neuroimagingTests,
  onToggleNeuroimagingTest,
  neuroimagingDetails = {},
  onUpdateNeuroimagingDetail,
  presumptiveDx,
  onChangePresumptiveDx,
  showStamp,
  labViewMode = 'both',
  onChangeViewMode,
  activeBgUrl,
  customBgs = {},
  isCalibrating = false,
  otherExams = '',
  onUpdateOtherExams,
}) => {
  // 1. OBTENER LA AUTORIDAD CANÓNICA V2 DESDE TemplateRegistry (O FALLBACK CANÓNICO)
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [calibVersion, setCalibVersion] = useState(0);

  useEffect(() => {
    const handleCalibUpdated = () => {
      setCalibVersion(v => v + 1);
    };
    window.addEventListener('medical_template_calibrated', handleCalibUpdated);
    return () => {
      window.removeEventListener('medical_template_calibrated', handleCalibUpdated);
    };
  }, []);

  const masterTemplate = useMemo(() => {
    return TemplateRegistry.get('lab_order') || LAB_ORDER_MASTER_V2;
  }, [calibVersion]);

  const page1Config = masterTemplate?.pages?.[0] || LAB_ORDER_MASTER_V2?.pages?.[0];
  const page2Config = masterTemplate?.pages?.[1] || LAB_ORDER_MASTER_V2?.pages?.[1];

  // Escala de pantalla: DPI 96 exacto (1 mm = 3.7795 px)
  // Media Carta (153.5 mm x 215.8 mm) -> ~580 px x 816 px
  const DPI = 96;
  const toPx = (mm: number) => CalibrationEngineV2.mmToPx(mm, DPI);

  // Backgrounds oficiales de las páginas
  const bgP1 = customBgs['ORDEN_LAB'] || activeBgUrl || '/templates/orden_lab_p1_bg.jpg';
  const bgP2 = customBgs['ORDEN_LAB_P2'] || '/templates/orden_lab_p2_bg.jpg';

  // Checkboxes de página 1 extraídos del Master V2
  const p1Checkboxes = useMemo(() => {
    return (page1Config?.elements || []).filter(
      (el): el is CheckboxElement => el.type === 'checkbox'
    );
  }, [page1Config]);

  // Checkboxes de página 2 extraídos del Master V2
  const p2Checkboxes = useMemo(() => {
    return (page2Config?.elements || []).filter(
      (el): el is CheckboxElement => el.type === 'checkbox'
    );
  }, [page2Config]);

  // Textos y sellos de página 1
  const p1TextElements = useMemo(() => {
    return (page1Config?.elements || []).filter(
      (el): el is TextElement => el.type === 'text'
    );
  }, [page1Config]);

  const p1Stamp = useMemo(() => {
    return (page1Config?.elements || []).find(
      (el): el is StampElement => el.type === 'stamp'
    );
  }, [page1Config]);

  // Textos, multilínea y sellos de página 2
  const p2TextElements = useMemo(() => {
    return (page2Config?.elements || []).filter(
      (el): el is TextElement => el.type === 'text'
    );
  }, [page2Config]);

  const p2Multiline = useMemo(() => {
    return (page2Config?.elements || []).find(
      (el): el is MultilineTextElement => el.type === 'multilineText'
    );
  }, [page2Config]);

  const p2Stamp = useMemo(() => {
    return (page2Config?.elements || []).find(
      (el): el is StampElement => el.type === 'stamp'
    );
  }, [page2Config]);

  // Estado de pruebas activas
  const activeCountP1 = Object.values(labTests).filter(Boolean).length;
  const activeCountP2 = Object.values(neuroimagingTests).filter(Boolean).length;

  // Normalización para resolver si un estudio de página 2 está seleccionado
  const getNeuroToggleKey = (el: CheckboxElement): string => {
    const raw = (el.dataKey || el.id || '')
      .replace(/^(neuroimaging\.|clinical\.checkbox\.|orden_p2\.|lab_p2_cb_)/i, '')
      .toLowerCase();
    const keyMap: Record<string, string> = {
      radiologia: 'RADIOLOGIA',
      rx: 'RADIOLOGIA',
      tac: 'TAC',
      tac_cerebral: 'TAC',
      tomografia: 'TAC',
      rmn: 'RMN',
      resonancia: 'RMN',
      eeg: 'EEG',
      electroencefalograma: 'EEG',
      emg: 'EMG',
      electromiografia: 'EMG',
      pess: 'PESS',
      potenciales: 'PESS',
      valoracion: 'VALORACION',
      otros: 'VALORACION',
    };
    return keyMap[raw] || el.label || raw.toUpperCase();
  };

  const isNeuroStudySelected = (el: CheckboxElement): boolean => {
    const toggleKey = getNeuroToggleKey(el).toUpperCase();
    const rawKey = (el.dataKey || el.id || '')
      .replace(/^(neuroimaging\.|clinical\.checkbox\.|orden_p2\.|lab_p2_cb_)/i, '')
      .toLowerCase();
    const label = (el.label || '').toLowerCase();

    for (const [testKey, isChecked] of Object.entries(neuroimagingTests)) {
      if (!isChecked) continue;
      const clean = testKey.toUpperCase();
      if (
        clean === toggleKey ||
        testKey.toLowerCase() === rawKey ||
        testKey.toLowerCase() === label ||
        label.includes(testKey.toLowerCase())
      ) {
        return true;
      }
    }
    return false;
  };

  // Obtener detalle anatómico del estudio
  const getNeuroDetail = (el: CheckboxElement): string => {
    const key = el.dataKey.replace(/^neuroimaging\./, '');
    const toggleKey = getNeuroToggleKey(el);
    return (
      neuroimagingDetails[toggleKey] ||
      neuroimagingDetails[key] ||
      neuroimagingDetails[el.id] ||
      ''
    );
  };

  // Aplicar perfil preoperatorio canónico
  const handleApplyPreop = () => {
    const preopTests = [
      'Hematología Completa',
      'Plaquetas',
      'Pt (Tiempo Protrombina)',
      'Ptt (Tiempo Parcial de Tromboplastina)',
      'Dosificación de Fibrinógeno',
      'Glicemia',
      'Urea',
      'Creatinina',
      'HIV',
      'VDRL',
      'Grupo Sanguíneo, Factor Rh (D)',
      'Examen General de Orina',
    ];
    preopTests.forEach((t) => {
      if (!labTests[t]) onToggleLabTest(t);
    });

    ['RMN', 'TAC', 'EMG'].forEach((s) => {
      if (!neuroimagingTests[s]) {
        onToggleNeuroimagingTest(s);
      }
    });
  };

  // Limpiar todos los exámenes
  const handleClearAll = () => {
    Object.keys(labTests).forEach((t) => {
      if (labTests[t]) onToggleLabTest(t);
    });
    p2Checkboxes.forEach((el) => {
      const toggleKey = getNeuroToggleKey(el);
      if (neuroimagingTests[toggleKey]) onToggleNeuroimagingTest(toggleKey);
    });
  };

  // ============================================================================
  // RENDER PÁGINA 1: ANALÍTICA SANGUÍNEA (Consumo estricto de Master V2)
  // ============================================================================
  const renderPage1 = () => {
    const widthPx = toPx(page1Config.widthMm);
    const heightPx = toPx(page1Config.heightMm);

    return (
      <div
        id="orden-lab-p1-v2"
        data-doc-page="1"
        className="relative bg-white shadow-xl overflow-hidden print:shadow-none print:m-0 border border-slate-200"
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          minWidth: `${widthPx}px`,
          minHeight: `${heightPx}px`,
          backgroundColor: '#ffffff',
          backgroundImage: `url("${bgP1}")`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          boxSizing: 'border-box',
          fontFamily: "'Liberation Sans', 'Arial', sans-serif",
        }}
      >

        {/* ELEMENTOS DE TEXTO DE PACIENTE (PÁGINA 1) */}
        {p1TextElements.map((el) => {
          const fieldMap: Record<string, keyof PatientData> = {
            'patient.fullName': 'fullName',
            'patient.idNumber': 'idNumber',
            'patient.age': 'age',
            'document.date': 'date',
          };
          const fieldKey = fieldMap[el.dataKey];
          const val = fieldKey ? String(patient[fieldKey] || '') : '';

          return (
            <input
              key={el.id}
              type="text"
              value={val}
              onChange={(e) => fieldKey && onUpdatePatient(fieldKey, e.target.value)}
              className="absolute bg-transparent text-[#143e72] font-bold outline-none border-none truncate"
              style={{
                left: `${toPx(el.geometry.xMm)}px`,
                top: `${toPx(el.geometry.yMm)}px`,
                width: `${toPx(el.geometry.widthMm)}px`,
                height: `${toPx(el.geometry.heightMm)}px`,
                fontSize: `${el.typography?.fontSizePt || 7.5}pt`,
                textAlign: (el.typography?.align || (el as any).align || 'left') as any,
              }}
              placeholder={el.label}
              title={el.label}
            />
          );
        })}

        {/* CHECKBOXES INDIVIDUALES DE LABORATORIO (PÁGINA 1): Consumidos uno a uno desde Master V2 */}
        {p1Checkboxes.map((el) => {
          const rawKey = el.dataKey.replace(/^labTests\./, '');
          const displayName = el.label || rawKey;
          const isChecked = Boolean(
            (labTests as any)[el.dataKey] ||
            labTests[rawKey] ||
            (el.label && labTests[el.label]) ||
            labTests[el.id]
          );
          const boxLeft = toPx(el.geometry.xMm);
          const boxTop = toPx(el.geometry.yMm);
          const boxW = toPx(el.geometry.widthMm);
          const boxH = toPx(el.geometry.heightMm);

          return (
            <div
              key={el.id}
              onClick={() => onToggleLabTest(rawKey)}
              className="absolute flex items-center justify-center cursor-pointer select-none group"
              style={{
                left: `${boxLeft}px`,
                top: `${boxTop}px`,
                width: `${boxW}px`,
                height: `${boxH}px`,
                zIndex: isDebugMode ? 30 : 10,
              }}
              title={`${displayName} | ID: ${el.id} | dataKey: ${el.dataKey} | x:${el.geometry.xMm}mm, y:${el.geometry.yMm}mm (${el.geometry.widthMm}x${el.geometry.heightMm}mm)`}
            >
              {/* Recuadro interactivo calibrado - fondo transparente para que el documento maestro original sea visible */}
              <div
                className={`w-full h-full flex items-center justify-center rounded-[1px] transition-colors relative ${
                  isDebugMode
                    ? 'border-2 border-amber-600 bg-amber-100/70'
                    : 'bg-transparent hover:bg-blue-500/20'
                }`}
              >
                {isChecked && (
                  <span
                    className="text-[#143e72] font-black leading-none select-none text-center transform -translate-y-[0.5px]"
                    style={{ fontSize: `${el.fontSizePt || 8}pt` }}
                  >
                    ✕
                  </span>
                )}
                {/* Debug Badge */}
                {isDebugMode && (
                  <span className="absolute -top-3.5 left-0 bg-amber-800 text-white font-mono text-[7px] px-0.5 rounded leading-none whitespace-nowrap pointer-events-none shadow-xs">
                    {el.geometry.xMm},{el.geometry.yMm}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* RECUADRO DE OTROS EXÁMENES (PÁGINA 1): x:10.4mm, y:175.5mm, w:88mm, h:24mm según Master V2 */}
        <div
          className="absolute"
          style={{
            left: `${toPx(10.4)}px`,
            top: `${toPx(175.5)}px`,
            width: `${toPx(88)}px`,
            height: `${toPx(24)}px`,
            zIndex: 15,
          }}
        >
          <textarea
            value={otherExams || ''}
            onChange={(e) => onUpdateOtherExams && onUpdateOtherExams(e.target.value)}
            placeholder="Otros Exámenes (ej: Magnesio, Densitometría, etc.)..."
            className="w-full h-full bg-transparent text-[#143e72] font-semibold text-[7.5pt] leading-tight resize-none outline-none border border-dashed border-transparent hover:border-blue-400 focus:border-blue-600 rounded p-1"
          />
        </div>

        {/* SELLO MÉDICO OFICIAL (PÁGINA 1) */}
        {showStamp && p1Stamp && (
          <div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              left: `${toPx(p1Stamp.geometry.xMm)}px`,
              top: `${toPx(p1Stamp.geometry.yMm)}px`,
              width: `${toPx(p1Stamp.geometry.widthMm)}px`,
              height: `${toPx(p1Stamp.geometry.heightMm)}px`,
            }}
          >
            <OfficialMedicalStamp inkColor="navy" size="md" scale={0.70} />
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER PÁGINA 2: NEUROIMÁGENES Y ESTUDIOS ESPECIALES (Consumo estricto V2)
  // ============================================================================
  const renderPage2 = () => {
    const widthPx = toPx(page2Config.widthMm);
    const heightPx = toPx(page2Config.heightMm);

    return (
      <div
        id="orden-lab-p2-v2"
        data-doc-page="2"
        className="relative bg-white shadow-xl overflow-hidden print:shadow-none print:m-0 border border-slate-200"
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          minWidth: `${widthPx}px`,
          minHeight: `${heightPx}px`,
          backgroundColor: '#ffffff',
          backgroundImage: `url("${bgP2}")`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          boxSizing: 'border-box',
          fontFamily: "'Liberation Sans', 'Arial', sans-serif",
        }}
      >

        {/* ELEMENTOS DE TEXTO PÁGINA 2 */}
        {p2TextElements.map((el) => {
          return (
            <input
              key={el.id}
              type="text"
              value={patient.fullName || ''}
              onChange={(e) => onUpdatePatient('fullName', e.target.value)}
              className="absolute bg-transparent text-[#143e72] font-bold outline-none uppercase border-none truncate"
              style={{
                left: `${toPx(el.geometry.xMm)}px`,
                top: `${toPx(el.geometry.yMm)}px`,
                width: `${toPx(el.geometry.widthMm)}px`,
                height: `${toPx(el.geometry.heightMm)}px`,
                fontSize: `${el.typography?.fontSizePt || (el as any).fontSizePt || 9.5}pt`,
                textAlign: (el.typography?.align || (el as any).align || 'left') as any,
              }}
              placeholder="NOMBRE Y APELLIDO DEL PACIENTE"
            />
          );
        })}

        {/* IMPRESIÓN DIAGNÓSTICA MULTILÍNEA */}
        {p2Multiline && (
          <textarea
            value={presumptiveDx || ''}
            onChange={(e) => onChangePresumptiveDx(e.target.value)}
            placeholder="Escriba la impresión diagnóstica o justificación médica..."
            className="absolute bg-transparent text-[#143e72] font-medium p-1 outline-none resize-none border-none leading-relaxed"
            style={{
              left: `${toPx(p2Multiline.geometry.xMm)}px`,
              top: `${toPx(p2Multiline.geometry.yMm)}px`,
              width: `${toPx(p2Multiline.geometry.widthMm)}px`,
              height: `${toPx(p2Multiline.geometry.heightMm)}px`,
              fontSize: `${p2Multiline.typography?.fontSizePt || (p2Multiline as any).fontSizePt || 9.0}pt`,
              lineHeight: '1.4',
            }}
          />
        )}

        {/* CHECKBOXES DE ESTUDIOS ESPECIALES / NEUROIMÁGENES (PÁGINA 2) */}
        {p2Checkboxes.map((el) => {
          const isChecked = isNeuroStudySelected(el);
          const toggleKey = getNeuroToggleKey(el);
          const detail = getNeuroDetail(el);
          const boxLeft = toPx(el.geometry.xMm);
          const boxTop = toPx(el.geometry.yMm);
          const boxW = toPx(el.geometry.widthMm);
          const boxH = toPx(el.geometry.heightMm);

          return (
            <div key={el.id} className="relative">
              {/* Botón de recuadro interactivo */}
              <button
                type="button"
                onClick={() => onToggleNeuroimagingTest(toggleKey)}
                className={`absolute flex items-center justify-center cursor-pointer border-none outline-none z-10 rounded-xs transition-colors ${
                  isDebugMode
                    ? 'border-2 border-amber-600 bg-amber-100/70'
                    : 'bg-transparent hover:bg-blue-100/30'
                }`}
                style={{
                  left: `${boxLeft}px`,
                  top: `${boxTop}px`,
                  width: `${boxW}px`,
                  height: `${boxH}px`,
                }}
                title={`${el.label} | ID: ${el.id} | dataKey: ${el.dataKey} | x:${el.geometry.xMm}mm, y:${el.geometry.yMm}mm (${el.geometry.widthMm}x${el.geometry.heightMm}mm)${el.requiresCalibration ? ' [REQUIERE CALIBRACIÓN FÍSICA]' : ''}`}
              >
                {isChecked && (
                  <span
                    className="text-[#143e72] font-black leading-none select-none text-center"
                    style={{ fontSize: `${el.fontSizePt || 9}pt` }}
                  >
                    ✕
                  </span>
                )}
                {isDebugMode && (
                  <span className="absolute -top-3.5 left-0 bg-amber-800 text-white font-mono text-[7px] px-0.5 rounded leading-none whitespace-nowrap pointer-events-none shadow-xs">
                    {el.geometry.xMm},{el.geometry.yMm}
                  </span>
                )}
              </button>

              {/* Campo para especificar región anatómica/protocolo a la derecha */}
              <input
                type="text"
                value={detail}
                onChange={(e) =>
                  onUpdateNeuroimagingDetail && onUpdateNeuroimagingDetail(toggleKey, e.target.value)
                }
                placeholder="Especificar región o protocolo..."
                className="absolute bg-transparent text-[#143e72] font-medium text-[9px] px-1 outline-none border-none"
                style={{
                  left: `${boxLeft + toPx(62)}px`,
                  top: `${boxTop}px`,
                  width: `${toPx(70)}px`,
                  height: `${boxH}px`,
                }}
              />
            </div>
          );
        })}

        {/* SELLO MÉDICO OFICIAL (PÁGINA 2) */}
        {showStamp && p2Stamp && (
          <div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              left: `${toPx(p2Stamp.geometry.xMm)}px`,
              top: `${toPx(p2Stamp.geometry.yMm)}px`,
              width: `${toPx(p2Stamp.geometry.widthMm)}px`,
              height: `${toPx(p2Stamp.geometry.heightMm)}px`,
            }}
          >
            <OfficialMedicalStamp inkColor="navy" size="md" scale={0.70} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* BARRA DE HERRAMIENTAS V2: Control de Vistas y Presets */}
      <div className="w-full max-w-[620px] bg-white border border-[#143e72]/20 shadow-xs rounded-xl p-2.5 mb-4 print:hidden flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#143e72] uppercase tracking-wide">
            Vista:
          </span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeViewMode('both')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                labViewMode === 'both' ? 'bg-[#143e72] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5"/>
              Ambas ({activeCountP1 + activeCountP2})
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('p1')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                labViewMode === 'p1' ? 'bg-[#143e72] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pág 1: Lab ({activeCountP1})
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('p2')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                labViewMode === 'p2' ? 'bg-[#143e72] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pág 2: Neuro ({activeCountP2})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDebugMode(!isDebugMode)}
            className={`px-2 py-1 font-semibold text-xs rounded border transition-colors flex items-center gap-1 cursor-pointer ${
              isDebugMode
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Activar/desactivar inspector visual de coordenadas geométricas"
          >
            <Bug className="w-3 h-3" />
            Debug {isDebugMode ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={handleApplyPreop}
            className="px-2.5 py-1 bg-blue-50 text-[#143e72] font-semibold text-xs rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
          >
            <Activity className="w-3 h-3"/>
            Perfil Preoperatorio
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1 text-slate-500 hover:text-red-600 text-xs font-medium rounded hover:bg-red-50 flex items-center gap-1 cursor-pointer"
            title="Limpiar todas las selecciones"
          >
            <RotateCcw className="w-3 h-3"/>
            Limpiar
          </button>
        </div>
      </div>

      {/* AVISO DE CALIBRACIÓN CANÓNICA SI CORRESPONDE */}
      {masterTemplate.status === 'REQUIRES_CALIBRATION' && (
        <div className="w-full max-w-[620px] mb-3 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>
            <strong>Plantilla en Modo Calibración V2:</strong> Dimensiones físicas Media Carta (153.5 × 215.8 mm). La emisión oficial está vinculada al PDF maestro inmutable.
          </span>
        </div>
      )}

      {/* CONTENEDOR DE PÁGINAS FÍSICAS CANÓNICAS */}
      <div className="flex flex-col gap-6 items-center">
        {labViewMode === 'both' && (
          <>
            {renderPage1()}
            {renderPage2()}
          </>
        )}
        {labViewMode === 'p1' && (
          <>
            {renderPage1()}
            <div className="fixed left-[-9999px] top-0 pointer-events-none opacity-0 print:hidden">
              {renderPage2()}
            </div>
          </>
        )}
        {labViewMode === 'p2' && (
          <>
            {renderPage2()}
            <div className="fixed left-[-9999px] top-0 pointer-events-none opacity-0 print:hidden">
              {renderPage1()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
