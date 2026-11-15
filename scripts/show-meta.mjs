import { readdirSync, readFileSync } from 'fs';

const dir = 'src/content/projektstudien/';
for (const f of readdirSync(dir).sort()) {
  if (!f.endsWith('.md')) continue;
  const c = readFileSync(dir + f, 'utf8');
  const fm = c.split('---')[1] || '';
  const get = k => {
    const m = fm.match(new RegExp('^' + k + ':\\s*[\'"]?([^\'"\n]*)', 'm'));
    return m ? m[1].trim() : '';
  };
  console.log('=== ' + f.replace('.md', ''));
  for (const k of ['title', 'location', 'year', 'client', 'material']) {
    console.log('   ' + k.padEnd(9) + ': ' + get(k));
  }
}
