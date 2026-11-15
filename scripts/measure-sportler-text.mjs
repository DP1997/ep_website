/**
 * Misst die Hoehe des Sportler-Fliesstextes in Abhaengigkeit von der
 * Spaltenbreite (in PDF-Einheiten).
 * node scripts/measure-sportler-text.mjs
 */
import { launch, openPage, evaluate } from './cdp.mjs';

const { proc, ws } = await launch();
try {
  await openPage(ws, 'http://localhost:4321/ep_website/projektstudien/sportler-in-bewegung/', 1440, 900);
  const res = await evaluate(ws, `(() => {
    const sheet = document.querySelector('.ps-sportler');
    const sr = sheet.getBoundingClientRect();
    const U = sr.height / 850;
    const t = document.querySelector('.ps-sportler-text');
    const out = [];
    for (const w of [200,220,240,260,280,300,320,330,340,360,380,400,420,440,460,480,500]) {
      t.style.width = w + 'px';
      t.style.position = 'static';
      const b = t.getBoundingClientRect();
      out.push({ w: +(b.width / U).toFixed(1), h: +(b.height / U).toFixed(1), lines: Math.round(b.height / (18.55 * U)) });
    }
    t.style.width = ''; t.style.position = '';
    return out;
  })()`);
  console.log(JSON.stringify(res));
} finally {
  ws.close();
  proc.kill();
}
