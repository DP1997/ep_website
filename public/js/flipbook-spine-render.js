// flipbook-spine-render.js
// Rendering functions for spine shadow and fore-edge strips.
// Depends on flipbook-config.js and flipbook-stairs.js (window.Flipbook namespace).
(function () {
  'use strict';
  if (window.__FB_SPINE_RENDER_LOADED) return;
  var FB = window.Flipbook;
  if (!FB) return;
  window.__FB_SPINE_RENDER_LOADED = true;

  /**
   * Get DOM references for spine and strip elements
   */
  function getSpineRefs() {
    var spine       = document.getElementById('fb-spine');
    var stripLeft   = document.getElementById('fb-strip-left');
    var stripRight  = document.getElementById('fb-strip-right');
    var canvasLeft  = stripLeft  ? stripLeft.querySelector('canvas')  : null;
    var canvasRight = stripRight ? stripRight.querySelector('canvas') : null;
    return { spine: spine, stripLeft: stripLeft, stripRight: stripRight,
             canvasLeft: canvasLeft, canvasRight: canvasRight };
  }

  /**
   * Sync spine shadow position to book bounds
   */
  function syncSpine() {
    var r = getSpineRefs();
    if (!r.spine || !FB.flip || !FB.shell) return;
    var rect = FB.flip.getBoundsRect();
    var shellRect = FB.shell.getBoundingClientRect();
    var visRect = FB.getVisibleBookRect();
    // Try wrapper first; fall back to book rect if StPageFlip hasn't created wrapper yet
    var wrap = FB.book.querySelector('.stf__wrapper');
    var wrapRect = wrap ? wrap.getBoundingClientRect() : visRect;
    // Guard against zero bounds during transition states
    if (!wrapRect || wrapRect.width === 0 || wrapRect.height === 0) return;
    var gutterX = (wrapRect.left - shellRect.left) + rect.width / 2;
    r.spine.style.left   = (gutterX - 60) + 'px';
    r.spine.style.top    = (wrapRect.top - shellRect.top) + 'px';
    r.spine.style.height = rect.height + 'px';
    // Ensure spine is visible
    r.spine.classList.remove('spine-hidden');
  }

  /**
   * Derive the number of pages physically stacked on each half from the
   * current spread. This is the single source of truth for strip counts and
   * is independent of the simple page counter (which advances by 1 per flip).
   * - left  = pages before the spread's first page
   * - right = pages after the spread's last page
   */
  function getStripCounts() {
    if (!FB.flip) return { left: 0, right: 0 };
    var pc = FB.flip.getPageCollection();
    var spread = pc.getSpread()[pc.getCurrentSpreadIndex()];
    if (!spread || spread.length === 0) return { left: 0, right: 0 };
    var firstPage = spread[0];
    var lastPage  = spread[spread.length - 1];
    return {
      left:  firstPage,
      right: FB.totalPages - 1 - lastPage
    };
  }

  /**
   * Sync strip line counts to the current spread.
   */
  function syncStrips() {
    var r = getSpineRefs();
    if (!r.stripLeft || !r.stripRight || !r.canvasLeft || !r.canvasRight || !FB.flip || !FB.shell) return;

    var counts = getStripCounts();
    renderStrips(FB.linesFor(counts.left), FB.linesFor(counts.right));
  }

  /**
   * Render strips with explicit line counts (for animated transitions)
   * @param {number} leftLines - Number of lines on left side
   * @param {number} rightLines - Number of lines on right side
   */
  function renderStrips(leftLines, rightLines) {
    var r = getSpineRefs();
    if (!r.stripLeft || !r.stripRight || !r.canvasLeft || !r.canvasRight || !FB.flip || !FB.shell) return;

    var rect   = FB.flip.getBoundsRect();
    var shellRect = FB.shell.getBoundingClientRect();
    var visRect = FB.getVisibleBookRect();
    var stripH = rect.height;  // actual page height, not container height
    var depth  = Math.min(FB.ANGLE_DEPTH, stripH * 0.2);

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
      var leftW = FB.paintStaircase(r.canvasLeft, Math.max(1, Math.round(leftLines)), stripH, -1);
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

    // Right strip
    if (rightLines <= 0) {
      r.stripRight.style.display = 'none';
    } else {
      var rightW = FB.paintStaircase(r.canvasRight, Math.max(1, Math.round(rightLines)), stripH, 1);
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

  /**
   * Calculate spine opacity based on state and progress
   * @param {string} state - Current flip state
   * @param {number} progress - Flip progress (0-100)
   * @param {number} pageNum - Current page number
   * @returns {number} Opacity value (0-1)
   */
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

  // Expose rendering API
  FB.getSpineRefs          = getSpineRefs;
  FB.syncSpine             = syncSpine;
  FB.syncStrips            = syncStrips;
  FB.renderStrips          = renderStrips;
  FB.getSpineOpacity       = getSpineOpacity;
  FB.getStripCounts        = getStripCounts;
})();
