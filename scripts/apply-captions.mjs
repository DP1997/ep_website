import { readFileSync, writeFileSync } from 'node:fs';

const patchFile = (file, pairs) => {
  let s = readFileSync(file, 'utf8');
  const E = s.includes('\r\n') ? '\r\n' : '\n';
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`${file}: nicht gefunden: ${a.slice(0, 60)}`);
    s = s.split(a).join(b);
  }
  writeFileSync(file, s, 'utf8');
};

// --- Balla Balla: Bildunterschrift nur noch "Standort 1", Beschreibung dafuer
patchFile('src/pages/projektstudien/balla-balla.astro', [
  ['<figcaption>Standort 1: Sportlereingang: Wandgestaltung mit Malerei, Glasfolierung und plastischen Emailelementen, 2020, ca. 14 m x 2,70 m</figcaption>',
   '<figcaption>Standort 1: Sportlereingang</figcaption>'],
  ['<p class="ps-desc">Wandgestaltung mit Malerei, Glasfolierung und Email, ca. 14 m x 2,70 m und 6,50 m x 3,50 m</p>',
   '<p class="ps-desc">Wandgestaltung mit Malerei, Glasfolierung und plastischen Emailelementen, ca. 14 m x 2,70 m und 6,50 m x 3,50 m</p>'],
]);
patchFile('src/content/projektstudien/balla-balla.md', [
  ["material: 'Malerei, Glasfolierung, Email, ca. 14 m x 2,70 m'",
   "material: 'Wandgestaltung mit Malerei, Glasfolierung und plastischen Emailelementen, ca. 14 m x 2,70 m und 6,50 m x 3,50 m'"],
]);

// --- Sportler in Bewegung: Bildunterschrift nur noch "Standort 1",
//     Beschreibung um "im Foyer" ergaenzt
patchFile('src/pages/projektstudien/sportler-in-bewegung.astro', [
  ['<figcaption>Schulsporthalle der Verbandsgemeinde Bad Bergzabern - Wandmalerei im Foyer, Standort 1: Sportlereingang, ca. 14 m x 2,70 m</figcaption>',
   '<figcaption>Standort 1: Sportlereingang</figcaption>'],
  ['<p class="ps-desc">Wandmalerei, ca. 14 m x 2,70 m</p>',
   '<p class="ps-desc">Wandmalerei im Foyer, ca. 14 m x 2,70 m</p>'],
]);
patchFile('src/content/projektstudien/sportler-in-bewegung.md', [
  ["material: 'Wandmalerei, ca. 14 m x 2,70 m'",
   "material: 'Wandmalerei im Foyer, ca. 14 m x 2,70 m'"],
]);

// --- Skydance: Bildunterschrift wie im PDF
patchFile('src/pages/projektstudien/skydance.astro', [
  ['<figcaption>Luftschlange „Skydance" und Wegführer aus Foyer des Kulturheims Weisenau in Mainz</figcaption>',
   '<figcaption>Luftschlange „Skydance" – Objekt für das Foyer des Kulturheims Weisenau in Mainz</figcaption>'],
]);

console.log('Bildunterschriften und Projektbeschreibungen angepasst');
