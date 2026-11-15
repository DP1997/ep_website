import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

const oldText = [
  '/* Das grosse Bild bleibt rechts, die beiden kleinen Bilder wandern',
  '   unter den Text in die linke Spalte. */',
].join(C);

const newText = [
  '/* Das grosse Bild bleibt rechts, die beiden kleinen Bilder wandern',
  '   unter den Text in die linke Spalte.',
  '   Das grosse Bild ist der Ausschnitt ohne die eingebrannte Unterschrift',
  '   (1522x2230 statt 1522x2383) und wurde deshalb um 7 % skaliert:',
  '   Hoehe 780.1 -> Breite 532.5 (44.71 %), damit die Unterkante wieder',
  '   buendig mit der Unterkante des zweiten kleinen Bildes liegt (813).',
  '   Der Blatt-Versatz (--ps-center) ist um 17.25 Einheiten kleiner,',
  '   damit der Inhalt weiterhin horizontal mittig im Blatt liegt. */',
].join(C);

if (!css.includes(oldText)) throw new Error('Kommentar nicht gefunden');
css = css.replace(oldText, newText);
writeFileSync(CSS, css, 'utf8');
console.log('Stadttor-Kommentar aktualisiert');
