import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

// Description und Labels untereinander (Variante 1).
css = css.replace(/\.ps-meta-block \{[^}]*\}\r?\n/g, '');
css = css.replace(/\.ps-desc \{[^}]*\}\r?\n/g, '');
css = css.replace(/\.ps-labels \{[^}]*\}\r?\n/g, '');

css += `
/* Description und Labels untereinander: Titel (fett), Description, Labels
   (Ort, Jahr, Auftraggeber - Key in Petrol ueber Wert). */
.ps-meta-block { position: absolute; }
.ps-desc {
  font-family: var(--font-sans-serif); font-size: 1.5cqh; font-weight: 700;
  line-height: 1.25; margin: 0 0 1cqh;
}
.ps-labels { display: flex; flex-direction: column; gap: 0.7cqh; }
.ps-label { display: flex; flex-direction: column; gap: 0.05cqh; min-width: 0; }
.ps-label__key {
  font-family: var(--font-sans-serif); font-size: 1.05cqh; font-weight: 400;
  text-transform: lowercase; font-variant: small-caps; letter-spacing: 0.12em;
  color: var(--color-primary); white-space: nowrap;
}
.ps-label__value {
  font-family: var(--font-serif); font-size: 1.5cqh; font-weight: 400;
  color: var(--color-base); line-height: 1.2; overflow-wrap: break-word; min-width: 0;
}
`;

writeFileSync(path, css);
console.log('CSS: Description + Labels untereinander');
