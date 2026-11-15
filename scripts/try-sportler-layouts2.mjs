import { launch, openPage, evaluate } from './cdp.mjs';

const { proc, ws } = await launch();
try {
  await openPage(ws, 'http://localhost:4321/ep_website/projektstudien/sportler-in-bewegung/', 1440, 900);
  const res = await evaluate(ws, `(() => {
    const sheet = document.querySelector('.ps-sportler');
    const sr = sheet.getBoundingClientRect();
    const U = sr.height / 850;
    const px = (u) => u * (sr.width / 1191);
    const side = document.querySelector('.ps-sportler-side');
    const text = document.querySelector('.ps-sportler-text');
    const fig = document.querySelector('.ps-sportler-fig2');
    const img = fig.querySelector('img');
    const out = [];
    const LEFT = 40, RIGHT = 1146.4, GAP = 8.5, ROW_TOP = 277.1;
    for (let W = 400; W <= 470; W += 5) {
      side.style.width = px(W) + 'px';
      text.style.width = px(W) + 'px';
      const metaBottom = (side.getBoundingClientRect().bottom - sr.top) / U;
      const textH = text.getBoundingClientRect().height / U;
      const imgW = RIGHT - LEFT - W - GAP;
      fig.style.left = px(LEFT + W + GAP) + 'px';
      fig.style.width = px(imgW) + 'px';
      fig.style.top = px(ROW_TOP) + 'px';
      const imgBox = img.getBoundingClientRect();
      const imgH = imgBox.height / U;
      text.style.top = px(metaBottom + GAP) + 'px';
      const tBot = (text.getBoundingClientRect().bottom - sr.top) / U;
      const imgBot = (imgBox.bottom - sr.top) / U;
      out.push({ W, imgW: +imgW.toFixed(1), imgH: +imgH.toFixed(1),
        lines: Math.round(textH / 18.55), delta: +(tBot - imgBot).toFixed(1) });
    }
    return out;
  })()`);
  const best = res.slice().sort((a, b) => a.delta - b.delta).slice(0, 6);
  console.log('Alle: ' + res.map(r => `W${r.W}: d${r.delta}/img${r.imgW}`).join('  '));
  console.log('Beste: ' + JSON.stringify(best));
} finally {
  ws.close();
  proc.kill();
}
