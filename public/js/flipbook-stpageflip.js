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
  var currentPageNum = 1; // 1-based page number for spine visibility logic
  var pageEls     = [];

  function getSizes(ar) {
    var shellRect = shell ? shell.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    var vw = shellRect.width  - MARGIN * 2;
    var vh = shellRect.height - MARGIN * 2;
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

    // Keep front and back covers hard (rigid) — soft covers cause duplicate
    // page ghost previews at edges because StPageFlip reuses the same page as
    // the temporary copy for the bending deformation
    var pages = flip.getPageCollection().getPages();
    if (pages.length > 0) pages[0].setDensity('hard');
    if (pages.length > 1) pages[pages.length - 1].setDensity('hard');

    flip.on('flip', function (e) {
      var page = e.data;
      currentPageNum = page + 1;
      history.replaceState(null, '', '#page=' + currentPageNum);
      syncStrips(currentPageNum);
      syncSpine();
      var spreadIdx = flip.getPageCollection().getCurrentSpreadIndex();
      renderWindow(spreadIdx).catch(function (err) {
        console.error('Flipbook render error:', err);
      });
      // Re-sync after animation settles (flippingTime=800ms) to fix
      // temporary offset glitches during hardcover transitions.
      setTimeout(function() {
        syncStrips(currentPageNum);
        syncSpine();
      }, 850);
    });

    var spine = document.getElementById('fb-spine');

    // ---- Staircase strip elements (from commit 4d500ff) ----
    var stripLeft  = document.getElementById('fb-strip-left');
    var stripRight = document.getElementById('fb-strip-right');
    var canvasLeft = stripLeft ? stripLeft.querySelector('canvas') : null;
    var canvasRight = stripRight ? stripRight.querySelector('canvas') : null;

    // Fore-edge staircase config
    var LINE_STEP   = 2.0;   // px per line (line + gap)
    var LINE_WIDTH  = 0.5;   // thin dark line
    var LINE_COLOR  = '#444'; // dark gray
    var ANGLE_DEPTH = 14;    // px for clip-path angle

    function paintStaircase(canvas, count, stripH, dir) {
      if (count <= 0 || stripH <= 0) {
        canvas.width = 0; canvas.height = 0; return 0;
      }
      // dir: -1 = shadow extends leftward (left strip), +1 = rightward (right strip)
      var maxShadow = Math.min(14, count * 0.8); // shorter, gentler scaling
      var shadowW = Math.ceil(maxShadow);
      var lineW = Math.ceil(count * LINE_STEP);
      var totalW = lineW + shadowW;
      var h = Math.round(stripH);
      canvas.width = totalW; canvas.height = h;
      canvas.style.width = totalW + 'px'; canvas.style.height = h + 'px';
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, totalW, h);

      var xOffset = dir === -1 ? shadowW : 0;
      var GAP = 1.0; // px gap between line and shadow start

      for (var i = 0; i < count; i++) {
        var x = xOffset + i * LINE_STEP;
        var depth = (i + 1) / count;
        var sLen = depth * maxShadow;
        if (sLen > GAP + 0.5) {
          // Gradient start is GAP px away from line for softer transition
          var grad = ctx.createLinearGradient(
            dir === -1 ? x - GAP : x + LINE_WIDTH + GAP,
            0,
            dir === -1 ? x - sLen : x + LINE_WIDTH + sLen,
            0
          );
          var so = 0.04 + 0.05 * depth; // very soft: base 0.04, max 0.09
          grad.addColorStop(0, 'rgba(0,0,0,' + so + ')');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          if (dir === -1) {
            ctx.fillRect(x - sLen, 0, sLen - GAP, h);
          } else {
            ctx.fillRect(x + LINE_WIDTH + GAP, 0, sLen - GAP, h);
          }
        }
        ctx.fillStyle = LINE_COLOR;
        ctx.fillRect(x, 0, LINE_WIDTH, h);
      }
      return totalW;
    }


    // Get the bounding rect of the currently visible original page (not temporary copies)
    // This accounts for StPageFlip's internal centering offsets.
    function getVisibleBookRect() {
      // Use FB.flip page collection if available to avoid temporary copies
      if (FB && FB.flip && FB.flip.getPageCollection) {
        var pages = FB.flip.getPageCollection().getPages();
        for (var i = 0; i < pages.length; i++) {
          var el = pages[i].getElement ? pages[i].getElement() : null;
          if (!el) continue;
          var r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            return r;
          }
        }
      }
      // Fallback: query DOM but skip elements that are temporary copies
      // Temporary copies are appended siblings; originals are in the page collection
      var items = book.querySelectorAll('.stf__item');
      for (var j = 0; j < items.length; j++) {
        var r2 = items[j].getBoundingClientRect();
        if (r2.width > 0 && r2.height > 0) {
          return r2;
        }
      }
      // Last resort: use wrapper
      var wrap = book.querySelector('.stf__wrapper');
      if (wrap) return wrap.getBoundingClientRect();
      return book.getBoundingClientRect();
    }
    function clipPathRight(depthPx, stripH) {
      var pct = (depthPx / stripH * 100).toFixed(1);
      return 'polygon(0% 0%, 100% ' + pct + '%, 100% ' + (100 - parseFloat(pct)).toFixed(1) + '%, 0% 100%)';
    }

    function clipPathLeft(depthPx, stripH) {
      var pct = (depthPx / stripH * 100).toFixed(1);
      return 'polygon(0% ' + pct + '%, 100% 0%, 100% 100%, 0% ' + (100 - parseFloat(pct)).toFixed(1) + '%)';
    }

    function linesFor(count) {
      if (count <= 0) return 0;
      return Math.max(0, Math.floor(count / 2 - 1));
    }

    function syncStrips(currentPage) {
      if (!stripLeft || !stripRight || !canvasLeft || !canvasRight || !flip || !shell) return;
      if (currentPage === undefined) currentPage = flip.getPage() + 1;

      var leftCount  = currentPage - 1;
      var rightCount = totalPages - currentPage;
      var leftLines  = linesFor(leftCount);
      var rightLines = linesFor(rightCount);

      var rect   = flip.getBoundsRect();
      var shellRect = shell.getBoundingClientRect();
      var visRect = getVisibleBookRect();
      var stripH = rect.height;  // actual page height, not container height
      var depth  = Math.min(ANGLE_DEPTH, stripH * 0.2);
      var bookTop  = visRect.top  - shellRect.top;

      // Find leftmost and rightmost visible page edges
      var items = book.querySelectorAll('.stf__item');
      var minX = Infinity, maxX = -Infinity;
      for (var i = 0; i < items.length; i++) {
        var r = items[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          minX = Math.min(minX, r.left);
          maxX = Math.max(maxX, r.right);
        }
      }
      var bookLeftEdge  = (minX === Infinity ? visRect.left : minX) - shellRect.left;
      var bookRightEdge = (maxX === -Infinity ? visRect.right : maxX) - shellRect.left;

      // Left strip
      if (leftLines <= 0) {
        stripLeft.style.display = 'none';
      } else {
        var leftW = paintStaircase(canvasLeft, leftLines, stripH, -1);
        stripLeft.style.cssText =
          'position:absolute;' +
          'top:' + bookTop + 'px;' +
          'left:' + (bookLeftEdge - leftW) + 'px;' + /* outside left edge */
          'width:' + leftW + 'px;' +
          'height:' + stripH + 'px;' +
          'pointer-events:none;' +
          'z-index:45;' +
          'clip-path:' + clipPathLeft(depth, stripH) + ';' +
          '-webkit-clip-path:' + clipPathLeft(depth, stripH) + ';';
        canvasLeft.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
      }

      // Right strip
      if (rightLines <= 0) {
        stripRight.style.display = 'none';
      } else {
        var rightW = paintStaircase(canvasRight, rightLines, stripH, 1);
        stripRight.style.cssText =
          'position:absolute;' +
          'top:' + bookTop + 'px;' +
          'left:' + bookRightEdge + 'px;' + /* outside right edge */
          'width:' + rightW + 'px;' +
          'height:' + stripH + 'px;' +
          'pointer-events:none;' +
          'z-index:45;' +
          'clip-path:' + clipPathRight(depth, stripH) + ';' +
          '-webkit-clip-path:' + clipPathRight(depth, stripH) + ';';
        canvasRight.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
      }
    }

    function syncSpine() {
      if (!spine || !flip || !shell) return;
      var rect = flip.getBoundsRect();
      var shellRect = shell.getBoundingClientRect();
      var visRect = getVisibleBookRect();
      var wrap = book.querySelector('.stf__wrapper');
      var wrapRect = wrap ? wrap.getBoundingClientRect() : visRect;
      var gutterX = (wrapRect.left - shellRect.left) + rect.width / 2;
      var spineTop = visRect.top - shellRect.top;
      console.log('[SPINE-DEBUG] visRect:', {y: visRect.y, h: visRect.height}, 'wrapRect:', {y: wrapRect.y, h: wrapRect.height}, 'spineTop:', spineTop, 'gutterX:', gutterX);
      spine.style.left  = (gutterX - 60) + 'px';
      spine.style.top   = spineTop + 'px';
      spine.style.height = rect.height + 'px';
    }

    function getSpineOpacity(state, progress, pageNum) {
      // Hide spine when book is closed (front or back cover)
      if (pageNum === 1 || pageNum === totalPages) return 0;
      if (state === 'read' || state === 'fold_corner') return 1;
      if (progress < 0) return 0;
      if (progress < 45) return 1;
      if (progress < 50) return 1 - ((progress - 45) / 5);
      if (progress < 90) return 0;
      if (progress < 95) return (progress - 90) / 5;
      return 1;
    }

    function updateShadowVisibility() {
      if (!flip) return;
      var ctrl = flip.flipController;
      var hasCtrl = !!ctrl;
      var state = hasCtrl && ctrl.getState ? ctrl.getState() : 'no-ctrl';
      var calc = hasCtrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
      var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;
      var opacity = getSpineOpacity(state, progress, currentPageNum);
      if (spine) spine.style.opacity = String(opacity);

      // During flips, interpolate strip counts so the page being flipped
      // immediately reduces its stack-side line count (prevents lingering
      // single stripe at edges when flipping last/first pages)
      if ((state === 'flipping' || state === 'user_fold') && calc && calc.getDirection) {
        var dir = calc.getDirection();
        // Accelerate virtual transition so line count reaches zero early
        // in the animation (avoids ghost stripe lingering until the end)
        var factor = Math.min(1, progress / 30);
        var virtualPage = currentPageNum + (dir === 0 ? factor : -factor);
        syncStrips(virtualPage);
      }
    }

    // Position shadows and start rendering on init
    flip.on('init', function () {
      syncSpine();
      currentPageNum = 1;
      syncStrips(1);
      renderWindow(0).then(function () {
        loader.classList.add('out');
      });
    });

    // Reset shadows to visible when returning to idle
    flip.on('changeState', function (e) {
      var state = e.data;
      if (state === 'read') {

        if (spine) spine.style.opacity = String(getSpineOpacity('read', -1, currentPageNum));
        syncSpine();
      }
    });

    // Poll during flips for frame-synced spine updates
    (function pollSpine() {
      updateShadowVisibility();
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

        // Keep front and back covers hard (rigid) — soft covers cause duplicate
        // page ghost previews at edges because StPageFlip reuses the same page as
        // the temporary copy for the bending deformation
        var pages = flip.getPageCollection().getPages();
        if (pages.length > 0) pages[0].setDensity('hard');
        if (pages.length > 1) pages[pages.length - 1].setDensity('hard');

        flip.on('flip', function (e) {
          var page = e.data;
          currentPageNum = page + 1;
          history.replaceState(null, '', '#page=' + currentPageNum);
          syncStrips(currentPageNum);
          syncSpine();
          var spreadIdx = flip.getPageCollection().getCurrentSpreadIndex();
          renderWindow(spreadIdx).catch(console.error);
          setTimeout(function() {
            syncStrips(currentPageNum);
            syncSpine();
          }, 850);
        });

        var spine = document.getElementById('fb-spine');

        // ---- Staircase strip elements (resize handler) ----
        var stripLeft  = document.getElementById('fb-strip-left');
        var stripRight = document.getElementById('fb-strip-right');
        var canvasLeft = stripLeft ? stripLeft.querySelector('canvas') : null;
        var canvasRight = stripRight ? stripRight.querySelector('canvas') : null;

        // Fore-edge staircase config
        var LINE_STEP   = 2.0;
        var LINE_WIDTH  = 0.5;
        var LINE_COLOR  = '#444';
        var ANGLE_DEPTH = 14;

        function paintStaircase(canvas, count, stripH, dir) {
          if (count <= 0 || stripH <= 0) {
            canvas.width = 0; canvas.height = 0; return 0;
          }
          // dir: -1 = shadow extends leftward (left strip), +1 = rightward (right strip)
          var maxShadow = Math.min(14, count * 0.8); // shorter, gentler scaling
          var shadowW = Math.ceil(maxShadow);
          var lineW = Math.ceil(count * LINE_STEP);
          var totalW = lineW + shadowW;
          var h = Math.round(stripH);
          canvas.width = totalW; canvas.height = h;
          canvas.style.width = totalW + 'px'; canvas.style.height = h + 'px';
          var ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, totalW, h);

          var xOffset = dir === -1 ? shadowW : 0;
          var GAP = 1.0; // px gap between line and shadow start

          for (var i = 0; i < count; i++) {
            var x = xOffset + i * LINE_STEP;
            var depth = (i + 1) / count;
            var sLen = depth * maxShadow;
            if (sLen > GAP + 0.5) {
              // Gradient start is GAP px away from line for softer transition
              var grad = ctx.createLinearGradient(
                dir === -1 ? x - GAP : x + LINE_WIDTH + GAP,
                0,
                dir === -1 ? x - sLen : x + LINE_WIDTH + sLen,
                0
              );
              var so = 0.04 + 0.05 * depth; // very soft: base 0.04, max 0.09
              grad.addColorStop(0, 'rgba(0,0,0,' + so + ')');
              grad.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = grad;
              if (dir === -1) {
                ctx.fillRect(x - sLen, 0, sLen - GAP, h);
              } else {
                ctx.fillRect(x + LINE_WIDTH + GAP, 0, sLen - GAP, h);
              }
            }
            ctx.fillStyle = LINE_COLOR;
            ctx.fillRect(x, 0, LINE_WIDTH, h);
          }
          return totalW;
        }

        function clipPathRight(depthPx, stripH) {
          var pct = (depthPx / stripH * 100).toFixed(1);
          return 'polygon(0% 0%, 100% ' + pct + '%, 100% ' + (100 - parseFloat(pct)).toFixed(1) + '%, 0% 100%)';
        }

        function clipPathLeft(depthPx, stripH) {
          var pct = (depthPx / stripH * 100).toFixed(1);
          return 'polygon(0% ' + pct + '%, 100% 0%, 100% 100%, 0% ' + (100 - parseFloat(pct)).toFixed(1) + '%)';
        }

        function linesFor(count) {
          if (count <= 0) return 0;
          return Math.max(0, Math.floor(count / 2 - 1));
        }

        function syncStrips(currentPage) {
          if (!stripLeft || !stripRight || !canvasLeft || !canvasRight || !flip) return;
          if (currentPage === undefined) currentPage = flip.getPage() + 1;

          var leftCount  = currentPage - 1;
          var rightCount = totalPages - currentPage;
          var leftLines  = linesFor(leftCount);
          var rightLines = linesFor(rightCount);

          var rect   = flip.getBoundsRect();
          var shellRect = shell.getBoundingClientRect();
          var visRect = getVisibleBookRect();
          var stripH = rect.height;  // actual page height
          var depth  = Math.min(ANGLE_DEPTH, stripH * 0.2);
          var bookTop  = visRect.top  - shellRect.top;

          var items = book.querySelectorAll('.stf__item');
          var minX = Infinity, maxX = -Infinity;
          for (var i = 0; i < items.length; i++) {
            var r = items[i].getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
              minX = Math.min(minX, r.left);
              maxX = Math.max(maxX, r.right);
            }
          }
          var bookLeftEdge  = (minX === Infinity ? visRect.left : minX) - shellRect.left;
          var bookRightEdge = (maxX === -Infinity ? visRect.right : maxX) - shellRect.left;

          if (leftLines <= 0) {
            stripLeft.style.display = 'none';
          } else {
            var leftW = paintStaircase(canvasLeft, leftLines, stripH, -1);
            stripLeft.style.cssText =
              'position:absolute;' +
              'top:' + bookTop + 'px;' +
              'left:' + (bookLeftEdge - leftW) + 'px;' +
              'width:' + leftW + 'px;' +
              'height:' + stripH + 'px;' +
              'pointer-events:none;' +
              'z-index:45;' +
              'clip-path:' + clipPathLeft(depth, stripH) + ';' +
              '-webkit-clip-path:' + clipPathLeft(depth, stripH) + ';';
            canvasLeft.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
          }

          if (rightLines <= 0) {
            stripRight.style.display = 'none';
          } else {
            var rightW = paintStaircase(canvasRight, rightLines, stripH, 1);
            stripRight.style.cssText =
              'position:absolute;' +
              'top:' + bookTop + 'px;' +
              'left:' + bookRightEdge + 'px;' +
              'width:' + rightW + 'px;' +
              'height:' + stripH + 'px;' +
              'pointer-events:none;' +
              'z-index:45;' +
              'clip-path:' + clipPathRight(depth, stripH) + ';' +
              '-webkit-clip-path:' + clipPathRight(depth, stripH) + ';';
            canvasRight.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
          }
        }

        function syncSpine() {
          if (!spine || !flip || !shell) return;
          var rect = flip.getBoundsRect();
          var shellRect = shell.getBoundingClientRect();
          var visRect = getVisibleBookRect();
          var wrap = book.querySelector('.stf__wrapper');
          var wrapRect = wrap ? wrap.getBoundingClientRect() : visRect;
          var gutterX = (wrapRect.left - shellRect.left) + rect.width / 2;
          spine.style.left  = (gutterX - 60) + 'px';
          spine.style.top   = (visRect.top - shellRect.top) + 'px';
          spine.style.height = rect.height + 'px';
        }

        function getSpineOpacity(state, progress, pageNum) {
          // Hide spine when book is closed (front or back cover)
          if (pageNum === 1 || pageNum === totalPages) return 0;
          if (state === 'read' || state === 'fold_corner') return 1;
          if (progress < 0) return 0;
          if (progress < 45) return 1;
          if (progress < 50) return 1 - ((progress - 45) / 5);
          if (progress < 90) return 0;
          if (progress < 95) return (progress - 90) / 5;
          return 1;
        }

        function updateShadowVisibility() {
          if (!flip) return;
          var ctrl = flip.flipController;
          var hasCtrl = !!ctrl;
          var state = hasCtrl && ctrl.getState ? ctrl.getState() : 'no-ctrl';
          var calc = hasCtrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
          var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;
          var opacity = getSpineOpacity(state, progress, currentPageNum);
          if (spine) spine.style.opacity = String(opacity);

          // During flips, interpolate strip counts so the page being flipped
          // immediately reduces its stack-side line count (prevents lingering
          // single stripe at edges when flipping last/first pages)
          if ((state === 'flipping' || state === 'user_fold') && calc && calc.getDirection) {
            var dir = calc.getDirection();
            // Accelerate virtual transition so line count reaches zero early
            // in the animation (avoids ghost stripe lingering until the end)
            var factor = Math.min(1, progress / 30);
            var virtualPage = currentPageNum + (dir === 0 ? factor : -factor);
            syncStrips(virtualPage);
          }
        }

        flip.on('init', function () {
          syncSpine();
          currentPageNum = 1;
          syncStrips(1);
          var spreadIdx = flip.getPageCollection().getCurrentSpreadIndex();
          renderWindow(spreadIdx).then(function () {
            loader.classList.add('out');
          });
        });

        flip.on('changeState', function (e) {
          var state = e.data;
          if (state === 'read') {

            if (spine) spine.style.opacity = String(getSpineOpacity('read', -1, currentPageNum));
            syncSpine();
          }
        });

        (function pollSpine() {
          updateShadowVisibility();
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
