const fs = require('fs');
const filePath = 'src/components/QuickAccessWidgetsHub.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The restore script removed 'í', but it also removed genuine '?' characters which might have turned into '' or something? 
// Actually, earlier the restore script was: for(let i=0; i<content.length; i+=2) restored += content[i];
// This ruined any part of the string that wasn't interlaced with í.

// Since I have Dashboard.tsx restored, let's just make the replacements on Dashboard.tsx correctly this time.
// As for QuickAccessWidgetsHub.tsx, it's partially broken. Let's fix the broken parts.

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
  ['?"', '-'],
  ['presetData', 'presetData?'],
  ['diagnosis', 'diagnosis?'],
  ['cie10', 'cie10?'],
  ['rp', 'rp?'],
  ['indications', 'indications?'],
  ['restDays', 'restDays?'],
  ['labProfile', 'labProfile?'],
  ['badge', 'badge?'],
];

replacements.forEach(([bad, good]) => {
  content = content.split(bad).join(good);
});
fs.writeFileSync(filePath, content, 'utf8');

// Now do Dashboard.tsx exactly the same
const dashPath = 'src/components/Dashboard.tsx';
let dashContent = fs.readFileSync(dashPath, 'utf8');
replacements.forEach(([bad, good]) => {
  dashContent = dashContent.split(bad).join(good);
});
fs.writeFileSync(dashPath, dashContent, 'utf8');
console.log('Fixed encodings safely!');
