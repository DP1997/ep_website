// flipbook-spine-state.js - State management for spine shadows
(function () {
  'use strict';
  if (window.__FB_SPINE_STATE_LOADED) return;
  var FB = window.Flipbook;
  if (!FB) return;
  window.__FB_SPINE_STATE_LOADED = true;

  var anchorPage = null, flipFromPage = null, flipToPage = null, isDragging = false;
  var lastFlipDirection = null, lastFlipMethod = null;

  // Sync local anchorPage with FB.anchorPage (set by flipbook-events.js on flip completion)
  function syncAnchorFromFB() {
    if (FB.anchorPage && FB.anchorPage !== anchorPage) {
      anchorPage = FB.anchorPage;
    }
  }

  function updateShadowVisibility() {
    if (!FB.flip || !FB.getSpineOpacity || !FB.getSpineRefs || !FB.renderStrips) return;
    try {
      syncAnchorFromFB();
      var ctrl = FB.flip.flipController;
      var state = ctrl && ctrl.getState ? ctrl.getState() : 'no-ctrl';
      var calc = ctrl && ctrl.getCalculation ? ctrl.getCalculation() : null;
      var progress = calc && calc.getFlippingProgress ? calc.getFlippingProgress() : -1;
      var basePage = anchorPage || FB.currentPageNum;
      var r = FB.getSpineRefs();
      if (r.spine) r.spine.style.opacity = String(FB.getSpineOpacity(state, progress, basePage));

      if ((state === 'flipping' || state === 'user_fold' || state === 'fold_corner') && calc) {
        var dir = calc.getDirection ? calc.getDirection() : 0;
        var isForward = (dir === 0);

        if (flipFromPage === null) {
          if (isForward) { flipFromPage = basePage; flipToPage = basePage + 1; }
          else { flipFromPage = basePage - 1; flipToPage = flipFromPage; }
          anchorPage = isForward ? basePage : flipFromPage;
          isDragging = (state === 'user_fold');
          lastFlipDirection = isForward ? 'FORWARD' : 'BACKWARD';
          lastFlipMethod = isDragging ? 'DRAG' : 'CLICK';

          // Notify flipbook-events.js about flip direction so changeState
          // can derive the correct page number for BACKWARD flips
          if (FB.setLastFlipDirection) {
            FB.setLastFlipDirection(isForward ? 'forward' : 'backward');
          }
        }

        if (!isDragging && state === 'fold_corner') { FB.syncStrips(anchorPage); return; }

        var lin = progress / 100, fL, fR;
        if (isForward) { fL = Math.max(0, flipFromPage - 1); fR = FB.totalPages - flipToPage; }
        else { fL = Math.max(0, flipFromPage - 1); fR = FB.totalPages - flipFromPage - 1; }

        var cL, cR;
        if (lin < 0.95) { cL = FB.linesFor(fL); cR = FB.linesFor(fR); }
        else { cL = FB.linesFor(fL + (isForward ? 1 : 0)); cR = FB.linesFor(fR); }

        FB.renderStrips(cL, cR);

        if (isDragging && state === 'user_fold') {
          var hc = (anchorPage===1||anchorPage===FB.totalPages||flipToPage===1||flipToPage===FB.totalPages);
          if (hc && progress>=80 && FB.shell) FB.shell.classList.add('hide-left-strip','hide-right-strip');
        }
      }
      else if (state === 'read') {
        FB.syncStrips(FB.currentPageNum);
        flipFromPage = flipToPage = null; isDragging = false;
        lastFlipDirection = lastFlipMethod = null;
        if (FB.shell) FB.shell.classList.remove('hide-left-strip','hide-right-strip');
      }
    } catch(e) { console.error('[spine-state]', e); }
  }
  FB.updateShadowVisibility = updateShadowVisibility;
})();
