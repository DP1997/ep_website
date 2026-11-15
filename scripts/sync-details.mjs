import { readFileSync, writeFileSync } from 'fs';

/* Frontmatter: Material/Ort an die neuen Beschreibungen angleichen. */
const DIR = 'src/content/projektstudien';
const DATA = {
  'bubbles': { location: 'Hallenbad Neubau Altenkirchen', material: 'Glasmosaik, 14 m x 2,40 m' },
  'balla-balla': { location: 'Verbandsgemeindesporthalle Bad Bergzabern', material: 'Malerei, Glasfolierung, Email, ca. 14 m x 2,70 m' },
  'sportler-in-bewegung': { location: 'Schulsporthalle Bad Bergzabern', material: 'Wandmalerei, ca. 14 m x 2,70 m' },
  'dschungel': { location: 'Kita Jakob Laubach-Straße, Mainz', material: 'Fassadenmalerei + Stahlemail, ca. 900 x 500 cm' },
  'stoerche-froesche': { location: 'Offenbach an der Queich', material: 'Stahlblech, emailliert' },
  'entwicklung': { location: 'Kita zum Abtswald, Wörth/Rh.', material: 'Emaillierte Stahlbleche, 9,50 x 2,50 m' },
  'skydance': { location: 'Kulturheim Weisenau, Mainz', material: 'Aluminium-Raumplastik, ca. 340 cm' },
  'stadttor': { location: 'Universität Koblenz-Landau', material: 'Stahl + Glas' },
};

for (const [slug, d] of Object.entries(DATA)) {
  const path = `${DIR}/${slug}.md`;
  const src = readFileSync(path, 'utf8');
  const first = src.indexOf('---');
  const second = src.indexOf('---', first + 3);
  let fm = src.slice(first + 3, second);
  const rest = src.slice(second);

  const set = (text, key, value) => {
    const rx = new RegExp(`^${key}:.*$`, 'm');
    if (rx.test(text)) return text.replace(rx, `${key}: '${value.replace(/'/g, "''")}'`);
    return text.replace(/\s*$/, '\n') + `${key}: '${value.replace(/'/g, "''")}'\n`;
  };

  let out = fm;
  out = set(out, 'location', d.location);
  out = set(out, 'material', d.material);

  writeFileSync(path, '---' + out + rest);
  console.log('frontmatter: ' + slug);
}

/* CSS: die nicht mehr benutzte .ps-bubbles-idee-Regel entfernen. */
const cssPath = 'src/styles/components/projektstudien.css';
let css = readFileSync(cssPath, 'utf8');
const rx = /\.ps-bubbles-idee \{\r?\n[^}]*\}\r?\n/;
if (!rx.test(css)) {
  console.error('.ps-bubbles-idee nicht gefunden');
  process.exitCode = 1;
} else {
  css = css.replace(rx, '');
  writeFileSync(cssPath, css);
  console.log('css: .ps-bubbles-idee entfernt');
}
