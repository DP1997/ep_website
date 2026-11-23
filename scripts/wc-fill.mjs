/**
 * Misst die A3-Dichte (Tinte/BBox) einer Werkseite und gleicht sie mit
 * dem Optimierungsnachweis im DOM ab (§19).
 *
 * node scripts/wc-fill.mjs <slug> [--dir kabp|kabs] [--w 1920] [--h 953] [--json]
 */
import { readFileSync } from 'node:fs';
import { launch, openPage, evaluate } from './cdp.mjs';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const slug = process.argv[2];
if (!slug || slug.startsWith('--')) {
  console.error('Aufruf: node scripts/wc-fill.mjs <slug> [--dir kabp|kabs] [--w 1920] [--h 953] [--json]');
  process.exit(2);
}
const dir = arg('dir', 'kabp');
const w = Number(arg('w', 1920));
const h = Number(arg('h', 953));
const contract = JSON.parse(readFileSync('docs/projektstudien-contract/ps-contract.json', 'utf8').replace(/^\uFEFF/, ''));
const tol = contract.optimization?.fillTolerance ?? contract.thresholds?.fillTolerance ?? 0.01;
const minFill = contract.thresholds?.minFill ?? 0.7;
const url = `http://localhost:4321/ep_website/${dir}/${encodeURIComponent(slug)}/`;

const { proc, ws } = await launch();
let result;
try {
  await openPage(ws, url, w, h);
  result = await evaluate(ws, `(() => {
    const root = document.querySelector('.wc');
    if (!root) return { error: 'kein .wc' };
    const imgs = [...root.querySelectorAll('img')]
      .map((i) => i.getBoundingClientRect())
      .filter((r) => r.width > 1 && r.height > 1);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const rects = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      const p = node.parentElement;
      if (!p || p.closest('svg')) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) rects.push(r);
    }
    const imgArea = imgs.reduce((s, r) => s + r.width * r.height, 0);
    const textArea = rects.reduce((s, r) => s + r.width * r.height, 0);
    const all = [...imgs, ...rects];
    const bb = all.reduce((a, r) => ({
      l: Math.min(a.l, r.left), t: Math.min(a.t, r.top),
      r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom),
    }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
    const bbox = { w: bb.r - bb.l, h: bb.b - bb.t };
    const fill = (imgArea + textArea) / (bbox.w * bbox.h);
    let proof = null;
    const el = document.getElementById('wc-optimization');
    if (el) { try { proof = JSON.parse(el.textContent); } catch { proof = null; } }
    const chosen = proof?.candidates?.find((c) => c.chosen);
    return {
      fill: +fill.toFixed(4),
      bbox: { w: +bbox.w.toFixed(1), h: +bbox.h.toFixed(1) },
      images: imgs.length,
      lines: rects.length,
      proof: !!proof,
      status: proof?.status ?? null,
      candidates: proof?.candidates?.length ?? 0,
      chosenFill: chosen?.fill ?? null,
      chosenId: chosen?.id ?? null,
    };
  })()`);
} finally {
  ws.close();
  proc.kill();
  await new Promise((r) => setTimeout(r, 300));
}

if (result?.error) {
  console.error(`${slug}: ${result.error}`);
  process.exit(1);
}
const delta = result.chosenFill == null ? null : Math.abs(result.fill - result.chosenFill);
const ok = result.proof && result.status === 'optimized' && delta != null && delta <= tol && result.fill >= minFill;
const out = { slug, dir, viewport: [w, h], ...result, delta, tol, minFill, ok };
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
else {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${slug}  fill ${result.fill.toFixed(3)}  chosen ${result.chosenFill ?? '—'}  delta ${delta ?? '—'}  (${result.candidates} Kandidaten, ${result.images} Bilder, ${result.lines} Zeilen)`);
  if (!result.proof) console.log('  kein wc-optimization-Nachweis im DOM');
}
if (!ok) process.exit(1);
