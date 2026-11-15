import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

// Die Bildunterschrift des grossen Stadttor-Bildes liegt am unteren
// Blattrand: mit der geerbten Zeilenhoehe (1.6) ragt die (leere) Zeilenbox
// 1.5 Einheiten ueber den Blattrand. Mit Zeilenhoehe 1.24 (wie im
// Fliesstext) passt sie in den Blatt.
css = css.replace(
  `.ps-stadttor-fig1 figcaption {${C}  position: absolute; left: 0.72%; top: 100%; margin-top: 0.96cqh;${C}  font-family: var(--font-sans-serif); font-size: 1.65cqh; font-weight: 400;${C}}`,
  `.ps-stadttor-fig1 figcaption {${C}  position: absolute; left: 0.72%; top: 100%; margin-top: 0.96cqh;${C}  font-family: var(--font-sans-serif); font-size: 1.65cqh; font-weight: 400;${C}  line-height: 1.24;${C}}`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Stadttor: Bildunterschrift mit Zeilenhoehe 1.24');
