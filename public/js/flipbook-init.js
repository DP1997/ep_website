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

  // ---- Drag & drop flipping OFF (original code kept for reactivation) ----
  // StPageFlip v2.0.7 has no settings flag to disable drag-to-flip, and the
  // interactive drag-tracking lives in three methods ON THE FLIP APP instance
  // (FB.flip), not on the flip controller. We neutralize them here.
  //
  // Pointer flow in the library (page-flip@2.0.7, dist/js/page-flip.browser
  // .min.js — class Flip, methods called by the UI handlers):
  //   onMouseDown  -> app.startUserTouch(e)   // press starts the gesture
  //   onMouseMove  -> app.userMove(e, !1)     // track/fold while dragging
  //   onMouseUp    -> app.userStop(e)         // resolve gesture
  //   onTouchEnd   -> app.flipPrev/Next + app.userStop(i, s)   // touch
  //
  // =============================================================
  // ORIGINAL code, preserved verbatim for reference / reactivation:
  // =============================================================
  //   startUserTouch(t) {
  //     this.mousePosition = t;
  //     this.isUserTouch = !0;
  //     this.isUserMove = !1;
  //   }
  //   userMove(t, e) {
  //     this.isUserTouch || e || !this.setting.showPageCorners
  //       ? this.isUserTouch &&
  //         h.GetDistanceBetweenTwoPoint(this.mousePosition, t) > 5 &&
  //         (this.isUserMove = !0, this.flipController.fold(t))
  //       : this.flipController.showCorner(t);
  //   }
  //   userStop(t, e = !1) {
  //     this.isUserTouch && (
  //       this.isUserTouch = !1,
  //       e || (this.isUserMove
  //         ? this.flipController.stopMove()
  //         : this.flipController.flip(t))
  //     );
  //   }
  // =============================================================
  // The overrides below keep everything EXCEPT the drag-to-flip path:
  //   - corner hover preview stays (pointer not pressed),
  //   - a plain click still flips (userStop -> flip),
  //   - arrow keys still flip (keyboard nav below),
  //   - touch swipe still flips (library calls flipPrev/flipNext itself).
  // The "drag while pressed + release" case is swallowed entirely: neither
  // a fold is tracked nor a page turned.
  function disableDragTracking() {
    var FB = getFB();
    if (!FB || !FB.flip) return;
    var app = FB.flip;
    if (app.__fbDragTrackingNeutralized) return;
    app.__fbDragTrackingNeutralized = true;

    // startUserTouch: intentionally NOT overridden — the original press-state
    // reset (isUserTouch = true, isUserMove = false) is exactly what the
    // overrides below rely on to tell click from drag.

    // userMove: on every pointer move. Drag-tracking branch (fold) disabled;
    // corner-hover preview (pointer not pressed) stays active. The original
    // 5px distance threshold still marks a real drag so userStop can tell it
    // apart from a plain click (click jitter < 5px still flips).
    app.userMove = function (t, e) {
      if (this.isUserTouch) {
        // Drag-tracking DISABLED. Original branch did:
        //   h.GetDistanceBetweenTwoPoint(this.mousePosition, t) > 5 &&
        //   (this.isUserMove = !0, this.flipController.fold(t))
        // We keep only the movement marker (no fold), using the same 5px
        // distance threshold (h.GetDistanceBetweenTwoPoint is Pythagoras).
        var dx = t.x - this.mousePosition.x;
        var dy = t.y - this.mousePosition.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          this.isUserMove = true;
        }
        return;
      }
      if (e) return;                    // touch scroll: ignored
      this.flipController.showCorner(t); // hover preview preserved
    };

    // userStop: on mouseup/touchend. A real drag (isUserMove set during the
    // move) is swallowed; only a plain click reaches the flip.
    app.userStop = function (t, e) {
      if (this.isUserTouch) {
        this.isUserTouch = false;
        if (e || this.isUserMove) return; // swipe or drag: no flip
        this.flipController.flip(t);      // plain click: flip
      }
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
