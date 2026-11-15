import { readFileSync, writeFileSync } from 'node:fs';

const F = 'scripts/verify.mjs';
let s = readFileSync(F, 'utf8');
const before = s;

// Balla: jetzt Zentrierung statt Unterkanten-Buendigkeit
s = s.replace(
  `            ['meta=text-main', '.ps-balla-side .ps-text', 'b', '.ps-balla-text-main', 'b', 1.5],
            ['textside=bild2', '.ps-balla-text-side', 'b', '.ps-balla-figure2 img', 'b', 1.5],`,
  `            ['meta-mitte=text-main-mitte', '.ps-balla-side .ps-text', 'c', '.ps-balla-text-main', 'c', 1.5],
            ['textside-mitte=bild2-mitte', '.ps-balla-text-side', 'c', '.ps-balla-figure2 img', 'c', 1.5],`
);
// Stadttor: Bildunterschrift unter dem grossen Bild pruefen
s = s.replace(
  `          stadttor: [],`,
  `          stadttor: [
            ['bildunterschrift unter bild', '.ps-stadttor-fig1 figcaption', 'y', '.ps-stadttor-fig1 img', 'b', 1.5],
            ['bildunterschrift links buendig', '.ps-stadttor-fig1 figcaption', 'x', '.ps-stadttor-fig1 img', 'x', 12],
          ],`
);
// Mittelpunkt ('c') der Boxen berechnen
s = s.replace(
  `          return { x: (b.left - sr.left) / U, y: (b.top - sr.top) / U, w: b.width / U,
            h: b.height / U, r: (b.right - sr.left) / U, b: (b.bottom - sr.top) / U };`,
  `          return { x: (b.left - sr.left) / U, y: (b.top - sr.top) / U, w: b.width / U,
            h: b.height / U, r: (b.right - sr.left) / U, b: (b.bottom - sr.top) / U,
            c: ((b.top - sr.top) + (b.bottom - sr.top)) / 2 / U };`
);

if (s === before) throw new Error('kein Patch');
writeFileSync(F, s, 'utf8');
console.log('verify.mjs erweitert');
