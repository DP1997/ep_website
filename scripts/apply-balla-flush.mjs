import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

// Balla Balla:
// 1) Meta-Block unterkantebuendig mit dem grossen Inhaltstextfeld rechts
//    (Textfeld endet bei 544.6, Meta-Block ist 132 hoch) -> Oberkante 412.6
css = css.replace(
  `.ps-detail--balla .ps-text { left: 7.47%; top: 42.76%; width: 26%; }`,
  `.ps-detail--balla .ps-text { left: 7.47%; top: 48.54%; width: 26%; }`
);
// 2) Kleines Inhaltstextfeld unten links unterkantebuendig mit dem unteren
//    Bild (Bild endet bei 750.7, Textfeld ist 129.7 hoch) -> Oberkante 621.0
css = css.replace(
  `.ps-balla-text-side {${'\r\n'}  position: absolute; left: 7.47%; top: 71.12%; width: 24%;`,
  `.ps-balla-text-side {${'\r\n'}  position: absolute; left: 7.47%; top: 73.06%; width: 24%;`
);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Balla Balla: Unterkanten angeglichen');
