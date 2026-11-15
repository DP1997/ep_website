import { readdirSync, readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

// Description = Material + Masse (die bisherige Meta-Fettzeile aus dem PDF).
// Labels wie bei den uebrigen Werken: Ort / Jahr / Auftraggeber.
// Statusangaben in Klammern ("(Projektstudie, nicht realisiert)" usw.) fallen
// voruebergehend weg.
const META = {
  'bubbles': {
    desc: 'Sitznische aus Glasmosaik, 14 x 2,40 m',
    ort: 'Hallenbad Neubau Altenkirchen',
    jahr: '2023',
    client: null,
  },
  'balla-balla': {
    desc: 'Wandgestaltung mit Malerei, Glasfolierung und plastischen Emailelementen, ca. 14 x 2,70 m',
    ort: 'Verbandsgemeindesporthalle Bad Bergzabern',
    jahr: '2020',
    client: null,
  },
  'sportler-in-bewegung': {
    desc: 'Wandmalerei im Foyer, Besuchereingang und Tribüne, ca. 14 x 2,70 m',
    ort: 'Schulsporthalle Bad Bergzabern',
    jahr: '2020',
    client: null,
  },
  'dschungel': {
    desc: 'Fassadenmalerei mit Applikationen aus Stahlemail, ca. 900 x 500 cm',
    ort: 'Kita Jakob Laubach-Straße, Mainz',
    jahr: null,
    client: null,
  },
  'stoerche-froesche': {
    desc: 'Tierfigurinen aus Stahlblech, gewölbt, emailliert',
    ort: 'Offenbach/Queich',
    jahr: '2003/2025',
    client: null,
  },
  'entwicklung': {
    desc: 'Farbig emaillierte Stahlbleche, 9,50 x 2,50 m',
    ort: 'Kita zum Abtswald, Wörth/Rh.',
    jahr: '2021',
    client: null,
  },
  'skydance': {
    desc: 'Raumplastik aus Aluminium, mit verschiedenfarbigen Schlagmetallen belegt, ca. 340 cm',
    ort: 'Kulturheim Weisenau, Mainz',
    jahr: '2022',
    client: null,
  },
  'stadttor': {
    desc: 'Freischwebende Plastik aus Stahl und Glas, Auftragssumme 95.000 €',
    ort: 'Universität Koblenz-Landau',
    jahr: '2017',
    client: 'Staatsbauamt Mainz',
  },
};

const label = (name, value) =>
  `          <div class="ps-label">\n            <span class="ps-label__key">${name}</span>\n            <span class="ps-label__value">${value}</span>\n          </div>\n`;

for (const [slug, m] of Object.entries(META)) {
  const p = dir + slug + '.astro';
  let c = readFileSync(p, 'utf8');

  // Bestehenden Meta-Absatz durch Description + Labels ersetzen.
  const metaRe = /<p class="ps-[a-z]*-meta">[\s\S]*?<\/p>/;
  if (!metaRe.test(c)) {
    console.log('META-ABSATZ NICHT GEFUNDEN: ' + slug);
    continue;
  }
  let details = '';
  if (m.ort) details += label('Ort', m.ort);
  if (m.jahr) details += label('Jahr', m.jahr);
  if (m.client) details += label('Auftraggeber', m.client);

  const replacement =
    `<p class="ps-desc">${m.desc}</p>\n` +
    `        <div class="ps-labels">\n${details}        </div>`;

  c = c.replace(metaRe, replacement);
  writeFileSync(p, c);
  console.log('ok: ' + slug);
}
