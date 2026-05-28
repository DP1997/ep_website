// Flipbook shared configuration and DOM references.
// Loaded before all other flipbook modules.
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
  // Expose shared state on a global namespace so modules can reference it
  window.Flipbook = {
    RENDER_SCALE: RENDER_SCALE,
    MARGIN:       MARGIN,
    MAX_FRACTION: MAX_FRACTION,
    shell:  shell,
    loader: loader,
    book:   book,
    pdfUrl: pdfUrl,
    pdfjsLib: pdfjsLib,
    pdfDoc:      null,
    totalPages:  0,
    pageAR:      0.707,
    pageW:       0,
    pageH:       0,
    flip:        null,
    currentPageNum: 1,
    pageEls:     []
  };
})();
