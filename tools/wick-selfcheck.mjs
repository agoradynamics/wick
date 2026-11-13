#!/usr/bin/env node
// ─── wick-selfcheck — stepwise retrieval and superseded facts, checked end to end ──
// Wick has no test framework and wants none: zero dependencies is a feature. This builds throwaway memory layers in
// the OS temp directory, runs the real CLIs against them the way a person does, and checks what they print and what
// they leave on disk. No network, no model: wick-ask runs with --dry.
//
// What it checks:
//   1. backward compatibility: memory with no tag in it reads byte for byte as before, and the old flags still work
//   2. entries: a dated bullet is an entry, a dated FIELD is not, a template's example is not, a quoted tag is not live
//   3. supersede: the new fact is written, the old one marked with a date and a pointer, nothing is deleted, the stamp
//      and index row move, and every refusal leaves the disk exactly as it was
//   4. hidden by default: routing, --index, --get and wick-ask skip a superseded entry; --include-superseded shows it
//   5. size: on a large generated memory set, step 1 stays a few lines however big memory gets
//   6. the prediction ledger (wick-ledger): both entry shapes parse, the Brier arithmetic and the two baselines are
//      right on fixed numbers, the due check and its --hook form behave, every refusal leaves the disk as it was, and a
//      block the parser cannot read is reported and never touched
//
// Exit 0 = every check passed, 1 = a check failed.
//   node tools/wick-selfcheck.mjs
//   node tools/wick-selfcheck.mjs --keep     leave the temp layers on disk to look at

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { entries, activeText } from './wick-recall.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const keep = process.argv.includes('--keep');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'wick-selfcheck-'));
const now = new Date();
const TODAY = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const ON = '2026-09-30';                         // the supersede date used throughout: in the past for any real clock

let passed = 0, failed = 0;
const check = (name, ok, why = '') => {
  if (ok) passed++; else failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !why ? '' : '\n      ' + String(why).trim().split('\n').join('\n      ')}`);
};
const run = (tool, args, mem, cwd = ROOT) => {
  const r = spawnSync(process.execPath, [path.join(HERE, tool), ...args],
                      { cwd, encoding: 'utf8', env: { ...process.env, WICK_MEMORY: mem } });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
};
const put = (dir, files) => {
  for (const [f, t] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), t);
  }
  return dir;
};
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const snap = (dir) => Object.fromEntries(fs.readdirSync(dir).sort().map(f => [f, read(dir, f)]));
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.md') ? [path.join(dir, e.name)] : []);
const rows = (out) => out.split('\n').filter(l => l.startsWith('  '));
// Nothing deleted: every line of the file before, in order, is still there after, once the appended tags are taken
// off. The stamp's date is the one field that is allowed to move.
const norm = (l) => l.replace(/\s*\[(?:superseded|supersedes):[^\]]*\]/g, '').replace(/^\*Updated: \d{4}-\d{2}-\d{2}/, '*Updated: D');
const kept = (before, after) => {
  const a = after.split('\n').map(norm);
  let j = 0;
  for (const l of before.split('\n').map(norm)) {
    while (j < a.length && a[j] !== l) j++;
    if (j++ === a.length) return false;
  }
  return true;
};

// ─── the fixture: an ordinary memory layer with no tags, the shape the templates teach ─────────────────
const FIXTURE = {
  'index.md': `# Memory Index

*Updated: 2026-08-01 · first written 2026-08-01*

## Core
- [learning-journal](learning-journal.md) — how this person works: preferences, corrections (2026-08-03)
- [decisions](decisions.md) — dated decision log: billing, hosting, what we decided and why (2026-09-01)
- [domain-knowledge](domain-knowledge.md) — field terms and definitions: churn, runway (2026-08-03)
`,
  'learning-journal.md': `# Learning Journal

*Updated: 2026-08-03 · first written 2026-04-20*

What Wick has learned about working with you.

## Preferences Discovered
- [2026-05-02] prefers brief answers with the number first
- [2026-06-11] wants citations named inline, never as footnotes

## Corrections Given
<!-- These are the most valuable entries. -->
- [2026-07-19] the staging database is read-only on weekends; never propose
  a migration for a Saturday
`,
  'decisions.md': `# Decision Log

*Updated: 2026-09-01 · first written 2026-04-20*

Decisions made with Wick, logged with framework citations and dates.

---

<!-- Template for new entries:

### YYYY-MM-DD — [Decision Title]
- **Context:** What prompted this decision

-->

### 2026-06-02 — Monthly billing for the starter tier
- **Context:** churn on annual plans during the pilot
- **Decision:** bill the starter tier every month
- **Review date:** 2026-12-01

### 2026-09-01 — Hosting stays on the single VPS
- **Context:** traffic is flat
- **Decision:** no move to managed hosting this year

---
*Wick appends to this file after each /decide session.*
`,
  'domain-knowledge.md': `# Domain Knowledge

*Updated: 2026-08-03 · first written 2026-04-20*

## Subscription metrics

### Key Concepts
- **Churn** *[2026-03-03]* — share of accounts lost per month
- **Churn** *[2026-09-09]* — share of revenue lost per month, net of expansion
- **Runway** *[2026-04-04]* — months of cash at the current burn
`,
};
const LJ_OLD = 'learning-journal.md#2026-05-02-prefers-brief-answers-with-the-number-first';
// An id is the title slugged to at most 10 words and 64 characters, so a long title is cut ("...-that-shows-the").
const LJ_NEW = `learning-journal.md#${ON}-prefers-a-short-paragraph-that-shows-the`;
const DEC_MID = 'decisions.md#2026-06-02-monthly-billing-for-the-starter-tier';
const DEC_LAST = 'decisions.md#2026-09-01-hosting-stays-on-the-single-vps';
const CHURN_OLD = 'domain-knowledge.md#churn-2026-03-03-share-of-accounts-lost-per-month';
const CHURN_NEW = 'domain-knowledge.md#churn-2026-09-09-share-of-revenue-lost-per-month';

console.log(`wick-selfcheck — stepwise retrieval + superseded facts   (temp: ${TMP})`);

// ─── 1. backward compatibility ─────────────────────────────────────────────
console.log('\n1. backward compatibility (memory with no tags)');
const shipped = path.join(ROOT, 'memory');
const plain = put(path.join(TMP, 'plain'), FIXTURE);
{
  const all = [...walk(shipped).map(p => [shipped, p]), ...walk(plain).map(p => [plain, p])];
  const changed = all.filter(([d, p]) => { const t = fs.readFileSync(p, 'utf8'); return activeText(path.relative(d, p), t) !== t; });
  check(`activeText returns every untagged file byte for byte (${all.length} files: the shipped templates + the fixture)`,
        all.length > 10 && !changed.length, changed.map(([, p]) => p).join('\n'));

  const queries = ['how do I handle a flaky prediction?', 'what did we decide about billing?', 'brier score calibration',
                   'which machine toolchain', 'corrections preferences', 'churn runway definitions', 'hosting VPS'];
  const diff = [];
  for (const mem of [shipped, plain]) {
    for (const q of queries) {
      for (const extra of [[], ['-k', '3']]) {
        const a = run('wick-recall.mjs', [...extra, q], mem), b = run('wick-recall.mjs', [...extra, '--include-superseded', q], mem);
        if (a.out !== b.out || a.code !== 0) diff.push(`wick-recall ${extra.join(' ')} "${q}" on ${path.basename(path.dirname(mem))}/${path.basename(mem)}`);
      }
      const a = run('wick-ask.mjs', ['--dry', q], mem), b = run('wick-ask.mjs', ['--dry', '--include-superseded', q], mem);
      if (a.out !== b.out || a.code !== 0) diff.push(`wick-ask --dry "${q}"`);
    }
  }
  check(`untagged memory routes and answers the same with and without --include-superseded (${queries.length * 2 * 3} runs)`,
        !diff.length, diff.join('\n'));

  const top = run('wick-recall.mjs', ['billing hosting decided'], plain);
  check('the default router still names files (decisions.md first for "billing hosting decided")',
        rows(top.out)[0]?.trim().startsWith('decisions.md'), top.out + top.err);
  const one = run('wick-recall.mjs', ['-k', '1', 'preferences corrections billing churn'], plain);
  check('-k still caps the rows (-k 1 prints one)', rows(one.out).length === 1, one.out);
  const bare = run('wick-recall.mjs', [], plain);
  check('no query still prints the usage and exits 1',
        bare.code === 1 && bare.out.startsWith('usage: node tools/wick-recall.mjs [-k N]'), bare.out);
  const gone = run('wick-recall.mjs', ['anything'], path.join(TMP, 'no-such-memory'));
  check('unreachable memory still exits 2 and never says "(no match)"',
        gone.code === 2 && !gone.out.includes('no match'), gone.out + gone.err);
  const typo = run('wick-recall.mjs', ['--include-supersede', 'billing'], plain);
  check('a mistyped flag is an error (exit 2), not a word of the query', typo.code === 2, typo.out + typo.err);
}

// ─── 2. entries ────────────────────────────────────────────────────────────
console.log('\n2. entries');
{
  const lj = entries('learning-journal.md', FIXTURE['learning-journal.md']);
  const wrap = lj.find(e => e.id === 'learning-journal.md#2026-07-19-the-staging-database-is-read-only-on');
  check('a dated bullet is an entry, and its wrapped line stays with it',
        lj.some(e => e.id === LJ_OLD) && !!wrap && wrap.text.includes('a migration for a Saturday'), lj.map(e => e.id).join('\n'));
  const dec = entries('decisions.md', FIXTURE['decisions.md']);
  const mid = dec.find(e => e.id === DEC_MID);
  check('a dated FIELD (- **Review date:** ...) stays inside its decision, not split off',
        !!mid && mid.text.includes('Review date') && !dec.some(e => /review-date/.test(e.id)), dec.map(e => e.id).join('\n'));
  check('a template example inside an HTML comment is not an entry', !dec.some(e => /yyyy/.test(e.id)), dec.map(e => e.id).join('\n'));
  const dk = entries('domain-knowledge.md', FIXTURE['domain-knowledge.md']);
  check('domain-knowledge\'s "- **Term** *[date]*" bullets are entries, and two of one term get two ids',
        dk.some(e => e.id === CHURN_OLD) && dk.some(e => e.id === CHURN_NEW), dk.map(e => e.id).join('\n'));
  const quoted = entries('x.md', '- [2026-01-01] write `[superseded: 2026-01-02 → x.md#y]` to retire a fact\n')[0];
  const live = entries('x.md', '- [2026-01-01] the old fact [superseded: 2026-01-02 → x.md#y]\n')[0];
  check('a tag inside a code span is documentation, not a tag; an unquoted one is live',
        quoted && !quoted.superseded && live?.superseded?.date === '2026-01-02' && live.superseded.by === 'x.md#y');
  const sec = '# X\n\n## Old plan [superseded: 2026-01-02 → x.md#new-plan]\nthe plan\n- [2026-01-01] a dated note under it\n\n## New plan\nthe new plan\n';
  const se = entries('x.md', sec), act = activeText('x.md', sec);
  check('a tag on a heading retires the whole section under it, dated bullets included',
        se.find(e => e.id === 'x.md#2026-01-01-a-dated-note-under-it')?.superseded?.inherited === true &&
        !act.includes('a dated note') && !act.includes('Old plan') && act.includes('the new plan') &&
        act.split('\n').length === sec.split('\n').length, act);
}

// ─── 3. supersede ──────────────────────────────────────────────────────────
console.log('\n3. supersede: the new fact written, the old one marked, nothing deleted');
const flowRoot = path.join(TMP, 'flow'), flow = put(path.join(flowRoot, 'memory'), FIXTURE);
{
  const before = snap(flow);
  const r = run('wick-supersede.mjs', [LJ_OLD, 'prefers a short paragraph that shows the reasoning', '--date', ON], flow);
  const after = read(flow, 'learning-journal.md'), lines = after.split('\n');
  const at = lines.findIndex(l => l.startsWith('- [2026-05-02]'));
  check('supersede a dated bullet: exit 0', r.code === 0, r.out + r.err);
  check('the old bullet keeps its words and gains [superseded: <date> → <new id>]',
        lines[at] === `- [2026-05-02] prefers brief answers with the number first [superseded: ${ON} → ${LJ_NEW}]`, lines[at]);
  check('the new bullet is written straight after it, same shape, pointing back',
        lines[at + 1] === `- [${ON}] prefers a short paragraph that shows the reasoning [supersedes: ${LJ_OLD}]`, lines[at + 1]);
  check('nothing was deleted: every earlier line is still there, in order', kept(before['learning-journal.md'], after));
  const stamp = after.match(/^\*Updated: (\d{4}-\d{2}-\d{2})/m)?.[1];
  const row = read(flow, 'index.md').match(/learning-journal\.md\).*\((\d{4}-\d{2}-\d{2})\)/)?.[1];
  check(`the file's Updated stamp and its index.md row both moved to today (${TODAY})`, stamp === TODAY && row === TODAY, `${stamp} / ${row}`);

  const r2 = run('wick-supersede.mjs', [DEC_LAST, 'Hosting moves to managed containers', '--date', ON], flow);
  const d2 = read(flow, 'decisions.md'), dl = d2.trimEnd().split('\n');
  const newHead = `### ${ON} — Hosting moves to managed containers`;
  const at2 = dl.indexOf(newHead);
  check('supersede the last decision: a heading of the same shape, a "Replaces:" line carrying the pointer, above the footer',
        r2.code === 0 && at2 > 0 && dl[at2 + 1] === `- **Replaces:** 2026-09-01 — Hosting stays on the single VPS [supersedes: ${DEC_LAST}]` &&
        at2 < dl.lastIndexOf('---') && dl[dl.length - 1] === '*Wick appends to this file after each /decide session.*', r2.err + d2);
  const r3 = run('wick-supersede.mjs', [DEC_MID, 'Annual billing for the starter tier', '--date', ON], flow);
  const d3 = read(flow, 'decisions.md').split('\n');
  const h3 = d3.findIndex(l => l.startsWith(`### ${ON} — Annual billing`));
  check('supersede a middle decision: the new one sits after the old one\'s last field, before the next decision',
        r3.code === 0 && h3 > d3.findIndex(l => l.includes('**Review date:**')) && h3 < d3.findIndex(l => l.startsWith('### 2026-09-01')) &&
        d3[h3 - 1] === '' && d3[h3 + 1].startsWith('- **Replaces:** 2026-06-02') && d3[h3 + 2] === '', r3.err + d3.join('\n'));
  check('nothing was deleted from decisions.md across both', kept(before['decisions.md'], read(flow, 'decisions.md')));

  const r4 = run('wick-supersede.mjs', [CHURN_OLD, '--by', CHURN_NEW, '--date', ON], flow);
  const dk = entries('domain-knowledge.md', read(flow, 'domain-knowledge.md'));
  check('--by links two existing entries: the old marked, the new pointing back, no new text written',
        r4.code === 0 && dk.find(e => e.id === CHURN_OLD)?.superseded?.by === CHURN_NEW &&
        dk.find(e => e.id === CHURN_NEW)?.supersedes === CHURN_OLD && dk.length === entries('d', FIXTURE['domain-knowledge.md']).length,
        r4.out + r4.err);

  const fresh = run('wick-freshness-audit.mjs', [], flow, flowRoot);
  if (TODAY > new Date().toISOString().slice(0, 10)) {
    console.log('  - wick-freshness-audit skipped: the local date is ahead of UTC, which that audit reads as "future"');
  } else {
    check('wick-freshness-audit passes on the layer afterwards (stamps and index rows agree)', fresh.code === 0, fresh.out + fresh.err);
  }

  const held = snap(flow);
  const refusals = [
    ['an unknown id', ['learning-journal.md#no-such-entry', 'x'], 2],
    ['an id that climbs out of memory/', ['../outside.md#x', 'x'], 2],
    ['an index.md id', ['index.md#core', 'x'], 2],
    ['an entry that is already superseded', [LJ_OLD, 'again'], 1],
    ['a date in the future', [`learning-journal.md#2026-06-11-wants-citations-named-inline-never-as-footnotes`, 'x', '--date', '2999-01-01'], 1],
    ['both a new fact and --by', [LJ_NEW, 'x', '--by', LJ_OLD], 2],
    ['--dry', ['learning-journal.md#2026-06-11-wants-citations-named-inline-never-as-footnotes', 'cites with links'], 0, ['--dry']],
  ];
  const bad = [];
  for (const [what, a, code, extra = []] of refusals) {
    const x = run('wick-supersede.mjs', [...a, ...extra], flow);
    if (x.code !== code) bad.push(`${what}: exit ${x.code}, expected ${code}\n${x.out}${x.err}`);
  }
  const same = JSON.stringify(snap(flow)) === JSON.stringify(held);
  check(`every refusal exits as documented and --dry writes nothing; the disk is byte-identical after all ${refusals.length}`,
        !bad.length && same, bad.join('\n') + (same ? '' : '\nthe disk changed'));

  // Superseding must never rename an existing entry: a new fact whose slug equals a LATER entry's would push that one
  // to "-2" and break every pointer to it.
  const col = put(path.join(TMP, 'collide'), { 'c.md': `# C\n\n- [2026-01-01] the old fact\n- [${ON}] same words here\n` });
  const c0 = read(col, 'c.md');
  const c = run('wick-supersede.mjs', ['c.md#2026-01-01-the-old-fact', 'same words here', '--date', ON], col);
  check('a new entry that would rename an existing one is refused (exit 1) and nothing is written',
        c.code === 1 && read(col, 'c.md') === c0, c.out + c.err);

  const crlf = put(path.join(TMP, 'crlf'), { 'l.md': '# L\r\n\r\n*Updated: 2026-01-01 · first written 2026-01-01*\r\n\r\n- [2026-01-01] old\r\n- [2026-01-02] other\r\n' });
  const w = run('wick-supersede.mjs', ['l.md#2026-01-01-old', 'new', '--date', ON], crlf);
  const lt = read(crlf, 'l.md');
  check('a CRLF file stays CRLF', w.code === 0 && !/[^\r]\n/.test(lt) && lt.includes(`- [${ON}] new [supersedes: l.md#2026-01-01-old]\r\n`), lt);
}

// ─── 4. hidden by default ──────────────────────────────────────────────────
console.log('\n4. superseded entries are hidden by default, and one flag away');
{
  const q = 'preferences brief answers number first';
  const i0 = run('wick-recall.mjs', ['--index', q], flow), i1 = run('wick-recall.mjs', ['--index', '--include-superseded', q], flow);
  check('--index leaves the superseded entry out and lists its replacement', !i0.out.includes(LJ_OLD) && i0.out.includes(LJ_NEW), i0.out);
  check('--index --include-superseded lists it, marked', i1.out.includes(LJ_OLD) && i1.out.includes(`[superseded ${ON} →`), i1.out);

  // "monthly" lived only in the superseded decision's heading, so it was only ever on the routing surface through it.
  const r0 = run('wick-recall.mjs', ['monthly'], flow), r1 = run('wick-recall.mjs', ['--include-superseded', 'monthly'], flow);
  check('the router stops routing on a superseded heading, and routes on it again with the flag',
        !r0.out.includes('decisions.md') && r1.out.includes('decisions.md'), r0.out + '\n--\n' + r1.out);

  const g0 = run('wick-recall.mjs', ['--get', LJ_OLD], flow), g1 = run('wick-recall.mjs', ['--get', '--include-superseded', LJ_OLD], flow);
  check('--get on a superseded id says so and returns the replacement instead',
        g0.code === 0 && g0.out.includes(`was superseded on ${ON}`) && g0.out.includes(`── ${LJ_NEW}`) && !g0.out.includes(`── ${LJ_OLD}`), g0.out + g0.err);
  check('--get --include-superseded returns the old entry itself, marked',
        g1.code === 0 && g1.out.includes(`── ${LJ_OLD}`) && g1.out.includes('[SUPERSEDED'), g1.out);
  const gm = run('wick-recall.mjs', ['--get', LJ_NEW, 'learning-journal.md#no-such-entry'], flow);
  check('--get with an unknown id prints what it found and exits 2', gm.code === 2 && gm.out.includes(`── ${LJ_NEW}`), gm.out + gm.err);

  const a0 = run('wick-ask.mjs', ['--dry', q], flow), a1 = run('wick-ask.mjs', ['--dry', '--include-superseded', q], flow);
  check('wick-ask never offers the superseded text as a source; --include-superseded does',
        a0.out.includes('learning-journal.md') && !a0.out.includes('with the number first') && a1.out.includes('with the number first'),
        a0.out + '\n--\n' + a1.out);
  const h0 = run('wick-ask.mjs', ['--dry', 'what did we decide about hosting?'], flow);
  check('wick-ask reads the decision that replaced a superseded one (and not the old one)',
        h0.out.includes('Hosting moves to managed containers') && !h0.out.includes('no move to managed hosting'), h0.out);
}

// ─── 5. size ───────────────────────────────────────────────────────────────
console.log('\n5. step 1 stays small on a large memory set');
{
  let seed = 7;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const V = ('ledger invoice vendor contract renewal budget forecast audit payroll hiring onboarding roadmap release ' +
    'migration outage latency cache queue backlog sprint review retro pricing discount churn cohort funnel trial ' +
    'upgrade refund dispute compliance policy privacy consent backup restore schema index replica shard region ' +
    'deploy rollback canary flag experiment metric dashboard alert pager incident postmortem runbook escalation ' +
    'partner reseller channel campaign launch webinar newsletter survey interview persona segment territory quota ' +
    'pipeline deal proposal negotiation signature invoice tax filing quarter annual monthly weekly standup offsite').split(' ');
  const sentence = () => Array.from({ length: 8 + rnd(7) }, () => V[rnd(V.length)]).join(' ');
  const date = () => `2026-${String(1 + rnd(9)).padStart(2, '0')}-${String(1 + rnd(28)).padStart(2, '0')}`;
  const F = 120, E = 250, big = {};
  const idx = ['# Memory Index', '', '*Updated: 2026-08-01 · first written 2026-08-01*', '', '## Logs'];
  for (let f = 1; f <= F; f++) {
    const name = `log-${String(f).padStart(3, '0')}.md`;
    big[name] = [`# Log ${f}`, '', '*Updated: 2026-08-01 · first written 2026-01-01*', '', '## Entries',
                 ...Array.from({ length: E }, () => `- [${date()}] ${sentence()}`)].join('\n') + '\n';
    idx.push(`- [log-${f}](${name}) — ${V[rnd(V.length)]}, ${V[rnd(V.length)]} and ${V[rnd(V.length)]} notes (2026-08-01)`);
  }
  // One long file with a fact buried near the top: §13 measured 0% recall across the first 70% of a 551-line file
  // read whole. Step 2 hands back that one entry instead of the file.
  const kiln = Array.from({ length: 600 }, () => `- [${date()}] ${sentence()}`);
  kiln[50] = '- [2026-02-14] the kiln thermocouple reads 40 degrees low; add 40 to every logged temperature';
  big['kiln-log.md'] = ['# Kiln log', '', '*Updated: 2026-08-01 · first written 2026-01-01*', '', ...kiln].join('\n') + '\n';
  idx.push('- [kiln-log](kiln-log.md) — kiln firing log: temperatures, cones, schedules (2026-08-01)');
  big['index.md'] = idx.join('\n') + '\n';
  const large = put(path.join(TMP, 'large'), big);

  const bytes = Object.values(big).reduce((s, t) => s + Buffer.byteLength(t), 0);
  const all = Object.entries(big).filter(([f]) => f !== 'index.md').flatMap(([f, t]) => entries(f, t));
  const naive = all.reduce((s, e) => s + Buffer.byteLength(`  ${e.id}   0.00  ${e.desc}\n`), 0);
  const BOUND = 2048, sizes = [];
  let worst = 0, over = [];
  for (const q of ['pricing discount churn cohort', 'outage postmortem runbook pager', 'kiln thermocouple temperature offset',
                   'vendor contract renewal signature', 'what did we decide about the hiring budget?']) {
    const t0 = Date.now(), r = run('wick-recall.mjs', ['--index', q], large), ms = Date.now() - t0;
    const b = Buffer.byteLength(r.out), n = r.out.trimEnd().split('\n').length;
    sizes.push(`${b} B / ${n} lines / ${ms} ms  "${q}"`);
    worst = Math.max(worst, b);
    // A question that no index row or heading matches routes nowhere (the router reads index rows and headings, not
    // bullet prose) and prints one line. Every other question must print exactly 8 rows.
    const none = r.out.startsWith('(no match');
    if (r.code !== 0 || b > BOUND || n > 8 + 2 || (!none && rows(r.out).length !== 8)) over.push(`${q}: exit ${r.code}, ${b} B, ${n} lines\n${r.out}${r.err}`);
  }
  check(`${all.length.toLocaleString('en-US')} entries in ${F + 1} files (${(bytes / 1048576).toFixed(1)} MB): --index printed at most ` +
        `${worst.toLocaleString('en-US')} bytes, 8 rows (bound ${BOUND.toLocaleString('en-US')}); one row per entry for the whole layer ` +
        `would be ${(naive / 1048576).toFixed(1)} MB`, !over.length, over.join('\n'));
  for (const s of sizes) console.log(`      ${s}`);
  const n3 = run('wick-recall.mjs', ['--index', '-n', '3', 'pricing discount'], large);
  check('-n caps step 1 (-n 3 prints three rows)', rows(n3.out).length === 3, n3.out);

  const needle = 'kiln-log.md#2026-02-14-the-kiln-thermocouple-reads-40-degrees-low';
  const ki = run('wick-recall.mjs', ['--index', 'kiln thermocouple temperature offset'], large);
  const kg = run('wick-recall.mjs', ['--get', needle], large);
  check('a fact at line 55 of a 604-line file is the top row of step 1, and step 2 returns just that entry',
        rows(ki.out)[0]?.trim().startsWith(needle) && kg.code === 0 && kg.out.includes('reads 40 degrees low') &&
        Buffer.byteLength(kg.out) < 300, ki.out + '\n--\n' + kg.out + kg.err);
}

// ─── 6. the prediction ledger ──────────────────────────────────────────────
console.log('\n6. wick-ledger: both shapes read, the arithmetic done by code, nothing unread ever touched');
{
  const seen = [];                                   // everything the tool printed, for the no-verdict check at the end
  const L = (args, mem) => { const r = run('wick-ledger.mjs', args, mem); seen.push(r.out, r.err); return r; };
  const json = (r) => { try { return JSON.parse(r.out); } catch { return null; } };
  const bumped = (t) => t.replace(/^\*Updated: \d{4}-\d{2}-\d{2}/m, `*Updated: ${TODAY}`);
  const crlf = (t) => t.replace(/\n/g, '\r\n');
  const isCrlf = (t) => t.includes('\r\n') && !/[^\r]\n/.test(t) && !/\r(?!\n)/.test(t);

  // The ledger the templates teach, holding both shapes a model writes: bold and plain bullet records, a heading
  // record under ## Pending whose date has free text after it, and a resolved heading record outside both sections.
  const VENDOR = `- **Date:** 2026-09-01
- **Claim:** The vendor contract renews before October
- **Probability:** 70%
- **Resolve by:** 2026-10-01
- **Reasoning:** base rate of renewals
- **Status:** pending`;
  const LEDGER = `# Predictions Ledger

*Updated: 2026-08-01 · first written 2026-04-20*

Probability claims logged for calibration.

## Pending

<!-- Template:
- **Date:** YYYY-MM-DD
- **Claim:** [specific, resolvable statement]
- **Probability:** XX%
- **Resolve by:** YYYY-MM-DD
- **Reasoning:** [one-line framework citation]
- **Status:** pending
-->

${VENDOR}

- Date: 2026-09-05
- Claim: The audit closes with no findings
- Probability: 0.4
- Resolve by: 2026-12-15
- Status: pending

### 2026-09-10 — The release ships in November
- Probability: 85
- Resolve by: 2026-11-30 (or the day the tag is cut, whichever is first)
- Reasoning: two sprints left
- Status: pending
- Outcome:
- Brier:

## Resolved

<!-- Template:
- **Date:** YYYY-MM-DD
- **Claim:** [the original claim]
- **Probability:** XX% (predicted) | **Outcome:** true / false
- **Brier score:** (probability/100 - outcome)^2
- **Lesson:** [what was learned]
-->

- **Date:** 2026-06-01
- **Claim:** Hiring closes by July
- **Probability:** 90% (predicted) | **Outcome:** true
- **Brier score:** 0.0100
- **Lesson:** the pipeline was already full

## 2026-06-10 – Churn stays under 3% in Q2
- **Probability:** 60%
- **Resolve by:** 2026-07-01
- **Status:** resolved
- **Outcome:** false
- **Brier:** 0.3600

---
*Wick MUST log here before stating any resolvable probability (Gate 5).*
`;
  const CAL = `# Calibration Stats

*Updated: 2026-04-20 · first written 2026-04-20*

Running accuracy metrics across all resolved predictions.

## Summary
- **Total predictions:** 0
- **Resolved:** 0
- **Pending:** 0
- **Mean Brier score:** N/A
- **Calibration:** N/A (need 10+ resolved predictions)

## By Confidence Bucket

| Bucket | Count | Hit Rate | Expected |
|--------|-------|----------|----------|
| 90%+   | 0     | --       | ~90%     |
| 70-89% | 0     | --       | ~80%     |
| 50-69% | 0     | --       | ~60%     |
| 30-49% | 0     | --       | ~40%     |
| <30%   | 0     | --       | ~20%     |

## Trend
<!-- Populated later. -->

## What These Numbers Mean
- **Brier score:** lower is closer. Always saying 50% scores 0.25.
- a hand-written note that no tool may touch

---
*Updated by /review command.*
`;
  const IDX = `# Memory Index

*Updated: 2026-08-01 · first written 2026-08-01*

## Core
- [predictions](predictions.md) — forecasts and probability estimates with resolve-by dates (2026-08-01)
- [calibration](calibration.md) — Brier score, hit rate per bucket (2026-04-20)
`;
  const layer = (name, ledger = LEDGER) => put(path.join(TMP, name), { 'predictions.md': ledger, 'calibration.md': CAL, 'index.md': IDX });

  // ── reading ──
  const base = layer('ledger');                      // read-only from here on: every refusal below is run against it
  const held = snap(base);
  const j0 = json(L(['list', '--json'], base));
  const row = (e) => `${e.n} ${e.shape} ${e.date} ${e.probability}% by ${e.resolveBy} ${e.outcome ?? '-'} ${e.claim}`;
  const got = j0 ? [...j0.pending, ...j0.resolved].map(row).join('\n') : '(no JSON)';
  check('both shapes parse: bullet records and heading records, numbered in file order, pending first',
        got === ['1 A 2026-09-01 70% by 2026-10-01 - The vendor contract renews before October',
                 '2 A 2026-09-05 40% by 2026-12-15 - The audit closes with no findings',
                 '3 B 2026-09-10 85% by 2026-11-30 - The release ships in November',
                 '4 A 2026-06-01 90% by null true Hiring closes by July',
                 '5 B 2026-06-10 60% by 2026-07-01 false Churn stays under 3% in Q2'].join('\n') && j0.pending.length === 3, got);
  const dash = put(path.join(TMP, 'ledger-dash'), { 'predictions.md': '# P\n\n## 2026-01-05 - A hyphen in the heading\n- probability: 55%\n' +
    '- RESOLVE BY: 2026-03-01\n\n### 2026-01-06 — An em dash, bold labels, a bare fraction\n- **Prob:** .2\n- **Resolve-by:** 2026-03-02\n' });
  const jd = json(L(['list', '--json'], dash));
  check('labels match in any case, bold or plain; 55%, 0.4, 85 and .2 are all probabilities; em dash, en dash and hyphen all open a heading record',
        jd?.pending.map(e => `${e.shape}${e.probability}`).join(' ') === 'B55 B20' && j0.pending.map(e => e.probability).join(' ') === '70 40 85',
        JSON.stringify(jd));
  const shippedLedger = json(L(['list', '--json', '--file', path.join(ROOT, 'memory', 'predictions.md')], base));
  check('a template inside an HTML comment is not an entry: the fixture reads as 5 entries, and the shipped memory/predictions.md has nothing unreadable',
        j0?.unreadable.length === 0 && ![...j0.pending, ...j0.resolved].some(e => /YYYY|XX|\[/.test(e.date + e.claim)) &&
        shippedLedger?.unreadable.length === 0 && ![...shippedLedger.pending, ...shippedLedger.resolved].some(e => /\[specific|\[the original/.test(e.claim)),
        JSON.stringify(shippedLedger?.unreadable));

  // ── add ──
  const addm = layer('ledger-add');
  const REC = `- **Date:** 2026-11-02
- **Claim:** Rain falls on the launch day
- **Probability:** 65%
- **Resolve by:** 2026-12-20
- **Reasoning:** seasonal base rate
- **Status:** pending`;
  const a1 = L(['add', 'Rain falls on the launch day', '--p', '65', '--by', '2026-12-20', '--why', 'seasonal base rate', '--date', '2026-11-02'], addm);
  const j1 = json(L(['list', '--json'], addm)), neu = j1?.pending.find(e => e.claim === 'Rain falls on the launch day');
  check('add writes the template\'s Pending record as the last thing under ## Pending and changes no other line; list reads it back as #4',
        a1.code === 0 && read(addm, 'predictions.md') === bumped(LEDGER.replace('\n## Resolved', `\n${REC}\n\n## Resolved`)) &&
        neu?.n === 4 && neu.shape === 'A' && neu.probability === 65 && neu.resolveBy === '2026-12-20' && neu.date === '2026-11-02' &&
        j1.pending[2].probability === 85 && j1.resolved.length === 2, a1.out + a1.err + read(addm, 'predictions.md'));
  const idxRow = (dir, f) => read(dir, 'index.md').split('\n').find(l => l.includes(`](${f}.md)`))?.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/)?.[1];
  check(`a content change moves the ledger's Updated stamp and its index.md row to today (${TODAY}); the calibration row stays`,
        idxRow(addm, 'predictions') === TODAY && idxRow(addm, 'calibration') === '2026-04-20', read(addm, 'index.md'));
  const a2 = L(['add', 'A fraction', '--p', '0.25', '--by', '2026-12-21', '--date', '2026-11-02'], addm);
  const a3 = L(['add', 'A percent sign', '--p', '30%', '--by', '2026-12-22', '--date', '2026-11-02'], addm);
  const j2 = json(L(['list', '--json'], addm));
  check('--p takes 65, 0.25 and 30%: all three read back as percentages (65, 25, 30)',
        a2.code === 0 && a3.code === 0 && j2?.pending.slice(3).map(e => e.probability).join(' ') === '65 25 30', a2.err + a3.err);

  const fine = ['--p', '50', '--by', '2026-12-01', '--date', '2026-11-02'];
  const addRefusals = [
    ['an empty claim', ['add', '', ...fine]],
    ['a claim of spaces', ['add', '   ', ...fine]],
    ['no --p', ['add', 'x', '--by', '2026-12-01', '--date', '2026-11-02']],
    ['--p that is not a number', ['add', 'x', '--p', 'likely', '--by', '2026-12-01', '--date', '2026-11-02']],
    ['--p above 100', ['add', 'x', '--p', '150', '--by', '2026-12-01', '--date', '2026-11-02']],
    ['--p below 0', ['add', 'x', '--p', '-5', '--by', '2026-12-01', '--date', '2026-11-02']],
    ['no --by', ['add', 'x', '--p', '50', '--date', '2026-11-02']],
    ['--by that is not a date', ['add', 'x', '--p', '50', '--by', 'soon', '--date', '2026-11-02']],
    ['--by on a day that does not exist', ['add', 'x', '--p', '50', '--by', '2026-02-30', '--date', '2026-01-02']],
    ['--by earlier than the entry date', ['add', 'x', '--p', '50', '--by', '2026-10-01', '--date', '2026-11-02']],
    ['a claim that is already pending', ['add', 'the vendor contract  renews before OCTOBER', ...fine]],
  ];
  const resolveRefusals = [
    ['a number that is not there', ['resolve', '99', 'true']],
    ['a substring no claim contains', ['resolve', 'zebra', 'true']],
    ['a substring three pending claims share', ['resolve', 'the', 'true']],
    ['an entry already resolved, by number', ['resolve', '4', 'false']],
    ['an entry already resolved, by its claim', ['resolve', 'Hiring closes', 'false']],
    ['an outcome that is not true or false', ['resolve', '1', 'maybe']],
    ['--on before the prediction was made', ['resolve', '1', 'true', '--on', '2026-08-01']],
  ];
  for (const [what, set] of [['add', addRefusals], ['resolve', resolveRefusals]]) {
    const wrong = [];
    for (const [name, a] of set) {
      const r = L(a, base);
      if (r.code !== 1 || !/Nothing was written/.test(r.err)) wrong.push(`${name}: exit ${r.code}\n${r.out}${r.err}`);
    }
    const same = JSON.stringify(snap(base)) === JSON.stringify(held);
    check(`every ${what} refusal exits 1 and leaves the disk byte-identical (${set.length}: ${set.map(s => s[0]).join('; ')})`,
          !wrong.length && same, wrong.join('\n') + (same ? '' : '\nthe disk changed'));
  }

  // ── due ──
  const dueOn = (d) => { const r = L(['due', '--on', d, '--json'], base); return r.code === 0 ? json(r)?.due.map(e => e.n).join(',') : `exit ${r.code}`; };
  const dues = ['2026-09-30', '2026-10-01', '2026-11-29', '2026-11-30', '2026-12-15'].map(dueOn);
  check('due respects --on, from the resolve-by date itself onward, and reads the date in "2026-11-30 (or the day the tag is cut, ...)"',
        dues.join(' | ') === ' | 1 | 1 | 1,3 | 1,3,2', dues.join(' | '));
  const h0 = L(['due', '--hook', '--on', '2026-09-30'], base);
  const h1 = L(['due', '--hook'], path.join(TMP, 'no-such-ledger'));
  const h2 = L(['due', '--hook', '--file', TMP], base);                     // a directory where the file should be
  check('--hook prints nothing at all and exits 0 when nothing is due, when the file is missing, and when it cannot be read',
        [h0, h1, h2].every(r => r.code === 0 && r.out === '' && r.err === ''), [h0, h1, h2].map(r => `exit ${r.code}\n${r.out}${r.err}`).join('\n--\n'));
  const h3 = L(['due', '--hook', '--on', '2026-11-30'], base), hl = h3.out.trimEnd().split('\n');
  check('--hook names each due claim with its number and ends with one line: ask the person, then run resolve <n> true|false',
        h3.code === 0 && hl.length === 4 && h3.out.includes('1. "The vendor contract renews before October"') &&
        h3.out.includes('3. "The release ships in November"') && !h3.out.includes('audit') &&
        /^Ask the person/.test(hl[3]) && hl[3].includes('`node tools/wick-ledger.mjs resolve <n> true|false`'), h3.out + h3.err);
  const many = put(path.join(TMP, 'ledger-many'), { 'predictions.md': '# P\n\n## Pending\n\n' + Array.from({ length: 8 }, (_, i) =>
    `- **Date:** 2026-01-0${i + 1}\n- **Claim:** Claim number ${i + 1}\n- **Probability:** 50%\n- **Resolve by:** 2026-02-0${i + 1}\n- **Status:** pending\n`).join('\n') + '\n## Resolved\n' });
  const h4 = L(['due', '--hook', '--on', '2026-03-01'], many), ml = h4.out.trimEnd().split('\n');
  check('--hook with 8 due shows 5 and "and 3 more", in 8 lines (the limit is 12)',
        h4.code === 0 && ml.length === 8 && ml.filter(l => /^\s+\d+\. "/.test(l)).length === 5 && ml[6].trim() === 'and 3 more', h4.out);
  const dm = L(['due'], path.join(TMP, 'no-such-ledger')), lm = L(['list'], path.join(TMP, 'no-such-ledger'));
  check('a missing ledger is UNREACHABLE, never "nothing due": due still exits 0 and says it could not check; list exits 2',
        dm.code === 0 && !/nothing is due/.test(dm.out) && /UNREACHABLE/.test(dm.err) && lm.code === 2 && /UNREACHABLE/.test(lm.err), dm.out + dm.err + lm.err);

  // ── resolve ──
  const ra = layer('ledger-resolve-a');
  const r1 = L(['resolve', '1', 'true', '--lesson', 'renewals are sticky', '--on', '2026-10-02'], ra);
  const DONE = `- **Date:** 2026-09-01
- **Claim:** The vendor contract renews before October
- **Probability:** 70% (predicted) | **Outcome:** true
- **Brier score:** 0.0900
- **Lesson:** renewals are sticky
- **Resolved:** 2026-10-02`;
  check('resolve on a bullet record, 70% and true: Brier 0.0900; the record leaves ## Pending, the template\'s Resolved form is appended under ## Resolved, no other line changes',
        r1.code === 0 && read(ra, 'predictions.md') === bumped(LEDGER.replace(`${VENDOR}\n\n`, '').replace('full\n\n## 2026-06-10', `full\n\n${DONE}\n\n## 2026-06-10`)),
        r1.out + r1.err + read(ra, 'predictions.md'));
  const rf = layer('ledger-resolve-false');
  const r2 = L(['resolve', 'vendor contract', 'false', '--on', '2026-10-02'], rf);
  check('the same prediction resolved false, by a substring of its claim: Brier 0.4900, and no Lesson bullet when none was given',
        r2.code === 0 && read(rf, 'predictions.md').includes('- **Probability:** 70% (predicted) | **Outcome:** false\n- **Brier score:** 0.4900\n- **Resolved:** 2026-10-02\n') &&
        json(L(['list', '--json'], rf))?.resolved.find(e => /vendor/.test(e.claim))?.brier === 0.49, r2.out + r2.err);
  const rb = layer('ledger-resolve-b');
  const r3 = L(['resolve', 'release ships', 'false', '--on', '2026-12-01'], rb);
  check('resolve on a heading record, 85% and false: Status, Outcome and Brier (0.7225) are filled in place and every other line is byte-identical',
        r3.code === 0 && read(rb, 'predictions.md') === bumped(LEDGER.replace('- Status: pending\n- Outcome:\n- Brier:', '- Status: resolved (2026-12-01)\n- Outcome: false\n- Brier: 0.7225')),
        r3.out + r3.err + read(rb, 'predictions.md'));
  const BARE = '# P\n\n## 2026-03-01 — A heading record with no Status, Outcome or Brier bullet\n- **Probability:** 70%\n- **Resolve by:** 2026-04-01\n\nA note under it that must not move.\n';
  const bare = put(path.join(TMP, 'ledger-bare'), { 'predictions.md': BARE });
  const r4 = L(['resolve', '1', 'true', '--on', '2026-04-02'], bare);
  check('a heading record missing those bullets gets them after its last field, in its own bold style (70% and true: 0.0900 again)',
        r4.code === 0 && read(bare, 'predictions.md') === BARE.replace('2026-04-01\n', '2026-04-01\n- **Status:** resolved (2026-04-02)\n- **Outcome:** true\n- **Brier:** 0.0900\n'),
        r4.out + r4.err + read(bare, 'predictions.md'));
  const HAND = '# P\n\n## 2026-03-01 — An older heading record\n- Probability: 30%\n- Resolve by: 2026-04-01\n- Status: pending\n\n---\n*kept by hand*\n';
  const hand = put(path.join(TMP, 'ledger-hand'), { 'predictions.md': HAND });
  const r5 = L(['add', 'A new one', '--p', '45', '--by', '2026-12-01', '--date', '2026-11-02'], hand);
  const mid = read(hand, 'predictions.md');
  const r6 = L(['resolve', 'A new one', 'true', '--on', '2026-12-02'], hand);
  check('a ledger with no ## Pending or ## Resolved heading gets each one when it is first needed, above the footer, and its heading record still reads',
        r5.code === 0 && r6.code === 0 &&
        mid === HAND.replace('\n---', '\n## Pending\n\n- **Date:** 2026-11-02\n- **Claim:** A new one\n- **Probability:** 45%\n- **Resolve by:** 2026-12-01\n- **Status:** pending\n\n---') &&
        read(hand, 'predictions.md') === HAND.replace('\n---', '\n## Pending\n\n## Resolved\n\n- **Date:** 2026-11-02\n- **Claim:** A new one\n' +
          '- **Probability:** 45% (predicted) | **Outcome:** true\n- **Brier score:** 0.3025\n- **Resolved:** 2026-12-02\n\n---') &&
        json(L(['list', '--json'], hand))?.pending[0]?.claim === 'An older heading record', r5.err + r6.err + read(hand, 'predictions.md'));

  // ── report ──
  // Five fixed results, in both shapes. Brier: 0.01, 0.36, 0.09, 0.04, 0.04; their sum is 0.54.
  const SCORED = `# Predictions Ledger

*Updated: 2026-08-01 · first written 2026-04-20*

## Pending

- **Date:** 2026-07-01
- **Claim:** Still open
- **Probability:** 55%
- **Resolve by:** 2026-12-31
- **Status:** pending

## Resolved

- **Date:** 2026-05-01
- **Claim:** Ninety and it happened
- **Probability:** 90% (predicted) | **Outcome:** true
- **Brier score:** 0.0100

- **Date:** 2026-05-02
- **Claim:** Sixty and it did not
- **Probability:** 60% (predicted) | **Outcome:** false
- **Brier score:** 0.3600

- **Date:** 2026-05-03
- **Claim:** Seventy and it happened
- **Probability:** 70% (predicted) | **Outcome:** true
- **Brier score:** 0.0900

### 2026-05-04 — Eighty and it happened
- Probability: 80%
- Resolve by: 2026-06-01
- Status: resolved
- Outcome: true
- Brier: 0.0400

### 2026-05-05 — Twenty and it did not
- Probability: 0.2
- Resolve by: 2026-06-01
- Status: resolved
- Outcome: false
- Brier: 0.0400
`;
  const sc = layer('ledger-scored', SCORED);
  const p1 = L(['report'], sc), jr = json(L(['report', '--json'], sc));
  check('report on five fixed results (90% true, 60% false, 70% true, 80% true, 20% false): mean Brier 0.54/5 = 0.1080; always-50% baseline 0.2500, ' +
        'difference -0.1420; base rate 3 of 5, so that baseline is 0.6 x 0.4 = 0.2400, difference -0.1320',
        jr?.resolved === 5 && jr.pending === 1 && jr.meanBrier === 0.108 && jr.baseRate === 0.6 && jr.baselines.always50 === 0.25 && jr.baselines.baseRate === 0.24 &&
        jr.difference.always50 === -0.142 && jr.difference.baseRate === -0.132 &&
        ['0.1080', '0.2500', '-0.1420', '0.2400', '-0.1320', '3 of 5 came true'].every(s => p1.out.includes(s)), p1.out + JSON.stringify(jr));
  check('the buckets hold a count, a hit rate and the mean stated probability: <30 1/0%/20, 30-49 empty, 50-69 1/0%/60, 70-89 2/100%/75, 90+ 1/100%/90',
        jr?.buckets.map(b => `${b.bucket}:${b.count}:${b.hitRate}:${b.meanStated}`).join(' ') === '<30:1:0:20 30-49:0:null:null 50-69:1:0:60 70-89:2:1:75 90+:1:1:90',
        JSON.stringify(jr?.buckets));
  const p3 = L(['report'], ra), j3 = json(L(['report', '--json'], ra));
  check('report with 3 resolved says plainly that this is too few to judge calibration',
        j3?.resolved === 3 && j3.enoughToJudge === false && /3 resolved is too few to judge calibration/.test(p3.out), p3.out);
  const results = (n) => '# P\n\n## Resolved\n\n' + Array.from({ length: n }, (_, i) =>
    `- **Date:** 2026-01-${String(i + 1).padStart(2, '0')}\n- **Claim:** Result ${i + 1}\n- **Probability:** ${i % 2 ? 80 : 30}% (predicted) | **Outcome:** ${i % 3 === 0}\n`).join('\n');
  const p19 = L(['report'], put(path.join(TMP, 'ledger-19'), { 'predictions.md': results(19) }));
  const p20 = L(['report'], put(path.join(TMP, 'ledger-20'), { 'predictions.md': results(20) }));
  check('the line is at 20: 19 resolved is still too few, 20 is not, and at 20 the report still does not grade the score',
        /19 resolved is too few to judge/.test(p19.out) && p20.code === 0 && !/too few/.test(p20.out) && /does not grade/.test(p20.out), p19.out + p20.out);
  const off = put(path.join(TMP, 'ledger-off'), { 'predictions.md': '# P\n\n## Resolved\n\n- **Date:** 2026-01-01\n- **Claim:** Scored by hand, wrongly\n' +
    '- **Probability:** 70% (predicted) | **Outcome:** true\n- **Brier score:** 0.2100\n' });
  const po = L(['report'], off);
  check('a stored Brier score that is not (p - outcome)^2 is reported, and the computed value (0.0900) is the one used',
        json(L(['report', '--json'], off))?.meanBrier === 0.09 && /1 stored Brier score is not/.test(po.out) && po.out.includes('line 5'), po.out);

  const wr = layer('ledger-write', SCORED);
  const w1 = L(['report', '--write'], wr), cal = read(wr, 'calibration.md');
  // What --write may not touch: every line that is neither a Summary bullet nor a table row. The stamp's date is the
  // one field that is allowed to move.
  const [outside, inside] = [false, true].map(want => (t) => {
    const out = [];
    let summary = false;
    for (const l of t.split('\n')) {
      if (l.startsWith('## ')) summary = l === '## Summary';
      if (((summary && l.startsWith('- ')) || l.startsWith('|')) === want) out.push(l.replace(/^\*Updated: \d{4}-\d{2}-\d{2}/, '*Updated: D'));
    }
    return out.join('\n');
  });
  check('--write changes only the Summary bullets and the bucket table of calibration.md, and does not touch the ledger',
        w1.code === 0 && outside(cal) === outside(CAL) && inside(cal) !== inside(CAL) && read(wr, 'predictions.md') === SCORED &&
        cal.includes('- **Total predictions:** 6\n- **Resolved:** 5\n- **Pending:** 1\n- **Mean Brier score:** 0.1080\n- **Always-50% baseline:** 0.2500 (difference -0.1420)\n' +
                     '- **Base-rate baseline:** 0.2400 (base rate 60%; difference -0.1320)\n- **Calibration:** too few to judge (5 resolved; 20 or more are needed)\n') &&
        cal.includes('| 70-89% | 2     | 100%     | 75%         |') && idxRow(wr, 'calibration') === TODAY && idxRow(wr, 'predictions') === '2026-08-01',
        w1.out + w1.err + cal);
  const w1b = L(['report', '--write'], wr);
  check('--write a second time finds nothing to change and writes nothing', w1b.code === 0 && read(wr, 'calibration.md') === cal && /nothing was written/.test(w1b.out), w1b.out);
  const NOTES = '# Calibration\n\nNotes kept by hand.\n';
  const wn = put(path.join(TMP, 'ledger-write-notes'), { 'predictions.md': SCORED, 'calibration.md': NOTES });
  const wm = put(path.join(TMP, 'ledger-write-missing'), { 'predictions.md': SCORED });
  const w2 = L(['report', '--write'], wn), w3 = L(['report', '--write'], wm);
  check('--write refuses a calibration.md that has no Summary bullets or bucket table (exit 1, nothing written) and a missing one (exit 2, none created), and says so',
        w2.code === 1 && /Summary/.test(w2.err) && /Nothing was written/.test(w2.err) && read(wn, 'calibration.md') === NOTES &&
        w3.code === 2 && !fs.existsSync(path.join(wm, 'calibration.md')), w2.err + w3.err);

  // ── line endings ──
  const cr = put(path.join(TMP, 'ledger-crlf'), { 'predictions.md': crlf(LEDGER), 'calibration.md': crlf(CAL) });
  const cs = [L(['add', 'A CRLF claim', '--p', '35', '--by', '2026-12-24', '--date', '2026-11-02'], cr),
              L(['resolve', 'vendor contract', 'true', '--on', '2026-10-02'], cr),
              L(['resolve', 'release ships', 'false', '--on', '2026-12-01'], cr), L(['report', '--write'], cr)];
  const ct = read(cr, 'predictions.md'), cc = read(cr, 'calibration.md');
  check('a CRLF ledger stays CRLF through add, both kinds of resolve and --write: no bare LF, no stray CR',
        cs.every(r => r.code === 0) && isCrlf(ct) && isCrlf(cc) && ct.includes('- **Claim:** A CRLF claim\r\n') &&
        ct.includes('- **Brier score:** 0.0900\r\n') && ct.includes('- Brier: 0.7225\r\n') && cc.includes('- **Resolved:** 4\r\n'),
        cs.map(r => r.err).join('') + JSON.stringify(ct));
  const TAIL = '# P\n\n## Resolved\n\n## Pending\n\n- **Date:** 2026-01-01\n- **Claim:** The last line has no newline\n- **Probability:** 10%\n- **Resolve by:** 2026-02-01';
  const t1 = put(path.join(TMP, 'ledger-tail'), { 'predictions.md': TAIL }), t2 = put(path.join(TMP, 'ledger-tail-crlf'), { 'predictions.md': crlf(TAIL) });
  const ts = [L(['add', 'Appended at the very end', '--p', '50', '--by', '2026-12-01', '--date', '2026-11-02'], t1),
              L(['add', 'Appended at the very end', '--p', '50', '--by', '2026-12-01', '--date', '2026-11-02'], t2)];
  check('a ledger whose last line has no newline: the record is appended on lines of its own, and the CRLF one stays CRLF',
        ts.every(r => r.code === 0) && read(t1, 'predictions.md') === TAIL + '\n\n- **Date:** 2026-11-02\n- **Claim:** Appended at the very end\n' +
          '- **Probability:** 50%\n- **Resolve by:** 2026-12-01\n- **Status:** pending\n' && read(t2, 'predictions.md') === crlf(read(t1, 'predictions.md')),
        ts.map(r => r.err).join('') + JSON.stringify(read(t2, 'predictions.md')));

  // ── what cannot be read ──
  const JUNK = '- **Date:** 2026-09-07\n- **Claim:** Something with no number on it\n- **Probability:** fairly likely\n- **Resolve by:** soon';
  const NOTE = 'Ask about the Q3 number before logging it.';
  const un = layer('ledger-unread', LEDGER.replace('\n- Date: 2026-09-05', `\n${JUNK}\n\n- Date: 2026-09-05`).replace('full\n\n## 2026-06-10', `full\n\n${NOTE}\n\n## 2026-06-10`));
  const where = () => { const l = read(un, 'predictions.md').split('\n'); return `2 blocks could not be read (lines ${l.indexOf(JUNK.split('\n')[0]) + 1}, ${l.indexOf(NOTE) + 1})`; };
  const u0 = L(['list'], un), u1 = L(['report'], un), ju = json(L(['list', '--json'], un));
  check('a record with no readable probability and a stray line of prose are reported by list and report, with their lines; the entries around them still parse',
        u0.out.includes(where()) && u1.out.includes(where()) && ju?.unreadable.length === 2 && ju.pending.length === 3 && ju.resolved.length === 2 &&
        /no probability/.test(ju.unreadable[0].reason), u0.out + u1.out);
  const us = [L(['add', 'Logged beside what cannot be read', '--p', '50', '--by', '2026-12-01', '--date', '2026-11-02'], un),
              L(['resolve', 'vendor contract', 'true', '--on', '2026-10-02'], un),       // the bullet record just above the unread one
              L(['resolve', 'audit closes', 'true', '--on', '2026-12-16'], un),          // the bullet record just below it
              L(['resolve', 'release ships', 'false', '--on', '2026-12-01'], un)];       // a heading record, in place
  const ut = read(un, 'predictions.md'), u2 = L(['list'], un);
  check('both unread blocks survive add and three resolves byte for byte, where they were, and are still reported',
        us.every(r => r.code === 0) && ut.includes(`-->\n\n${JUNK}\n\n### 2026-09-10`) && ut.includes(`full\n\n${NOTE}\n\n- **Date:** 2026-09-01`) && u2.out.includes(where()) &&
        json(L(['list', '--json'], un))?.resolved.length === 5, us.map(r => r.err).join('') + ut);
  const NOTED = '# P\n\n## Pending\n\n- **Date:** 2026-01-01\n- **Claim:** A record with a note typed straight under it\n- **Probability:** 80%\n' +
    '- **Resolve by:** 2026-02-01\n- **Status:** pending\nNOTE TO SELF: check the Q3 report first.\n\n## Resolved\n\n(none yet)\n';
  const nt = put(path.join(TMP, 'ledger-noted'), { 'predictions.md': NOTED });
  const n0 = L(['list'], nt), n1 = L(['resolve', '1', 'true', '--on', '2026-02-02'], nt), n2 = L(['list'], nt);
  check('an unindented line typed straight under a record is not folded into its last field: it is reported, and it stays put when the record is resolved; "(none yet)" is not a block',
        n0.out.includes('1 block could not be read (line 10)') && n1.code === 0 && n2.out.includes('1 block could not be read (line 5)') &&
        read(nt, 'predictions.md').startsWith('# P\n\n## Pending\n\nNOTE TO SELF: check the Q3 report first.\n\n## Resolved\n\n(none yet)\n\n- **Date:** 2026-01-01\n'),
        n0.out + n1.err + read(nt, 'predictions.md'));

  // ── usage ──
  const flags = [L(['list', '--bogus'], base), L(['report', '--jsn'], base), L(['due', '--onn', '2026-01-01'], base), L(['list', '--write'], base),
                 L(['add', 'x', ...fine, '--force'], base), L(['resolve', '1', 'true', '--dry'], base), L(['frobnicate'], base)];
  const help = L(['--help'], base);
  check('an unknown flag, a flag that belongs to another command, and an unknown command all exit 2 and write nothing; --help exits 0',
        flags.every(r => r.code === 2 && /usage:/.test(r.err)) && JSON.stringify(snap(base)) === JSON.stringify(held) &&
        help.code === 0 && help.out.startsWith('usage: node tools/wick-ledger.mjs list'), flags.map(r => `exit ${r.code}`).join(' '));

  // The report does arithmetic. It never grades the score and never names a skill bar, in anything it printed here or
  // wrote into calibration.md.
  const BAR = /superforecaster|excellent|\bgood\b|\bbad\b|\bpoor\b|needs work|pundit|well[- ]calibrated|overconfident|underconfident/i;
  const said = seen.join('\n') + inside(cal) + inside(cc.replace(/\r/g, ''));
  check(`nothing the ledger printed or wrote grades a score or names a skill bar (${seen.length / 2} runs)`, said.length > 5000 && !BAR.test(said),
        (said.match(BAR) || [])[0]);
}

if (!keep) fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n  ${passed} passed, ${failed} failed${keep ? `   (kept: ${TMP})` : ''}`);
process.exit(failed ? 1 : 0);
