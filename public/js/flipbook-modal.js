  (function() {
    var modal = document.getElementById('fb-modal');
    var content = document.getElementById('fb-modal-content');
    var toolbar = document.getElementById('fb-modal-toolbar');
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
      content.innerHTML = '';
    }

    // ---- Keyboard hint: shows once per session if user hasn't interacted ----
    function scheduleHint() {
      console.log('[flipbook-modal] scheduleHint called');
      if (sessionStorage.getItem('fb_hint_shown')) { console.log('[flipbook-modal] hint already shown'); return; }
      hintShown = false;

      hintTimer = setTimeout(function() {
        var hint = document.getElementById('fb-hint');
        console.log('[flipbook-modal] hint timer fired, hintEl=', !!hint, 'hintShown=', hintShown);
        if (!hint || hintShown) return;
        hint.classList.add('visible');
        hintShown = true;
        console.log('[flipbook-modal] hint shown');
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
      console.log('[flipbook-modal] dismissHint, hintEl=', !!hint);
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
      content.innerHTML = '';
    });

    function initFlipbookInModal() {
      // Destroy any existing flipbook instance
      if (window.Flipbook && window.Flipbook.flip) {
        try { window.Flipbook.flip.destroy(); } catch(e) {}
      }
      window.Flipbook = null;

      // Wait for PDF.js and StPageFlip to be available, then init
      function waitForLibs(cb, tries) {
        if (tries == null) tries = 0;
        if (window.pdfjsLib && window.St && window.St.PageFlip) {
          cb();
          return;
        }
        if (tries > 60) { // ~3s timeout
          console.error('Flipbook: PDF.js or StPageFlip failed to load');
          return;
        }
        setTimeout(function() { waitForLibs(cb, tries + 1); }, 50);
      }

      function doInit() {
        // If modules are already loaded, just call __initFlipbook
        var hasModules = window.Flipbook && typeof window.Flipbook.loadAndInit === 'function';
        if (hasModules && typeof window.__initFlipbook === 'function') {
          window.__initFlipbook();
          return;
        }
        // Load module scripts fresh
        var scripts = [
          '/js/flipbook-config.js?v=50',
          '/js/flipbook-pdf.js?v=50',
          '/js/flipbook-stairs.js?v=50',
          '/js/flipbook-spine.js?v=50',
          '/js/flipbook-main.js?v=50'
        ];
        var loaded = 0;
        function checkDone() {
          loaded++;
          if (loaded === scripts.length && typeof window.__initFlipbook === 'function') {
            window.__initFlipbook();
          }
        }
        scripts.forEach(function(src) {
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
        window.Flipbook = null;
      };
    }
  })();
