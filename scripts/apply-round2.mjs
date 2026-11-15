import { readFileSync, writeFileSync } from 'node:fs';

// ------------------------------------------------------------------ Astro
const BUBBLES = 'src/pages/projektstudien/bubbles.astro';
let bubbles = readFileSync(BUBBLES, 'utf8');
const E = bubbles.includes('\r\n') ? '\r\n' : '\n';
const bBefore = bubbles;

// Bubbles: zweites und drittes Detailbild tauschen (Detail 1 <-> Detail 2)
const img2 = '            <Image src={img2} alt="Bubbles – Detail 1" widths={[200]} sizes="12vw" />';
const img3 = '            <Image src={img3} alt="Bubbles – Detail 2" widths={[200]} sizes="12vw" />';
if (!bubbles.includes(img2) || !bubbles.includes(img3)) throw new Error('Bubbles-Bilder nicht gefunden');
bubbles = bubbles.replace(img2, '@@IMG2@@').replace(img3, img2).replace('@@IMG2@@', img3);
writeFileSync(BUBBLES, bubbles, 'utf8');

// Stadttor: sauberes Bild verwenden und Bildunterschrift ergaenzen
const STADTTOR = 'src/pages/projektstudien/stadttor.astro';
let stadttor = readFileSync(STADTTOR, 'utf8');
const sBefore = stadttor;
stadttor = stadttor.replace(
  `import img1 from '../../assets/projektstudien/stadttor/1.png';`,
  `import img1 from '../../assets/projektstudien/stadttor/1-clean.png';`
);
stadttor = stadttor.replace(
  `        <Image src={img1} alt="Stadttor – Plastik am Campus Landau" widths={[800]} sizes="40vw" />` + E +
  `      </figure>`,
  `        <Image src={img1} alt="Stadttor – Plastik am Campus Landau" widths={[800]} sizes="40vw" />` + E +
  `        <figcaption>Standort 1: Gebäude I, K von Süden, unten</figcaption>` + E +
  `      </figure>`
);
if (stadttor === sBefore) throw new Error('Stadttor nicht geaendert');
writeFileSync(STADTTOR, stadttor, 'utf8');

// Frontmatter: Bildliste anpassen
const MD = 'src/content/projektstudien/stadttor.md';
let md = readFileSync(MD, 'utf8');
md = md.replace(`images: ['1.png', '2.png', '3.png']`, `images: ['1-clean.png', '2.png', '3.png']`);
writeFileSync(MD, md, 'utf8');

// ------------------------------------------------------------------- CSS
const CSS = 'src/styles/components/projektstudien.css';
let css = readFileSync(CSS, 'utf8');
const C = css.includes('\r\n') ? '\r\n' : '\n';
const cBefore = css;

// 1) Bildunterschriften 40 % naeher an das Bild (1.6cqh -> 0.96cqh)
css = css.split('margin-top: 1.6cqh').join('margin-top: 0.96cqh');

// 2) Balla Balla: Meta-Block und kleines Textfeld vertikal zentrieren
css = css.replace(
  `.ps-detail--balla .ps-text { left: 7.47%; top: 48.54%; width: 26%; }`,
  `.ps-detail--balla .ps-text {${C}  left: 7.47%; top: 51.28%; width: 26%;${C}  transform: translateY(-50%);${C}}`
);
css = css.replace(
  `.ps-balla-text-side {${C}  position: absolute; left: 7.47%; top: 73.06%; width: 24%;`,
  `.ps-balla-text-side {${C}  position: absolute; left: 7.47%; top: 77.63%; width: 24%;${C}  transform: translateY(-50%);`
);

// 3) Stadttor: Bildunterschrift unter dem grossen Bild
css = css.replace(
  `.ps-stadttor-fig1 img { width: 100%; height: auto; display: block; }`,
  `.ps-stadttor-fig1 img { width: 100%; height: auto; display: block; }${C}.ps-stadttor-fig1 figcaption {${C}  position: absolute; left: 0.72%; top: 100%; margin-top: 0.96cqh;${C}  font-family: var(--font-sans-serif); font-size: 1.65cqh; font-weight: 400;${C}}`
);

// 4) Mobil: Transformationen zuruecksetzen
css = css.replace(
  `    position: static;${C}    width: auto;${C}    height: auto;${C}    left: auto;${C}    top: auto;${C}    margin: 0 0 1.5rem;${C}  }`,
  `    position: static;${C}    width: auto;${C}    height: auto;${C}    left: auto;${C}    top: auto;${C}    transform: none;${C}    margin: 0 0 1.5rem;${C}  }`
);
css = css.replace(
  `    position: static;${C}    left: auto;${C}    top: auto;${C}    width: auto;${C}    margin: 0 0 1.5rem;${C}  }`,
  `    position: static;${C}    left: auto;${C}    top: auto;${C}    width: auto;${C}    transform: none;${C}    margin: 0 0 1.5rem;${C}  }`
);

if (css === cBefore) throw new Error('kein CSS-Patch angewendet');
writeFileSync(CSS, css, 'utf8');
console.log('Bubbles-Bilder getauscht, Stadttor-Bild + Unterschrift, Balla zentriert, Unterschriften naeher');
