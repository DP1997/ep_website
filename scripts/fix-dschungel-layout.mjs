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

/* 1. Meta-Textblock in die Spalte der zwei kleinen Bilder:
      linksbuendig mit dem Bild direkt darueber, gleiche Spaltenbreite
      (PDF-x 71..235 wie .ps-dschungel-figures). */
rep(
`.ps-detail--dschungel .ps-text { left: 6.7%; top: 70.2%; width: 20%; }`,
`.ps-detail--dschungel .ps-text { left: 6%; top: 70.2%; width: 13.7%; }`,
  'dschungel meta');

/* 2. Drittes kleines Bild an die linke Aussenkante des Hauptbildes
      (PDF-x 269). */
rep(
`.ps-dschungel-fig4 { position: absolute; left: 31.7%; top: 63.5%; width: 15.3%; margin: 0; }`,
`.ps-dschungel-fig4 { position: absolute; left: 22.6%; top: 63.5%; width: 15.3%; margin: 0; }`,
  'dschungel fig4');

/* 3. Fliesstext mittig im verbleibenden Platz zwischen der rechten
      Aussenkante von fig4 (PDF-x 451) und der des Hauptbildes
      (PDF-x 1141). Der Block (Breite 43.3%) wird mittig in diesen
      Raum gesetzt: 451 + (1141 - 451 - 516) / 2 = 538 -> 45.2%. */
rep(
`.ps-dschungel-text {
  position: absolute; left: 50%; top: 69.6%; width: 43.3%;`,
`.ps-dschungel-text {
  position: absolute; left: 45.2%; top: 69.6%; width: 43.3%;`,
  'dschungel text');

writeFileSync(path, css);
console.log('CSS aktualisiert');
