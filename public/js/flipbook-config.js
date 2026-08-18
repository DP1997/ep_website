// Flipbook shared configuration and DOM references.
// Loaded before all other flipbook modules.
// Supports re-initialization for modal usage via FB.refreshDOM().
(function () {
  'use strict';

  // Guard against double-loading (e.g. modal fallback path re-injecting scripts).
  if (window.__FB_CONFIG_LOADED) return;
  window.__FB_CONFIG_LOADED = true;

  var RENDER_SCALE = 2;
  var MARGIN       = 40;
  var MAX_FRACTION = 0.88;

  function acquireRefs() {
    // Prefer the modal-injected shell when the modal is open, so the embedded
    // page-flow shell (katalog/[slug]) and the modal shell never collide.
    var modalContent = document.getElementById('fb-modal-content');
    var shell  = (modalContent && modalContent.querySelector('.flipbook-shell'))
                 || document.querySelector('.flipbook-shell');
    // Scope loader/book to the resolved shell so embedded + modal instances
    // don't grab each other's elements via duplicate IDs.
    var loader = shell ? shell.querySelector('#fb-loader') : null;
    var book   = shell ? shell.querySelector('#fb-book') : null;
    var pdfUrl = shell && shell.dataset.pdfUrl;
    return { shell: shell, loader: loader, book: book, pdfUrl: pdfUrl };
  }

    var refs = acquireRefs();
  // NOTE: Don't abort if shell is missing - we may be in modal mode where
  // the shell is injected later when the catalog is opened.
  // refreshDOM() will re-acquire refs when needed.
    var pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    console.error('Flipbook: PDF.js not loaded');
    return;
  }
  // workerSrc is already configured by pdfjs-loader.mjs; no need to set it again.

  // Expose shared state on a global namespace so modules can reference it.
  // refreshDOM() allows re-acquiring elements when the flipbook is injected
  // into a modal after initial page load.
  window.Flipbook = {
    RENDER_SCALE: RENDER_SCALE,
    MARGIN:       MARGIN,
    MAX_FRACTION: MAX_FRACTION,
    pdfjsLib:     pdfjsLib,

    shell:  refs.shell,
    loader: refs.loader,
    book:   refs.book,
    pdfUrl: refs.pdfUrl,

    pdfDoc:      null,
    totalPages:  0,
    pageAR:      0.707,
    pageW:       0,
    pageH:       0,
    flip:        null,
    currentPageNum: 1,
    pageEls:     [],

    refreshDOM: function() {
      var r = acquireRefs();
      this.shell  = r.shell;
      this.loader = r.loader;
      this.book   = r.book;
      this.pdfUrl = r.pdfUrl;
      return !!(r.shell && r.book && r.pdfUrl);
    }
  };
})();
