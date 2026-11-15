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

/* Blocksatz funktioniert in schmalen Spalten nur mit Silbentrennung
   - sonst entstehen grosse Wortluecken. */
rep(
`.ps-balla-text-side {
  position: absolute; left: 7.47%; top: 74.5%; width: 24%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`,
`.ps-balla-text-side {
  position: absolute; left: 7.47%; top: 74.5%; width: 24%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify; hyphens: auto;
}`, 'balla text-side');

rep(
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify; hyphens: auto;
}`, 'bubbles text');

rep(
`.ps-skydance-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify;
}`,
`.ps-skydance-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify; hyphens: auto;
}`, 'skydance text');

rep(
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.58cqh; line-height: 1.24;
  margin-bottom: 1cqh;
  flex: 0 0 auto;
  text-align: justify;
}`,
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.58cqh; line-height: 1.24;
  margin-bottom: 1cqh;
  flex: 0 0 auto;
  text-align: justify; hyphens: auto;
}`, 'stadttor text');

writeFileSync(path, css);
console.log('CSS aktualisiert');
