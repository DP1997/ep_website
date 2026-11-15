import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

const oldText = [
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

const newText = [
  ' * die volle Breite. Darunter ein dreispaltiges Band: links der',
  ' * Meta-Block (Titel, Beschreibung, Labels), in der Mitte Bild 2',
  ' * (Besuchereingang, 2119x807), rechts der Fliesstext.',
  ' * Spaltenbreiten: Meta 239.8, Bild 504.6, Fliesstext 330 Einheiten,',
  ' * zwei Luecken von je 16 Einheiten (40 + 239.8 + 16 + 504.6 + 16 +',
  ' * 330 = 1146.4 = rechte Kante von Bild 1).',
  ' * Die Bildbreite folgt aus der Hoehe des Inhaltstextfeldes: es ist',
  ' * 192.3 Einheiten hoch (Textspalte 330, 10 Zeilen), also ist das Bild',
  ' * 192.3 * 2.624 = 504.6 Einheiten breit. Unterkante Bild = Unterkante',
  ' * Inhaltstextfeld (beide 469.4); die Bildunterschrift haengt darunter.',
  ' * Alle drei Spalten beginnen auf der Hoehe 277 Einheiten, direkt unter',
  ' * der Bildunterschrift von Bild 1.',
].join(C);

css = css.replace(oldText, newText);
if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Kommentar aktualisiert');
