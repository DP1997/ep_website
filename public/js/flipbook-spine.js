// flipbook-spine.js
// Fore-edge staircase strips + spine shadow: painting, rendering and state.
// Depends on flipbook-config.js (window.Flipbook namespace).
(function () {
  'use strict';
  if (window.__FB_SPINE_LOADED) return;
  var FB = window.Flipbook;
  if (!FB) return;
  window.__FB_SPINE_LOADED = true;

  // ---- Painting constants ----
  var LINE_STEP   = 2.0;   // px per line (line + gap)
  var LINE_WIDTH  = 0.75;  // slightly thicker for more definition
  var LINE_COLOR  = '#444'; // dark gray
  var ANGLE_DEPTH = 14;    // px for clip-path angle

  // ---- Geometry helpers ----

  // Get the bounding rect of the first visible .stf__item (actual rendered page).
  // This accounts for StPageFlip's internal centering offsets.
  function getVisibleBookRect() {
    var items = FB.book.querySelectorAll('.stf__item');
    for (var i = 0; i < items.length; i++) {
      var r = items[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }
    var wrap = FB.book.querySelector('.stf__wrapper');
    if (wrap) return wrap.getBoundingClientRect();
    return FB.book.getBoundingClientRect();
  }

  // Get DOM references for spine and strip elements.
  function getSpineRefs() {
    var spine       = document.getElementById('fb-spine');
    var stripLeft   = document.getElementById('fb-strip-left');
    var stripRight  = document.getElementById('fb-strip-right');
    var canvasLeft  = stripLeft  ? stripLeft.querySelector('canvas')  : null;
    var canvasRight = stripRight ? stripRight.querySelector('canvas') : null;
    return { spine: spine, stripLeft: stripLeft, stripRight: stripRight,
             canvasLeft: canvasLeft, canvasRight: canvasRight };
  }

  // ---- Strip count derivation ----

  // Derive the number of SHEETS (leaves) stacked on each half.
  // One sheet = two pages, so each flip moves exactly one sheet. This is the
  // "coarser" abstraction the user expects: one strip per flip, not per page.
  // Derived from the flip counter (currentPageNum), which advances by 1 per
  // completed flip — independent of the spread structure (which jumps by 2).
  function getStripCounts() {
    var totalSheets = Math.ceil(FB.totalPages / 2);
    var left  = Math.max(0, FB.currentPageNum - 1);
    var right = Math.max(0, totalSheets - left);
    return { left: left, right: right };
  }

  // 1-based physical page number of the leftmost visible page, used only for
  // spine-opacity (hide spine at the front/back cover).
  function getPhysicalPage() {
    if (!FB.flip) return 1;
    var pc = FB.flip.getPageCollection();
    var spread = pc.getSpread()[pc.getCurrentSpreadIndex()];
    if (!spread || spread.length === 0) return 1;
    return spread[0] + 1;
  }

  // 1:1 mapping — each sheet is exactly one strip.
  function linesFor(count) {
    return count <= 0 ? 0 : count;
  }

  // ---- Painting ----

  // Paint a staircase of page-edge lines with soft shadows onto a canvas.
  // dir: -1 = shadow extends leftward (left strip), +1 = rightward (right strip).
  function paintStaircase(canvas, count, stripH, dir) {
    if (count <= 0 || stripH <= 0) {
      canvas.width = 0; canvas.height = 0; return 0;
    }
    var maxShadow = Math.min(14, count * 0.8); // shorter, gentler scaling
    var shadowW = Math.ceil(maxShadow);
    var lineW = Math.ceil(count * LINE_STEP);
    var totalW = lineW + shadowW;
    var h = Math.round(stripH);
    canvas.width = totalW; canvas.height = h;
    canvas.style.width = totalW + 'px'; canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, totalW, h);
    var xOffset = dir === -1 ? shadowW : 0;
    var GAP = 1.0; // px gap between line and shadow start
    for (var i = 0; i < count; i++) {
      var x = xOffset + i * LINE_STEP;
      // Depth grows toward the fore-edge (outer edge) so the outermost page
      // casts the deepest shadow:
      // - right strip (dir +1): fore-edge on the right -> depth grows with i
      // - left strip  (dir -1): fore-edge on the left  -> depth shrinks with i
      var depth = (dir === -1) ? (count - i) / count : (i + 1) / count;
      var sLen = depth * maxShadow;
      if (sLen > GAP + 0.5) {
        // Gradient start is GAP px away from line for softer transition
        var grad = ctx.createLinearGradient(
          dir === -1 ? x - GAP : x + LINE_WIDTH + GAP,
          0,
          dir === -1 ? x - sLen : x + LINE_WIDTH + sLen,
          0
        );
        var so = 0.08 + 0.10 * depth; // stronger: base 0.08, max 0.18
        grad.addColorStop(0, 'rgba(0,0,0,' + so + ')');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        if (dir === -1) {
          ctx.fillRect(x - sLen, 0, sLen - GAP, h);
        } else {
          ctx.fillRect(x + LINE_WIDTH + GAP, 0, sLen - GAP, h);
        }
      }
      ctx.fillStyle = LINE_COLOR;
      ctx.fillRect(x, 0, LINE_WIDTH, h);
    }
    return totalW;
  }

  function clipPathRight(depthPx, stripH) {
    var pct = (depthPx / stripH * 100).toFixed(1);
    return 'polygon(0% 0%, 100% ' + pct + '%, 100% ' + (100 - parseFloat(pct)).toFixed(1) + '%, 0% 100%)';
  }

  function clipPathLeft(depthPx, stripH) {
    var pct = (depthPx / stripH * 100).toFixed(1);
    return 'polygon(0% ' + pct + '%, 100% 0%, 100% 100%, 0% ' + (100 - parseFloat(pct)).toFixed(1) + '%)';
  }

  // ---- Rendering ----

  // Sync spine shadow position to book bounds.
  function syncSpine() {
    var r = getSpineRefs();
    if (!r.spine || !FB.flip || !FB.shell) return;
    var rect = FB.flip.getBoundsRect();
    var shellRect = FB.shell.getBoundingClientRect();
    var visRect = getVisibleBookRect();
    // Try wrapper first; fall back to book rect if StPageFlip hasn't created wrapper yet
    var wrap = FB.book.querySelector('.stf__wrapper');
    var wrapRect = wrap ? wrap.getBoundingClientRect() : visRect;
    // Guard against zero bounds during transition states
    if (!wrapRect || wrapRect.width === 0 || wrapRect.height === 0) return;
    var gutterX = (wrapRect.left - shellRect.left) + rect.width / 2;
    r.spine.style.left   = (gutterX - 60) + 'px';
    r.spine.style.top    = (wrapRect.top - shellRect.top) + 'px';
    r.spine.style.height = rect.height + 'px';
    r.spine.classList.remove('spine-hidden');
  }

  // Sync strip line counts to the current spread.
  function syncStrips() {
    var r = getSpineRefs();
    if (!r.stripLeft || !r.stripRight || !r.canvasLeft || !r.canvasRight || !FB.flip || !FB.shell) return;
    var counts = getStripCounts();
    renderStrips(linesFor(counts.left), linesFor(counts.right));
  }

  // Render strips with explicit line counts (for animated transitions).
  function renderStrips(leftLines, rightLines) {
    var r = getSpineRefs();
    if (!r.stripLeft || !r.stripRight || !r.canvasLeft || !r.canvasRight || !FB.flip || !FB.shell) return;

    var rect   = FB.flip.getBoundsRect();
    var shellRect = FB.shell.getBoundingClientRect();
    var visRect = getVisibleBookRect();
    var stripH = rect.height;  // actual page height, not container height
    var depth  = Math.min(ANGLE_DEPTH, stripH * 0.2);

    // Use wrapper bounds for ALL positioning
    var wrap = FB.book.querySelector('.stf__wrapper');
    var wrapRect = wrap ? wrap.getBoundingClientRect() : visRect;
    if (!wrapRect || wrapRect.width === 0 || wrapRect.height === 0) return;
    var bookTop       = wrapRect.top    - shellRect.top;
    var bookLeftEdge  = wrapRect.left   - shellRect.left;
    var bookRightEdge = wrapRect.right  - shellRect.left;

    // Left strip
    if (leftLines <= 0) {
      r.stripLeft.style.display = 'none';
    } else {
      var leftW = paintStaircase(r.canvasLeft, Math.max(1, Math.round(leftLines)), stripH, -1);
      r.stripLeft.style.cssText =
        'position:absolute;' +
        'top:' + bookTop + 'px;' +
        'left:' + (bookLeftEdge - leftW) + 'px;' +
        'width:' + leftW + 'px;' +
        'height:' + stripH + 'px;' +
        'pointer-events:none;' +
        'z-index:45;' +
        'clip-path:' + clipPathLeft(depth, stripH) + ';' +
        '-webkit-clip-path:' + clipPathLeft(depth, stripH) + ';';
      r.canvasLeft.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
    }

    // Right strip
    if (rightLines <= 0) {
      r.stripRight.style.display = 'none';
    } else {
      var rightW = paintStaircase(r.canvasRight, Math.max(1, Math.round(rightLines)), stripH, 1);
      r.stripRight.style.cssText =
        'position:absolute;' +
        'top:' + bookTop + 'px;' +
        'left:' + bookRightEdge + 'px;' +
        'width:' + rightW + 'px;' +
        'height:' + stripH + 'px;' +
        'pointer-events:none;' +
        'z-index:45;' +
        'clip-path:' + clipPathRight(depth, stripH) + ';' +
        '-webkit-clip-path:' + clipPathRight(depth, stripH) + ';';
      r.canvasRight.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
    }
  }

  // Calculate spine opacity based on state and progress.
  function getSpineOpacity(state, progress, pageNum) {
    // Hide spine when book is closed (front or back cover)
    if (pageNum === 1 || pageNum === FB.totalPages) return 0;
    if (state === 'read' || state === 'fold_corner') return 1;
    if (progress < 0) return 0;
    if (progress < 45) return 1;
    if (progress < 50) return 1 - ((progress - 45) / 5);
    if (progress < 90) return 0;
    if (progress < 95) return (progress - 90) / 5;
    return 1;
  }

  // ---- State (rAF poll) ----

  // Called every animation frame to keep spine opacity and strip counts in
  // sync with the flip controller state.
  function updateShadowVisibility() {
    if (!FB.flip) return;
    try {
      var ctrl = FB.flip.flipController;
      var state = ctrl && ctrl.getState ? ctrl.getState() : 'no-ctrl';
      var calc = ctrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
      var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;
      var r = getSpineRefs();

      var counts = getStripCounts();
      var physicalPage = getPhysicalPage();
      if (r.spine) r.spine.style.opacity = String(getSpineOpacity(state, progress, physicalPage));

      // Only actual flips (click/drag/keyboard) reduce the source strip.
      // 'fold_corner' is a mere corner-hover preview and must NOT touch strips.
      if ((state === 'flipping' || state === 'user_fold') && calc) {
        var dir = calc.getDirection ? calc.getDirection() : 0;
        var isForward = (dir === 0);

        // Source half reduces immediately at flip start; target half increments
        // only when the page fully lands (via the 'read' syncStrips call).
        var cL, cR;
        if (isForward) {
          cL = counts.left;
          cR = Math.max(0, counts.right - 1);
        } else {
          cL = Math.max(0, counts.left - 1);
          cR = counts.right;
        }
        renderStrips(linesFor(cL), linesFor(cR));

        if (state === 'user_fold') {
          var hc = (counts.left === 0 || counts.right === 0);
          if (hc && progress >= 80 && FB.shell) FB.shell.classList.add('hide-left-strip', 'hide-right-strip');
        }
      }
      else if (state === 'read') {
        syncStrips();
        if (FB.shell) FB.shell.classList.remove('hide-left-strip', 'hide-right-strip');
      }
    } catch (e) { console.error('[spine]', e); }
  }

  // ---- Expose API ----
  FB.getVisibleBookRect = getVisibleBookRect;
  FB.getSpineRefs       = getSpineRefs;
  FB.getStripCounts     = getStripCounts;
  FB.getPhysicalPage    = getPhysicalPage;
  FB.linesFor           = linesFor;
  FB.paintStaircase     = paintStaircase;
  FB.clipPathRight      = clipPathRight;
  FB.clipPathLeft       = clipPathLeft;
  FB.syncSpine          = syncSpine;
  FB.syncStrips         = syncStrips;
  FB.renderStrips       = renderStrips;
  FB.getSpineOpacity    = getSpineOpacity;
  FB.updateShadowVisibility = updateShadowVisibility;
  FB.LINE_STEP          = LINE_STEP;
  FB.LINE_WIDTH         = LINE_WIDTH;
  FB.LINE_COLOR         = LINE_COLOR;
  FB.ANGLE_DEPTH        = ANGLE_DEPTH;
})();
