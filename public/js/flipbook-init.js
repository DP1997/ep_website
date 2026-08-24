// flipbook-init.js - StPageFlip initialization, resize handling, keyboard nav, boot sequence
// Depends on window.Flipbook namespace and flipbook-events.js
(function () {
  'use strict';
  if (window.__FB_INIT_LOADED) return;
  window.__FB_INIT_LOADED = true;

  function getFB() {
    return window.Flipbook;
  }

  // Single shared rAF poll loop. Guarded so repeated init/resize calls
  // don't spawn multiple parallel loops.
  var spinePollRunning = false;
  function startSpinePoll() {
    var FB = getFB();
    if (!FB || spinePollRunning) return;
    spinePollRunning = true;
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
    // GUARD: getPages() may return undefined in some StPageFlip versions
    var pages = FB.flip.getPageCollection() ? FB.flip.getPageCollection().getPages() : null;
    if (pages && pages.length > 0 && pages[0] && pages[0].setDensity) pages[0].setDensity('hard');
    if (pages && pages.length > 1 && pages[pages.length - 1] && pages[pages.length - 1].setDensity) pages[pages.length - 1].setDensity('hard');

    FB.attachFlipEvents();
    if (FB.attachHotzoneCursor) FB.attachHotzoneCursor();
    disableDragTracking();
    startSpinePoll();
    attachKeyboardNav();
  }

  // ---- Drag-tracking off (kept commented for reactivation) ----
  // Disables StPageFlip's interactive drag-tracking (the user "tracking" the
  // fold with the mouse/pointer while flipping). Paging stays available via
  // corner-click, arrow keys and touch swipe. NOTE: the library offers no
  // settings flag for this, so we neutralize the flip controller's userMove
  // slot instead — the original StPageFlip code below is preserved verbatim
  // and only its "track the fold" branch is short-circuited.
  //
  // Reference (page-flip@2.0.7, dist/js/page-flip.browser.min.js, class r):
  //   userMove(t, e) {
  //     // user is dragging a page (or fold preview)
  //     this.isUserTouch || e || !this.setting.showPageCorners
  //       ? this.isUserTouch &&
  //         h.GetDistanceBetweenTwoPoint(this.mousePosition, t) > 5 &&
  //         (this.isUserMove = !0, this.flipController.fold(t))
  //       : this.flipController.showCorner(t);
  //   }
  // The override keeps the corner-hover preview (mouse not pressed) and drops
  // only the drag branch. A mousedown+drag+mouseup therefore resolves as the
  // regular click-to-flip instead of a tracked fold.
  function disableDragTracking() {
    var FB = getFB();
    if (!FB || !FB.flip) return;
    var controller = FB.flip.flipController;
    if (!controller) return;
    // Guard against re-wrapping on repeated init/resize calls (new controller
    // each time, so a per-instance marker keeps idempotency).
    if (controller.__fbDragTrackingNeutralized) return;
    controller.__fbDragTrackingNeutralized = true;
    controller.userMove = function (t, e) {
      // Drag-tracking branch intentionally disabled. Original fold logic:
      //   if (this.isUserTouch && h.GetDistanceBetweenTwoPoint(
      //       this.mousePosition, t) > 5) this.flipController.fold(t);
      // Corner-hover preview preserved (see library source above):
      if (this.isUserTouch || e) return;
      this.flipController.showCorner(t);
    };
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

      // Remove the old book element before creating a fresh one, so repeated
      // resizes don't accumulate orphaned #fb-book divs (duplicate IDs).
      if (FB.book && FB.book.parentNode) {
        FB.book.parentNode.removeChild(FB.book);
      }
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

      // GUARD: getPages() may return undefined in some StPageFlip versions
      var pages = FB.flip.getPageCollection() ? FB.flip.getPageCollection().getPages() : null;
      if (pages && pages.length > 0 && pages[0] && pages[0].setDensity) pages[0].setDensity('hard');
      if (pages && pages.length > 1 && pages[pages.length - 1] && pages[pages.length - 1].setDensity) pages[pages.length - 1].setDensity('hard');

      FB.attachFlipEvents();
      disableDragTracking();
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
