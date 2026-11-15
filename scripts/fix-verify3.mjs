import { readFileSync, writeFileSync } from 'node:fs';

const F = 'scripts/verify.mjs';
let s = readFileSync(F, 'utf8');
const E = s.includes('\r\n') ? '\r\n' : '\n';

const block = [
  '        // Bubbles: Abstand der kleinen Bilder zueinander',
  "        if (${JSON.stringify(slug)} === 'bubbles') {",
  "          const imgs = [...sheet.querySelectorAll('.ps-bubbles-details img')].map(el => el.getBoundingClientRect());",
  '          out.bildabstand = +((imgs[1].top - imgs[0].bottom) / U).toFixed(1);',
  '        }',
].join(E);

// beide vorhandenen Bloecke entfernen
const first = s.indexOf(block);
if (first < 0) throw new Error('Block nicht gefunden');
s = s.slice(0, first) + s.slice(first + block.length + E);
const second = s.indexOf(block);
if (second < 0) throw new Error('zweiter Block nicht gefunden');
s = s.slice(0, second) + s.slice(second + block.length + E);

// vor die Buendigkeits-Pruefung einsetzen
const anchor = '        // Buendigkeiten je Seite';
const ai = s.indexOf(anchor);
if (ai < 0) throw new Error('Anker nicht gefunden');
s = s.slice(0, ai) + block + E + s.slice(ai);

writeFileSync(F, s, 'utf8');
console.log('verify.mjs: Bildabstand-Berechnung vorgezogen');
