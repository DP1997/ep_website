import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync } from 'node:fs';

const img = await loadImage(readFileSync('src/assets/projektstudien/stadttor/1.png'));
const c = createCanvas(img.width, img.height);
const ctx = c.getContext('2d');
ctx.drawImage(img, 0, 0);
const d = ctx.getImageData(0, 2050, img.width, 185).data;
const W = img.width;
// Mittelwert je Zeile (nur Betonbereich x 150..1200, ohne Gras/Handlauf)
const means = [];
for (let y = 0; y < 185; y++) {
  let s = 0, n = 0;
  for (let x = 150; x < 1200; x++) {
    const i = (y * W + x) * 4;
    s += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; n++;
  }
  means.push(+(s / n).toFixed(1));
}
let prev = -99;
for (let y = 0; y < means.length; y++) {
  if (means[y] > means[y - 1] && means[y] >= means[y + 1] && means[y] > 100) {
    console.log('Kante bei y=' + (2050 + y) + '  wert=' + means[y] + (prev > 0 ? '  abstand=' + (2050 + y - prev) : ''));
    prev = 2100 + y;
  }
}
