import { readFileSync, writeFileSync } from 'fs';

/* ---------------------------------------------------------------
 * 1. Bubbles: Originalbild 1.png statt 1-circle.png.
 *    Im PDF sitzt der Kreis in einem vollen blau-grauen Rechteck
 *    (Farbe 200,204,213) - genau das ist 1.png. In 1-circle.png
 *    war der Rahmen transparent, dadurch fehlte das Rechteck.
 * --------------------------------------------------------------- */
const bub = 'src/pages/projektstudien/bubbles.astro';
let b = readFileSync(bub, 'utf8');
b = b.replace(
  "import img1 from '../../assets/projektstudien/bubbles/1-circle.png';",
  "import img1 from '../../assets/projektstudien/bubbles/1.png';",
);

/* 2. "Idee"-Zwischenueberschrift entfernen (steht im PDF als
 *    Zwischenueberschrift der rechten Spalte). */
b = b.replace(/\n *<h2 class="ps-bubbles-idee">Idee<\/h2>/, '');

writeFileSync(bub, b);
console.log('bubbles: Originalbild + ohne "Idee"');

/* ---------------------------------------------------------------
 * 3. Beschreibungen: Masse/Format per Komma angehaengt (so wie
 *    im PDF-Original), dazu die Zusammenarbeit mit Stefan Kindel.
 * --------------------------------------------------------------- */
const DESC = {
  'bubbles': 'Sitznische aus Glasmosaik, 14 m x 2,40 m',
  'balla-balla': 'Wandgestaltung mit Malerei, Glasfolierung und Email, ca. 14 m x 2,70 m',
  'sportler-in-bewegung': 'Wandmalerei, ca. 14 m x 2,70 m',
  'dschungel': 'Fassadenmalerei mit Applikationen aus Stahlemail, ca. 900 x 500 cm',
  'stoerche-froesche': 'Tierfigurinen aus Stahlblech, gewölbt, emailliert',
  'entwicklung': 'Farbig emaillierte Stahlbleche, 9,50 x 2,50 m (in Zusammenarbeit mit Stefan Kindel)',
  'skydance': 'Raumplastik aus Aluminium, mit verschiedenfarbigen Schlagmetallen belegt, ca. 340 cm (in Zusammenarbeit mit Stefan Kindel)',
  'stadttor': 'Freischwebende Plastik aus Stahl und Glas (in Zusammenarbeit mit Stefan Kindel)',
};

for (const [slug, desc] of Object.entries(DESC)) {
  const path = `src/pages/projektstudien/${slug}.astro`;
  let src = readFileSync(path, 'utf8');
  const rx = /(<p class="ps-desc">)[^<]*(<\/p>)/;
  if (!rx.test(src)) {
    console.error('Description nicht gefunden: ' + slug);
    process.exitCode = 1;
    continue;
  }
  src = src.replace(rx, `$1${desc}$2`);
  writeFileSync(path, src);
  console.log('desc: ' + slug);
}

/* ---------------------------------------------------------------
 * 4. Stoerche: Ort "Offenbach an der Queich" (PDF: "Offenbach/Queich").
 * --------------------------------------------------------------- */
const st = 'src/pages/projektstudien/stoerche-froesche.astro';
let s = readFileSync(st, 'utf8');
s = s.replace(
  '<span class="ps-label__value">Offenbach/Queich</span>',
  '<span class="ps-label__value">Offenbach an der Queich</span>',
);
writeFileSync(st, s);
console.log('ort: stoerche-froesche');
