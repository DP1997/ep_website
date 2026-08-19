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

  // ---- Auto-tease: corner lift + ripple on open ----
  // Teaches users that pages are interactive without a full page flip.
  // Animates the corner fold smoothly up to the maximum hover depth
  // (same as hovering the corner with the mouse), then settles back.
  // A concentric ripple on the corner signals "grab and flip here".
  function scheduleAutoTease() {
    var FB = getFB();
    if (!FB || !FB.flip) return;
    var tp = FB.totalPages || 0;
    if (tp < 2) return;

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

      // Position the ripple at the book's top-right corner and start it
      // immediately — the fold begins when the second wave appears (0.5s).
      var ripple = document.getElementById('fb-ripple');
      if (ripple && FB.shell) {
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

      // Smoothly fold the top-right corner up to the maximum hover depth
      // (50px, the same distance StPageFlip uses for its own corner hover),
      // then settle it back. Uses the library's fold()/do() so the fold
      // looks exactly like a real mouse hover — but animated fluidly.
      var rect = FB.flip.getBoundsRect();
      var render = FB.flip.getRender();
      var start = { x: rect.left + rect.width - 5, y: rect.top + 5 };
      var end = { x: rect.left + rect.width - 50, y: rect.top + 50 };
      var foldDur = 900;   // ms to fold in
      var holdMs = 500;    // ms to hold the fold
      var settleMs = 900; // ms to settle back
      var rafId = null;
      var settled = false;

      function easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function animateFold(from, to, dur, onDone) {
        var t0 = performance.now();
        function step(now) {
          var t = Math.min(1, (now - t0) / dur);
          var e = easeInOut(t);
          var p = {
            x: from.x + (to.x - from.x) * e,
            y: from.y + (to.y - from.y) * e
          };
          ctrl.do(render.convertToPage(p));
          if (t < 1) {
            rafId = requestAnimationFrame(step);
          } else if (onDone) {
            onDone();
          }
        }
        rafId = requestAnimationFrame(step);
      }

      function forceSettle() {
        if (settled || !FB || !FB.flip) return;
        settled = true;
        FB.autoTeaseActive = false;
        var c = FB.flip.flipController;
        if (c && c.getState && (c.getState() === 'fold_corner' || c.getState() === 'user_fold')) {
          c.setState('read');
          c.reset();
        }
      }

      // Start the fold when the second ripple wave appears (0.5s after the
      // first). fold() expects a global (book) point and converts internally.
      setTimeout(function () {
        if (!FB || !FB.flip) return;
        // Mark this fold as an automated preview so the spine module keeps the
        // strip counts stable during it (a real user drag reduces them live).
        FB.autoTeaseActive = true;
        ctrl.fold(start);
        animateFold(start, end, foldDur, function () {
          // Hold the fold, then settle back to read.
          setTimeout(function () {
            if (!FB || !FB.flip) return;
            animateFold(end, start, settleMs, forceSettle);
          }, holdMs);
        });
      }, 500);

      // Safety: force-settle if anything goes wrong.
      setTimeout(forceSettle, 500 + foldDur + holdMs + settleMs + 500);

      // The ripple waves finish naturally (forwards fill keeps them at max
      // size, opacity 0 — they dissolve outward). No extra fade needed.
      // Keep 'play' so the waves don't reset to their small base size.
    }, 800);
  }

  // ---- Corner hot-zone cursor ----
  // The pointer shows "grab" only over the foldable corners of the current
  // page (outer corners of the spread), not over the whole book. Uses the
  // same 1/5-diagonal zone StPageFlip uses internally for showCorner().
  function attachHotzoneCursor() {
    var FB = getFB();
    if (!FB || !FB.shell || window.__FB_HOTZONE_LOADED) return;
    window.__FB_HOTZONE_LOADED = true;

    FB.shell.addEventListener('mousemove', function (e) {
      if (!FB.flip) return;
      var rect = FB.flip.getBoundsRect();
      var book = FB.book.querySelector('.stf__wrapper');
      if (!book) return;
      var br = book.getBoundingClientRect();
      var px = e.clientX - br.left;
      var py = e.clientY - br.top;
      var w = br.width, h = br.height;
      // Corner zone radius = 1/5 of the page diagonal (matches StPageFlip).
      var radius = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h, 2)) / 5;
      var inZone =
        (px < radius && py < radius) ||                    // top-left
        (px > w - radius && py < radius) ||                // top-right
        (px < radius && py > h - radius) ||                // bottom-left
        (px > w - radius && py > h - radius);              // bottom-right
      if (inZone) {
        FB.shell.classList.add('in-corner');
      } else {
        FB.shell.classList.remove('in-corner');
      }
    });
    FB.shell.addEventListener('mouseleave', function () {
      if (FB.shell) FB.shell.classList.remove('in-corner');
    });
  }

  // Expose for use by flipbook-init.js
  window.Flipbook.attachFlipEvents = attachFlipEvents;
  window.Flipbook.scheduleAutoTease = scheduleAutoTease;
  window.Flipbook.centerBook = centerBook;
  window.Flipbook.attachHotzoneCursor = attachHotzoneCursor;
})();
