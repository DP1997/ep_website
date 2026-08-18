// Fore-edge staircase strip painting utilities.
// Depends on flipbook-config.js (window.Flipbook namespace).
(function () {
  'use strict';
  if (window.__FB_STAIRS_LOADED) return;
  var FB = window.Flipbook;
  if (!FB) return;
  window.__FB_STAIRS_LOADED = true;

  var LINE_STEP   = 2.0;   // px per line (line + gap)
  var LINE_WIDTH  = 0.75;  // slightly thicker for more definition
  var LINE_COLOR  = '#444'; // dark gray
  var ANGLE_DEPTH = 14;    // px for clip-path angle

  // Get the bounding rect of the first visible .stf__item (actual rendered page).
  // This accounts for StPageFlip's internal centering offsets.
  function getVisibleBookRect() {
    var items = FB.book.querySelectorAll('.stf__item');
    for (var i = 0; i < items.length; i++) {
      var r = items[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return r;
      }
    }
    var wrap = FB.book.querySelector('.stf__wrapper');
    if (wrap) return wrap.getBoundingClientRect();
    return FB.book.getBoundingClientRect();
  }

  function paintStaircase(canvas, count, stripH, dir) {
    if (count <= 0 || stripH <= 0) {
      canvas.width = 0; canvas.height = 0; return 0;
    }
    // dir: -1 = shadow extends leftward (left strip), +1 = rightward (right strip)
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
      var depth = (i + 1) / count;
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

      function linesFor(count) {
        if (count <= 0) return 0;
        // Roughly half the pages as strips for a cleaner look
        return Math.max(0, Math.floor(count / 2));
      }

  // Expose API
  FB.getVisibleBookRect = getVisibleBookRect;
  FB.paintStaircase     = paintStaircase;
  FB.clipPathRight      = clipPathRight;
  FB.clipPathLeft       = clipPathLeft;
  FB.linesFor           = linesFor;
  FB.LINE_STEP          = LINE_STEP;
  FB.LINE_WIDTH         = LINE_WIDTH;
  FB.LINE_COLOR         = LINE_COLOR;
  FB.ANGLE_DEPTH        = ANGLE_DEPTH;
})();
