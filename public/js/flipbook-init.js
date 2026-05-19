/**
 * flipbook-init.js
 *
 * Turn.js flipbook using PDF.js.
 * All .page divs have identical dimensions (Turn.js requirement).
 * Each PDF page is rendered at its native aspect ratio, letterboxed
 * inside its .page div — no stretching.
 *
 * Spine shadow: uses a sibling overlay (#fb-spine) positioned and
 * sized to match #fb-book exactly.
 */

(function () {
  'use strict';

  var pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  var RENDER_SCALE = 2;
  var MARGIN = 40;
  var MAX_FRACTION = 0.88;

  var shell  = document.querySelector('.flipbook-shell');
  var loader = document.getElementById('fb-loader');
  var book   = document.getElementById('fb-book');
  var spine  = document.getElementById('fb-spine');
  var pdfUrl = shell.dataset.pdfUrl;

  var pdfDoc        = null;
  var totalPages    = 0;
  var bookInited    = false;
  var pageMapGlobal = null;

  var pageW, pageH, bookW, bookH;
  var storedPageAR = 0.707;

  var renderPending  = false;
  var queuedTurnPage = null;

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

  /**
   * Inject inner/outer depth gradients on every page.
   */
  function addGradients() {
    book.querySelectorAll('.page').forEach(function (p) {
      if (!p.querySelector('.inner-gradient')) {
        var ig = document.createElement('div');
        ig.className = 'inner-gradient';
        p.appendChild(ig);
        var og = document.createElement('div');
        og.className = 'outer-gradient';
        p.appendChild(og);
      }
    });
  }

  /**
   * Sync #fb-spine overlay to match #fb-book's position and size.
   */
  function fbSpineSync() {
    if (!spine) return;
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

      return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
        canvas.dataset.rendered = '1';
      });
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
      if (!canvas || canvas.dataset.rendered) continue;

      promises.push(renderPDFPage(slot.pdfPage, canvas, pageW, pageH));
    }
    return Promise.all(promises);
  }

  function scheduleRender(turnPage, pageMap) {
    if (renderPending) {
      queuedTurnPage = turnPage;
      return;
    }
    renderPending = true;
    renderWindow(turnPage, pageMap).then(function () {
      renderPending = false;
      if (queuedTurnPage !== null) {
        var q = queuedTurnPage;
        queuedTurnPage = null;
        scheduleRender(q, pageMap);
      }
    }).catch(function (err) {
      console.error('Flipbook render error:', err);
      renderPending = false;
      queuedTurnPage = null;
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
        },
        turned: function (e, page) {
          var slotIdx = page - 1;
          var domEl = book.querySelector('[data-slot-index="' + slotIdx + '"]');
          if (!domEl) return;
          var canvas = domEl.querySelector('canvas');
          if (canvas && !canvas.dataset.rendered) {
            var slot = pageMap[slotIdx];
            if (slot) renderPDFPage(slot.pdfPage, canvas, pageW, pageH);
          }
        }
      }
    });

    // Delay so Turn.js has time to create .turn-page-wrapper elements
    setTimeout(function () {
      addGradients();
      fbSpineSync();
    }, 50);

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
        if (c) delete c.dataset.rendered;
      });

      // Turn.js rebuilds wrappers on resize — re-apply after delay
      setTimeout(function () {
        addGradients();
        fbSpineSync();
      }, 100);

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
