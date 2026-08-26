#!/usr/bin/env node
// wick-freshness-audit.mjs — scan the memory layer for MISSING or INCONSISTENT temporal
// provenance. Fifth companion to wick-scrub (credentials), wick-public-readiness (internal
// vocabulary), wick-identity-audit (confabulation anchors), and wick-path-audit (portability).
//
// A memory file with no stamp can tell you WHAT it knows but not WHEN it was last true or
// WHERE it was learned. That is fine for one file and fatal for forty: you cannot order two
// facts, age them, or attribute them to a machine, so a preference captured in March and one
// captured last week read as equally current. MEMORY-PROTOCOL.md §10 makes the stamp
// structural; this scanner is what keeps it from rotting back into prose.
//
// What it checks:
//   1. every memory/*.md carries  *Updated: <date> · <HOST> · first written <date>*  under its H1
//   2. the dates parse, are ordered (first written <= updated), and are not in the future
//   3. every memory/index.md row carries a trailing (YYYY-MM-DD)
//   4. the index row's date AGREES with that file's own stamp — index drift is the failure
//      that matters, because the index is the one thing read every session
//   5. every memory/instincts/*.yaml carries created: and last_reinforced:
//
// Usage:
//   node tools/wick-freshness-audit.mjs            # default: memory/
//   node tools/wick-freshness-audit.mjs <path>     # a specific file or directory
//   node tools/wick-freshness-audit.mjs --all      # whole repo (flags docs and examples)
//   node tools/wick-freshness-audit.mjs --json     # machine-readable
//   node tools/wick-freshness-audit.mjs --warn     # report but always exit 0
//
// Exits 0 if clean, 1 if findings, 2 on error. No network, no telemetry, no LLM.
//
// NOTE: this audits PRESENCE and CONSISTENCY of dates, never whether content is still true.
// A date is a recall aid, not an expiry — judging staleness by age is what wick-consolidate-
// memory deliberately refuses to do. An old file is not a stale file.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// ─── CLI parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = { path: null, all: false, json: false, warn: false, fix: false, refresh: false, host: null };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--all') opts.all = true;
  else if (a === '--json') opts.json = true;
  else if (a === '--warn') opts.warn = true;
  else if (a === '--fix') opts.fix = true;
  else if (a === '--refresh') { opts.fix = true; opts.refresh = true; }
  else if (a === '--host') opts.host = args[++i];
  else if (a === '--help' || a === '-h') {
    console.log(`wick-freshness-audit — flag memory files with missing or inconsistent timestamps.\n\nUsage:\n  node tools/wick-freshness-audit.mjs            Default: memory/\n  node tools/wick-freshness-audit.mjs <path>     Scan a specific file or directory\n  node tools/wick-freshness-audit.mjs --all      Scan the whole repo\n  node tools/wick-freshness-audit.mjs --json     Machine-readable output\n  node tools/wick-freshness-audit.mjs --warn     Report findings but exit 0\n  node tools/wick-freshness-audit.mjs --fix      Backfill stamps + index dates FROM GIT HISTORY\n  node tools/wick-freshness-audit.mjs --fix --host BOX-01   Record a hostname while fixing\n  node tools/wick-freshness-audit.mjs --help     This message\n\n--fix is mechanical, not editorial: dates come from git log, never from today's clock.\nIt BACKFILLS ONLY WHAT IS MISSING and never touches a stamp that already exists — once\nthe stamping commit is in history, git reports it as every stamped file's last change,\nso an overwriting --fix would silently re-date your whole layer to the day you adopted\nthe discipline. Pass --refresh to overwrite from git anyway.\n\nChecks presence + consistency of dates, never whether content is still true.\nExits 0 clean / 1 findings / 2 error. See MEMORY-PROTOCOL.md §10.`);
    process.exit(0);
  }
  else if (!a.startsWith('-')) opts.path = a;
}

// ─── The stamp ───────────────────────────────────────────────────────────
// *Updated: 2026-08-03 · JOHNNY-SIX · first written 2026-06-27*
// The host segment is OPTIONAL — an agent running on a single machine has no "where" to
// record, and demanding one would only teach people to invent it.
const STAMP = /^\*Updated:\s*(\d{4}-\d{2}-\d{2})\s*(?:·\s*([^·*]+?)\s*)?·\s*first written\s*(\d{4}-\d{2}-\d{2})\s*\*$/;
const STAMP_LOOSE = /^\*Updated:/;
const ROW = /^\s*[-*]\s*\[[^\]]+\]\(([^)]+)\)/;
const ROW_DATE = /\((\d{4}-\d{2}-\d{2})\)\s*$/;
const TODAY = new Date().toISOString().slice(0, 10);

// Files under memory/ that are not memory ENTRIES and so carry no stamp of their own.
const EXEMPT = new Set(['.gitkeep', '.observations.jsonl', '.buffer-manifest.md']);

function walk(dir, files = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return files; }
  for (const ent of entries) {
    if (ent.name === '.git' || ent.name === 'node_modules' || ent.name.startsWith('_')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (ent.isFile() && !EXEMPT.has(ent.name) && /\.(md|yaml|yml)$/.test(ent.name)) files.push(full);
  }
  return files;
}

function targets() {
  const root = process.cwd();
  if (opts.path) {
    const p = path.resolve(opts.path);
    if (!fs.existsSync(p)) { console.error(`error: path not found: ${p}`); process.exit(2); }
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  }
  if (opts.all) return walk(root);
  const mem = path.join(root, 'memory');
  if (!fs.existsSync(mem)) {
    console.error('error: no memory/ directory here — run from the project root, or pass a path.');
    process.exit(2);
  }
  return walk(mem);
}

// ─── --fix: backfill stamps from git history ─────────────────────────────
// Dates come from `git log`, never from today's clock. Adopting this discipline on a mature
// memory layer must not flatten forty files to one date — that would destroy the very ordering
// the stamp exists to provide. A file git cannot date is REPORTED, never silently given today.
function gitDates(file) {
  try {
    const out = execFileSync('git', ['log', '--format=%ad', '--date=short', '--', file],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').filter(Boolean);
    return out.length ? { first: out[out.length - 1], last: out[0] } : null;
  } catch { return null; }
}

function runFix(mdFiles) {
  try { execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' }); }
  catch {
    console.error('error: --fix needs git history to date files, and this is not a git repo.');
    console.error('       Stamp by hand rather than letting a tool invent dates.');
    process.exit(2);
  }
  const host = opts.host ? ` · ${opts.host}` : '';
  let stamped = 0, dated = 0, skipped = 0; const undatable = [];

  for (const f of mdFiles) {
    if (path.basename(f) === 'index.md') continue;
    const d = gitDates(f);
    if (!d) { undatable.push(path.relative(process.cwd(), f).replace(/\\/g, '/')); continue; }
    const line = `*Updated: ${d.last}${host} · first written ${d.first}*`;
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const at = lines.findIndex(l => STAMP_LOOSE.test(l.trim()));
    if (at >= 0) {
      // A stamp that already exists is LEFT ALONE unless --refresh. This is load-bearing:
      // once the stamping commit is in history, `git log` reports that commit as every
      // stamped file's last change, so a bare --fix would re-date the whole layer to the day
      // you adopted the discipline — flattening exactly the ordering the stamp exists to
      // preserve, and silently. `Updated` means a CONTENT change, and only the author knows
      // whether a commit was one. --fix backfills what is missing; it does not second-guess
      // what is there.
      if (!opts.refresh || lines[at] === line) { skipped++; continue; }
      lines[at] = line;
    }
    else {
      const h1 = lines.findIndex(l => l.startsWith('# '));
      if (h1 >= 0) {
        lines.splice(h1 + 1, 0, '', line);
      }
      // FRONTMATTER-ONLY FILES (2026-08-26). Slash commands and SKILL.md open with a YAML block
      // and no H1 at all, so "put the stamp under the H1" had nowhere to go and 18 of them were
      // reported unstampable on every run. That made wick's own freshness gate UNABLE TO REACH
      // exit 0 — and a gate that cannot pass is a gate people turn off, which costs you the
      // findings that were real. These files are behaviour definitions; they drift like anything
      // else and deserve a stamp, so it goes immediately after the closing `---`.
      else if (lines[0]?.trim() === '---') {
        const close = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
        if (close < 0) {
          undatable.push(path.relative(process.cwd(), f).replace(/\\/g, '/') + ' (unterminated frontmatter)');
          continue;
        }
        lines.splice(close + 1, 0, '', line);
      }
      else { undatable.push(path.relative(process.cwd(), f).replace(/\\/g, '/') + ' (no H1, no frontmatter)'); continue; }
    }
    fs.writeFileSync(f, lines.join('\n'));
    stamped++;
  }

  for (const f of mdFiles.filter(f => path.basename(f) === 'index.md')) {
    const dir = path.dirname(f);
    const out = fs.readFileSync(f, 'utf8').split('\n').map(line => {
      const m = line.match(ROW);
      if (!m) return line;
      const t = m[1].split('#')[0].replace(/^\.\//, '').trim();
      if (!t.endsWith('.md') || t.startsWith('..') || t.includes('://')) return line;
      const d = gitDates(path.resolve(dir, t));
      if (!d) return line;
      if (ROW_DATE.test(line) && !opts.refresh) { skipped++; return line; }   // see note above
      const next = line.replace(ROW_DATE, '').trimEnd() + ` (${d.last})`;
      if (next !== line) dated++;      // count the rows we CHANGED, not the rows we looked at
      return next;
    });
    fs.writeFileSync(f, out.join('\n'));
    const d = gitDates(f);
    if (d) {
      const line = `*Updated: ${d.last}${host} · first written ${d.first}*`;
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      const at = lines.findIndex(l => STAMP_LOOSE.test(l.trim()));
      if (at >= 0) {
        if (opts.refresh && lines[at] !== line) { lines[at] = line; stamped++; } else skipped++;
      } else {
        const h1 = lines.findIndex(l => l.startsWith('# '));
        if (h1 >= 0) { lines.splice(h1 + 1, 0, '', line); stamped++; }
      }
      fs.writeFileSync(f, lines.join('\n'));
    }
  }

  console.log(`  --${opts.refresh ? 'refresh' : 'fix'}: stamped ${stamped} file(s), dated ${dated} index row(s), from git history.`);
  if (skipped) console.log(`         left ${skipped} existing stamp(s)/row(s) alone` +
    (opts.refresh ? ' (already correct).' : ' — pass --refresh to overwrite from git.'));
  if (undatable.length) {
    console.log(`  NOT dated (git has no history for them — stamp these by hand rather than inventing a date):`);
    for (const u of undatable) console.log(`     ${u}`);
  }
  console.log(`  Re-scanning...\n`);
}

// ─── Scan ────────────────────────────────────────────────────────────────
const findings = [];
const stampOf = {};      // relative posix path -> Updated date, for the index cross-check

function add(file, line, rule, severity, reason) {
  findings.push({ file, line, rule, severity, reason });
}

function scanMarkdown(file, rel, lines) {
  const i = lines.findIndex(l => STAMP.test(l.trim()));
  if (i < 0) {
    const loose = lines.findIndex(l => STAMP_LOOSE.test(l.trim()));
    if (loose >= 0) {
      add(file, loose + 1, 'stamp-malformed', 'high',
        'Stamp line does not parse. Expected: *Updated: YYYY-MM-DD · HOST · first written YYYY-MM-DD*');
    } else {
      add(file, 1, 'stamp-missing', 'high',
        'No provenance stamp. Add *Updated: <date> · <HOST> · first written <date>* under the H1.');
    }
    return;
  }
  const [, updated, host, first] = lines[i].trim().match(STAMP);
  stampOf[rel] = updated;
  if (first > updated)
    add(file, i + 1, 'stamp-inverted', 'high',
      `"first written" (${first}) is after "Updated" (${updated}) — one of the two is wrong.`);
  if (updated > TODAY)
    add(file, i + 1, 'stamp-future', 'high',
      `Updated (${updated}) is in the future. A future date is a typo or an invented date, never a fact.`);
  if (!host)
    add(file, i + 1, 'stamp-no-host', 'low',
      'No host recorded. Optional for a single-machine agent; add it once you run on more than one.');
}

function scanIndex(file, lines) {
  const dir = path.dirname(file);
  lines.forEach((line, n) => {
    const m = line.match(ROW);
    if (!m) return;
    const target = m[1].split('#')[0].replace(/^\.\//, '').trim();
    if (!target.endsWith('.md') || target.startsWith('..') || target.includes('://')) return;
    const d = line.match(ROW_DATE);
    if (!d) {
      add(file, n + 1, 'row-undated', 'med',
        `Index row for ${target} has no date. Staleness should be visible without opening the file.`);
      return;
    }
    const rel = path.relative(path.join(process.cwd(), 'memory'), path.resolve(dir, target))
      .replace(/\\/g, '/');
    const own = stampOf[rel];
    if (own && own !== d[1])
      add(file, n + 1, 'row-drift', 'med',
        `Index says ${d[1]} but ${target} is stamped ${own}. The index is the surface read every session — refresh it.`);
  });
}

function scanInstinct(file, text) {
  if (!/^created:\s*\d{4}-\d{2}-\d{2}\s*$/m.test(text))
    add(file, 1, 'instinct-no-created', 'med',
      'Instinct is missing a valid `created: YYYY-MM-DD`. Without it, confidence cannot be aged.');

  const lr = text.match(/^last_reinforced:\s*(\S+)\s*$/m);
  const n = Number((text.match(/^reinforced:\s*(\d+)\s*$/m) || [])[1] ?? NaN);
  if (!lr) {
    add(file, 1, 'instinct-no-last-reinforced', 'med',
      'Instinct has no `last_reinforced:` key. Use a date, or `null` if never reinforced.');
  } else if (n > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(lr[1])) {
    // `null` is CORRECT for reinforced: 0 — a never-reinforced instinct has no such date, and
    // demanding one would only invite an invented value. It is a contradiction only once the
    // counter has moved.
    add(file, 1, 'instinct-reinforce-mismatch', 'med',
      `reinforced: ${n} but last_reinforced is \`${lr[1]}\` — a reinforced instinct must record when.`);
  }
}

const files = targets();
const mds = files.filter(f => f.endsWith('.md'));
const root = path.join(process.cwd(), 'memory');

if (opts.fix) runFix(mds);

// THE WINDOW MUST SKIP FRONTMATTER (2026-08-26), and this was a FALSE POSITIVE of the worst kind.
// The scan read a fixed first 12 lines. `huggingface/README.md` opens with 20 lines of YAML, so its
// stamp — which is present, correctly placed under the H1 at line 24 — was outside the window and
// reported MISSING. The obvious response to that report is to add a second stamp, so the check was
// steering people to corrupt the very file it was auditing.
//
// A fixed window is a guess about document shape. Skip any leading `---` block, then take the
// window from there.
function headWindow(text, n = 12) {
  const lines = text.split('\n');
  if (lines[0]?.trim() !== '---') return lines.slice(0, n);
  const close = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  return close < 0 ? lines.slice(0, n) : lines.slice(close + 1, close + 1 + n);
}

// pass 1: stamps (populates stampOf, which pass 2 cross-checks the index against)
for (const f of mds) {
  const rel = path.relative(root, f).replace(/\\/g, '/');
  if (path.basename(f) === 'index.md') continue;
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  scanMarkdown(f, rel, headWindow(text));
}
// pass 2: the index — its own stamp, its rows, and drift against pass 1
for (const f of mds.filter(f => path.basename(f) === 'index.md')) {
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const lines = text.split('\n');
  // headWindow, not a fixed slice — identical for an index.md today (they carry no frontmatter),
  // but leaving one call site on the old rule is how the two drift apart later.
  scanMarkdown(f, path.relative(root, f).replace(/\\/g, '/'), headWindow(text));
  scanIndex(f, lines);
}
for (const f of files.filter(f => /\.ya?ml$/.test(f) && f.includes('instincts'))) {
  if (path.basename(f).startsWith('EXAMPLE')) continue;
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  scanInstinct(f, text);
}

// ─── Report ──────────────────────────────────────────────────────────────
// `low` findings are advisory and never fail CI — a shipped template has no hostname to record,
// and a single-machine agent has no "where" worth inventing. Only high/med gate.
const blocking = findings.filter(f => f.severity !== 'low');

if (opts.json) {
  console.log(JSON.stringify({ scanned: files.length, findings: findings.length, blocking: blocking.length, items: findings }, null, 2));
} else if (findings.length === 0) {
  console.log(`✓ wick-freshness-audit: scanned ${files.length} file(s), every entry dated and the index agrees.`);
} else if (blocking.length === 0) {
  console.log(`✓ wick-freshness-audit: scanned ${files.length} file(s), every entry dated and the index agrees.`);
  console.log(`  ${findings.length} advisory note(s) (severity low, non-blocking) — pass --json to see them.`);
} else {
  console.log(`✗ wick-freshness-audit: ${blocking.length} blocking finding(s) across ${files.length} scanned file(s).\n`);
  for (const f of blocking) {
    const rel = path.relative(process.cwd(), f.file).replace(/\\/g, '/');
    console.log(`   ${rel}:${f.line}  [${f.severity}] ${f.rule}`);
    console.log(`     ${f.reason}`);
  }
  console.log(`\nThe stamp answers what / when / where: *Updated: <date> · <HOST> · first written <date>*.`);
  console.log(`Bump "Updated" for a CONTENT change, not for a typo. Backfill with --fix.`);
  console.log(`See MEMORY-PROTOCOL.md §10.`);
}

process.exit(blocking.length === 0 || opts.warn ? 0 : 1);
