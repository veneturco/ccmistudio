const fs = require('fs');

const replacements = [
  // Place 1: Master Template Registry
  {
    from: '{type:"text",id:"left_patient_name",pageIndex:0,dataKey:"patient.fullName",geometry:{xMm:25,yMm:44.5,widthMm:75,heightMm:6.5}',
    to: '{type:"text",id:"left_patient_name",pageIndex:0,dataKey:"patient.fullName",geometry:{xMm:25,yMm:52,widthMm:75,heightMm:5.5}'
  },
  {
    from: '{type:"text",id:"left_patient_id",pageIndex:0,dataKey:"patient.idNumber",geometry:{xMm:15,yMm:52.8,widthMm:32,heightMm:6}',
    to: '{type:"text",id:"left_patient_id",pageIndex:0,dataKey:"patient.idNumber",geometry:{xMm:15,yMm:60.5,widthMm:32,heightMm:5}'
  },
  {
    from: '{type:"text",id:"left_patient_age",pageIndex:0,dataKey:"patient.age",geometry:{xMm:51,yMm:52.8,widthMm:18,heightMm:6}',
    to: '{type:"text",id:"left_patient_age",pageIndex:0,dataKey:"patient.age",geometry:{xMm:51,yMm:60.5,widthMm:18,heightMm:5}'
  },
  {
    from: '{type:"text",id:"left_date",pageIndex:0,dataKey:"document.date",geometry:{xMm:74,yMm:52.8,widthMm:25,heightMm:6}',
    to: '{type:"text",id:"left_date",pageIndex:0,dataKey:"document.date",geometry:{xMm:74,yMm:60.5,widthMm:25,heightMm:5}'
  },
  {
    from: '{type:"multilineText",id:"left_rx_body",pageIndex:0,dataKey:"recipe.pharmacy",geometry:{xMm:10,yMm:72,widthMm:89,heightMm:172}',
    to: '{type:"multilineText",id:"left_rx_body",pageIndex:0,dataKey:"recipe.pharmacy",geometry:{xMm:10,yMm:78,widthMm:89,heightMm:165}'
  },
  {
    from: '{type:"text",id:"right_patient_name",pageIndex:0,dataKey:"patient.fullName",geometry:{xMm:129,yMm:44.5,widthMm:75,heightMm:6.5}',
    to: '{type:"text",id:"right_patient_name",pageIndex:0,dataKey:"patient.fullName",geometry:{xMm:129,yMm:52,widthMm:75,heightMm:5.5}'
  },
  {
    from: '{type:"text",id:"right_patient_id",pageIndex:0,dataKey:"patient.idNumber",geometry:{xMm:119,yMm:52.8,widthMm:32,heightMm:6}',
    to: '{type:"text",id:"right_patient_id",pageIndex:0,dataKey:"patient.idNumber",geometry:{xMm:119,yMm:60.5,widthMm:32,heightMm:5}'
  },
  {
    from: '{type:"text",id:"right_patient_age",pageIndex:0,dataKey:"patient.age",geometry:{xMm:155,yMm:52.8,widthMm:18,heightMm:6}',
    to: '{type:"text",id:"right_patient_age",pageIndex:0,dataKey:"patient.age",geometry:{xMm:155,yMm:60.5,widthMm:18,heightMm:5}'
  },
  {
    from: '{type:"text",id:"right_date",pageIndex:0,dataKey:"document.date",geometry:{xMm:178,yMm:52.8,widthMm:25,heightMm:6}',
    to: '{type:"text",id:"right_date",pageIndex:0,dataKey:"document.date",geometry:{xMm:178,yMm:60.5,widthMm:25,heightMm:5}'
  },
  {
    from: '{type:"multilineText",id:"right_indications_body",pageIndex:0,dataKey:"recipe.indications",geometry:{xMm:114,yMm:72,widthMm:89,heightMm:172}',
    to: '{type:"multilineText",id:"right_indications_body",pageIndex:0,dataKey:"recipe.indications",geometry:{xMm:114,yMm:78,widthMm:89,heightMm:165}'
  },

  // Place 2: Semantic Data Mapper Defaults
  {
    from: 'Ut.left_talon.patientFullName.yMm??44.5',
    to: 'Ut.left_talon.patientFullName.yMm??52'
  },
  {
    from: 'Ut.left_talon.patientId.yMm??52.8',
    to: 'Ut.left_talon.patientId.yMm??60.5'
  },
  {
    from: 'Ut.left_talon.patientAge.yMm??52.8',
    to: 'Ut.left_talon.patientAge.yMm??60.5'
  },
  {
    from: 'Ut.left_talon.date.yMm??52.8',
    to: 'Ut.left_talon.date.yMm??60.5'
  },
  {
    from: 'Ut.left_talon.rxBody.yMm??72',
    to: 'Ut.left_talon.rxBody.yMm??78'
  },
  {
    from: 'Ut.right_talon.patientFullName.yMm??44.5',
    to: 'Ut.right_talon.patientFullName.yMm??52'
  },
  {
    from: 'Ut.right_talon.patientId.yMm??52.8',
    to: 'Ut.right_talon.patientId.yMm??60.5'
  },
  {
    from: 'Ut.right_talon.patientAge.yMm??52.8',
    to: 'Ut.right_talon.patientAge.yMm??60.5'
  },
  {
    from: 'Ut.right_talon.date.yMm??52.8',
    to: 'Ut.right_talon.date.yMm??60.5'
  },
  {
    from: 'Ut.right_talon.indicationsBody.yMm??72',
    to: 'Ut.right_talon.indicationsBody.yMm??78'
  },

  // Place 3: Sheet Renderer Fallbacks
  {
    from: 'I=jc(p,{xMm:25,yMm:44.5,widthMm:75,heightMm:6.5,fontSizePt:9.5})',
    to: 'I=jc(p,{xMm:25,yMm:52,widthMm:75,heightMm:5.5,fontSizePt:9.5})'
  },
  {
    from: 'S=jc(g,{xMm:15,yMm:52.8,widthMm:32,heightMm:6,fontSizePt:9.5})',
    to: 'S=jc(g,{xMm:15,yMm:60.5,widthMm:32,heightMm:5,fontSizePt:9.5})'
  },
  {
    from: 'j=jc(x,{xMm:51,yMm:52.8,widthMm:18,heightMm:6,fontSizePt:9.5})',
    to: 'j=jc(x,{xMm:51,yMm:60.5,widthMm:18,heightMm:5,fontSizePt:9.5})'
  },
  {
    from: 'k=jc(y,{xMm:74,yMm:52.8,widthMm:25,heightMm:6,fontSizePt:9.5})',
    to: 'k=jc(y,{xMm:74,yMm:60.5,widthMm:25,heightMm:5,fontSizePt:9.5})'
  },
  {
    from: 'D=jc(w,{xMm:10,yMm:72,widthMm:89,heightMm:172,fontSizePt:10})',
    to: 'D=jc(w,{xMm:10,yMm:78,widthMm:89,heightMm:165,fontSizePt:10})'
  },
  {
    from: 'P=jc(B,{xMm:129,yMm:44.5,widthMm:75,heightMm:6.5,fontSizePt:9.5})',
    to: 'P=jc(B,{xMm:129,yMm:52,widthMm:75,heightMm:5.5,fontSizePt:9.5})'
  },
  {
    from: 'K=jc(T,{xMm:119,yMm:52.8,widthMm:32,heightMm:6,fontSizePt:9.5})',
    to: 'K=jc(T,{xMm:119,yMm:60.5,widthMm:32,heightMm:5,fontSizePt:9.5})'
  },
  {
    from: 'ee=jc(M,{xMm:155,yMm:52.8,widthMm:18,heightMm:6,fontSizePt:9.5})',
    to: 'ee=jc(M,{xMm:155,yMm:60.5,widthMm:18,heightMm:5,fontSizePt:9.5})'
  },
  {
    from: 'Y=jc(R,{xMm:178,yMm:52.8,widthMm:25,heightMm:6,fontSizePt:9.5})',
    to: 'Y=jc(R,{xMm:178,yMm:60.5,widthMm:25,heightMm:5,fontSizePt:9.5})'
  },
  {
    from: 'ae=jc(V,{xMm:114,yMm:72,widthMm:89,heightMm:172,fontSizePt:10})',
    to: 'ae=jc(V,{xMm:114,yMm:78,widthMm:89,heightMm:165,fontSizePt:10})'
  }
];

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping (file not found):', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let patchCount = 0;
  for (const { from, to } of replacements) {
    if (content.includes(from)) {
      content = content.replace(from, to);
      patchCount++;
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Patched ${patchCount}/${replacements.length} coordinates in: ${filePath}`);
}

patchFile('public/assets/index-master-v2.js');
patchFile('dist/assets/index-master-v2.js');
console.log('DONE PATCHING BUNDLES WITH CANONICAL V11 PDF GENERATOR COORDINATES!');
