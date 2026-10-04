const fs = require('fs');
let c = fs.readFileSync('src/components/MobileBottomNavBar.tsx', 'utf8');
c = c.replace(/Navegaci\uFFFDn M\uFFFDevil/g, 'Navegación Móvil');
c = c.replace(/Navegaci.n M.vil/g, 'Navegación Móvil');
fs.writeFileSync('src/components/MobileBottomNavBar.tsx', c);