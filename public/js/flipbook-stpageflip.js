(function () {
  'use strict';

  var RENDER_SCALE = 2;
  var MARGIN       = 40;
  var MAX_FRACTION = 0.88;

  var shell  = document.querySelector('.flipbook-shell');
  var loader = document.getElementById('fb-loader');
  var book   = document.getElementById('fb-book');
  var pdfUrl = shell && shell.dataset.pdfUrl;

  if (!shell || !book || !pdfUrl) {
    console.error('Flipbook: missing shell, book container, or pdfUrl');
    return;
  }

  var pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    loader.innerHTML = '<p style="color:#a33;text-align:center;padding:2rem">PDF.js not loaded.</p>';
    return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  var pdfDoc      = null;
  var totalPages  = 0;
  var pageAR      = 0.707;
  var pageW       = 0;
  var pageH       = 0;
  var flip        = null;
  var pageEls     = [];

  function getSizes(ar) {
    var vw = window.innerWidth  - MARGIN * 2;
    var vh = window.innerHeight - MARGIN * 2;
    var bookAR = ar * 2;
    var bw, bh;
    if (vw / vh > bookAR) {
      bh = Math.round(vh * MAX_FRACTION);
      bw = Math.round(bh * bookAR);
    } else {
      bw = Math.round(vw * MAX_FRACTION);
      bh = Math.round(bw / bookAR);
    }
    var pw = Math.round(bw / 2);
    var ph = Math.round(pw / ar);
    bw = pw * 2;
    bh = ph;
    return { pw: pw, ph: ph, bw: bw, bh: bh };
  }

  function renderPage(pdfPageNum, canvas, targetW, targetH) {
    if (canvas.dataset.rendered === '1') return Promise.resolve();
    if (canvas.dataset.rendering === '1') return Promise.resolve();
    canvas.dataset.rendering = '1';

    return pdfDoc.getPage(pdfPageNum).then(function (page) {
      var vp0 = page.getViewport({ scale: 1 });
      var ar  = vp0.width / vp0.height;
      var fitW, fitH;
      if (targetW / targetH > ar) {
        fitH = targetH;
        fitW = Math.round(targetH * ar);
      } else {
        fitW = targetW;
        fitH = Math.round(targetW / ar);
      }
      var scale = Math.min(fitW / vp0.width, fitH / vp0.height) * RENDER_SCALE;
      var vp    = page.getViewport({ scale: scale });
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

  function buildPages(count, pw, ph) {
    pageEls = [];
    book.innerHTML = '';
    for (var i = 1; i <= count; i++) {
      var wrap = document.createElement('div');
      wrap.style.width  = pw + 'px';
      wrap.style.height = ph + 'px';
      wrap.style.background = '#fff';
      var cvs = document.createElement('canvas');
      cvs.dataset.pdfPage = String(i);
      cvs.dataset.rendered = '0';
      cvs.dataset.rendering = '0';
      wrap.appendChild(cvs);
      book.appendChild(wrap);
      pageEls.push({ el: wrap, canvas: cvs, pdfPage: i });
    }
  }

  function renderWindow(spreadIndex) {
    var spread = flip.getPageCollection().getSpread()[spreadIndex];
    if (!spread) return Promise.resolve();
    var promises = [];
    for (var s = Math.max(0, spreadIndex - 1);
         s <= Math.min(pageEls.length - 1, spreadIndex + 1);
         s++) {
      var pages = flip.getPageCollection().getSpread()[s];
      if (!pages) continue;
      for (var pIdx = 0; pIdx < pages.length; pIdx++) {
        var pageNum = pages[pIdx];
        var item = pageEls[pageNum];
        if (!item) continue;
        promises.push(renderPage(item.pdfPage, item.canvas, pageW, pageH));
      }
    }
    return Promise.all(promises);
  }

  function initFlip(sizes) {
    var pw = sizes.pw, ph = sizes.ph;
    pageW = pw; pageH = ph;

    var St = window.St;
    if (!St || !St.PageFlip) {
      loader.innerHTML = '<p style="color:#a33;text-align:center;padding:2rem">StPageFlip not loaded.</p>';
      return;
    }

    flip = new St.PageFlip(book, {
      width:       pw,
      height:      ph,
      size:        'fixed',
      minWidth:    pw,
      maxWidth:    pw * 2,
      minHeight:   ph,
      maxHeight:   ph,
      showCover:   true,
      drawShadow:  true,
      flippingTime: 800,
      startZIndex: 0,
      autoSize:    true,
      usePortrait: false,
      swipeDistance: 30,
      useMouseEvents: true,
      mobileScrollSupport: true,
      clickEventForward: false,
      showPageCorners: true,
      disableFlipByClick: false,
    });

    var elements = pageEls.map(function (p) { return p.el; });
    flip.loadFromHTML(elements);

    flip.on('flip', function (e) {
      var page = e.data;
      history.replaceState(null, '', '#page=' + (page + 1));
      var spreadIdx = flip.getPageCollection().getCurrentSpreadIndex();
      renderWindow(spreadIdx).catch(function (err) {
        console.error('Flipbook render error:', err);
      });
    });

    var spine = document.getElementById('fb-spine');

    function syncSpine() {
      if (!spine || !flip) return;
      var rect = flip.getBoundsRect();
      spine.style.left  = (rect.left + rect.width / 2) + 'px';
      spine.style.top   = rect.top + 'px';
      spine.style.height = rect.height + 'px';
    }

    // Physical spine hiding: fade opacity based on flip progress.
    // Only hide spine during actual 'flipping' animation, NOT during 'fold_corner' preview.
    var lastSpineLog = '';
    function updateSpineVisibility() {
      if (!spine || !flip) return;
      var ctrl = flip.flipController;
      var hasCtrl = !!ctrl;
      var state = hasCtrl && ctrl.getState ? ctrl.getState() : 'no-ctrl';
      var calc = hasCtrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
      var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;

      var log = 'state=' + state + ' hasCalc=' + !!calc + ' progress=' + progress.toFixed(2) + ' opacity=' + (spine.style.opacity || 'unset');
      if (log !== lastSpineLog) {
        lastSpineLog = log;
      }

      // Always show spine when idle or corner-tugging preview
      if (state === 'read' || state === 'fold_corner') {
        spine.style.opacity = '1';
        return;
      }
      if (!calc) {
        spine.style.opacity = '0';
        return;
      }

      // Fade spine during user drag ('user_fold') or auto-animation ('flipping')
      // when the turning page crosses the book center (~50%).
      // Fade-out: 45-50% (page approaching spine),
      // Stay hidden: 50-90% (page is over the other side, spine should not show),
      // Fade-in:  90-95% (page nearly settled, spine reappears).
      var opacity = 1;
      if (progress < 45) {
        opacity = 1;
      } else if (progress < 50) {
        opacity = 1 - ((progress - 45) / 5);  // fade out 1 → 0
      } else if (progress < 90) {
        opacity = 0;                           // hidden while page is on other side
      } else if (progress < 95) {
        opacity = (progress - 90) / 5;         // fade in 0 → 1
      } else {
        opacity = 1;
      }
      spine.style.opacity = String(Math.max(0, Math.min(1, opacity)));
    }

    // Position spine shadow to match book bounds using public API
    flip.on('init', function () {
      syncSpine();
      renderWindow(0).then(function () {
        loader.classList.add('out');
      });
    });

    // Fallback: ensure spine shows when idle
    flip.on('changeState', function (e) {
      var state = e.data;
      if (state === 'read') {
        if (spine) spine.style.opacity = '1';
        syncSpine();
      }
    });

    // Poll during flips for finer control than changeState events
    (function pollSpine() {
      updateSpineVisibility();
      requestAnimationFrame(pollSpine);
    })();

    document.addEventListener('keydown', function (e) {
      if (!flip) return;
      if (e.key === 'ArrowLeft')  flip.flipPrev('bottom');
      if (e.key === 'ArrowRight') flip.flipNext('bottom');
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!flip) return;
        var newSizes = getSizes(pageAR);
        pageW = newSizes.pw; pageH = newSizes.ph;

        flip.destroy();

        book = document.createElement('div');
        book.id = 'fb-book';
        shell.appendChild(book);

        buildPages(totalPages, pageW, pageH);

        flip = new St.PageFlip(book, {
          width:       pageW,
          height:      pageH,
          size:        'fixed',
          minWidth:    pageW,
          maxWidth:    pageW * 2,
          minHeight:   pageH,
          maxHeight:   pageH,
          showCover:   true,
          drawShadow:  true,
          flippingTime: 800,
          startZIndex: 0,
          autoSize:    true,
          usePortrait: false,
          swipeDistance: 30,
          useMouseEvents: true,
          mobileScrollSupport: true,
          clickEventForward: false,
          showPageCorners: true,
          disableFlipByClick: false,
        });

        var newEls = pageEls.map(function (p) { return p.el; });
        flip.loadFromHTML(newEls);

        flip.on('flip', function (e) {
          var page = e.data;
          history.replaceState(null, '', '#page=' + (page + 1));
          var spreadIdx = flip.getPageCollection().getCurrentSpreadIndex();
          renderWindow(spreadIdx).catch(console.error);
        });

        var spine = document.getElementById('fb-spine');

        function syncSpine() {
          if (!spine || !flip) return;
          var rect = flip.getBoundsRect();
          spine.style.left  = (rect.left + rect.width / 2) + 'px';
          spine.style.top   = rect.top + 'px';
          spine.style.height = rect.height + 'px';
        }

        function updateSpineVisibility() {
          if (!spine || !flip) return;
          var ctrl = flip.flipController;
          var hasCtrl = !!ctrl;
          var state = hasCtrl && ctrl.getState ? ctrl.getState() : 'no-ctrl';
          var calc = hasCtrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
          var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;

          // Always show spine when idle or corner-tugging preview
          if (state === 'read' || state === 'fold_corner') {
            spine.style.opacity = '1';
            return;
          }
          if (!calc) {
            spine.style.opacity = '0';
            return;
          }

          // Fade spine during user drag ('user_fold') or auto-animation ('flipping')
          // when the turning page crosses the book center (~50%).
          // Fade-out: 45-50% (page approaching spine),
          // Stay hidden: 50-90% (page is over the other side, spine should not show),
          // Fade-in:  90-95% (page nearly settled, spine reappears).
          var opacity = 1;
          if (progress < 45) {
            opacity = 1;
          } else if (progress < 50) {
            opacity = 1 - ((progress - 45) / 5);  // fade out 1 → 0
          } else if (progress < 90) {
            opacity = 0;                           // hidden while page is on other side
          } else if (progress < 95) {
            opacity = (progress - 90) / 5;         // fade in 0 → 1
          } else {
            opacity = 1;
          }
          spine.style.opacity = String(Math.max(0, Math.min(1, opacity)));
        }

        flip.on('init', function () {
          syncSpine();
          var spreadIdx = flip.getPageCollection().getCurrentSpreadIndex();
          renderWindow(spreadIdx).then(function () {
            loader.classList.add('out');
          });
        });

        flip.on('changeState', function (e) {
          var state = e.data;
          if (state === 'read') {
            if (spine) spine.style.opacity = '1';
            syncSpine();
          }
        });

        (function pollSpine() {
          updateSpineVisibility();
          requestAnimationFrame(pollSpine);
        })();
      }, 300);
    });
  }

  pdfjsLib.getDocument(pdfUrl).promise.then(function (doc) {
    pdfDoc     = doc;
    totalPages = doc.numPages;
    var probePage = totalPages >= 2 ? 2 : 1;
    return pdfDoc.getPage(probePage).then(function (page) {
      var vp = page.getViewport({ scale: 1 });
      pageAR = vp.width / vp.height;
      var sizes = getSizes(pageAR);
      buildPages(totalPages, sizes.pw, sizes.ph);
      initFlip(sizes);
    });
  }).catch(function (err) {
    console.error('Flipbook:', err);
    loader.innerHTML = '<p style="color:#a33;text-align:center;padding:2rem">Failed to load PDF.<br><small>' + (err.message || err) + '</small></p>';
  });
})();
