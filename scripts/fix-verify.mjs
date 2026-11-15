import { readFileSync, writeFileSync } from 'node:fs';

const F = 'scripts/verify.mjs';
let s = readFileSync(F, 'utf8');
const E = s.includes('\r\n') ? '\r\n' : '\n';
const before = s;

// 1) Bubbles: Abstand Meta-Block -> erstes Bild muss dem Abstand der
//    kleinen Bilder zueinander entsprechen (nicht 0).
s = s.replace(
  `            ['meta->bild1 = bildabstand', '.ps-bubbles-header .ps-labels', 'b', '.ps-bubbles-details img', 'y', 1.5],`,
  `            ['meta->bild1 = bildabstand', '.ps-bubbles-header .ps-labels', 'b', '.ps-bubbles-details img', 'y', 1.5, 'bildabstand'],`
);
s = s.replace(
  `        for (const [name, sa, ka, sb, kb, tol] of S) {
          const ra = rel(sa), rb = rel(sb);
          if (!ra || !rb) { out.flush.push({ name, err: 'Element fehlt: ' + (ra ? sb : sa) }); continue; }
          out.flush.push({ name, delta: +(ra[ka] - rb[kb]).toFixed(1), ok: Math.abs(ra[ka] - rb[kb]) <= tol });
        }`,
  `        for (const [name, sa, ka, sb, kb, tol, ref] of S) {
          const ra = rel(sa), rb = rel(sb);
          if (!ra || !rb) { out.flush.push({ name, err: 'Element fehlt: ' + (ra ? sb : sa) }); continue; }
          const d = ra[ka] - rb[kb];
          const target = ref === 'bildabstand' ? -out.bildabstand : 0;
          out.flush.push({ name, delta: +(d - target).toFixed(1), ok: Math.abs(d - target) <= tol });
        }`
);
// 2) Ueberlauf: die randabfallenden Seiten-Wrapper (Voller Flaeche) sind
//    kein Fehler, sie werden nur um --ps-center verschoben.
s = s.replace(
  `          if (b.width <= 0 || b.height <= 0) continue;`,
  `          if (b.width <= 0 || b.height <= 0) continue;
          const isWrapper = b.height >= sr.height - 2 && b.width >= sr.width - 2;${E}          if (isWrapper) continue;`
);
if (s === before) throw new Error('kein Patch');
writeFileSync(F, s, 'utf8');
console.log('verify.mjs angepasst');
