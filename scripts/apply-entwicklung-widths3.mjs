import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Erstes Textfeld auf 218 Einheiten (18.31 %) verbreitern/schmaler, damit
// der erste Absatz sieben Zeilen umfasst und damit buendig mit dem
// Meta-Block endet. Luecken je 64 Einheiten (5.375 %).
css = css.replace(
  `.ps-entwicklung-text-1 {${'\r\n'}  position: absolute; left: 33.36%; top: 75.8%; width: 21.33%;`,
  `.ps-entwicklung-text-1 {${'\r\n'}  position: absolute; left: 34.88%; top: 75.8%; width: 18.31%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Entwicklung: erstes Textfeld auf 7 Zeilen');
