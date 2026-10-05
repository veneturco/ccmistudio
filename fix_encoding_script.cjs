const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/Dashboard.tsx',
  'src/components/QuickAccessWidgetsHub.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const replacements = [
      ['Gonzǭlez', 'González'],
      ['despuǸs', 'después'],
      ['HǸctor', 'Héctor'],
      ['JosǸ', 'José'],
      ['Quirǧrgic', 'Quirúrgic'],
      ['MǸdic', 'Médic'],
      ['cǭpsula', 'cápsula'],
      ['gǭstrico', 'gástrico'],
      ['Tiocolchicsido', 'Tiocolchicósido'],
      ['das', 'días'],
      ['Botn', 'Botón'],
      ['Menǧ', 'Menú'],
      ['Mvil', 'Móvil'],
      ['Papelera', 'Papelería'],
      ['RǸcipe', 'Récipe'],
      ['Configuracin', 'Configuración'],
      ['Sesin', 'Sesión'],
      ['Estadsticas', 'Estadísticas'],
      ['Clnica', 'Clínica'],
      ['Logstico', 'Logístico'],
      ['Prtesis', 'Prótesis'],
      ['Evaluacin', 'Evaluación'],
      ['evolucin', 'evolución'],
      ['regin', 'región'],
      ['fsica', 'física'],
      ['fsico', 'físico'],
      ['TǸcnic', 'Técnic'],
      ['tǸcnic', 'técnic'],
      ['Presentacin', 'Presentación'],
      ['Calibracin', 'Calibración'],
      ['Sincronizacin', 'Sincronización'],
      ['Gestin', 'Gestión'],
      ['Iluminacin', 'Iluminación'],
      ['Instalacin', 'Instalación'],
      ['Navegacin', 'Navegación'],
      ['OPCIǟ?oN', 'OPCIÓN'],
      ['NOTIFICACIǟ?oN', 'NOTIFICACIÓN'],
      ['ǟ', 'Ú'],
      ['?"', '-'],
      ['Ǹ', 'é'],
      ['ǭ', 'á'],
      ['ǧ', 'ú'],
      ['?', 'í'],
      ['', 'í']
    ];

    replacements.forEach(([bad, good]) => {
      content = content.split(bad).join(good);
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed encoding in ' + file);
  }
});
