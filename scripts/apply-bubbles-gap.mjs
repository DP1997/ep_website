import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Bubbles: Abstand vom Meta-Block (Unterkante Label "Auftraggeber") zur
// Oberkante des ersten kleinen Bildes = Abstand der kleinen Bilder
// zueinander (3.76cqh = 32 Einheiten).
css = css.replace(
  `.ps-detail--bubbles .ps-text { position: static; width: 100%; margin-bottom: 1cqh; }`,
  `.ps-detail--bubbles .ps-text { position: static; width: 100%; margin-bottom: 3.76cqh; }`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Bubbles: Abstand Meta-Block -> erstes kleines Bild vergroessert');
