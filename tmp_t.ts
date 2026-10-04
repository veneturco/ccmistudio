import { SemanticDataMapperV2 } from './src/calibration/SemanticDataMapperV2';
const labs = ['Hematología Completa','Plaquetas','Eritrosedimentación (VSG)','Pt (Tiempo Protrombina)','Ptt (Tiempo Parcial de Tromboplastina)','Dosificación de Fibrinógeno','Glicemia','Urea','Creatinina','HIV','VDRL','Grupo Sanguíneo, Factor Rh (D)','Proteina "C" Reactiva','Examen General de Orina'];
const labTests: any = {}; labs.forEach(l => labTests[l] = true);
const r: any = SemanticDataMapperV2.mapToSemanticDictionary({ patient:{fullName:'X',idNumber:'1'}, clinical:{ labTests, neuroimagingTests:{'RADIOLOGÍA':true,'VALORACIÓN':true} } } as any);
console.log(JSON.stringify(r.clinical.cb));
console.log(JSON.stringify(r.clinical.checkbox));
