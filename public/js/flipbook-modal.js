  (function() {
    var modal = document.getElementById('fb-modal');
    var content = document.getElementById('fb-modal-content');
    var toolbar = document.getElementById('fb-modal-toolbar');
    var closeBtn = modal.querySelector('.fb-btn-close');
    var downloadBtn = document.getElementById('fb-download');
    var progressFill = document.getElementById('fb-progress-fill');

    if (!modal || !content) return;

    var currentCleanup = null;

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
        '</div>';

      modal.showModal();

      requestAnimationFrame(function() {
        initFlipbookInModal();
      });
    }

    function closeModal() {
      if (!modal.open) return;
      modal.close();
      document.body.style.overflow = '';
      if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
      }
      content.innerHTML = '';
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
          '/js/flipbook-config.js?v=48',
          '/js/flipbook-pdf.js?v=48',
          '/js/flipbook-stairs.js?v=48',
          '/js/flipbook-spine.js?v=48',
          '/js/flipbook-main.js?v=48'
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
