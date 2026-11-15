import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2] || 'src/assets/projektstudien/stadttor/1.png';
const img = await loadImage(readFileSync(file));
console.log(file, img.width, 'x', img.height);

// Zeilenweise Helligkeitsstatistik der unteren Haelfte: Text = helle Pixel
// auf dunklem Grund, daher Summe der hellen Pixel je Zeile.
const c = createCanvas(img.width, img.height);
const ctx = c.getContext('2d');
ctx.drawImage(img, 0, 0);
const d = ctx.getImageData(0, Math.floor(img.height * 0.85), img.width, Math.floor(img.height * 0.15)).data;
const W = img.width, H = Math.floor(img.height * 0.15);
const rows = [];
for (let y = 0; y < H; y++) {
  let bright = 0, n = 0;
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
    if (l > 200) { bright++; n++; }
  }
  rows.push({ y: Math.floor(img.height * 0.85) + y, bright, n });
}
for (const r of rows) if (r.bright > 20) console.log(r.y, r.bright);
