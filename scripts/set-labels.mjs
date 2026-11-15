import { readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

const PAGES = {
  bubbles: ['Sitznische aus Glasmosaik', 'Hallenbad Neubau Altenkirchen', '2023', 't.b.d.'],
  'balla-balla': ['Wandgestaltung mit Malerei, Glasfolierung und Email', 'Verbandsgemeindesporthalle Bad Bergzabern', '2020', 'Verbandsgemeinde Bad Bergzabern'],
  'sportler-in-bewegung': ['Wandmalerei', 'Schulsporthalle Bad Bergzabern', '2020', 'Verbandsgemeinde Bad Bergzabern'],
  dschungel: ['Fassadenmalerei mit Applikationen aus Stahlemail', 'Kita Jakob Laubach-Straße, Mainz', null, 't.b.d.'],
  'stoerche-froesche': ['Tierfigurinen aus Stahlblech, gewölbt, emailliert', 'Offenbach/Queich', '2003/2025', 't.b.d.'],
  entwicklung: ['Farbig emaillierte Stahlbleche (in Zusammenarbeit mit Stefan Kindel)', 'Kita zum Abtswald, Wörth/Rh.', '2021', 't.b.d.'],
  skydance: ['Raumplastik aus Aluminium, mit verschiedenfarbigen Schlagmetallen belegt, ca. 340 cm', 'Kulturheim Weisenau, Mainz', '2022', 'Stadt Mainz'],
  stadttor: ['Freischwebende Plastik aus Stahl und Glas', 'Universität Koblenz-Landau', '2017', 'Staatsbauamt Mainz'],
};

for (const [slug, [desc, ort, jahr, client]] of Object.entries(PAGES)) {
  const p = dir + slug + '.astro';
  let lines = readFileSync(p, 'utf8').split('\n');

  const labelHtml = (i) => {
    let out = i + '<div class="ps-label">\n' +
      i + '  <span class="ps-label__key">Ort</span>\n' +
      i + '  <span class="ps-label__value">' + ort + '</span>\n' +
      i + '</div>\n';
    if (jahr) {
      out += i + '<div class="ps-label">\n' +
        i + '  <span class="ps-label__key">Jahr</span>\n' +
        i + '  <span class="ps-label__value">' + jahr + '</span>\n' +
        i + '</div>\n';
    }
    if (client) {
      out += i + '<div class="ps-label">\n' +
        i + '  <span class="ps-label__key">Auftraggeber</span>\n' +
        i + '  <span class="ps-label__value">' + client + '</span>\n' +
        i + '</div>\n';
    }
    return out;
  };

  // Meta-Block zeilenbasiert finden (Klammerzaehlung)
  let mIdx = lines.findIndex(l => l.includes('<div class="ps-meta-block">'));
  let indent;
  let endIdx;

  if (mIdx >= 0) {
    indent = lines[mIdx].match(/^\s*/)[0];
    let depth = 0;
    endIdx = -1;
    for (let i = mIdx; i < lines.length; i++) {
      depth += (lines[i].match(/<div\b/g) || []).length;
      depth -= (lines[i].match(/<\/div>/g) || []).length;
      if (depth === 0) { endIdx = i; break; }
    }
  } else {
    const h1Idx = lines.findIndex(l => l.includes('<h1 class="ps-') && l.includes('-title">'));
    if (h1Idx < 0) { console.log('h1 nicht gefunden: ' + slug); continue; }
    indent = lines[h1Idx].match(/^\s*/)[0];
    endIdx = h1Idx;
  }

  const inner = indent + '  ';
  const block = [
    indent + '<div class="ps-meta-block">',
    inner + '<p class="ps-desc">' + desc + '</p>',
    inner + '<div class="ps-labels">',
    ...labelHtml(inner).split('\n').filter(l => l !== ''),
    inner + '</div>',
    indent + '</div>',
  ];

  lines.splice(mIdx >= 0 ? mIdx : endIdx + 1, mIdx >= 0 ? endIdx - mIdx + 1 : 0, ...block);
  writeFileSync(p, lines.join('\n'), 'utf8');

  const c2 = readFileSync(p, 'utf8');
  const o = (c2.match(/<div\b/g) || []).length;
  const cl = (c2.match(/<\/div>/g) || []).length;
  const moj = (c2.match(/[ÂÃ][\x80-\xBF]/g) || []).length;
  console.log((o === cl && moj === 0 ? 'ok: ' : 'PROBLEM: ') + slug + ' (div ' + o + '/' + cl + ', mojibake ' + moj + ')');
}
