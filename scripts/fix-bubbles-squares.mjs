import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

const rep = (from, to, label) => {
  const rx = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\r?\\n'), 's');
  if (!rx.test(css)) {
    console.error('NICHT GEFUNDEN: ' + label);
    process.exitCode = 1;
    return;
  }
  css = css.replace(rx, to.replace(/\n/g, '\r\n'));
};

/* ================================================================
 * Bubbles - die drei Detailbilder
 *
 * Im PDF sind die drei Detailbilder quadratisch (Ausschnitt aus dem
 * hochformatigen Original). Sie stehen in einer Spalte, die genau
 * so hoch ist wie der Text daneben: Oberkante Bild 1 = Oberkante
 * Text, Unterkante Bild 3 = Unterkante Text.
 *
 * Umsetzung: die Bildspalte ist eine Flex-Column mit
 * justify-content: space-between. Die Bilder sind quadratisch
 * (aspect-ratio 1/1, object-fit: cover wie im PDF) und die
 * restliche Hoehe verteilt sich auf die beiden Abstaende.
 *
 * Rechnung (PDF-Einheiten, Blatt 1191x850):
 *   Aside x 807..1175 (368 breit)
 *   Bildspalte  807..947  (140 breit -> 38% der Aside)
 *   Textspalte  969..1175 (206 breit -> 56% der Aside, 459 hoch)
 *   Bilder: 3 x 140 = 420, Rest 39 auf zwei Abstaende
 *   Zeile (Bilder + Text): y 556..97
 *   Meta-Block: y 747..612, darunter die Zeile
 *   Rand zum grossen Bild: oben 83, unten 82
 * ================================================================ */
rep(
`.ps-bubbles-details { position: absolute; left: 0; top: 0; width: 38.1%; height: 100%; }
.ps-bubbles-details img {
  position: absolute; left: 0; width: 100%; height: auto;
  display: block;
}
.ps-bubbles-details img:nth-child(1) { top: 12%; }
.ps-bubbles-details img:nth-child(2) { top: 38.5%; }
.ps-bubbles-details img:nth-child(3) { top: 64.9%; }`,
`.ps-bubbles-details {
  position: absolute; left: 0; top: 34.6%; width: 38%; height: 54%;
  display: flex; flex-direction: column; justify-content: space-between;
}
.ps-bubbles-details img {
  width: 100%; aspect-ratio: 1 / 1; object-fit: cover;
  display: block;
}`, 'bubbles bilder');

rep(
`.ps-bubbles-text {
  position: absolute; left: 44%; top: 12%; width: 56%;`,
`.ps-bubbles-text {
  position: absolute; left: 44%; top: 34.6%; width: 56%;`,
  'bubbles text');

/* Der Meta-Block sitzt direkt ueber der Zeile (Bilder + Text). */
rep(
`.ps-detail--bubbles .ps-text { left: 0%; top: 12%; width: 100%; }`,
`.ps-detail--bubbles .ps-text { left: 0%; top: 12.1%; width: 100%; }`,
  'bubbles meta');

/* Mobil: die Bilder stehen wieder nebeneinander in einer Zeile. */
rep(
`  .ps-bubbles-details { display: flex; flex-direction: row; gap: 0.75rem; }
  .ps-bubbles-details img { position: static; width: calc(33.33% - 0.5rem); height: auto; aspect-ratio: 1; object-fit: cover; }`,
`  .ps-bubbles-details {
    display: flex; flex-direction: row; gap: 0.75rem;
    position: static; top: auto; height: auto;
  }
  .ps-bubbles-details img {
    position: static; width: calc(33.33% - 0.5rem); height: auto;
    aspect-ratio: 1; object-fit: cover;
  }`,
  'bubbles mobil');

writeFileSync(path, css);
console.log('CSS aktualisiert');
