/**
 * Misst die Abstaende zwischen Bildern einer Projektstudien-Seite.
 * node scripts/gaps.mjs <slug> <selektor>
 */
import { launch, openPage, evaluate } from './cdp.mjs';

const slug = process.argv[2];
const sel = process.argv[3];

const { proc, ws } = await launch();
try {
  await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/?v=${Date.now()}`, 1440, 900);
  await new Promise(r => setTimeout(r, 500));
  const res = await evaluate(ws, `(() => {
    const sheet = document.querySelector('.ps-detail > *');
    const sr = sheet.getBoundingClientRect();
    const U = sr.height / 850;
    const els = [...document.querySelectorAll(${JSON.stringify(sel)})];
    const rects = els.map(el => el.getBoundingClientRect());
    const gaps = [];
    for (let i = 1; i < rects.length; i++) {
      gaps.push({ von: i - 1, bis: i, dx: +((rects[i].left - rects[i-1].right) / U).toFixed(2),
        dy: +((rects[i].top - rects[i-1].bottom) / U).toFixed(2) });
    }
    return { n: rects.length, sheetW: +(sr.width / U).toFixed(1), gaps,
      xs: rects.map(r => +((r.left - sr.left) / U).toFixed(1)),
      rs: rects.map(r => +((r.right - sr.left) / U).toFixed(1)) };
  })()`);
  console.log(JSON.stringify(res, null, 1));
} finally {
  ws.close();
  proc.kill();
}
