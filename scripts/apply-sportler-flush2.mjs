import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Bildbreite so gewaehlt, dass Bild + Unterschrift genau so hoch sind wie
// das Inhaltstextfeld rechts: Bild 148.6 + 13.6 (Abstand) + 30.1
// (Unterschrift) = 192.3 Einheiten = Hoehe des Textfeldes.
// Spalten: Meta 338, Bild 390, Text 330, Luecken 24/24.
// 40 + 338 + 24 + 390 + 24 + 330 = 1146.4 (rechte Kante = Bild 1).
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 25.19%; }`,
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 28.38%; }`
);
css = css.replace(
  `.ps-sportler-fig2 { position: absolute; left: 30.56%; top: 32.6%; width: 35.94%; margin: 0; }`,
  `.ps-sportler-fig2 { position: absolute; left: 33.75%; top: 32.6%; width: 32.75%; margin: 0; }`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Bild auf Texthoehe angeglichen');
