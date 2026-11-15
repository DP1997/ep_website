import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync } from 'node:fs';

const img = await loadImage(readFileSync('src/assets/projektstudien/stadttor/1.png'));
const c = createCanvas(img.width, img.height);
const ctx = c.getContext('2d');
ctx.drawImage(img, 0, 0);
const Y0 = 2000, Y1 = 2236;
const d = ctx.getImageData(0, Y0, img.width, Y1 - Y0).data;
const W = img.width;
const means = [];
for (let y = 0; y < Y1 - Y0; y++) {
  let s = 0, n = 0;
  for (let x = 150; x < 1200; x++) {
    const i = (y * W + x) * 4;
    s += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; n++;
  }
  means.push(+(s / n).toFixed(1));
}
console.log(means.map((v, i) => (Y0 + i) + ':' + v).join(' '));
