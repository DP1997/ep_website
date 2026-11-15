import { readFileSync, writeFileSync } from 'node:fs';

// ---------------------------------------------------------------- Astro
const ASTRO = 'src/pages/projektstudien/entwicklung.astro';
let astro = readFileSync(ASTRO, 'utf8');
const E = astro.includes('\r\n') ? '\r\n' : '\n';
const beforeA = astro;

const p1 = '        <p>Die Fassadengestaltung besteht aus farbig emaillierten Stahlblechen unterschiedlicher Formelemente. Ein sich entfaltendes, junges Farnblatt steht dabei im Zentrum der künstlerischen Gestaltung.</p>';
const p2 = '        <p>Der Farn steht für die Entwicklung des Lebens schlechthin – hier im übertragenden Sinne für das Ziel der Kita, in geschütztem Rahmen die geistige und körperliche Entwicklung sowie die individuelle „Entfaltung" der anvertrauten Kinder zu fördern. Der Aufwärtsschwung der Gesamtkomposition weist über die Architektur der Kita hinaus in eine freie, lichte Zukunft.</p>';

const oldBlock = [
  '      <div class="ps-entwicklung-text">',
  p1,
  p2,
  '      </div>',
].join(E);

const newBlock = [
  '      <div class="ps-entwicklung-text-1">',
  p1,
  '      </div>',
  '      <div class="ps-entwicklung-text">',
  p2,
  '      </div>',
].join(E);

if (!astro.includes(oldBlock)) throw new Error('Textblock nicht gefunden');
astro = astro.replace(oldBlock, newBlock);
writeFileSync(ASTRO, astro, 'utf8');

// ------------------------------------------------------------------ CSS
const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const beforeC = css;

css = css.replace(
  `.ps-entwicklung-text {${C}  position: absolute; left: 41.3%; top: 75.8%; width: 50%;${C}  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;${C}  text-align: justify;${C}}`,
  `/* Zwei Inhaltstextfelder, getrennt nach Absatz. Das erste Feld steht${C} * mittig zwischen Meta-Block und zweitem Textfeld, das zweite Feld${C} * buendig mit der rechten Bildkante. Beide Felder schliessen oben und${C} * unten mit dem Meta-Block ab (644.3..776.3). */${C}.ps-entwicklung-text-1 {${C}  position: absolute; left: 34.41%; top: 75.8%; width: 21.33%;${C}  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;${C}  text-align: justify;${C}}${C}.ps-entwicklung-text {${C}  position: absolute; left: 61.68%; top: 75.8%; width: 28.55%;${C}  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;${C}  text-align: justify;${C}}`
);

css = css.replace(
  `.ps-entwicklung-text p { margin: 0 0 0.62cqh; }`,
  `.ps-entwicklung-text p, .ps-entwicklung-text-1 p { margin: 0 0 0.62cqh; }`
);
css = css.replace(
  `.ps-entwicklung-text p:last-child { margin-bottom: 0; }`,
  `.ps-entwicklung-text p:last-child, .ps-entwicklung-text-1 p:last-child { margin-bottom: 0; }`
);

// Gemeinsame Absatzabstaende
css = css.replace(
  `.ps-sportler-text p,`,
  `.ps-entwicklung-text p,${C}.ps-entwicklung-text-1 p,${C}.ps-sportler-text p,`
);
css = css.replace(
  `.ps-entwicklung-text p:last-child,${C}.ps-skydance-text p:last-child,`,
  `.ps-entwicklung-text p:last-child,${C}.ps-entwicklung-text-1 p:last-child,${C}.ps-skydance-text p:last-child,`
);

if (css === beforeC) throw new Error('kein CSS-Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Entwicklung: Textfeld in zwei Felder geteilt');
