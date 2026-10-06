const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dr_samir_ccmi_2026..html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

let bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (!bodyMatch) process.exit(1);
let jsxContent = bodyMatch[1];

// 1. Remove scripts
jsxContent = jsxContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

// 2. HTML Comments to JSX Comments
jsxContent = jsxContent.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// 3. style="string" to style={{}}
jsxContent = jsxContent.replace(/style="([^"]*)"/g, (match, p1) => {
    const styleObj = {};
    p1.split(';').forEach(rule => {
        const parts = rule.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            const val = parts.slice(1).join(':').trim();
            if(key) styleObj[key] = val;
        }
    });
    return `style={${JSON.stringify(styleObj)}}`;
});

// 4. class= to className=
jsxContent = jsxContent.replace(/class=/g, 'className=');
jsxContent = jsxContent.replace(/classNameName=/g, 'className='); // prevent double replace if already done

// 5. for= to htmlFor=
jsxContent = jsxContent.replace(/ for=/g, ' htmlFor=');

// 6. self closing tags
jsxContent = jsxContent.replace(/<(img|input|br|hr|meta|link)([^>]*?)(?<!\/)>/g, '<$1$2 />');

// 7. inline event handlers
jsxContent = jsxContent.replace(/onclick="([^"]*)"/g, "onClick={() => {}}");
jsxContent = jsxContent.replace(/onchange="([^"]*)"/g, "onChange={() => {}}");
jsxContent = jsxContent.replace(/onsubmit="([^"]*)"/g, "onSubmit={() => {}}");

// 8. viewBox, stroke-width, stroke-linecap, stroke-linejoin, fill-rule, clip-rule, stroke-miterlimit
jsxContent = jsxContent.replace(/viewbox=/gi, 'viewBox=');
jsxContent = jsxContent.replace(/stroke-width=/g, 'strokeWidth=');
jsxContent = jsxContent.replace(/stroke-linecap=/g, 'strokeLinecap=');
jsxContent = jsxContent.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
jsxContent = jsxContent.replace(/fill-rule=/g, 'fillRule=');
jsxContent = jsxContent.replace(/clip-rule=/g, 'clipRule=');
jsxContent = jsxContent.replace(/stroke-miterlimit=/g, 'strokeMiterlimit=');
jsxContent = jsxContent.replace(/stroke-dasharray=/g, 'strokeDasharray=');
jsxContent = jsxContent.replace(/stroke-dashoffset=/g, 'strokeDashoffset=');
jsxContent = jsxContent.replace(/xmlns:xlink=/g, 'xmlnsXlink=');

// Create activeView logic
// Find app-view divs and convert them to conditionally rendered blocks, or just leave them with activeView logic.
// The HTML uses class 'active-view' for display. We can just replace 'active-view' with conditionally added classes.
// Actually, let's just make it a raw component first.

const reactComponent = `import React, { useState } from 'react';

export default function DrSamirDashboard() {
  const [activeView, setActiveView] = useState('view-dashboard');
  const [bimodalMode, setBimodalMode] = useState('consulta');
  const [theme, setTheme] = useState('light');

  const switchView = (view: string) => setActiveView(view);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const setBimodalSubMode = (mode: string) => setBimodalMode(mode);

  return (
    <div className={\`\${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} relative min-h-screen flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-500\`}>
      ${jsxContent}
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'components', 'DrSamirDashboard.tsx'), reactComponent);
console.log('JSX generation complete.');
