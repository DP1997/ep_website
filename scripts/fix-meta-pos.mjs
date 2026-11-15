import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

// Meta-Block-Positionen: PDF-y-Oberkante der Description, Spaltenbreite.
// top% = (850 - PDF-y) / 850
const BLOCKS = {
  bubbles: ['0%', '15.9%', '100%'],
  balla: ['7.5%', '54.8%', '26%'],
  sportler: ['6.6%', '61.2%', '26%'],
  dschungel: ['6.7%', '75.2%', '20%'],
  stoerche: ['7%', '84.2%', '26%'],
  entwicklung: ['9.7%', '85.6%', '22%'],
};

// Alte Kommentar-/Positionsbloecke fuer den Meta-Block entfernen
css = css.replace(/\/\* Meta-Block je Seite[^\n]*\n(\/\* Meta-Block je Seite[^\n]*\n)?/g, '');

let block = '\n/* Meta-Block je Seite: Position (PDF-y der Description) und Spaltenbreite. */\n';
for (const [slug, [left, top, width]] of Object.entries(BLOCKS)) {
  const sel = slug === 'stoerche-froesche' ? 'stoerche' : slug === 'sportler-in-bewegung' ? 'sportler' : slug;
  block += `.ps-detail--${sel} .ps-meta-block { left: ${left}; top: ${top}; width: ${width}; }\n`;
}
css += block;

writeFileSync(path, css);
console.log('Meta-Block-Positionen gesetzt');
