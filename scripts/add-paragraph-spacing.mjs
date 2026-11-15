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

/* Absatzabstaende im Fliesstext: ohne sie laufen die Absaetze
   ineinander und der Text wirkt wie ein Block. */
rep(
`.ps-text .ps-desc {`,
`/* Abstaende zwischen den Absaetzen des Fliesstextes. */
.ps-bubbles-text p,
.ps-balla-text-main p,
.ps-balla-text-side p,
.ps-sportler-text p,
.ps-dschungel-text p,
.ps-stoerche-text p,
.ps-entwicklung-text p,
.ps-skydance-text p,
.ps-stadttor-text p { margin: 0 0 0.8cqh; }
.ps-bubbles-text p:last-child,
.ps-balla-text-main p:last-child,
.ps-balla-text-side p:last-child,
.ps-sportler-text p:last-child,
.ps-dschungel-text p:last-child,
.ps-stoerche-text p:last-child,
.ps-entwicklung-text p:last-child,
.ps-skydance-text p:last-child,
.ps-stadttor-text p:last-child { margin-bottom: 0; }

.ps-text .ps-desc {`, 'absatzabstaende');

/* Bubbles: Blocksatz mit Silbentrennung (die Spalte ist 210 Einheiten
   breit, ohne Trennung gibt es grosse Wortluecken). */
rep(
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`,
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify; hyphens: auto;
}`, 'bubbles blocksatz');

writeFileSync(path, css);
console.log('CSS aktualisiert');
