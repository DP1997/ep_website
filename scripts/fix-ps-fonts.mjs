import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

// Selektor -> neue font-size. PDF-Punkte skaliert (Faktor 1104/1190 = 0,928) und
// um ~15% erhoeht fuer bessere Lesbarkeit. Site-Root-Font-Size ist 10px, darum px statt rem.
const MAP = {
  '.ps-bubbles-artist': '26px',
  '.ps-bubbles-title': '30px',
  '.ps-bubbles-meta': '14px',
  '.ps-bubbles-idee': '14px',
  '.ps-balla-artist': '26px',
  '.ps-balla-title': '23px',
  '.ps-balla-meta': '14px',
  '.ps-balla-text-main': '15px',
  '.ps-balla-text-side': '15px',
  '.ps-sportler-artist': '26px',
  '.ps-sportler-title': '23px',
  '.ps-sportler-meta': '14px',
  '.ps-sportler-text': '15px',
  '.ps-dschungel-artist-inline': '26px',
  '.ps-dschungel-title': '23px',
  '.ps-dschungel-meta': '14px',
  '.ps-dschungel-text': '15px',
  '.ps-stoerche-artist': '26px',
  '.ps-stoerche-title': '23px',
  '.ps-stoerche-meta': '14px',
  '.ps-stoerche-text': '15px',
  '.ps-entwicklung-artist': '26px',
  '.ps-entwicklung-title': '23px',
  '.ps-entwicklung-meta': '14px',
  '.ps-entwicklung-text': '15px',
  '.ps-skydance-title': '23px',
  '.ps-skydance-meta': '14px',
  '.ps-skydance-text': '15px',
};

let changed = 0;
for (const [sel, size] of Object.entries(MAP)) {
  const re = new RegExp('(' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*?font-size:\\s*)([^;]+)(;)');
  if (re.test(css)) {
    css = css.replace(re, (m, pre, old, post) => {
      changed++;
      console.log(sel + ': ' + old.trim() + ' -> ' + size);
      return pre + size + post;
    });
  } else {
    console.log('NICHT GEFUNDEN: ' + sel);
  }
}

// Captions (Bildunterschriften) auf 14px
css = css.replace(/(\.ps-(?:balla|sportler)-figure2? figcaption\s*\{[^}]*?font-size:\s*)[^;]+(;)/g, (m, pre, post) => {
  changed++;
  return pre + '14px' + post;
});
css = css.replace(/(\.ps-skydance-fig1 figcaption\s*\{[^}]*?font-size:\s*)[^;]+(;)/g, (m, pre, post) => {
  changed++;
  return pre + '13px' + post;
});

writeFileSync(path, css);
console.log('\n' + changed + ' Regel(n) geaendert');
