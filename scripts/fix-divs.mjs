import { readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

for (const f of ['bubbles','balla-balla','sportler-in-bewegung','dschungel','stoerche-froesche','entwicklung','skydance','stadttor']) {
  const p = dir + f + '.astro';
  const lines = readFileSync(p, 'utf8').split('\n');

  // Finde den Meta-Block: <div class="ps-meta-block"> ... zugehoeriges </div>
  const mIdx = lines.findIndex(l => l.includes('<div class="ps-meta-block">'));
  if (mIdx < 0) { console.log('meta fehlt: ' + f); continue; }
  const indent = lines[mIdx].match(/^\s*/)[0];

  let depth = 0;
  let endIdx = -1;
  for (let i = mIdx; i < lines.length; i++) {
    depth += (lines[i].match(/<div\b/g) || []).length;
    depth -= (lines[i].match(/<\/div>/g) || []).length;
    if (depth === 0) { endIdx = i; break; }
  }
  if (endIdx < 0) { console.log('meta-Ende fehlt: ' + f); continue; }

  // Der Meta-Block muss genau mit einer Zeile "indent</div>" enden.
  const expected = indent + '</div>';
  if (lines[endIdx].trim() === '</div>') {
    lines[endIdx] = expected;
  } else {
    // Unerwartet: Zeile anpassen
    lines[endIdx] = expected;
  }
  writeFileSync(p, lines.join('\n'));

  const c2 = readFileSync(p, 'utf8');
  const o = (c2.match(/<div\b/g) || []).length;
  const cl = (c2.match(/<\/div>/g) || []).length;
  console.log((o === cl ? 'ok: ' : 'UNBALANCED: ') + f + ' (' + o + '/' + cl + ')');
}
