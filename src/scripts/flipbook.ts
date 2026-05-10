import * as pdfjsLib from 'pdfjs-dist';

// Set worker path - using CDN since we're in a browser context
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface FlipBookOptions {
  container: HTMLElement;
  pdfUrl: string;
  onPageChange?: (pageNum: number, totalPages: number) => void;
  onLoad?: (totalPages: number) => void;
}

export function initFlipBook({ container, pdfUrl, onPageChange, onLoad }: FlipBookOptions) {
  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  let currentPage = 1;
  let totalPages = 1;

  // --- DOM structure ---
  const canvas = document.createElement('canvas');
  canvas.className = 'flip-canvas';

  // --- Navigation bar ---
  const nav = document.createElement('div');
  nav.className = 'flip-nav';

  const btnPrev = document.createElement('button');
  btnPrev.className = 'flip-nav-btn flip-nav-btn--prev';
  btnPrev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  btnPrev.setAttribute('aria-label', 'Previous page');

  const pageIndicator = document.createElement('span');
  pageIndicator.className = 'flip-nav-indicator';

  const btnNext = document.createElement('button');
  btnNext.className = 'flip-nav-btn flip-nav-btn--next';
  btnNext.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  btnNext.setAttribute('aria-label', 'Next page');

  nav.appendChild(btnPrev);
  nav.appendChild(pageIndicator);
  nav.appendChild(btnNext);

  container.innerHTML = '';
  container.appendChild(canvas);
  container.appendChild(nav);

  // --- Rendering helpers ---

  /** Render a single PDF page onto a canvas.
   *  PDF page fills the available space while preserving aspect ratio.
   *  The viewer container is sized to the canvas so there is no dead space. */
  async function renderPage(pageNum: number) {
    if (!pdfDoc || pageNum < 1 || pageNum > totalPages) return;

    await new Promise(requestAnimationFrame);

    const page = await pdfDoc.getPage(pageNum);
    // Get the available space from the parent (.flipbook) minus some breathing room
    const parent = container.parentElement;
    const parentRect = parent ? parent.getBoundingClientRect() : container.getBoundingClientRect();
    // Account for header and page-info heights
    const headerEl = parent?.querySelector('.flipbook__header');
    const infoEl = parent?.querySelector('.flipbook__page-info');
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const infoHeight = infoEl ? infoEl.getBoundingClientRect().height : 0;
    // Some vertical padding
    const vPad = 32;
    const availableWidth = parentRect.width - 32;
    const availableHeight = parentRect.height - headerHeight - infoHeight - vPad * 2;

    const pageViewport = page.getViewport({ scale: 1 });

    // Fit within available space, preserving aspect ratio
    const scale = Math.min(
      availableWidth / pageViewport.width,
      availableHeight / pageViewport.height,
    );
    const viewport = page.getViewport({ scale });

    // Size canvas to match the scaled page exactly
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';

    // Shrink-wrap the container to the canvas size
    container.style.width = viewport.width + 'px';
    container.style.height = viewport.height + 'px';

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  /** Show the current page. */
  async function displayCurrentPage() {
    if (!pdfDoc) return;
    await new Promise(requestAnimationFrame);
    await renderPage(currentPage);
    pageIndicator.textContent = String(currentPage);
    updateNavButtons();
    if (onPageChange) onPageChange(currentPage, totalPages);
  }

  function updateNavButtons() {
    btnPrev.style.visibility = currentPage <= 1 ? 'hidden' : 'visible';
    btnNext.style.visibility = currentPage >= totalPages ? 'hidden' : 'visible';
  }

  // --- Navigation ---
  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayCurrentPage();
    }
  });

  btnNext.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayCurrentPage();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
      currentPage--;
      displayCurrentPage();
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
      currentPage++;
      displayCurrentPage();
    }
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 50 && currentPage > 1) {
        currentPage--;
        displayCurrentPage();
      } else if (dx < -50 && currentPage < totalPages) {
        currentPage++;
        displayCurrentPage();
      }
    }
  });

  // Resize -> re-render
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(displayCurrentPage, 100);
  });

  // --- Initial Load ---
  pdfjsLib.getDocument(pdfUrl).promise.then((pdf) => {
    pdfDoc = pdf;
    totalPages = pdf.numPages;
    if (onLoad) onLoad(totalPages);
    displayCurrentPage();
  }).catch((err) => {
    console.error('Failed to load PDF:', err);
    container.innerHTML = '<p class="flip-error">Katalog konnte nicht geladen werden.</p>';
  });
}
