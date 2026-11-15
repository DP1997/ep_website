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

/* Dschungel: Textblock vertikal zur Mitte des kleinen Bildes
   rechts daneben (fig4) ausrichten.

   fig4: PDF-y 60..310, Mitte 185. Der Textblock ist 173 PDF-Einheiten
   hoch, seine Mitte muss also bei 185 liegen -> Oberkante bei 271.5
   -> top = (850 - 271.5) / 850 = 68.06%. */
rep(
`.ps-detail--dschungel .ps-text { left: 6%; top: 70.2%; width: 13.7%; }`,
`.ps-detail--dschungel .ps-text { left: 6%; top: 68.06%; width: 13.7%; }`,
  'dschungel meta');

writeFileSync(path, css);
console.log('CSS aktualisiert');
