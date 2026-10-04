const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\/\* Responsive A4 Zoom for Mobile to prevent layout breakage \*\/[\s\S]*?@media print \{\s*\.a4-responsive-container \{\s*zoom: 1 !important;\s*\}\s*\}/g, '');

const newCss = `
/* A4 CSS Transform Scaler - Layout Safe */
.a4-transform-wrapper {
  position: relative;
  overflow: visible;
  transform-origin: top center;
  transform: scale(0.45);
  margin-bottom: calc(-1123px * 0.55);
}

@media (min-width: 501px) and (max-width: 639px) {
  .a4-transform-wrapper {
    transform: scale(0.6);
    margin-bottom: calc(-1123px * 0.4);
  }
}

@media (min-width: 640px) and (max-width: 768px) {
  .a4-transform-wrapper {
    transform: scale(0.75);
    margin-bottom: calc(-1123px * 0.25);
  }
}

@media (min-width: 769px) and (max-width: 1023px) {
  .a4-transform-wrapper {
    transform: scale(0.85);
    margin-bottom: calc(-1123px * 0.15);
  }
}

@media (min-width: 1024px) {
  .a4-transform-wrapper {
    transform: scale(1);
    margin-bottom: 0;
  }
}

@media print {
  .a4-transform-wrapper {
    transform: scale(1) !important;
    margin-bottom: 0 !important;
  }
}

/* Force prevent body scroll overflow caused by absolute or transformed elements */
html, body {
  overflow-x: hidden;
  width: 100%;
  position: relative;
}
`;

fs.writeFileSync('src/index.css', css + newCss);
console.log("Success");