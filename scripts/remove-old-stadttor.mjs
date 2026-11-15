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

/* Der alte, spaeter im File stehende Stadttor-Block ueberschreibt die
   neuen Regeln - er wird komplett entfernt. */
rep(
`/* ================================================================
 * stadttor: Titel, Description, Labels und Text in der linken Spalte
 * (PDF x=94). Foto mittig, zwei Ansichten rechts.
 * ================================================================ */
.ps-stadttor-side { position: absolute; left: 7.9%; top: 24.8%; width: 21%; }
.ps-stadttor-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
.ps-stadttor .ps-meta-block { position: static; width: 100%; margin-bottom: 1.5cqh; }
.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}
.ps-stadttor-fig1 { position: absolute; left: 33.2%; top: 3.9%; width: 41.8%; margin: 0; }
.ps-stadttor-fig1 img { width: 100%; height: auto; display: block; }
.ps-stadttor-fig2 { position: absolute; left: 76.6%; top: 52.7%; width: 20.3%; margin: 0; }
.ps-stadttor-fig3 { position: absolute; left: 76.6%; top: 26.9%; width: 20.3%; margin: 0; }
.ps-stadttor-fig2 img, .ps-stadttor-fig3 img { width: 100%; height: auto; display: block; }
`,
``, 'alter stadttor block');

writeFileSync(path, css);
console.log('alter Block entfernt');
