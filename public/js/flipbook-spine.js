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
    var foldShadow  = document.getElementById('fb-fold-shadow');
    var gloss       = document.getElementById('fb-gloss');
    var groundShadow = document.getElementById('fb-ground-shadow');
    return { spine: spine, stripLeft: stripLeft, stripRight: stripRight,
             canvasLeft: canvasLeft, canvasRight: canvasRight,
             foldShadow: foldShadow, gloss: gloss, groundShadow: groundShadow };
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
  // hiddenInner: number of lines adjacent to the book spine that are currently
  // covered by the lifted hardcover — these are skipped so the shadow strips
  // don't wander into the fold preview. (Right strip: inner lines are the first;
  // left strip: inner lines are the last.)
  function paintStaircase(canvas, count, stripH, dir, hiddenInner) {
    hiddenInner = Math.max(0, hiddenInner || 0);
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
      if (dir === 1 && i < hiddenInner) continue;        // right: skip inner lines
      if (dir === -1 && i >= count - hiddenInner) continue; // left: skip inner lines
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

  // Compute how many inner strip lines are currently covered by the hardcover.
  // The hardcover sits slightly wider than the page (it has a white edge and
  // grows toward the reader when lifted), so it physically covers the innermost
  // staircase lines on its side. Applies in BOTH rest and fold states so the
  // covered lines never show through the cover edge.
  function computeCoverOverlap() {
    var hiddenL = 0, hiddenR = 0;
    if (!FB.book || !FB.flip) return { hiddenL: hiddenL, hiddenR: hiddenR };
    // StPageFlip keeps zero-sized placeholder hardcover nodes around after a
    // flip; pick the first hardcover that is actually laid out.
    var hards = FB.book.querySelectorAll('.stf__item.--hard, .stf__item.--right.--hard, .stf__item.--left.--hard');
    var hard = null;
    for (var i = 0; i < hards.length; i++) {
      var hrT = hards[i].getBoundingClientRect();
      if (hrT.width > 0 && hrT.height > 0) { hard = hards[i]; break; }
    }
    if (!hard) return { hiddenL: hiddenL, hiddenR: hiddenR };
    var hr = hard.getBoundingClientRect();
    var stripRight = document.getElementById('fb-strip-right');
    var stripLeft = document.getElementById('fb-strip-left');
    if (stripRight) {
      var sr = stripRight.getBoundingClientRect();
      hiddenR = Math.max(0, Math.ceil((hr.right - sr.left) / LINE_STEP));
    }
    if (stripLeft) {
      var sl = stripLeft.getBoundingClientRect();
      hiddenL = Math.max(0, Math.ceil((sl.right - hr.left) / LINE_STEP));
    }
    return { hiddenL: hiddenL, hiddenR: hiddenR };
  }

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

  // Soft elliptical shadow under the whole book — grounds it on the page.
  function syncGroundShadow() {
    var r = getSpineRefs();
    if (!r.groundShadow || !FB.flip || !FB.shell) return;
    var shellRect = FB.shell.getBoundingClientRect();
    var wrap = FB.book.querySelector('.stf__wrapper');
    var wrapRect = wrap ? wrap.getBoundingClientRect() : getVisibleBookRect();
    if (!wrapRect || wrapRect.width === 0 || wrapRect.height === 0) return;
    var w = wrapRect.width;
    var h = wrapRect.height;
    // Offset slightly below the book, wider than it, fading at the edges.
    r.groundShadow.style.left = (wrapRect.left - shellRect.left - w * 0.06) + 'px';
    r.groundShadow.style.top  = (wrapRect.top  - shellRect.top + h * 0.15) + 'px';
    r.groundShadow.style.width  = (w * 1.12) + 'px';
    r.groundShadow.style.height = (h * 0.16) + 'px';
  }

  // Fold shadow + gloss band following the lifting/folding page. Width and
  // opacity animate with flip progress; the shadow grows on the opposite
  // half while the gloss sweeps over the curvature.
  function updateFoldVisuals(state, progress, isForward) {
    var r = getSpineRefs();
    if (!r.foldShadow || !r.gloss || !FB.flip) return;
    var shellRect = FB.shell.getBoundingClientRect();
    var wrap = FB.book.querySelector('.stf__wrapper');
    var wrapRect = wrap ? wrap.getBoundingClientRect() : getVisibleBookRect();
    if (!wrapRect || wrapRect.width === 0 || wrapRect.height === 0) return;

    var isFolding = (state === 'flipping' || state === 'user_fold');
    var p = Math.max(0, Math.min(100, progress));

    // Fold shadow: cast onto the opposite half, strongest mid-flip.
    if (isFolding) {
      var so = Math.sin((p / 100) * Math.PI);            // 0 -> 1 -> 0
      var baseOp = 0.22 * so;
      var shadowW = Math.max(20, wrapRect.width * 0.27 * so);
      var left, top = (wrapRect.top - shellRect.top);

      if (isForward) {
        // page lifts from the right half -> shadow on the right edge fading inward
        left = (wrapRect.right - shellRect.left - shadowW);
      } else {
        // page lifts from the left half -> shadow on the left edge fading inward
        left = (wrapRect.left - shellRect.left);
      }
      r.foldShadow.style.left   = left + 'px';
      r.foldShadow.style.top    = top + 'px';
      r.foldShadow.style.width  = shadowW + 'px';
      r.foldShadow.style.height = wrapRect.height + 'px';
      r.foldShadow.style.opacity = String(baseOp);
    } else {
      r.foldShadow.style.opacity = '0';
    }

    // Gloss: bright band sweeping across the folding page curvature.
    if (isFolding) {
      var bandW = wrapRect.width * 0.18;
      var cx;
      if (isForward) {
        // sweep from right toward left while flipping
        cx = (wrapRect.right - shellRect.left) - (p / 100) * wrapRect.width * 0.55;
      } else {
        cx = (wrapRect.left - shellRect.left) + (p / 100) * wrapRect.width * 0.55;
      }
      r.gloss.style.left   = (cx - bandW / 2) + 'px';
      r.gloss.style.top    = (wrapRect.top - shellRect.top) + 'px';
      r.gloss.style.width  = bandW + 'px';
      r.gloss.style.height = wrapRect.height + 'px';
      r.gloss.style.opacity = String(0.45 * so);
    } else {
      r.gloss.style.opacity = '0';
    }
  }

  // Sync strip line counts to the current spread.
  function syncStrips() {
    var r = getSpineRefs();
    if (!r.stripLeft || !r.stripRight || !r.canvasLeft || !r.canvasRight || !FB.flip || !FB.shell) return;
    var counts = getStripCounts();
    // Apply cover overlap even at rest so the innermost covered line never
    // shows through the hardcover's white edge (matches the fold behavior).
    var ov = computeCoverOverlap();
    renderStrips(linesFor(counts.left), linesFor(counts.right), ov.hiddenL, ov.hiddenR);
  }

  // Render strips with explicit line counts (for animated transitions).
  // hiddenLeft / hiddenRight: number of inner lines to skip (covered by the
  // lifted hardcover during a fold preview).
  function renderStrips(leftLines, rightLines, hiddenLeft, hiddenRight) {
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
      var leftW = paintStaircase(r.canvasLeft, Math.max(1, Math.round(leftLines)), stripH, -1, hiddenLeft || 0);
      r.stripLeft.style.cssText =
        'position:absolute;' +
        'top:' + bookTop + 'px;' +
        'left:' + (bookLeftEdge - leftW) + 'px;' +
        'width:' + leftW + 'px;' +
        'height:' + stripH + 'px;' +
        'pointer-events:none;' +
        'z-index:0;' +
        'clip-path:' + clipPathLeft(depth, stripH) + ';' +
        '-webkit-clip-path:' + clipPathLeft(depth, stripH) + ';';
      r.canvasLeft.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
    }

    // Right strip
    if (rightLines <= 0) {
      r.stripRight.style.display = 'none';
    } else {
      var rightW = paintStaircase(r.canvasRight, Math.max(1, Math.round(rightLines)), stripH, 1, hiddenRight || 0);
      r.stripRight.style.cssText =
        'position:absolute;' +
        'top:' + bookTop + 'px;' +
        'left:' + bookRightEdge + 'px;' +
        'width:' + rightW + 'px;' +
        'height:' + stripH + 'px;' +
        'pointer-events:none;' +
        'z-index:0;' +
        'clip-path:' + clipPathRight(depth, stripH) + ';' +
        '-webkit-clip-path:' + clipPathRight(depth, stripH) + ';';
      r.canvasRight.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
    }
  }

  // ---- Spine opacity: smooth continuous curve + soft read fade-in ----

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Continuous shadow curve. The gutter shadow is strongest while the page
  // lies flat (0°), weakens as it stands upright (~50% progress), then
  // rebuilds as it settles onto the other side. Transitions span 20–30%
  // progress each, eased, so there is no hard 0/1 switch.
  function getSpineOpacity(state, progress, pageNum) {
    // Hide spine when book is closed (front or back cover)
    if (pageNum === 1 || pageNum === FB.totalPages) return 0;
    if (state === 'read' || state === 'fold_corner') return 1;
    if (progress < 0) return 0;
    if (progress < 30) return 1;                    // page still flat
    if (progress < 50) return 1 - easeInOut((progress - 30) / 20); // lifting
    if (progress < 70) return 0;                    // page upright
    if (progress < 100) return easeInOut((progress - 70) / 30);    // settling
    return 1;
  }

  // Smooth fade-in of the spine shadow when a flip settles into 'read',
  // so it "builds up" instead of popping to full strength. Runs once per
  // transition; the rAF poll skips setting opacity while it is active.
  var spineFading = null;
  var lastSpineState = 'no-ctrl';

  function fadeSpineIn(spine) {
    if (spineFading) return;
    var from = parseFloat(spine.style.opacity) || 0;
    if (from >= 0.99) { spine.style.opacity = '1'; return; }
    var t0 = performance.now();
    function step(now) {
      var t = Math.min(1, (now - t0) / 150);
      spine.style.opacity = String(from + (1 - from) * easeInOut(t));
      if (t < 1) {
        spineFading = requestAnimationFrame(step);
      } else {
        spineFading = null;
        spine.style.opacity = '1';
      }
    }
    spineFading = requestAnimationFrame(step);
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

      // Ground shadow (under the book) once per frame — cheap, always synced.
      if (state === 'read') syncGroundShadow();

      // Fold shadow + gloss follow the folding page while animating.
      var dir = calc && calc.getDirection ? calc.getDirection() : 0;
      updateFoldVisuals(state, progress, dir === 0);

      // Trigger a smooth fade-in when a flip settles into 'read', and let the
      // fade own the opacity until it finishes. During the fade, skip the
      // per-frame assignment to avoid fighting the animation.
      if (state === 'read' && lastSpineState !== 'read' && !spineFading) {
        if (r.spine) fadeSpineIn(r.spine);
      }
      if (!spineFading && r.spine) {
        r.spine.style.opacity = String(getSpineOpacity(state, progress, physicalPage));
      }
      lastSpineState = state;

      // Only actual flips (click/drag/keyboard) reduce the source strip.
      // 'fold_corner' is a mere corner-hover preview and must NOT touch strips.
      if ((state === 'flipping' || state === 'user_fold') && calc) {
        var dir = calc.getDirection ? calc.getDirection() : 0;
        var isForward = (dir === 0);

        // Only real flips reduce the source strip instantly (the page is fully
        // moved away). During a fold preview (auto-tease) the hardcover only
        // partially covers the strip — the frame-wise overlap calculation
        // below hides exactly the covered lines, so the animation runs
        // smoothly. A genuine user drag also keeps counts live.
        var cL = counts.left, cR = counts.right;
        if (state === 'flipping' || (state === 'user_fold' && !FB.autoTeaseActive)) {
          if (isForward) {
            cR = Math.max(0, counts.right - 1);
          } else {
            cL = Math.max(0, counts.left - 1);
          }
        }

        // While the hardcover is lifted, it grows toward the reader and
        // physically covers the inner strip lines on its side. Compute the
        // overlap in X so only those covered lines are hidden — the outer
        // lines remain visible.
        var ov = computeCoverOverlap();

        renderStrips(linesFor(cL), linesFor(cR), ov.hiddenL, ov.hiddenR);

        if (state === 'user_fold') {
          // The lifted page covers the fore-edge strips on its side — hide
          // them so the staircase shadows don't wander into the fold preview.
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
  FB.syncGroundShadow   = syncGroundShadow;
  FB.updateFoldVisuals  = updateFoldVisuals;
  FB.syncStrips         = syncStrips;
  FB.renderStrips       = renderStrips;
  FB.computeCoverOverlap = computeCoverOverlap;
  FB.getSpineOpacity    = getSpineOpacity;
  FB.updateShadowVisibility = updateShadowVisibility;
  FB.LINE_STEP          = LINE_STEP;
  FB.LINE_WIDTH         = LINE_WIDTH;
  FB.LINE_COLOR         = LINE_COLOR;
  FB.ANGLE_DEPTH        = ANGLE_DEPTH;
})();
