import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Spalten neu: Meta und Fliesstext je 29.26% (348.5 Einheiten), Bild 2
// 29.68% (353.5 Einheiten), zwei Luecken von je 28 Einheiten (2.35%).
// 40 + 348.5 + 28 + 353.5 + 28 + 348.5 = 1146.4 (rechte Kante = Bild 1).
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 32.33%; }`,
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 29.26%; }`
);
css = css.replace(
  `.ps-sportler-fig2 { position: absolute; left: 38.31%; top: 32.6%; width: 23.01%; margin: 0; }`,
  `.ps-sportler-fig2 { position: absolute; left: 34.97%; top: 32.6%; width: 29.68%; margin: 0; }`
);
css = css.replace(
  `.ps-sportler-text {${'\r\n'}  position: absolute; left: 63.94%; top: 32.6%; width: 32.33%;`,
  `.ps-sportler-text {${'\r\n'}  position: absolute; left: 67%; top: 32.6%; width: 29.26%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Spalten neu gesetzt');
