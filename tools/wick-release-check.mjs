#!/usr/bin/env node
// ─── wick-release-check — every surface that names Wick's version must agree ─────────────────────────────────
// Wick's version lives on six surfaces, and a release is not shipped until all six read it. Twice (v1.1-v1.3, then
// v1.5.0) a release reached main and the CHANGELOG and stopped there: the README still named an older version, no tag
// was cut, and the download page linked old zips. A checklist written as prose did not prevent a third time, so this
// reads the surfaces and refuses when they disagree.
//
//   1  wick-meta.json      "version" and "released_at"
//   2  CHANGELOG.md        the newest "## vX (date)" heading: the same version, and the same date as released_at
//   3  README.md           the "**Version:** X" line
//   4  git                 tag vX exists and points at HEAD             (with --tagged)
//   5  build script        VERSION="vX" in the site's build-wick-packages.sh   (with --site <dir>)
//   6  download page       every wick-v*.zip link and the version chip in the site's wick.html   (with --site <dir>)
//
// Zero dependencies. Node >= 18. Exit 0 = all agree, 1 = a surface disagrees, 2 = a surface cannot be read.
//   node tools/wick-release-check.mjs                         surfaces 1-3 agree with each other
//   node tools/wick-release-check.mjs --expect 1.8.0          ...and name 1.8.0
//   node tools/wick-release-check.mjs --tagged                ...and tag v<version> is on HEAD
//   node tools/wick-release-check.mjs --site ../agora-dynamics    ...and the build script + download page agree

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i === -1 ? null : (args[i + 1] ?? ''); };
const expect = opt('--expect');
const site = opt('--site');
const tagged = args.includes('--tagged');

const rows = [];            // [surface, value, ok, note]
let unreadable = false;
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { unreadable = true; return null; } };

const meta = read(path.join(ROOT, 'wick-meta.json'));
const m = meta ? JSON.parse(meta) : {};
const version = m.version;
const want = expect || version;
rows.push(['wick-meta.json version', version, version === want]);

const cl = read(path.join(ROOT, 'CHANGELOG.md')) || '';
const top = cl.match(/^## v(\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)/m);
rows.push(['CHANGELOG newest release', top ? `${top[1]} (${top[2]})` : '(none found)', !!top && top[1] === want]);
rows.push(['wick-meta.json released_at', m.released_at, !!top && m.released_at === top[2],
           top ? `CHANGELOG dates v${top[1]} ${top[2]}` : '']);

const readme = read(path.join(ROOT, 'README.md')) || '';
const rv = readme.match(/\*\*Version:\*\*\s*v?(\d+\.\d+\.\d+)/);
rows.push(['README.md Version line', rv ? rv[1] : '(none found)', !!rv && rv[1] === want]);

if (tagged) {
  let at = null, head = null;
  try {
    at = execFileSync('git', ['-C', ROOT, 'rev-list', '-n', '1', `v${want}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    head = execFileSync('git', ['-C', ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch { /* tag missing */ }
  rows.push([`git tag v${want}`, at ? at.slice(0, 12) : '(missing)', !!at && at === head, head ? `HEAD ${head.slice(0, 12)}` : '']);
}

if (site !== null) {
  const sdir = path.resolve(site || '.');
  const sh = read(path.join(sdir, 'build-wick-packages.sh')) || '';
  const sv = sh.match(/^VERSION="v?(\d+\.\d+\.\d+)"/m);
  rows.push(['build-wick-packages.sh VERSION', sv ? sv[1] : '(none found)', !!sv && sv[1] === want]);
  const page = read(path.join(sdir, 'wick.html')) || '';
  const links = [...page.matchAll(/wick-v(\d+\.\d+\.\d+)-[a-z-]+\.zip/g)].map((x) => x[1]);
  const bad = links.filter((v) => v !== want);
  rows.push(['wick.html zip links', links.length ? `${links.length} links, ${[...new Set(links)].join(', ')}` : '(none found)',
             links.length > 0 && bad.length === 0]);
  // the chip is a label/value pair: <div class="info-label">Version</div><div class="info-value">v1.4.0 — Alpha</div>
  const chip = page.match(/>\s*Version\s*<\/[a-z]+>\s*<[a-z]+[^>]*>\s*v?(\d+\.\d+\.\d+)/i);
  rows.push(['wick.html version chip', chip ? chip[1] : '(none found)', !!chip && chip[1] === want]);
}

const w = Math.max(...rows.map((r) => r[0].length));
console.log(`wick-release-check — expecting ${want ? 'v' + want : '(no version found)'}\n`);
for (const [s, v, ok, note] of rows) console.log(`  ${ok ? '✓' : '✗'} ${s.padEnd(w)}  ${v ?? '(unreadable)'}${note ? `   (${note})` : ''}`);
const bad = rows.filter((r) => !r[2]);
if (unreadable) { console.log('\n  ✗ a surface could not be read: this is not a pass.'); process.exit(2); }
if (bad.length) { console.log(`\n  ✗ ${bad.length} surface(s) disagree. A release is not shipped until every surface names it.`); process.exit(1); }
console.log(`\n  ✓ all ${rows.length} surfaces name v${want}.`);
