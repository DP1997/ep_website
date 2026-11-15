import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Spalten: Meta 300, Bild 428, Text 330 Einheiten, Luecken 24/24.
// 40 + 300 + 24 + 428 + 24 + 330 = 1146.4 (rechte Kante = Bild 1).
// Das Bild ist so breit, dass Bild + Unterschrift genau so hoch sind
// wie das Inhaltstextfeld rechts (beide enden auf derselben Linie).
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 29.26%; }`,
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 25.19%; }`
);
css = css.replace(
  `.ps-sportler-fig2 { position: absolute; left: 34.97%; top: 32.6%; width: 29.68%; margin: 0; }`,
  `.ps-sportler-fig2 { position: absolute; left: 30.56%; top: 32.6%; width: 35.94%; margin: 0; }`
);
css = css.replace(
  `.ps-sportler-text {${'\r\n'}  position: absolute; left: 67%; top: 32.6%; width: 29.26%;`,
  `.ps-sportler-text {${'\r\n'}  position: absolute; left: 68.55%; top: 32.6%; width: 27.71%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Sportler: Spalten mit glueckendem Bild');
