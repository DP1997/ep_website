import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

const ADD = `
/* ================================================================
 * skydance: Titel, Description, Labels und Text in der linken Spalte
 * (PDF x=105). Beide Bilder oben buendig: die Raumplastik links
 * (x=365), der Schnitt rechts (x=595).
 * ================================================================ */
.ps-skydance-side { position: absolute; left: 8.8%; top: 4.4%; width: 17.7%; }
.ps-skydance-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
.ps-skydance .ps-meta-block { position: static; width: 100%; margin-bottom: 1.5cqh; }
.ps-skydance-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}
.ps-skydance-fig2 { position: absolute; left: 30.6%; top: 4.4%; width: 18.6%; margin: 0; }
.ps-skydance-fig2 img { width: 100%; height: auto; display: block; }
.ps-skydance-fig1 { position: absolute; left: 50%; top: 4.4%; width: 47.1%; margin: 0; }
.ps-skydance-fig1 img { width: 100%; height: auto; display: block; }

/* ================================================================
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
`;

css = css.trimEnd() + '\n' + ADD;
writeFileSync(path, css);
console.log('skydance/stadttor Desktop-Regeln ergaenzt');
