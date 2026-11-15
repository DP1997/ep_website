import { readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien';

const DATA = {
  'balla-balla': {
    title: 'Balla Balla',
    desc: 'Wandgestaltung mit Malerei, Glasfolierung und Email',
    ort: 'Verbandsgemeindesporthalle Bad Bergzabern',
    jahr: '2020',
    client: 'Verbandsgemeinde Bad Bergzabern',
  },
  'sportler-in-bewegung': {
    title: 'Sportler in Bewegung',
    desc: 'Wandmalerei',
    ort: 'Schulsporthalle Bad Bergzabern',
    jahr: '2020',
    client: 'Verbandsgemeinde Bad Bergzabern',
  },
  'dschungel': {
    title: 'Dschungel',
    desc: 'Fassadenmalerei mit Applikationen aus Stahlemail',
    ort: 'Kita Jakob Laubach-Straße, Mainz',
    jahr: 't.b.d.',
    client: 't.b.d.',
  },
  'bubbles': {
    title: 'Bubbles',
    desc: 'Sitznische aus Glasmosaik',
    ort: 'Hallenbad Neubau Altenkirchen',
    jahr: '2023',
    client: 't.b.d.',
  },
  'stoerche-froesche': {
    title: 'Störche &amp; Frösche',
    desc: 'Tierfigurinen aus Stahlblech, gewölbt, emailliert',
    ort: 'Offenbach/Queich',
    jahr: '2003/2025',
    client: 'Verbandsgemeinde Offenbach',
  },
  'entwicklung': {
    title: 'Entwicklung',
    desc: 'Farbig emaillierte Stahlbleche (in Zusammenarbeit mit Stefan Kindel)',
    ort: 'Kita zum Abtswald, Wörth/Rh.',
    jahr: '2021',
    client: 't.b.d.',
  },
  'skydance': {
    title: 'Skydance',
    desc: 'Raumplastik aus Aluminium, mit verschiedenfarbigen Schlagmetallen belegt, ca. 340 cm',
    ort: 'Kulturheim Weisenau, Mainz',
    jahr: '2022',
    client: 'Stadt Mainz',
  },
  'stadttor': {
    title: 'Stadttor',
    desc: 'Freischwebende Plastik aus Stahl und Glas',
    ort: 'Universität Koblenz-Landau',
    jahr: '2017',
    client: 'Staatsbauamt Mainz',
  },
};

/* Findet den Index nach dem schliessenden Tag des Elements, das bei
   `start` beginnt (Tag muss an `start` stehen). */
function endOfTag(src, start, tag) {
  const open = new RegExp(`<${tag}\\b[^>]*>`, 'g');
  const close = new RegExp(`</${tag}>`, 'g');
  let depth = 0;
  let i = start;
  while (i < src.length) {
    open.lastIndex = i;
    close.lastIndex = i;
    const o = open.exec(src);
    const c = close.exec(src);
    if (!c) break;
    if (o && o.index < c.index) {
      depth++;
      i = o.index + o[0].length;
      continue;
    }
    depth--;
    i = c.index + c[0].length;
    if (depth === 0) return i;
  }
  return -1;
}

const label = (indent, key, value) =>
  `${indent}<div class="ps-label">\n` +
  `${indent}  <span class="ps-label__key">${key}</span>\n` +
  `${indent}  <span class="ps-label__value">${value}</span>\n` +
  `${indent}</div>`;

for (const [slug, d] of Object.entries(DATA)) {
  const path = `${dir}/${slug}.astro`;
  let src = readFileSync(path, 'utf8');

  /* 1. Titel finden (h1 mit ps-*-title). */
  const h1Rx = /^[ \t]*<h1 class="ps-[a-z-]+-title">[^<]*<\/h1>/m;
  const h1m = h1Rx.exec(src);
  if (!h1m) {
    console.error('Titel nicht gefunden: ' + slug);
    process.exitCode = 1;
    continue;
  }
  const h1Start = h1m.index;
  const indent = h1m[0].match(/^[ \t]*/)[0];

  /* 2. Meta-Block finden (direkt nach dem Titel, auf Folgezeile). */
  const after = h1Start + h1m[0].length;
  const metaRx = /^[ \t]*<div class="ps-meta-block[^"]*">/m;
  const metaStart = src.slice(after).search(metaRx);
  if (metaStart < 0) {
    console.error('Meta-Block nicht gefunden: ' + slug);
    process.exitCode = 1;
    continue;
  }
  const metaAbs = after + metaStart;
  const metaEnd = endOfTag(src, metaAbs, 'div');
  if (metaEnd < 0) {
    console.error('Meta-Block nicht geschlossen: ' + slug);
    process.exitCode = 1;
    continue;
  }
  /* Der Meta-Block endet mit dem schliessenden </div>; danach folgt
     ggf. eine Zeilenumbruch. */
  let end = metaEnd;
  const nl = src.indexOf('\n', end);
  if (nl >= 0 && src.slice(end, nl).trim() === '') end = nl + 1;

  const block =
    `${indent}<div class="ps-text">\n` +
    `${indent}  <h1 class="ps-title ps-${slug}-title">${d.title}</h1>\n` +
    `${indent}  <div class="ps-meta-block">\n` +
    `${indent}    <p class="ps-desc">${d.desc}</p>\n` +
    `${indent}    <div class="ps-labels">\n` +
    label(indent + '      ', 'Ort', d.ort) + '\n' +
    label(indent + '      ', 'Jahr', d.jahr) + '\n' +
    label(indent + '      ', 'Auftraggeber', d.client) + '\n' +
    `${indent}    </div>\n` +
    `${indent}  </div>\n` +
    `${indent}</div>\n`;

  src = src.slice(0, h1Start) + block + src.slice(end);
  writeFileSync(path, src);
  console.log('ok: ' + slug);
}
