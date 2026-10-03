import { DocType } from '../types';
import { AllCalibrations, FieldCalibration } from '../types/calibration';
import { getAllStoredCalibrations } from './calibrationStorage';
import { EMBEDDED_TEMPLATES, EMBEDDED_PDF_TEMPLATES, TEMPLATE_NAMES, TEMPLATE_FILE_INFO } from '../assets/embeddedTemplates';

/**
 * Genera el paquete completo de auditoría y arquitectura en Markdown y JSON
 * para que el Desarrollador lo copie y pegue directamente en Gemini AI.
 */
export function generateGeminiAuditPackage(
  currentDoc?: DocType | string,
  allCalibrations?: AllCalibrations
): string {
  const calibrations = allCalibrations || getAllStoredCalibrations();
  const docs: (DocType | 'ORDEN_LAB_P2')[] = ['RECIPES', 'INFORME', 'ORDEN_LAB', 'ORDEN_LAB_P2', 'CONSTANCIA', 'HISTORIA'];

  let markdown = `# AUDITORÍA DE ARQUITECTURA Y CALIBRACIÓN DE PLANTILLAS MÉDICAS A4\n`;
  markdown += `**Plataforma**: Suite Médica CCMI - Dr. Samir Moucharrafie Naime\n`;
  markdown += `**Especialidad**: Neurocirugía & Cirugía de Columna Mínimamente Invasiva (UCBL Lyon 1)\n`;
  markdown += `**Generado**: ${new Date().toISOString()} (Hora Local: ${new Date().toLocaleString('es-VE')})\n`;
  markdown += `**Estándar de Lienzo**: Hoja A4 Oficial (794 × 1123 px a 96 DPI / 2480 × 3508 px a 300 DPI)\n\n`;

  markdown += `## 1. PLANTILLAS BASE OFICIALES PRECARGADAS (PDF & FONDO FIJO 300 DPI)\n\n`;
  docs.forEach((doc) => {
    const isSelected = doc === currentDoc;
    const info = TEMPLATE_FILE_INFO[doc] || { name: doc, pdfUrl: '', imgUrl: '', resolution: '300 DPI' };
    markdown += `### ${isSelected ? '👉 ' : ''}${info.name} [ID: \`${doc}\`]\n`;
    markdown += `- **Archivo de Fondo JPG (300 DPI)**: \`${info.imgUrl || EMBEDDED_TEMPLATES[doc as DocType]}\`\n`;
    markdown += `- **Archivo PDF Base**: \`${info.pdfUrl || EMBEDDED_PDF_TEMPLATES[doc as DocType]}\`\n`;
    const fieldsCount = Object.keys((calibrations as any)[doc] || {}).length;
    markdown += `- **Zonas Calibradas Activas**: ${fieldsCount} campos\n\n`;
  });

  markdown += `## 2. DICCIONARIO DE COORDENADAS Y FORMAS VECTORIALES POR DOCUMENTO\n\n`;

  docs.forEach((doc) => {
    const docFields = Object.values((calibrations as any)[doc] || {}) as FieldCalibration[];
    const docTitle = TEMPLATE_FILE_INFO[doc]?.name || doc;
    markdown += `### Documento: ${docTitle} (\`${doc}\`)\n`;
    if (docFields.length === 0) {
      markdown += `*No hay zonas adicionales registradas para este documento.*\n\n`;
      return;
    }
    markdown += `| ID Zona | Etiqueta | Top (px) | Left (px) | Ancho | Alto | Fuente / Estilo | Forma / Marca | Tipo |\n`;
    markdown += `|---------|----------|----------|-----------|-------|------|-----------------|---------------|------|\n`;

    docFields.forEach((f) => {
      const font = `${f.fontSize || 11}px ${f.fontWeight || 'normal'} (${f.textAlign || 'left'})`;
      const shape = `${f.shapeType || 'rect'} / ${f.markStyle || 'X'}${f.cornerPointer ? ` [Punta: ${f.cornerPointer}]` : ''}`;
      markdown += `| \`${f.id}\` | ${f.label} | ${f.top} | ${f.left} | ${f.width} | ${f.height} | ${font} | ${shape} | ${f.fieldType || 'text'} |\n`;
    });
    markdown += `\n`;
  });

  markdown += `## 3. JSON ESTRUCTURADO COMPLETO DE CONFIGURACIÓN (EXPORTABLE / IMPORTABLE)\n\n`;
  markdown += '```json\n';
  markdown += JSON.stringify(calibrations, null, 2);
  markdown += '\n```\n\n';

  markdown += `## 4. PROMPT DE AUDITORÍA PARA GEMINI AI:\n`;
  markdown += `> "Actúa como un Ingeniero Senior de Software y Especialista en Sistemas de Impresión Médica A4. Revisa este esquema de calibración milimétrica para el sistema del Dr. Samir Moucharrafie. Verifica si existen solapamientos entre las zonas de texto, si los tamaños de fuente son proporcionales a las dimensiones de las cajas, si las marcas de casillas X/Check y formas poligonales con punta están correctamente configuradas sobre el fondo escaneado de imprenta oficial, y dame sugerencias de optimización espacial."\n`;

  return markdown;
}

/**
 * Copia el reporte completo al portapapeles y devuelve una promesa booleana.
 */
export async function copyGeminiAuditToClipboard(
  currentDoc?: DocType | string,
  allCalibrations?: AllCalibrations
): Promise<boolean> {
  const content = generateGeminiAuditPackage(currentDoc, allCalibrations);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      return true;
    } else {
      // Fallback para entornos restrictivos
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
}
