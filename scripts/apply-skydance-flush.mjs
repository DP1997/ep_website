import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Skydance: Die Textspalte wird breiter (350 Einheiten statt 309.6), damit
// der Fliesstext hoeher wird und seine Unterkante buendig mit der
// Unterkante der beiden Bilder (495.6) abschliesst. Das Inhaltstextfeld
// wird unten in der Spalte verankert (bottom: 0), die Spalte selbst
// bekommt die Hoehe der Bildspalte (475.2 Einheiten).
css = css.replace(
  `.ps-skydance-side { position: absolute; left: 22.76%; top: 2.4%; width: 26%; }`,
  `.ps-skydance-side { position: absolute; left: 21.05%; top: 2.4%; width: 29.39%; height: 55.91%; }`
);
css = css.replace(
  `.ps-skydance-text {${'\r\n'}  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;`,
  `.ps-skydance-text {${'\r\n'}  position: absolute; left: 0; bottom: 0; width: 100%;${'\r\n'}  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Skydance: Textspalte verbreitert, Fliesstext unten verankert');
