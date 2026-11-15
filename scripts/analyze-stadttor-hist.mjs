import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync } from 'node:fs';

const img = await loadImage(readFileSync('src/assets/projektstudien/stadttor/1.png'));
const c = createCanvas(img.width, img.height);
const ctx = c.getContext('2d');
ctx.drawImage(img, 0, 0);
const d = ctx.getImageData(0, 2100, img.width, 300).data;
const W = img.width;
const lum = (i) => +(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114).toFixed(0);
const sat = (i) => Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);

// Spalte durch einen Buchstaben (x=200) und eine freie Spalte (x=1000)
for (const x of [200, 260, 1000, 1400]) {
  const vals = [];
  for (let y = 2215; y <= 2310; y++) {
    const i = ((y - 2100) * W + x) * 4;
    vals.push(`${y}:${lum(i)}/${sat(i)}`);
  }
  console.log('x=' + x, vals.join(' '));
}
// Histogramm des Bands
const hist = new Array(26).fill(0);
for (let y = 2222; y <= 2312; y++) for (let x = 0; x < W; x++) {
  const i = ((y - 2100) * W + x) * 4;
  hist[Math.min(25, Math.floor(lum(i) / 10))]++;
}
console.log('Histogramm (10er-Schritte):', hist.map((v, i) => i * 10 + ':' + v).join(' '));
