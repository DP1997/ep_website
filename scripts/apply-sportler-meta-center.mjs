import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Meta-Block vertikal in der zweiten Zeile zentrieren: Mitte des Bands
// zwischen 277.1 (Oberkante der Spalten) und 469.4 (Unterkante Bild und
// Inhaltstextfeld) = 373.25 -> 43.91 % der Blattoehe.
// translateY(-50%) zentriert den Block auf dieser Linie, unabhaengig von
// seiner Hoehe. (Die Zentrierung des Blattes nutzt die translate-Property,
// transform bleibt frei.)
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 20.13%; }`,
  `.ps-sportler-side {${'\r\n'}  position: absolute; left: 3.36%; top: 43.91%; width: 20.13%;${'\r\n'}  transform: translateY(-50%);${'\r\n'}}`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Meta-Block vertikal zentriert');
