// StPageFlip initialization, event binding, resize handling, and boot sequence.
// Depends on flipbook-config.js, flipbook-pdf.js, flipbook-stairs.js, flipbook-spine.js
// Supports re-initialization via window.__initFlipbook() for modal usage.
(function () {
  'use strict';

  function getFB() {
    return window.Flipbook;
  }

  function centerBook() {
    var FB = getFB();
    if (!FB || !FB.book || !FB.flip) return;
    var rect = FB.flip.getBoundsRect();
    var ph = rect.height;
    var bookH = FB.book.clientHeight;
    var pad = Math.max(0, Math.floor((bookH - ph) / 2));
    FB.book.style.paddingTop = pad + 'px';
    FB.book.style.paddingBottom = pad + 'px';
  }

  function attachFlipEvents() {
    var FB = getFB();
    if (!FB || !FB.flip) return;

    FB.flip.on('flip', function (e) {
      var page = e.data;
      FB.currentPageNum = page + 1;
      if (window.updateFlipbookProgress) {
        window.updateFlipbookProgress(FB.currentPageNum, FB.totalPages || 1);
      }
      history.replaceState(null, '', '#page=' + FB.currentPageNum);
      FB.syncStrips(FB.currentPageNum);
      FB.syncSpine();
      var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
      FB.renderWindow(spreadIdx).catch(function (err) {
        console.error('Flipbook render error:', err);
      });
    });

    FB.flip.on('init', function () {
      centerBook();
      FB.syncSpine();
      FB.currentPageNum = 1;
      if (window.updateFlipbookProgress) {
        window.updateFlipbookProgress(1, FB.totalPages || 1);
      }
      FB.syncStrips(1);
      var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
      FB.renderWindow(spreadIdx).then(function () {
        if (FB.loader) FB.loader.classList.add('out');
      });
    });

    FB.flip.on('changeState', function (e) {
      var state = e.data;
      if (state === 'read') {
        var r = FB.getSpineRefs ? FB.getSpineRefs() : {};
        if (r.spine) r.spine.style.opacity = String(FB.getSpineOpacity('read', -1, FB.currentPageNum));
        FB.syncSpine();
        FB.syncStrips(FB.currentPageNum);
      }
    });
  }

  function startSpinePoll() {
    var FB = getFB();
    if (!FB) return;
    (function poll() {
      if (FB && FB.updateShadowVisibility) FB.updateShadowVisibility();
      requestAnimationFrame(poll);
    })();
  }

  function initFlip(sizes) {
    var FB = getFB();
    if (!FB) return;

    var pw = sizes.pw, ph = sizes.ph;
    FB.pageW = pw; FB.pageH = ph;

    var St = window.St;
    if (!St || !St.PageFlip) {
      if (FB.loader) FB.loader.innerHTML = '<p style="color:#a33;text-align:center;padding:2rem">StPageFlip not loaded.</p>';
      return;
    }

    FB.flip = new St.PageFlip(FB.book, {
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

    var elements = FB.pageEls.map(function (p) { return p.el; });
    FB.flip.loadFromHTML(elements);

    // Keep front and back covers hard (rigid)
    var pages = FB.flip.getPageCollection().getPages();
    if (pages.length > 0) pages[0].setDensity('hard');
    if (pages.length > 1) pages[pages.length - 1].setDensity('hard');

    attachFlipEvents();
    startSpinePoll();
    attachKeyboardNav();
  }

  // ---- Keyboard nav (global, only one listener) ----
  // We use a named global handler so old module loads can be overwritten
  // by new ones. Each time this module loads, it replaces window.__fb_kbListener
  // with the current handler. The document only ever has ONE listener.
  window.__fb_kbListener = function (e) {
    var FB = getFB();
    if (!FB || !FB.flip) return;
    // Prevent double-firing when module is reloaded: if StPageFlip is already
    // flipping, ignore the keypress.
    var ctrl = FB.flip.flipController;
    var state = ctrl && ctrl.getState ? ctrl.getState() : 'read';
    if (state === 'flipping' || state === 'user_fold') return;
    if (e.key === 'ArrowLeft')  FB.flip.flipPrev('bottom');
    if (e.key === 'ArrowRight') FB.flip.flipNext('bottom');
  };
  // Remove any previously attached listener (from prior module load)
  // and attach the current one.
  if (window.__fb_kbListenerPrev) {
    document.removeEventListener('keydown', window.__fb_kbListenerPrev);
  }
  document.addEventListener('keydown', window.__fb_kbListener);
  window.__fb_kbListenerPrev = window.__fb_kbListener;

  function attachKeyboardNav() {
    // No-op: listener is set up once at module load time above.
  }
  function detachKeyboardNav() {
    if (window.__fb_kbListenerPrev) {
      document.removeEventListener('keydown', window.__fb_kbListenerPrev);
      window.__fb_kbListenerPrev = null;
    }
  }

  // ---- Resize handler ----
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var FB = getFB();
      if (!FB || !FB.flip) return;
      var newSizes = FB.getSizes(FB.pageAR);
      FB.pageW = newSizes.pw; FB.pageH = newSizes.ph;

      FB.flip.destroy();

      FB.book = document.createElement('div');
      FB.book.id = 'fb-book';
      FB.shell.appendChild(FB.book);

      FB.buildPages(FB.totalPages, FB.pageW, FB.pageH);

      FB.flip = new St.PageFlip(FB.book, {
        width:       FB.pageW,
        height:      FB.pageH,
        size:        'fixed',
        minWidth:    FB.pageW,
        maxWidth:    FB.pageW * 2,
        minHeight:   FB.pageH,
        maxHeight:   FB.pageH,
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

      var newEls = FB.pageEls.map(function (p) { return p.el; });
      FB.flip.loadFromHTML(newEls);

      var pages = FB.flip.getPageCollection().getPages();
      if (pages.length > 0) pages[0].setDensity('hard');
      if (pages.length > 1) pages[pages.length - 1].setDensity('hard');

      attachFlipEvents();
      startSpinePoll();
    }, 300);
  });

  // ---- Boot / Re-init entry point ----
  function bootFlipbook() {
    var FB = getFB();
    if (!FB) return;
    // Re-acquire DOM refs in case we're in a modal
    if (!FB.refreshDOM || !FB.refreshDOM()) {
      console.error('Flipbook: DOM elements not found during boot');
      return;
    }
    FB.loadAndInit(initFlip);
  }

  // Expose for modal usage
  window.__initFlipbook = bootFlipbook;

  // Auto-boot on first load
  bootFlipbook();
})();
