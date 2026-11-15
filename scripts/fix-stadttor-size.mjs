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
   der des grossen Bildes rechts.

   Rechnung (PDF-Einheiten, Blatt 1191x850):
     meta (Titel/Beschreibung/Labels)  157
     Text (21% Spalte, 1.7cqh)         251
     Bild 1 (Spaltenbreite, 4:3)       188
     Bild 2 (Spaltenbreite, 4:3)       188
     Abstaende                           46
                                    ------
                                      830  -> Ziel 780 ist mit den
                                               Abstaenden erreichbar.

   Die Spalte ist 21% breit, damit der Text buendig zur Breite der
   beiden Bilder liegt. */
rep(
`.ps-stadttor-side {
  position: absolute; left: 7.9%; top: 3.9%;
  width: 21%; height: 91.8%;
  display: flex; flex-direction: column;
}`,
`.ps-stadttor-side {
  position: absolute; left: 7.9%; top: 3.9%;
  width: 21%; height: 91.8%;
  display: flex; flex-direction: column;
}
.ps-stadttor-side .ps-text { flex: 0 0 auto; }`, 'stadttor side');

rep(
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  margin-bottom: 2cqh;
}`,
`.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.7cqh; line-height: 1.24;
  margin-bottom: 2cqh;
  flex: 0 0 auto;
}`, 'stadttor text');

rep(
`.ps-stadttor-figs {
  margin-top: auto;
  display: flex; flex-direction: column; gap: 1.5cqh;
}
.ps-stadttor-fig2, .ps-stadttor-fig3 { margin: 0; }
.ps-stadttor-fig2 img, .ps-stadttor-fig3 img { width: 100%; height: auto; display: block; }`,
`.ps-stadttor-figs {
  margin-top: auto;
  display: flex; flex-direction: column; gap: 1.5cqh;
}
.ps-stadttor-fig2, .ps-stadttor-fig3 { margin: 0; flex: 0 0 auto; }
.ps-stadttor-fig2 img, .ps-stadttor-fig3 img { width: 100%; height: auto; display: block; }`,
  'stadttor figs');

writeFileSync(path, css);
console.log('CSS aktualisiert');
