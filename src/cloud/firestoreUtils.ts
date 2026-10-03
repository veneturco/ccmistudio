/**
 * CORTEX AXIS — CENTRO CLÍNICO MÉDICO INTEGRAL
 * FIRESTORE DATA SANITIZER UTILITIES
 * 
 * Limpia y normaliza recursivamente objetos y estructuras de datos antes de persistir
 * en Firestore para prevenir errores fatales por campos undefined, referencias circulares
 * o datos no serializables.
 */

/**
 * Recorre recursivamente un objeto o arreglo y elimina campos `undefined` o datos
 * no válidos para Firestore, reemplazándolos o normalizándolos con valores seguros.
 * 
 * @param data Estructura de datos del paciente o registro clínico
 * @returns Estructura completamente sanitizada y segura para Firestore
 */
export function sanitizePatientData(data: any): any {
  // Manejo de valores nulos o primitivos
  if (data === undefined) {
    return null;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Preservar fechas como strings ISO o Timestamps si aplican
  if (data instanceof Date) {
    return isNaN(data.getTime()) ? null : data.toISOString();
  }

  // Manejo de arreglos
  if (Array.isArray(data)) {
    return data
      .map((item) => sanitizePatientData(item))
      .filter((item) => item !== undefined);
  }

  // Manejo de objetos planos
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    // Omitir funciones, símbolos o propiedades undefined
    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
      continue;
    }

    // Omitir campos temporales o credenciales sensibles de bajo nivel si estuvieran presentes
    if (key.startsWith('__temp_') || key === 'clientSecret' || key === 'refreshToken') {
      continue;
    }

    const sanitizedValue = sanitizePatientData(value);
    if (sanitizedValue !== undefined) {
      cleanObj[key] = sanitizedValue;
    }
  }

  return cleanObj;
}

export default sanitizePatientData;
