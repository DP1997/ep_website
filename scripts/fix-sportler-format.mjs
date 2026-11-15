import { readFileSync, writeFileSync } from 'node:fs';

const ASTRO = 'src/pages/projektstudien/sportler-in-bewegung.astro';
let astro = readFileSync(ASTRO, 'utf8');
const E = astro.includes('\r\n') ? '\r\n' : '\n';

const before = astro;
astro = astro.replace(
  '      </div>' + E + '    </div>' + E + '  </article>',
  '      </div>' + E + '    </div>' + E + '  </article>'
);
astro = astro.replace(
  /(      <\/div>)(    <\/div>)/,
  '$1' + E + '    $2'
);

if (astro === before) throw new Error('kein Patch angewendet');
writeFileSync(ASTRO, astro, 'utf8');
console.log('Formatierung korrigiert');
