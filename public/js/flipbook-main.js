// StPageFlip initialization, event binding, resize handling, and boot sequence.
// Depends on flipbook-config.js, flipbook-pdf.js, flipbook-stairs.js, flipbook-spine.js
(function () {
  'use strict';
  var FB = window.Flipbook;
  if (!FB) return;

  function centerBook() {
    if (!FB.book || !FB.flip) return;
    var rect = FB.flip.getBoundsRect();
    var ph = rect.height;
    var bookH = FB.book.clientHeight;
    var pad = Math.max(0, Math.floor((bookH - ph) / 2));
    FB.book.style.paddingTop = pad + 'px';
    FB.book.style.paddingBottom = pad + 'px';
  }

  function initFlip(sizes) {
    var pw = sizes.pw, ph = sizes.ph;
    FB.pageW = pw; FB.pageH = ph;

    var St = window.St;
    if (!St || !St.PageFlip) {
      FB.loader.innerHTML = '<p style="color:#a33;text-align:center;padding:2rem">StPageFlip not loaded.</p>';
      return;
    }

    FB.flip = new St.PageFlip(FB.book, {
      width:       pw,
      height:      ph,
      size:        'fixed',
      minWidth:    pw,
      maxWidth:    pw * 2,
      minHeight:   ph,
      maxHeight:   ph,
      showCover:   true,
      drawShadow:  true,
      flippingTime: 800,
      startZIndex: 0,
      autoSize:    true,
      usePortrait: false,
      swipeDistance: 30,
      useMouseEvents: true,
      mobileScrollSupport: true,
      clickEventForward: false,
      showPageCorners: true,
      disableFlipByClick: false,
    });

    var elements = FB.pageEls.map(function (p) { return p.el; });
    FB.flip.loadFromHTML(elements);

    // Keep front and back covers hard (rigid) — soft covers cause duplicate
    // page ghost previews at edges because StPageFlip reuses the same page as
    // the temporary copy for the bending deformation
    var pages = FB.flip.getPageCollection().getPages();
    if (pages.length > 0) pages[0].setDensity('hard');
    if (pages.length > 1) pages[pages.length - 1].setDensity('hard');

    // ---- Event handlers ----

    FB.flip.on('flip', function (e) {
      var page = e.data;
      FB.currentPageNum = page + 1;
      history.replaceState(null, '', '#page=' + FB.currentPageNum);
      FB.syncStrips(FB.currentPageNum);
      FB.syncSpine();
      var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
      FB.renderWindow(spreadIdx).catch(function (err) {
        console.error('Flipbook render error:', err);
      });
    });

    FB.flip.on('init', function () {
      centerBook();
      FB.syncSpine();
      FB.currentPageNum = 1;
      FB.syncStrips(1);
      var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
      FB.renderWindow(spreadIdx).then(function () {
        FB.loader.classList.add('out');
      });
    });

    FB.flip.on('changeState', function (e) {
      var state = e.data;
      console.log('[STATE]', state, 'page=', FB.currentPageNum);
      if (state === 'read') {
        if (FB.spineEl) FB.spineEl.style.opacity = String(FB.getSpineOpacity('read', -1, FB.currentPageNum));
        FB.syncSpine();
        FB.syncStrips(FB.currentPageNum);
      }
    });

    // Poll during flips for frame-synced spine/strip updates
    (function pollSpine() {
      FB.updateShadowVisibility();
      requestAnimationFrame(pollSpine);
    })();

    // Keyboard nav
    document.addEventListener('keydown', function (e) {
      if (!FB.flip) return;
      if (e.key === 'ArrowLeft')  FB.flip.flipPrev('bottom');
      if (e.key === 'ArrowRight') FB.flip.flipNext('bottom');
    });

    // ---- Resize handler ----
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!FB.flip) return;
        var newSizes = FB.getSizes(FB.pageAR);
        FB.pageW = newSizes.pw; FB.pageH = newSizes.ph;

        FB.flip.destroy();

        FB.book = document.createElement('div');
        FB.book.id = 'fb-book';
        FB.shell.appendChild(FB.book);

        FB.buildPages(FB.totalPages, FB.pageW, FB.pageH);

        FB.flip = new St.PageFlip(FB.book, {
          width:       FB.pageW,
          height:      FB.pageH,
          size:        'fixed',
          minWidth:    FB.pageW,
          maxWidth:    FB.pageW * 2,
          minHeight:   FB.pageH,
          maxHeight:   FB.pageH,
          showCover:   true,
          drawShadow:  true,
          flippingTime: 800,
          startZIndex: 0,
          autoSize:    true,
          usePortrait: false,
          swipeDistance: 30,
          useMouseEvents: true,
          mobileScrollSupport: true,
          clickEventForward: false,
          showPageCorners: true,
          disableFlipByClick: false,
        });

        var newEls = FB.pageEls.map(function (p) { return p.el; });
        FB.flip.loadFromHTML(newEls);

        // Keep covers hard
        pages = FB.flip.getPageCollection().getPages();
        if (pages.length > 0) pages[0].setDensity('hard');
        if (pages.length > 1) pages[pages.length - 1].setDensity('hard');

        FB.flip.on('flip', function (e) {
          var page = e.data;
          FB.currentPageNum = page + 1;
          history.replaceState(null, '', '#page=' + FB.currentPageNum);
          FB.syncStrips(FB.currentPageNum);
          FB.syncSpine();
          var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
          FB.renderWindow(spreadIdx).catch(console.error);
        });

        FB.flip.on('init', function () {
          centerBook();
          FB.syncSpine();
          FB.currentPageNum = 1;
          FB.syncStrips(1);
          var spreadIdx = FB.flip.getPageCollection().getCurrentSpreadIndex();
          FB.renderWindow(spreadIdx).then(function () {
            FB.loader.classList.add('out');
          });
        });

        FB.flip.on('changeState', function (e) {
          var state = e.data;
          console.log('[STATE]', state, 'page=', FB.currentPageNum);
          if (state === 'read') {
            if (FB.spineEl) FB.spineEl.style.opacity = String(FB.getSpineOpacity('read', -1, FB.currentPageNum));
            FB.syncSpine();
            FB.syncStrips(FB.currentPageNum);
          }
        });

        (function pollResize() {
          FB.updateShadowVisibility();
          requestAnimationFrame(pollResize);
        })();
      }, 300);
    });
  }

  // Boot
  FB.loadAndInit(initFlip);
})();
