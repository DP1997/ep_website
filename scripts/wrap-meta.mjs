import { readdirSync, readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

// Description und Labels in einen gemeinsamen Wrapper legen. Der Wrapper
// traegt die PDF-Position der Description, die Labels folgen darunter.
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.astro')) continue;
  const p = dir + f;
  const lines = readFileSync(p, 'utf8').split(/\r?\n/);

  const dIdx = lines.findIndex(l => l.includes('<p class="ps-desc">'));
  if (dIdx < 0) {
    console.log('keine Description: ' + f);
    continue;
  }
  // Indentierung der Description-Zeile bestimmen
  const indent = lines[dIdx].match(/^\s*/)[0];
  // Ende des Labels-Blocks finden (die letzte Zeile mit </div> vor der naechsten
  // Zeile auf gleicher oder kleinerer Ebene)
  let lIdx = lines.findIndex((l, i) => i > dIdx && l.includes('<div class="ps-labels">'));
  if (lIdx < 0) {
    console.log('keine Labels: ' + f);
    continue;
  }
  let endIdx = lIdx;
  let depth = 0;
  for (let i = lIdx; i < lines.length; i++) {
    const opens = (lines[i].match(/<div\b/g) || []).length;
    const closes = (lines[i].match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if (depth === 0 && i > lIdx) {
      endIdx = i;
      break;
    }
  }

  const inner = lines.slice(dIdx, endIdx + 1);
  const wrapped = [
    indent + '<div class="ps-meta-block">',
    ...inner.map(l => (l.trim() ? indent + '  ' + l.trim() : l)),
    indent + '</div>',
  ];
  lines.splice(dIdx, endIdx - dIdx + 1, ...wrapped);
  writeFileSync(p, lines.join('\n'));
  console.log('ok: ' + f + ' (Description+Labels in ps-meta-block)');
}
