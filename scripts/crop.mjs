import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync, writeFileSync } from 'node:fs';

const [file, out, y0, y1, x0 = 0, x1 = 1522] = process.argv.slice(2);
const img = await loadImage(readFileSync(file));
const c = createCanvas(img.width, img.height);
const ctx = c.getContext('2d');
ctx.drawImage(img, 0, 0);
const crop = createCanvas(Number(x1) - Number(x0), Number(y1) - Number(y0));
const cctx = crop.getContext('2d');
cctx.drawImage(c, Number(x0), Number(y0), Number(x1) - Number(x0), Number(y1) - Number(y0), 0, 0, Number(x1) - Number(x0), Number(y1) - Number(y0));
writeFileSync(out, crop.toBuffer('image/png'));
console.log('geschrieben', out, crop.width, 'x', crop.height);
