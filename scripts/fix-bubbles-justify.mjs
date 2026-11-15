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

/* Bubbles: die Textspalte ist nur 210 PDF-Einheiten breit. Blocksatz
   erzwingt dort so viele Silbentrennungen, dass es unruhig wirkt -
   deshalb bleibt diese Spalte linksbuendig. */
rep(
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
  text-align: justify; hyphens: auto;
}`,
`.ps-bubbles-text {
  position: absolute; left: 40.4%; top: 32.5%; width: 57%;
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}`, 'bubbles text zurueck');

writeFileSync(path, css);
console.log('CSS aktualisiert');
