import { readFileSync, writeFileSync } from 'fs';

/* Frontmatter der Collection an die Seiten angleichen. */
const DATA = {
  'bubbles': { title: 'Bubbles', year: '2023', location: 'Hallenbad Neubau Altenkirchen', client: 't.b.d.' },
  'balla-balla': { title: 'Balla Balla', year: '2020', location: 'Verbandsgemeindesporthalle Bad Bergzabern', client: 'Verbandsgemeinde Bad Bergzabern' },
  'sportler-in-bewegung': { title: 'Sportler in Bewegung', year: '2020', location: 'Schulsporthalle Bad Bergzabern', client: 'Verbandsgemeinde Bad Bergzabern' },
  'dschungel': { title: 'Dschungel', year: 't.b.d.', location: 'Kita Jakob Laubach-Straße, Mainz', client: 't.b.d.' },
  'stoerche-froesche': { title: 'Störche & Frösche', year: '2003/2025', location: 'Offenbach/Queich', client: 'Verbandsgemeinde Offenbach' },
  'entwicklung': { title: 'Entwicklung', year: '2021', location: 'Kita zum Abtswald, Wörth/Rh.', client: 't.b.d.' },
  'skydance': { title: 'Skydance', year: '2022', location: 'Kulturheim Weisenau, Mainz', client: 'Stadt Mainz' },
  'stadttor': { title: 'Stadttor', year: '2017', location: 'Universität Koblenz-Landau', client: 'Staatsbauamt Mainz' },
};

const dir = 'src/content/projektstudien';

for (const [slug, d] of Object.entries(DATA)) {
  const path = `${dir}/${slug}.md`;
  const src = readFileSync(path, 'utf8');

  /* Frontmatter: zwischen dem ersten und dem zweiten '---'. */
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
  out = set(out, 'title', d.title);
  out = set(out, 'location', d.location);
  out = set(out, 'year', d.year);
  out = set(out, 'client', d.client);

  writeFileSync(path, '---' + out + rest);
  console.log('ok: ' + slug);
}
