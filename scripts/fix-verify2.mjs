import { readFileSync, writeFileSync } from 'node:fs';

const F = 'scripts/verify.mjs';
let s = readFileSync(F, 'utf8');
const before = s;

const block = `        // Bubbles: Abstand der kleinen Bilder zueinander
        if (${JSON.stringify(slug)} === 'bubbles') {
          const imgs = [...sheet.querySelectorAll('.ps-bubbles-details img')].map(el => el.getBoundingClientRect());
          out.bildabstand = +((imgs[1].top - imgs[0].bottom) / U).toFixed(1);
        }
`;

if (!s.includes(block)) throw new Error('Block nicht gefunden');
s = s.replace(block, '');
s = s.replace(
  `        // Buendigkeiten je Seite`,
  block + `        // Buendigkeiten je Seite`
);
if (s === before) throw new Error('kein Patch');
writeFileSync(F, s, 'utf8');
console.log('Reihenfolge korrigiert');
