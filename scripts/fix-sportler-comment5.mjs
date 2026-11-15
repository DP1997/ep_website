import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

const oldText = [
  ' * 330 = 1146.4 = rechte Kante von Bild 1).',
  ' * Die Bildbreite folgt aus der Hoehe des Inhaltstextfeldes: es ist',
].join(C);

const newText = [
  ' * 330 = 1146.4 = rechte Kante von Bild 1).',
  ' * Der Meta-Block ist in der zweiten Zeile vertikal zentriert: Mitte des',
  ' * Bands zwischen 277.1 und 469.4 = 373.25 (43.91 % der Blattoehe),',
  ' * per translateY(-50%) auf diese Linie gezogen.',
  ' * Die Bildbreite folgt aus der Hoehe des Inhaltstextfeldes: es ist',
].join(C);

css = css.replace(oldText, newText);
if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Kommentar aktualisiert');
