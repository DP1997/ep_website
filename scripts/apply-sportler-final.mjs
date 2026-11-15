import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

// Sportler, Endwerte:
//   linke Spalte (Meta-Block + Fliesstext): 40 .. 480 (440 breit),
//     Meta-Block 277.1 .. 394.7, Fliesstext 403.1 .. 539.7
//   Bild 2: 488.5 .. 1146.4 (657.9 breit, Hoehe 250.7), 283.05 .. 533.75
// Die Luecke zwischen Spalte und Bild betraegt 8.5 Einheiten.
// Bild 2 ist 2.624:1 und kann die Spaltenhoehe (117.6 + 8.5 + 136.5)
// nicht decken; die Restdifferenz von 11.9 Einheiten ist halbiert
// (je 5.95) auf Ober- und Unterkante verteilt.
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 38.87%; }`,
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 36.94%; }`
);
css = css.replace(
  `.ps-sportler-fig2 { position: absolute; left: 42.95%; top: 33.81%; width: 53.31%; margin: 0; }`,
  `.ps-sportler-fig2 { position: absolute; left: 41.02%; top: 33.3%; width: 55.24%; margin: 0; }`
);
css = css.replace(
  `.ps-sportler-text {${C}  position: absolute; left: 3.36%; top: 47.42%; width: 38.87%;`,
  `.ps-sportler-text {${C}  position: absolute; left: 3.36%; top: 47.42%; width: 36.94%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Sportler: Endwerte gesetzt');
