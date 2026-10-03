/**
 * DataResolver.ts
 * 
 * RESOLVEDOR SEMÁNTICO CENTRALIZADO (ARQUITECTURA V2)
 * ===================================================
 * Resuelve claves semánticas (dataKey en notación de puntos) contra los datos reales
 * del paciente, de la consulta clínica y del documento.
 * 
 * REGLAS FUNDAMENTALES:
 * 1. dataKey -> valor real.
 * 2. Si falta un dato: NO inventar contenido clínico ni sustitutos ficticios.
 *    Devuelve string vacío o undefined según corresponda.
 * 3. Admite tanto diccionarios aplanados como estructuras anidadas.
 * 4. Soporta claves de laboratorio (lab.checkbox.* y neuroimaging.*) y récipe (rxBody, indicationsBody).
 */

import { PatientData, PatientInfo, StructuredClinicalData } from '../types';

export interface ClinicalWorkspaceContext {
  patient?: Partial<PatientData & PatientInfo>;
  clinical?: Partial<StructuredClinicalData> & Record<string, any>;
  documentDate?: string;
  doctorStampBase64?: string;
  signatureBase64?: string;
  notes?: string;
  recipeLeft?: string;
  recipeRight?: string;
  certificateText?: string;
  customData?: Record<string, any>;
}

export class DataResolver {
  /**
   * Genera el diccionario semántico integral a partir del contexto clínico
   */
  public static buildSemanticDictionary(ctx: ClinicalWorkspaceContext): Record<string, any> {
    const p = ctx.patient || {};
    const c = ctx.clinical || {};

    const fullName = (p.fullName || '').trim();
    const idNumber = ((p as any).idNumber || (p as any).nationalId || '').trim();
    const age = (p.age ? String(p.age) : '').trim();
    const phone = (p.phone || '').trim();
    const address = ((p as any).address || '').trim();
    const date = (ctx.documentDate || (p as any).date || new Date().toLocaleDateString('es-VE')).trim();

    // Mapeo de medicamentos para récipe
    let rxPharmacy = (ctx.recipeLeft || '').trim();
    let rxIndications = (ctx.recipeRight || '').trim();

    if (!rxPharmacy && Array.isArray(c.medications) && c.medications.length > 0) {
      rxPharmacy = c.medications
        .map((m, idx) => `${idx + 1}. ${m.drug} ${m.dose} - Dispensar: ${m.duration || 'Tratamiento completo'}`)
        .join('\n');
    }

    if (!rxIndications && Array.isArray(c.medications) && c.medications.length > 0) {
      rxIndications = c.medications
        .map((m, idx) => `${idx + 1}. ${m.drug}: Tomar ${m.dose} cada ${m.frequency} por ${m.duration}`)
        .join('\n');
    }

    const diagnosisPrincipal = (c.diagnosisPrincipal || (c as any).diagnostic || '').trim();
    const certificateNarrative = (ctx.certificateText || (c as any).certificateNarrative || (c as any).restCertificate || '').trim();
    const clinicalReport = ((c as any).clinicalReport || (c as any).reportText || c.summaryNote || '').trim();

    // Checkboxes de neuroimágenes
    const nTests = (c as any).neuroimagingTests || {};
    const neuroimaging: Record<string, boolean> = {
      rmn: Boolean((c as any).rmn || nTests.RMN || nTests.rmn || (Array.isArray(c.labTests) && c.labTests.some((t: string) => /resonancia|rmn|mri/i.test(t)))),
      tac: Boolean((c as any).tac || nTests.TAC || nTests.tac || (Array.isArray(c.labTests) && c.labTests.some((t: string) => /tac|tomograf/i.test(t)))),
      radiologia: Boolean((c as any).radiologia || nTests.RADIOLOGIA || nTests.radiologia || (Array.isArray(c.labTests) && c.labTests.some((t: string) => /rx|radiolog/i.test(t)))),
      eeg: Boolean((c as any).eeg || nTests.EEG || nTests.eeg || (Array.isArray(c.labTests) && c.labTests.some((t: string) => /eeg|electroencefal/i.test(t)))),
      emg: Boolean((c as any).emg || nTests.EMG || nTests.emg || (Array.isArray(c.labTests) && c.labTests.some((t: string) => /emg|electromiogr/i.test(t)))),
      pess: Boolean((c as any).pess || nTests.PESS || nTests.pess || (Array.isArray(c.labTests) && c.labTests.some((t: string) => /pess|potenciales/i.test(t)))),
      valoracion: Boolean((c as any).valoracion || nTests.VALORACION || nTests.valoracion || (Array.isArray(c.labTests) && c.labTests.some((t: string) => /valoraci/i.test(t)))),
    };

    // Checkboxes de laboratorio general
    const labCheckboxes: Record<string, boolean> = {};
    const rawLabTests: Record<string, boolean> = {};
    const unmappedLabTests: string[] = [];

    const testList: string[] = [];
    if (Array.isArray(c.labTests)) {
      for (const test of c.labTests) {
        if (typeof test === 'string' && test.trim()) testList.push(test.trim());
      }
    } else if (c.labTests && typeof c.labTests === 'object') {
      for (const [test, val] of Object.entries(c.labTests)) {
        if (Boolean(val) && test.trim()) testList.push(test.trim());
      }
    }

    if ((c as any).selectedLabCheckboxes && typeof (c as any).selectedLabCheckboxes === 'object') {
      for (const [k, v] of Object.entries((c as any).selectedLabCheckboxes)) {
        if (Boolean(v) && k.trim()) testList.push(k.trim());
      }
    }

    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').trim();

    const isDataKeyOrInternalKey = (str: string): boolean => {
      if (!str || typeof str !== 'string') return false;
      const s = str.trim();
      if (/\b(orden_p1|orden_p2|cb_|clinical\.|patient\.|document\.|recipe\.|certificate\.|labTests\.|lab_order)\b/i.test(s)) return true;
      if (s.includes('.')) return true;
      if (/^(rmn|tac|radiologia|radiología|rx|eeg|emg|pess|valoracion|valoración|resonancia|resonancia\s*magnetica|resonancia\s*magnética|tomografia|tomografía|radiografia|radiografía|rayos\s*x|electroencefalograma|electromiografia|electromiografía|potenciales\s*evocados|riesgo\s*quirurgico|riesgo\s*quirúrgico)$/i.test(s)) return true;
      if (/^(perfil\s*(preoperatorio|20|lipidico|lipídico|hepatico|hepático|tiroideo|renal)|laboratorio|laboratorios|tests|estudios)$/i.test(s)) return true;
      return false;
    };

    for (const test of testList) {
      if (isDataKeyOrInternalKey(test)) continue;
      const cleanKey = test.toLowerCase().replace(/[^a-z0-9]/g, '_');
      labCheckboxes[cleanKey] = true;
      rawLabTests[test] = true;
      const norm = normalize(test);
      let matched = false;

      if (/\b(sodio|potasio|cloro|electrolito|electrolitos|ionograma|na|k|cl)\b/.test(norm)) {
        rawLabTests['Electrolitos Séricos (Na, K, Cl)'] = true;
        labCheckboxes['electrolitos_sericos__na__k__cl_'] = true;
        labCheckboxes['electrolitos'] = true;
        labCheckboxes['clinical.cb.electrolitos'] = true;
        labCheckboxes['sodio'] = true;
        labCheckboxes['potasio'] = true;
        labCheckboxes['cloro'] = true;
        labCheckboxes['clinical.cb.sodio'] = true;
        labCheckboxes['clinical.cb.potasio'] = true;
        labCheckboxes['clinical.cb.cloro'] = true;
        matched = true;
      }
      if (/\b(calcio|fosforo|calcemia|ca|p)\b/.test(norm)) {
        rawLabTests['Calcio Sérico / Fósforo'] = true;
        labCheckboxes['calcio_serico___fosforo'] = true;
        matched = true;
      }
      if (/\b(transaminasas|tgo|tgp|ast|alt)\b/.test(norm)) {
        rawLabTests['Transaminasas (TGO / TGP)'] = true;
        rawLabTests['TGO / AST'] = true;
        rawLabTests['TGP / ALT'] = true;
        matched = true;
      }
      if (/\b(lipidico|lipidos|colesterol|trigliceridos)\b/.test(norm)) {
        rawLabTests['HDL / LDL Colesterol'] = true;
        rawLabTests['Colesterol Total'] = true;
        rawLabTests['Triglicéridos'] = true;
        matched = true;
      }
      if (/\b(tiroideo|tiroides|tsh|t3|t4)\b/.test(norm)) {
        rawLabTests['T3, T4 Libre y TSH'] = true;
        rawLabTests['TSH Ultrasensible'] = true;
        matched = true;
      }
      if (/\b(hematologia|hemograma|formula|leucocitos|hemoglobina|hematocrito)\b/.test(norm)) {
        rawLabTests['Hematología Completa'] = true;
        matched = true;
      }
      if (/\b(glicemia|glucosa|hba1c|insulina)\b/.test(norm)) {
        rawLabTests['Glicemia'] = true;
        matched = true;
      }
      if (/\b(urea|bun)\b/.test(norm)) {
        rawLabTests['Urea'] = true;
        matched = true;
      }
      if (/\b(creatinina)\b/.test(norm)) {
        rawLabTests['Creatinina'] = true;
        matched = true;
      }
      if (/\b(orina|urocultivo)\b/.test(norm)) {
        rawLabTests['Examen General de Orina'] = true;
        matched = true;
      }
      if (/\b(preoperatorio)\b/.test(norm)) {
        rawLabTests['Perfil Preoperatorio Completo'] = true;
        matched = true;
      }

      if (!matched) {
        unmappedLabTests.push(test);
      }
    }

    const existingOtherRaw = (c as any).otherExams || (c as any).otrosExamenes || '';
    const rawOtherList = Array.isArray(existingOtherRaw)
      ? existingOtherRaw
      : (typeof existingOtherRaw === 'string' ? existingOtherRaw.split(/[,;\n]+/) : []);
    const cleanOtherList = rawOtherList
      .map((s: string) => s.trim())
      .filter((s: string) => Boolean(s) && !isDataKeyOrInternalKey(s));
    const cleanUnmapped = unmappedLabTests.filter((s) => !isDataKeyOrInternalKey(s));

    const finalOtherExams = Array.from(new Set([...cleanOtherList, ...cleanUnmapped]));
    const combinedOtherExams = finalOtherExams.join(', ');

    return {
      patient: {
        fullName,
        idNumber,
        age: age ? (age.includes('año') ? age : `${age} años`) : '',
        ageRaw: age,
        phone,
        address,
        date,
      },
      clinical: {
        diagnosisPrincipal,
        diagnosis: diagnosisPrincipal,
        motivo: (c.chiefComplaint || (c as any).motivo || '').trim(),
        enfermedad: (c.presentIllness || (c as any).enfermedad || '').trim(),
        antecedentes: (c.personalHistory || (c as any).antecedentes || '').trim(),
        examen: (c.physicalExam || (c as any).examen || '').trim(),
        diagnostico: diagnosisPrincipal,
        reportText: clinicalReport,
        certificateNarrative,
        otherExams: combinedOtherExams,
        otrosExamenes: combinedOtherExams,
        cb: labCheckboxes,
        checkbox: {
          ...labCheckboxes,
          ...((c as any).checkbox || {}),
          ...((ctx as any).checkbox || {}),
        },
      },
      checkbox: {
        ...labCheckboxes,
        ...((c as any).checkbox || {}),
        ...((ctx as any).checkbox || {}),
      },
      recipe: {
        pharmacy: rxPharmacy,
        rxBody: rxPharmacy,
        indications: rxIndications,
        indicationsBody: rxIndications,
        date,
      },
      report: {
        body: clinicalReport,
        date,
      },
      certificate: {
        diagnosis: diagnosisPrincipal,
        narrative: certificateNarrative,
        date,
      },
      constancia: {
        attendedDate: (c as any).attendedDate || (ctx as any).attendedDate || date,
        restDaysWords: (c as any).restDaysWords || (c as any).diasReposoPalabras || ((c as any).restDays ? `${(c as any).restDays} DÍAS` : ''),
        restDays: (c as any).restDays || (c as any).diasReposo || '',
        restFrom: (c as any).restFrom || (c as any).reposoDesde || date,
        restTo: (c as any).restTo || (c as any).reposoHasta || '',
        idx: (c as any).constanciaIdx || (c as any).idx || diagnosisPrincipal || certificateNarrative,
        requestDay: (c as any).requestDay || String(new Date().getDate()),
        requestMonth: (c as any).requestMonth || 'enero',
        requestYear: (c as any).requestYear || String(new Date().getFullYear()),
      },
      clinicalHistory: {
        consultReason: (c.chiefComplaint || (c as any).consultReason || (c as any).motivo || '').trim(),
        currentIllness: (c.presentIllness || (c as any).currentIllness || (c as any).enfermedad || '').trim(),
        background: (c.personalHistory || (c as any).background || (c as any).antecedentes || '').trim(),
        neuroExam: (c.physicalExam || (c as any).neuroExam || (c as any).examen || '').trim(),
        diagnosis: (diagnosisPrincipal || (c as any).diagnosis || (c as any).diagnostico || '').trim(),
      },
      history: {
        clinical: {
          motivo: (c.chiefComplaint || (c as any).motivo || '').trim(),
          enfermedad: (c.presentIllness || (c as any).enfermedad || '').trim(),
          antecedentes: (c.personalHistory || (c as any).antecedentes || '').trim(),
          examen: (c.physicalExam || (c as any).examen || '').trim(),
          diagnostico: diagnosisPrincipal,
        },
      },
      lab: {
        checkbox: labCheckboxes,
      },
      labTests: rawLabTests,
      neuroimaging,
      document: {
        date,
        type: (ctx as any).documentType || 'medical_document',
      },
      doctor: {
        name: 'Dr. Samir Moucharrafie Naime',
        specialty: 'Especialista en Neurocirugía (UCBL Lyon 1 - Francia)',
        mpps: '61231',
        cmeb: '5331',
        stampBase64: ctx.doctorStampBase64,
        signatureBase64: ctx.signatureBase64,
      },
      ...(ctx.customData || {}),
    };
  }

  /**
   * Resuelve un valor específico a partir de un dataKey en notación de puntos
   * Ejemplos:
   *   'patient.fullName' -> 'JUAN PEREZ'
   *   'history.clinical.motivo' -> 'Dolor lumbar'
   *   'lab.checkbox.glicemia' -> true
   *   'labTests.Glicemia' -> true
   */
  public static resolve(dataDictionary: Record<string, any>, dataKey: string): any {
    if (!dataDictionary || !dataKey) return undefined;

    // Acceso directo si la clave ya está aplanada
    if (dataKey in dataDictionary) {
      return dataDictionary[dataKey];
    }

    // Acceso directo para labTests y neuroimaging donde el nombre del examen puede contener puntos (ej. Células L.E.)
    if (dataKey.startsWith('labTests.') && dataDictionary.labTests) {
      const leafKey = dataKey.slice(9);
      if (dataDictionary.labTests[leafKey] !== undefined) {
        return dataDictionary.labTests[leafKey];
      }
    }
    if (dataKey.startsWith('neuroimaging.') && dataDictionary.neuroimaging) {
      const leafKey = dataKey.slice(13);
      if (dataDictionary.neuroimaging[leafKey] !== undefined) {
        return dataDictionary.neuroimaging[leafKey];
      }
    }

    // Acceso anidado por partes
    const parts = dataKey.split('.');
    let current: any = dataDictionary;
    for (const part of parts) {
      if (current === undefined || current === null) break;
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        // Búsqueda insensible a mayúsculas o normalizada
        const foundKey = Object.keys(current).find(
          (k) => k.toLowerCase() === part.toLowerCase() ||
                 k.toLowerCase().replace(/[^a-z0-9]/g, '_') === part.toLowerCase().replace(/[^a-z0-9]/g, '_')
        );
        if (foundKey) {
          current = current[foundKey];
        } else {
          current = undefined;
          break;
        }
      }
    }
    if (current !== undefined) return current;

    // Fallback: búsqueda en lab.checkbox si el dataKey empezaba por labTests. o lab.
    if (dataKey.startsWith('labTests.') || dataKey.startsWith('lab.')) {
      const leaf = dataKey.split('.').pop() || '';
      const cleanLeaf = leaf.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (dataDictionary.lab?.checkbox?.[cleanLeaf] !== undefined) {
        return dataDictionary.lab.checkbox[cleanLeaf];
      }
      if (dataDictionary.labTests?.[leaf] !== undefined) {
        return dataDictionary.labTests[leaf];
      }
    }

    return undefined;
  }

  /**
   * Resuelve un valor de texto asegurando tipo string limpio
   */
  public static resolveText(dataDictionary: Record<string, any>, dataKey: string, labelPrefix?: string): string {
    const rawVal = this.resolve(dataDictionary, dataKey);
    if (rawVal === undefined || rawVal === null) return '';
    const text = String(rawVal).trim();
    if (!text) return '';
    return labelPrefix ? `${labelPrefix} ${text}` : text;
  }

  /**
   * Resuelve un valor booleano (para checkboxes o marcas)
   */
  public static resolveBoolean(dataDictionary: Record<string, any>, dataKey: string): boolean {
    const rawVal = this.resolve(dataDictionary, dataKey);
    if (typeof rawVal === 'boolean') return rawVal;
    if (typeof rawVal === 'string') {
      const lower = rawVal.trim().toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'si' || lower === 'x';
    }
    if (typeof rawVal === 'number') return rawVal > 0;
    return false;
  }
}
