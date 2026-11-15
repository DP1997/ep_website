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

/* ---------------------------------------------------------------
 * Balla Balla: ein Raster aus einer senkrechten Linie.
 *
 * Das PDF-Original (3.KAB.BZA.2) hat folgendes Raster:
 *   Bild 1        x=81
 *   Caption 1     x=89   (8pt eingerueckt)
 *   Textspalte    x=89   (8pt eingerueckt, buendig mit Caption 1)
 *   Bild 2        x=417
 *   Caption 2     x=424  (8pt eingerueckt)
 *
 * Auf der Website wird diese Linie bei x=89 gezogen:
 *   - Caption 1 buendig bei x=89
 *   - Meta-Block (Titel/Beschreibung/Labels) linksbuendig bei x=89
 *   - der Textblock unten links ebenfalls bei x=89
 *   - der grosse Textblock rechts beginnt auf Hoehe der Oberkante
 *     des Meta-Blocks (PDF-y 523)
 *
 * Umrechnung: x=89 entspricht 89/1191 = 7.47% des Blatts.
 * Caption-Einzug: 8pt bei Bildbreite 1056pt = 0.76% bzw. bei
 * Bild 2 (720pt) = 1.11%.
 * --------------------------------------------------------------- */
rep(
`.ps-detail--balla .ps-text { left: 7.5%; top: 49.2%; width: 26%; }`,
`.ps-detail--balla .ps-text { left: 7.47%; top: 38.5%; width: 26%; }`,
  'balla meta');

rep(
`.ps-balla-text-side {
  position: absolute; left: 7.3%; top: 74.5%; width: 24%;`,
`.ps-balla-text-side {
  position: absolute; left: 7.47%; top: 74.5%; width: 24%;`,
  'balla text-side');

rep(
`.ps-balla-figure figcaption {
  position: absolute; left: 0.7%; top: 100%; margin-top: 1.6cqh;`,
`.ps-balla-figure figcaption {
  position: absolute; left: 0.76%; top: 100%; margin-top: 1.6cqh;`,
  'balla cap1');

rep(
`.ps-balla-figure2 figcaption {
  position: absolute; left: 0.98%; top: 100%; margin-top: 1.6cqh;`,
`.ps-balla-figure2 figcaption {
  position: absolute; left: 1.11%; top: 100%; margin-top: 1.6cqh;`,
  'balla cap2');

/* Sportler: Caption-Einzug ebenfalls auf 8pt (PDF: 47 bzw. 412). */
rep(
`.ps-sportler-fig1 figcaption {
  position: absolute; left: 0.6%; top: 100%; margin-top: 1.6cqh;`,
`.ps-sportler-fig1 figcaption {
  position: absolute; left: 0.72%; top: 100%; margin-top: 1.6cqh;`,
  'sportler cap1');

rep(
`.ps-sportler-fig2 figcaption {
  position: absolute; left: 0.94%; top: 100%; margin-top: 1.6cqh;`,
`.ps-sportler-fig2 figcaption {
  position: absolute; left: 1.08%; top: 100%; margin-top: 1.6cqh;`,
  'sportler cap2');

writeFileSync(path, css);
console.log('CSS aktualisiert');
