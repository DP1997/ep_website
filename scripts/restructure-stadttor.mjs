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

/* Stadttor: die linke Spalte traegt Titel, Beschreibung, Labels, den
   Text und darunter die beiden kleinen Bilder. Ihre Hoehe entspricht
   der des grossen Bildes rechts (PDF-y 37..817 -> top 3.9%,
   height 91.8%). */
rep(
`.ps-stadttor-side { position: absolute; left: 7.9%; top: 24.8%; width: 21%; }`,
`.ps-stadttor-side {
  position: absolute; left: 7.9%; top: 3.9%;
  width: 21%; height: 91.8%;
  display: flex; flex-direction: column;
}`, 'stadttor side');

rep(
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  margin-bottom: 2cqh;
}`, 'stadttor text');

rep(
`.ps-stadttor-fig1 { position: absolute; left: 33.2%; top: 3.9%; width: 41.8%; margin: 0; }
.ps-stadttor-fig1 img { width: 100%; height: auto; display: block; }
.ps-stadttor-fig2 { position: absolute; left: 76.6%; top: 52.7%; width: 20.3%; margin: 0; }
.ps-stadttor-fig3 { position: absolute; left: 76.6%; top: 26.9%; width: 20.3%; margin: 0; }
.ps-stadttor-fig2 img, .ps-stadttor-fig3 img { width: 100%; height: auto; display: block; }`,
`/* Das grosse Bild bleibt rechts, die beiden kleinen Bilder wandern
   unter den Text in die linke Spalte. */
.ps-stadttor-fig1 { position: absolute; left: 33.2%; top: 3.9%; width: 41.8%; margin: 0; }
.ps-stadttor-fig1 img { width: 100%; height: auto; display: block; }
.ps-stadttor-figs {
  margin-top: auto;
  display: flex; flex-direction: column; gap: 1.5cqh;
}
.ps-stadttor-fig2, .ps-stadttor-fig3 { margin: 0; }
.ps-stadttor-fig2 img, .ps-stadttor-fig3 img { width: 100%; height: auto; display: block; }`,
  'stadttor figures');

/* Der Textblock der linken Spalte sitzt direkt unter der Ueberschrift,
   die Labels darunter. */
rep(
`.ps-detail--skydance .ps-text,
.ps-detail--stadttor .ps-text { position: static; width: auto; margin-bottom: 1.5cqh; }`,
`.ps-detail--skydance .ps-text { position: static; width: auto; margin-bottom: 1.5cqh; }
.ps-detail--stadttor .ps-text { position: static; width: auto; margin-bottom: 0; }
.ps-detail--stadttor .ps-meta-block { margin-bottom: 1.5cqh; }`,
  'stadttor textblock');

/* Mobil: die Bilder-Gruppe fliesst mit. */
rep(
`  .ps-stadttor-fig1,
  .ps-stadttor-fig2,
  .ps-stadttor-fig3,
  .ps-stadttor-side {`,
`  .ps-stadttor-fig1,
  .ps-stadttor-fig2,
  .ps-stadttor-fig3,
  .ps-stadttor-figs,
  .ps-stadttor-side {`,
  'mobile list');

writeFileSync(path, css);
console.log('CSS aktualisiert');
