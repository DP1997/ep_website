// flipbook-events.js - Event binding for StPageFlip (flip, init, changeState, auto-tease)
// Depends on window.Flipbook namespace from flipbook-config.js
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

  // Track last flip direction so changeState can derive correct page number
  var lastFlipDirection = null; // 'forward' | 'backward' | null

  function attachFlipEvents() {
    var FB = getFB();
    if (!FB || !FB.flip) return;

    // 'flip' event fires ONLY for forward flips in StPageFlip v2.0.7
    FB.flip.on('flip', function (e) {
      var page = e.data;
      var newPageNum = page + 1;

      // Update current page
      FB.currentPageNum = newPageNum;

      // CRITICAL: Update anchor page only on successful flip completion
      // This ensures aborted drags don't move the anchor
      FB.anchorPage = newPageNum;

      // Track direction for changeState fallback
      lastFlipDirection = 'forward';

      if (window.updateFlipbookProgress) {
        window.updateFlipbookProgress(FB.currentPageNum, FB.totalPages || 1);
      }
      history.replaceState(null, '', '#page=' + FB.currentPageNum);
      FB.syncStrips(FB.currentPageNum);
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
      FB.syncStrips(1);
      var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
      FB.renderWindow(spreadIdx).then(function () {
        if (FB.loader) FB.loader.classList.add('out');
        console.log('[flipbook] init render complete, scheduling tease');
        // Only schedule auto-tease after initial render is fully complete
        if (FB.isInitialRenderComplete && FB.isInitialRenderComplete()) {
          scheduleAutoTease();
        } else {
          setTimeout(function() {
            if (FB.isInitialRenderComplete && FB.isInitialRenderComplete()) {
              scheduleAutoTease();
            } else {
              console.log('[flipbook] Skipping auto-tease: initial render not complete');
            }
          }, 500);
        }
      }).catch(function(err) {
        console.error('[flipbook] Init render failed:', err);
      });
    });

    FB.flip.on('changeState', function (e) {
      var state = e.data;
      console.log('[flipbook] changeState:', state);

      // CRITICAL: Initialize anchor page at start of any flip interaction
      // This locks the shadow base page for the entire flip sequence
      if ((state === 'flipping' || state === 'user_fold' || state === 'fold_corner') && !FB.anchorPage) {
        FB.anchorPage = FB.currentPageNum;
        console.log('[flipbook] anchor page locked at', FB.anchorPage);
      }

      // CRITICAL: Update currentPageNum when state returns to 'read'
      // StPageFlip does NOT fire 'flip' event for backward flips
      // So we must derive the new page number from the page collection
      if (state === 'read' && FB.flip) {
        var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
        var spread = FB.flip.getPageCollection().getSpread()[spreadIdx];
        if (spread && spread.length > 0) {
          // DEBUG: Log spread contents to understand indexing
          console.log('[flipbook] spread at read:', JSON.stringify(spread), 'lastFlipDirection:', lastFlipDirection);

          // Determine flip direction from the flip controller if not already set
          var ctrl = FB.flip.flipController;
          var calc = ctrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
          var dir = calc && calc.getDirection ? calc.getDirection() : null;

          // StPageFlip direction: 0 = forward, 1 = backward
          // If direction is not available, fall back to lastFlipDirection
          var isBackward;
          if (dir !== null && dir !== undefined) {
            isBackward = (dir === 1);
          } else {
            isBackward = (lastFlipDirection === 'backward');
          }

          // For BACKWARD flips, the page that was flipped TO is the LEFT page of the spread
          // For FORWARD flips, the page that was flipped TO is the RIGHT page of the spread
          // StPageFlip spread arrays are 0-based page indices
          var newPageNum;
          if (isBackward) {
            // Backward flip: target page is the left page of the spread
            newPageNum = spread[0] + 1;
          } else {
            // Forward flip or unknown: target page is the right page of the spread
            newPageNum = spread[spread.length - 1] + 1;
          }

          if (newPageNum !== FB.currentPageNum) {
            console.log('[flipbook] page updated from changeState:', FB.currentPageNum, '→', newPageNum);
            FB.currentPageNum = newPageNum;
            FB.anchorPage = newPageNum;
            if (window.updateFlipbookProgress) {
              window.updateFlipbookProgress(FB.currentPageNum, FB.totalPages || 1);
            }
            history.replaceState(null, '', '#page=' + FB.currentPageNum);
          }
        }
        // Reset direction after processing
        lastFlipDirection = null;
      }

      // Cursor-grabbing class during actual flips
      if (FB.shell && (state === 'flipping' || state === 'user_fold')) {
        FB.shell.classList.add('is-flipping');
      } else if (FB.shell && state === 'read') {
        FB.shell.classList.remove('is-flipping');
      }
      // NOTE: spine/strip positioning is handled by the rAF poll in
      // flipbook-spine-state.js (updateShadowVisibility). Do NOT call syncSpine
      // or syncStrips here — doing so on every fold_corner/read transition
      // causes forced reflows and can freeze PDF.js rendering.
    });
  }

  // ---- Auto-tease: briefly flip a page and spring back on first open ----
  // Teaches users that pages are interactive without persistent UI chrome.
  // Uses flip event to know when animation completes before springing back.
  function scheduleAutoTease() {
    var FB = getFB();
    console.log('[flipbook] scheduleAutoTease called');
    if (!FB || !FB.flip) { console.log('[flipbook] abort: no FB/flip'); return; }
    var tp = FB.totalPages || 0;
    console.log('[flipbook] totalPages=', tp);
    if (tp < 2) { console.log('[flipbook] abort: <2 pages'); return; }

    // CRITICAL: Check that initial render is complete before allowing any flips
    if (FB.isInitialRenderComplete && !FB.isInitialRenderComplete()) {
      console.log('[flipbook] abort: initial render not complete, waiting...');
      setTimeout(scheduleAutoTease, 200);
      return;
    }

    var ctrl = FB.flip.flipController;

    setTimeout(function () {
      if (!FB || !FB.flip) { console.log('[flipbook] abort in timeout: no FB'); return; }
      var st = ctrl && ctrl.getState ? ctrl.getState() : 'read';
      console.log('[flipbook] state before tease:', st);
      if (st !== 'read') { console.log('[flipbook] abort: not in read state'); return; }

      // Double-check render completion right before flipping
      if (FB.isInitialRenderComplete && !FB.isInitialRenderComplete()) {
        console.log('[flipbook] abort in timeout: render still not complete');
        setTimeout(scheduleAutoTease, 200);
        return;
      }

      console.log('[flipbook] executing flipNext');
      FB.shell.classList.add('is-flipping');
      FB.flip.flipNext('top');

      // Wait for the flip to complete via the 'flip' event before springing back
      var onFlip = function (e) {
        console.log('[flipbook] flip event fired, page=', e.data + 1);
        FB.flip.off('flip', onFlip); // one-shot listener
        // Hold the turned page for 1.2s so user clearly sees the affordance
        setTimeout(function () {
          if (!FB || !FB.flip) { console.log('[flipbook] abort in springback: no FB'); return; }
          var curPage = FB.currentPageNum || 1;
          console.log('[flipbook] springback, currentPage=', curPage);
          if (curPage > 1) {
            console.log('[flipbook] executing flipPrev');
            FB.flip.flipPrev('top');
          } else {
            console.log('[flipbook] skip flipPrev: already on page 1');
          }
          // Remove is-flipping after return animation completes
          setTimeout(function () {
            if (FB.shell) FB.shell.classList.remove('is-flipping');
            console.log('[flipbook] is-flipping removed');
          }, 1000);
        }, 1200);
      };
      FB.flip.on('flip', onFlip);

      sessionStorage.setItem('fb_teased', '1');
    }, 800);
  }

  // Expose for use by flipbook-init.js
  window.Flipbook.attachFlipEvents = attachFlipEvents;
  window.Flipbook.scheduleAutoTease = scheduleAutoTease;
  window.Flipbook.centerBook = centerBook;
  // Expose direction setter for spine-state.js to mark backward flips
  window.Flipbook.setLastFlipDirection = function(dir) { lastFlipDirection = dir; };
})();
