import { readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

// Die alten ps-*-meta-Absaetze (fette Meta-Zeile aus dem PDF-Original) sind
// ueberflüssig: Description und Labels stehen jetzt im ps-meta-block.
for (const f of ['bubbles','balla-balla','sportler-in-bewegung','dschungel','stoerche-froesche','entwicklung','skydance','stadttor']) {
  const p = dir + f + '.astro';
  let c = readFileSync(p, 'utf8');
  const before = c;
  // <p class="ps-*-meta"> ... </p> entfernen (auch mehrzeilig)
  c = c.replace(/[ \t]*<p class="ps-[a-z]*-meta">[\s\S]*?<\/p>\r?\n/g, '');
  // Artist-Absaetze (ELKE PFAFFMANN) entfernen
  c = c.replace(/[ \t]*<p class="ps-[a-z]*-artist">[\s\S]*?<\/p>\r?\n/g, '');
  if (c !== before) {
    writeFileSync(p, c, 'utf8');
    console.log('bereinigt: ' + f);
  } else {
    console.log('unveraendert: ' + f);
  }
}
