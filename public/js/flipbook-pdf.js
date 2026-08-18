// PDF loading, sizing, page building and rendering for the flipbook.
// Depends on flipbook-config.js (window.Flipbook namespace).
(function () {
  'use strict';
  var FB = window.Flipbook;
  if (!FB) return;

  // Track render state to prevent interaction before ready
  var initialRenderComplete = false;
  var pendingRenders = {};

  function getSizes(ar) {
    var shellRect = FB.shell ? FB.shell.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    var vw = shellRect.width  - FB.MARGIN * 2;
    var vh = shellRect.height - FB.MARGIN * 2;
    var bookAR = ar * 2;
    var bw, bh;
    if (vw / vh > bookAR) {
      bh = Math.round(vh * FB.MAX_FRACTION);
      bw = Math.round(bh * bookAR);
    } else {
      bw = Math.round(vw * FB.MAX_FRACTION);
      bh = Math.round(bw / bookAR);
    }
    var pw = Math.round(bw / 2);
    var ph = Math.round(pw / ar);
    bw = pw * 2;
    bh = ph;
    return { pw: pw, ph: ph, bw: bw, bh: bh };
  }

  function renderPage(pdfPageNum, canvas, targetW, targetH) {
    if (!canvas) return Promise.reject(new Error('Canvas is null'));
    if (canvas.dataset.rendered === '1') return Promise.resolve();
    if (canvas.dataset.rendering === '1') {
      // Already rendering, wait for it to complete
      var key = 'render-' + pdfPageNum;
      if (!pendingRenders[key]) {
        pendingRenders[key] = { resolve: [], reject: [] };
      }
      return new Promise(function(resolve, reject) {
        pendingRenders[key].resolve.push(resolve);
        pendingRenders[key].reject.push(reject);
      });
    }
    
    canvas.dataset.rendering = '1';
    return FB.pdfDoc.getPage(pdfPageNum).then(function (page) {
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
      var scale = Math.min(fitW / vp0.width, fitH / vp0.height) * FB.RENDER_SCALE;
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
      initialRenderComplete = true;
      
      // Resolve any pending waits for this page
      var key = 'render-' + pdfPageNum;
      if (pendingRenders[key]) {
        pendingRenders[key].resolve.forEach(function(fn) { fn(); });
        delete pendingRenders[key];
      }
    }).catch(function (err) {
      canvas.dataset.rendering = '0';
      console.error('Flipbook renderPage error:', err);
      throw err;
    });
  }

  function buildPages(count, pw, ph) {
    FB.pageEls = [];
    FB.book.innerHTML = '';
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
      FB.book.appendChild(wrap);
      FB.pageEls.push({ el: wrap, canvas: cvs, pdfPage: i });
    }
  }

  function renderWindow(spreadIndex) {
    if (!FB.flip) return Promise.resolve();
    var spread = FB.flip.getPageCollection().getSpread()[spreadIndex];
    if (!spread) return Promise.resolve();
    var promises = [];
    // Render current spread + one page on each side for smoother UX
    for (var s = Math.max(0, spreadIndex - 1);
         s <= Math.min(FB.pageEls.length - 1, spreadIndex + 1);
         s++) {
      var pages = FB.flip.getPageCollection().getSpread()[s];
      if (!pages) continue;
      for (var pIdx = 0; pIdx < pages.length; pIdx++) {
        var pageNum = pages[pIdx];
        var item = FB.pageEls[pageNum];
        if (!item || !item.canvas) continue;
        promises.push(renderPage(item.pdfPage, item.canvas, FB.pageW, FB.pageH));
      }
    }
    return Promise.all(promises);
  }

  // Check if a specific page is rendered
  function isPageRendered(pageNum) {
    if (!FB.pageEls[pageNum]) return false;
    return FB.pageEls[pageNum].canvas.dataset.rendered === '1';
  }

  // Force re-render of blank pages in a spread
  function repairBlankPages(spreadIndex) {
    if (!FB.flip) return Promise.resolve();
    var spread = FB.flip.getPageCollection().getSpread()[spreadIndex];
    if (!spread) return Promise.resolve();
    
    var repairs = [];
    for (var pIdx = 0; pIdx < spread.length; pIdx++) {
      var pageNum = spread[pIdx];
      var item = FB.pageEls[pageNum];
      if (!item || !item.canvas) continue;
      
      // Check if canvas is blank (no rendered content)
      var canvas = item.canvas;
      if (canvas.dataset.rendered !== '1' && canvas.dataset.rendering !== '1') {
        console.log('[flipbook-pdf] Repairing blank page', pageNum);
        canvas.dataset.rendered = '0';
        repairs.push(renderPage(item.pdfPage, canvas, FB.pageW, FB.pageH));
      }
    }
    return Promise.all(repairs);
  }

  // Load PDF, probe aspect ratio, build pages and fire init callback
  function loadAndInit(onReady) {
    initialRenderComplete = false;
    // pdfjs-dist 6.x requires an object argument ({ url }) — a bare string URL is rejected.
    FB.pdfjsLib.getDocument({ url: FB.pdfUrl }).promise.then(function (doc) {
      FB.pdfDoc     = doc;
      FB.totalPages = doc.numPages;
      var probePage = FB.totalPages >= 2 ? 2 : 1;
      return FB.pdfDoc.getPage(probePage).then(function (page) {
        var vp = page.getViewport({ scale: 1 });
        FB.pageAR = vp.width / vp.height;
        var sizes = getSizes(FB.pageAR);
        FB.pageW = sizes.pw;
        FB.pageH = sizes.ph;
        buildPages(FB.totalPages, sizes.pw, sizes.ph);
        if (onReady) onReady(sizes);
      });
    }).catch(function (err) {
      console.error('Flipbook:', err);
      FB.loader.innerHTML = '<p style="color:#a33;text-align:center;padding:2rem">Failed to load PDF.<br><small>' + (err.message || err) + '</small></p>';
    });
  }

  // Expose API
  FB.getSizes           = getSizes;
  FB.renderPage         = renderPage;
  FB.buildPages         = buildPages;
  FB.renderWindow       = renderWindow;
  FB.loadAndInit        = loadAndInit;
  FB.isPageRendered     = isPageRendered;
  FB.repairBlankPages   = repairBlankPages;
  FB.isInitialRenderComplete = function() { return initialRenderComplete; };
})();
