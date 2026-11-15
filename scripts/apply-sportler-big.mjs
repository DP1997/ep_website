import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

// Sportler: zweites Bild stark vergroessert (53.3 % statt 42.4 %).
// Links daneben eine Spalte mit Meta-Block oben und Fliesstext unten,
// beide buendig mit der linken Kante von Bild 1 (40 Einheiten).
//   Meta-Block:  40 .. 503   (463 breit), Oberkante 277.1
//   Bild 2:      511.5 .. 1146.4 (634.9 breit, Hoehe 241.9)
//   Fliesstext:  40 .. 503, Oberkante 403.1
// Die Bildunterkante (529.3) und die Textunterkante (539.6) weichen um
// je 10.3 Einheiten ab: Bild 2 ist 2.624:1 und kann die Spaltenhoehe
// (117.5 + 8.5 + 136.5) nicht decken.
css = css.replace(
  `.ps-sportler-side {${C}  position: absolute; left: 3.36%; top: 43.91%; width: 20.13%;${C}  transform: translateY(-50%);${C}}`,
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 38.87%; }`
);
css = css.replace(
  `.ps-sportler-fig2 { position: absolute; left: 24.84%; top: 32.6%; width: 42.37%; margin: 0; }`,
  `.ps-sportler-fig2 { position: absolute; left: 42.95%; top: 33.81%; width: 53.31%; margin: 0; }`
);
css = css.replace(
  `.ps-sportler-text {${C}  position: absolute; left: 68.55%; top: 32.6%; width: 27.71%;`,
  `.ps-sportler-text {${C}  position: absolute; left: 3.36%; top: 47.42%; width: 38.87%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Sportler: Bild 2 vergroessert, Meta und Text in linke Spalte');
