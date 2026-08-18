// Single source of truth for flipbook asset cache-busting.
// Bump this when flipbook JS/CSS changes to invalidate browser caches.
// Imported by BaseLayout.astro and FlipbookViewer.astro; exposed to the
// client as window.__FLIPBOOK_VERSION so flipbook-modal.js can read it too.
export const FLIPBOOK_VERSION = '1.1.0';
