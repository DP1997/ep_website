// flipbook-init.js - StPageFlip initialization, resize handling, keyboard nav, boot sequence
// Depends on window.Flipbook namespace and flipbook-events.js
(function () {
  'use strict';

  function getFB() {
    return window.Flipbook;
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

    // Create StPageFlip instance with fixed sizing
    FB.flip = new St.PageFlip(FB.book, {
      width:       pw,
      height:      ph,
      size:        'fixed',
      minWidth:    pw,
      maxWidth:    pw * 2,
      minHeight:   ph,
      maxHeight:   ph,
      showCover:   false,
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
    // GUARD: getPages() may return undefined in some StPageFlip versions
    var pages = FB.flip.getPageCollection() ? FB.flip.getPageCollection().getPages() : null;
    if (pages && pages.length > 0 && pages[0] && pages[0].setDensity) pages[0].setDensity('hard');
    if (pages && pages.length > 1 && pages[pages.length - 1] && pages[pages.length - 1].setDensity) pages[pages.length - 1].setDensity('hard');

    FB.attachFlipEvents();
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

      // Recreate StPageFlip with new dimensions
      FB.flip = new window.St.PageFlip(FB.book, {
        width:       FB.pageW,
        height:      FB.pageH,
        size:        'fixed',
        minWidth:    FB.pageW,
        maxWidth:    FB.pageW * 2,
        minHeight:   FB.pageH,
        maxHeight:   FB.pageH,
        showCover:   false,
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

      // GUARD: getPages() may return undefined in some StPageFlip versions
      var pages = FB.flip.getPageCollection() ? FB.flip.getPageCollection().getPages() : null;
      if (pages && pages.length > 0 && pages[0] && pages[0].setDensity) pages[0].setDensity('hard');
      if (pages && pages.length > 1 && pages[pages.length - 1] && pages[pages.length - 1].setDensity) pages[pages.length - 1].setDensity('hard');

      FB.attachFlipEvents();
      startSpinePoll();
    }, 300);
  });

  // ---- Boot / Re-init entry point ----
  // Global guard: prevent old cached versions from initializing if a newer version already loaded
  var CURRENT_VERSION = 91;
  if (window.__FB_VERSION && window.__FB_VERSION > CURRENT_VERSION) {
    console.log('[flipbook-init] Skipping init: newer version ' + window.__FB_VERSION + ' already loaded (this is v' + CURRENT_VERSION + ')');
    return;
  }
  window.__FB_VERSION = CURRENT_VERSION;

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
