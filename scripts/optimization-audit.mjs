/**
 * Optimization audit (§19): every work descriptor needs a complete proof,
 * or must be declared as a legacy page in ps-contract.json.
 *
 * node scripts/optimization-audit.mjs [--strict]
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { load } from 'js-yaml';

const ROOT = process.cwd();
const WORKS = ['kabp', 'kabs'].map((d) => join(ROOT, 'src', 'content', 'works', d));
const CONTRACT = JSON.parse(readFileSync(join(ROOT, 'docs', 'projektstudien-contract', 'ps-contract.json'), 'utf8').replace(/^\uFEFF/, ''));
const STRICT = process.argv.includes('--strict');
const TOL = CONTRACT.optimization?.fillTolerance ?? CONTRACT.thresholds?.fillTolerance ?? 0.01;
const MIN = CONTRACT.optimization?.minCandidates ?? CONTRACT.thresholds?.minCandidates ?? 3;
const LEGACY = new Set(CONTRACT.optimization?.legacyPages ?? []);

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    return d.isDirectory() ? files(p) : d.name.endsWith('.md') ? [p] : [];
  });
}

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? load(m[1]) : null;
}

function validate(slug, opt, errors) {
  const fail = (msg) => errors.push(`${slug}: ${msg}`);
  if (!opt || typeof opt !== 'object') return fail('optimization fehlt');
  if (opt.status !== 'optimized') fail('status muss "optimized" sein');
  if (!Array.isArray(opt.viewport) || opt.viewport.length < 2 || !opt.viewport.every((n) => typeof n === 'number')) {
    fail('viewport muss [w, h] sein');
  }
  const cs = Array.isArray(opt.candidates) ? opt.candidates : [];
  if (cs.length < MIN) fail(`mindestens ${MIN} Kandidaten (ist ${cs.length})`);
  const ids = new Set();
  cs.forEach((c, i) => {
    if (!c || typeof c.id !== 'string' || !c.id.trim()) fail(`candidate[${i}].id fehlt`);
    else if (ids.has(c.id)) fail(`candidate[${i}].id doppelt (${c.id})`);
    else ids.add(c.id);
    if (!c || typeof c.pattern !== 'string' || !c.pattern.trim()) fail(`candidate[${i}].pattern fehlt`);
    if (!c || typeof c.fill !== 'number' || c.fill < 0 || c.fill > 1) fail(`candidate[${i}].fill muss 0..1 sein`);
  });
  const chosen = cs.filter((c) => c && c.chosen === true);
  if (chosen.length !== 1) fail(`genau 1 chosen (ist ${chosen.length})`);
  if (chosen.length === 1) {
    const max = Math.max(...cs.map((c) => (typeof c.fill === 'number' ? c.fill : -1)));
    if (chosen[0].fill < max - TOL) fail(`chosen.fill ${chosen[0].fill} < Kandidaten-Maximum ${max}`);
    const structural = cs.some((c) => c && c !== chosen[0] && c.pattern && c.pattern !== chosen[0].pattern);
    if (!structural) fail('kein strukturell andersartiger Kandidat');
  }
  const s = opt.search;
  if (!s || typeof s !== 'object') fail('search fehlt');
  else {
    if (typeof s.grid !== 'string' || !s.grid.trim()) fail('search.grid fehlt');
    if (!Number.isInteger(s.evaluated) || s.evaluated < cs.length) fail(`search.evaluated muss >= ${cs.length} sein`);
    if (typeof s.exhausted !== 'boolean') fail('search.exhausted muss boolean sein');
    if (s.exhausted === false && !(typeof s.stopReason === 'string' && s.stopReason.trim())) {
      fail('nicht erschoepft, aber kein stopReason');
    }
  }
}

const rows = [];
for (const file of WORKS.flatMap(files)) {
  const slug = basename(file, '.md');
  const fm = frontmatter(readFileSync(file, 'utf8'));
  const opt = fm?.optimization;
  const errors = [];
  const legacy = LEGACY.has(slug);
  if (!opt) {
    rows.push({ slug, status: legacy ? 'legacy' : 'fail', errors: legacy ? [] : ['optimization fehlt'] });
    continue;
  }
  validate(slug, opt, errors);
  rows.push({ slug, status: errors.length ? 'fail' : 'pass', fill: opt.candidates?.find((c) => c.chosen)?.fill, candidates: opt.candidates?.length, legacy, errors });
}

const fails = rows.filter((r) => r.status === 'fail' || (STRICT && r.status === 'legacy'));
for (const r of rows) {
  if (r.status === 'pass') console.log(`PASS    ${r.slug.padEnd(22)} fill ${r.fill}  (${r.candidates} Kandidaten${r.legacy ? ', Legacy-Liste entfernen' : ''})`);
  else if (r.status === 'legacy') console.log(`LEGACY  ${r.slug.padEnd(22)} kein Nachweis (deklariert)`);
  else console.log(`FAIL    ${r.slug.padEnd(22)} ${r.errors.join('; ')}`);
}
const pass = rows.filter((r) => r.status === 'pass').length;
const legacy = rows.filter((r) => r.status === 'legacy').length;
const fail = rows.filter((r) => r.status === 'fail').length;
console.log(`\nOptimierung ${CONTRACT.version}: ${pass} pass, ${legacy} legacy, ${fail} fail${STRICT ? ' (strict)' : ''}`);
if (fails.length) process.exit(1);
