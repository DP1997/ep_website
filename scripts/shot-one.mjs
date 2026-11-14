/**
 * Screenshot einer einzelnen Projektstudien-Seite.
 * node scripts/shot-one.mjs <slug> [ziel.png] [--w 1440] [--h 900]
 */
import { launch, openPage, screenshot } from './cdp.mjs';

const slug = process.argv[2];
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const out = process.argv[3] && !process.argv[3].startsWith('--')
  ? process.argv[3]
  : `C:/Users/donal/.local/share/opencode/worktree/projektstudien/ps-${slug}.png`;
const w = Number(arg('w', 1440)), h = Number(arg('h', 900));

const { proc, ws } = await launch();
try {
  await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/?v=${Date.now()}`, w, h);
  await new Promise(r => setTimeout(r, 700));
  await screenshot(ws, out);
  console.log('OK ' + out);
} finally {
  ws.close();
  proc.kill();
}
