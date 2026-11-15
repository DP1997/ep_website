import { readdirSync, readFileSync } from 'fs';

for (const f of readdirSync('src/pages/projektstudien')) {
  if (!f.endsWith('.astro')) continue;
  const c = readFileSync('src/pages/projektstudien/' + f, 'utf8');
  const m = c.match(/<h1[^>]*>([^<]*)<\/h1>/);
  const a = c.match(/<p class="ps-[a-z]*-artist">([^<]*)/);
  console.log(f.padEnd(28) + ' h1=' + JSON.stringify(m ? m[1] : '-') + (a ? '   artist=' + JSON.stringify(a[1]) : ''));
}
