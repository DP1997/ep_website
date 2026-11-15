import { readFileSync, writeFileSync } from 'fs';

const p = 'src/styles/components/projektstudien.css';
let css = readFileSync(p, 'utf8');

const rep = (from, to, label) => {
  const rx = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\r?\\n'), 's');
  if (!rx.test(css)) {
    console.error('NICHT GEFUNDEN: ' + label);
    process.exitCode = 1;
    return;
  }
  css = css.replace(rx, to.replace(/\n/g, '\r\n'));
};

/* Die Regeln .ps-XXX p { margin: 0 } und .ps-XXX h1 { margin: 0 }
   haben hoehere Spezifitaet als .ps-desc / .ps-title. Deshalb
   bekommen die Rhythmus-Regeln den Praefix .ps-text. */
rep(
`.ps-title {
  position: static;
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
.ps-bubbles .ps-title { font-size: 3.53cqh; line-height: 1.05; }
.ps-meta-block { position: static; width: auto; margin: 0; }
.ps-desc {
  font-family: var(--font-sans-serif); font-size: 1.35cqh; font-weight: 700;
  line-height: 1.25; margin: 0 0 2cqh;
}
.ps-labels { display: flex; flex-direction: column; gap: 1cqh; }`,
`.ps-text .ps-title {
  position: static;
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
.ps-text.ps-bubbles .ps-title,
.ps-detail--bubbles .ps-text .ps-title { font-size: 3.53cqh; line-height: 1.05; }
.ps-text .ps-meta-block { position: static; width: auto; margin: 0; }
.ps-text .ps-desc {
  font-family: var(--font-sans-serif); font-size: 1.35cqh; font-weight: 700;
  line-height: 1.25; margin: 0 0 2.5cqh;
}
.ps-text .ps-labels { display: flex; flex-direction: column; gap: 1cqh; }`, 'rhythm specificity');

writeFileSync(p, css);
console.log('ok');
