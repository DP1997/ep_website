/**
 * flipbook-init.js
 * Turn.js flipbook orchestrator.
 *
 * Creates window.Flipbook namespace with shared state, then loads
 * sibling modules (staircase, spine, render) that attach to it.
 */
(function () {
  'use strict';

  var pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  // ---- Config ------------------------------------------------------
  var RENDER_SCALE = 2;
  var MARGIN       = 40;
  var MAX_FRACTION = 0.88;

  var LINE_STEP   = 2.0;
  var LINE_WIDTH  = 0.5;
  var LINE_COLOR  = '#444';
  var ANGLE_DEPTH = 14;

  // ---- DOM refs ----------------------------------------------------
  var shell  = document.querySelector('.flipbook-shell');
  var loader = document.getElementById('fb-loader');
  var book   = document.getElementById('fb-book');
  var spine  = document.getElementById('fb-spine');
  var pdfUrl = shell.dataset.pdfUrl;

  // ---- State (mutable, shared with modules) ------------------------
  var stripLeft   = null;
  var stripRight  = null;
  var leftWrap    = null;
  var rightWrap   = null;
  var lastPage    = 1;

  var pdfDoc        = null;
  var totalPages    = 0;
  var maxStripLines = 0;
  var bookInited    = false;
  var pageMapGlobal = null;

  var pageW = 0, pageH = 0, bookW = 0, bookH = 0;
  var storedPageAR = 0.707;
  var spineRafId   = null;

  // ---- Namespace ---------------------------------------------------
  window.Flipbook = {
    pdfjsLib:      pdfjsLib,
    RENDER_SCALE:  RENDER_SCALE,
    MARGIN:        MARGIN,
    MAX_FRACTION:  MAX_FRACTION,
    LINE_STEP:     LINE_STEP,
    LINE_WIDTH:    LINE_WIDTH,
    LINE_COLOR:    LINE_COLOR,
    ANGLE_DEPTH:   ANGLE_DEPTH,

    shell:         shell,
    loader:        loader,
    book:          book,
    spine:         spine,
    pdfUrl:        pdfUrl,

    stripLeft:     stripLeft,
    stripRight:    stripRight,
    leftWrap:      leftWrap,
    rightWrap:     rightWrap,
    lastPage:      lastPage,

    pdfDoc:        pdfDoc,
    totalPages:    totalPages,
    maxStripLines: maxStripLines,
    bookInited:    bookInited,
    pageMapGlobal: pageMapGlobal,

    pageW: pageW, pageH: pageH,
    bookW: bookW, bookH: bookH,
    storedPageAR:  storedPageAR
  };

  // ---- Page map ----------------------------------------------------

  function buildPageMap(n) {
    var map = [];
    for (var i = 1; i <= n; i++) map.push({ pdfPage: i });
    return map;
  }

  // ---- Sizing ------------------------------------------------------

  function getSizes(pdfPageAR) {
    if (pdfPageAR === undefined) pdfPageAR = window.Flipbook.storedPageAR;

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

  // ---- Turn.js init ------------------------------------------------

  function initTurn(pageMap) {
    var FB = window.Flipbook;
    var numPages = pageMap.length;

    $(FB.book).turn({
      width:        FB.bookW,
      height:       FB.bookH,
      display:      'double',
      autoCenter:   true,
      acceleration: true,
      gradients:    true,
      elevation:    50,
      duration:     3500,
      pages:        numPages,
      when: {
        turning: function (e, page) {
          FB.scheduleRender(page - 1, pageMap);
          var slot = pageMap[page - 1];
          if (slot) history.replaceState(null, '', '#page=' + slot.pdfPage);
          FB.removeLeavingStrip(page);
          FB.startSpineAnimation();
        },
        turned: function (e, page) {
          var slotIdx = page - 1;
          var domEl = FB.book.querySelector('[data-slot-index="' + slotIdx + '"]');
          if (!domEl) return;
          var canvas = domEl.querySelector('canvas');
          if (canvas && canvas.dataset.rendered !== '1') {
            var slot = pageMap[slotIdx];
            if (slot) FB.renderPDFPage(slot.pdfPage, canvas, FB.pageW, FB.pageH);
          }
          FB.syncStrips(page);
          FB.fbSpineSync(page);
          // Spine visibility managed by timer in flipbook-spine.js
        }
      }
    });

    setTimeout(function () {
      FB.createStrips();
      FB.fbSpineSync(1);
      // Spine starts visible (cover page), RAF loop takes over during flips
    }, 150);

    FB.scheduleRender(0, pageMap);
    FB.bookInited = true;

    // Expose method to update Turn.js duration dynamically
    FB.setTurnDuration = function(ms) {
      var data = $(FB.book).data();
      if (data && data.opts) data.opts.duration = ms;
    };
    FB.setTurnDuration(3500);
  }

  // ---- Keyboard ----------------------------------------------------

  document.addEventListener('keydown', function (e) {
    var FB = window.Flipbook;
    if (!FB.bookInited) return;
    if (e.key === 'ArrowLeft')  $(FB.book).turn('previous');
    if (e.key === 'ArrowRight') $(FB.book).turn('next');
    // Debug: press 1,2,3 to change flip speed
    if (e.key === '1' && FB.setTurnDuration) { FB.setTurnDuration(1000); console.log('duration=1000'); }
    if (e.key === '2' && FB.setTurnDuration) { FB.setTurnDuration(2000); console.log('duration=2000'); }
    if (e.key === '3' && FB.setTurnDuration) { FB.setTurnDuration(3500); console.log('duration=3500'); }
  });

  // ---- Resize ------------------------------------------------------

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var FB = window.Flipbook;
      if (!FB.bookInited || !FB.pageMapGlobal) return;
      var cur = $(FB.book).turn('page');

      var newSizes = getSizes(FB.storedPageAR);
      FB.pageW = newSizes.pw; FB.pageH = newSizes.ph;
      FB.bookW = newSizes.bw; FB.bookH = newSizes.bh;

      $(FB.book).turn('size', FB.bookW, FB.bookH);

      FB.pageMapGlobal.forEach(function (slot, i) {
        var p = FB.book.querySelector('[data-slot-index="' + i + '"]');
        if (!p) return;
        p.style.width  = FB.pageW + 'px';
        p.style.height = FB.pageH + 'px';
        var c = p.querySelector('canvas');
        if (c) {
          delete c.dataset.rendered;
          delete c.dataset.rendering;
        }
      });

      setTimeout(function () {
        FB.syncStrips(cur);
        FB.fbSpineSync(cur);
        // Spine opacity managed by RAF loop
      }, 150);

      FB.scheduleRender(cur - 1, FB.pageMapGlobal);
    }, 250);
  });

  // ---- Bootstrap ---------------------------------------------------

  function init() {
    var FB = window.Flipbook;
    if (typeof $ === 'undefined' || typeof $.fn.turn === 'undefined') {
      FB.loader.innerHTML =
        '<p style="color:#a33;text-align:center;padding:2rem">Missing jQuery or Turn.js.</p>';
      return;
    }

    FB.pdfjsLib.getDocument(FB.pdfUrl).promise.then(function (doc) {
      FB.pdfDoc     = doc;
      FB.totalPages = doc.numPages;
      FB.maxStripLines = Math.ceil(FB.totalPages / 2);

      var arProbe = FB.totalPages >= 2 ? 2 : 1;
      return FB.pdfDoc.getPage(arProbe).then(function (page) {
        var vp = page.getViewport({ scale: 1 });
        FB.storedPageAR = vp.width / vp.height;

        var sizes = getSizes(FB.storedPageAR);
        FB.pageW = sizes.pw; FB.pageH = sizes.ph;
        FB.bookW = sizes.bw; FB.bookH = sizes.bh;

        var pageMap = buildPageMap(FB.totalPages);
        FB.pageMapGlobal = pageMap;

        buildDOMPages(pageMap, sizes);
        initTurn(pageMap);

        setTimeout(function () { FB.loader.classList.add('out'); }, 400);
      });
    }).catch(function (err) {
      console.error('Flipbook:', err);
      FB.loader.innerHTML =
        '<p style="color:#a33;text-align:center;padding:2rem">Failed to load PDF.<br>' +
        '<small>' + err.message + '</small></p>';
    });
  }

  init();
})();