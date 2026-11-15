import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Band (linke Spalte + Bild 2) um 1cqh nach unten schieben, damit die
// Bildunterschrift von Bild 1 nicht mehr in die Zeilenbox des Titels
// ragt: 272.6 (Caption-Box) -> 277.1 (Titel-Box).
css = css.replace(
  '.ps-sportler-side { position: absolute; left: 3.36%; top: 31.51%; width: 46.08%; }',
  '.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 46.08%; }'
);
css = css.replace(
  '.ps-sportler-fig2 { position: absolute; left: 51.44%; top: 31.51%; width: 44.82%; margin: 0; }',
  '.ps-sportler-fig2 { position: absolute; left: 51.44%; top: 32.6%; width: 44.82%; margin: 0; }'
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('CSS gepatcht');
