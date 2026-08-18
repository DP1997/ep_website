  (function() {
    if (window.__FB_MODAL_LOADED) return;
    window.__FB_MODAL_LOADED = true;

    var modal = document.getElementById('fb-modal');
    var content = document.getElementById('fb-modal-content');
    var closeBtn = modal.querySelector('.fb-btn-close');
    var downloadBtn = document.getElementById('fb-download');
    var progressFill = document.getElementById('fb-progress-fill');

    if (!modal || !content) return;

        var currentCleanup = null;
    var hintTimer = null;
    var hintShown = false;

    function updateProgress(current, total) {
      if (!progressFill) return;
      var pct = total > 0 ? Math.round((current / total) * 100) : 0;
      progressFill.style.width = pct + '%';
      progressFill.setAttribute('aria-valuenow', String(current));
      progressFill.setAttribute('aria-valuemax', String(total));
    }

    function openModal(catalogId) {
      var cfg = window.__CATALOGS && window.__CATALOGS[catalogId];
      if (!cfg) return;

      document.body.style.overflow = 'hidden';

      // Set download link to current catalog PDF
      if (downloadBtn && cfg.pdf) {
        downloadBtn.href = cfg.pdf;
        downloadBtn.style.display = '';
      } else if (downloadBtn) {
        downloadBtn.style.display = 'none';
      }

      // Reset progress bar
      updateProgress(1, 1);

      // Build flipbook HTML inside modal
      content.innerHTML =
        '<div class="flipbook-shell" data-pdf-url="' + cfg.pdf + '">' +
          '<div class="fb-loader" id="fb-loader"><div class="fb-loader-anim">' +
            '<div class="fb-lp fb-lp--back"></div>' +
            '<div class="fb-lp fb-lp--front"></div>' +
          '</div></div>' +
          '<div id="fb-book"></div>' +
          '<div id="fb-spine" class="spine-hidden"></div>' +
          '<div id="fb-strip-left"><canvas></canvas></div>' +
          '<div id="fb-strip-right"><canvas></canvas></div>' +
          '<div id="fb-ripple" class="fb-ripple" aria-hidden="true"></div>' +

        '</div>' +
        '<div class="fb-hint-overlay" id="fb-hint" aria-hidden="true">' +
          '<kbd>←</kbd><span class="fb-hint-text">Seiten blättern</span><kbd>→</kbd>' +
        '</div>';

      modal.showModal();

      requestAnimationFrame(function() {
        initFlipbookInModal();
        scheduleHint();
      });
    }

        function closeModal() {
      if (!modal.open) return;
      dismissHint();
      modal.close();
      document.body.style.overflow = '';
      if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
      }
      // OPTIMIZATION: Don't clear content immediately, keep flipbook in memory
      // content.innerHTML = '';
    }

    // ---- Keyboard hint: shows once per session if user hasn't interacted ----
    function scheduleHint() {
      if (sessionStorage.getItem('fb_hint_shown')) return;
      hintShown = false;

      hintTimer = setTimeout(function() {
        var hint = document.getElementById('fb-hint');
        if (!hint || hintShown) return;
        hint.classList.add('visible');
        hintShown = true;
        // Auto-dismiss after 5s even if no interaction
        setTimeout(dismissHint, 5000);
      }, 3000);

      // Dismiss on first interaction anywhere in modal
      var dismissEvents = ['click', 'keydown', 'touchstart'];
      function onInteract() {
        dismissHint();
        dismissEvents.forEach(function(evt) {
          modal.removeEventListener(evt, onInteract);
        });
      }
      dismissEvents.forEach(function(evt) {
        modal.addEventListener(evt, onInteract, { passive: true });
      });
    }

    function dismissHint() {
      clearTimeout(hintTimer);
      var hint = document.getElementById('fb-hint');
      if (hint) {
        hint.classList.remove('visible');
        hint.classList.add('dismissed');
      }
      sessionStorage.setItem('fb_hint_shown', '1');
    }

    window.openCatalogModal = openModal;
      window.closeCatalogModal = closeModal;
      window.updateFlipbookProgress = updateProgress;

    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

        modal.addEventListener('close', function() {
      document.body.style.overflow = '';
      if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
      }
      // OPTIMIZATION: Keep flipbook in memory, don't destroy on close
      // content.innerHTML = '';
    });

        function initFlipbookInModal() {
      // Destroy any existing flipbook instance but keep scripts loaded
      if (window.Flipbook && window.Flipbook.flip) {
        try { window.Flipbook.flip.destroy(); } catch(e) {}
      }
      // OPTIMIZATION: Keep Flipbook namespace, just reset state
      if (window.Flipbook) {
        window.Flipbook.flip = null;
        window.Flipbook.currentPageNum = 1;
        window.Flipbook.anchorPage = null;
      }

      // OPTIMIZATION: Check if scripts are already loaded
      var hasModules = window.Flipbook && typeof window.Flipbook.loadAndInit === 'function';
      var hasPdfJs = window.pdfjsLib !== undefined;
      var hasStPageFlip = window.St && window.St.PageFlip !== undefined;
      
      // If everything is already loaded, just re-initialize
      if (hasModules && hasPdfJs && hasStPageFlip && typeof window.__initFlipbook === 'function') {
        window.__initFlipbook();
        return;
      }

      // OPTIMIZATION: Wait for libs with faster timeout (1s instead of 3s, 10ms instead of 50ms)
      function waitForLibs(cb, tries) {
        if (tries == null) tries = 0;
        if (window.pdfjsLib && window.St && window.St.PageFlip) {
          cb();
          return;
        }
        if (tries > 100) { // ~1s timeout (was 60 * 50ms = 3s)
          console.error('Flipbook: PDF.js or StPageFlip failed to load');
          return;
        }
        setTimeout(function() { waitForLibs(cb, tries + 1); }, 10); // 10ms interval (was 50ms)
      }

      function doInit() {
        // Load module scripts only if not already loaded.
        // NOTE: BaseLayout.astro normally loads all modules at page load, so this
        // is a fallback path. Version comes from window.__FLIPBOOK_VERSION
        // (set by BaseLayout.astro / FlipbookViewer.astro from the shared source).
        var v = window.__FLIPBOOK_VERSION || '1.1.0';
        var scripts = [
          '/js/flipbook-config.js?v=' + v,
          '/js/flipbook-pdf.js?v=' + v,
          '/js/flipbook-spine.js?v=' + v,
          '/js/flipbook-events.js?v=' + v,
          '/js/flipbook-init.js?v=' + v
        ];
        var pending = [];

        // OPTIMIZATION: Check which scripts are already in DOM
        scripts.forEach(function(src) {
          var existing = document.querySelector('script[src="' + src + '"]');
          if (!existing) pending.push(src);
        });

        // If all scripts already exist, just init
        if (pending.length === 0 && typeof window.__initFlipbook === 'function') {
          window.__initFlipbook();
          return;
        }

        var remaining = pending.length;
        function checkDone() {
          remaining--;
          if (remaining === 0 && typeof window.__initFlipbook === 'function') {
            window.__initFlipbook();
          }
        }

        // Only load scripts that aren't already in DOM
        pending.forEach(function(src) {
          var s = document.createElement('script');
          s.src = src;
          s.onload = checkDone;
          s.onerror = function() {
            console.error('Failed to load flipbook module:', src);
            checkDone();
          };
          document.head.appendChild(s);
        });
      }

      waitForLibs(doInit);

      currentCleanup = function() {
        if (window.Flipbook && window.Flipbook.flip) {
          try { window.Flipbook.flip.destroy(); } catch(e) {}
        }
        // OPTIMIZATION: Don't nullify Flipbook, keep it for next open
        // window.Flipbook = null;
      };
    }
  })();
