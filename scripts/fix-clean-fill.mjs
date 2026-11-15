import { readFileSync, writeFileSync } from 'node:fs';

const F = 'scripts/clean-stadttor-caption.mjs';
let s = readFileSync(F, 'utf8');
const E = s.includes('\r\n') ? '\r\n' : '\n';
const before = s;

const oldBlock = [
  '    let up = -1, down = -1;',
  '    for (let k = 1; k <= 160; k++) {',
  '      const yy = y - k;',
  '      if (yy < BAND_TOP) break;',
  '      if (!isMasked(x, yy)) { up = yy; break; }',
  '    }',
  '    for (let k = 1; k <= 160; k++) {',
  '      const yy = y + k;',
  '      if (yy > BAND_BOT) break;',
  '      if (!isMasked(x, yy)) { down = yy; break; }',
  '    }',
].join(E);

const newBlock = [
  '    // Feste Bezugszeilen oberhalb und unterhalb des Textes: damit',
  '    // entsteht keine Silhouette der Buchstaben.',
  '    const up = BAND_TOP - 1;',
  '    const down = BAND_BOT + 1;',
].join(E);

if (!s.includes(oldBlock)) throw new Error('Block nicht gefunden');
s = s.replace(oldBlock, newBlock);
s = s.replace(
  '    const ui = up >= 0 ? (up * W + x) * 4 : -1;' + E +
  '    const di = down >= 0 ? (down * W + x) * 4 : -1;',
  '    const ui = (up * W + x) * 4;' + E +
  '    const di = (down * W + x) * 4;'
);
s = s.replace(
  '    if (ui >= 0 && di >= 0) {' + E +
  '      const t = (y - up) / (down - up);',
  '    {' + E +
  '      const t = (y - up) / (down - up);'
);
s = s.replace(
  '    } else if (ui >= 0) {' + E +
  '      d[i] = src[ui]; d[i + 1] = src[ui + 1]; d[i + 2] = src[ui + 2];' + E +
  '    } else if (di >= 0) {' + E +
  '      d[i] = src[di]; d[i + 1] = src[di + 1]; d[i + 2] = src[di + 2];' + E +
  '    }' + E,
  '    }' + E
);

if (s === before) throw new Error('kein Patch');
writeFileSync(F, s, 'utf8');
console.log('Fuellung auf feste Bezugszeilen umgestellt');
