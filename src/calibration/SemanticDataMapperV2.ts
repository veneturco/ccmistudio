/**
 * SemanticDataMapperV2.ts
 * 
 * Mapeador Semántico Universal (V2):
 * Transforma el modelo clínico de la aplicación (`PatientData`, `PatientInfo`, `StructuredClinicalData`, formularios)
 * a un diccionario semántico jerárquico accesible mediante notación de puntos (ej: 'patient.fullName', 'clinical.cb.glicemia', 'clinical.checkbox.rmn')
 * para el inyector vectorial VectorOverlayEngineV2.
 */

import { PatientData, PatientInfo, StructuredClinicalData } from '../types';

export interface ClinicalWorkspaceContext {
  patient?: Partial<PatientData & PatientInfo>;
  clinical?: Partial<StructuredClinicalData> & Record<string, any>;
  documentDate?: string;
  doctorStampBase64?: string;
  notes?: string;
  recipeLeft?: string;
  recipeRight?: string;
  certificateText?: string;
}

// Mapeo exhaustivo de patrones clínicos a las llaves booleanas de clinical.cb.*
const CLINICAL_CB_RULES: Array<{ key: string; regex: RegExp }> = [
  // Hematología y coagulación
  { key: 'hematologia_completa', regex: /\b(hematolog\w*|hemograma|formula\s*leucocit|leucocitos|hemoglobina|hematocrito|cbc)\b/i },
  { key: 'plaquetas', regex: /\b(plaqueta\w*|recuento\s*plaquetar|trombocito\w*)\b/i },
  { key: 'reticulocitos', regex: /\b(reticulocito\w*)\b/i },
  { key: 'vsg', regex: /\b(vsg|eritrosedimentaci\w*|velocidad\s*de\s*sedimentaci)\b/i },
  { key: 'eosinofilos', regex: /\b(eosinofil\w*|recuento\s*de\s*eosinofil)\b/i },
  { key: 'grupo_rh', regex: /\b(grupo|rh|factor\s*rh|tipiaje)\b/i },
  { key: 'frotis', regex: /\b(frotis|frotis\s*de\s*sangre|lamina\s*periferica)\b/i },
  { key: 'pt', regex: /\b(pt|tiempo\s*de\s*protrombina|protrombina|inr)\b/i },
  { key: 'ptt', regex: /\b(ptt|tpt|tromboplastina|tiempo\s*parcial\s*de\s*tromboplastina)\b/i },
  { key: 'tiempo_sangria', regex: /\b(sangria|tiempo\s*de\s*sangria|duke|ivy)\b/i },
  { key: 'tiempo_retraccion', regex: /\b(retracci\w*|tiempo\s*de\s*retracci|retraccion\s*del\s*coagulo)\b/i },
  { key: 'fibrinogeno', regex: /\b(fibrinogen\w*|fibrinogeno)\b/i },
  { key: 'dimero_d', regex: /\b(dimero\w*|dimero\s*d|d-dimer)\b/i },
  // Uroanálisis
  { key: 'orina', regex: /\b(orina|examen\s*general\s*de\s*orina|uroanalisis|ego|sedimento\s*urinario)\b/i },
  { key: 'electrolitos_urinarios', regex: /\b(electrolitos\s*urinarios|sodio\s*urinario|potasio\s*urinario)\b/i },
  { key: 'calcio_creatinina', regex: /\b(calcio.*creatinina|relacion\s*calcio\s*creatinina)\b/i },
  { key: 'fosforo_creatinina', regex: /\b(fosforo.*creatinina|relacion\s*fosforo\s*creatinina)\b/i },
  { key: 'acido_urico_creatinina', regex: /\b(acido\s*urico.*creatinina)\b/i },
  { key: 'reabsorcion_fosforo', regex: /\b(reabsorcion.*fosforo|trf)\b/i },
  { key: 'depuracion_creatinina', regex: /\b(depuracion.*creatinina|aclaramiento.*creatinina|clearence)\b/i },
  { key: 'proteinuria_24h', regex: /\b(proteinuria|proteina.*24h|proteinas\s*en\s*orina\s*de\s*24)\b/i },
  // Coprología
  { key: 'heces', regex: /\b(heces|coproanalisis|copro|examen\s*de\s*heces|parasitologico)\b/i },
  { key: 'leugrama', regex: /\b(leugrama|leucocitos\s*en\s*heces)\b/i },
  { key: 'sudan_iii', regex: /\b(sudan|sudan\s*iii|grasas\s*en\s*heces)\b/i },
  { key: 'azucares_reductores', regex: /\b(azucares\s*reductores|sustancias\s*reductoras)\b/i },
  { key: 'sangre_oculta', regex: /\b(sangre\s*oculta|guayaco|thevenon)\b/i },
  // Bacteriología
  { key: 'urocultivo', regex: /\b(urocultivo)\b/i },
  { key: 'cultivo_antibiograma', regex: /\b(antibiograma|cultivo\s*y\s*antibiograma|coprocultivo|hemocultivo)\b/i },
  { key: 'bk', regex: /\b(bk|baciloscopia|baar|bacilo\s*de\s*koch|tuberculosis)\b/i },
  // Enzimas y marcadores cardíacos / inflamatorios
  { key: 'troponina', regex: /\b(troponina|tropo\s*i|tropo\s*t)\b/i },
  { key: 'ck', regex: /\b(ck\b|creatinquinasa|creatinfosfoquinasa|cpk(?!\s*mb))\b/i },
  { key: 'ck_mb', regex: /\b(ck[- ]*mb|cpk[- ]*mb)\b/i },
  { key: 'pcr', regex: /\b(pcr\b|proteina\s*["']?c["']?\s*reactiva)\b/i },
  { key: 'hcg', regex: /\b(hcg\b|gonadotropina\s*corionica)\b/i },
  { key: 'psa', regex: /\b(psa\b|antigeno\s*prostatico)\b/i },
  { key: 'vdrl', regex: /\b(vdrl|rpr|serologia\s*luetica|sifilis)\b/i },
  { key: 'hiv', regex: /\b(hiv|vih|elisa\s*hiv|sida)\b/i },
  { key: 'ige', regex: /\b(ige\b|inmunoglobulina\s*e)\b/i },
  { key: 'asto', regex: /\b(asto|antiestreptolisina)\b/i },
  { key: 'ra_test', regex: /\b(ra\s*test|factor\s*reumatoideo|reumatest|latex)\b/i },
  { key: 'mono_test', regex: /\b(mono\s*test|mononucleosis|paul\s*bunnell)\b/i },
  // Hormonas y Pruebas Especiales
  { key: 'cortisol', regex: /\b(cortisol)\b/i },
  { key: 'lh', regex: /\b(lh\b|luteinizante|hormona\s*luteinizante)\b/i },
  { key: 'fsh', regex: /\b(fsh\b|foliculoestimulante|hormona\s*foliculoestimulante)\b/i },
  { key: 'prolactina', regex: /\b(prolactina|prl)\b/i },
  { key: 'estradiol', regex: /\b(estradiol|e2)\b/i },
  { key: 'progesterona', regex: /\b(progesterona|prog)\b/i },
  { key: 't3', regex: /\b(t3\b|triyodotironina)\b/i },
  { key: 't4', regex: /\b(t4\b|tiroxina|t4\s*libre)\b/i },
  { key: 'tsh', regex: /\b(tsh\b|tirotropina|tiroideo|perfil\s*tiroideo)\b/i },
  { key: 'testosterona', regex: /\b(testosterona)\b/i },
  { key: 'dhea_so4', regex: /\b(dhea|dhea[- ]*so4|dehidroepiandrosterona)\b/i },
  { key: 'cea', regex: /\b(cea\b|antigeno\s*carcinoembrionario)\b/i },
  { key: 'ca125', regex: /\b(ca[- ]*125)\b/i },
  { key: 'ca19_9', regex: /\b(ca[- ]*19[- ]*9)\b/i },
  { key: 'ca15_3', regex: /\b(ca[- ]*15[- ]*3)\b/i },
  { key: 'ca72_4', regex: /\b(ca[- ]*72[- ]*4)\b/i },
  { key: 'curva_insulina', regex: /\b(curva.*insulina)\b/i },
  // Serología y Drogas
  { key: 'helicobacter', regex: /\b(helicobacter|h\.?\s*pylori)\b/i },
  { key: 'helicobacter_igg', regex: /\b(helicobacter.*igg|h\.?\s*pylori.*igg)\b/i },
  { key: 'hepatitis_a', regex: /\b(hepatitis\s*a|hav|anti[- ]*hav)\b/i },
  { key: 'hepatitis_b_sup', regex: /\b(hepatitis\s*b|hbsag|antigeno\s*de\s*superficie)\b/i },
  { key: 'hepatitis_b_core', regex: /\b(anti[- ]*hbc|core.*hepatitis\s*b)\b/i },
  { key: 'hepatitis_c', regex: /\b(hepatitis\s*c|hcv|anti[- ]*hcv)\b/i },
  { key: 'toxoplasma', regex: /\b(toxoplasma|toxoplasmosis|toxo)\b/i },
  { key: 'valproico', regex: /\b(valproico|acido\s*valproico|valpromida|depakene)\b/i },
  { key: 'fenobarbital', regex: /\b(fenobarbital|luminal)\b/i },
  { key: 'carbamazepina', regex: /\b(carbamazepina|tegretol)\b/i },
  { key: 'cocaina', regex: /\b(cocaina)\b/i },
  { key: 'canabinoides', regex: /\b(canabinoid|marihuana|thc)\b/i },
  { key: 'fta', regex: /\b(fta|fta[- ]*abs)\b/i },
  // Química sanguínea
  { key: 'glicemia', regex: /\b(glicemia|glucosa|azucar|glicemia\s*basal)\b/i },
  { key: 'glicemia_post', regex: /\b(glicemia\s*post|glucosa\s*post|postprandial)\b/i },
  { key: 'curva_tolerancia', regex: /\b(curva.*tolerancia|ptgo|ogtt)\b/i },
  { key: 'urea', regex: /\b(urea|bun|nitrogeno\s*ureico)\b/i },
  { key: 'creatinina', regex: /\b(creatinina)\b/i },
  { key: 'acido_urico', regex: /\b(acido\s*urico|uricemia)\b/i },
  { key: 'colesterol', regex: /\b(colesterol|colesterol\s*total|colesterolemia|lipidico|lipidos)\b/i },
  { key: 'hdl', regex: /\b(hdl|colesterol\s*hdl)\b/i },
  { key: 'ldl', regex: /\b(ldl|colesterol\s*ldl)\b/i },
  { key: 'trigliceridos', regex: /\b(triglicerid\w*|trigliceridos)\b/i },
  { key: 'tgo', regex: /\b(tgo|ast|transaminasas|transaminasa\s*glutamico\s*oxalacetica)\b/i },
  { key: 'tgp', regex: /\b(tgp|alt|transaminasa\s*glutamico\s*piruvica)\b/i },
  { key: 'ggt', regex: /\b(ggt|gamma[- ]*gt|gamma\s*glutamil)\b/i },
  { key: 'fosfatasa_alcalina', regex: /\b(fosfatasa\s*alcalina|alp)\b/i },
  { key: 'ldh', regex: /\b(ldh|lactato\s*deshidrogenasa)\b/i },
  { key: 'lipasa', regex: /\b(lipasa)\b/i },
  { key: 'amilasa', regex: /\b(amilasa)\b/i },
  { key: 'bilirrubina', regex: /\b(bilirrubina|bilirrubinas|bilirrubina\s*total)\b/i },
  { key: 'calcio', regex: /\b(calcio|calcemia)\b/i },
  { key: 'fosforo', regex: /\b(fosforo|fosfatemia)\b/i },
  { key: 'magnesio', regex: /\b(magnesio|magnesemia)\b/i },
  { key: 'sodio', regex: /\b(sodio|natremia|ionograma|electrolito)\b/i },
  { key: 'potasio', regex: /\b(potasio|kalemia)\b/i },
  { key: 'cloro', regex: /\b(cloro|cloremia)\b/i },
  { key: 'hierro', regex: /\b(hierro|sideremia|ferremia)\b/i },
  { key: 'citomegalovirus', regex: /\b(citomegalovirus|cmv)\b/i },
  { key: 'epstein_barr', regex: /\b(epstein|ebv|mononucleosis\s*infecciosa)\b/i },
  { key: 'dengue', regex: /\b(dengue|ns1|dengue\s*igg|dengue\s*igm)\b/i },
  { key: 'insulina_basal', regex: /\b(insulina|insulina\s*basal)\b/i },
  { key: 'insulina_post', regex: /\b(insulina\s*post|insulina\s*prandial)\b/i },
  { key: 'hb_glicosilada', regex: /\b(glicosilada|hba1c|hemoglobina\s*glicosilada)\b/i },
  { key: 'beta_hcg', regex: /\b(beta[- ]*hcg|subunidad\s*beta)\b/i },
  { key: 'procalcitonina', regex: /\b(procalcitonina|pct)\b/i },
  { key: 'ferritina', regex: /\b(ferritina)\b/i },
  { key: 'covid', regex: /\b(covid|sars[- ]*cov|antigeno\s*covid|pcr\s*covid)\b/i },
];

export class SemanticDataMapperV2 {
  /**
   * Genera el diccionario semántico unificado a partir de los datos actuales
   */
  public static mapToSemanticDictionary(ctx: ClinicalWorkspaceContext): Record<string, any> {
    const p = ctx.patient || {};
    const c = ctx.clinical || {};

    const fullName = (p.fullName || '').trim();
    const idNumber = ((p as any).idNumber || (p as any).nationalId || '').trim();
    const age = (p.age ? String(p.age) : '').trim();
    const phone = (p.phone || '').trim();
    const address = ((p as any).address || '').trim();
    const date = (ctx.documentDate || (p as any).date || new Date().toLocaleDateString('es-VE')).trim();

    // Mapear récipe: si no viene texto directo, derivar de medications estructurados
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

    // Diagnóstico principal
    const diagnosisPrincipal = (c.diagnosisPrincipal || (c as any).diagnostic || (ctx as any).presumptiveDx || (ctx as any).diagnosticoPresuntivo || '').trim();

    // Narrativa de constancia
    const certificateNarrative = (ctx.certificateText || (c as any).certificateNarrative || (c as any).restCertificate || '').trim();

    // Informe clínico
    const clinicalReport = ((c as any).clinicalReport || (c as any).reportText || c.summaryNote || '').trim();

    // Compilar todas las fuentes de texto clínico y solicitudes para evaluación semántica
    const textSources: string[] = [
      String(c.summaryNote || ''),
      String(c.presentIllness || ''),
      String((c as any).enfermedadActual || ''),
      String((c as any).labAndImagesOrder || ''),
      String((c as any).orderText || ''),
      String((c as any).notes || ''),
      String(ctx.notes || ''),
    ];

    const rawLabSource = c.labTests || (ctx as any).labTests;
    const testList: string[] = [];
    if (Array.isArray(rawLabSource)) {
      rawLabSource.forEach((t: any) => {
        if (typeof t === 'string' && t.trim()) testList.push(t.trim());
      });
    } else if (rawLabSource && typeof rawLabSource === 'object') {
      Object.entries(rawLabSource).forEach(([k, v]) => {
        if (Boolean(v) && k.trim()) testList.push(k.trim());
      });
    }

    // Neuroimágenes para la página 2 (no mezclar con las pruebas de laboratorio de la página 1)
    const rawNeuroSource = (c as any).neuroimagingTests || (c as any).neuroimaging || (ctx as any).neuroimagingTests || (ctx as any).neuroimaging;
    const neuroList: string[] = [];
    if (Array.isArray(rawNeuroSource)) {
      rawNeuroSource.forEach((t: any) => {
        if (typeof t === 'string' && t.trim()) neuroList.push(t.trim());
      });
    } else if (rawNeuroSource && typeof rawNeuroSource === 'object') {
      Object.entries(rawNeuroSource).forEach(([k, v]) => {
        if (Boolean(v) && k.trim()) neuroList.push(k.trim());
      });
    }

    const normTxt = (s: string): string => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const combinedClinicalCorpus = normTxt([...textSources, ...testList].join(' '));
    const neuroCorpus = [...textSources, ...neuroList].join(' ');
    const hasNeuroMatch = (regex: RegExp) => regex.test(neuroCorpus);

    // Extracción de datos de constancia considerando ctx.certificateData y ctx.constanciaData
    const certCtx = (ctx as any).certificateData || (ctx as any).constanciaData || {};
    const attendedDate = ((c as any).attendedDate || certCtx.attendedDate || (ctx as any).attendedDate || date).trim();
    
    // Parseo de día, mes en letras y año
    const parseDateComponents = (dStr: string) => {
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      if (dStr && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dStr)) {
        const parts = dStr.split(/[\/\-]/);
        const day = String(parseInt(parts[0], 10));
        const monthIdx = parseInt(parts[1], 10) - 1;
        const month = months[monthIdx] || 'enero';
        const year = parts[2];
        return { day, month, year };
      }
      if (dStr && /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(dStr)) {
        const parts = dStr.split(/[\/\-]/);
        const day = String(parseInt(parts[2], 10));
        const monthIdx = parseInt(parts[1], 10) - 1;
        const month = months[monthIdx] || 'enero';
        const year = parts[0];
        return { day, month, year };
      }
      const now = new Date();
      return {
        day: String(now.getDate()),
        month: months[now.getMonth()],
        year: String(now.getFullYear()),
      };
    };

    const dateComponents = parseDateComponents(attendedDate || date);

    // Días de reposo a palabras
    const rawRestDays = (c as any).restDays || certCtx.restDays || (c as any).diasReposo || (ctx as any).restDays || '';
    const numDays = parseInt(String(rawRestDays), 10);
    const daysWordMap: Record<number, string> = {
      1: 'UN (01)',
      2: 'DOS (02)',
      3: 'TRES (03)',
      4: 'CUATRO (04)',
      5: 'CINCO (05)',
      6: 'SEIS (06)',
      7: 'SIETE (07)',
      8: 'OCHO (08)',
      9: 'NUEVE (09)',
      10: 'DIEZ (10)',
      11: 'ONCE (11)',
      12: 'DOCE (12)',
      13: 'TRECE (13)',
      14: 'CATORCE (14)',
      15: 'QUINCE (15)',
      20: 'VEINTE (20)',
      21: 'VEINTIUNO (21)',
      30: 'TREINTA (30)',
    };
    const restDaysWords = (c as any).restDaysWords || certCtx.restDaysWords || (c as any).diasReposoPalabras || (numDays && daysWordMap[numDays] ? daysWordMap[numDays] : (rawRestDays ? `${rawRestDays} DÍAS` : ''));

    const restFrom = (c as any).restFrom || certCtx.restFrom || (c as any).reposoDesde || (ctx as any).restFrom || attendedDate || date;
    const restTo = (c as any).restTo || certCtx.restTo || (c as any).reposoHasta || (ctx as any).restTo || '';
    const constanciaIdx = (c as any).constanciaIdx || certCtx.idx || certCtx.diagnosis || (c as any).idx || (c as any).diagnosisPrincipal || (c as any).diagnostico || diagnosisPrincipal || certificateNarrative;

    const isFamiliar = Boolean((c as any).isFamiliar || certCtx.isFamiliar || (certCtx.condition?.toLowerCase() === 'familiar') || (c as any).checkbox?.familiar || (ctx as any).checkbox?.familiar);
    const isPaciente = Boolean((c as any).isPaciente ?? certCtx.isPaciente ?? (certCtx.condition ? certCtx.condition?.toLowerCase() === 'paciente' : undefined) ?? (c as any).checkbox?.paciente ?? (ctx as any).checkbox?.paciente ?? !isFamiliar);

    const hasRest = Boolean((c as any).reposo_si || certCtx.needsRest || certCtx.reposo_si || (c as any).hasRest || (c as any).restDays || certCtx.restDays || (c as any).diasReposo || (c as any).checkbox?.reposo_si || (ctx as any).checkbox?.reposo_si || (numDays > 0));
    const noRest = Boolean((c as any).reposo_no || certCtx.reposo_no || (certCtx.needsRest === false) || (c as any).checkbox?.reposo_no || (ctx as any).checkbox?.reposo_no || (!hasRest && (c as any).reposo === false));

    const constanciaData = {
      attendedDate,
      restDaysWords,
      restDays: rawRestDays,
      restFrom,
      restTo,
      idx: constanciaIdx,
      diagnosis: constanciaIdx,
      requestDay: (c as any).requestDay || certCtx.requestDay || dateComponents.day,
      requestMonth: (c as any).requestMonth || certCtx.requestMonth || dateComponents.month,
      requestYear: (c as any).requestYear || certCtx.requestYear || dateComponents.year,
      cond_paciente: isPaciente,
      cond_familiar: isFamiliar,
      reposo_si: hasRest,
      reposo_no: noRest,
      isPaciente,
      isFamiliar,
      hasRest,
      noRest,
    };

    const hasMatch = (regex: RegExp): boolean => {
      if (testList.some(t => regex.test(normTxt(t)))) return true;
      return regex.test(combinedClinicalCorpus);
    };

    // 1. Checkboxes Página 1: clinical.cb.*
    const cbMap: Record<string, boolean> = {};
    const unmappedLabTests: string[] = [];

    // Pre-llenar desde c.cb si ya viene explícito
    if ((c as any).cb && typeof (c as any).cb === 'object') {
      Object.entries((c as any).cb).forEach(([k, v]) => {
        if (Boolean(v)) cbMap[k] = true;
      });
    }

    // Reglas de perfil comunes
    const hasPreop = /\b(preoperatorio|perfil\s*preoperatorio)\b/i.test(combinedClinicalCorpus);
    const hasLipid = /\b(perfil\s*lipidico|lipidos|dislipidemia)\b/i.test(combinedClinicalCorpus);
    const hasHepatic = /\b(perfil\s*hepatico|hepatopatia|funcion\s*hepatica)\b/i.test(combinedClinicalCorpus);
    const hasRenal = /\b(perfil\s*renal|funcion\s*renal)\b/i.test(combinedClinicalCorpus);
    const hasThyroid = /\b(perfil\s*tiroideo|tiroides)\b/i.test(combinedClinicalCorpus);

    if (hasPreop) {
      cbMap['hematologia_completa'] = true;
      cbMap['pt'] = true;
      cbMap['ptt'] = true;
      cbMap['glicemia'] = true;
      cbMap['urea'] = true;
      cbMap['creatinina'] = true;
      cbMap['grupo_rh'] = true;
      cbMap['orina'] = true;
      cbMap['vsg'] = true;
      cbMap['hiv'] = true;
      cbMap['vdrl'] = true;
    }

    if (hasLipid) {
      cbMap['colesterol'] = true;
      cbMap['hdl'] = true;
      cbMap['ldl'] = true;
      cbMap['trigliceridos'] = true;
    }

    if (hasHepatic) {
      cbMap['tgo'] = true;
      cbMap['tgp'] = true;
      cbMap['bilirrubina'] = true;
      cbMap['fosfatasa_alcalina'] = true;
      cbMap['ggt'] = true;
    }

    if (hasRenal) {
      cbMap['urea'] = true;
      cbMap['creatinina'] = true;
      cbMap['acido_urico'] = true;
      cbMap['orina'] = true;
      cbMap['sodio'] = true;
      cbMap['potasio'] = true;
      cbMap['cloro'] = true;
    }

    if (hasThyroid) {
      cbMap['t3'] = true;
      cbMap['t4'] = true;
      cbMap['tsh'] = true;
    }

    // Evaluar reglas individuales
    for (const rule of CLINICAL_CB_RULES) {
      if (hasMatch(rule.regex)) {
        cbMap[rule.key] = true;
      }
    }

    // Helper para determinar si un string es un dataKey interno, identificador de template o estudio de neuroimagen
    const isDataKeyOrInternalKey = (str: string): boolean => {
      if (!str || typeof str !== 'string') return false;
      const s = str.trim();
      // Claves con prefijos o puntos técnicos
      if (/\b(orden_p1|orden_p2|cb_|clinical\.|patient\.|document\.|recipe\.|certificate\.|labTests\.|lab_order)\b/i.test(s)) return true;
      if (s.includes('.')) return true;
      // Estudios de neuroimagen que corresponden exclusivamente a la página 2
      if (/^(rmn|tac|radiologia|radiología|rx|eeg|emg|pess|valoracion|valoración|resonancia|resonancia\s*magnetica|resonancia\s*magnética|tomografia|tomografía|radiografia|radiografía|rayos\s*x|electroencefalograma|electromiografia|electromiografía|potenciales\s*evocados|riesgo\s*quirurgico|riesgo\s*quirúrgico)$/i.test(s)) return true;
      // Nombres de perfiles agregados que ya se desglosan en casillas
      if (/^(perfil\s*(preoperatorio|20|lipidico|lipídico|hepatico|hepático|tiroideo|renal)|laboratorio|laboratorios|tests|estudios)$/i.test(s)) return true;
      return false;
    };

    // Extraer pruebas no mapeadas a casillas impresas (sólo analítica de lab auténtica)
    for (const t of testList) {
      if (isDataKeyOrInternalKey(t)) continue;
      let matched = false;
      for (const rule of CLINICAL_CB_RULES) {
        if (rule.regex.test(normTxt(t))) {
          matched = true;
          break;
        }
      }
      if (!matched && !hasPreop && !hasLipid && !hasHepatic) {
        unmappedLabTests.push(t);
      }
    }

    // 2. Checkboxes Página 2: clinical.checkbox.*
    const neuroimagingCheckbox: Record<string, boolean> = {
      rmn: Boolean((c as any).rmn || (ctx as any).rmn || (c as any).neuroimaging?.rmn || (ctx as any).neuroimaging?.rmn || (c as any).checkbox?.rmn || (c as any).neuroimagingTests?.['orden_p2.rmn'] || (c as any).neuroimagingTests?.rmn || (c as any).neuroimagingTests?.['RESONANCIA MAGNÉTICA'] || (c as any).neuroimagingTests?.['Resonancia Magnética'] || hasNeuroMatch(/resonancia|rmn|mri/i)),
      tac: Boolean((c as any).tac || (ctx as any).tac || (c as any).neuroimaging?.tac || (ctx as any).neuroimaging?.tac || (c as any).checkbox?.tac || (c as any).neuroimagingTests?.['orden_p2.tac_cerebral'] || (c as any).neuroimagingTests?.tac || (c as any).neuroimagingTests?.['TAC Cerebral'] || hasNeuroMatch(/tac|tomograf/i)),
      radiologia: Boolean((c as any).radiologia || (ctx as any).radiologia || (c as any).neuroimaging?.radiologia || (ctx as any).neuroimaging?.radiologia || (c as any).checkbox?.radiologia || (c as any).neuroimagingTests?.['orden_p2.radiologia'] || (c as any).neuroimagingTests?.radiologia || (c as any).neuroimagingTests?.['RADIOLOGÍA'] || (c as any).neuroimagingTests?.['Radiología'] || hasNeuroMatch(/rx|radiolog|radiografia/i)),
      eeg: Boolean((c as any).eeg || (ctx as any).eeg || (c as any).neuroimaging?.eeg || (ctx as any).neuroimaging?.eeg || (c as any).checkbox?.eeg || (c as any).neuroimagingTests?.['orden_p2.eeg'] || (c as any).neuroimagingTests?.eeg || hasNeuroMatch(/eeg|electroencefal/i)),
      emg: Boolean((c as any).emg || (ctx as any).emg || (c as any).neuroimaging?.emg || (ctx as any).neuroimaging?.emg || (c as any).checkbox?.emg || (c as any).neuroimagingTests?.['orden_p2.emg'] || (c as any).neuroimagingTests?.emg || hasNeuroMatch(/emg|electromiogr/i)),
      pess: Boolean((c as any).pess || (ctx as any).pess || (c as any).neuroimaging?.pess || (ctx as any).neuroimaging?.pess || (c as any).checkbox?.pess || (c as any).neuroimagingTests?.['orden_p2.pess'] || (c as any).neuroimagingTests?.pess || hasNeuroMatch(/pess|potenciales\s*evocados/i)),
      valoracion: Boolean((c as any).valoracion || (ctx as any).valoracion || (c as any).neuroimaging?.valoracion || (ctx as any).neuroimaging?.valoracion || (c as any).checkbox?.valoracion || (c as any).neuroimagingTests?.['orden_p2.valoracion'] || (c as any).neuroimagingTests?.valoracion || hasNeuroMatch(/valoraci|evaluacion\s*prequirurgica|riesgo\s*quirurgico/i)),
    };

    const combinedCheckboxes: Record<string, boolean> = {
      ...neuroimagingCheckbox,
      ...((c as any).checkbox || {}),
      ...((ctx as any).checkbox || {}),
      paciente: isPaciente,
      familiar: isFamiliar,
      reposo_si: hasRest,
      reposo_no: noRest,
      cond_paciente: isPaciente,
      cond_familiar: isFamiliar,
    };

    // Sincronizar alias de checkboxes para soporte V5.1
    cbMap['embarazo'] = Boolean(cbMap['embarazo'] || cbMap['hcg']);
    cbMap['hcg'] = Boolean(cbMap['hcg'] || cbMap['embarazo']);
    cbMap['dhea'] = Boolean(cbMap['dhea'] || cbMap['dhea_so4']);
    cbMap['dhea_so4'] = Boolean(cbMap['dhea_so4'] || cbMap['dhea']);
    cbMap['hba1c'] = Boolean(cbMap['hba1c'] || cbMap['hb_glicosilada']);
    cbMap['hb_glicosilada'] = Boolean(cbMap['hb_glicosilada'] || cbMap['hba1c']);

    const existingOtherRaw = (c as any).otrosEstudiosTexto || (c as any).otherExams || (c as any).otrosExamenes || (ctx as any).otherExams || '';
    const rawOtherList = Array.isArray(existingOtherRaw)
      ? existingOtherRaw
      : (typeof existingOtherRaw === 'string' ? existingOtherRaw.split(/[,;\n]+/) : []);
    const cleanOtherList = rawOtherList
      .map((s: string) => s.trim())
      .filter((s: string) => Boolean(s) && !isDataKeyOrInternalKey(s));
    const cleanUnmapped = unmappedLabTests.filter((s) => !isDataKeyOrInternalKey(s));

    const finalOtherExams = Array.from(new Set([...cleanOtherList, ...cleanUnmapped]));
    const otrosEstudiosTexto = finalOtherExams.join(', ');

    const deTexto = (c as any).de_texto || (c as any).deTexto || (c as any).indicacionEspecial || '';

    return {
      patient: {
        fullName,
        idNumber,
        age: age ? (String(age).includes('años') ? String(age) : `${age} años`) : '',
        phone,
        address,
        gender: (p as any).gender || (p as any).sexo || '',
        email: (p as any).email || (p as any).correo || '',
        date,
      },
      document: {
        date,
        type: (ctx as any).documentType || 'medical_document',
      },
      recipe: {
        pharmacy: rxPharmacy,
        rxBody: rxPharmacy,
        rxLeft: rxPharmacy,
        left: rxPharmacy,
        indications: rxIndications,
        indicationsBody: rxIndications,
        patientIndications: rxIndications,
        indicationsRight: rxIndications,
        right: rxIndications,
      },
      report: {
        body: clinicalReport,
        bodyText: clinicalReport,
        content: clinicalReport,
        clinicalReport,
        reportText: clinicalReport,
        date,
      },
      informe: {
        body: clinicalReport,
        bodyText: clinicalReport,
        content: clinicalReport,
        clinicalReport,
        reportText: clinicalReport,
        diagnostico: diagnosisPrincipal,
        diagnosisPrincipal,
        date,
      },
      certificate: {
        title: 'CONSTANCIA MÉDICA DE ASISTENCIA Y REPOSO',
        narrative: certificateNarrative,
        diagnosis: constanciaData.idx,
        ...constanciaData,
      },
      constancia: constanciaData,
      historia: {
        motivoConsulta: (c as any).consultReason || (c as any).motivoConsulta || (c as any).motivo || c.chiefComplaint || '',
        enfermedadActual: (c as any).currentIllness || (c as any).enfermedadActual || (c as any).enfermedad || c.presentIllness || '',
        antecedentes: (c as any).background || (c as any).antecedentes || c.personalHistory || '',
        examenNeurologico: (c as any).neuroExam || (c as any).examenFisico || (c as any).examen || c.physicalExam || '',
        diagnostico: (c as any).diagnosis || (c as any).diagnostico || diagnosisPrincipal || '',
      },
      clinicalHistory: {
        consultReason: (c as any).consultReason || (c as any).motivoConsulta || (c as any).motivo || c.chiefComplaint || '',
        currentIllness: (c as any).currentIllness || (c as any).enfermedadActual || (c as any).enfermedad || c.presentIllness || '',
        background: (c as any).background || (c as any).antecedentes || c.personalHistory || '',
        neuroExam: (c as any).neuroExam || (c as any).examenFisico || (c as any).examen || c.physicalExam || '',
        diagnosis: (c as any).diagnosis || (c as any).diagnostico || diagnosisPrincipal || '',
      },
      history: {
        clinical: {
          motivo: (c as any).consultReason || (c as any).motivoConsulta || (c as any).motivo || c.chiefComplaint || '',
          enfermedad: (c as any).currentIllness || (c as any).enfermedadActual || (c as any).enfermedad || c.presentIllness || '',
          antecedentes: (c as any).background || (c as any).antecedentes || c.personalHistory || '',
          examen: (c as any).neuroExam || (c as any).examenFisico || (c as any).examen || c.physicalExam || '',
          diagnostico: (c as any).diagnosis || (c as any).diagnostico || diagnosisPrincipal || '',
        },
      },
      clinical: {
        diagnosisPrincipal,
        diagnosis: diagnosisPrincipal,
        diagnostico: diagnosisPrincipal,
        treatment: (c as any).treatment || (c as any).tratamiento || rxIndications || rxPharmacy || '',
        tratamiento: (c as any).treatment || (c as any).tratamiento || rxIndications || rxPharmacy || '',
        indications: rxIndications || (c as any).indications || (c as any).indicaciones || '',
        notes: (c as any).notes || (c as any).observaciones || ctx.notes || clinicalReport || '',
        observaciones: (c as any).notes || (c as any).observaciones || ctx.notes || clinicalReport || '',
        clinicalReport,
        reportText: clinicalReport,
        bodyText: clinicalReport,
        motivoConsulta: (c as any).motivoConsulta || (c as any).motivo || '',
        enfermedadActual: (c as any).enfermedadActual || (c as any).enfermedad || '',
        antecedentes: (c as any).antecedentes || '',
        examenFisico: (c as any).examenFisico || (c as any).examen || '',
        cb: cbMap,
        checkbox: combinedCheckboxes,
        de_texto: deTexto,
        otrosEstudiosTexto: otrosEstudiosTexto,
        otherExams: otrosEstudiosTexto,
        otrosExamenes: otrosEstudiosTexto,
      },
      checkbox: combinedCheckboxes,
      doctor: {
        name: 'Dr. Samir Moucharrafie Naime',
        specialty: 'Especialista en Neurocirugía (UCBL Lyon 1 - Francia)',
        institute: 'Instituto CcMi (Cerebro y Columna Mínimamente Invasiva)',
        mpps: '61231',
        cmeb: '5331',
        rppsFrancia: '10100476323',
        phone: '0424-938.16.74',
        email: 'cerebro.columna.mi@gmail.com',
        stampBase64: ctx.doctorStampBase64,
        signatureBase64: (ctx as any).signatureBase64,
      },
      neuroimaging: neuroimagingCheckbox,
      labTests: cbMap,
      orden_p1: cbMap,
      orden_p2: {
        ...neuroimagingCheckbox,
        otrosEstudiosTexto,
      },
      ...((ctx as any).customData || {}),
    };
  }
}
