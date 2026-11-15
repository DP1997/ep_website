/**
 * Erzeugt die saubere Variante des grossen Stadttor-Bildes.
 *
 * Die eingebrannte Unterschrift "– Gebäude I,K von Süden, unten" liegt in
 * den untersten 6 % des Fotos (ab Zeile 2237 von 2383). Eine Reparaturr-
 * methode (Strecken/Interpolieren der Textpixel) laesst an den Buchstaben
 * Konturen oder helle Flecken zurueck. Deshalb wird der Textbereich
 * sauber ausgeschnitten: das Bild endet dann auf der vorletzten Stufe.
 *
 * node scripts/clean-stadttor-caption.mjs
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'src/assets/projektstudien/stadttor/1.png';
const OUT = 'src/assets/projektstudien/stadttor/1-clean.png';
const CUT = 2230; // letzte Zeile vor dem Text

const img = await loadImage(readFileSync(SRC));
const c = createCanvas(img.width, CUT);
const ctx = c.getContext('2d');
ctx.drawImage(img, 0, 0, img.width, CUT, 0, 0, img.width, CUT);
writeFileSync(OUT, c.toBuffer('image/png'));
console.log(`geschrieben: ${OUT} (${img.width} x ${CUT}, vorher ${img.width} x ${img.height})`);
