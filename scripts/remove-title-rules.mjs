import { readFileSync, writeFileSync } from 'fs';

const p = 'src/styles/components/projektstudien.css';
let css = readFileSync(p, 'utf8');

const BLOCK = `.ps-entwicklung-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
`;
const BLOCK2 = `.ps-skydance-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
`;
const BLOCK3 = `.ps-stadttor-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
`;

for (const b of [BLOCK, BLOCK2, BLOCK3]) {
  const rx = new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\r?\\n'), 's');
  if (!rx.test(css)) {
    console.error('NICHT GEFUNDEN: ' + b.split('\n')[0]);
    process.exitCode = 1;
    continue;
  }
  css = css.replace(rx, '');
}

writeFileSync(p, css);
console.log('ok');
