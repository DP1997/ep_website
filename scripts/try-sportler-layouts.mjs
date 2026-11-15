/**
 * Experiment: Sportler-Spaltenbreiten gegen die Buendigkeit pruefen.
 * node scripts/try-sportler-layouts.mjs
 */
import { launch, openPage, evaluate } from './cdp.mjs';

const { proc, ws } = await launch();
try {
  await openPage(ws, 'http://localhost:4321/ep_website/projektstudien/sportler-in-bewegung/', 1440, 900);
  const res = await evaluate(ws, `(() => {
    const sheet = document.querySelector('.ps-sportler');
    const sr = sheet.getBoundingClientRect();
    const U = sr.height / 850;
    const side = document.querySelector('.ps-sportler-side');
    const text = document.querySelector('.ps-sportler-text');
    const fig = document.querySelector('.ps-sportler-fig2');
    const img = fig.querySelector('img');
    const cap = fig.querySelector('figcaption');
    const out = [];
    const LEFT = 40, RIGHT = 1146.4, META_H = 117.6, GAP = 8.5, ROW_TOP = 277.1;
    for (const W of [360, 380, 400, 420, 440, 463, 490, 520]) {
      const wpx = W * (sr.width / 1191);
      side.style.width = wpx + 'px';
      text.style.width = wpx + 'px';
      const metaBottom = side.getBoundingClientRect().bottom;
      const textH = text.getBoundingClientRect().height / U;
      // Bild: Restbreite rechts buendig
      const imgW = RIGHT - LEFT - W - GAP;
      fig.style.left = (LEFT + W + GAP) * (sr.width / 1191) + 'px';
      fig.style.width = imgW * (sr.width / 1191) + 'px';
      fig.style.top = ROW_TOP * (sr.width / 1191) + 'px';
      const imgBox = img.getBoundingClientRect();
      const imgTop = (imgBox.top - sr.top) / U, imgBot = (imgBox.bottom - sr.top) / U;
      const imgH = imgBox.height / U;
      // Text unter den Meta-Block, Bottom bei Meta-Unterkante + Gap
      text.style.top = ((metaBottom - sr.top) / U + GAP) * (sr.width / 1191) + 'px';
      const tBox = text.getBoundingClientRect();
      const tTop = (tBox.top - sr.top) / U, tBot = (tBox.bottom - sr.top) / U;
      out.push({ W, imgW: +imgW.toFixed(1), imgH: +imgH.toFixed(1), textH: +textH.toFixed(1),
        lines: Math.round(textH / 18.55),
        deltaTop: +(imgTop - ROW_TOP).toFixed(1),
        deltaBottom: +(tBot - imgBot).toFixed(1),
        textBottom: +tBot.toFixed(1) });
    }
    return out;
  })()`);
  console.log(JSON.stringify(res, null, 1));
} finally {
  ws.close();
  proc.kill();
}
