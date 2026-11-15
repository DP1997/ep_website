import { readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

const DESC = {
  bubbles: 'Sitznische aus Glasmosaik',
  'balla-balla': 'Wandgestaltung mit Malerei, Glasfolierung und Email',
  'sportler-in-bewegung': 'Wandmalerei',
  dschungel: 'Fassadenmalerei mit Stahlemail',
  'stoerche-froesche': 'Tierfigurinen aus emailliertem Stahlblech',
  entwicklung: 'Farbig emaillierte Stahlbleche',
  skydance: 'Raumplastik aus Aluminium mit Schlagmetallen',
  stadttor: 'Freischwebende Plastik aus Stahl und Glas',
};

const MASS_LABEL = {
  bubbles: ['Format', '14 x 2,40 m'],
  'balla-balla': ['Format', 'ca. 14 x 2,70 m'],
  'sportler-in-bewegung': ['Format', 'ca. 14 x 2,70 m'],
  dschungel: ['Format', 'ca. 900 x 500 cm'],
  'stoerche-froesche': ['Ausführung', 'gewölbt, emailliert'],
  entwicklung: ['Format', '9,50 x 2,50 m'],
  skydance: ['Höhe', 'ca. 340 cm'],
  stadttor: ['Auftragssumme', '95.000 €'],
};

for (const [slug, desc] of Object.entries(DESC)) {
  const p = dir + slug + '.astro';
  let c = readFileSync(p, 'utf8');

  c = c.replace(/(<p class="ps-desc">)[^<]*(<\/p>)/, '$1' + desc + '$2');

  const [key, val] = MASS_LABEL[slug];
  // Vorhandene Labels normalisieren (Einrueckung) und Mass-Label voranstellen.
  const lines = c.split('\n');
  const lIdx = lines.findIndex(l => l.includes('<div class="ps-labels">'));
  if (lIdx < 0) {
    console.log('Labels-Block nicht gefunden: ' + slug);
    continue;
  }
  const indent = lines[lIdx].match(/^\s*/)[0];
  const labelBlock = [
    indent + '  <div class="ps-label">',
    indent + '    <span class="ps-label__key">' + key + '</span>',
    indent + '    <span class="ps-label__value">' + val + '</span>',
    indent + '  </div>',
  ];
  lines.splice(lIdx + 1, 0, ...labelBlock);
  writeFileSync(p, lines.join('\n'));
  console.log('ok: ' + slug);
}
