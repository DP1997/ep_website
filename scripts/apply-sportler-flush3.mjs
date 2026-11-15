import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Unterkante von Bild 2 = Unterkante des Inhaltstextfeldes.
// Das Inhaltstextfeld ist 192.3 Einheiten hoch (Textspalte 330, 10 Zeilen).
// Bildhoehe = 192.3 -> Bildbreite = 192.3 * 2.624 = 504.6 Einheiten.
// Spalten: Meta 239.8, Bild 504.6, Text 330, Luecken 16/16.
// 40 + 239.8 + 16 + 504.6 + 16 + 330 = 1146.4 (rechte Kante = Bild 1).
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 28.38%; }`,
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 20.13%; }`
);
css = css.replace(
  `.ps-sportler-fig2 { position: absolute; left: 33.75%; top: 32.6%; width: 32.75%; margin: 0; }`,
  `.ps-sportler-fig2 { position: absolute; left: 24.84%; top: 32.6%; width: 42.37%; margin: 0; }`
);
css = css.replace(
  `.ps-sportler-text {${'\r\n'}  position: absolute; left: 68.55%; top: 32.6%; width: 27.71%;`,
  `.ps-sportler-text {${'\r\n'}  position: absolute; left: 68.55%; top: 32.6%; width: 27.71%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Bildunterkante an Textfeldunterkante angeglichen');
