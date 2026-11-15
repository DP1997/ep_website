import { readFileSync, writeFileSync } from 'node:fs';

const STADTTOR = 'src/pages/projektstudien/stadttor.astro';
let s = readFileSync(STADTTOR, 'utf8');
const E = s.includes('\r\n') ? '\r\n' : '\n';
const before = s;

const imgLine = '        <Image src={img1} alt="Stadttor – Plastik am Campus Landau" widths={[800]} sizes="40vw" />';
if (!s.includes(imgLine)) throw new Error('Bildzeile nicht gefunden');
s = s.replace(
  imgLine + E + '      </figure>',
  imgLine + E + '        <figcaption>Standort 1: Gebäude I, K von Süden, unten</figcaption>' + E + '      </figure>'
);
if (s === before) throw new Error('kein Patch');
writeFileSync(STADTTOR, s, 'utf8');
console.log('Stadttor: Bildunterschrift ergaenzt');
