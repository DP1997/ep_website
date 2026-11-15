import { readFileSync, writeFileSync } from 'node:fs';

const ASTRO = 'src/pages/projektstudien/stadttor.astro';
let astro = readFileSync(ASTRO, 'utf8');
const E = astro.includes('\r\n') ? '\r\n' : '\n';
const before = astro;

const fig2 = [
  '          <figure class="ps-stadttor-fig2">',
  '            <Image src={img2} alt="Stadttor – Ansicht bei Dunkelheit" widths={[400]} sizes="20vw" />',
  '          </figure>',
].join(E);

const fig3 = [
  '          <figure class="ps-stadttor-fig3">',
  '            <Image src={img3} alt="Stadttor – Ansicht bei Tag" widths={[400]} sizes="20vw" />',
  '          </figure>',
].join(E);

if (!astro.includes(fig2) || !astro.includes(fig3)) throw new Error('Bildbloecke nicht gefunden');

// Reihenfolge tauschen: bisheriges unteres Bild (Ansicht bei Tag) zuerst.
astro = astro.replace(fig2 + E + fig3, fig3 + E + fig2);

if (astro === before) throw new Error('kein Patch angewendet');
writeFileSync(ASTRO, astro, 'utf8');
console.log('Stadttor: Reihenfolge der kleinen Bilder getauscht');
