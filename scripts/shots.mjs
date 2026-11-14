/**
 * Screenshots aller Projektstudien-Seiten (1440x900) in einem Raster.
 * node scripts/shots.mjs [zielordner]
 */
import { launch, openPage, screenshot } from './cdp.mjs';

const OUT = process.argv[2] || 'C:/Users/donal/.local/share/opencode/worktree/projektstudien';
const PAGES = ['bubbles', 'balla-balla', 'sportler-in-bewegung', 'dschungel',
  'stoerche-froesche', 'entwicklung', 'skydance', 'stadttor'];

const { proc, ws } = await launch();
try {
  for (const slug of PAGES) {
    await openPage(ws, `http://localhost:4321/ep_website/projektstudien/${slug}/?v=${Date.now()}`, 1440, 900);
    const f = `${OUT}/ps-${slug}.png`;
    await screenshot(ws, f);
    console.log('OK ' + f);
  }
} finally {
  ws.close();
  proc.kill();
}
