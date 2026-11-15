import { readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

// Seiten, bei denen der Text in einer eigenen Spalte (rechts) steht und nicht
// unter den Metadaten.
const SEPARATE_TEXT = {
  bubbles: true,   // Text rechts neben den Details
  balla: true,     // Text rechts (PDF-Spalte x=419)
  sportler: true,  // Text rechts (PDF-Spalte x=409)
  dschungel: true, // Text rechts (PDF-Spalte x=596)
  stoerche: true,  // Text rechts (PDF-Spalte x=488)
  entwicklung: true,// Text rechts (PDF-Spalte x=375)
  skydance: false, // Text unter den Metadaten, linke Spalte
  stadttor: false, // Text unter den Metadaten, linke Spalte
};

for (const f of ['bubbles','balla-balla','sportler-in-bewegung','dschungel','stoerche-froesche','entwicklung','skydance','stadttor']) {
  const p = dir + f + '.astro';
  let c = readFileSync(p, 'utf8');
  const separate = SEPARATE_TEXT[f];

  // Meta-Block (Description + Labels) einsammeln
  const metaRe = /([ \t]*)<div class="ps-meta-block">[\s\S]*?\n\1<\/div>/;
  const mm = c.match(metaRe);
  if (!mm) { console.log('meta fehlt: ' + f); continue; }
  const metaBlock = mm[0].replace(/^[ \t]*<div class="ps-meta-block">\n/, '').replace(/\n[ \t]*<\/div>$/, '');

  // Text-Block einsammeln
  const textRe = /([ \t]*)<div class="ps-(?:bubbles|balla-text-side|sportler|dschungel|stoerche|entwicklung|skydance|stadttor)-text">[\s\S]*?\n\1<\/div>/;
  const tm = c.match(textRe);
  if (!tm) { console.log('text fehlt: ' + f); continue; }
  const textBlock = tm[0].replace(/^[ \t]*<div class="ps-[a-z-]*text">\n/, '').replace(/\n[ \t]*<\/div>$/, '');

  const h1Re = /([ \t]*)<h1 class="ps-[a-z-]*title">[^<]*<\/h1>/;
  const hm = c.match(h1Re);
  if (!hm) { console.log('h1 fehlt: ' + f); continue; }
  const indent = hm[1];
  const inner = indent + '  ';

  // Neuer Aufbau: Titel + Meta-Block im Wrapper, Text entweder darunter
  // (gleiche Spalte) oder an seiner PDF-Position (eigene Spalte).
  const wrapper =
    indent + '<div class="ps-body">\n' +
    inner + hm[0].trim() + '\n' +
    inner + '<div class="ps-meta-block">\n' +
    metaBlock.split('\n').map(l => (l.trim() ? inner + '  ' + l.trim() : l)).join('\n') + '\n' +
    inner + '</div>\n' +
    (separate
      ? ''
      : inner + '<div class="ps-body-text">\n' +
        textBlock.split('\n').map(l => (l.trim() ? inner + '  ' + l.trim() : l)).join('\n') + '\n' +
        inner + '</div>\n') +
    indent + '</div>\n';

  c = c.replace(metaRe, '__METABLOCK__');
  c = c.replace(textRe, '__TEXTBLOCK__');
  c = c.replace(h1Re, wrapper);
  c = c.replace('__METABLOCK__\n', '');
  c = c.replace('__TEXTBLOCK__\n', '');
  c = c.replace(/^[ \t]*\n/gm, '');

  writeFileSync(p, c, 'utf8');
  console.log('ok: ' + f + (separate ? ' (Text eigene Spalte)' : ' (Text unter Meta)'));
}
