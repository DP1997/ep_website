/**
 * flipbook-init.js
 *
 * Turn.js flipbook using PDF.js.
 * Fore-edge staircase strips with 45° angled clip-path.
 * Line count capped at totalPages/2 — one line per 2 physical pages.
 */

(function () {
  'use strict';

  var pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  var RENDER_SCALE = 2;
  var MARGIN = 40;
  var MAX_FRACTION = 0.88;

  // Fore-edge staircase — thin dark-gray lines with visible white gaps
  var LINE_STEP   = 2.0;   // px per line (line + gap)
  var LINE_WIDTH  = 0.5;   // thin dark line
  var LINE_COLOR  = '#444'; // dark gray
  var ANGLE_DEPTH = 14;

  var shell  = document.querySelector('.flipbook-shell');
  var loader = document.getElementById('fb-loader');
  var book   = document.getElementById('fb-book');
  var spine  = document.getElementById('fb-spine');
  var pdfUrl = shell.dataset.pdfUrl;

  var stripLeft   = null;
  var stripRight  = null;
  var leftWrap    = null;
  var rightWrap   = null;

  var lastPage = 1;

  var pdfDoc        = null;
  var totalPages    = 0;
  var maxStripLines = 0;   // cap = ceil(totalPages / 2)
  var bookInited    = false;
  var pageMapGlobal = null;

  var pageW, pageH, bookW, bookH;
  var storedPageAR = 0.707;

  // ---- Page map ----------------------------------------------------

  function buildPageMap(n) {
    var map = [];
    for (var i = 1; i <= n; i++) map.push({ pdfPage: i });
    return map;
  }

  // ---- Sizing ------------------------------------------------------

  function getSizes(pdfPageAR) {
    if (pdfPageAR === undefined) pdfPageAR = storedPageAR;

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var availW = vw - MARGIN * 2;
    var availH = vh - MARGIN * 2;
    var bookAR = pdfPageAR * 2;
    var bw, bh;

    if (availW / availH > bookAR) {
      bh = Math.round(availH * MAX_FRACTION);
      bw = Math.round(bh * bookAR);
    } else {
      bw = Math.round(availW * MAX_FRACTION);
      bh = Math.round(bw / bookAR);
    }

    var pw = Math.round(bw / 2);
    var ph = Math.round(pw / pdfPageAR);
    bw = pw * 2;
    bh = ph;

    return { pw: pw, ph: ph, bw: bw, bh: bh };
  }

  // ---- DOM construction --------------------------------------------

  function buildDOMPages(pageMap, sizes) {
    book.innerHTML = '';
    var pw = sizes.pw, ph = sizes.ph;

    pageMap.forEach(function (slot, idx) {
      var div = document.createElement('div');
      div.className = 'page';
      div.dataset.slotIndex = idx;
      div.dataset.pdfPage   = slot.pdfPage;

      div.style.width  = pw + 'px';
      div.style.height = ph + 'px';

      var canvas = document.createElement('canvas');
      div.appendChild(canvas);
      book.appendChild(div);
    });
  }

  // ---- Staircase drawing -------------------------------------------

  /**
   * Draw solid dark-gray vertical lines with visible white gaps.
   * Canvas is rendered at actual strip height for pixel-accurate lines.
   * count = number of visible lines (capped at ceil(totalPages/2)).
   */
  function paintStaircase(canvas, count, stripH) {
    if (count <= 0 || stripH <= 0) {
      canvas.width = 0;
      canvas.height = 0;
      return 0;
    }

    var w = Math.ceil(count * LINE_STEP);
    var h = Math.round(stripH);

    canvas.width = w;
    canvas.height = h;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = LINE_COLOR;

    for (var i = 0; i < count; i++) {
      var x = i * LINE_STEP;
      ctx.fillRect(x, 0, LINE_WIDTH, h);
    }

    return w;
  }

  function clipPathRight(depthPx, stripH) {
    var pct = (depthPx / stripH * 100).toFixed(1);
    return 'polygon(0% 0%, 100% ' + pct + '%, 100% ' + (100 - parseFloat(pct)).toFixed(1) + '%, 0% 100%)';
  }

  function clipPathLeft(depthPx, stripH) {
    var pct = (depthPx / stripH * 100).toFixed(1);
    return 'polygon(0% ' + pct + '%, 100% 0%, 100% 100%, 0% ' + (100 - parseFloat(pct)).toFixed(1) + '%)';
  }

  function createStrips() {
    leftWrap = document.createElement('div');
    leftWrap.id = 'fb-strip-left';
    stripLeft = document.createElement('canvas');
    leftWrap.appendChild(stripLeft);
    book.appendChild(leftWrap);

    rightWrap = document.createElement('div');
    rightWrap.id = 'fb-strip-right';
    stripRight = document.createElement('canvas');
    rightWrap.appendChild(stripRight);
    book.appendChild(rightWrap);

    syncStrips(1);
  }

  function isStripVisible(wrap) {
    return wrap && wrap.style.display !== 'none';
  }

  /**
   * Convert physical page count on a side to visual line count.
   * Each line represents 2 physical pages — cap at ceil(totalPages/2).
   * e.g. 27 pages → 14 lines, 13 pages → 7 lines, 1 page → 1 line.
   */
  function linesFor(count) {
    if (count <= 0) return 0;
    return Math.min(Math.ceil(count / 2), maxStripLines);
  }

  function syncStrips(currentPage) {
    if (!stripLeft || !stripRight) return;

    if (currentPage === undefined) {
      try { currentPage = $(book).turn('page'); } catch (e) { currentPage = 1; }
    }

    var leftCount  = currentPage - 1;
    var rightCount = totalPages - currentPage;

    var leftLines  = linesFor(leftCount);
    var rightLines = linesFor(rightCount);

    console.log(
      '[staircase] page=' + currentPage +
      ' leftPages=' + leftCount + ' leftLines=' + leftLines +
      ' rightPages=' + rightCount + ' rightLines=' + rightLines
    );

    var rect   = book.getBoundingClientRect();
    var bw     = rect.width;
    var stripH = rect.height;
    var depth  = Math.min(ANGLE_DEPTH, stripH * 0.2);

    // ---- Left strip ----
    if (leftLines <= 0) {
      leftWrap.style.display = 'none';
    } else {
      var leftW = paintStaircase(stripLeft, leftLines, stripH);
      leftWrap.style.cssText =
        'position:absolute;' +
        'top:0;' +
        'right:' + bw + 'px;' +
        'width:' + leftW + 'px;' +
        'height:' + stripH + 'px;' +
        'pointer-events:none;' +
        'z-index:45;' +
        'clip-path:' + clipPathLeft(depth, stripH) + ';' +
        '-webkit-clip-path:' + clipPathLeft(depth, stripH) + ';';
      stripLeft.style.cssText = 'display:block;width:100%;height:100%;';
    }

    // ---- Right strip ----
    if (rightLines <= 0) {
      rightWrap.style.display = 'none';
    } else {
      var rightW = paintStaircase(stripRight, rightLines, stripH);
      rightWrap.style.cssText =
        'position:absolute;' +
        'top:0;' +
        'left:' + bw + 'px;' +
        'width:' + rightW + 'px;' +
        'height:' + stripH + 'px;' +
        'pointer-events:none;' +
        'z-index:45;' +
        'clip-path:' + clipPathRight(depth, stripH) + ';' +
        '-webkit-clip-path:' + clipPathRight(depth, stripH) + ';';
      stripRight.style.cssText = 'display:block;width:100%;height:100%;';
    }

    lastPage = currentPage;
  }

  function removeLeavingStrip(newPage) {
    var goingForward = (newPage > lastPage);

    if (goingForward && lastPage === 1) return;           // 1→2: keep right
    if (goingForward && newPage >= totalPages) {          // N-1→N: hide right
      if (isStripVisible(rightWrap)) rightWrap.style.display = 'none';
      return;
    }
    if (!goingForward && lastPage >= totalPages) return;  // N→N-1: keep left
    if (!goingForward && newPage === 1) {                 // 2→1: hide left
      if (isStripVisible(leftWrap)) leftWrap.style.display = 'none';
      return;
    }
    // Double↔double: keep both visible
  }

  function fbSpineSync(page) {
    if (!spine) return;
    if (page === 1 || page >= totalPages) {
      spine.classList.remove('visible');
      return;
    }
    var b = book.getBoundingClientRect();
    var s = shell.getBoundingClientRect();
    spine.style.left   = (b.left - s.left) + 'px';
    spine.style.top    = (b.top - s.top) + 'px';
    spine.style.width  = b.width + 'px';
    spine.style.height = b.height + 'px';
    spine.classList.add('visible');
  }

  // ---- PDF rendering -----------------------------------------------

  function renderPDFPage(pdfPageNum, canvas, targetW, targetH) {
    if (canvas.dataset.rendering === '1') return Promise.resolve();
    canvas.dataset.rendering = '1';

    return pdfDoc.getPage(pdfPageNum).then(function (page) {
      var vp0 = page.getViewport({ scale: 1 });
      var pageAR = vp0.width / vp0.height;

      var fitW, fitH;
      if (targetW / targetH > pageAR) {
        fitH = targetH;
        fitW = Math.round(targetH * pageAR);
      } else {
        fitW = targetW;
        fitH = Math.round(targetW / pageAR);
      }

      var scale = Math.min(fitW / vp0.width, fitH / vp0.height) * RENDER_SCALE;
      var vp = page.getViewport({ scale: scale });

      canvas.width  = vp.width;
      canvas.height = vp.height;
      canvas.style.width  = fitW + 'px';
      canvas.style.height = fitH + 'px';

      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      return page.render({ canvasContext: ctx, viewport: vp }).promise;
    }).then(function () {
      canvas.dataset.rendered  = '1';
      canvas.dataset.rendering = '0';
    }).catch(function (err) {
      canvas.dataset.rendering = '0';
      throw err;
    });
  }

  function renderWindow(turnPage, pageMap) {
    var start = Math.max(0, turnPage - 2);
    var end   = Math.min(pageMap.length - 1, turnPage + 2);

    var promises = [];
    for (var i = start; i <= end; i++) {
      var slot  = pageMap[i];
      var domEl = book.querySelector('[data-slot-index="' + i + '"]');
      if (!domEl) continue;
      var canvas = domEl.querySelector('canvas');
      if (!canvas || canvas.dataset.rendered === '1' || canvas.dataset.rendering === '1') continue;
      promises.push(renderPDFPage(slot.pdfPage, canvas, pageW, pageH));
    }
    return Promise.all(promises);
  }

  function scheduleRender(turnPage, pageMap) {
    renderWindow(turnPage, pageMap).catch(function (err) {
      console.error('Flipbook render error:', err);
    });
  }

  // ---- Turn.js init ------------------------------------------------

  function initTurn(pageMap) {
    var numPages = pageMap.length;

    $(book).turn({
      width:        bookW,
      height:       bookH,
      display:      'double',
      autoCenter:   true,
      acceleration: true,
      gradients:    true,
      elevation:    50,
      duration:     (numPages > 30) ? 600 : 1000,
      pages:        numPages,
      when: {
        turning: function (e, page) {
          scheduleRender(page - 1, pageMap);
          var slot = pageMap[page - 1];
          if (slot) history.replaceState(null, '', '#page=' + slot.pdfPage);
          removeLeavingStrip(page);
        },
        turned: function (e, page) {
          var slotIdx = page - 1;
          var domEl = book.querySelector('[data-slot-index="' + slotIdx + '"]');
          if (!domEl) return;
          var canvas = domEl.querySelector('canvas');
          if (canvas && canvas.dataset.rendered !== '1') {
            var slot = pageMap[slotIdx];
            if (slot) renderPDFPage(slot.pdfPage, canvas, pageW, pageH);
          }
          syncStrips(page);
          fbSpineSync(page);
        }
      }
    });

    setTimeout(function () {
      createStrips();
      fbSpineSync(1);
    }, 150);

    scheduleRender(0, pageMap);
    bookInited = true;
  }

  // ---- Keyboard ----------------------------------------------------

  document.addEventListener('keydown', function (e) {
    if (!bookInited) return;
    if (e.key === 'ArrowLeft')  $(book).turn('previous');
    if (e.key === 'ArrowRight') $(book).turn('next');
  });

  // ---- Resize ------------------------------------------------------

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!bookInited || !pageMapGlobal) return;
      var cur = $(book).turn('page');

      var newSizes = getSizes(storedPageAR);
      pageW = newSizes.pw; pageH = newSizes.ph;
      bookW = newSizes.bw; bookH = newSizes.bh;

      $(book).turn('size', bookW, bookH);

      pageMapGlobal.forEach(function (slot, i) {
        var p = book.querySelector('[data-slot-index="' + i + '"]');
        if (!p) return;
        p.style.width  = pageW + 'px';
        p.style.height = pageH + 'px';
        var c = p.querySelector('canvas');
        if (c) {
          delete c.dataset.rendered;
          delete c.dataset.rendering;
        }
      });

      setTimeout(function () {
        syncStrips(cur);
        fbSpineSync(cur);
      }, 150);

      scheduleRender(cur - 1, pageMapGlobal);
    }, 250);
  });

  // ---- Bootstrap ---------------------------------------------------

  function init() {
    if (typeof $ === 'undefined' || typeof $.fn.turn === 'undefined') {
      loader.innerHTML =
        '<p style="color:#a33;text-align:center;padding:2rem">Missing jQuery or Turn.js.</p>';
      return;
    }

    pdfjsLib.getDocument(pdfUrl).promise.then(function (doc) {
      pdfDoc     = doc;
      totalPages = doc.numPages;

      // Cap: max visual lines = ceil(totalPages / 2)
      // e.g. 52 pages → 26 lines, 27 pages → 14 lines
      maxStripLines = Math.ceil(totalPages / 2);

      var arProbe = totalPages >= 2 ? 2 : 1;
      return pdfDoc.getPage(arProbe).then(function (page) {
        var vp = page.getViewport({ scale: 1 });
        var pageAR = vp.width / vp.height;
        storedPageAR = pageAR;

        var sizes = getSizes(pageAR);
        pageW = sizes.pw; pageH = sizes.ph;
        bookW = sizes.bw; bookH = sizes.bh;

        var pageMap = buildPageMap(totalPages);
        pageMapGlobal = pageMap;

        buildDOMPages(pageMap, sizes);
        initTurn(pageMap);

        setTimeout(function () { loader.classList.add('out'); }, 400);
      });
    }).catch(function (err) {
      console.error('Flipbook:', err);
      loader.innerHTML =
        '<p style="color:#a33;text-align:center;padding:2rem">Failed to load PDF.<br>' +
        '<small>' + err.message + '</small></p>';
    });
  }

  init();
})();
