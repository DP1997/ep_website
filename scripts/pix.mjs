import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const x = Number(process.argv[3] || 200);
const y0 = Number(process.argv[4] || 0);
const y1 = Number(process.argv[5] || 200);
const img = await loadImage(readFileSync(file));
console.log('dims', img.width, 'x', img.height);
const c = createCanvas(img.width, img.height);
const ctx = c.getContext('2d');
ctx.drawImage(img, 0, 0);
const d = ctx.getImageData(0, 0, img.width, img.height).data;
const W = img.width;
const vals = [];
for (let y = y0; y <= y1; y++) {
  const i = (y * W + x) * 4;
  vals.push(Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114));
}
console.log('x=' + x + ':', vals.join(','));
