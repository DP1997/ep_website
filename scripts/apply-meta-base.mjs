/**
 * Konsolidierte CSS-Regeln fuer die Projektstudien-Seiten.
 *
 * Stand nach dem Nutzerfeedback:
 *  - Titel fett (wie die uebrigen Werke), Description darunter (fett),
 *    darunter die Labels Ort / Jahr / Auftraggeber: Key in Petrol
 *    (--color-primary), small-caps, Value in Serif.
 *  - Jede Seite positioniert ihre Elemente absolut in Prozent der
 *    PDF-Flaeche (1191x850 bzw. 1190x850):
 *      left% = PDF-x / 1191,  top% = (850 - PDF-y-Oberkante) / 850
 *  - Das Blatt hat das Seitenverhaeltnis des PDF und passt damit
 *    komplett in den Viewport.
 *  - Unter 900px wird gestapelt (keine absoluten Positionen).
 */
import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

/* --- Alte Projektstudien-Regeln (Meta, Description, Labels) entfernen --- */
const REMOVE = [
  /\.ps-desc \{[^}]*\}\r?\n/g,
  /\.ps-labels \{[^}]*\}\r?\n/g,
  /\.ps-label \{[^}]*\}\r?\n/g,
  /\.ps-label__key \{[^}]*\}\r?\n/g,
  /\.ps-label__value \{[^}]*\}\r?\n/g,
  /\.ps-meta-block \{[^}]*\}\r?\n/g,
  /\.ps-detail--[a-z]+ \.ps-meta-block \{[^}]*\}\r?\n/g,
  /\.ps-(?:entwicklung|stoerche|skydance|stadttor) \.ps-meta-block \{[^}]*\}\r?\n/g,
  /\.ps-.*-artist \{[^}]*\}\r?\n/g,
  /\.ps-.*-meta \{[^}]*\}\r?\n/g,
];
for (const re of REMOVE) css = css.replace(re, '');

/* --- Grundregeln fuer Description und Labels --- */
const BASE = `
/* ================================================================
 * Description und Labels (Meta-Block)
 *
 * Titel (fett), Description (fett), dann Labels: Ort, Jahr,
 * Auftraggeber - Key in Petrol small-caps ueber dem Wert in Serif.
 * ================================================================ */
.ps-meta-block { position: absolute; }
.ps-desc {
  font-family: var(--font-sans-serif); font-size: 1.35cqh; font-weight: 700;
  line-height: 1.25; margin: 0 0 0.8cqh;
}
.ps-labels { display: flex; flex-direction: column; gap: 0.5cqh; }
.ps-label { display: flex; gap: 0.5cqh; align-items: baseline; min-width: 0; }
.ps-label__key {
  font-family: var(--font-sans-serif); font-size: 1.05cqh; font-weight: 400;
  text-transform: lowercase; font-variant: small-caps; letter-spacing: 0.12em;
  color: var(--color-primary); white-space: nowrap; flex: 0 0 auto;
}
.ps-label__value {
  font-family: var(--font-serif); font-size: 1.4cqh; font-weight: 400;
  color: var(--color-base); line-height: 1.2; overflow-wrap: break-word; min-width: 0;
}
`;

/* --- Positionen je Seite ---
 * left/top/width des Meta-Blocks, Spaltenbreite des Textes. */
const PAGES = {
  bubbles: {
    meta: ['0%', '15.9%', '100%'],
    title: ['0%', '9.9%'],
  },
  balla: {
    meta: ['7.5%', '54.8%', '26%'],
    title: ['7.5%', '49.2%'],
  },
  sportler: {
    meta: ['6.6%', '61.2%', '26%'],
    title: ['6.6%', '54.2%'],
  },
  dschungel: {
    meta: ['6.7%', '75.2%', '20%'],
    title: ['6.7%', '70.2%'],
  },
  stoerche: {
    meta: ['7%', '78.1%', '17%'],
    title: ['7%', '73.4%'],
  },
  entwicklung: {
    meta: ['9.7%', '78.7%', '21%'],
    title: ['9.7%', '73.5%'],
  },
  skydance: {
    meta: null, // Teil des linken Side-Blocks
    title: null,
  },
  stadttor: {
    meta: null,
    title: null,
  },
};

let block = BASE + `
/* Meta-Block je Seite: Position (PDF-y der Description) und Spaltenbreite. */
`;
for (const [slug, p] of Object.entries(PAGES)) {
  if (!p.meta) continue;
  const sel = slug === 'stoerche-froesche' ? 'stoerche' : slug === 'sportler-in-bewegung' ? 'sportler' : slug;
  block += `.ps-detail--${sel} .ps-meta-block { left: ${p.meta[0]}; top: ${p.meta[1]}; width: ${p.meta[2]}; }\n`;
}

css = css.trimEnd() + '\n' + block;
writeFileSync(path, css);
console.log('Grundregeln + Meta-Positionen gesetzt');
