import { readFileSync, writeFileSync, readdirSync } from 'fs';

/* 1. Markup: alle Titel bekommen nur noch die Klasse ps-title. */
const dir = 'src/pages/projektstudien';
for (const f of readdirSync(dir)) {
  const path = `${dir}/${f}`;
  let src = readFileSync(path, 'utf8');
  src = src.replace(/class="ps-title ps-[a-z-]+-title"/g, 'class="ps-title"');
  writeFileSync(path, src);
}

/* 2. CSS: gemeinsame Titel-Typografie, Seiten-Regeln raus. */
const cssPath = 'src/styles/components/projektstudien.css';
let css = readFileSync(cssPath, 'utf8');

const rep = (from, to, label) => {
  const rx = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\r?\\n'), 's');
  if (!rx.test(css)) {
    console.error('NICHT GEFUNDEN: ' + label);
    process.exitCode = 1;
    return;
  }
  css = css.replace(rx, to.replace(/\n/g, '\r\n'));
};

/* Seiten-spezifische Titel-Regeln entfernen (Typografie kommt jetzt
   zentral von .ps-title). */
rep(
`.ps-bubbles-title {
  font-family: var(--font-sans-serif); font-size: 3.53cqh; font-weight: 700;
  line-height: 1.05;
}
`,
``, 'bubbles title');

rep(
`.ps-balla-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700; line-height: 1.15;
}
`,
``, 'balla title');

rep(
`.ps-sportler-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700; line-height: 1.15;
}
`,
``, 'sportler title');

rep(
`.ps-dschungel-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700; line-height: 1.15;
}
`,
``, 'dschungel title');

rep(
`.ps-stoerche-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15;
}
`,
``, 'stoerche title');

rep(
`.ps-entwicklung-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15;
}
`,
``, 'entwicklung title');

rep(
`.ps-skydance-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15;
}
`,
``, 'skydance title');

rep(
`.ps-stadttor-title {
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15;
}
`,
``, 'stadttor title');

/* Zentrale Titel-Typografie + Abstaende. */
rep(
`.ps-text { position: absolute; }
.ps-text .ps-title { position: static; margin: 0 0 1cqh; }`,
`.ps-text { position: absolute; }
.ps-title {
  position: static;
  font-family: var(--font-sans-serif); font-size: 2.71cqh; font-weight: 700;
  line-height: 1.15; margin: 0 0 1cqh;
}
.ps-bubbles .ps-title { font-size: 3.53cqh; line-height: 1.05; }`, 'title base');

/* Mobile-Listen: alte Titel-Klassen raus, .ps-title rein. */
css = css.replace(/^[ \t]*\.ps-[a-z]+-title,\r?\n/gm, '');
css = css.replace(/(\.ps-meta-block,\r?\n)/g, '.ps-title,\r\n$1');

writeFileSync(cssPath, css);
console.log('Titel vereinheitlicht');
