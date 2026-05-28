// Spine shadow and fore-edge strip positioning.
// Depends on flipbook-config.js and flipbook-stairs.js (window.Flipbook namespace).
(function () {
  'use strict';
  var FB = window.Flipbook;
  if (!FB) return;

  function getSpineRefs() {
    var spine       = document.getElementById('fb-spine');
    var stripLeft   = document.getElementById('fb-strip-left');
    var stripRight  = document.getElementById('fb-strip-right');
    var canvasLeft  = stripLeft  ? stripLeft.querySelector('canvas')  : null;
    var canvasRight = stripRight ? stripRight.querySelector('canvas') : null;
    return { spine: spine, stripLeft: stripLeft, stripRight: stripRight,
             canvasLeft: canvasLeft, canvasRight: canvasRight };
  }

  function syncSpine() {
    var r = getSpineRefs();
    if (!r.spine || !FB.flip || !FB.shell) return;
    // Skip repositioning during fold preview to prevent visual jumping
    var ctrl = FB.flip.flipController;
    if (ctrl && ctrl.getState && ctrl.getState() === 'fold_corner') return;
    var rect = FB.flip.getBoundsRect();
    var shellRect = FB.shell.getBoundingClientRect();
    var visRect = FB.getVisibleBookRect();
    // Try wrapper first; fall back to book rect if StPageFlip hasn't created wrapper yet
    var wrap = FB.book.querySelector('.stf__wrapper');
    var wrapRect = wrap ? wrap.getBoundingClientRect() : visRect;
    var gutterX = (wrapRect.left - shellRect.left) + rect.width / 2;
    r.spine.style.left   = (gutterX - 60) + 'px';
    r.spine.style.top    = (wrapRect.top - shellRect.top) + 'px';
    r.spine.style.height = rect.height + 'px';
    // Ensure spine is visible
    r.spine.classList.remove('spine-hidden');
  }

  function syncStrips(currentPage, skipPosition) {
    var r = getSpineRefs();
    var startT = performance.now();
    if (!r.stripLeft || !r.stripRight || !r.canvasLeft || !r.canvasRight || !FB.flip || !FB.shell) return;
    // Skip repositioning during fold preview to prevent visual jumping
    var ctrl = FB.flip.flipController;
    if (!skipPosition && ctrl && ctrl.getState && ctrl.getState() === 'fold_corner') return;
    if (currentPage === undefined) currentPage = FB.flip.getPage() + 1;

    var leftCount  = currentPage - 1;
    var rightCount = FB.totalPages - currentPage;
    var leftLines  = FB.linesFor(leftCount);
    var rightLines = FB.linesFor(rightCount);

    var rect   = FB.flip.getBoundsRect();
    var shellRect = FB.shell.getBoundingClientRect();
    var visRect = FB.getVisibleBookRect();
    var stripH = rect.height;  // actual page height, not container height
    var depth  = Math.min(FB.ANGLE_DEPTH, stripH * 0.2);

    // Use wrapper bounds for ALL positioning — .stf__item rects change
    // dynamically during 3D transforms, causing strips to chase moving edges.
    // The wrapper itself stays fixed, giving us reliable book boundaries.
    var wrap = FB.book.querySelector('.stf__wrapper');
    var wrapRect = wrap ? wrap.getBoundingClientRect() : visRect;
    var bookTop       = wrapRect.top    - shellRect.top;
    var bookLeftEdge  = wrapRect.left   - shellRect.left;
    var bookRightEdge = wrapRect.right  - shellRect.left;
    var ctrl = FB.flip.flipController;
    var state = ctrl && ctrl.getState ? ctrl.getState() : 'n/a';
    var calc = ctrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
    var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;

    // Left strip
    if (leftLines <= 0) {
      r.stripLeft.style.display = 'none';
    } else {
      var leftW = FB.paintStaircase(r.canvasLeft, leftLines, stripH, -1);
      if (skipPosition) {
        // During flip: only repaint canvas, keep container position fixed
        r.stripLeft.style.display = '';
      } else {
        r.stripLeft.style.cssText =
          'position:absolute;' +
          'top:' + bookTop + 'px;' +
          'left:' + (bookLeftEdge - leftW) + 'px;' +
          'width:' + leftW + 'px;' +
          'height:' + stripH + 'px;' +
          'pointer-events:none;' +
          'z-index:45;' +
          'clip-path:' + FB.clipPathLeft(depth, stripH) + ';' +
          '-webkit-clip-path:' + FB.clipPathLeft(depth, stripH) + ';';
        r.canvasLeft.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
      }
    }

    // Right strip
    if (rightLines <= 0) {
      r.stripRight.style.display = 'none';
    } else {
      var rightW = FB.paintStaircase(r.canvasRight, rightLines, stripH, 1);
      if (skipPosition) {
        r.stripRight.style.display = '';
      } else {
        r.stripRight.style.cssText =
          'position:absolute;' +
          'top:' + bookTop + 'px;' +
          'left:' + bookRightEdge + 'px;' +
          'width:' + rightW + 'px;' +
          'height:' + stripH + 'px;' +
          'pointer-events:none;' +
          'z-index:45;' +
          'clip-path:' + FB.clipPathRight(depth, stripH) + ';' +
          '-webkit-clip-path:' + FB.clipPathRight(depth, stripH) + ';';
        r.canvasRight.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
      }
    }
  }

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

  function updateShadowVisibility() {
    if (!FB.flip) return;
    var ctrl = FB.flip.flipController;
    var hasCtrl = !!ctrl;
    var state = hasCtrl && ctrl.getState ? ctrl.getState() : 'no-ctrl';
    var calc = hasCtrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
    var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;
    var opacity = getSpineOpacity(state, progress, FB.currentPageNum);
    var r = getSpineRefs();
    if (r.spine) r.spine.style.opacity = String(opacity);

    // During flips, interpolate strip counts so the page being flipped
    // immediately reduces its stack-side line count (prevents lingering
    // single stripe at edges when flipping last/first pages)
    if ((state === 'flipping' || state === 'user_fold') && calc && calc.getDirection) {
      var dir = calc.getDirection();
      // Accelerate virtual transition so line count reaches zero early
      // in the animation (avoids ghost stripe lingering until the end)
      var factor = Math.min(1, progress / 30);
      var virtualPage = FB.currentPageNum + (dir === 0 ? factor : -factor);
      syncStrips(virtualPage, true);
    }
  }

  // Expose API
  FB.syncSpine             = syncSpine;
  FB.syncStrips            = syncStrips;
  FB.getSpineOpacity       = getSpineOpacity;
  FB.updateShadowVisibility = updateShadowVisibility;
  FB.getSpineRefs = getSpineRefs;
})();
