import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const before = css;

const replace = (oldLines, newLines) => {
  const o = oldLines.join(C), n = newLines.join(C);
  if (!css.includes(o)) throw new Error('Text nicht gefunden: ' + oldLines[0]);
  css = css.replace(o, n);
};

// --- Sportler ---------------------------------------------------------
replace([
  ' * Puzzle-Anordnung: Bild 1 (Wandmalerei Foyer, 3228x624) oben ueber',
  ' * die volle Breite. Darunter ein dreispaltiges Band: links der',
  ' * Meta-Block (Titel, Beschreibung, Labels), in der Mitte Bild 2',
  ' * (Besuchereingang, 2119x807), rechts der Fliesstext.',
  ' * Spaltenbreiten: Meta 239.8, Bild 504.6, Fliesstext 330 Einheiten,',
  ' * zwei Luecken von je 16 Einheiten (40 + 239.8 + 16 + 504.6 + 16 +',
  ' * 330 = 1146.4 = rechte Kante von Bild 1).',
  ' * Der Meta-Block ist in der zweiten Zeile vertikal zentriert: Mitte des',
  ' * Bands zwischen 277.1 und 469.4 = 373.25 (43.91 % der Blattoehe),',
  ' * per translateY(-50%) auf diese Linie gezogen.',
  ' * Die Bildbreite folgt aus der Hoehe des Inhaltstextfeldes: es ist',
  ' * 192.3 Einheiten hoch (Textspalte 330, 10 Zeilen), also ist das Bild',
  ' * 192.3 * 2.624 = 504.6 Einheiten breit. Unterkante Bild = Unterkante',
  ' * Inhaltstextfeld (beide 469.4); die Bildunterschrift haengt darunter.',
  ' * Alle drei Spalten beginnen auf der Hoehe 277 Einheiten, direkt unter',
  ' * der Bildunterschrift von Bild 1.',
], [
  ' * Puzzle-Anordnung: Bild 1 (Wandmalerei Foyer, 3228x624) oben ueber',
  ' * die volle Breite. Darunter eine linke Spalte mit Meta-Block',
  ' * (Titel, Beschreibung, Labels) und Fliesstext untereinander, beide',
  ' * buendig mit der linken Kante von Bild 1, und rechts das stark',
  ' * vergroesserte Bild 2 (Besuchereingang, 2119x807).',
  ' *   linke Spalte: 40 .. 480 (440 breit), Meta 277.1..394.7,',
  ' *                 Fliesstext 403.1..539.7 (7 Zeilen)',
  ' *   Bild 2:      488.5 .. 1146.4 (657.9 breit, Hoehe 250.7),',
  ' *                 283.05 .. 533.75, rechte Kante = Bild 1',
  ' * Die Luecke zwischen Spalte und Bild betraegt 8.5 Einheiten.',
  ' * Bild 2 ist 2.624:1 und kann die Spaltenhoehe (117.6 + 8.5 + 136.5 =',
  ' * 262.6) nicht decken; die Restdifferenz von 11.9 Einheiten ist',
  ' * halbiert (je 5.95) auf Ober- und Unterkante verteilt.',
]);

// --- Entwicklung ------------------------------------------------------
replace([
  ' * Das Bild steht auf PDF-x 125..1087. Darunter zwei Textspalten:',
  ' * Der Meta-Block (Titel, Beschreibung, Labels) links, buendig mit der',
  ' * linken Bildkante; der Fliesstext rechts, buendig mit der rechten',
  ' * Bildkante. Beide stehen oben buendig, schliessen unten buendig ab',
  ' * und haben denselben Abstand zur Unterkante des Bildes (25 Einheiten).',
  ' *',
  ' * Der Fliesstext ist auf 56% Breite gestaucht (6 Zeilen). Der',
  ' * Absatzabstand von 2.4cqh laesst ihn auf die Hoehe des Meta-Blocks',
  ' * wachsen (132 Einheiten), damit Ober- und Unterkante beider Spalten',
  ' * buendig sind.',
], [
  ' * Das Bild steht auf PDF-x 125..1087. Darunter drei Spalten:',
  ' * Der Meta-Block (Titel, Beschreibung, Labels) links, buendig mit der',
  ' * linken Bildkante; in der Mitte das erste Inhaltstextfeld (der erste',
  ' * Absatz), mittig zwischen Meta-Block und zweitem Textfeld; rechts das',
  ' * zweite Inhaltstextfeld (der zweite Absatz), buendig mit der rechten',
  ' * Bildkante. Alle drei stehen oben buendig (644.3) und schliessen',
  ' * unten buendig ab (776.3).',
  ' *   Meta-Block: 113 .. 339.1 (226.1 breit)',
  ' *   Textfeld 1: 403.2 .. 621.0 (217.9 breit, 7 Zeilen)',
  ' *   Textfeld 2: 684.8 .. 1074.6 (389.7 breit, 7 Zeilen)',
  ' * Die Luecken zwischen den Spalten betragen je 64 Einheiten.',
]);

// --- Bubbles ----------------------------------------------------------
replace([
  '   128 x 123 Einheiten, PDF-x 807..935); ihr Abstand betraegt ein Viertel',
  '   der Bildhoehe. Der Fliesstext beginnt bei PDF-x 954. Die Bilder sind im',
], [
  '   128 x 123 Einheiten, PDF-x 807..935); ihr Abstand betraegt ein Viertel',
  '   der Bildhoehe (32 Einheiten). Der Abstand vom Meta-Block zur Oberkante',
  '   des ersten Detailbildes ist genauso gross (margin-bottom 3.76cqh).',
  '   Der Fliesstext beginnt bei PDF-x 954. Die Bilder sind im',
]);

// --- Balla ------------------------------------------------------------
replace([
  ' * balla-balla (3.KAB.BZA.2.pdf, 1191x850)',
  ' * ================================================================ */',
], [
  ' * balla-balla (3.KAB.BZA.2.pdf, 1191x850)',
  ' *',
  ' * Der Meta-Block links (75.3..384.9) schliesst unten buendig mit dem',
  ' * grossen Inhaltstextfeld rechts ab (beide 544.6). Das kleine',
  ' * Inhaltstextfeld unten links (75.3..361.1) schliesst unten buendig mit',
  ' * dem unteren Bild ab (beide 750.7).',
  ' * ================================================================ */',
]);

// --- Skydance ---------------------------------------------------------
replace([
  ' * Die Luecke zwischen Bild und Text ist links wie rechts gleich (45',
  ' * Einheiten); das Paket sitzt horizontal zentriert (Rand 8,5 Einheiten)',
  ' * und oben buendig mit den Hero-Bildern der anderen Projektstudien.',
], [
  ' * Die Luecke zwischen Bild und Text ist links wie rechts gleich (24,7',
  ' * Einheiten); das Paket sitzt horizontal zentriert (Rand 8,5 Einheiten)',
  ' * und oben buendig mit den Hero-Bildern der anderen Projektstudien.',
  ' * Die Textspalte ist 350 Einheiten breit und 475.2 Einheiten hoch,',
  ' * also so hoch wie die beiden Bilder; der Fliesstext schliesst unten',
  ' * buendig mit ihnen ab (495.6) und hat dadurch mehr Luft zum',
  ' * Meta-Block, der an seiner Position bleibt.',
]);

if (css === before) throw new Error('kein Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('CSS-Kommentare aktualisiert');
