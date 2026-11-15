import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const before = css;

const oldText = [
  ' * die volle Breite. Darunter links eine Spalte mit Meta-Block und',
  ' * Fliesstext untereinander, rechts das um 35% kleinere Bild 2',
  ' * (Besuchereingang, 2119x807). Die Aussenkanten der Elemente ergeben',
  ' * ein Rechteck (PDF-x 40..1146).',
].join('\r\n');

const newText = [
  ' * die volle Breite. Darunter links eine Spalte mit Meta-Block und',
  ' * Fliesstext untereinander, rechts das um 28% kleinere Bild 2',
  ' * (Besuchereingang, 2119x807; PDF-Breite 62.34%, hier 44.82%).',
  ' * Beide Spalten beginnen auf der Hoehe 277 Einheiten, direkt unter der',
  ' * Bildunterschrift von Bild 1. Die Aussenkanten der Elemente ergeben',
  ' * ein Rechteck (PDF-x 40..1146).',
].join('\r\n');

css = css.replace(oldText, newText);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Kommentar aktualisiert');
