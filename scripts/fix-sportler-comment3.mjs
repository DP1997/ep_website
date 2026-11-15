import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

const oldText = [
  ' * die volle Breite. Darunter ein dreispaltiges Band: links der',
  ' * Meta-Block (Titel, Beschreibung, Labels), in der Mitte das kleine',
  ' * Bild 2 (Besuchereingang, 2119x807), rechts der Fliesstext.',
  ' * Spaltenbreiten: Meta und Fliesstext je 348.5 Einheiten, Bild 353.5',
  ' * Einheiten, zwei Luecken von je 28 Einheiten. Das Bild liegt damit',
  ' * genau in der Seitenmitte, die Aussenkanten (Meta links, Fliesstext',
  ' * rechts) sind buendig mit Bild 1 (40..1146). Alle drei Spalten',
  ' * beginnen auf der Hoehe 277 Einheiten, direkt unter der Bildunter-',
  ' * schrift von Bild 1.',
].join(C);

const newText = [
  ' * die volle Breite. Darunter ein dreispaltiges Band: links der',
  ' * Meta-Block (Titel, Beschreibung, Labels), in der Mitte Bild 2',
  ' * (Besuchereingang, 2119x807), rechts der Fliesstext.',
  ' * Spaltenbreiten: Meta 338, Bild 390, Fliesstext 330 Einheiten, zwei',
  ' * Luecken von je 24 Einheiten (40 + 338 + 24 + 390 + 24 + 330 =',
  ' * 1146.4 = rechte Kante von Bild 1). Die Bildbreite ist so gewaehlt,',
  ' * dass Bild und Bildunterschrift (148.6 + 13.6 + 30.1 = 192.3',
  ' * Einheiten) genau so hoch sind wie das Inhaltstextfeld rechts: beide',
  ' * Spalten enden auf derselben Linie. Alle drei Spalten beginnen auf',
  ' * der Hoehe 277 Einheiten, direkt unter der Bildunterschrift von',
  ' * Bild 1.',
].join(C);

css = css.replace(oldText, newText);
if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Kommentar aktualisiert');
