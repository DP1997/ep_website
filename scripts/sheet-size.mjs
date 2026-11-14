/**
 * Misst die Blattgroesse (px) einer Projektstudien-Seite.
 * node scripts/sheet-size.mjs <slug> [--w 1440] [--h 900]
 */
import { launch, openPage, evaluate } from './cdp.mjs';

const slug = process.argv[2];
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const w = Number(arg('w', 1440)), h = Number(arg('h', 900));

const { proc, ws } = await launch();
try {
  await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/?v=${Date.now()}`, w, h);
  await new Promise(r => setTimeout(r, 500));
  const res = await evaluate(ws, `(() => {
    const sheet = document.querySelector('.ps-detail > *');
    const r = sheet.getBoundingClientRect();
    const cs = getComputedStyle(sheet);
    return { cls: sheet.className, w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      left: +r.left.toFixed(1), top: +r.top.toFixed(1),
      cssH: cs.height, cssAR: cs.aspectRatio, cssW: cs.width,
      docW: document.documentElement.clientWidth, docH: document.documentElement.clientHeight,
      scrollW: document.documentElement.scrollWidth };
  })()`);
  console.log(JSON.stringify(res, null, 1));
} finally {
  ws.close();
  proc.kill();
}
