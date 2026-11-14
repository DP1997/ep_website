/**
 * Verifikation aller Projektstudien-Seiten: 6 Viewports x 8 Seiten.
 * Prueft: geladene Bilder, Seitenverhaeltnisse, Ueberlauf, Meta-Abstaende,
 * horizontale Zentrierung und die Buendigkeits-Vorgaben je Seite.
 * node scripts/verify.mjs
 */
import { launch, openPage, evaluate, screenshot } from './cdp.mjs';

const PAGES = ['bubbles', 'balla-balla', 'sportler-in-bewegung', 'dschungel',
  'stoerche-froesche', 'entwicklung', 'skydance', 'stadttor'];
const VIEWPORTS = [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 720], [1024, 768]];
const BASE = 'http://localhost:4321/ep_website/projektstudien/';

const { proc, ws } = await launch();
const problems = [];
const summary = [];

try {
  for (const [w, h] of VIEWPORTS) {
    await evaluate(ws, `(() => {})()`); // noop
    for (const slug of PAGES) {
      await openPage(ws, `${BASE}${slug}/?v=${Date.now()}`, w, h);
      const r = await evaluate(ws, `(() => {
        const sheet = document.querySelector('.ps-detail > *');
        const sr = sheet.getBoundingClientRect();
        const U = sr.height / 850;
        const SW = sr.width / U;   // Blattbreite in Einheiten (je Seite unterschiedlich)
        const rel = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return { x: (b.left - sr.left) / U, y: (b.top - sr.top) / U, w: b.width / U,
            h: b.height / U, r: (b.right - sr.left) / U, b: (b.bottom - sr.top) / U,
            c: ((b.top - sr.top) + (b.bottom - sr.top)) / 2 / U };
        };
        const out = { broken: [], distort: [], overflow: [], gaps: [], flush: [] };
        for (const img of sheet.querySelectorAll('img')) {
          if (!img.naturalWidth) { out.broken.push(img.src); continue; }
          const nat = img.naturalWidth / img.naturalHeight;
          const rect = img.getBoundingClientRect();
          const ratio = (rect.width / rect.height);
          if (Math.abs(nat - ratio) / nat > 0.02) {
            out.distort.push({ file: (img.currentSrc || '').split('/').pop().slice(0, 30), nat: +nat.toFixed(3), box: +ratio.toFixed(3) });
          }
        }
        for (const el of sheet.querySelectorAll('*')) {
          if (el === sheet || !el.getClientRects().length) continue;
          const b = el.getBoundingClientRect();
          const x = (b.left - sr.left) / U, y = (b.top - sr.top) / U;
          const rr = (b.right - sr.left) / U, bb = (b.bottom - sr.top) / U;
          if (b.width <= 0 || b.height <= 0) continue;
          const isWrapper = b.height >= sr.height - 2 && b.width >= sr.width - 2;
          if (isWrapper) continue;
          if (x < -1 || y < -1 || rr > SW + 1 || bb > 851) {
            out.overflow.push({ cls: el.className.toString().slice(0, 34), x: +x.toFixed(1), y: +y.toFixed(1), r: +rr.toFixed(1), b: +bb.toFixed(1) });
          }
        }
        const meta = sheet.querySelector('.ps-meta-block');
        if (meta) {
          const title = meta.parentElement.querySelector('.ps-title');
          const desc = meta.querySelector('.ps-desc');
          const labels = meta.querySelector('.ps-labels');
          const rows = labels ? [...labels.querySelectorAll('.ps-label')] : [];
          const push = (a, b, name) => { if (a && b) { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            out.gaps.push({ name, gap: +((rb.top - ra.bottom) / U).toFixed(1) }); } };
          push(title, desc, 'title>desc'); push(desc, labels, 'desc>labels');
          for (let i = 0; i < rows.length - 1; i++) push(rows[i], rows[i + 1], 'label' + i);
        }
        // Zentrierung
        const items = [...sheet.querySelectorAll('img, .ps-title, .ps-desc, .ps-labels, .ps-label, p, figcaption')].filter(el => el.getClientRects().length);
        let min = Infinity, max = -Infinity;
        for (const el of items) { const b = el.getBoundingClientRect();
          min = Math.min(min, (b.left - sr.left) / U); max = Math.max(max, (b.right - sr.left) / U); }
        out.center = +(((min + max) / 2) - SW / 2).toFixed(1);
        // Bubbles: Abstand der kleinen Bilder zueinander
        if (${JSON.stringify(slug)} === 'bubbles') {
          const imgs = [...sheet.querySelectorAll('.ps-bubbles-details img')].map(el => el.getBoundingClientRect());
          out.bildabstand = +((imgs[1].top - imgs[0].bottom) / U).toFixed(1);
        }
        // Buendigkeiten je Seite
        const S = {
          'balla-balla': [
            ['meta-mitte=text-main-mitte', '.ps-balla-side .ps-text', 'c', '.ps-balla-text-main', 'c', 1.5],
            ['textside.oberkante=bild2.oberkante', '.ps-balla-text-side', 'y', '.ps-balla-figure2 img', 'y', 1.5],
          ],
          bubbles: [
            ['meta->quadrate 32', '.ps-bubbles-details img', 'y', '.ps-bubbles-header .ps-labels', 'b', 1.5, 32],
            ['quadrate-abstand 32', '.ps-bubbles-details img:nth-child(2)', 'y', '.ps-bubbles-details img', 'b', 1.5, 32],
            ['quadrate->text 32', '.ps-bubbles-text', 'x', '.ps-bubbles-details img', 'r', 1.5, 32],
            ['quadrate.unterkante=text.unterkante', '.ps-bubbles-details', 'b', '.ps-bubbles-text', 'b', 1.5],
          ],
          entwicklung: [
            ['meta.oberkante=bild.oberkante', '.ps-entwicklung-side .ps-text', 'y', '.ps-entwicklung-fig img', 'y', 1.5],
            ['text.unterkante=bild.unterkante', '.ps-entwicklung-text', 'b', '.ps-entwicklung-fig img', 'b', 1.5],
            ['text.links=meta.links', '.ps-entwicklung-text', 'x', '.ps-entwicklung-side .ps-text', 'x', 1.5],
            ['text1 mittig oben (65)', '.ps-entwicklung-text-1', 'y', '.ps-entwicklung-side .ps-text', 'b', 2.5, 65],
            ['text1 mittig unten (65)', '.ps-entwicklung-text', 'y', '.ps-entwicklung-text-1', 'b', 1.5, 66],
          ],
              dschungel: [
                ['meta.oberkante=grossbild.oberkante', '.ps-dschungel-side .ps-text', 'y', '.ps-dschungel-main img', 'y', 1.5],
                ['meta.links=orangutan.links', '.ps-dschungel-side .ps-text', 'x', '.ps-dschungel-figures img', 'x', 1.5],
                ['metafeld.rechts=orangutan.rechts', '.ps-dschungel-side .ps-text', 'r', '.ps-dschungel-figures img', 'r', 1.5],
                ['meta->text 20.4', '.ps-dschungel-text', 'y', '.ps-dschungel-side .ps-text', 'b', 2.5, 20.4],
                ['text.rechts=orangutan.rechts', '.ps-dschungel-text', 'r', '.ps-dschungel-figures img', 'r', 1.5],
                ['text->orangutan 20.4', '.ps-dschungel-figures img', 'y', '.ps-dschungel-text', 'b', 2.5, 20.4],
                ['spalte->hero 20.4', '.ps-dschungel-main img', 'x', '.ps-dschungel-side .ps-text', 'r', 1.5, 20.4],
                ['ara.links=hero.links', '.ps-dschungel-fig4 img', 'x', '.ps-dschungel-main img', 'x', 1.5],
                ['tukan.rechts=hero.rechts', '.ps-dschungel-fig5 img', 'r', '.ps-dschungel-main img', 'r', 1.5],
                ['hero->zeile 20.4', '.ps-dschungel-fig4 img', 'y', '.ps-dschungel-main img', 'b', 1.5, 20.4],
                ['ara.oberkante=tukan.oberkante', '.ps-dschungel-fig4 img', 'y', '.ps-dschungel-fig5 img', 'y', 1.5],
                ['ara.unterkante=tukan.unterkante', '.ps-dschungel-fig4 img', 'b', '.ps-dschungel-fig5 img', 'b', 1.5],
              ],
          skydance: [
            ['text.unterkante=bild1', '.ps-skydance-text', 'b', '.ps-skydance-fig1 img', 'b', 1.5],
            ['text.unterkante=bild2', '.ps-skydance-text', 'b', '.ps-skydance-fig2 img', 'b', 1.5],
          ],
          stadttor: [
            ['bildunterschrift 0.96cqh unter bild', '.ps-stadttor-fig1 figcaption', 'y', '.ps-stadttor-fig1 img', 'b', 1.5, 8.16],
            ['bildunterschrift links buendig', '.ps-stadttor-fig1 figcaption', 'x', '.ps-stadttor-fig1 img', 'x', 12],
            ['bild3->bild2 20.4', '.ps-stadttor-fig2 img', 'y', '.ps-stadttor-fig3 img', 'b', 1.5, 20.4],
          ],
          'sportler-in-bewegung': [
            ['meta.rechts=bild1.rechts', '.ps-sportler-side .ps-text', 'r', '.ps-sportler-fig1 img', 'r', 1.5],
            ['text.rechts=bild1.rechts', '.ps-sportler-text', 'r', '.ps-sportler-fig1 img', 'r', 1.5],
            ['bild2.links=bild1.links', '.ps-sportler-fig2 img', 'x', '.ps-sportler-fig1 img', 'x', 1.5],
                ['text.links 17.2 nach bild2', '.ps-sportler-text', 'x', '.ps-sportler-fig2 img', 'r', 1.5, 17.2],
                ['meta.oberkante=bild2.oberkante', '.ps-sportler-side .ps-text', 'y', '.ps-sportler-fig2 img', 'y', 1.5],
                ['text.unterkante=bild2.unterkante', '.ps-sportler-text', 'b', '.ps-sportler-fig2 img', 'b', 1.5],
          ],
          'stoerche-froesche': [
            ['frösche.unterkante=bild7.unterkante', '.ps-stoerche-fig8 img', 'b', '.ps-stoerche-fig7 img', 'b', 1.5],
            ['meta.oberkante=band.oberkante', '.ps-stoerche-side .ps-title', 'y', '.ps-stoerche-row img', 'y', 2],
            ['text.unterkante=band.unterkante', '.ps-stoerche-text', 'b', '.ps-stoerche-row img', 'b', 1.5],
            ['bild6.oberkante=bild7.oberkante', '.ps-stoerche-fig6 img', 'y', '.ps-stoerche-fig7 img', 'y', 1.5],
            ['portraitabstand = 10', '.ps-stoerche-row img:nth-child(2)', 'x', '.ps-stoerche-row img', 'r', 1.5, 10],
            ['bildabstand text->gross = 20', '.ps-stoerche-fig7 img', 'y', '.ps-stoerche-text', 'b', 1.5, 20],
            ['bildabstand text->portrait = 20', '.ps-stoerche-row img', 'x', '.ps-stoerche-text', 'r', 1.5, 20],
            ['bildabstand strasse->frosch (Folge Breite)', '.ps-stoerche-fig8 img', 'y', '.ps-stoerche-fig6 img', 'b', 1.5, 23.4],
                ['fig6.rechts 20.2 vor bild7', '.ps-stoerche-fig7 img', 'x', '.ps-stoerche-fig6 img', 'r', 1.5, 20.2],
                ['fig8.rechts 20.2 vor bild7', '.ps-stoerche-fig7 img', 'x', '.ps-stoerche-fig8 img', 'r', 1.5, 20.2],
          ],
        }[${JSON.stringify(slug)}] || [];
        for (const [name, sa, ka, sb, kb, tol, ref] of S) {
          const ra = rel(sa), rb = rel(sb);
          if (!ra || !rb) { out.flush.push({ name, err: 'Element fehlt: ' + (ra ? sb : sa) }); continue; }
          const d = ra[ka] - rb[kb];
          const target = ref === 'bildabstand' ? -out.bildabstand : (typeof ref === 'number' ? ref : 0);
          out.flush.push({ name, delta: +(d - target).toFixed(1), ok: Math.abs(d - target) <= tol });
        }


        return out;
      })()`);
      const p = [];
      if (r.broken.length) p.push({ broken: r.broken });
      if (r.distort.length && slug !== 'bubbles') p.push({ distort: r.distort });
      if (r.overflow.length) p.push({ overflow: r.overflow });
      if (r.gaps.some(g => Math.abs(g.gap - 8.5) > 0.6)) p.push({ gaps: r.gaps.filter(g => Math.abs(g.gap - 8.5) > 0.6) });
      if (Math.abs(r.center) > 2) p.push({ center: r.center });
      if (r.flush.some(f => !f.ok)) p.push({ flush: r.flush.filter(f => !f.ok) });
      if (p.length) problems.push({ vp: `${w}x${h}`, slug, ...p });
      summary.push(`${slug}@${w}x${h} ok`);
    }
  }
} finally {
  ws.close();
  proc.kill();
}
console.log(JSON.stringify({ total: summary.length, problems }, null, 1));
