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
 * Bubbles
 *
 * Das grosse Bild links reicht von PDF-y 15 bis 830. Die rechte
 * Spalte (Titel/Beschreibung/Labels + Bilder/Text) wird vertikal
 * so ausgerichtet, dass der Abstand nach oben und unten zum grossen
 * Bild gleich gross ist.
 *
 * Rechnung:
 *   Spaltenhoehe = Meta-Block 136 + Abstand 56 + Text/Bilder 459
 *                = 651
 *   Bildhoehe    = 815
 *   Rand oben = Rand unten = (815 - 651) / 2 = 82
 *   Spalte: 15+82 = 97  bis  830-82 = 748
 *
 *   Meta-Block   748 .. 612   -> top 12%
 *   Text/Bilder  592 .. 133   -> top 30.35%
 *
 * Die drei kleinen Bilder (natuerlich 172x246) werden im
 * Seitenverhaeltnis skaliert, sodass die Bilderspalte genau den
 * Bereich des Textes abdeckt:
 *   Bildhoehe = 459 / 3.46 = 132.7 (3 Bilder + 2 Abstaende von 0.23 h)
 *   Bildbreite = 132.7 * 172/246 = 92.8  ->  25.2% der Bilderspalte
 * ================================================================ */
rep(
`.ps-detail--bubbles .ps-text { left: 0%; top: 9.9%; width: 100%; }`,
`.ps-detail--bubbles .ps-text { left: 0%; top: 12%; width: 100%; }`, 'bubbles meta');

rep(
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;`,
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 30.35%; width: 57%;`, 'bubbles text');

rep(
`.ps-bubbles-details img {
  position: absolute; left: 0; width: 100%; height: 14.35%;
  object-fit: fill; display: block;
}
.ps-bubbles-details img:nth-child(1) { top: 35.6%; }
.ps-bubbles-details img:nth-child(2) { top: 53.4%; }
.ps-bubbles-details img:nth-child(3) { top: 70.9%; }`,
`.ps-bubbles-details img {
  position: absolute; left: 0; width: 25.2%; height: auto;
  display: block;
}
.ps-bubbles-details img:nth-child(1) { top: 30.35%; }
.ps-bubbles-details img:nth-child(2) { top: 49.55%; }
.ps-bubbles-details img:nth-child(3) { top: 68.75%; }`, 'bubbles bilder');

/* ================================================================
 * Balla Balla
 *
 * Der mittlere Textblock bekommt dieselbe horizontale Ausdehnung
 * wie das untere kleinere Bild (PDF-x 417..1137), damit links und
 * rechts buendig mit den Aussenkanten des Bildes schliessen.
 * Dadurch wird der Text kuerzer; das untere Bild rueckt um
 * denselben Betrag nach oben, der Abstand dazwischen bleibt gleich.
 *
 * Der Meta-Block wird vertikal zur Mitte des mittleren Textblocks
 * ausgerichtet, der linke untere Textblock zur Mitte des unteren
 * Bildes.
 * ================================================================ */
rep(
`.ps-detail--balla .ps-text { left: 7.47%; top: 38.5%; width: 26%; }`,
`.ps-detail--balla .ps-text { left: 7.47%; top: 42.76%; width: 26%; }`, 'balla meta');

rep(
`.ps-balla-text-main {
  position: absolute; left: 35.2%; top: 38.5%; width: 57%;`,
`.ps-balla-text-main {
  position: absolute; left: 35%; top: 38.5%; width: 60.5%;`, 'balla text-main');

rep(
`.ps-balla-figure2 { position: absolute; left: 35%; top: 69.1%; width: 60.5%; margin: 0; }`,
`.ps-balla-figure2 { position: absolute; left: 35%; top: 66.94%; width: 60.5%; margin: 0; }`,
  'balla fig2');

rep(
`.ps-balla-text-side {
  position: absolute; left: 7.47%; top: 74.5%; width: 24%;`,
`.ps-balla-text-side {
  position: absolute; left: 7.47%; top: 71.12%; width: 24%;`, 'balla text-side');

writeFileSync(path, css);
console.log('CSS aktualisiert');
