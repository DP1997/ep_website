// pdfjs-loader.mjs
// ESM loader for pdfjs-dist 6.x (ESM-only build).
// pdfjs-dist 6.x no longer ships a UMD/global bundle, so we import the ESM
// build and expose it on window.pdfjsLib for the classic flipbook scripts.
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.min.mjs';

// Configure the worker (also ESM-only in 6.x).
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs';

// Expose globally so the classic (non-module) flipbook scripts can use it.
window.pdfjsLib = pdfjsLib;

// Notify any waiting boot logic that pdfjs is ready.
window.dispatchEvent(new Event('pdfjs-ready'));
