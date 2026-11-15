import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

// entwicklung und stoerche: Side-Block mit Titel, Meta und Text in einer
// Spalte - wie skydance und stadttor. Die Description und die Labels
// stehen untereinander, der Text darunter.

const REPL = [
  // entwicklung
  [/\.ps-entwicklung-side \{[^}]*\}\r?\n/g, '.ps-entwicklung-side { position: absolute; left: 9.7%; top: 78.7%; width: 21%; }\n'],
  [/\.ps-entwicklung-title \{[^}]*\}\r?\n/g, '.ps-entwicklung-title {\n  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;\n  line-height: 1.15; margin: 0 0 1cqh;\n}\n'],
  [/\.ps-entwicklung-text \{[^}]*\}\r?\n/g, '.ps-entwicklung-text {\n  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;\n}\n'],
  // stoerche
  [/\.ps-stoerche-side \{[^}]*\}\r?\n/g, '.ps-stoerche-side { position: absolute; left: 7%; top: 78.1%; width: 26%; }\n'],
  [/\.ps-stoerche-title \{[^}]*\}\r?\n/g, '.ps-stoerche-title {\n  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;\n  line-height: 1.15; margin: 0 0 1cqh;\n}\n'],
  [/\.ps-stoerche-text \{[^}]*\}\r?\n/g, '.ps-stoerche-text {\n  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;\n}\n'],
];

for (const [re, rep] of REPL) css = css.replace(re, rep);

css += `
/* entwicklung und stoerche: Titel, Description, Labels und Text in einer
   Spalte untereinander. */
.ps-entwicklung .ps-meta-block, .ps-stoerche .ps-meta-block { position: static; width: 100%; margin-bottom: 1.5cqh; }
`;

// Meta-Positionen fuer entwicklung/stoerche entfernen (sie sind jetzt statisch)
css = css.replace(/\.ps-detail--entwicklung \.ps-meta-block \{[^}]*\}\r?\n/g, '');
css = css.replace(/\.ps-detail--stoerche \.ps-meta-block \{[^}]*\}\r?\n/g, '');

writeFileSync(path, css);
console.log('CSS: entwicklung + stoerche vereinheitlicht');
