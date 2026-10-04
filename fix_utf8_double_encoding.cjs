const fs = require('fs');

function fixFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');

  // Fix UTF-8 double encoding issues (UTF-8 bytes interpreted as Windows-1252)
  const replacements = [
    { from: /C\u00C3\u00A9dula/g, to: 'Cédula' },
    { from: /Tel\u00C3\u00A9fono/g, to: 'Teléfono' },
    { from: /R\u00C3\u00A9cipe/g, to: 'Récipe' },
    { from: /r\u00C3\u00A9cipe/g, to: 'récipe' },
    { from: /M\u00C3\u00A9dico/g, to: 'Médico' },
    { from: /m\u00C3\u00A9dico/g, to: 'médico' },
    { from: /Cl\u00C3\u00ADnica/g, to: 'Clínica' },
    { from: /cl\u00C3\u00ADnica/g, to: 'clínica' },
    { from: /Cl\u00C3\u00ADnico/g, to: 'Clínico' },
    { from: /cl\u00C3\u00ADnico/g, to: 'clínico' },
    { from: /Diagn\u00C3\u00B3stico/g, to: 'Diagnóstico' },
    { from: /diagn\u00C3\u00B3stico/g, to: 'diagnóstico' },
    { from: /Quir\u00C3\u00BArgica/g, to: 'Quirúrgica' },
    { from: /quir\u00C3\u00BArgica/g, to: 'quirúrgica' },
    { from: /Im\u00C3\u00A1genes/g, to: 'Imágenes' },
    { from: /im\u00C3\u00A1genes/g, to: 'imágenes' },
    { from: /Estaci\u00C3\u00B3n/g, to: 'Estación' },
    { from: /estaci\u00C3\u00B3n/g, to: 'estación' },
    { from: /Configuraci\u00C3\u00B3n/g, to: 'Configuración' },
    { from: /configuraci\u00C3\u00B3n/g, to: 'configuración' },
    { from: /Papeler\u00C3\u00ADa/g, to: 'Papelería' },
    { from: /papeler\u00C3\u00ADa/g, to: 'papelería' },
    { from: /T\u00C3\u00A9cnica/g, to: 'Técnica' },
    { from: /t\u00C3\u00A9cnica/g, to: 'técnica' },
    { from: /A\u00C3\u00B1o/g, to: 'Año' },
    { from: /a\u00C3\u00B1o/g, to: 'año' },
    { from: /N\u00C3\u00BAmero/g, to: 'Número' },
    { from: /n\u00C3\u00BAmero/g, to: 'número' },
    { from: /Occi\u00C3\u00B3n/g, to: 'Opción' }, // just in case
    { from: /Opci\u00C3\u00B3n/g, to: 'Opción' },
    { from: /opci\u00C3\u00B3n/g, to: 'opción' },
    { from: /F\u00C3\u00A1rmaco/g, to: 'Fármaco' },
    { from: /f\u00C3\u00A1rmaco/g, to: 'fármaco' },
    { from: /Analg\u00C3\u00A9sico/g, to: 'Analgésico' },
    { from: /analg\u00C3\u00A9sico/g, to: 'analgésico' },
    { from: /Posolog\u00C3\u00ADa/g, to: 'Posología' },
    { from: /posolog\u00C3\u00ADa/g, to: 'posología' },
    { from: /D\u00C3\u00ADa/g, to: 'Día' },
    { from: /d\u00C3\u00ADa/g, to: 'día' },
    { from: /G\u00C3\u00A1strico/g, to: 'Gástrico' },
    { from: /g\u00C3\u00A1strico/g, to: 'gástrico' },
    { from: /S\u00C3\u00ADntesis/g, to: 'Síntesis' },
    { from: /s\u00C3\u00ADntesis/g, to: 'síntesis' },
    { from: /C\u00C3\u00A1psula/g, to: 'Cápsula' },
    { from: /c\u00C3\u00A1psula/g, to: 'cápsula' },
    { from: /Autenticaci\u00C3\u00B3n/g, to: 'Autenticación' },
    { from: /autenticaci\u00C3\u00B3n/g, to: 'autenticación' },
    { from: /\u00C3\u00AD/g, to: 'í' },
    { from: /\u00C3\u00B3/g, to: 'ó' },
    { from: /\u00C3\u00A1/g, to: 'á' },
    { from: /\u00C3\u00A9/g, to: 'é' },
    { from: /\u00C3\u00BA/g, to: 'ú' },
    { from: /\u00C3\u00B1/g, to: 'ñ' },
    { from: /\u00C3\u008D/g, to: 'Í' },
    { from: /\u00C3\u0093/g, to: 'Ó' },
    { from: /\u00C3\u0081/g, to: 'Á' },
    { from: /\u00C3\u0089/g, to: 'É' },
    { from: /\u00C3\u009A/g, to: 'Ú' },
    { from: /\u00C3\u0091/g, to: 'Ñ' }
  ];

  let original = c;
  for (const r of replacements) {
    c = c.replace(r.from, r.to);
  }
  
  if (original !== c) {
    fs.writeFileSync(filePath, c);
    console.log("Fixed encoding in " + filePath);
  }
}

const glob = require('fs').readdirSync('src/components').filter(f => f.endsWith('.tsx'));
glob.forEach(f => fixFile('src/components/' + f));