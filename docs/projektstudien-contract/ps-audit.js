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
  const pxFromS = (s, contract) => (s / 100) * (document.querySelector(".ps-detail")?.clientWidth || document.documentElement.clientWidth || window.innerWidth);

  const declared = (el, attr) => el.dataset[attr] === 'declared' || !!el.closest('[data-' + attr.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) + '="declared"]');

  function collectItems() {
    const a = article();
    if (!a) return [];
    const items = [];
    a.querySelectorAll('figure').forEach((f) => {
      const img = f.querySelector('img');
      if (img) items.push({ kind: 'image', name: className(f), el: img, cover: getComputedStyle(img).objectFit === 'cover', declaredCrop: declared(img, 'crop'), declaredUpscale: declared(img, 'upscale') });
    });
    a.querySelectorAll('img').forEach((img) => {
      if (!img.closest('figure')) items.push({ kind: 'image', name: className(img), el: img, cover: getComputedStyle(img).objectFit === 'cover', declaredCrop: declared(img, 'crop'), declaredUpscale: declared(img, 'upscale') });
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
        declaredCrop: !!i.declaredCrop,
        declaredUpscale: !!i.declaredUpscale,
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

  const familyOf = (contract, page) => (contract.pageFamilies && contract.pageFamilies[page]) || 'ps';
  const tokensFor = (contract, page) => (familyOf(contract, page) === 'work' ? (contract.tokensWork || contract.tokens) : contract.tokens);

  function collectFonts(contract, page) {
    const a = article();
    if (!a) return {};
    const tokens = tokensFor(contract, page);
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
      const token = tokens[role];
      const floor = (contract.thresholds && contract.thresholds.typeFloor) || 0;
      const bodyS = (tokens.body && tokens.body.s) || 1.1;
      let expected = token ? pxFromS(token.s, contract) : null;
      if (token && floor) expected = Math.max(expected, floor * token.s / bodyS);
      out[role] = { ...info, expected: token ? num(expected, 4) : null, capFamily: caps[0] ? caps[0].familyKey : null };
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
      visible: first.r.t >= 0 && first.r.b <= window.innerHeight && first.r.l >= 0 && first.r.r <= (document.documentElement.clientWidth || window.innerWidth),
      rect: first.r,
      second: second ? second.name : null
    };
  }

  // Dichte: messbare Besiedlung der von den Aussenkanten aufgespannten Flaeche.
  // Alle Bilder + alle Textzeilen im Blatt (jedes Textnode genau einmal);
  // Captions zaehlen mit, die Navigation liegt ausserhalb des Blatts.
  function inkRects() {
    const root = sheetEl();
    if (!root) return [];
    const rects = [];
    root.querySelectorAll('img').forEach((el) => {
      const r = rectOf(el);
      if (r.w * r.h > 1) rects.push(r);
    });
    const range = document.createRange();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!n.nodeValue || !n.nodeValue.trim()) continue;
      range.selectNodeContents(n);
      for (const q of range.getClientRects()) {
        if (q.width * q.height < 1) continue;
        rects.push({ l: +q.left.toFixed(2), t: +q.top.toFixed(2), w: +q.width.toFixed(2), h: +q.height.toFixed(2), r: +q.right.toFixed(2), b: +q.bottom.toFixed(2) });
      }
    }
    return rects;
  }

  function densityReport() {
    const rects = inkRects();
    const se = sheetEl();
    if (!rects.length || !se) return { n: 0, fill: null, target: null, bboxShare: null, fillSheet: null, bbox: null };
    const bbox = rects.reduce((o, x) => ({
      l: Math.min(o.l, x.l), t: Math.min(o.t, x.t), r: Math.max(o.r, x.r), b: Math.max(o.b, x.b)
    }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
    const bw = bbox.r - bbox.l;
    const bh = bbox.b - bbox.t;
    const sheet = rectOf(se);
    const sum = rects.reduce((s, x) => s + x.w * x.h, 0);
    return {
      n: rects.length,
      bbox: { l: num(bbox.l), t: num(bbox.t), w: num(bw), h: num(bh) },
      area: num(sum),
      fill: num(sum / (bw * bh), 4),
      bboxShare: num((bw * bh) / (sheet.w * sheet.h), 4),
      fillSheet: num(sum / (sheet.w * sheet.h), 4)
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
    const target = Math.max(24, (document.documentElement.clientWidth || window.innerWidth) * 0.03);
    const bbox = bboxOf(items);
    const images = items.filter((i) => i.kind === 'image').map((i) => {
      const natural = i.nw && i.nh ? i.nw / i.nh : null;
      const rendered = i.r.w / i.r.h;
      return {
        name: i.name,
        cover: i.cover,
        declaredCrop: i.declaredCrop,
        declaredUpscale: i.declaredUpscale,
        aspectDelta: natural ? num(Math.abs(rendered / natural - 1), 4) : null,
        upscale: i.nw ? i.r.w > i.nw + 1 : null,
        upscaleRatio: i.nw ? num(i.r.w / i.nw, 4) : null,
        nw: i.nw,
        nh: i.nh,
        r: i.r
      };
    });
    const overlaps = overlapPairs(items);
    return {
      page: pageSlug(),
      viewport: { w: document.documentElement.clientWidth || window.innerWidth, h: document.documentElement.clientHeight || window.innerHeight },
      unitPx: num(pxFromS(1, contract), 4),
      sheet: { ...sheet, cx: num((sheet.l + sheet.r) / 2), widthRatio: num(sheet.w / (document.documentElement.clientWidth || window.innerWidth), 4) },
      content: { ...bbox, cx: num((bbox.l + bbox.r) / 2), cy: num((bbox.t + bbox.b) / 2) },
      footer: { top: num(footTop), low: num(low), gap: num(footTop - low), target: num(target), margin: getComputedStyle(foot).marginTop, bottom: num(foot.getBoundingClientRect().bottom), height: num(foot.getBoundingClientRect().height) },
      fonts: collectFonts(contract, pageSlug()),
      captions: captions.length,
      images,
      overlaps,
      hscroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      itemCount: items.length,
      items
    };
  }

  function modeOf(contract) {
    const min = (contract.scope && contract.scope.compositionMinWidth) || 1360;
    return (window.innerWidth || 0) >= min ? 'composition' : 'stack';
  }

  const rectOfSelector = (sel) => {
    const el = document.querySelector(sel);
    return el ? { el, ...rectOf(el) } : null;
  };

  // Item-Elemente (ohne Serialisierung) fuer die Zellzuweisung.
  function collectItemEls() {
    const a = article();
    if (!a) return [];
    const els = [];
    a.querySelectorAll('figure').forEach((f) => {
      const img = f.querySelector('img');
      if (img) els.push(img);
    });
    a.querySelectorAll('img').forEach((img) => {
      if (!img.closest('figure')) els.push(img);
    });
    a.querySelectorAll('[class*="-text"]').forEach((el) => {
      if (!el.querySelector('figure, [class*="-text"]')) els.push(el);
    });
    a.querySelectorAll('[class*="-side"]').forEach((el) => {
      if (!el.closest('[class*="-text"]') && !el.querySelector('[class*="-text"]')) els.push(el);
    });
    return els;
  }

  // Layout-Deskriptor: Spalten/Zeilen-Flushness, normierte Gaps und
  // Zellzuweisung. Nur in der Desktop-Komposition; der Stack ist Fluss.
  function layoutChecks(contract, m, add) {
    const layout = contract.layouts && contract.layouts[m.page];
    if (!layout) return;
    const tol = (contract.tolerances && contract.tolerances.flush) || 2;
    const gapTol = (contract.tolerances && contract.tolerances.gap) || 1;
    const s = pxFromS(1, contract);

    (layout.columns || []).forEach((col) => {
      const rects = (col.selectors || []).flatMap((sel) => [...document.querySelectorAll(sel)]).map(rectOf);
      if (rects.length < 2) return;
      const dev = Math.max(
        Math.max(...rects.map((r) => r.l)) - Math.min(...rects.map((r) => r.l)),
        Math.max(...rects.map((r) => r.r)) - Math.min(...rects.map((r) => r.r))
      );
      add('flush.col.' + col.name, dev <= tol, dev, 0, tol);
    });

    (layout.rows || []).forEach((row) => {
      const rects = (row.selectors || []).flatMap((sel) => [...document.querySelectorAll(sel)]).map(rectOf);
      if (rects.length < 2) return;
      const edges = row.edges || ['t', 'b'];
      const dev = Math.max(...edges.map((e) => {
        const vals = rects.map((r) => r[e]);
        return Math.max(...vals) - Math.min(...vals);
      }));
      add('flush.row.' + row.name, dev <= tol, dev, 0, tol);
    });

    (layout.gaps || []).forEach((g, i) => {
      const a = rectOfSelector(g.a);
      const b = rectOfSelector(g.b);
      if (!a || !b) return;
      const gap = b.l - a.r;
      const expected = (g.expected || 1.5) * s;
      add('gap.' + (g.name || i), Math.abs(gap - expected) <= gapTol, gap, expected, gapTol);
    });

    const cellEls = (layout.cells || []).map((c) => ({
      name: c.name,
      els: (c.selectors || []).flatMap((sel) => [...document.querySelectorAll(sel)])
    }));
    cellEls.forEach((c) => add('cell.' + c.name, c.els.length > 0, c.els.length, 1, 0));
    if (cellEls.length) {
      const unassigned = collectItemEls().filter((it) => !cellEls.some((c) => c.els.some((el) => el === it || el.contains(it))));
      add('cell.unassigned', unassigned.length === 0, unassigned.length, 0, 0, unassigned.length ? { items: unassigned.slice(0, 6).map((el) => className(el)) } : {});
    }

    // F5-Leerflaechen-Budget: kurzer Text in einer hohen Zelle ist erlaubt,
    // aber nur als Soft-Warnung ueber dem Budget (Default 30 % der Zellhoehe).
    const budget = (contract.thresholds && contract.thresholds.freeBudget) || 0.3;
    (layout.cells || []).filter((c) => c.text).forEach((c) => {
      const els = (c.selectors || []).flatMap((sel) => [...document.querySelectorAll(sel)]);
      if (!els.length) return;
      const el = els[0];
      const box = el.getBoundingClientRect();
      if (box.height <= 0) return;
      const range = document.createRange();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
      });
      let bottom = -Infinity, n;
      while ((n = walker.nextNode())) {
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (r.width < 1 || r.height < 1) continue;
          bottom = Math.max(bottom, r.bottom);
        }
      }
      el.querySelectorAll('img').forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.width > 1 && r.height > 1) bottom = Math.max(bottom, r.bottom);
      });
      if (bottom === -Infinity) return;
      const free = box.bottom - bottom;
      const ratio = free / box.height;
      add('free.' + c.name, ratio <= budget, num(ratio, 3), budget, 0, { soft: true, freePx: num(free) });
    });
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
    const tokens = tokensFor(contract, m.page);
    const mode = modeOf(contract);
    const isComposition = mode === 'composition';
    {
      const maxW = iw - 2 * (44 + 2 * iw * 0.03);
      add('sheet.width', m.sheet.w <= maxW + 0.5, m.sheet.w, maxW, 0.5);
      const margin = Math.min(m.sheet.l, iw - m.sheet.r);
      const minMargin = 44 + 2 * iw * 0.03;
      add('sheet.margin', margin >= minMargin - 0.5, margin, minMargin, 0.5);
      add('sheet.fill', true, m.sheet.w / maxW, 1, 0.25, { note: 'Ziel; kein Hard-Fail', soft: true });
      add('sheet.center', Math.abs(m.sheet.cx - iw / 2) <= t.center, m.sheet.cx, iw / 2, t.center);
      add('content.center', Math.abs(m.content.cx - m.sheet.cx) <= t.center, m.content.cx, m.sheet.cx, t.center);
      add('footer.gap', Math.abs(m.footer.gap - m.footer.target) <= t.footer, m.footer.gap, m.footer.target, t.footer);
    }

    Object.keys(m.fonts).forEach((role) => {
      const f = m.fonts[role];
      if (!f || f.expected == null) return;
      add('type.' + role, Math.abs(f.fs - f.expected) <= t.type, f.fs, f.expected, t.type);
      const token = tokens[role];
      if (token && token.weight) {
        let expectedWeight = token.weight;
        if (role === 'caption') {
          const ex = (token.exceptions || []).find((e) => e.page === m.page);
          if (ex && ex.weight) expectedWeight = ex.weight;
        }
        add('weight.' + role, String(f.weight) === String(expectedWeight), Number(f.weight), Number(expectedWeight), 0);
      }
      if (token && token.align) add('align.' + role, f.align === token.align, f.align, token.align, 0);
    });

    const captionToken = tokens.caption;
    if (m.captions > 0 && captionToken) {
      const ex = (captionToken.exceptions || []).find((e) => e.page === m.page);
      const expectedFamily = ex ? ex.family : captionToken.family;
      const got = m.fonts.caption && m.fonts.caption.familyKey;
      add('caption.family', got === expectedFamily, got, expectedFamily, 0);
    }

    // Deklarierte Crops sind erlaubt (Freiheit F7); undeklarierte Crops sind Fehler.
    const aspect = m.images.filter((i) => i.aspectDelta != null && !i.declaredCrop);
    const worst = aspect.reduce((a, b) => (a == null || b.aspectDelta > a.aspectDelta ? b : a), null);
    add('image.aspect', worst ? worst.aspectDelta <= t.aspect : true, worst ? worst.aspectDelta : 0, 0, t.aspect, worst ? { worst: worst.name } : {});
    // Upscaling-Grenze (nur Desktop-Komposition; der Stack bekommt eigene Asset-Groessen).
    if (isComposition) {
      const maxUp = (contract.thresholds && contract.thresholds.maxUpscale) || 1.5;
      const ups = m.images.filter((i) => i.upscaleRatio != null && !i.declaredUpscale);
      const worstUp = ups.reduce((a, b) => (a == null || b.upscaleRatio > a.upscaleRatio ? b : a), null);
      add('image.upscale', !worstUp || worstUp.upscaleRatio <= maxUp, worstUp ? worstUp.upscaleRatio : 1, maxUp, 0, worstUp ? { worst: worstUp.name } : {});
    }
    add('overlap', m.overlaps.length === 0, m.overlaps.length, 0, 0, m.overlaps.length ? { pairs: m.overlaps.slice(0, 3) } : {});
    add('hscroll', m.hscroll <= 0, m.hscroll, 0, 0);
    if (isComposition) layoutChecks(contract, m, add);

    const a = article();
    if (a) {
      const labelEls = [...a.querySelectorAll('.ps-label')];
      if (labelEls.length) {
        const rows = labelEls.map((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const lh = parseFloat(cs.lineHeight) || r.height || 1;
          const key = el.querySelector('.ps-label__key');
          const val = el.querySelector('.ps-label__value');
          const gap = parseFloat(cs.columnGap || cs.gap) || 0;
          const content = (key ? key.getBoundingClientRect().width : 0) + gap + (val ? val.getBoundingClientRect().width : 0);
          return { lines: r.height / lh, room: r.width - content };
        });
        const buffer = (contract.thresholds && contract.thresholds.labelBufferPx) || 4;
        add('label.oneLine', rows.every((x) => x.lines <= 1.2), Math.max(...rows.map((x) => x.lines)), 1, 0.2, { soft: true });
        add('label.fit', rows.every((x) => x.room >= buffer), Math.min(...rows.map((x) => x.room)), buffer, 0, { soft: true });
      }
      const metaEl = a.querySelector('.ps-text');
      const bodyEl = a.querySelector('.ps-stadttor-text, .ps-balla-text-main, .ps-sportler-text, .ps-stoerche-text, .ps-skydance-text, .ps-entwicklung-text-1, .ps-bubbles-text, .ps-dschungel-text, .ps-ct-text, .ps-bademaxx-text');
      const adjacency = (contract.layouts && contract.layouts[m.page] && contract.layouts[m.page].adjacency) || 'stacked';
      if (metaEl && bodyEl && adjacency !== 'beside') {
        const gap = bodyEl.getBoundingClientRect().top - metaEl.getBoundingClientRect().bottom;
        const maxGap = ((contract.thresholds && contract.thresholds.textGapMax) || 0.1) * m.sheet.w;
        add('text.gap', gap <= maxGap, gap, maxGap, 0);
      }
      const glanceTarget = Math.min((contract.thresholds && contract.thresholds.atGlancePx) || 780, m.viewport.h);
      const pageBottom = Math.max(m.sheet.b, m.footer.bottom || m.footer.top);
      add('page.glance', pageBottom <= glanceTarget + 0.5, pageBottom, glanceTarget, 0.5, { note: 'At-a-glance-Ziel; kein Hard-Fail', soft: true });
    }

    const hero = heroReport(m.items);
    if (isComposition && hero) {
      const heroMin = (contract.thresholds && contract.thresholds.heroShare) || 1.3;
      const den = densityReport();
      const dense = den.fill != null && den.fill >= ((contract.thresholds && contract.thresholds.minFill) || 0.7);
      add('hero.share', hero.share >= heroMin, hero.share, heroMin, 0, {
        hero: hero.name,
        second: hero.second,
        soft: dense,
        note: dense ? 'Dichte >= minFill: Hero-Dominanz ist SOLLTE' : undefined
      });
      // Der Hero kann nur vollstaendig im Viewport liegen, wenn das Blatt
      // (Desktop-Komposition) in den Viewport passt. Im gestapelten
      // Tablet-Layout ist Scrollen ausdruecklich erlaubt; dort ist das
      // At-a-glance-Ziel laut Contract optional.
      const belowFold = m.sheet.b > m.viewport.h + 1;
      add('hero.visible', hero.visible, hero.visible ? 1 : 0, 1, 0, { hero: hero.name, rect: hero.rect, soft: belowFold });
    }

    if (isComposition) {
      const den = densityReport();
      if (den.fill != null) {
        const minFill = (contract.thresholds && contract.thresholds.minFill) || 0.7;
        const targetFill = (contract.thresholds && contract.thresholds.targetFill) || 0.78;
        const minBbox = (contract.thresholds && contract.thresholds.minBboxShare) || 0.7;
        add('density.fill', den.fill >= minFill, den.fill, minFill, 0);
        add('density.target', den.fill >= targetFill, den.fill, targetFill, 0, { soft: true });
        add('density.bboxShare', den.bboxShare >= minBbox, den.bboxShare, minBbox, 0, { soft: true });
      }
    }

    const body = m.fonts.body;
    const floor = (contract.thresholds && contract.thresholds.typeFloor) || 12;
    if (body) add('type.floor', body.fs >= floor, body.fs, floor, 0);

    return list;
  }

  function summarize(list) {
    const failed = list.filter((c) => !c.ok && !c.soft);
    const warnings = list.filter((c) => !c.ok && c.soft);
    return {
      total: list.length,
      passed: list.filter((c) => c.ok).length,
      failed: failed.length,
      warnings: warnings.length,
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
      mode: modeOf(contract),
      scope: modeOf(contract),
      summary: summarize(list),
      checks: list,
      sheet: m.sheet,
      content: m.content,
      footer: m.footer,
      fonts: m.fonts,
      hero: heroReport(m.items),
      density: densityReport(),
      images: m.images,
      captions: m.captions,
      overlaps: m.overlaps,
      hscroll: m.hscroll,
      itemCount: m.itemCount,
      flush: edge
    };
  }

  root.PSAudit = { run, measure, checks, collectItems, collectFonts, edgeReport, heroReport, densityReport };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PSAudit;
})(typeof globalThis !== 'undefined' ? globalThis : this);




