/**
 * Misst den unteren Rand des Inhalts (leere Flaeche bis zum Blattrand)
 * aller Projektstudien-Seiten.
 * node scripts/measure-bottom.mjs
 */
import { launch, openPage, evaluate } from './cdp.mjs';

const PAGES = ['bubbles', 'balla-balla', 'sportler-in-bewegung', 'dschungel',
  'stoerche-froesche', 'entwicklung', 'skydance', 'stadttor'];

const { proc, ws } = await launch();
try {
  for (const slug of PAGES) {
    await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/?v=${Date.now()}`, 1440, 900);
    await new Promise(r => setTimeout(r, 500));
    const res = await evaluate(ws, `(() => {
      const sheet = document.querySelector('.ps-detail > *');
      const sr = sheet.getBoundingClientRect();
      const U = sr.height / 850;
      const sel = 'img, .ps-title, .ps-desc, .ps-labels, .ps-label, p, figcaption';
      let top = Infinity, bot = -Infinity, left = Infinity, right = -Infinity;
      for (const el of sheet.querySelectorAll(sel)) {
        if (!el.getClientRects().length) continue;
        const b = el.getBoundingClientRect();
        if (b.width <= 0 || b.height <= 0) continue;
        top = Math.min(top, (b.top - sr.top) / U);
        bot = Math.max(bot, (b.bottom - sr.top) / U);
        left = Math.min(left, (b.left - sr.left) / U);
        right = Math.max(right, (b.right - sr.left) / U);
      }
      return { top: +top.toFixed(1), bottom: +bot.toFixed(1),
               emptyBottom: +(850 - bot).toFixed(1),
               left: +left.toFixed(1), right: +right.toFixed(1) };
    })()`);
    console.log(slug.padEnd(24), JSON.stringify(res));
  }
} finally {
  ws.close();
  proc.kill();
}
