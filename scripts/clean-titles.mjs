import { readdirSync, readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

// Anfuehrungszeichen um Titel entfernen: oeffnend U+201E/U+201C, schliessend
// U+201C/U+201D oder ASCII-Doppelzeichen.
const titleRe = /(<h1 class="ps-[a-z]*-title">)[ \u201E\u201C"]([^<]*)[ \u201E\u201C"](<\/h1>)/g;
// Artist-Zeile mit Elke Pfaffmann (Kleinschreibung) entfernen
const artistRe = /[ \t]*<p class="ps-sportler-artist">Elke Pfaffmann<\/p>\r?\n/g;

for (const f of readdirSync(dir)) {
  if (!f.endsWith('.astro')) continue;
  const p = dir + f;
  let c = readFileSync(p, 'utf8');
  const before = c;
  c = c.replace(titleRe, '$1$2$3');
  c = c.replace(artistRe, '');
  if (c !== before) {
    writeFileSync(p, c);
    console.log('geaendert: ' + f);
  }
}
