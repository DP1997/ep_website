/**
 * Audit fuer die drei Gestaltungsbedingungen der Projektstudien:
 *
 *  1. Ruhiger Rahmen: die Aussenkanten aller Bloecke bilden ein Rechteck.
 *     -> Kantenabdeckung je Seite (Anteil der Kantenlaenge, der von einer
 *        Blockkante beruehrt wird, Toleranz 2 Einheiten) + groesste Kerbe.
 *  2. Auf einen Blick bei 100 %: kein Scrollen, alles im Viewport.
 *  3. Effiziente Flaeche: Fuellgrad innen (Blocksumme / Silhouette) und
 *     aussen (Silhouette in px / Viewport).
 *
 * node scripts/audit-fill.mjs [--w 1440] [--h 900] [--json datei.json]
 */
import { launch, openPage, evaluate } from './cdp.mjs';

const TEXTS = {
  bubbles: ['.ps-bubbles-header .ps-text', '.ps-bubbles-text'],
  'balla-balla': ['.ps-balla-side .ps-text', '.ps-balla-text-main', '.ps-balla-text-side'],
  'sportler-in-bewegung': ['.ps-sportler-side .ps-text', '.ps-sportler-text'],
  dschungel: ['.ps-dschungel-side .ps-text', '.ps-dschungel-text'],
  'stoerche-froesche': ['.ps-stoerche-side .ps-text', '.ps-stoerche-text'],
  entwicklung: ['.ps-entwicklung-side .ps-text', '.ps-entwicklung-text-1', '.ps-entwicklung-text'],
  skydance: ['.ps-skydance-side .ps-text', '.ps-skydance-text'],
  stadttor: ['.ps-stadttor-side .ps-text', '.ps-stadttor-text'],
};

const VIEWPORTS = [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 720], [1024, 768]];
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const W = Number(arg('w', 0)), H = Number(arg('h', 0));
const vps = W ? [[W, H]] : VIEWPORTS;

const { proc, ws } = await launch();
const rows = [];
try {
  for (const [vw, vh] of vps) {
    for (const [slug, texts] of Object.entries(TEXTS)) {
      await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/?v=${Date.now()}`, vw, vh);
      await new Promise(r => setTimeout(r, 300));
      const r = await evaluate(ws, `(() => {
        const sheet = document.querySelector('.ps-detail > *');
        const sr = sheet.getBoundingClientRect();
        const U = sr.height / 850;
        const rects = [];
        const name = el => (el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
        for (const img of sheet.querySelectorAll('img')) {
          const b = img.getBoundingClientRect();
          if (b.width > 1 && b.height > 1) rects.push({ type: 'Bild', n: name(img.closest('figure, div') || img), b });
        }
        for (const sel of ${JSON.stringify('__TEXTS__')}) {} // Platzhalter
        for (const sel of ${JSON.stringify(texts)}) {
          const el = sheet.querySelector(sel);
          if (!el) continue;
          const b = el.getBoundingClientRect();
          if (b.width > 1 && b.height > 1) rects.push({ type: 'Text', n: name(el), b });
        }
        for (const cap of sheet.querySelectorAll('figcaption')) {
          const b = cap.getBoundingClientRect();
          if (b.width > 1 && b.height > 1) rects.push({ type: 'Unterschrift', n: name(cap), b });
        }
        const rel = b => ({ x: (b.left - sr.left) / U, y: (b.top - sr.top) / U, w: b.width / U, h: b.height / U });
        const R = rects.map(o => ({ ...o, r: rel(o.b) }));
        if (!R.length) return null;
        const minX = Math.min(...R.map(o => o.r.x)), minY = Math.min(...R.map(o => o.r.y));
        const maxX = Math.max(...R.map(o => o.r.x + o.r.w)), maxY = Math.max(...R.map(o => o.r.y + o.r.h));
        const bb = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        const T = 2; // Toleranz in Einheiten
        // Abdeckung je Kante: Intervalle der Bloecke, die die Kante beruehren
        const edge = (side) => {
          const iv = [];
          for (const o of R) {
            let touch = false, a = 0, b = 0;
            if (side === 'oben')    { touch = Math.abs(o.r.y - bb.y) <= T; a = o.r.x; b = o.r.x + o.r.w; }
            if (side === 'unten')   { touch = Math.abs((o.r.y + o.r.h) - (bb.y + bb.h)) <= T; a = o.r.x; b = o.r.x + o.r.w; }
            if (side === 'links')   { touch = Math.abs(o.r.x - bb.x) <= T; a = o.r.y; b = o.r.y + o.r.h; }
            if (side === 'rechts')  { touch = Math.abs((o.r.x + o.r.w) - (bb.x + bb.w)) <= T; a = o.r.y; b = o.r.y + o.r.h; }
            if (touch) iv.push([a, b]);
          }
          iv.sort((p, q) => p[0] - q[0]);
          let len = 0, cur = null, notch = 0, prevEnd = null;
          const total = (side === 'oben' || side === 'unten') ? bb.w : bb.h;
          for (const [a, b] of iv) {
            if (!cur) { cur = [a, b]; }
            else if (a <= cur[1] + 0.1) { cur[1] = Math.max(cur[1], b); }
            else { len += cur[1] - cur[0]; notch = Math.max(notch, a - cur[1]); cur = [a, b]; }
          }
          if (cur) len += cur[1] - cur[0];
          const startGap = iv.length ? iv[0][0] - (0) : total;
          notch = Math.max(notch, iv.length ? iv[0][0] : 0);
          return { cover: +(100 * len / total).toFixed(0), notch: +notch.toFixed(0) };
        };
        const area = R.reduce((s, o) => s + o.r.w * o.r.h, 0);
        const doc = document.documentElement;
        const minFont = Math.min(...[...sheet.querySelectorAll('p, h1, figcaption, .ps-label__key, .ps-label__value, .ps-desc')]
          .filter(el => el.getClientRects().length)
          .map(el => parseFloat(getComputedStyle(el).fontSize)));
        return {
          sheet: { x: +sr.x.toFixed(0), y: +sr.y.toFixed(0), w: +sr.width.toFixed(0), h: +sr.height.toFixed(0) },
          bb: { x: +bb.x.toFixed(0), y: +bb.y.toFixed(0), w: +bb.w.toFixed(0), h: +bb.h.toFixed(0) },
          inside: +(100 * area / (bb.w * bb.h)).toFixed(0),
          edges: { oben: edge('oben'), unten: edge('unten'), links: edge('links'), rechts: edge('rechts') },
          vp: { w: window.innerWidth, h: window.innerHeight },
          scroll: { h: doc.scrollHeight, w: doc.scrollWidth, innerH: window.innerHeight, innerW: window.innerWidth },
          minFont: +minFont.toFixed(1),
          blocks: R.map(o => ({ t: o.type, n: o.n, x: +o.r.x.toFixed(0), y: +o.r.y.toFixed(0), w: +o.r.w.toFixed(0), h: +o.r.h.toFixed(0) })),
        };
      })()`);
      if (!r) continue;
      // Aussenfuellgrad: Silhouette in px gegen den Viewport
      const U = r.sheet.h / 850;
      const outside = 100 * (r.bb.w * U) * (r.bb.h * U) / (r.vp.w * r.vp.h);
      rows.push({ ...r, vp: `${vw}x${vh}`, slug, outside: +outside.toFixed(0) });
    }
  }
} finally { ws.close(); proc.kill(); }

const out = arg('json', null);
if (out) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(out, JSON.stringify(rows, null, 1));
}

if (W) {
  // Details für einen einzelnen Viewport
  for (const r of rows) {
    console.log(`\n${r.slug} @ ${r.vp}`);
    console.log(`  Blatt ${r.sheet.w}x${r.sheet.h}px (x ${r.sheet.x}, y ${r.sheet.y})   Silhouette ${r.bb.w}x${r.bb.h} Einheiten (y ${r.bb.y})`);
    console.log(`  Fuellung innen ${r.inside}%   aussen ${r.outside}%   Scroll ${r.scroll.h}/${r.scroll.innerH} x ${r.scroll.w}/${r.scroll.innerW}   min. Schrift ${r.minFont}px`);
    console.log('  Kanten ' + Object.entries(r.edges).map(([k, v]) => `${k}:${v.cover}% (Kerbe ${v.notch})`).join('  '));
    console.log('  Bloecke: ' + r.blocks.map(b => `${b.t[0]}(${b.x},${b.y},${b.w}x${b.h})`).join(' '));
  }
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('view', 10) + pad('seite', 22) + pad('silhouette', 12) + pad('innen', 7) + pad('aussen', 7) +
    pad('oben', 7) + pad('unten', 7) + pad('links', 7) + pad('rechts', 7) + 'scroll(minFont)');
  for (const r of rows) {
    const e = r.edges;
    console.log(pad(r.vp, 10) + pad(r.slug, 22) + pad(`${r.bb.w}x${r.bb.h}`, 12) + pad(r.inside + '%', 7) + pad(r.outside + '%', 7) +
      pad(e.oben.cover + '%', 7) + pad(e.unten.cover + '%', 7) + pad(e.links.cover + '%', 7) + pad(e.rechts.cover + '%', 7) +
      (r.scroll.h > r.scroll.innerH || r.scroll.w > r.scroll.innerW ? 'JA' : 'nein') + ` (${r.minFont}px)`);
  }
}

// Zielwerte @1440x900 (Richtwert): vertikal >= 95 %, Rahmen >= 90 % auf mind. 3
// Seiten, Fuellung innen >= 85 %, kein Scrollen, Schrift >= 10 px.
const pad2 = (s, n) => String(s).padEnd(n);
const ref = rows.filter(r => r.vp === '1440x900');
if (ref.length) {
  console.log('\nZielwerte @1440x900');
  console.log(pad2('seite', 22) + pad2('vertikal', 10) + pad2('rahmen', 14) + pad2('innen', 7) + pad2('aussen', 7) + pad2('scroll', 8) + 'urteil');
  for (const r of ref) {
    const e = r.edges;
    const vert = +(100 * r.bb.h / 850).toFixed(0);
    const edges = [e.oben.cover, e.unten.cover, e.links.cover, e.rechts.cover];
    const rahmen = +(edges.reduce((s, v) => s + v, 0) / 4).toFixed(0);
    const okEdges = edges.filter(v => v >= 90).length;
    const scroll = r.scroll.h > r.scroll.innerH || r.scroll.w > r.scroll.innerW;
    const ok = vert >= 95 && okEdges >= 3 && r.inside >= 85 && !scroll && r.minFont >= 10;
    console.log(pad2(r.slug, 22) + pad2(vert + '%', 10) + pad2(rahmen + '% (' + okEdges + '/4)', 14) + pad2(r.inside + '%', 7) +
      pad2(r.outside + '%', 7) + pad2(scroll ? 'JA' : 'nein', 8) + (ok ? 'PASS' : 'offen'));
  }
}
