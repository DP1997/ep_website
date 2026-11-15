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

rep(
`.ps-dschungel-text {
  position: absolute; left: 45.2%; top: 69.6%; width: 43.3%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-dschungel-text {
  position: absolute; left: 45.2%; top: 69.6%; width: 43.3%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'dschungel text');

rep(
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.58cqh; line-height: 1.24;
  margin-bottom: 1cqh;
  flex: 0 0 auto;
}`,
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.58cqh; line-height: 1.24;
  margin-bottom: 1cqh;
  flex: 0 0 auto;
  text-align: justify;
}`, 'stadttor text');

/* Bubbles: der Fliesstext steht in einer schmalen Spalte (210
   Einheiten). Blocksatz wuerde dort zu grossen Wortluecken
   fuehren - deshalb bleibt er linksbuendig. */
rep(
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`, 'bubbles text (unveraendert)');

writeFileSync(path, css);
console.log('CSS aktualisiert');
