// FUENTE DE VERDAD CANÓNICA (113 CASILLAS FÍSICAS DE LA ORDEN DE LABORATORIO)
export interface LabCheckboxDef {
  id: string;
  label: string;
  dataKey?: string;
  page: number; // 1 o 2
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export const CANONICAL_LAB_REGISTRY: LabCheckboxDef[] = [
  {
    "id": "cb_hema",
    "label": "hematologia_completa",
    "dataKey": "clinical.cb.hematologia_completa",
    "page": 1,
    "xMm": 10.94,
    "yMm": 62.17,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_plaq",
    "label": "plaquetas",
    "dataKey": "clinical.cb.plaquetas",
    "page": 1,
    "xMm": 10.94,
    "yMm": 65.3,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_retic",
    "label": "reticulocitos",
    "dataKey": "clinical.cb.reticulocitos",
    "page": 1,
    "xMm": 10.94,
    "yMm": 68.83,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_vsg",
    "label": "vsg",
    "dataKey": "clinical.cb.vsg",
    "page": 1,
    "xMm": 10.94,
    "yMm": 71.96,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_eosin",
    "label": "eosinofilos",
    "dataKey": "clinical.cb.eosinofilos",
    "page": 1,
    "xMm": 10.94,
    "yMm": 74.69,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_rh",
    "label": "grupo_rh",
    "dataKey": "clinical.cb.grupo_rh",
    "page": 1,
    "xMm": 10.94,
    "yMm": 78.02,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_frotis",
    "label": "frotis",
    "dataKey": "clinical.cb.frotis",
    "page": 1,
    "xMm": 10.94,
    "yMm": 81.15,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_pt",
    "label": "pt",
    "dataKey": "clinical.cb.pt",
    "page": 1,
    "xMm": 10.94,
    "yMm": 89.5,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_ptt",
    "label": "ptt",
    "dataKey": "clinical.cb.ptt",
    "page": 1,
    "xMm": 10.94,
    "yMm": 92.63,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_tsangria",
    "label": "tiempo_sangria",
    "dataKey": "clinical.cb.tiempo_sangria",
    "page": 1,
    "xMm": 10.94,
    "yMm": 95.76,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_tretrac",
    "label": "tiempo_retraccion",
    "dataKey": "clinical.cb.tiempo_retraccion",
    "page": 1,
    "xMm": 10.94,
    "yMm": 99.1,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_fibrin",
    "label": "fibrinogeno",
    "dataKey": "clinical.cb.fibrinogeno",
    "page": 1,
    "xMm": 10.94,
    "yMm": 102.37,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_dimerod",
    "label": "dimero_d",
    "dataKey": "clinical.cb.dimero_d",
    "page": 1,
    "xMm": 11,
    "yMm": 105.5,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_glicemia",
    "label": "glicemia",
    "dataKey": "clinical.cb.glicemia",
    "page": 1,
    "xMm": 10.94,
    "yMm": 113.33,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_glicemia_post",
    "label": "glicemia_post",
    "dataKey": "clinical.cb.glicemia_post",
    "page": 1,
    "xMm": 10.94,
    "yMm": 116.46,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_curva_tol",
    "label": "curva_tolerancia",
    "dataKey": "clinical.cb.curva_tolerancia",
    "page": 1,
    "xMm": 11,
    "yMm": 119.3,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_urea",
    "label": "urea",
    "dataKey": "clinical.cb.urea",
    "page": 1,
    "xMm": 10.94,
    "yMm": 124.49,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_creatinina",
    "label": "creatinina",
    "dataKey": "clinical.cb.creatinina",
    "page": 1,
    "xMm": 10.94,
    "yMm": 127.62,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_acido_urico",
    "label": "acido_urico",
    "dataKey": "clinical.cb.acido_urico",
    "page": 1,
    "xMm": 10.94,
    "yMm": 130.75,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_colest",
    "label": "colesterol",
    "dataKey": "clinical.cb.colesterol",
    "page": 1,
    "xMm": 10.94,
    "yMm": 134.28,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_hdl",
    "label": "hdl",
    "dataKey": "clinical.cb.hdl",
    "page": 1,
    "xMm": 10.94,
    "yMm": 137.41,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_ldl",
    "label": "ldl",
    "dataKey": "clinical.cb.ldl",
    "page": 1,
    "xMm": 10.94,
    "yMm": 140.67,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_trigli",
    "label": "trigliceridos",
    "dataKey": "clinical.cb.trigliceridos",
    "page": 1,
    "xMm": 10.94,
    "yMm": 143.8,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_tgo",
    "label": "tgo",
    "dataKey": "clinical.cb.tgo",
    "page": 1,
    "xMm": 10.94,
    "yMm": 146.93,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_tgp",
    "label": "tgp",
    "dataKey": "clinical.cb.tgp",
    "page": 1,
    "xMm": 11,
    "yMm": 150.1,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_ggt",
    "label": "ggt",
    "dataKey": "clinical.cb.ggt",
    "page": 1,
    "xMm": 10.94,
    "yMm": 153.06,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_fosf_alc",
    "label": "fosfatasa_alcalina",
    "dataKey": "clinical.cb.fosfatasa_alcalina",
    "page": 1,
    "xMm": 10.94,
    "yMm": 156.19,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_ldh",
    "label": "ldh",
    "dataKey": "clinical.cb.ldh",
    "page": 1,
    "xMm": 10.94,
    "yMm": 159.32,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_lipasa",
    "label": "lipasa",
    "dataKey": "clinical.cb.lipasa",
    "page": 1,
    "xMm": 10.94,
    "yMm": 162.45,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_amilasa",
    "label": "amilasa",
    "dataKey": "clinical.cb.amilasa",
    "page": 1,
    "xMm": 10.94,
    "yMm": 165.72,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_bilirrubina",
    "label": "bilirrubina",
    "dataKey": "clinical.cb.bilirrubina",
    "page": 1,
    "xMm": 10.94,
    "yMm": 168.71,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_calcio",
    "label": "calcio",
    "dataKey": "clinical.cb.calcio",
    "page": 1,
    "xMm": 10.94,
    "yMm": 171.84,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_fosforo",
    "label": "fosforo",
    "dataKey": "clinical.cb.fosforo",
    "page": 1,
    "xMm": 10.94,
    "yMm": 174.98,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_magnesio",
    "label": "magnesio",
    "dataKey": "clinical.cb.magnesio",
    "page": 1,
    "xMm": 10.94,
    "yMm": 178.11,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_sodio",
    "label": "sodio",
    "dataKey": "clinical.cb.sodio",
    "page": 1,
    "xMm": 11,
    "yMm": 181.1,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_potasio",
    "label": "potasio",
    "dataKey": "clinical.cb.potasio",
    "page": 1,
    "xMm": 10.94,
    "yMm": 184.56,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_cloro",
    "label": "cloro",
    "dataKey": "clinical.cb.cloro",
    "page": 1,
    "xMm": 10.94,
    "yMm": 187.57,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_hierro",
    "label": "hierro",
    "dataKey": "clinical.cb.hierro",
    "page": 1,
    "xMm": 10.94,
    "yMm": 190.69,
    "widthMm": 3.45,
    "heightMm": 2
  },
  {
    "id": "cb_tropo",
    "label": "troponina",
    "dataKey": "clinical.cb.troponina",
    "page": 1,
    "xMm": 62.15,
    "yMm": 62.39,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_ck",
    "label": "ck",
    "dataKey": "clinical.cb.ck",
    "page": 1,
    "xMm": 62.3,
    "yMm": 65.3,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_ckmb",
    "label": "ck_mb",
    "dataKey": "clinical.cb.ck_mb",
    "page": 1,
    "xMm": 62.15,
    "yMm": 68.74,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_pcr",
    "label": "pcr",
    "dataKey": "clinical.cb.pcr",
    "page": 1,
    "xMm": 62.07,
    "yMm": 75.77,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_hcg",
    "label": "embarazo",
    "dataKey": "clinical.cb.embarazo",
    "page": 1,
    "xMm": 62.07,
    "yMm": 79.3,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_vdrl",
    "label": "vdrl",
    "dataKey": "clinical.cb.vdrl",
    "page": 1,
    "xMm": 62.07,
    "yMm": 82.43,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_hiv",
    "label": "hiv",
    "dataKey": "clinical.cb.hiv",
    "page": 1,
    "xMm": 62.07,
    "yMm": 85.56,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_asto",
    "label": "asto",
    "dataKey": "clinical.cb.asto",
    "page": 1,
    "xMm": 62.07,
    "yMm": 88.69,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_ratest",
    "label": "ra_test",
    "dataKey": "clinical.cb.ra_test",
    "page": 1,
    "xMm": 62.07,
    "yMm": 92.02,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_monotest",
    "label": "mono_test",
    "dataKey": "clinical.cb.mono_test",
    "page": 1,
    "xMm": 62.07,
    "yMm": 94.79,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_fta",
    "label": "fta",
    "dataKey": "clinical.cb.fta",
    "page": 1,
    "xMm": 61.8,
    "yMm": 103.4,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_cortisol",
    "label": "cortisol",
    "dataKey": "clinical.cb.cortisol",
    "page": 1,
    "xMm": 61.87,
    "yMm": 106.66,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_lh",
    "label": "lh",
    "dataKey": "clinical.cb.lh",
    "page": 1,
    "xMm": 61.87,
    "yMm": 109.8,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_fsh",
    "label": "fsh",
    "dataKey": "clinical.cb.fsh",
    "page": 1,
    "xMm": 61.87,
    "yMm": 112.93,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_prolactina",
    "label": "prolactina",
    "dataKey": "clinical.cb.prolactina",
    "page": 1,
    "xMm": 61.87,
    "yMm": 115.98,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_estradiol",
    "label": "estradiol",
    "dataKey": "clinical.cb.estradiol",
    "page": 1,
    "xMm": 61.8,
    "yMm": 118.9,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_progesterona",
    "label": "progesterona",
    "dataKey": "clinical.cb.progesterona",
    "page": 1,
    "xMm": 62,
    "yMm": 122.1,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_t3",
    "label": "t3",
    "dataKey": "clinical.cb.t3",
    "page": 1,
    "xMm": 61.87,
    "yMm": 125.58,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_t4",
    "label": "t4",
    "dataKey": "clinical.cb.t4",
    "page": 1,
    "xMm": 61.87,
    "yMm": 128.71,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_tsh",
    "label": "tsh",
    "dataKey": "clinical.cb.tsh",
    "page": 1,
    "xMm": 61.87,
    "yMm": 132.1,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_testosterona",
    "label": "testosterona",
    "dataKey": "clinical.cb.testosterona",
    "page": 1,
    "xMm": 61.87,
    "yMm": 135.23,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_dhea",
    "label": "dhea_so4",
    "dataKey": "clinical.cb.dhea_so4",
    "page": 1,
    "xMm": 61.87,
    "yMm": 138.36,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_cea",
    "label": "cea",
    "dataKey": "clinical.cb.cea",
    "page": 1,
    "xMm": 61.87,
    "yMm": 141.49,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_ca125",
    "label": "ca125",
    "dataKey": "clinical.cb.ca125",
    "page": 1,
    "xMm": 61.87,
    "yMm": 144.63,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_ca19_9",
    "label": "ca19_9",
    "dataKey": "clinical.cb.ca19_9",
    "page": 1,
    "xMm": 61.87,
    "yMm": 147.89,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_ca15_3",
    "label": "ca15_3",
    "dataKey": "clinical.cb.ca15_3",
    "page": 1,
    "xMm": 61.87,
    "yMm": 150.89,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_ca72_4",
    "label": "ca72_4",
    "dataKey": "clinical.cb.ca72_4",
    "page": 1,
    "xMm": 61.87,
    "yMm": 154.28,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_curva_insul",
    "label": "curva_insulina",
    "dataKey": "clinical.cb.curva_insulina",
    "page": 1,
    "xMm": 62,
    "yMm": 157.6,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_citomegalo",
    "label": "citomegalovirus",
    "dataKey": "clinical.cb.citomegalovirus",
    "page": 1,
    "xMm": 61.87,
    "yMm": 160.81,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_epstein",
    "label": "epstein_barr",
    "dataKey": "clinical.cb.epstein_barr",
    "page": 1,
    "xMm": 61.8,
    "yMm": 163.9,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_dengue",
    "label": "dengue",
    "dataKey": "clinical.cb.dengue",
    "page": 1,
    "xMm": 62,
    "yMm": 167.1,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_insul_basal",
    "label": "insulina_basal",
    "dataKey": "clinical.cb.insulina_basal",
    "page": 1,
    "xMm": 61.8,
    "yMm": 170.4,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_insul_post",
    "label": "insulina_post",
    "dataKey": "clinical.cb.insulina_post",
    "page": 1,
    "xMm": 61.9,
    "yMm": 173.59,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_hba1c",
    "label": "hb_glicosilada",
    "dataKey": "clinical.cb.hb_glicosilada",
    "page": 1,
    "xMm": 61.9,
    "yMm": 176.72,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_betahcg",
    "label": "beta_hcg",
    "dataKey": "clinical.cb.beta_hcg",
    "page": 1,
    "xMm": 61.95,
    "yMm": 179.87,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_procalcit",
    "label": "procalcitonina",
    "dataKey": "clinical.cb.procalcitonina",
    "page": 1,
    "xMm": 61.9,
    "yMm": 182.94,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_ferritina",
    "label": "ferritina",
    "dataKey": "clinical.cb.ferritina",
    "page": 1,
    "xMm": 62,
    "yMm": 186.1,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_covid",
    "label": "covid",
    "dataKey": "clinical.cb.covid",
    "page": 1,
    "xMm": 61.9,
    "yMm": 189.27,
    "widthMm": 3.27,
    "heightMm": 2
  },
  {
    "id": "cb_hpylori",
    "label": "helicobacter",
    "dataKey": "clinical.cb.helicobacter",
    "page": 1,
    "xMm": 105.68,
    "yMm": 61.42,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_hpylori_igg",
    "label": "helicobacter_igg",
    "dataKey": "clinical.cb.helicobacter_igg",
    "page": 1,
    "xMm": 105.68,
    "yMm": 64.19,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_hepa",
    "label": "hepatitis_a",
    "dataKey": "clinical.cb.hepatitis_a",
    "page": 1,
    "xMm": 105.5,
    "yMm": 67.1,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_hepb_sup",
    "label": "hepatitis_b_sup",
    "dataKey": "clinical.cb.hepatitis_b_sup",
    "page": 1,
    "xMm": 105.68,
    "yMm": 70.39,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_hepb_core",
    "label": "hepatitis_b_core",
    "dataKey": "clinical.cb.hepatitis_b_core",
    "page": 1,
    "xMm": 105.68,
    "yMm": 73.52,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_hepc",
    "label": "hepatitis_c",
    "dataKey": "clinical.cb.hepatitis_c",
    "page": 1,
    "xMm": 105.68,
    "yMm": 76.65,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_psa",
    "label": "psa",
    "dataKey": "clinical.cb.psa",
    "page": 1,
    "xMm": 105.68,
    "yMm": 80.11,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_toxo",
    "label": "toxoplasma",
    "dataKey": "clinical.cb.toxoplasma",
    "page": 1,
    "xMm": 105.68,
    "yMm": 83.24,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_ige",
    "label": "ige",
    "dataKey": "clinical.cb.ige",
    "page": 1,
    "xMm": 105.68,
    "yMm": 86.37,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_valproico",
    "label": "valproico",
    "dataKey": "clinical.cb.valproico",
    "page": 1,
    "xMm": 105.68,
    "yMm": 89.5,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_fenobarb",
    "label": "fenobarbital",
    "dataKey": "clinical.cb.fenobarbital",
    "page": 1,
    "xMm": 105.68,
    "yMm": 92.58,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_carbamazepina",
    "label": "carbamazepina",
    "dataKey": "clinical.cb.carbamazepina",
    "page": 1,
    "xMm": 105.5,
    "yMm": 95.6,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_cocaina",
    "label": "cocaina",
    "dataKey": "clinical.cb.cocaina",
    "page": 1,
    "xMm": 105.68,
    "yMm": 98.84,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_canabino",
    "label": "canabinoides",
    "dataKey": "clinical.cb.canabinoides",
    "page": 1,
    "xMm": 105.68,
    "yMm": 101.97,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_orina",
    "label": "orina",
    "dataKey": "clinical.cb.orina",
    "page": 1,
    "xMm": 105.7,
    "yMm": 110.12,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_elec_ur",
    "label": "electrolitos_urinarios",
    "dataKey": "clinical.cb.electrolitos_urinarios",
    "page": 1,
    "xMm": 105.7,
    "yMm": 113.25,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_ca_cr",
    "label": "calcio_creatinina",
    "dataKey": "clinical.cb.calcio_creatinina",
    "page": 1,
    "xMm": 105.7,
    "yMm": 116.38,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_p_cr",
    "label": "fosforo_creatinina",
    "dataKey": "clinical.cb.fosforo_creatinina",
    "page": 1,
    "xMm": 105.7,
    "yMm": 119.51,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_au_cr",
    "label": "acido_urico_creatinina",
    "dataKey": "clinical.cb.acido_urico_creatinina",
    "page": 1,
    "xMm": 105.7,
    "yMm": 122.64,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_reab_fosf",
    "label": "reabsorcion_fosforo",
    "dataKey": "clinical.cb.reabsorcion_fosforo",
    "page": 1,
    "xMm": 106,
    "yMm": 125.6,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_depur_cr",
    "label": "depuracion_creatinina",
    "dataKey": "clinical.cb.depuracion_creatinina",
    "page": 1,
    "xMm": 105.7,
    "yMm": 128.99,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_prot_24",
    "label": "proteinuria_24h",
    "dataKey": "clinical.cb.proteinuria_24h",
    "page": 1,
    "xMm": 105.7,
    "yMm": 132.22,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_heces",
    "label": "heces",
    "dataKey": "clinical.cb.heces",
    "page": 1,
    "xMm": 105.7,
    "yMm": 140.13,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_leugrama",
    "label": "leugrama",
    "dataKey": "clinical.cb.leugrama",
    "page": 1,
    "xMm": 105.5,
    "yMm": 143.1,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_sudan",
    "label": "sudan_iii",
    "dataKey": "clinical.cb.sudan_iii",
    "page": 1,
    "xMm": 105.73,
    "yMm": 146.26,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_azucares",
    "label": "azucares_reductores",
    "dataKey": "clinical.cb.azucares_reductores",
    "page": 1,
    "xMm": 105.72,
    "yMm": 149.3,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_sangre_oc",
    "label": "sangre_oculta",
    "dataKey": "clinical.cb.sangre_oculta",
    "page": 1,
    "xMm": 105.72,
    "yMm": 152.43,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_urocultivo",
    "label": "urocultivo",
    "dataKey": "clinical.cb.urocultivo",
    "page": 1,
    "xMm": 105.7,
    "yMm": 164.33,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_cultivo_ab",
    "label": "cultivo_antibiograma",
    "dataKey": "clinical.cb.cultivo_antibiograma",
    "page": 1,
    "xMm": 105.7,
    "yMm": 167.33,
    "widthMm": 3.5,
    "heightMm": 2
  },
  {
    "id": "cb_bk",
    "label": "bk",
    "dataKey": "clinical.cb.bk",
    "page": 1,
    "xMm": 105.72,
    "yMm": 173.2,
    "widthMm": 3.5,
    "heightMm": 2
  },
export const LAB_CANONICAL_PAGE_2: readonly LabCheckboxDef[] = [
  { id: 'orden_p2.radiologia', label: 'Radiología Simple / Contrastada', page: 2, xMm: 19.70, yMm: 85.41, widthMm: 9.09, heightMm: 6.13, dataKey: 'clinical.checkbox.radiologia' },
  { id: 'orden_p2.tac_cerebral', label: 'Tomografía Axial Computarizada', page: 2, xMm: 19.70, yMm: 98.55, widthMm: 9.09, heightMm: 6.13, dataKey: 'clinical.checkbox.tac' },
  { id: 'orden_p2.rmn', label: 'Resonancia Magnética Nuclear', page: 2, xMm: 19.70, yMm: 111.68, widthMm: 9.09, heightMm: 6.13, dataKey: 'clinical.checkbox.rmn' },
  { id: 'orden_p2.eeg', label: 'Electroencefalograma', page: 2, xMm: 19.70, yMm: 124.81, widthMm: 9.09, heightMm: 6.13, dataKey: 'clinical.checkbox.eeg' },
  { id: 'orden_p2.emg', label: 'Electromiografía', page: 2, xMm: 19.70, yMm: 137.94, widthMm: 9.09, heightMm: 6.13, dataKey: 'clinical.checkbox.emg' },
  { id: 'orden_p2.pess', label: 'Potenciales Evocados Somatosensoriales', page: 2, xMm: 19.70, yMm: 151.08, widthMm: 9.09, heightMm: 6.13, dataKey: 'clinical.checkbox.pess' },
  { id: 'orden_p2.valoracion', label: 'Valoración Pre-operatoria / Interconsulta', page: 2, xMm: 19.70, yMm: 164.21, widthMm: 9.09, heightMm: 6.13, dataKey: 'clinical.checkbox.valoracion' }
] as const;

export const LAB_CANONICAL_PAGE_1 = CANONICAL_LAB_REGISTRY.slice(0, 106);
export const LAB_CANONICAL_REGISTRY: readonly LabCheckboxDef[] = [...LAB_CANONICAL_PAGE_1, ...LAB_CANONICAL_PAGE_2];
export const LAB_CANONICAL = LAB_CANONICAL_REGISTRY;
// Mantener CANONICAL_LAB_REGISTRY sincronizado para retrocompatibilidad
CANONICAL_LAB_REGISTRY.splice(106, CANONICAL_LAB_REGISTRY.length - 106, ...LAB_CANONICAL_PAGE_2);

