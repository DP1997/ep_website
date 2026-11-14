/**
 * Misst die Geometrie einer Projektstudien-Seite in PDF-Einheiten.
 * node scripts/probe.mjs <slug> [--w 1440] [--h 900] [--shot datei.png]
 */
import { launch, openPage, evaluate, screenshot } from './cdp.mjs';

const slug = process.argv[2];
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };

const SEL = {
  'balla-balla': ['.ps-balla-figure img', '.ps-balla-figure figcaption', '.ps-balla-side .ps-text',
    '.ps-balla-text-main', '.ps-balla-text-side', '.ps-balla-figure2 img', '.ps-balla-figure2 figcaption'],
  bubbles: ['.ps-bubbles-figure img', '.ps-bubbles-header', '.ps-bubbles-header .ps-labels',
    '.ps-bubbles-columns', '.ps-bubbles-details img', '.ps-bubbles-text', '.ps-bubbles-aside'],
  entwicklung: ['.ps-entwicklung-fig img', '.ps-entwicklung-side .ps-text', '.ps-entwicklung-side .ps-labels',
    '.ps-entwicklung-text-1', '.ps-entwicklung-text-1 p', '.ps-entwicklung-text',
    '.ps-entwicklung-text p:first-child', '.ps-entwicklung-text p:last-child'],
  skydance: ['.ps-skydance-fig2 img', '.ps-skydance-side .ps-text', '.ps-skydance-text',
    '.ps-skydance-fig1 img', '.ps-skydance-fig1 figcaption', '.ps-skydance-side'],
  stadttor: ['.ps-stadttor-fig1 img', '.ps-stadttor-side .ps-text', '.ps-stadttor-text',
    '.ps-stadttor-fig2 img', '.ps-stadttor-fig3 img', '.ps-stadttor-figs'],
  'sportler-in-bewegung': ['.ps-sportler-fig1 img', '.ps-sportler-fig1 figcaption', '.ps-sportler-side .ps-text',
    '.ps-sportler-fig2 img', '.ps-sportler-fig2 figcaption', '.ps-sportler-text'],
  'stoerche-froesche': ['.ps-stoerche-row img', '.ps-stoerche-side .ps-title', '.ps-stoerche-side .ps-meta-block',
    '.ps-stoerche-text', '.ps-stoerche-fig6 img', '.ps-stoerche-fig7 img', '.ps-stoerche-fig8 img'],
};

const { proc, ws } = await launch();
try {
  const w = Number(arg('w', 1440)), h = Number(arg('h', 900));
  await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/`, w, h);
  const sels = SEL[slug] || [];
  const res = await evaluate(ws, `(() => {
    const sheet = document.querySelector('.ps-detail > *');
    const sr = sheet.getBoundingClientRect();
    const U = sr.height / 850;
    const out = {};
    const sels = ${JSON.stringify(sels)};
    for (const s of sels) {
      const el = document.querySelector(s);
      if (!el) { out[s] = 'MISSING'; continue; }
      const b = el.getBoundingClientRect();
      out[s] = {
        x: +((b.left - sr.left) / U).toFixed(1), y: +((b.top - sr.top) / U).toFixed(1),
        w: +(b.width / U).toFixed(1), h: +(b.height / U).toFixed(1),
        r: +((b.right - sr.left) / U).toFixed(1), b: +((b.bottom - sr.top) / U).toFixed(1),
      };
    }
    // Zeilenzahl des Fliesstextes
    const t = sheet.querySelector('.ps-balla-text-main, .ps-entwicklung-text, .ps-skydance-text, .ps-sportler-text, .ps-bubbles-text, .ps-stoerche-text');
    if (t) {
      const cs = getComputedStyle(t);
      const lh = parseFloat(cs.lineHeight);
      out.__text = { width: +(t.getBoundingClientRect().width / U).toFixed(1), lineHeight: +(lh / U).toFixed(2),
        lines: Math.round(t.getBoundingClientRect().height / lh) };
    }
    return out;
  })()`);
  console.log(JSON.stringify(res, null, 1));
  const shot = arg('shot', null);
  if (shot) { await screenshot(ws, shot); console.log('Screenshot: ' + shot); }
} finally {
  ws.close();
  proc.kill();
}
