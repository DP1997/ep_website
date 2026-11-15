import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Rechte Kante des zweiten Textfeldes = rechte Bildkante (91.3 %).
// Spalten: Meta 10.5..29.5 %, erstes Textfeld 33.36..54.69 %,
// zweites Textfeld 58.55..91.3 %, Luecken je 3.86 %.
css = css.replace(
  `.ps-entwicklung-text-1 {${'\r\n'}  position: absolute; left: 32.31%; top: 75.8%; width: 21.33%;`,
  `.ps-entwicklung-text-1 {${'\r\n'}  position: absolute; left: 33.36%; top: 75.8%; width: 21.33%;`
);
css = css.replace(
  `.ps-entwicklung-text {${'\r\n'}  position: absolute; left: 57.48%; top: 75.8%; width: 32.75%;`,
  `.ps-entwicklung-text {${'\r\n'}  position: absolute; left: 58.55%; top: 75.8%; width: 32.75%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Entwicklung: Spalten buendig zur Bildkante');
