import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Spaltenbreiten: Meta 226.1, erstes Textfeld 254, zweites Textfeld 390,
// zwei Luecken von je 45.75 Einheiten.
// 113 + 226.1 + 45.75 + 254 + 45.75 + 390 = 1074.6 (rechte Bildkante).
css = css.replace(
  `.ps-entwicklung-text-1 {${'\r\n'}  position: absolute; left: 34.41%; top: 75.8%; width: 21.33%;`,
  `.ps-entwicklung-text-1 {${'\r\n'}  position: absolute; left: 32.31%; top: 75.8%; width: 21.33%;`
);
css = css.replace(
  `.ps-entwicklung-text {${'\r\n'}  position: absolute; left: 61.68%; top: 75.8%; width: 28.55%;`,
  `.ps-entwicklung-text {${'\r\n'}  position: absolute; left: 57.48%; top: 75.8%; width: 32.75%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Entwicklung: Spaltenbreiten angepasst');
