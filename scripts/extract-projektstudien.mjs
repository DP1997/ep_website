/**
 * Einmaliges Extraktions-Script: zieht die eingebetteten Bilder aus den 8
 * KAB-Referenz-PDFs und schreibt sie als PNG nach src/assets/projektstudien/<slug>/N.png.
 *
 * Vorgehen: statt Seiten zu rendern sammeln wir die Bild-XObjects in
 * Paint-Reihenfolge über die OperatorList. pdfjs-dist löst die Bilder in
 * `page.objs` beim OperatorList-Abruf auf; `page.objs.get(objId)` liefert
 * `{ width, height, data }` mit RGB-Pixeln (3 Byte/Pixel).
 *
 * Page-übergreifende Wiederverwendung: referenziert eine Seite dasselbe XObject
 * erneut (hier `g_...`-Objekt, pdfjs löst es erst beim Rendern per
 * CopyLocalImage auf), wird das erste Vorkommen gleicher Abmessung verwendet —
 * der Plan zählt diese Wiederholungen als eigene Dateien (sportler-in-bewegung = 4).
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, readdirSync, mkdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(__dirname, '../src/assets/Projektsudien_Referenzen');
const OUT_DIR = resolve(__dirname, '../src/assets/projektstudien');

/** Dateiname (PDF) -> slug. Ordnername für "Wörth" mit echtem U+00F6. */
const MAP = [
  ['2.KAB.Altenkirchen.pdf', 'bubbles'],
  ['3.KAB.BZA.2.pdf', 'balla-balla'],
  ['3.KAB.BZA.3.pdf', 'sportler-in-bewegung'],
  ['4.KAB.MZ.Kita.pdf', 'dschungel'],
  ['4.KAB.Offenbach.pdf', 'stoerche-froesche'],
  ['4.KAB.Wörth.pdf', 'entwicklung'],
  ['6.KAB.MZ-Weisenau.pdf', 'skydance'],
  ['6.KAB.Uni.Landau.pdf', 'stadttor'],
];

/** paintImage*-Operatoren (OPS-Enum-Werte 83–90), Argument 0 trägt das Bild. */
const IMAGE_OPS = new Set([83, 84, 85, 86, 87, 88, 89]);

function isImage(obj) {
  return !!obj && typeof obj.width === 'number' && typeof obj.height === 'number' && obj.data;
}

/** RGB (3 Byte/Pixel) -> RGBA-PNG via @napi-rs/canvas. */
function rgbToPng(img, outPath) {
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(img.width, img.height);
  const src = img.data;
  const dst = id.data;
  for (let j = 0, k = 0; j < src.length; j += 3, k += 4) {
    dst[k] = src[j];
    dst[k + 1] = src[j + 1];
    dst[k + 2] = src[j + 2];
    dst[k + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  writeFileSync(outPath, c.toBuffer('image/png'));
}

async function extractPdf(pdfPath, slug) {
  const doc = await getDocument({ url: pdfPath }).promise;
  const painted = []; // Bilder in Paint-Reihenfolge
  const firstBySize = new Map(); // CopyLocalImage: erste Instanz je w×h

  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const ol = await page.getOperatorList();
      for (let i = 0; i < ol.fnArray.length; i++) {
        if (!IMAGE_OPS.has(ol.fnArray[i])) continue;
        const args = ol.argsArray[i] ?? [];
        let img = null;

        // Gruppen-Operatoren (84/87) tragen ein Array von Bildargumenten.
        const targets = Array.isArray(args[0]) ? args[0] : args.slice(0, 1);

        for (const arg of targets) {
          if (isImage(arg)) {
            img = arg; // Inline-Bild (86/87): Pixel direkt im Argument.
          } else if (typeof arg === 'string') {
            if (arg.startsWith('g_')) {
              // CopyLocalImage: erneut gepaintes XObject. Die Abmessungen liefern
              // args[1]/args[2] (worker schreibt [objId, w, h]) — Daten übernehmen
              // wir aus dem ersten Vorkommen gleicher Größe.
              const key = `${args[1]}x${args[2]}`;
              img = firstBySize.get(key) ?? null;
            } else {
              img = isImage(page.objs.get(arg)) ? page.objs.get(arg) : null;
            }
          }
          if (img) break;
        }

        if (!img) continue;
        painted.push(img);
        const key = `${img.width}x${img.height}`;
        if (!firstBySize.has(key)) firstBySize.set(key, img);
      }
    }
  } finally {
    await doc.loadingTask.destroy();
  }

  const outDir = join(OUT_DIR, slug);
  mkdirSync(outDir, { recursive: true });
  const files = [];
  let n = 0;
  for (const img of painted) {
    const outPath = join(outDir, `${++n}.png`);
    rgbToPng(img, outPath);
    files.push(`${n}.png (${img.width}×${img.height})`);
  }
  return { slug, count: n, files };
}

let total = 0;
const dirEntries = readdirSync(SRC_DIR);
for (const [pdfName, slug] of MAP) {
  if (!dirEntries.includes(pdfName)) {
    throw new Error(`PDF nicht gefunden: ${pdfName} — vorhanden: ${dirEntries.join(', ')}`);
  }
  try {
    const result = await extractPdf(join(SRC_DIR, pdfName), slug);
    total += result.count;
    console.log(`[extract] ${slug}: ${result.count} Bilder -> ${join('src/assets/projektstudien', slug)}`);
    for (const f of result.files) console.log(`           ${f}`);
  } catch (err) {
    console.error(`[extract] ${slug} FAILED:`, err.message);
    process.exitCode = 1;
  }
}
console.log(`[extract] Fertig: ${total} PNGs gesamt (erwartet 28).`);
