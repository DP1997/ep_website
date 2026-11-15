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
 * 1. Bildunterschriften: im PDF-Original sind sie immer 7pt
 *    eingerueckt (nicht buendig mit der Bildkante). Das wird
 *    projektweit vereinheitlicht.
 * --------------------------------------------------------------- */
rep(
`.ps-balla-figure figcaption {
  position: absolute; left: 0.7%; top: 100%; margin-top: 1.6cqh;`,
`.ps-balla-figure figcaption {
  position: absolute; left: 0.7%; top: 100%; margin-top: 1.6cqh;`,
  'balla cap1 (unveraendert)');

rep(
`.ps-balla-figure2 figcaption {
  position: absolute; left: 0; top: 100%; margin-top: 1.6cqh;`,
`.ps-balla-figure2 figcaption {
  position: absolute; left: 0.98%; top: 100%; margin-top: 1.6cqh;`,
  'balla cap2');

rep(
`.ps-sportler-fig2 figcaption {
  position: absolute; left: 0.5%; top: 100%; margin-top: 1.6cqh;`,
`.ps-sportler-fig2 figcaption {
  position: absolute; left: 0.94%; top: 100%; margin-top: 1.6cqh;`,
  'sportler cap2');

/* ---------------------------------------------------------------
 * 2. Blocksatz fuer die Fliesstext-Absaetze. Nicht fuer die
 *    Beschreibung (.ps-desc) und nicht fuer die Labels.
 * --------------------------------------------------------------- */
rep(
`.ps-balla-text-main {
  position: absolute; left: 35.2%; top: 38.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-balla-text-main {
  position: absolute; left: 35.2%; top: 38.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'balla text-main');

rep(
`.ps-balla-text-side {
  position: absolute; left: 7.3%; top: 74.5%; width: 24%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-balla-text-side {
  position: absolute; left: 7.3%; top: 74.5%; width: 24%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'balla text-side');

rep(
`.ps-sportler-text {
  position: absolute; left: 34.3%; top: 45.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-sportler-text {
  position: absolute; left: 34.3%; top: 45.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'sportler text');

rep(
`.ps-dschungel-text {
  position: absolute; left: 50%; top: 69.6%; width: 43.3%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-dschungel-text {
  position: absolute; left: 50%; top: 69.6%; width: 43.3%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'dschungel text');

rep(
`.ps-stoerche-text {
  position: absolute; left: 41%; top: 83.8%; width: 53%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-stoerche-text {
  position: absolute; left: 41%; top: 83.8%; width: 53%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'stoerche text');

rep(
`.ps-entwicklung-text {
  position: absolute; left: 31.5%; top: 79.2%; width: 60%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-entwicklung-text {
  position: absolute; left: 31.5%; top: 79.2%; width: 60%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'entwicklung text');

rep(
`.ps-skydance-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-skydance-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'skydance text');

rep(
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`, 'stadttor text');

writeFileSync(path, css);
console.log('CSS aktualisiert');
