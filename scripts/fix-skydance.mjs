import { readFileSync, writeFileSync } from 'fs';

const path = 'src/styles/components/projektstudien.css';
let css = readFileSync(path, 'utf8');

// skydance: Titel links oben (buendig mit der Bilderoberkante), Description
// darunter, Labels, dann der Text. Beide Bilder oben buendig: die
// Raumplastik links, der Schnitt rechts.
const OLD_SKY = /\.ps-skydance-side \{[^}]*\}\r?\n/;
const OLD_SKY_TITLE = /\.ps-skydance-title \{[^}]*\}\r?\n/;
const OLD_SKY_TEXT = /\.ps-skydance-text \{[^}]*\}\r?\n/;
const OLD_SKY_FIG2 = /\.ps-skydance-fig2 \{[^}]*\}\r?\n/;
const OLD_SKY_FIG2IMG = /\.ps-skydance-fig2 img \{[^}]*\}\r?\n/;
const OLD_SKY_FIG1 = /\.ps-skydance-fig1 \{[^}]*\}\r?\n/;
const OLD_SKY_FIG1IMG = /\.ps-skydance-fig1 img \{[^}]*\}\r?\n/;

for (const re of [OLD_SKY, OLD_SKY_TITLE, OLD_SKY_TEXT, OLD_SKY_FIG2, OLD_SKY_FIG2IMG, OLD_SKY_FIG1, OLD_SKY_FIG1IMG]) {
  css = css.replace(re, '');
}

css += `
/* skydance: Titel links oben, Description, Labels, Text - alles in der
   linken Spalte. Beide Bilder oben buendig. */
.ps-skydance-side { position: absolute; left: 8.8%; top: 4.4%; width: 17.7%; }
.ps-skydance-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
.ps-skydance .ps-meta-block { position: static; width: 100%; margin-bottom: 1.5cqh; }
.ps-skydance-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}
.ps-skydance-fig2 { position: absolute; left: 30.6%; top: 4.4%; width: 18.6%; margin: 0; }
.ps-skydance-fig2 img { width: 100%; height: auto; display: block; }
.ps-skydance-fig1 { position: absolute; left: 50%; top: 4.4%; width: 47.1%; margin: 0; }
.ps-skydance-fig1 img { width: 100%; height: auto; display: block; }

/* stadttor: Titel, Description, Labels und Text in der linken Spalte,
   die Bilder mittig und rechts. */
.ps-stadttor-side { position: absolute; left: 7.9%; top: 24.8%; width: 21%; }
.ps-stadttor-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
.ps-stadttor .ps-meta-block { position: static; width: 100%; margin-bottom: 1.5cqh; }
.ps-stadttor-text {
  font-family: var(--font-sans-serif); font-size: 1.76cqh; line-height: 1.24;
}
.ps-stadttor-fig1 { position: absolute; left: 33.2%; top: 3.9%; width: 41.8%; margin: 0; }
.ps-stadttor-fig1 img { width: 100%; height: auto; display: block; }
.ps-stadttor-fig2 { position: absolute; left: 76.6%; top: 52.7%; width: 20.3%; margin: 0; }
.ps-stadttor-fig3 { position: absolute; left: 76.6%; top: 26.9%; width: 20.3%; margin: 0; }
.ps-stadttor-fig2 img, .ps-stadttor-fig3 img { width: 100%; height: auto; display: block; }
`;

// Meta-Block-Positionen: skydance/stadttor sind jetzt statisch (im Side-Block).
css = css.replace(/\.ps-detail--skydance \.ps-meta-block \{[^}]*\}\r?\n/g, '');
css = css.replace(/\.ps-detail--stadttor \.ps-meta-block \{[^}]*\}\r?\n/g, '');

writeFileSync(path, css);
console.log('CSS: skydance + stadttor neu');
