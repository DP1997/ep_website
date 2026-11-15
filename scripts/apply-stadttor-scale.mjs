import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Stadttor: das grosse Bild ist nach dem Ausschnitt der eingebrannten
// Unterschrift um 51 Einheiten kuerzer. Damit die Unterkante wieder
// buendig mit der Unterkante des zweiten kleinen Bildes (813.4) liegt,
// wird es im Verhaeltnis 1522:2230 skaliert:
//   Hoehe 780.25 -> Breite 780.25 * 1522/2230 = 532.5 (44.71 %)
// Die linke Kante bleibt, das Bild waechst nach rechts; dafuer wird der
// Blatt-Versatz um 17.25 Einheiten verringert, damit die Seite wieder
// horizontal zentriert ist (Union 195.8..1029.7 -> Mitte 595.5).
css = css.replace(
  `.ps-stadttor { --ps-center: 101.8; }`,
  `.ps-stadttor { --ps-center: 84.55; }`
);
css = css.replace(
  `.ps-stadttor-fig1 { position: absolute; left: 33.2%; top: 3.9%; width: 41.8%; margin: 0; }`,
  `.ps-stadttor-fig1 { position: absolute; left: 33.2%; top: 3.9%; width: 44.71%; margin: 0; }`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Stadttor: grosses Bild skaliert, Zentrierung angepasst');
