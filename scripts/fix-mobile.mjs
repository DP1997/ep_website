import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

// Die Desktop-Regeln stehen spaeter im File und haben hoehere Spezifitaet
// (.ps-skydance-side) als die Klassenliste im Mobile-Block. Deshalb steht
// hier am Ende noch einmal der Mobile-Umschalter - mit gleicher Spezifitaet
// aber spaeterer Position gewinnt er.

const CLASSES = [
  'ps-meta-block', 'ps-desc', 'ps-labels', 'ps-label', 'ps-stoerche-meta',
  'ps-bubbles-figure', 'ps-bubbles-aside', 'ps-bubbles-header', 'ps-bubbles-details',
  'ps-bubbles-idee', 'ps-bubbles-text', 'ps-bubbles-columns', 'ps-bubbles-title',
  'ps-balla-figure', 'ps-balla-figure2', 'ps-balla-text-main', 'ps-balla-text-side',
  'ps-balla-side', 'ps-balla-title',
  'ps-sportler-fig1', 'ps-sportler-fig2', 'ps-sportler-text', 'ps-sportler-side',
  'ps-sportler-title',
  'ps-dschungel-figures', 'ps-dschungel-main', 'ps-dschungel-fig4', 'ps-dschungel-artist',
  'ps-dschungel-side', 'ps-dschungel-title', 'ps-dschungel-text',
  'ps-stoerche-row', 'ps-stoerche-fig6', 'ps-stoerche-fig7', 'ps-stoerche-fig8',
  'ps-stoerche-title', 'ps-stoerche-text', 'ps-stoerche-side',
  'ps-entwicklung-fig', 'ps-entwicklung-title', 'ps-entwicklung-text', 'ps-entwicklung-side',
  'ps-skydance-text', 'ps-skydance-fig1', 'ps-skydance-fig2', 'ps-skydance-title',
  'ps-skydance-side',
  'ps-stadttor-title', 'ps-stadttor-text', 'ps-stadttor-fig1', 'ps-stadttor-fig2',
  'ps-stadttor-fig3', 'ps-stadttor-side',
];

const rule =
  '  ' + CLASSES.map(c => '.' + c).join(',\n  ') + ' {\n' +
  '    position: static;\n' +
  '    width: auto;\n' +
  '    height: auto;\n' +
  '    left: auto;\n' +
  '    top: auto;\n' +
  '    margin: 0 0 1.5rem;\n' +
  '  }\n';

css = css.trimEnd() + `

/* ================================================================
 * Mobil (max. 900px): alle Projektstudien-Elemente kommen in den
 * Fluss. Steht am Dateiende, damit es die Desktop-Positionen der
 * einzelnen Seiten ueberstimmt.
 * ================================================================ */
@media (max-width: 900px) {
` + rule + `}
`;

writeFileSync(path, css);
console.log('Mobile-Override ans Dateiende');
