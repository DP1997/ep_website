import { readFileSync, writeFileSync } from 'node:fs';

const ASTRO = 'src/pages/projektstudien/sportler-in-bewegung.astro';
const CSS = 'src/styles/components/projektstudien.css';

const eol = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

// ---------------------------------------------------------------- Astro
let astro = readFileSync(ASTRO, 'utf8');
const E = eol(astro);

const textBlock = [
  '      <div class="ps-sportler-text">',
  '        <p>„Homo semper ludens – der Mensch spielt immer" ist das Leitmotiv der künstlerischen Ausgestaltung der Schulsporthalle in Bad Bergzabern. Dabei werden Menschen in sportlich spielerischer Aktion gezeigt. Der Entwurf sieht eine künstlerische Gestaltung an drei verschiedenen Standorten vor: im Foyer, im Besuchereingang und auf der Tribüne.</p>',
  '        <p>Alle drei Entwürfe thematisieren Sportler in Bewegung, die Freude am Spiel, Dynamik und Konzentration zeigen.</p>',
  '      </div>',
].join(E);

// Textblock aus der linken Spalte herausnehmen
const textRe = /[ \t]*<div class="ps-sportler-text">[\s\S]*?<\/div>\r?\n/;
if (!textRe.test(astro)) throw new Error('Textblock nicht gefunden');
astro = astro.replace(textRe, '');

// ... und rechts neben das Bild 2 setzen
const fig2Re = new RegExp(
  '(      <figure class="ps-sportler-fig2">[\\s\\S]*?</figure>)' + E
);
if (!fig2Re.test(astro)) throw new Error('fig2 nicht gefunden');
astro = astro.replace(fig2Re, '$1' + E + textBlock);

writeFileSync(ASTRO, astro, 'utf8');

// ----------------------------------------------------------------- CSS
let css = readFileSync(CSS, 'utf8');
const C = eol(css);
const before = css;

// Fliesstext wird eigene rechte Spalte (Position folgt aus dem Band)
css = css.replace(
  `.ps-sportler-text {${C}  position: static; width: 100%;${C}  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;${C}  text-align: justify;${C}}`,
  `.ps-sportler-text {${C}  position: absolute; left: 62.56%; top: 32.6%; width: 33.85%;${C}  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;${C}  text-align: justify;${C}}`
);

// Spaltenbreiten: Meta 31%, Bild 23%, Text 33.85% (Luecken 2.6% je)
css = css.replace(
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 46.08%; }`,
  `.ps-sportler-side { position: absolute; left: 3.36%; top: 32.6%; width: 31%; }`
);
css = css.replace(
  `.ps-sportler-fig2 { position: absolute; left: 51.44%; top: 32.6%; width: 44.82%; margin: 0; }`,
  `.ps-sportler-fig2 { position: absolute; left: 36.96%; top: 32.6%; width: 23%; margin: 0; }`
);

// Der Fliesstext steht nicht mehr unter dem Meta-Block: kein Abstand noetig
css = css.replace(
  `.ps-detail--sportler .ps-text { position: static; width: 100%; margin: 0 0 1cqh; }`,
  `.ps-detail--sportler .ps-text { position: static; width: 100%; margin: 0; }`
);

// Kommentar im CSS anpassen
css = css.replace(
  [
    ' * die volle Breite. Darunter links eine Spalte mit Meta-Block und',
    ' * Fliesstext untereinander, rechts das um 28% kleinere Bild 2',
    ' * (Besuchereingang, 2119x807; PDF-Breite 62.34%, hier 44.82%).',
    ' * Beide Spalten beginnen auf der Hoehe 277 Einheiten, direkt unter der',
    ' * Bildunterschrift von Bild 1. Die Aussenkanten der Elemente ergeben',
    ' * ein Rechteck (PDF-x 40..1146).',
  ].join(C),
  [
    ' * die volle Breite. Darunter ein dreispaltiges Band: links der',
    ' * Meta-Block (Titel, Beschreibung, Labels), in der Mitte das kleine',
    ' * Bild 2 (Besuchereingang, 2119x807), rechts der Fliesstext.',
    ' * Alle drei Spalten beginnen auf der Hoehe 277 Einheiten, direkt unter',
    ' * der Bildunterschrift von Bild 1. Die Aussenkanten der Elemente',
    ' * ergeben ein Rechteck (PDF-x 40..1146).',
  ].join(C)
);

if (css === before) throw new Error('kein CSS-Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Sportler: Dreispalten-Band gesetzt');
