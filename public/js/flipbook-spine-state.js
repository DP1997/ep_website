// flipbook-spine-state.js - State management for spine shadows
(function () {
  'use strict';
  if (window.__FB_SPINE_STATE_LOADED) return;
  var FB = window.Flipbook;
  if (!FB) return;
  window.__FB_SPINE_STATE_LOADED = true;

  function updateShadowVisibility() {
    if (!FB.flip || !FB.getSpineOpacity || !FB.getSpineRefs || !FB.renderStrips) return;
    try {
      var ctrl = FB.flip.flipController;
      var state = ctrl && ctrl.getState ? ctrl.getState() : 'no-ctrl';
      var calc = ctrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
      var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;
      var r = FB.getSpineRefs();

      // Strip counts are derived from the flip counter in SHEET units
      // (1 sheet = 2 pages = 1 flip), matching the user's mental model.
      var counts = FB.getStripCounts();

      // Spine opacity: physical page = leftmost visible page (1-based).
      var physicalPage = FB.getPhysicalPage();
      if (r.spine) r.spine.style.opacity = String(FB.getSpineOpacity(state, progress, physicalPage));

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
        FB.renderStrips(FB.linesFor(cL), FB.linesFor(cR));

        if (state === 'user_fold') {
          var hc = (counts.left === 0 || counts.right === 0);
          if (hc && progress >= 80 && FB.shell) FB.shell.classList.add('hide-left-strip', 'hide-right-strip');
        }
      }
      else if (state === 'read') {
        FB.syncStrips();
        if (FB.shell) FB.shell.classList.remove('hide-left-strip', 'hide-right-strip');
      }
    } catch (e) { console.error('[spine-state]', e); }
  }
  FB.updateShadowVisibility = updateShadowVisibility;
})();
