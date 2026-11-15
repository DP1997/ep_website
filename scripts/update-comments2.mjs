import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

const replace = (oldLines, newLines) => {
  const o = oldLines.join(C), n = newLines.join(C);
  if (!css.includes(o)) throw new Error('Text nicht gefunden: ' + oldLines[0]);
  css = css.replace(o, n);
};

// Balla: jetzt vertikal zentriert statt unterkaanten-buendig
replace([
  ' * Der Meta-Block links (75.3..384.9) schliesst unten buendig mit dem',
  ' * grossen Inhaltstextfeld rechts ab (beide 544.6). Das kleine',
  ' * Inhaltstextfeld unten links (75.3..361.1) schliesst unten buendig mit',
  ' * dem unteren Bild ab (beide 750.7).',
], [
  ' * Der Meta-Block links (75.3..384.9) ist vertikal zur Mitte des grossen',
  ' * Inhaltstextfeldes rechts zentriert (beide 435.9), per translateY(-50%).',
  ' * Das kleine Inhaltstextfeld unten links (75.3..361.1) ist vertikal zur',
  ' * Mitte des unteren Bildes zentriert (beide 659.85).',
]);

// Bildunterschriften: Abstand 0.96cqh (40 % naeher am Bild)
replace([
  ' * Schriftgroessen stammen aus den PDF-Textzeilen.',
], [
  ' * Bildunterschriften stehen 0.96cqh (= 8.2 Einheiten) unter dem Bild.',
  ' * Schriftgroessen stammen aus den PDF-Textzeilen.',
]);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Kommentare aktualisiert');
