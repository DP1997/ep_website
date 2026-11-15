import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

// Alte Seiten-Bloecke (Side, Title, Text, Figuren) entfernen und durch die
// korrigierten Regeln ersetzen. Die Seiten verlangen:
//   - Side-Block an der PDF-Position der linken Spalte
//   - Titel dort, Description + Labels darunter, Text darunter (skydance,
//     stadttor) bzw. Text in der rechten PDF-Spalte (entwicklung, stoerche)
const REPLACE = [
  // stoerche
  [/\.ps-stoerche-side \{[^}]*\}\r?\n/g,
   '.ps-stoerche-side { position: absolute; left: 7%; top: 73.4%; width: 17%; }\n'],
  [/\.ps-stoerche-title \{[^}]*\}\r?\n/g,
   '.ps-stoerche-title {\n  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;\n  line-height: 1.15; margin: 0 0 1cqh;\n}\n'],
  [/\.ps-stoerche-text \{[^}]*\}\r?\n/g,
   '.ps-stoerche-text {\n  position: absolute; left: 41%; top: 83.8%; width: 53%;\n  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;\n}\n'],
  // entwicklung
  [/\.ps-entwicklung-side \{[^}]*\}\r?\n/g,
   '.ps-entwicklung-side { position: absolute; left: 9.7%; top: 73.5%; width: 21%; }\n'],
  [/\.ps-entwicklung-title \{[^}]*\}\r?\n/g,
   '.ps-entwicklung-title {\n  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;\n  line-height: 1.15; margin: 0 0 1cqh;\n}\n'],
  [/\.ps-entwicklung-text \{[^}]*\}\r?\n/g,
   '.ps-entwicklung-text {\n  position: absolute; left: 31.5%; top: 79.2%; width: 60%;\n  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;\n}\n'],
  // skydance
  [/\.ps-skydance-side \{[^}]*\}\r?\n/g,
   '.ps-skydance-side { position: absolute; left: 8.8%; top: 4.4%; width: 17.7%; }\n'],
  [/\.ps-skydance-title \{[^}]*\}\r?\n/g,
   '.ps-skydance-title {\n  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;\n  line-height: 1.15; margin: 0 0 1cqh;\n}\n'],
  [/\.ps-skydance-text \{[^}]*\}\r?\n/g,
   '.ps-skydance-text {\n  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;\n}\n'],
  [/\.ps-skydance-fig2 \{[^}]*\}\r?\n/g,
   '.ps-skydance-fig2 { position: absolute; left: 30.6%; top: 4.4%; width: 18.6%; margin: 0; }\n'],
  [/\.ps-skydance-fig1 \{[^}]*\}\r?\n/g,
   '.ps-skydance-fig1 { position: absolute; left: 50%; top: 4.4%; width: 47.1%; margin: 0; }\n'],
  // stadttor
  [/\.ps-stadttor-side \{[^}]*\}\r?\n/g,
   '.ps-stadttor-side { position: absolute; left: 7.9%; top: 24.8%; width: 21%; }\n'],
  [/\.ps-stadttor-title \{[^}]*\}\r?\n/g,
   '.ps-stadttor-title {\n  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;\n  line-height: 1.15; margin: 0 0 1cqh;\n}\n'],
  [/\.ps-stadttor-text \{[^}]*\}\r?\n/g,
   '.ps-stadttor-text {\n  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;\n}\n'],
  [/\.ps-stadttor-fig1 \{[^}]*\}\r?\n/g,
   '.ps-stadttor-fig1 { position: absolute; left: 33.2%; top: 3.9%; width: 41.8%; margin: 0; }\n'],
  [/\.ps-stadttor-fig2 \{[^}]*\}\r?\n/g,
   '.ps-stadttor-fig2 { position: absolute; left: 76.6%; top: 52.7%; width: 20.3%; margin: 0; }\n'],
  [/\.ps-stadttor-fig3 \{[^}]*\}\r?\n/g,
   '.ps-stadttor-fig3 { position: absolute; left: 76.6%; top: 26.9%; width: 20.3%; margin: 0; }\n'],
  // skydance/stadttor: der alte Caption-Container entfaellt
  [/\.ps-skydance-caption \{[^}]*\}\r?\n/g, ''],
];

for (const [re, rep] of REPLACE) css = css.replace(re, rep);

// Meta-Block bei skydance und stadttor ist Teil des Side-Blocks (statisch).
css += `
/* skydance und stadttor: Description und Labels stehen im Side-Block unter
   dem Titel, der Text darunter. */
.ps-skydance .ps-meta-block,
.ps-stadttor .ps-meta-block { position: static; width: 100%; margin-bottom: 1.5cqh; }
`;

writeFileSync(path, css);
console.log('Seiten-Bloecke korrigiert');
