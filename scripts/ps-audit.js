(function (root) {
  'use strict';

  const num = (n, d) => {
    if (n == null) return null;
    if (typeof n !== 'number' || Number.isNaN(n)) return n;
    const p = Math.pow(10, d == null ? 2 : d);
    return Math.round(n * p) / p;
  };
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { l: +r.left.toFixed(2), t: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2), r: +r.right.toFixed(2), b: +r.bottom.toFixed(2) };
  };
  const className = (el) => (el.className && typeof el.className === 'string' ? el.className.split(/\s+/)[0] : el.tagName.toLowerCase());
  const pageSlug = () => {
    const seg = location.pathname.split('/').filter(Boolean);
    return seg.length ? seg[seg.length - 1] : 'index';
  };
  const article = () => document.querySelector('.ps-detail');
  const sheetEl = () => {
    const a = article();
    return a ? a.querySelector(':scope > div[class^="ps-"]') : null;
  };
  const pxFromS = (s, contract) => (s * (contract.unit.sheetWidthVw / 100) * window.innerWidth) / 100;

  function collectItems() {
    const a = article();
    if (!a) return [];
    const items = [];
    a.querySelectorAll('figure').forEach((f) => {
      const img = f.querySelector('img');
      if (img) items.push({ kind: 'image', name: className(f), el: img, cover: getComputedStyle(img).objectFit === 'cover' });
    });
    a.querySelectorAll('img').forEach((img) => {
      if (!img.closest('figure')) items.push({ kind: 'image', name: className(img), el: img, cover: getComputedStyle(img).objectFit === 'cover' });
    });
    a.querySelectorAll('[class*="-text"]').forEach((el) => {
      if (!el.querySelector('figure, [class*="-text"]')) items.push({ kind: 'text', name: className(el), el });
    });
    a.querySelectorAll('[class*="-side"]').forEach((el) => {
      if (!el.closest('[class*="-text"]') && !el.querySelector('[class*="-text"]')) items.push({ kind: 'side', name: className(el), el });
    });
    return items.map((i) => {
      const r = rectOf(i.el);
      return {
        kind: i.kind,
        name: i.name,
        cover: !!i.cover,
        r,
        nw: i.el.naturalWidth || null,
        nh: i.el.naturalHeight || null
      };
    });
  }

  function collectCaptions() {
    const a = article();
    if (!a) return [];
    return [...a.querySelectorAll('figcaption')].map((el) => {
      const cs = getComputedStyle(el);
      const r = rectOf(el);
      return { r, fs: parseFloat(cs.fontSize), family: cs.fontFamily, familyKey: /Garamond/.test(cs.fontFamily) ? 'serif' : /League Spartan/.test(cs.fontFamily) ? 'sans' : 'other' };
    });
  }

  function firstBody() {
    const a = article();
    if (!a) return null;
    const ps = [...a.querySelectorAll('[class*="-text"] p, [class*="-text"]')].filter((el) => el.tagName === 'P' && !el.classList.contains('ps-desc'));
    return ps.find((p) => getComputedStyle(p).textAlign === 'justify') || ps[0] || [...a.querySelectorAll('p')].find((p) => !p.classList.contains('ps-desc')) || null;
  }

  function fontInfo(el) {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      fs: parseFloat(cs.fontSize),
      weight: cs.fontWeight,
      align: cs.textAlign === 'start' ? 'left' : cs.textAlign,
      family: cs.fontFamily,
      familyKey: /Garamond/.test(cs.fontFamily) ? 'serif' : /League Spartan/.test(cs.fontFamily) ? 'sans' : 'other'
    };
  }

  function collectFonts(contract) {
    const a = article();
    if (!a) return {};
    const caps = collectCaptions();
    const roles = {
      title: a.querySelector('.ps-title'),
      desc: a.querySelector('.ps-desc'),
      body: firstBody(),
      label: a.querySelector('.ps-label__key'),
      value: a.querySelector('.ps-label__value'),
      caption: a.querySelector('figcaption')
    };
    const out = {};
    Object.keys(roles).forEach((role) => {
      const info = fontInfo(roles[role]);
      if (!info) {
        out[role] = null;
        return;
      }
      const token = contract.tokens[role];
      out[role] = { ...info, expected: token ? num(pxFromS(token.s, contract), 4) : null, capFamily: caps[0] ? caps[0].familyKey : null };
    });
    return out;
  }

  function bboxOf(items) {
    return items.reduce((a, i) => ({
      l: Math.min(a.l, i.r.l),
      r: Math.max(a.r, i.r.r),
      t: Math.min(a.t, i.r.t),
      b: Math.max(a.b, i.r.b)
    }), { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity });
  }

  function overlapPairs(items) {
    const pairs = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i].r;
        const b = items[j].r;
        const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
        const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        if (w > 0.5 && h > 0.5) pairs.push({ a: items[i].name, b: items[j].name, area: num(w * h) });
      }
    }
    return pairs;
  }

  function edgeReport(items, sheet, tol) {
    const sheetEdges = { l: [sheet.l], r: [sheet.r], t: [sheet.t], b: [sheet.b] };
    const values = {
      l: items.map((i) => i.r.l).concat(sheetEdges.l),
      r: items.map((i) => i.r.r).concat(sheetEdges.r),
      t: items.map((i) => i.r.t).concat(sheetEdges.t),
      b: items.map((i) => i.r.b).concat(sheetEdges.b)
    };
    const tracks = {};
    Object.keys(values).forEach((k) => {
      tracks[k] = [...new Set(values[k].map((v) => Math.round(v)))].sort((a, b) => a - b);
    });
    const orphans = [];
    items.forEach((i) => {
      Object.keys(values).forEach((k) => {
        const shared = values[k].filter((v) => Math.abs(v - i.r[k]) <= tol).length;
        if (shared < 2) orphans.push({ name: i.name, side: k, value: num(i.r[k]) });
      });
    });
    return { tracks, orphans, orphanCount: orphans.length };
  }

  function heroReport(items) {
    const imgs = items.filter((i) => i.kind === 'image').map((i) => ({ ...i, area: i.r.w * i.r.h })).sort((a, b) => b.area - a.area);
    if (!imgs.length) return null;
    const first = imgs[0];
    const second = imgs[1] || null;
    return {
      name: first.name,
      area: num(first.area),
      share: second ? num(first.area / second.area) : 99,
      visible: first.r.t >= 0 && first.r.b <= window.innerHeight && first.r.l >= 0 && first.r.r <= window.innerWidth,
      rect: first.r,
      second: second ? second.name : null
    };
  }

  function measure(contract) {
    const a = article();
    const se = sheetEl();
    const foot = document.querySelector('.site-foot');
    if (!a || !se || !foot) return { page: pageSlug(), error: 'ps-detail, sheet oder .site-foot fehlt' };
    const sheet = rectOf(se);
    const items = collectItems();
    const captions = collectCaptions();
    const contentEls = [...a.querySelectorAll(contract.measurement.contentSelector)];
    const low = contentEls.length ? Math.max(...contentEls.map((el) => el.getBoundingClientRect().bottom)) : sheet.b;
    const footTop = foot.getBoundingClientRect().top;
    const target = Math.max(24, window.innerWidth * 0.03);
    const bbox = bboxOf(items);
    const images = items.filter((i) => i.kind === 'image').map((i) => {
      const natural = i.nw && i.nh ? i.nw / i.nh : null;
      const rendered = i.r.w / i.r.h;
      return {
        name: i.name,
        cover: i.cover,
        aspectDelta: natural ? num(Math.abs(rendered / natural - 1), 4) : null,
        upscale: i.nw ? i.r.w > i.nw + 1 : null,
        nw: i.nw,
        nh: i.nh,
        r: i.r
      };
    });
    const overlaps = overlapPairs(items);
    return {
      page: pageSlug(),
      viewport: { w: window.innerWidth, h: window.innerHeight },
      unitPx: num(pxFromS(1, contract), 4),
      sheet: { ...sheet, cx: num((sheet.l + sheet.r) / 2), widthRatio: num(sheet.w / window.innerWidth, 4) },
      content: { ...bbox, cx: num((bbox.l + bbox.r) / 2), cy: num((bbox.t + bbox.b) / 2) },
      footer: { top: num(footTop), low: num(low), gap: num(footTop - low), target: num(target), margin: getComputedStyle(foot).marginTop },
      fonts: collectFonts(contract),
      captions: captions.length,
      images,
      overlaps,
      hscroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      itemCount: items.length,
      items
    };
  }

  function checks(contract, m) {
    const list = [];
    const add = (id, ok, value, expected, tol, extra) => {
      const dev = (contract.deviations || []).find((d) => d.rule === id && (d.pages === '*' || (Array.isArray(d.pages) && d.pages.includes(m.page))));
        list.push({
          id,
          ok: !!ok,
          value: num(value, 4),
          expected: expected == null ? null : num(expected, 4),
          delta: typeof value === 'number' && typeof expected === 'number' ? num(value - expected, 4) : null,
          tol,
          known: !!dev,
          note: dev ? dev.note : undefined,
        ...(extra || {})
      });
    };
    const iw = m.viewport.w;
    const t = contract.tolerances;
    add('sheet.width', Math.abs(m.sheet.w - (contract.unit.sheetWidthVw / 100) * iw) <= 0.5, m.sheet.w, (contract.unit.sheetWidthVw / 100) * iw, 0.5);
    add('sheet.center', Math.abs(m.sheet.cx - iw / 2) <= t.center, m.sheet.cx, iw / 2, t.center);
    add('content.center', Math.abs(m.content.cx - m.sheet.cx) <= t.center, m.content.cx, m.sheet.cx, t.center);
    add('footer.gap', Math.abs(m.footer.gap - m.footer.target) <= t.footer, m.footer.gap, m.footer.target, t.footer);

    Object.keys(m.fonts).forEach((role) => {
      const f = m.fonts[role];
      if (!f || f.expected == null) return;
      add('type.' + role, Math.abs(f.fs - f.expected) <= t.type, f.fs, f.expected, t.type);
      const token = contract.tokens[role];
      if (token && token.weight) add('weight.' + role, String(f.weight) === String(token.weight), Number(f.weight), Number(token.weight), 0);
      if (token && token.align) add('align.' + role, f.align === token.align, f.align, token.align, 0);
    });

    const captionToken = contract.tokens.caption;
    if (m.captions > 0 && captionToken) {
      const ex = (captionToken.exceptions || []).find((e) => e.page === m.page);
      const expectedFamily = ex ? ex.family : captionToken.family;
      const got = m.fonts.caption && m.fonts.caption.familyKey;
      add('caption.family', got === expectedFamily, got, expectedFamily, 0);
    }

    const aspect = m.images.filter((i) => !i.cover && i.aspectDelta != null);
    const worst = aspect.reduce((a, b) => (a == null || b.aspectDelta > a.aspectDelta ? b : a), null);
    add('image.aspect', worst ? worst.aspectDelta <= t.aspect : true, worst ? worst.aspectDelta : 0, 0, t.aspect, worst ? { worst: worst.name } : {});
    add('overlap', m.overlaps.length === 0, m.overlaps.length, 0, 0, m.overlaps.length ? { pairs: m.overlaps.slice(0, 3) } : {});
    add('hscroll', m.hscroll <= 0, m.hscroll, 0, 0);

    const hero = heroReport(m.items);
    if (hero) {
      const heroMin = (contract.thresholds && contract.thresholds.heroShare) || 1.3;
      add('hero.share', hero.share >= heroMin, hero.share, heroMin, 0, { hero: hero.name, second: hero.second });
      add('hero.visible', hero.visible, hero.visible ? 1 : 0, 1, 0, { hero: hero.name, rect: hero.rect });
    }

    const body = m.fonts.body;
    const floor = (contract.thresholds && contract.thresholds.typeFloor) || 12;
    if (body && iw >= 1200) add('type.floor', body.fs >= floor, body.fs, floor, 0);

    return list;
  }

  function summarize(list) {
    const failed = list.filter((c) => !c.ok);
    return {
      total: list.length,
      failed: failed.length,
      known: failed.filter((c) => c.known).length,
      unknown: failed.filter((c) => !c.known).length
    };
  }

  function run(contract) {
    const m = measure(contract);
    if (m.error) return { ...m, checks: [], summary: { total: 0, failed: 0, known: 0, unknown: 0 } };
    const list = checks(contract, m);
    const edge = edgeReport(m.items, m.sheet, contract.tolerances.edge);
    return {
      page: m.page,
      viewport: m.viewport,
      summary: summarize(list),
      checks: list,
      sheet: m.sheet,
      content: m.content,
      footer: m.footer,
      fonts: m.fonts,
      hero: heroReport(m.items),
      images: m.images,
      captions: m.captions,
      overlaps: m.overlaps,
      hscroll: m.hscroll,
      itemCount: m.itemCount,
      flush: edge
    };
  }

  root.PSAudit = { run, measure, checks, collectItems, collectFonts, edgeReport, heroReport };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PSAudit;
})(typeof globalThis !== 'undefined' ? globalThis : this);
