import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

// Der Fliesstext beginnt unterhalb von Description + Labels. Die Position
// haengt von der Zeilenzahl der Description ab, die wiederum von der
// Blattbreite abhaengt. Statt fester Werte bekommt der Text daher keinen
// eigenen top-Wert, sondern folgt im Fluss auf den Meta-Block.
//
// Loesung: Meta-Block und Text stehen in einem gemeinsamen Wrapper, der an
// der PDF-Position der Description sitzt. Der Text folgt darunter.

const wrappers = {
  bubbles: '.ps-bubbles-aside',
  balla: '.ps-balla-side',
  sportler: '.ps-sportler-side',
  dschungel: '.ps-dschungel-side',
  stoerche: '.ps-stoerche-side',
  entwicklung: '.ps-entwicklung-side',
  skydance: '.ps-skydance-caption',
  stadttor: '.ps-stadttor-side',
};

// Text-Regeln entfernen: sie bekommen keine feste Position mehr.
for (const sel of ['.ps-bubbles-text', '.ps-balla-text-side', '.ps-sportler-text',
                   '.ps-dschungel-text', '.ps-stoerche-text', '.ps-entwicklung-text',
                   '.ps-skydance-text', '.ps-stadttor-text']) {
  const re = new RegExp('(\\.ps-detail--[a-z]+ )?' + sel.replace(/\./g, '\\.') + '\\s*\\{[^}]*\\}\\r?\\n', 'g');
  css = css.replace(re, '');
}
css = css.replace(/\.ps-balla-text-main\s*\{[^}]*\}\r?\n/g, '');

let block = `
/* Meta-Block (Description + Labels) und Fliesstext in einem Wrapper an der
   PDF-Position der Description. Der Text folgt darunter - dadurch kann es
   keine Kollision zwischen Description, Labels und Text geben. */
.ps-meta-block { position: absolute; }
.ps-desc { position: static; margin: 0 0 1.2cqh; }
.ps-labels { position: static; display: flex; flex-wrap: wrap; gap: 0.8cqh 1.6cqh; }
.ps-text-block { position: static; margin-top: 2cqh; }
`;
css = css.replace(/\n\/\* Meta-Block[\s\S]*$/, '\n' + block.trim() + '\n');

writeFileSync(path, css);
console.log('CSS bereinigt');
