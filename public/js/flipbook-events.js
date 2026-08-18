// flipbook-events.js - Event binding for StPageFlip (flip, init, changeState, auto-tease)
// Depends on window.Flipbook namespace from flipbook-config.js
(function () {
  'use strict';
  if (window.__FB_EVENTS_LOADED) return;
  window.__FB_EVENTS_LOADED = true;

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

    // 'flip' event fires for BOTH forward and backward flips in StPageFlip v2.0.7.
    // e.data is the 0-based left page of the current spread, which jumps by 2
    // between normal spreads — so we do NOT derive the page number from it.
    // Instead, each completed flip turns exactly ONE page, so we move by ±1.
    FB.flip.on('flip', function (e) {
      // Determine flip direction from the controller. calc is still available
      // during the 'flip' event (reset() runs after turnToNext/PrevPage).
      var ctrl = FB.flip.flipController;
      var calc = ctrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
      var dir = calc && calc.getDirection ? calc.getDirection() : 0;
      var isBackward = (dir === 1);

      // Update current page by exactly one page per flip.
      var newPageNum = isBackward ? FB.currentPageNum - 1 : FB.currentPageNum + 1;
      FB.currentPageNum = newPageNum;

      // CRITICAL: Update anchor page only on successful flip completion
      // This ensures aborted drags don't move the anchor
      FB.anchorPage = newPageNum;

      if (window.updateFlipbookProgress) {
        window.updateFlipbookProgress(FB.currentPageNum, FB.totalPages || 1);
      }
      history.replaceState(null, '', '#page=' + FB.currentPageNum);
      FB.syncStrips();
      FB.syncSpine();

      // Repair any blank pages after flip completes, then render
      var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
      FB.repairBlankPages(spreadIdx).then(function() {
        return FB.renderWindow(spreadIdx);
      }).catch(function (err) {
        console.error('Flipbook render error:', err);
      });
    });

    FB.flip.on('init', function () {
      centerBook();
      FB.syncSpine();
      FB.currentPageNum = 1;

      // Initialize anchor page for shadow tracking
      FB.anchorPage = 1;

      if (window.updateFlipbookProgress) {
        window.updateFlipbookProgress(1, FB.totalPages || 1);
      }
      FB.syncStrips();
      var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
      FB.renderWindow(spreadIdx).then(function () {
        if (FB.loader) FB.loader.classList.add('out');
        // Only schedule auto-tease after initial render is fully complete
        if (FB.isInitialRenderComplete && FB.isInitialRenderComplete()) {
          scheduleAutoTease();
        } else {
          setTimeout(function() {
            if (FB.isInitialRenderComplete && FB.isInitialRenderComplete()) {
              scheduleAutoTease();
            }
          }, 500);
        }
      }).catch(function(err) {
        console.error('[flipbook] Init render failed:', err);
      });
    });

    FB.flip.on('changeState', function (e) {
      var state = e.data;

      // Initialize anchor page at start of any flip interaction so the spine
      // shadow has a stable base page for the whole flip sequence.
      if ((state === 'flipping' || state === 'user_fold') && !FB.anchorPage) {
        FB.anchorPage = FB.currentPageNum;
      }

      // NOTE: currentPageNum is updated by the 'flip' event, which fires for
      // BOTH forward and backward flips (StPageFlip triggers it on every
      // completed spread change). Deriving it again here would double-count.

      // Cursor-grabbing class during actual flips
      if (FB.shell && (state === 'flipping' || state === 'user_fold')) {
        FB.shell.classList.add('is-flipping');
      } else if (FB.shell && state === 'read') {
        FB.shell.classList.remove('is-flipping');
      }
      // NOTE: spine/strip positioning is handled by the rAF poll in
      // flipbook-spine.js (updateShadowVisibility). Do NOT call syncSpine
      // or syncStrips here — doing so on every fold_corner/read transition
      // causes forced reflows and can freeze PDF.js rendering.
    });
  }

  // ---- Auto-tease: lift the top-right corner + ripple on first open ----
  // Teaches users that pages are interactive without a full page flip.
  // Uses StPageFlip's showCorner() for a subtle corner-lift preview, plus a
  // concentric ripple on the corner to signal "grab and flip here".
  function scheduleAutoTease() {
    var FB = getFB();
    if (!FB || !FB.flip) return;
    var tp = FB.totalPages || 0;
    if (tp < 2) return;

    // Only tease once per session.
    if (sessionStorage.getItem('fb_teased')) return;

    // CRITICAL: Check that initial render is complete before allowing any flips
    if (FB.isInitialRenderComplete && !FB.isInitialRenderComplete()) {
      setTimeout(scheduleAutoTease, 200);
      return;
    }

    var ctrl = FB.flip.flipController;

    setTimeout(function () {
      if (!FB || !FB.flip) return;
      var st = ctrl && ctrl.getState ? ctrl.getState() : 'read';
      if (st !== 'read') return;

      // Double-check render completion right before flipping
      if (FB.isInitialRenderComplete && !FB.isInitialRenderComplete()) {
        setTimeout(scheduleAutoTease, 200);
        return;
      }

      // Position the ripple at the book's top-right corner.
      var ripple = document.getElementById('fb-ripple');
      if (ripple && FB.shell) {
        var rect = FB.flip.getBoundsRect();
        var shellRect = FB.shell.getBoundingClientRect();
        var wrap = FB.book.querySelector('.stf__wrapper');
        var wrapRect = wrap ? wrap.getBoundingClientRect() : null;
        if (wrapRect && wrapRect.width > 0) {
          var cornerX = (wrapRect.right - shellRect.left);
          var cornerY = (wrapRect.top - shellRect.top);
          ripple.style.left = cornerX + 'px';
          ripple.style.top = cornerY + 'px';
        }
        ripple.classList.add('play');
      }

      // Lift the top-right corner (subtle fold preview).
      var rect = FB.flip.getBoundsRect();
      var point = { x: rect.left + rect.width - 5, y: rect.top + 5 };
      ctrl.showCorner(point);

      // Let the corner settle back after ~1.2s.
      setTimeout(function () {
        if (!FB || !FB.flip) return;
        var c = FB.flip.flipController;
        if (c && c.getState && c.getState() === 'fold_corner') {
          c.setState('read');
          c.reset();
        }
      }, 1200);

      // Stop the ripple after a few waves.
      setTimeout(function () {
        if (ripple) ripple.classList.remove('play');
      }, 4000);

      sessionStorage.setItem('fb_teased', '1');
    }, 800);
  }

  // Expose for use by flipbook-init.js
  window.Flipbook.attachFlipEvents = attachFlipEvents;
  window.Flipbook.scheduleAutoTease = scheduleAutoTease;
  window.Flipbook.centerBook = centerBook;
})();
