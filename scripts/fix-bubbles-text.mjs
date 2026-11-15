import { readFileSync, writeFileSync } from 'fs';

/* 1. Bubbles: der Fliesstext rueckt an die Stelle der entfernten
 *    Zwischenueberschrift "Idee" (PDF-y 574 -> top 32.5%). */
const cssPath = 'src/styles/components/projektstudien.css';
let css = readFileSync(cssPath, 'utf8');
const rx = /\.ps-bubbles-text \{\r?\n[^}]*top: 36\.4%;([^}]*)\}/;
if (!rx.test(css)) {
  console.error('.ps-bubbles-text nicht gefunden');
  process.exitCode = 1;
} else {
  css = css.replace(rx, '.ps-bubbles-text {\r\n  position: absolute; left: 40.4%; top: 32.5%;$1}');
  writeFileSync(cssPath, css);
  console.log('css: .ps-bubbles-text hochgerueckt');
}

/* 2. balla-balla: das Original nennt zwei Groessen (Foyer/Sportler-
 *    eingang und Besuchereingang). */
const p = 'src/pages/projektstudien/balla-balla.astro';
let src = readFileSync(p, 'utf8');
src = src.replace(
  '<p class="ps-desc">Wandgestaltung mit Malerei, Glasfolierung und Email, ca. 14 m x 2,70 m</p>',
  '<p class="ps-desc">Wandgestaltung mit Malerei, Glasfolierung und Email, ca. 14 m x 2,70 m und 6,50 m x 3,50 m</p>',
);
writeFileSync(p, src);
console.log('desc: balla-balla mit beiden Groessen');
