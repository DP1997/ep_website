/**
 * Zeigt die Zeilen eines Textblocks mit Inhalt (fuer Umbruch-/Waisen-Checks).
 * node scripts/lines.mjs <slug> <selektor>
 */
import { launch, openPage, evaluate } from './cdp.mjs';

const slug = process.argv[2];
const sel = process.argv[3] || '.ps-skydance-text p';

const { proc, ws } = await launch();
try {
  await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/?v=${Date.now()}`, 1440, 900);
  await new Promise(r => setTimeout(r, 400));
  const res = await evaluate(ws, `(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return 'MISSING';
    const text = el.firstChild;
    const out = [];
    let last = null;
    for (let i = 0; i < text.length; i++) {
      const r = document.createRange();
      r.setStart(text, i); r.setEnd(text, i + 1);
      const rects = [...r.getClientRects()];
      if (!rects.length) continue;
      const top = Math.round(rects[rects.length - 1].top);
      if (last === null || Math.abs(top - last) > 2) { out.push(''); last = top; }
      out[out.length - 1] += text.data[i];
    }
    return out.map(l => l.replace(/\\s+/g, ' ').trim()).filter(l => l.length);
  })()`);
  console.log((Array.isArray(res) ? res : [res]).map((l, i) => `${i + 1}: ${l}`).join('\n'));
} finally {
  ws.close();
  proc.kill();
}
