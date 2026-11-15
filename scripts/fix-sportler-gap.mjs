import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');

const before = css;

// 1) Abstand Meta-Block -> Fliesstext: die generische Regel
//    ".ps-detail--sportler .ps-text { margin: 0 }" hat die 1cqh-Regel
//    aus .ps-sportler-side .ps-text ueberschrieben (gleiche Spezifitaet,
//    spaeter im File). Deshalb hier explizit 1cqh.
css = css.replace(
  '.ps-detail--sportler .ps-text { position: static; width: 100%; margin: 0; }',
  '.ps-detail--sportler .ps-text { position: static; width: 100%; margin: 0 0 1cqh; }'
);

// 2) ueberfluessige Regel entfernen (Wirkung steckt jetzt in der
//    .ps-detail--sportler-Regel oben)
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 31.51%; width: 46.08%; }
/* Der Fliesstext steht unter dem Meta-Block in derselben Spalte. */
.ps-sportler-side .ps-text { margin-bottom: 1cqh; }`,
  `/* Linke Spalte: Meta-Block mit Titel, Beschreibung und Labels, darunter
   der Fliesstext (1cqh Abstand, siehe .ps-detail--sportler .ps-text). */
.ps-sportler-side { position: absolute; left: 3.36%; top: 31.51%; width: 46.08%; }`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('CSS gepatcht');
