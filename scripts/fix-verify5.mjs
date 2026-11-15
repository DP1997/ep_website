import { readFileSync, writeFileSync } from 'node:fs';

const F = 'scripts/verify.mjs';
let s = readFileSync(F, 'utf8');
const before = s;

s = s.replace(
  `            ['bildunterschrift unter bild', '.ps-stadttor-fig1 figcaption', 'y', '.ps-stadttor-fig1 img', 'b', 1.5],`,
  `            ['bildunterschrift 0.96cqh unter bild', '.ps-stadttor-fig1 figcaption', 'y', '.ps-stadttor-fig1 img', 'b', 1.5, 8.16],`
);
s = s.replace(
  `          const target = ref === 'bildabstand' ? -out.bildabstand : 0;`,
  `          const target = ref === 'bildabstand' ? -out.bildabstand : (typeof ref === 'number' ? ref : 0);`
);

if (s === before) throw new Error('kein Patch');
writeFileSync(F, s, 'utf8');
console.log('verify.mjs: Stadttor-Caption-Pruefung angepasst');
