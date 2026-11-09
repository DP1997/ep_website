/**
 * Erzeugt src/assets/projektstudien/bubbles/1-circle.png aus 1.png:
 * der im PDF sichtbare Kreis wird herausgeschnitten, der umgebende
 * einfarbige Rahmen wird transparent. Die im Bild enthaltene
 * Bildunterschrift (Lichtsimulation ...) bleibt erhalten.
 *
 * Hintergrund: 1.png ist ein RGB-Bild (pdfjs liefert 3 Byte/Pixel). Die
 * Rahmenfarbe wird hier ueber Geometrie entfernt, nicht ueber eine
 * Farbschwelle - im Foto kommen zu viele aehnliche Farbtone vor.
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';

const SRC = 'src/assets/projektstudien/bubbles/1.png';
const OUT = 'src/assets/projektstudien/bubbles/1-circle.png';

// Kreis-Geometrie aus 1.png (1010x1085): Mittelpunkt x, Radius x, y-Oberkante
const CX = 507;
const RX = 484;
const TOP = 64;
const BOTTOM = 1030;
const RY = (BOTTOM - TOP) / 2;
const CY = TOP + RY;

const img = await loadImage(SRC);
const canvas = createCanvas(img.width, img.height);
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
const data = ctx.getImageData(0, 0, img.width, img.height);
const px = data.data;

let transparent = 0;
for (let y = 0; y < img.height; y++) {
  for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4;
    const dx = (x - CX) / RX;
    const dy = (y - CY) / RY;
    const inside = dx * dx + dy * dy <= 1;
    if (inside) continue;
    // Unterhalb des Kreises: die Bildunterschrift als weiche Alpha-Maske
    // behalten. Der Rahmen-Hintergrund hat Luminanz ~205, die Glyphen 60-180.
    if (y > BOTTOM) {
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const alpha = Math.max(0, Math.min(1, (212 - lum) / 45));
      px[i + 3] = Math.round(alpha * 255);
      if (px[i + 3] === 0) transparent++;
      continue;
    }
    px[i + 3] = 0;
    transparent++;
  }
}

ctx.putImageData(data, 0, 0);
writeFileSync(OUT, canvas.toBuffer('image/png'));
console.log(`1-circle.png erzeugt: ${img.width}x${img.height}, ${transparent} Pixel transparent`);
