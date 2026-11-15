import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Drei gleich breite Textspalten (Meta links, Fliesstext rechts) und ein
// exakt mittig liegendes Bild: Spaltenbreiten 385 Einheiten, Bild 274
// Einheiten, zwei Luecken von je 31.2 Einheiten.
// 40 + 385 + 31.2 + 274 + 31.2 + 385 = 1146.4 (rechte Kante = Bild 1).
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 31%; }`,
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 32.33%; }`
);
css = css.replace(
  `.ps-sportler-fig2 { position: absolute; left: 36.96%; top: 32.6%; width: 23%; margin: 0; }`,
  `.ps-sportler-fig2 { position: absolute; left: 38.31%; top: 32.6%; width: 23.01%; margin: 0; }`
);
css = css.replace(
  `.ps-sportler-text {${'\r\n'}  position: absolute; left: 62.56%; top: 32.6%; width: 33.85%;`,
  `.ps-sportler-text {${'\r\n'}  position: absolute; left: 63.94%; top: 32.6%; width: 32.33%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Spalten angeglichen');
