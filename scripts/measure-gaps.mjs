/**
 * Misst alle Abstaende zwischen Bildern, Bildern und Texten sowie
 * Texten untereinander auf allen Projektstudien-Seiten.
 *
 * Ausgabe: eine Zeile je Paar (Blatt-Einheiten, 850 = Blatthoehe):
 *   seite | A | B | typ | richtung | luecke
 *
 * node scripts/measure-gaps.mjs [--w 1440] [--h 900] [--max 120]
 */
import { launch, openPage, evaluate } from './cdp.mjs';

const TEXT = {
  bubbles: ['.ps-bubbles-header .ps-text', '.ps-bubbles-text'],
  'balla-balla': ['.ps-balla-side .ps-text', '.ps-balla-text-main', '.ps-balla-text-side'],
  'sportler-in-bewegung': ['.ps-sportler-side .ps-text', '.ps-sportler-text'],
  dschungel: ['.ps-dschungel-side .ps-text', '.ps-dschungel-text'],
  'stoerche-froesche': ['.ps-stoerche-side .ps-text', '.ps-stoerche-text'],
  entwicklung: ['.ps-entwicklung-side .ps-text', '.ps-entwicklung-text-1', '.ps-entwicklung-text'],
  skydance: ['.ps-skydance-side .ps-text', '.ps-skydance-text'],
  stadttor: ['.ps-stadttor-side .ps-text', '.ps-stadttor-text'],
};

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const w = Number(arg('w', 1440)), h = Number(arg('h', 900)), max = Number(arg('max', 120));

const { proc, ws } = await launch();
const rows = [];
try {
  for (const [slug, texts] of Object.entries(TEXT)) {
    await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/?v=${Date.now()}`, w, h);
    await new Promise(r => setTimeout(r, 350));
    const blocks = await evaluate(ws, `(() => {
      const sheet = document.querySelector('.ps-detail > *');
      const sr = sheet.getBoundingClientRect();
      const U = sr.height / 850;
      const R = el => { const b = el.getBoundingClientRect();
        return { x: (b.left-sr.left)/U, y: (b.top-sr.top)/U, r: (b.right-sr.left)/U, b: (b.bottom-sr.top)/U }; };
      const out = [];
      const seen = new Map();
      for (const img of sheet.querySelectorAll('img')) {
        const host = img.closest('figure, div');
        const key = (host && host.className ? host.className.split(' ')[0] : 'div');
        const n = (seen.get(key) || 0) + 1; seen.set(key, n);
        out.push({ name: key + (n > 1 ? '#' + n : ''), type: 'Bild', ...R(img) });
      }
      for (const sel of ${JSON.stringify(texts)}) {
        const el = sheet.querySelector(sel);
        if (!el) { out.push({ name: sel, type: 'Text', missing: true }); continue; }
        const name = sel.split(' ').pop().replace('.ps-', '').replace(/-/g, ' ').replace(/^\\w+ /, '');
        out.push({ name: sel, type: 'Text', ...R(el) });
      }
      for (const cap of sheet.querySelectorAll('figcaption')) {
        out.push({ name: 'Unterschrift ' + cap.parentElement.className.split(' ')[0], type: 'Unterschrift', ...R(cap) });
      }
      return out;
    })()`);

    const vis = blocks.filter(b => !b.missing);
    for (let i = 0; i < vis.length; i++) {
      for (let j = i + 1; j < vis.length; j++) {
        const A = vis[i], B = vis[j];
        const xo = Math.min(A.r, B.r) - Math.max(A.x, B.x);
        const yo = Math.min(A.b, B.b) - Math.max(A.y, B.y);
        let dir, gap;
        if (xo > 0 && yo <= 0) { dir = 'vertikal'; gap = -yo; }
        else if (yo > 0 && xo <= 0) { dir = 'horizontal'; gap = -xo; }
        else if (xo > 0 && yo > 0) { dir = 'ueberlappt'; gap = 0; }
        else { dir = 'diagonal'; gap = Math.hypot(xo, yo); }
        if (gap > max) continue;
        const typ = [A.type, B.type].sort().join('+');
        rows.push({ slug, a: A.name, b: B.name, typ, dir, gap: +gap.toFixed(1) });
      }
    }
  }
} finally { ws.close(); proc.kill(); }

const pad = (s, n) => String(s).padEnd(n);
for (const r of rows) {
  console.log(`${pad(r.slug, 22)} ${pad(r.a, 34)} ${pad(r.b, 34)} ${pad(r.typ, 24)} ${pad(r.dir, 11)} ${r.gap}`);
}
