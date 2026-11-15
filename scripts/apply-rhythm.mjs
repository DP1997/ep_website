import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

const rep = (from, to, label) => {
  // tolerant gegen \r\n
  const rx = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\n/g, '\\r?\\n').replace(/\n/g, '\\r?\\n'), 's');
  if (!rx.test(css)) {
    console.error('NICHT GEFUNDEN: ' + label);
    process.exitCode = 1;
    return;
  }
  css = css.replace(rx, to.replace(/\n/g, '\r\n'));
};

/* --- Titel: aus der absoluten Position loesen, fett setzen --- */
rep(
`.ps-bubbles-title {
  position: absolute; left: 0; top: 9.9%;
  font-family: var(--font-sans-serif); font-size: 3.53cqh; font-weight: 400;
  line-height: 1.05;
}`,
`.ps-bubbles-title {
  font-family: var(--font-sans-serif); font-size: 3.53cqh; font-weight: 700;
  line-height: 1.05;
}`, 'bubbles title');

rep(
`.ps-balla-title {
  position: absolute; left: 7.5%; top: 49.2%;
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 400; line-height: 1.1;
}`,
`.ps-balla-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700; line-height: 1.15;
}`, 'balla title');

rep(
`.ps-sportler-title {
  position: absolute; left: 6.6%; top: 54.2%;
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 400; line-height: 1.1;
}`,
`.ps-sportler-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700; line-height: 1.15;
}`, 'sportler title');

rep(
`.ps-dschungel-title {
  position: absolute; left: 6.7%; top: 70.2%;
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 400; line-height: 1.1;
}`,
`.ps-dschungel-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700; line-height: 1.15;
}`, 'dschungel title');

rep(
`.ps-stoerche-title { position: absolute; left: 7%; top: 78.1%; width: 32%; }
.ps-stoerche-meta { position: absolute; left: 7%; top: 88%; width: 32%; }
.ps-stoerche .ps-desc { white-space: nowrap; }

.ps-stoerche-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0;
}`,
`.ps-stoerche .ps-desc { white-space: nowrap; }

.ps-stoerche-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15;
}`, 'stoerche title');

/* --- Metadaten-Rhythmus --- */
rep(
`.ps-meta-block { position: absolute; }
.ps-desc {
  font-family: var(--font-sans-serif); font-size: 1.35cqh; font-weight: 700;
  line-height: 1.25; margin: 0 0 0.8cqh;
}
.ps-labels { display: flex; flex-direction: column; gap: 0.5cqh; }`,
`/* ================================================================
 * Textblock aller Projektstudien-Seiten, identischer Rhythmus:
 *
 *   Titel (fett)
 *     kleiner Abstand
 *   Beschreibung (fett)
 *     groesserer Abstand
 *   Ort
 *     kleiner Abstand
 *   Jahr
 *     kleiner Abstand
 *   Auftraggeber
 *
 * Die Labels stehen untereinander, der Key in Petrol small-caps,
 * der Wert in Serif.
 * ================================================================ */
.ps-text { position: absolute; }
.ps-text .ps-title { position: static; margin: 0 0 1cqh; }
.ps-meta-block { position: static; width: auto; margin: 0; }
.ps-desc {
  font-family: var(--font-sans-serif); font-size: 1.35cqh; font-weight: 700;
  line-height: 1.25; margin: 0 0 2cqh;
}
.ps-labels { display: flex; flex-direction: column; gap: 1cqh; }`, 'meta rhythm');

/* --- Positionen je Seite --- */
rep(
`/* Meta-Block je Seite: Position (PDF-y der Description) und Spaltenbreite. */
.ps-detail--bubbles .ps-meta-block { left: 0%; top: 15.9%; width: 100%; }
.ps-detail--balla .ps-meta-block { left: 7.5%; top: 54.8%; width: 26%; }
.ps-detail--sportler .ps-meta-block { left: 6.6%; top: 61.2%; width: 26%; }
.ps-detail--dschungel .ps-meta-block { left: 6.7%; top: 75.2%; width: 20%; }
.ps-detail--entwicklung .ps-meta-block { position: static; width: 100%; }
.ps-detail--entwicklung .ps-meta-block { position: static; width: 100%; }`,
`/* Textblock je Seite: Position (PDF-x/y des Titels) und Spaltenbreite. */
.ps-detail--bubbles .ps-text { left: 0%; top: 9.9%; width: 100%; }
.ps-detail--balla .ps-text { left: 7.5%; top: 49.2%; width: 26%; }
.ps-detail--sportler .ps-text { left: 6.6%; top: 54.2%; width: 26%; }
.ps-detail--dschungel .ps-text { left: 6.7%; top: 70.2%; width: 20%; }
.ps-detail--stoerche .ps-text { left: 7%; top: 81.2%; width: 32%; }`, 'page positions');

rep(
`/* skydance und stadttor: Description und Labels stehen im Side-Block unter
   dem Titel, der Text darunter. */
.ps-skydance .ps-meta-block,
.ps-stadttor .ps-meta-block { position: static; width: 100%; margin-bottom: 1.5cqh; }`,
`/* skydance und stadttor: Titel, Description und Labels stehen in der
   Seiten-Spalte, der Fliesstext folgt darunter. */
.ps-detail--skydance .ps-text,
.ps-detail--stadttor .ps-text { position: static; width: auto; margin-bottom: 1.5cqh; }`, 'skydance meta');

/* --- Mobil: Textblock in den Fluss --- */
rep(
`  .ps-meta-block,
  .ps-desc,
  .ps-labels,
  .ps-label,
  .ps-bubbles-figure,`,
`  .ps-meta-block,
  .ps-desc,
  .ps-labels,
  .ps-label,
  .ps-text,
  .ps-bubbles-figure,`, 'mobile list 1');

rep(
`  .ps-meta-block,
  .ps-desc,
  .ps-labels,
  .ps-label,
  .ps-stoerche-meta,
  .ps-bubbles-figure,`,
`  .ps-meta-block,
  .ps-desc,
  .ps-labels,
  .ps-label,
  .ps-text,
  .ps-stoerche-meta,
  .ps-bubbles-figure,`, 'mobile list 2');

/* --- Mobil: Seiten-Positionen der Textbloecke aufheben --- */
const mobileOverride = `
/* ================================================================
 * Mobil (max. 900px): die Seiten-Positionen der Textbloecke werden
 * aufgehoben, der Block fliesst wie der Rest der Seite.
 * ================================================================ */
@media (max-width: 900px) {
  .ps-detail--bubbles .ps-text,
  .ps-detail--balla .ps-text,
  .ps-detail--sportler .ps-text,
  .ps-detail--dschungel .ps-text,
  .ps-detail--stoerche .ps-text,
  .ps-detail--skydance .ps-text,
  .ps-detail--stadttor .ps-text {
    position: static;
    left: auto;
    top: auto;
    width: auto;
    margin: 0 0 1.5rem;
  }
}
`;

css = css.trimEnd() + '\r\n' + mobileOverride.replace(/\n/g, '\r\n');
writeFileSync(path, css);
console.log('CSS aktualisiert');
