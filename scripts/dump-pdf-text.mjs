import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

const dir = 'src/assets/Projektsudien_Referenzen';
const files = readdirSync(dir).filter(f => f.endsWith('.pdf'));
let out = '';

for (const f of files) {
  const doc = await getDocument({ url: resolve(join(dir, f)), useSystemFonts: false }).promise;
  out += '\n========== ' + f + ' ==========\n';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = tc.items
      .filter(it => it.str && it.str.trim().length)
      .map(it => {
        const tr = it.transform;
        return { x: Math.round(tr[4]), y: Math.round(tr[5]), h: Math.round(Math.hypot(tr[2], tr[3])), s: it.str.trim() };
      })
      .sort((a, b) => b.y - a.y || a.x - b.x);
    out += '--- Seite ' + p + ' (' + Math.round(vp.width) + 'x' + Math.round(vp.height) + ') ---\n';
    for (const it of items) {
      out += '  x=' + String(it.x).padStart(4) + ' y=' + String(it.y).padStart(4) + ' h=' + String(it.h).padStart(3) + '  ' + it.s + '\n';
    }
  }
}
writeFileSync('pdf-text-dump.txt', out, 'utf8');
console.log('geschrieben');
