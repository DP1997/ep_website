import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const CATALOGS = [
  { id: 'glas',    pdf: 'public/kataloge/glas_split_vertically_and_scaled.pdf', out: 'public/kataloge/glas_cover.jpg' },
  { id: 'malerei', pdf: 'public/kataloge/malerei.pdf',                         out: 'public/kataloge/malerei_cover.jpg' },
];

const SCALE = 2.0;

async function extractCover({ id, pdf, out }) {
  if (existsSync(out)) {
    console.log('[extract] ' + id + ': already exists, skipping');
    return;
  }
  const doc = await getDocument({ url: resolve(pdf), useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: SCALE });
  
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  
  await page.render({ canvasContext: ctx, viewport: viewport }).promise;
  
  const buf = canvas.toBuffer('image/jpeg', { quality: 0.92 });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  console.log('[extract] ' + id + ': wrote ' + out + ' (' + viewport.width + 'x' + viewport.height + ')');
  await doc.destroy();
}

for (const cat of CATALOGS) {
  try {
    await extractCover(cat);
  } catch (err) {
    console.error('[extract] ' + cat.id + ' FAILED:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  }
}
