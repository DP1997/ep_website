/**
 * Setzt die Sportler-Anordnung: Bild 1 oben ueber die volle Breite,
 * darunter links die Spalte mit Meta-Block und Fliesstext
 * (untereinander), rechts das kleinere Bild 2 (um 35% verkleinert).
 * Die Aussenkanten von Bild 1, Meta/Text und Bild 2 ergeben ein
 * Rechteck.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(__dirname, '../src/styles/components/projektstudien.css');

const REPLACEMENTS = [
  [
    '.ps-sportler-text {\r\n  position: absolute; left: 31.92%; top: 31.51%; width: 64.34%;',
    '.ps-sportler-text {\r\n  position: static; width: 100%;',
  ],
  [
    '.ps-sportler-side { position: absolute; left: 3.36%; top: 31.51%; width: 28.56%; }',
    '.ps-sportler-side { position: absolute; left: 3.36%; top: 31.51%; width: 51.08%; }',
  ],
  [
    '.ps-sportler-fig2 { position: absolute; left: 31.92%; top: 48.87%; width: 64.34%; margin: 0; }',
    '.ps-sportler-fig2 { position: absolute; left: 54.45%; top: 31.51%; width: 41.83%; margin: 0; }',
  ],
];

let css = readFileSync(FILE, 'utf8');
const NL = css.includes('\r\n') ? '\r\n' : '\n';

for (const [from, to] of REPLACEMENTS) {
  // Zeilenenden-agnostisch suchen: erst mit NL probieren, sonst mit \n.
  let f = from.split('\n').join(NL);
  let t = to.split('\n').join(NL);
  if (!css.includes(f)) {
    f = from.split('\n').join('\n');
    t = to.split('\n').join('\n');
  }
  if (!css.includes(f)) {
    console.error(`NICHT GEFUNDEN:\n${from}`);
    process.exit(1);
  }
  css = css.replace(f, t);
}

// Kommentar aktualisieren
const oldC = ` * Puzzle-Anordnung: Bild 1 (Wandmalerei Foyer, 3228x624) oben ueber
 * die volle Breite, darunter der Fliesstext rechts und der Meta-Block
 * links, darunter Bild 2 (Besuchereingang, 2119x807) wieder ueber die
 * volle Breite. Die Aussenkanten der Elemente ergeben damit ein
 * Rechteck (PDF-x 40..1146, PDF-y 20..830).`;
const newC = ` * Puzzle-Anordnung: Bild 1 (Wandmalerei Foyer, 3228x624) oben ueber
 * die volle Breite. Darunter links eine Spalte mit Meta-Block und
 * Fliesstext untereinander, rechts das um 35% kleinere Bild 2
 * (Besuchereingang, 2119x807). Die Aussenkanten der Elemente ergeben
 * ein Rechteck (PDF-x 40..1146).`;
if (css.includes(oldC.split('\n').join(NL))) {
  css = css.replace(oldC.split('\n').join(NL), newC.split('\n').join(NL));
}

writeFileSync(FILE, css, 'utf8');
console.log('Sportler-Anordnung gesetzt.');
