/**
 * Analyse einer Projektstudien-PDF: Textspalten und Bildplatzierung.
 * Aufruf: node scripts/analyze-pdf-layout.mjs <pfad-relativ-zum-repo>
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF = resolve(__dirname, '..', process.argv[2]);

const OPS = {
  save: 10, restore: 11, transform: 12, constructPath: 91, clip: 29, eoClip: 30,
  paintImageMaskXObject: 83, paintImageXObject: 85, paintInlineImageXObject: 86,
};
const mul = (a, b) => [
  a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3],
  a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3],
  a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5]];
const apply = (m, x, y) => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];

const doc = await getDocument({ url: PDF }).promise;
console.log(`# ${process.argv[2]}  Seiten: ${doc.numPages}\n`);

for (let pn = 1; pn <= doc.numPages; pn++) {
  const page = await doc.getPage(pn);
  const vp = page.getViewport({ scale: 1 });
  console.log(`--- Seite ${pn}: ${vp.width.toFixed(1)} x ${vp.height.toFixed(1)} ---`);

  const tc = await page.getTextContent();
  const items = tc.items.filter(i => i.str && i.str.trim()).map(i => ({
    x: +i.transform[4].toFixed(1), y: +i.transform[5].toFixed(1),
    h: +i.height.toFixed(1), t: i.str.trim(),
  }));
  const xs = [...new Set(items.map(i => Math.round(i.x)))].sort((a, b) => a - b);
  for (const x of xs) {
    const col = items.filter(i => Math.round(i.x) === x).sort((a, b) => b.y - a.y);
    const ys = col.map(i => i.y);
    console.log(`  TEXT x=${String(x).padStart(4)}  y ${Math.min(...ys).toFixed(1)}..${Math.max(...ys).toFixed(1)}  (${col.length} Zeilen, ${col[0].h}pt)  "${col[0].t.slice(0, 40)}"`);
  }

  const ol = await page.getOperatorList();
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let clip = null, pending = null, n = 0;
  for (let i = 0; i < ol.fnArray.length; i++) {
    const fn = ol.fnArray[i], args = ol.argsArray[i] ?? [];
    if (fn === OPS.save) { stack.push({ ctm: [...ctm], clip }); continue; }
    if (fn === OPS.restore) { const s = stack.pop(); if (s) { ctm = s.ctm; clip = s.clip; } continue; }
    if (fn === OPS.transform) { ctm = mul(args, ctm); continue; }
    if (fn === OPS.constructPath) { pending = args[2]; continue; }
    if (fn === OPS.clip || fn === OPS.eoClip) {
      if (pending) {
        const a = apply(ctm, pending[0], pending[1]), b = apply(ctm, pending[2], pending[3]);
        const bb = [Math.min(a[0],b[0]), Math.min(a[1],b[1]), Math.max(a[0],b[0]), Math.max(a[1],b[1])];
        clip = clip ? [Math.max(clip[0],bb[0]), Math.max(clip[1],bb[1]), Math.min(clip[2],bb[2]), Math.min(clip[3],bb[3])] : bb;
      }
      pending = null; continue;
    }
    if (fn === OPS.paintImageXObject || fn === OPS.paintImageMaskXObject || fn === OPS.paintInlineImageXObject) {
      const raw = args[0];
      const src = Array.isArray(raw) ? raw[0] : raw;
      let nat = null;
      if (src && typeof src === 'object' && src.width) nat = [src.width, src.height];
      else if (typeof src === 'string') { const o = page.objs.get(src); if (o?.width) nat = [o.width, o.height]; }
      if (!nat) continue;
      const p = [apply(ctm,0,0), apply(ctm,1,0), apply(ctm,1,1), apply(ctm,0,1)];
      const r = [Math.min(...p.map(q=>q[0])), Math.min(...p.map(q=>q[1])), Math.max(...p.map(q=>q[0])), Math.max(...p.map(q=>q[1]))];
      const vis = clip ? [Math.max(r[0],clip[0]), Math.max(r[1],clip[1]), Math.min(r[2],clip[2]), Math.min(r[3],clip[3])] : r;
      console.log(`  BILD ${++n}: nat=${nat[0]}x${nat[1]}  x ${vis[0].toFixed(1)}..${vis[2].toFixed(1)} (${(vis[2]-vis[0]).toFixed(1)})  yPDF ${vis[1].toFixed(1)}..${vis[3].toFixed(1)} (${(vis[3]-vis[1]).toFixed(1)})  ratio=${((vis[2]-vis[0])/(vis[3]-vis[1])).toFixed(3)}`);
    }
  }
  console.log();
}
await doc.loadingTask.destroy();
