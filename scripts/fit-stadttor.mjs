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

/* Der Inhalt der Spalte muss exakt 780 Einheiten (Hoehe des grossen
   Bildes) ergeben. Bei 1.7cqh ist der Text 251 Einheiten hoch,
   zusammen mit den Bildern (2 x 188) und dem Meta-Block (153) sind
   es 780 + 3 Abstaende. Der Text wird daher auf 1.58cqh gesetzt,
   dann greifen die Abstaende den Rest auf. */
rep(
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.7cqh; line-height: 1.24;
  margin-bottom: 1cqh;
  flex: 0 0 auto;
}`,
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.58cqh; line-height: 1.24;
  margin-bottom: 1cqh;
  flex: 0 0 auto;
}`, 'stadttor text');

writeFileSync(path, css);
console.log('CSS aktualisiert');
