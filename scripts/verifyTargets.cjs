const fs = require('fs');
const content = fs.readFileSync('public/assets/index-master-v2.js', 'utf8');

const targets = [
  '{type:"text",id:"left_patient_name",pageIndex:0,dataKey:"patient.fullName",geometry:{xMm:25,yMm:44.5,widthMm:75,heightMm:6.5}',
  '{type:"text",id:"left_patient_id",pageIndex:0,dataKey:"patient.idNumber",geometry:{xMm:15,yMm:52.8,widthMm:32,heightMm:6}',
  '{type:"text",id:"left_patient_age",pageIndex:0,dataKey:"patient.age",geometry:{xMm:51,yMm:52.8,widthMm:18,heightMm:6}',
  '{type:"text",id:"left_date",pageIndex:0,dataKey:"document.date",geometry:{xMm:74,yMm:52.8,widthMm:25,heightMm:6}',
  '{type:"multilineText",id:"left_rx_body",pageIndex:0,dataKey:"recipe.pharmacy",geometry:{xMm:10,yMm:72,widthMm:89,heightMm:172}',
  '{type:"text",id:"right_patient_name",pageIndex:0,dataKey:"patient.fullName",geometry:{xMm:129,yMm:44.5,widthMm:75,heightMm:6.5}',
  '{type:"text",id:"right_patient_id",pageIndex:0,dataKey:"patient.idNumber",geometry:{xMm:119,yMm:52.8,widthMm:32,heightMm:6}',
  '{type:"text",id:"right_patient_age",pageIndex:0,dataKey:"patient.age",geometry:{xMm:155,yMm:52.8,widthMm:18,heightMm:6}',
  '{type:"text",id:"right_date",pageIndex:0,dataKey:"document.date",geometry:{xMm:178,yMm:52.8,widthMm:25,heightMm:6}',
  '{type:"multilineText",id:"right_indications_body",pageIndex:0,dataKey:"recipe.indications",geometry:{xMm:114,yMm:72,widthMm:89,heightMm:172}',
  'Ut.left_talon.patientFullName.yMm??44.5',
  'Ut.left_talon.patientId.yMm??52.8',
  'Ut.left_talon.patientAge.yMm??52.8',
  'Ut.left_talon.date.yMm??52.8',
  'Ut.left_talon.rxBody.yMm??72',
  'Ut.right_talon.patientFullName.yMm??44.5',
  'Ut.right_talon.patientId.yMm??52.8',
  'Ut.right_talon.patientAge.yMm??52.8',
  'Ut.right_talon.date.yMm??52.8',
  'Ut.right_talon.indicationsBody.yMm??72',
  'I=jc(p,{xMm:25,yMm:44.5,widthMm:75,heightMm:6.5,fontSizePt:9.5})',
  'S=jc(g,{xMm:15,yMm:52.8,widthMm:32,heightMm:6,fontSizePt:9.5})',
  'j=jc(x,{xMm:51,yMm:52.8,widthMm:18,heightMm:6,fontSizePt:9.5})',
  'k=jc(y,{xMm:74,yMm:52.8,widthMm:25,heightMm:6,fontSizePt:9.5})',
  'D=jc(w,{xMm:10,yMm:72,widthMm:89,heightMm:172,fontSizePt:10})',
  'P=jc(B,{xMm:129,yMm:44.5,widthMm:75,heightMm:6.5,fontSizePt:9.5})',
  'K=jc(T,{xMm:119,yMm:52.8,widthMm:32,heightMm:6,fontSizePt:9.5})',
  'ee=jc(M,{xMm:155,yMm:52.8,widthMm:18,heightMm:6,fontSizePt:9.5})',
  'Y=jc(R,{xMm:178,yMm:52.8,widthMm:25,heightMm:6,fontSizePt:9.5})',
  'ae=jc(V,{xMm:114,yMm:72,widthMm:89,heightMm:172,fontSizePt:10})'
];

let allOk = true;
targets.forEach((t, i) => {
  const found = content.includes(t);
  if (!found) {
    console.log('FAIL Target ' + i + ': ' + t);
    allOk = false;
  }
});

if (allOk) {
  console.log('ALL 30 TARGETS VERIFIED PERFECTLY IN BUNDLE!');
}
