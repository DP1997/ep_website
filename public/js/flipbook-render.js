/**
 * flipbook-render.js
 * PDF.js canvas rendering — renders visible pages at high resolution.
 *
 * Reads shared state from window.Flipbook:
 *   pdfDoc, RENDER_SCALE, pageW, pageH
 */
(function () {
  'use strict';

  var FB = window.Flipbook;

  function renderPDFPage(pdfPageNum, canvas, targetW, targetH) {
    if (canvas.dataset.rendering === '1') return Promise.resolve();
    canvas.dataset.rendering = '1';

    return FB.pdfDoc.getPage(pdfPageNum).then(function (page) {
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

      var scale = Math.min(fitW / vp0.width, fitH / vp0.height) * FB.RENDER_SCALE;
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
      var domEl = FB.book.querySelector('[data-slot-index="' + i + '"]');
      if (!domEl) continue;
      var canvas = domEl.querySelector('canvas');
      if (!canvas || canvas.dataset.rendered === '1' || canvas.dataset.rendering === '1') continue;
      promises.push(renderPDFPage(slot.pdfPage, canvas, FB.pageW, FB.pageH));
    }
    return Promise.all(promises);
  }

  function scheduleRender(turnPage, pageMap) {
    renderWindow(turnPage, pageMap).catch(function (err) {
      console.error('Flipbook render error:', err);
    });
  }

  // ---- Namespace export ----
  FB.renderPDFPage = renderPDFPage;
  FB.scheduleRender = scheduleRender;
})();
