#!/usr/bin/env node
// ─── wick-ledger — the prediction ledger, kept by a program ─────────────────
// CLAUDE.md (Gate 5) asks the model to log every probability claim, to notice when one falls due, to score it, and to
// keep running stats. Choosing the claim and the number is judgment and stays with the model. The rest is a date
// comparison and a subtraction, and asking for those in prose proved unreliable when measured. So they are code:
//   due      which pending predictions have reached their resolve-by date
//   resolve  Brier = (p - outcome)^2 with p in 0..1, written to 4 decimals
//   report   the mean Brier beside the two no-skill baselines, computed on the SAME entries
//
// NO VERDICTS. The report grades nothing and names no skill bar. A Brier score means something only against a baseline
// on the same questions: always saying 50% scores 0.25 whatever happens, and always saying the entries' own base rate
// r scores r*(1-r). With fewer than 20 resolved predictions it says that this is too few to judge, and stops there.
//
// IT READS TWO SHAPES, because models write both:
//   (A) the template's bullet record under `## Pending` / `## Resolved`: a run of consecutive top-level bullets that
//       begins with a Date bullet (`- **Date:** 2026-11-01`, then Claim, Probability, Resolve by, Reasoning, Status)
//   (B) a heading record: `## 2026-10-29 — the claim` (or ###; em dash, en dash or hyphen), then bullets for
//       Probability, Resolve by, Reasoning, Status, Outcome, Brier
// Labels may be bold or plain, in any case. A probability is `70%`, `70` or `0.7`. A template's example inside an HTML
// comment is not an entry.
//
// WHAT IT CANNOT READ, IT REPORTS AND LEAVES ALONE. A block under Pending or Resolved that does not parse is counted by
// `list` and `report` with its line number. It is never rewritten, moved or dropped, and every write is re-read before
// it reaches the disk: if the entries or the unread blocks would not come back as expected, nothing is written.
//
// Zero dependencies. Node >= 18. Exit 0 = done, 1 = refused and nothing written, 2 = bad usage, or a file that cannot
// be read. `due` exits 0 whenever it ran its check. With --hook it exits 0 whatever happens and prints nothing at all
// unless something is due, so it is safe to run unattended at the start of a session.
//   node tools/wick-ledger.mjs list
//   node tools/wick-ledger.mjs add "the release ships in November" --p 70 --by 2026-11-30 --why "two sprints left"
//   node tools/wick-ledger.mjs due
//   node tools/wick-ledger.mjs resolve 1 true --lesson "the buffer was real"
//   node tools/wick-ledger.mjs report --write
// The ledger is memory/predictions.md. --file <path> names another; WICK_MEMORY=<dir> points at another layer.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOL = 'node tools/wick-ledger.mjs';
const MIN_TO_JUDGE = 20;
// A hook runs where nobody is watching. Whatever goes wrong, it stays silent and exits 0.
const HOOK = process.argv.includes('--hook');
if (HOOK) process.on('uncaughtException', () => process.exit(0));

const usage =
  `usage: ${TOOL} list [--json]\n` +
  `       ${TOOL} add "<claim>" --p <prob> --by <YYYY-MM-DD> [--why "<one line>"] [--date <YYYY-MM-DD>]\n` +
  `       ${TOOL} due [--on <YYYY-MM-DD>] [--json] [--hook]\n` +
  `       ${TOOL} resolve <n | unique claim substring> <true|false> [--lesson "<text>"] [--on <YYYY-MM-DD>]\n` +
  `       ${TOOL} report [--json] [--write]\n` +
  '       --file <path>   the ledger to use (default: memory/predictions.md; WICK_MEMORY=<dir> moves the layer)\n' +
  '       <prob> is 70, 70% or 0.7. Numbers come from list; an all-digit target is always read as a number.';

const args = process.argv.slice(2);
const flag = (f) => { const i = args.indexOf(f); if (i === -1) return false; args.splice(i, 1); return true; };
const opt = (f) => { const i = args.indexOf(f); if (i === -1) return null; const v = args[i + 1] ?? ''; args.splice(i, 2); return v; };
// die: a refusal (1) or an unreadable file (2). Under --hook both are silent. bad: a usage error, which a person
// setting up a hook needs to see, so one line of it goes to stderr even there; the exit code is still 0.
const die = (code, msg) => { if (!HOOK) console.error(`wick-ledger: ${msg}`); process.exit(HOOK ? 0 : code); };
const bad = (msg) => { console.error(`wick-ledger: ${msg}${HOOK ? '' : `\n${usage}`}`); process.exit(HOOK ? 0 : 2); };

if (flag('--help') || flag('-h')) { console.log(usage); process.exit(0); }
const given = {};
for (const f of ['--json', '--hook', '--write']) if (flag(f)) given[f] = true;
for (const f of ['--file', '--p', '--by', '--why', '--date', '--on', '--lesson']) { const v = opt(f); if (v !== null) given[f] = v; }
const unknown = args.filter(a => /^--?[A-Za-z][\w-]*$/.test(a));
if (unknown.length) bad(`unknown flag: ${unknown.join(' ')}`);
const [cmd, ...rest] = args;
const OPTIONS = { list: ['--json'], add: ['--p', '--by', '--why', '--date'], due: ['--on', '--json', '--hook'],
                  resolve: ['--lesson', '--on'], report: ['--json', '--write'] };
if (!cmd) { console.log(usage); process.exit(HOOK ? 0 : 1); }
if (!Object.hasOwn(OPTIONS, cmd)) bad(`unknown command: ${cmd}`);
const stray = Object.keys(given).filter(f => f !== '--file' && !OPTIONS[cmd].includes(f));
if (stray.length) bad(`${stray.join(' ')} is not an option of "${cmd}"`);
if (given['--file'] === '') bad('--file needs a path');

// The same rule as wick-recall: WICK_MEMORY names the layer, else the memory/ directory next to tools/.
const MEM = path.resolve(process.env.WICK_MEMORY || path.join(HERE, '..', 'memory'));
const FILE = given['--file'] ? path.resolve(given['--file']) : path.join(MEM, 'predictions.md');
const shown = (p) => { const r = path.relative(process.cwd(), p); return r && !r.startsWith('..') && !path.isAbsolute(r) ? r.split(path.sep).join('/') : p; };
// Today in LOCAL time: the date a person would write down. (toISOString is UTC, which is tomorrow for a US evening.)
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// ─── dates, probabilities, outcomes ──────────────────────────────────────────
// A real calendar date: 2026-02-30 has the right shape and is not one.
const isDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const [y, m, d] = s.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};
// A date at the start of a value. Free text may follow it: `2026-12-31 (or the day the tag is cut)`.
const dateOf = (s) => (String(s ?? '').match(/^[[(*_`\s]*(\d{4}-\d{2}-\d{2})(?!\d)/) || [])[1] || null;
// `70%`, `70` or `0.7`, as a percentage. A value <= 1 written with a decimal point and no % sign is a fraction.
const scale = (num, percentSign) => { const n = Number(num); return +(!percentSign && num.includes('.') && n <= 1 ? n * 100 : n).toFixed(6); };
const pctOf = (s) => {                        // read from a file: the number leads, and words may follow it
  const m = String(s ?? '').replace(/^[*_`~\s]+/, '').match(/^(\d+\.?\d*|\.\d+)\s*(%)?(?=$|[\s(|,;*_`])/);
  return m ? scale(m[1], m[2]) : null;
};
const pctArg = (s) => {                       // typed on the command line: the whole argument must be the number
  const m = String(s ?? '').trim().match(/^(-?(?:\d+\.?\d*|\.\d+))\s*(%)?$/);
  return m ? scale(m[1], m[2]) : null;
};
// Only the words true and false are an outcome. `true / false` is the template's placeholder, not a result.
const outcomeOf = (s) => {
  const t = String(s ?? '').replace(/^[*_`\s]+/, ''), m = t.match(/^(true|false)\b/i);
  if (!m || (/\btrue\b/i.test(t) && /\bfalse\b/i.test(t))) return null;
  return m[1].toLowerCase() === 'true';
};
const one = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const fold = (s) => one(s).toLowerCase();

// ─── the parser ──────────────────────────────────────────────────────────────
const HEAD = /^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/;
const DATED = /^[[(*_]*(\d{4}-\d{2}-\d{2})[\])*_]*\s*[—–:-]\s*(\S.*)$/;       // a heading's text: date, a dash, the claim
const BULLET = /^(?:[-*+]|\d+\.)\s/;                                         // top level only: no indent
// A field bullet: `- **Label:** value`, `- **Label**: value` or `- Label: value`. Groups: bold, label, value.
const FIELD = /^[-*+]\s+(\*\*|__)?([A-Za-z][A-Za-z -]{0,30}?)\s*(?:(?:\*\*|__)\s*:|:\s*(?:\*\*|__)?)\s*(.*)$/;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/;
const ITALIC = /^[*_][^*_].*[*_]$/;                                          // a stamp or a footer: structure, not content
const NONE = /^[(*_\s]*(?:none|nothing|n\/a|empty)(?:\s+(?:yet|so far|pending|resolved))?[)*_.\s]*$/i;   // "(none yet)" says a section is empty
const INLINE_OUTCOME = /\|\s*(?:\*\*|__)?\s*outcome\s*(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*(.*)$/i;
const KEYS = new Map(Object.entries({
  date: 'date', claim: 'claim', prediction: 'claim', probability: 'prob', prob: 'prob',
  'resolve by': 'by', 'resolves by': 'by', 'resolve date': 'by', 'resolution date': 'by', due: 'by',
  reasoning: 'why', why: 'why', rationale: 'why', status: 'status', outcome: 'outcome',
  brier: 'brier', 'brier score': 'brier', lesson: 'lesson', resolved: 'resolved', 'resolved on': 'resolved',
}));
const keyOf = (label) => KEYS.get(label.toLowerCase().replace(/[\s-]+/g, ' ').trim());
const zoneOf = (text) => {
  const t = text.replace(/[*_`:]/g, '').trim().toLowerCase();
  return /^pending(?: predictions?)?$/.test(t) ? 'pending' : /^resolved(?: predictions?)?$/.test(t) ? 'resolved' : null;
};

function parse(src) {
  const raw = src.split('\n');                             // '\r' kept, so a CRLF file is written back as CRLF
  const lines = raw.map(l => l.replace(/\r$/, ''));
  // Inert lines sit inside a fenced block or an HTML comment. The shipped template keeps its example records in
  // comments, and an example is not an entry.
  const inert = [];
  let fence = false, comment = false;
  for (const l of lines) {
    const t = l.trim();
    if (!comment && /^(```|~~~)/.test(t)) { inert.push(true); fence = !fence; continue; }
    if (!fence && !comment && t.startsWith('<!--')) comment = true;
    inert.push(fence || comment);
    if (comment && t.includes('-->')) comment = false;
  }

  const entries = [], junk = [], zones = {};
  let zone = null;      // the open `## Pending` or `## Resolved` section
  let sub = null;       // an undated heading inside a zone: a group of entries, or something that cannot be read
  let A = null, B = null, J = null;

  const finish = (E) => {
    const val = (k) => { const it = E.f[k]; return it ? one([it.value, ...it.cont.map(i => lines[i])].join(' ')) : ''; };
    const date = E.shape === 'A' ? dateOf(val('date')) : E.date;
    const claim = E.shape === 'A' ? val('claim') : one(E.claim);
    const pct = pctOf(val('prob')), by = dateOf(val('by')), status = val('status');
    let outcome = outcomeOf(val('outcome'));
    if (outcome === null) outcome = outcomeOf((val('prob').match(INLINE_OUTCOME) || [])[1]);
    const done = /^[*_`\s]*resolved\b/i.test(status);
    if (outcome === null && done) outcome = outcomeOf(status.replace(/^[*_`\s]*resolved\b[\s:,;(—–-]*/i, ''));
    let why = null;
    if (!isDate(date)) why = 'no valid date';
    else if (!claim) why = 'no claim';
    else if (pct === null || pct > 100) why = 'no probability between 0 and 100';
    else if (outcome === null && (done || E.zone === 'resolved')) why = 'marked resolved, with no true/false outcome';
    else if (outcome === null && !isDate(by)) why = 'no valid resolve-by date';
    if (why) {
      // Outside Pending and Resolved, a dated heading or a Date bullet with no prediction field under it is somebody's
      // note, not a broken entry. Anywhere else, what does not parse is reported.
      if (E.zone || ['claim', 'prob', 'by', 'status', 'outcome', 'brier'].some(k => E.f[k])) {
        (E.sub ? E.sub.blocks : junk).push({ start: E.start, end: E.end, reason: why });
      }
      return;
    }
    if (E.sub) E.sub.used = true;
    const stored = (val('brier').match(/^[*_`\s]*(\d*\.?\d+)(?![\d.])/) || [])[1];
    entries.push({
      shape: E.shape, start: E.start, end: E.end, line: E.start + 1, date, claim, pct, by: isDate(by) ? by : null,
      reasoning: val('why'), status, outcome, state: outcome === null ? 'pending' : 'resolved',
      brier: outcome === null ? null : (pct / 100 - (outcome ? 1 : 0)) ** 2,
      stored: stored === undefined ? null : Number(stored), lesson: val('lesson'), resolvedOn: dateOf(val('resolved')),
      f: E.f, items: E.items,
    });
  };
  const closeA = () => { if (A) finish(A); A = null; };
  const closeB = () => { if (B) finish(B); B = null; };
  const closeSub = () => {
    if (!sub) return;
    if (sub.used) junk.push(...sub.blocks);
    else {
      junk.push({ start: sub.line, end: Math.max(sub.line, ...sub.blocks.map(b => b.end)),
                  reason: 'a heading that is neither a dated entry nor a group of entries' });
    }
    sub = null;
  };
  // A line under Pending or Resolved that belongs to no entry. Adjacent ones are one block.
  const loose = (i, reason) => {
    if (J && J.end === i - 1) { J.end = i; return; }
    J = { start: i, end: i, reason };
    (sub ? sub.blocks : junk).push(J);
  };
  // Under a heading record, a Date bullet opens a bullet record only if a Claim bullet follows it. (`add` appends
  // under `## Pending`, which can be below a `###` record; that record must keep its own fields.)
  const opensRecord = (i) => {
    if (!(B && B.open)) return true;
    for (let j = i + 1; j < lines.length && lines[j].trim() && !inert[j] && !HEAD.test(lines[j]); j++) {
      const m = lines[j].match(FIELD), k = m && keyOf(m[2]);
      if (k === 'claim') return true;
      if (k === 'date') return false;
    }
    return false;
  };

  lines.forEach((l, i) => {
    if (inert[i]) { closeA(); return; }
    const t = l.trim(), h = l.match(HEAD);
    if (h) {
      closeA(); closeB();
      const level = h[1].length, text = h[2].trim(), z = zoneOf(text);
      if (sub && (z || level <= sub.level)) closeSub();
      if (z) { zone = { kind: z, level, start: i }; zones[z] ??= zone; return; }
      if (zone && level <= zone.level) { closeSub(); zone = null; }
      const d = level > 1 && text.match(DATED);
      if (d) { B = { shape: 'B', start: i, end: i, date: d[1], claim: d[2], zone: zone?.kind ?? null, sub, f: {}, items: [], open: true }; return; }
      if (zone) { closeSub(); sub = { line: i, level, used: false, blocks: [] }; }
      return;
    }
    if (!t) { closeA(); return; }
    if (BULLET.test(l)) {
      const m = l.match(FIELD), key = m ? keyOf(m[2]) : undefined;
      if (key === 'date' && opensRecord(i)) {
        closeA();
        if (B) B.open = false;
        A = { shape: 'A', start: i, end: i, zone: zone?.kind ?? null, sub, f: {}, items: [] };
      }
      const E = A || (B && B.open ? B : null);
      if (!E) { if (zone && !NONE.test(l.replace(BULLET, ''))) loose(i, 'a bullet outside any entry'); return; }
      const it = { key: key && !E.f[key] ? key : null, line: i, value: m ? m[3] : '', m, cont: [] };
      if (it.key) E.f[it.key] = it;                       // the first bullet with a label is the field; a repeat rides along
      E.items.push(it);
      E.end = i;
      return;
    }
    if (RULE.test(t) || ITALIC.test(t) || NONE.test(t)) { closeA(); return; }
    // An indented line continues the bullet above it. An unindented one does not, even straight after a bullet: it
    // is read as a line of its own, so a note typed under a record is reported where it stands instead of being
    // folded into the record's last field and then moved or dropped with it.
    const indented = /^\s/.test(l);
    if (A && indented) { A.items[A.items.length - 1].cont.push(i); A.end = i; return; }
    closeA();
    if (B && B.open) {
      if (indented && B.items.length && B.end === i - 1) { B.items[B.items.length - 1].cont.push(i); B.end = i; }
      return;                                             // free text under a heading record is the record's own
    }
    if (zone) loose(i, 'text that is not an entry');
  });
  closeA(); closeB(); closeSub();

  entries.sort((a, b) => a.start - b.start);
  junk.sort((a, b) => a.start - b.start);
  const pending = entries.filter(e => e.state === 'pending'), resolved = entries.filter(e => e.state === 'resolved');
  [...pending, ...resolved].forEach((e, i) => { e.n = i + 1; });      // file order, pending first: what `resolve` takes
  return { raw, lines, inert, cr: src.includes('\r\n') ? '\r' : '', entries, pending, resolved, junk, zones };
}

// The last line of content in the section whose heading is at `from` (-1 and level 0 for the whole file). It stops
// above a closing rule that has only an italic footer under it: the template ends "---" then "*Wick MUST log...*", and
// that footer belongs to the file, not to whichever section happens to be last.
function contentEnd(P, from, level) {
  const { lines, inert } = P;
  let end = lines.length - 1;
  for (let j = from + 1; j < lines.length; j++) {
    const h = !inert[j] && lines[j].match(HEAD);
    if (h && h[1].length <= level) { end = j - 1; break; }
  }
  for (let i = end; i > from; i--) {
    const t = lines[i].trim();
    if (!inert[i] && RULE.test(t)) { end = i - 1; break; }
    if (t && (inert[i] || !ITALIC.test(t))) break;
  }
  while (end > from && !lines[end].trim()) end--;
  return end;
}
// Insert whole lines after line `at`, in the file's own line ending, leaving a final newline where there was none.
function insertAfter(raw, at, block, cr) {
  if (at === raw.length - 1 && raw[at] !== '') {
    if (cr && !raw[at].endsWith('\r')) raw[at] += '\r';
    raw.push('');
  }
  raw.splice(at + 1, 0, ...block.map(l => l + cr));
}

const load = () => { try { return parse(fs.readFileSync(FILE, 'utf8')); } catch { return null; } };
const must = () => load() ?? die(2, `cannot read ${shown(FILE)}: the ledger is UNREACHABLE, not empty. Nothing was read or written.`);
const unread = (P) => {
  const n = P.junk.length;
  if (!n) return '';
  const at = P.junk.slice(0, 8).map(b => b.start + 1).join(', ') + (n > 8 ? ', ...' : '');
  return `${n} block${n === 1 ? '' : 's'} could not be read (line${n === 1 ? '' : 's'} ${at})`;
};
const view = (e) => ({
  n: e.n, state: e.state, shape: e.shape, line: e.line, date: e.date, claim: e.claim, probability: e.pct,
  resolveBy: e.by, ...(e.reasoning ? { reasoning: e.reasoning } : {}),
  ...(e.state === 'resolved' ? { outcome: e.outcome, brier: +e.brier.toFixed(4), ...(e.resolvedOn ? { resolved: e.resolvedOn } : {}),
                                 ...(e.lesson ? { lesson: e.lesson } : {}) } : {}),
});
const junkView = (P) => P.junk.map(b => ({ line: b.start + 1, lines: b.end - b.start + 1, reason: b.reason }));
const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// ─── writing: verify, stamp, then write ──────────────────────────────────────
// Every entry that was there must still read the same, and every block that could not be read must still be there
// byte for byte. Checked on the text about to be written, before it is written.
const same = (a, b) => a.shape === b.shape && a.date === b.date && a.claim === b.claim && a.pct === b.pct &&
  a.by === b.by && a.outcome === b.outcome;
const blockText = (P, b) => P.raw.slice(b.start, b.end + 1).join('\n');
function intact(P, Q, others) {
  const pool = Q.entries.slice();
  for (const e of others) {
    const i = pool.findIndex(x => same(x, e));
    if (i < 0) return null;
    pool.splice(i, 1);
  }
  const junkKept = P.junk.length === Q.junk.length && P.junk.every((b, i) => blockText(P, b) === blockText(Q, Q.junk[i]));
  return junkKept ? pool : null;                    // what is left over is what this write added or changed
}
// A content change moves the file's `*Updated: <date> · ...*` stamp to today, and its index.md row with it when the
// row agreed with the stamp (MEMORY-PROTOCOL.md §10). A row that already disagreed is drift for wick-freshness-audit.
function stamp(raw, file) {
  const STAMP = /^(\*Updated:\s*)(\d{4}-\d{2}-\d{2})(.*\*\s*)$/;
  const name = path.basename(file);
  const i = raw.slice(0, 12).findIndex(l => STAMP.test(l.replace(/\r$/, '')));
  if (i < 0) return { note: `${name}: no Updated stamp (wick-freshness-audit will say so)`, commit() {} };
  const [, pre, was, post] = raw[i].match(STAMP);
  if (was >= today) return { note: '', commit() {} };
  raw[i] = pre + today + post;
  const idxPath = path.join(path.dirname(file), 'index.md');
  let idx = null, r = -1;
  try { idx = fs.readFileSync(idxPath, 'utf8').split('\n'); } catch { /* no index beside it: nothing to move */ }
  if (idx) {
    r = idx.findIndex(l => {
      const m = l.match(/^\s*[-*]\s*\[[^\]]+\]\(([^)#]+)/);
      return m && m[1].replace(/^\.\//, '').trim() === name && new RegExp(`\\(${was}\\)\\s*$`).test(l);
    });
    if (r >= 0) idx[r] = idx[r].replace(new RegExp(`\\(${was}\\)(\\s*)$`), `(${today})$1`);
  }
  return { note: `${name}: Updated ${was} -> ${today}${r >= 0 ? '; index.md row too' : ''}`,
           commit() { if (r >= 0) fs.writeFileSync(idxPath, idx.join('\n')); } };
}
function save(raw) {
  const s = stamp(raw, FILE);
  fs.writeFileSync(FILE, raw.join('\n'));
  s.commit();
  return s.note ? `\n  stamp     ${s.note}` : '';
}
const UNREADBACK = 'the result did not read back as written.';

// ─── list ────────────────────────────────────────────────────────────────────
function list() {
  const P = must();
  if (given['--json']) {
    console.log(JSON.stringify({ file: shown(FILE), pending: P.pending.map(view), resolved: P.resolved.map(view), unreadable: junkView(P) }, null, 2));
    return;
  }
  console.log(`wick-ledger list — ${shown(FILE)}`);
  console.log(`  Pending (${P.pending.length})`);
  for (const e of P.pending) console.log(`    ${e.n}. [${e.date}] ${e.pct}%  by ${e.by}  ${e.claim}`);
  if (!P.pending.length) console.log('    (none)');
  console.log(`  Resolved (${P.resolved.length})`);
  for (const e of P.resolved) console.log(`    ${e.n}. [${e.date}] ${e.pct}%  ${e.outcome}  Brier ${e.brier.toFixed(4)}  ${e.claim}`);
  if (!P.resolved.length) console.log('    (none)');
  if (P.junk.length) {
    console.log(`  ${unread(P)}. Left exactly as written; fix by hand, or log again with add.`);
    for (const b of P.junk) console.log(`    line ${b.start + 1}: ${b.reason}`);
  }
}

// ─── add ─────────────────────────────────────────────────────────────────────
function add() {
  const claim = one(rest.join(' ')), why = one(given['--why']), date = given['--date'] ?? today, by = given['--by'];
  const no = (msg) => die(1, `${msg} Nothing was written.`);
  if (!claim) no('the claim is empty.');
  if (given['--p'] === undefined) no('--p <probability> is required: 70, 70% or 0.7.');
  const pct = pctArg(given['--p']);
  if (pct === null) no(`--p "${given['--p']}" is not a number. Write 70, 70% or 0.7.`);
  if (pct < 0 || pct > 100) no(`--p ${given['--p']} is outside 0..100.`);
  if (!isDate(date)) no(`--date "${date}" is not a real calendar date (YYYY-MM-DD).`);
  if (!isDate(by)) no(by === undefined ? '--by <YYYY-MM-DD> is required.' : `--by "${by}" is not a real calendar date (YYYY-MM-DD).`);
  if (by < date) no(`--by ${by} is earlier than the entry date ${date}: a prediction cannot resolve before it is made.`);
  const P = must();
  const twin = P.pending.find(e => fold(e.claim) === fold(claim));
  if (twin) no(`the same claim is already pending (#${twin.n}, ${twin.pct}% by ${twin.by}).`);

  const rec = [`- **Date:** ${date}`, `- **Claim:** ${claim}`, `- **Probability:** ${pct}%`, `- **Resolve by:** ${by}`,
               ...(why ? [`- **Reasoning:** ${why}`] : []), '- **Status:** pending'];
  const raw = P.raw.slice(), z = P.zones.pending;
  let at, block, made = '';
  if (z) { at = contentEnd(P, z.start, z.level); block = ['', ...rec]; }
  else {
    // No `## Pending` heading (a ledger kept as headings only): the section is added, above `## Resolved` if there
    // is one and otherwise at the end of the file, above its footer.
    if (P.zones.resolved) { at = P.zones.resolved.start - 1; while (at >= 0 && !P.lines[at].trim()) at--; }
    else at = contentEnd(P, -1, 0);
    block = ['', '## Pending', '', ...rec];
    made = ' (the `## Pending` heading was added)';
  }
  if (at + 1 < P.lines.length && P.lines[at + 1].trim()) block.push('');
  insertAfter(raw, at, block, P.cr);

  const Q = parse(raw.join('\n')), left = intact(P, Q, P.entries);
  const neu = left && left.length === 1 ? left[0] : null;
  if (!neu || neu.shape !== 'A' || neu.state !== 'pending' || neu.claim !== claim || neu.date !== date || neu.pct !== pct || neu.by !== by) no(UNREADBACK);
  const note = save(raw);
  console.log(`wick-ledger add\n  logged    #${neu.n}  [${date}] ${pct}% by ${by}  ${claim}${made}${note}`);
}

// ─── due ─────────────────────────────────────────────────────────────────────
function due() {
  const on = given['--on'] ?? today, json = given['--json'] && !HOOK;
  if (!isDate(on)) bad(`--on "${on}" is not a real calendar date (YYYY-MM-DD)`);
  const P = load();
  if (!P) {
    // Unreachable is not "nothing due". It still exits 0, as due always does, but it does not claim a check it did
    // not make. Under --hook it says nothing at all.
    if (HOOK) return;
    console.error(`wick-ledger: cannot read ${shown(FILE)}: the ledger is UNREACHABLE, so nothing was checked.`);
    if (json) console.log(JSON.stringify({ file: shown(FILE), on, readable: false, due: [] }, null, 2));
    return;
  }
  const hits = P.pending.filter(e => e.by <= on).sort((a, b) => a.by.localeCompare(b.by) || a.n - b.n);
  const run = `${TOOL} resolve <n> true|false${given['--file'] ? ` --file "${given['--file']}"` : ''}`;
  if (HOOK) {
    if (!hits.length) return;
    const out = [`wick-ledger: ${hits.length} prediction${hits.length === 1 ? ' has' : 's have'} reached ${hits.length === 1 ? 'its' : 'their'} resolve-by date (on or before ${on}):`];
    for (const e of hits.slice(0, 5)) out.push(`  ${e.n}. "${short(e.claim, 100)}" (${e.pct}%, due ${e.by})`);
    if (hits.length > 5) out.push(`  and ${hits.length - 5} more`);
    if (P.junk.length) out.push(`  ${unread(P)}`);
    out.push(`Ask the person what happened, never guess, then run \`${run}\` (highest number first: the numbers shift after each resolve).`);
    console.log(out.join('\n'));
    return;
  }
  if (json) {
    console.log(JSON.stringify({ file: shown(FILE), on, readable: true, pending: P.pending.length, due: hits.map(view), unreadable: junkView(P) }, null, 2));
    return;
  }
  console.log(`wick-ledger due — resolve-by on or before ${on}   (${shown(FILE)})`);
  for (const e of hits) console.log(`  ${e.n}. [by ${e.by}] ${e.pct}%  ${e.claim}`);
  if (hits.length) {
    console.log(`  ${hits.length} of ${P.pending.length} pending ${hits.length === 1 ? 'is' : 'are'} due. Ask the person what happened, then: ${run}`);
    console.log('  Resolve the highest number first: the numbers shift after each resolve.');
  } else {
    const next = P.pending.map(e => e.by).sort()[0];
    console.log(`  nothing is due (${P.pending.length} pending${next ? `; the next resolve-by date is ${next}` : ''})`);
  }
  if (P.junk.length) console.log(`  ${unread(P)}. A due prediction may be among them: run list.`);
}

// ─── resolve ─────────────────────────────────────────────────────────────────
function resolve() {
  if (rest.length < 2) bad('resolve needs a target and an outcome: resolve <n | claim substring> <true|false>');
  const said = rest[rest.length - 1], word = said.toLowerCase(), target = one(rest.slice(0, -1).join(' '));
  const lesson = one(given['--lesson']), on = given['--on'] ?? today;
  const no = (msg) => die(1, `${msg} Nothing was written.`);
  if (word !== 'true' && word !== 'false') no(`the outcome must be true or false (got "${said}").`);
  if (!isDate(on)) no(`--on "${on}" is not a real calendar date (YYYY-MM-DD).`);
  const P = must();
  let e;
  if (/^\d+$/.test(target)) {
    e = P.entries.find(x => x.n === Number(target));
    if (!e) no(`there is no entry numbered ${target} (the ledger has ${P.entries.length}). Numbers come from: ${TOOL} list.`);
  } else {
    const hits = P.pending.filter(x => fold(x.claim).includes(fold(target)));
    if (hits.length > 1) no(`"${target}" matches ${hits.length} pending claims (${hits.map(x => `#${x.n}`).join(', ')}). Use the number, or more of the claim.`);
    e = hits[0] || P.resolved.find(x => fold(x.claim).includes(fold(target)));
    if (!e) no(`no claim contains "${target}". See: ${TOOL} list.`);
  }
  if (e.state === 'resolved') no(`#${e.n} is already resolved (${e.outcome}, Brier ${e.brier.toFixed(4)}).`);
  if (on < e.date) no(`--on ${on} is before the prediction was made (${e.date}).`);
  const o = word === 'true' ? 1 : 0, score = (e.pct / 100 - o) ** 2, brier = score.toFixed(4);

  // New bullets are written the way the record's own bullets are: its marker, and bold labels if it uses them.
  const first = P.lines[(e.f.date || e.f.prob).line], bm = (first.match(/^[-*+]\s+(\*\*|__)/) || [])[1] || '';
  const lab = (name) => `${first[0]} ${bm}${name}:${bm}`;
  const raw = P.raw.slice();
  let made = '';
  if (e.shape === 'A') {
    // The template's Resolved form. Date and Claim are carried over as written; Resolve by, Reasoning and Status are
    // not part of that form; a bullet this tool does not know is carried over too, never dropped.
    const keep = (it) => [it.line, ...it.cont].map(i => P.lines[i]);
    const oldLesson = e.f.lesson && one(e.f.lesson.value) && !lesson ? keep(e.f.lesson) : [];
    const rec = [...keep(e.f.date), ...keep(e.f.claim), `${lab('Probability')} ${e.pct}% (predicted) | ${bm}Outcome:${bm} ${word}`,
                 `${lab('Brier score')} ${brier}`, ...(lesson ? [`${lab('Lesson')} ${lesson}`] : oldLesson), `${lab('Resolved')} ${on}`,
                 ...e.items.filter(it => !it.key).flatMap(keep)];
    raw.splice(e.start, e.end - e.start + 1);
    // One blank line where the record was, not two.
    const blank = (i) => i >= 0 && i < raw.length && !raw[i].trim();
    if (blank(e.start - 1) && blank(e.start)) raw.splice(e.start - 1, 1);
    const M = parse(raw.join('\n')), z = M.zones.resolved;
    let at, block;
    if (z) { at = contentEnd(M, z.start, z.level); block = ['', ...rec]; }
    else {
      at = M.zones.pending ? contentEnd(M, M.zones.pending.start, M.zones.pending.level) : contentEnd(M, -1, 0);
      block = ['', '## Resolved', '', ...rec];
      made = ' (the `## Resolved` heading was added)';
    }
    if (at + 1 < M.lines.length && M.lines[at + 1].trim()) block.push('');
    insertAfter(raw, at, block, P.cr);
  } else {
    // In place: fill Status, Outcome and Brier where they are, add the ones that are missing, touch no other line.
    const tail = (it) => (it.cont.length ? it.cont[it.cont.length - 1] : it.line);
    const adds = new Map();                   // after which line -> the bullets to add there, in order
    let anchor = e.end;
    for (const [k, name, v] of [['status', 'Status', `resolved (${on})`], ['outcome', 'Outcome', word], ['brier', 'Brier', brier],
                                ...(lesson ? [['lesson', 'Lesson', lesson]] : [])]) {
      const it = e.f[k];
      if (it) {
        const l = P.lines[it.line];
        raw[it.line] = l.slice(0, l.length - it.m[3].length).trimEnd() + ' ' + v + (P.raw[it.line].endsWith('\r') ? '\r' : '');
        anchor = tail(it);
      } else adds.set(anchor, [...(adds.get(anchor) || []), `${lab(name)} ${v}`]);
    }
    for (const at of [...adds.keys()].sort((a, b) => b - a)) insertAfter(raw, at, adds.get(at), P.cr);
  }

  const Q = parse(raw.join('\n')), left = intact(P, Q, P.entries.filter(x => x !== e));
  const got = left && left.length === 1 ? left[0] : null;
  if (!got || got.state !== 'resolved' || got.outcome !== (o === 1) || got.claim !== e.claim || got.date !== e.date ||
      got.pct !== e.pct || Math.abs(got.brier - score) > 1e-12 || Q.pending.length !== P.pending.length - 1) no(UNREADBACK);
  const note = save(raw);
  console.log('wick-ledger resolve');
  console.log(`  resolved  [${e.date}] ${e.pct}% -> ${word}   Brier ${brier}   ${e.claim}${made}`);
  console.log(`  on        ${on}${e.shape === 'A' ? '; moved from Pending to Resolved' : '; Status, Outcome and Brier filled in place'}${note}`);
  console.log(`  The numbers have shifted: run list or due again before the next resolve. Stats: ${TOOL} report`);
}

// ─── report ──────────────────────────────────────────────────────────────────
// [label in the report, cell in calibration.md's table, lowest percentage, first percentage above it]
const BUCKETS = [['<30', '<30%', 0, 30], ['30-49', '30-49%', 30, 50], ['50-69', '50-69%', 50, 70], ['70-89', '70-89%', 70, 90], ['90+', '90%+', 90, 101]];
function stats(P) {
  const R = P.resolved, n = R.length, mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const hits = R.filter(e => e.outcome).length, r = n ? hits / n : null;
  return {
    n, hits, r, pending: P.pending.length,
    brier: n ? mean(R.map(e => e.brier)) : null,
    // Both baselines are scored on these same entries. Always-50% comes to 0.25 whatever the outcomes were, and the
    // base-rate forecast comes to r*(1-r); they are computed the long way so that the claim is checked, not assumed.
    half: n ? mean(R.map(e => (0.5 - (e.outcome ? 1 : 0)) ** 2)) : null,
    base: n ? mean(R.map(e => (r - (e.outcome ? 1 : 0)) ** 2)) : null,
    buckets: BUCKETS.map(([label, cell, lo, hi]) => {
      const es = R.filter(e => e.pct >= lo && e.pct < hi), h = es.filter(e => e.outcome).length;
      return { label, cell, count: es.length, hits: h, hitRate: es.length ? h / es.length : null, stated: es.length ? mean(es.map(e => e.pct)) : null };
    }),
    // A stored score that is not (p - outcome)^2 is somebody's arithmetic. The computed value is the one used.
    wrong: R.filter(e => e.stored !== null && Math.abs(e.stored - e.brier) > 0.005),
  };
}
const f4 = (x) => (x === null ? 'N/A' : x.toFixed(4));
const r4 = (x) => (x === null ? null : +x.toFixed(4) + 0);
const signed = (x) => { const d = +x.toFixed(4); return (d > 0 ? '+' : d < 0 ? '-' : ' ') + Math.abs(d).toFixed(4); };
const pc = (x) => (x === null ? '--' : `${Math.round(x)}%`);
const verdict = (S) => (S.n < MIN_TO_JUDGE
  ? `${S.n} resolved is too few to judge calibration: ${MIN_TO_JUDGE} or more are needed. Until then these numbers are arithmetic, not a verdict.`
  : `${S.n} resolved. Compare the mean with the two baselines, and each bucket's hit rate with its mean stated probability. This tool does the arithmetic; it does not grade it.`);

function report() {
  const P = must(), S = stats(P);
  let wrote = null, refused = null;
  if (given['--write']) {
    const w = writeCalibration(S);
    if (w.refused) refused = w; else wrote = w;
  }
  if (given['--json']) {
    console.log(JSON.stringify({
      file: shown(FILE), resolved: S.n, pending: S.pending, meanBrier: r4(S.brier), baseRate: r4(S.r),
      baselines: { always50: r4(S.half), baseRate: r4(S.base) },
      difference: { always50: S.n ? r4(S.brier - S.half) : null, baseRate: S.n ? r4(S.brier - S.base) : null },
      buckets: S.buckets.map(b => ({ bucket: b.label, count: b.count, hits: b.hits, hitRate: r4(b.hitRate), meanStated: r4(b.stated) })),
      minToJudge: MIN_TO_JUDGE, enoughToJudge: S.n >= MIN_TO_JUDGE, note: verdict(S),
      storedBrierMismatch: S.wrong.map(e => ({ line: e.line, stored: e.stored, computed: +e.brier.toFixed(4) })),
      unreadable: junkView(P), ...(wrote ? { wrote: wrote.file, changed: wrote.changed } : {}),
    }, null, 2));
  } else {
    console.log(`wick-ledger report — ${shown(FILE)}`);
    console.log(`  resolved ${S.n}   pending ${S.pending}`);
    console.log('');
    console.log(`  mean Brier                    ${f4(S.brier)}`);
    if (S.n) {
      console.log(`  always saying 50%             ${f4(S.half)}   difference ${signed(S.brier - S.half)}`);
      console.log(`  always saying the base rate   ${f4(S.base)}   difference ${signed(S.brier - S.base)}   (base rate ${pc(S.r * 100)}: ${S.hits} of ${S.n} came true)`);
      console.log('  Both baselines are scored on these same entries. Difference = mean Brier minus the baseline; a lower Brier score is closer to what happened.');
    }
    console.log('');
    console.log('  bucket   count   hit rate   mean stated');
    for (const b of S.buckets) console.log(`  ${b.label.padEnd(7)}  ${String(b.count).padStart(5)}   ${pc(b.hitRate === null ? null : b.hitRate * 100).padStart(8)}   ${pc(b.stated).padStart(11)}`);
    console.log('');
    console.log(`  ${verdict(S)}`);
    if (S.wrong.length) {
      console.log(`  ${S.wrong.length} stored Brier score${S.wrong.length === 1 ? ' is' : 's are'} not (p - outcome)^2; the computed value was used ` +
                  `(line${S.wrong.length === 1 ? '' : 's'} ${S.wrong.map(e => e.line).join(', ')}).`);
    }
    if (P.junk.length) console.log(`  ${unread(P)}. They are not in these numbers: run list.`);
    if (wrote) {
      console.log(wrote.changed ? `  wrote     ${wrote.file}: the Summary bullets and the bucket table, nothing else${wrote.note ? `\n  stamp     ${wrote.note}` : ''}`
                                : `  ${wrote.file} already says this; nothing was written`);
    }
  }
  if (refused) { console.error(`wick-ledger: ${refused.msg}`); process.exitCode = refused.code; }
}

// --write: calibration.md next to the ledger. Only the bullets under its Summary heading and its bucket table are
// replaced, by code. Everything else in the file is left as it is, and a file without those two places is refused:
// this tool does not decide where a person's stats should live.
function writeCalibration(S) {
  const file = path.join(path.dirname(FILE), 'calibration.md');
  let src;
  try { src = fs.readFileSync(file, 'utf8'); }
  catch { return { refused: true, code: 2, msg: `cannot read ${shown(file)}, so --write wrote nothing.` }; }
  const C = parse(src), { lines, inert } = C, raw = C.raw.slice();
  const text = (i) => (lines[i].match(HEAD) || [])[2]?.replace(/[*_`:]/g, '').trim().toLowerCase();
  let s0 = -1, s1 = -1;
  const sh = lines.findIndex((l, i) => !inert[i] && text(i) === 'summary');
  if (sh >= 0) {
    let i = sh + 1;
    while (i < lines.length && !lines[i].trim()) i++;
    if (i < lines.length && !inert[i] && BULLET.test(lines[i])) {
      s0 = i;
      while (i < lines.length && lines[i].trim() && !inert[i] && !HEAD.test(lines[i]) && (BULLET.test(lines[i]) || /^\s/.test(lines[i]))) i++;
      s1 = i - 1;
    }
  }
  const row = (i) => i < lines.length && !inert[i] && /^\s*\|/.test(lines[i]);
  const t0 = lines.findIndex((l, i) => row(i) && (l.split('|')[1] || '').replace(/[*_`]/g, '').trim().toLowerCase() === 'bucket');
  let t1 = t0;
  while (t0 >= 0 && row(t1 + 1)) t1++;
  if (s0 < 0 || t0 < 0) {
    const missing = [s0 < 0 ? 'a bullet list under a "Summary" heading' : '', t0 < 0 ? 'a table whose first column is "Bucket"' : ''].filter(Boolean).join(' or ');
    return { refused: true, code: 1, msg: `${shown(file)} has no ${missing}. --write replaces those two places and nothing else, and will not invent them. Nothing was written.` };
  }
  const summary = [
    `- **Total predictions:** ${S.n + S.pending}`,
    `- **Resolved:** ${S.n}`,
    `- **Pending:** ${S.pending}`,
    `- **Mean Brier score:** ${f4(S.brier)}`,
    `- **Always-50% baseline:** ${S.n ? `${f4(S.half)} (difference ${signed(S.brier - S.half).trim()})` : 'N/A'}`,
    `- **Base-rate baseline:** ${S.n ? `${f4(S.base)} (base rate ${pc(S.r * 100)}; difference ${signed(S.brier - S.base).trim()})` : 'N/A'}`,
    `- **Calibration:** ${S.n < MIN_TO_JUDGE ? `too few to judge (${S.n} resolved; ${MIN_TO_JUDGE} or more are needed)` : `${S.n} resolved: compare each bucket's hit rate with its mean stated probability`}`,
  ];
  const cells = [['Bucket', 'Count', 'Hit Rate', 'Mean stated'],
                 ...S.buckets.slice().reverse().map(b => [b.cell, String(b.count), pc(b.hitRate === null ? null : b.hitRate * 100), pc(b.stated)])];
  const w = cells[0].map((_, c) => Math.max(...cells.map(r => r[c].length)));
  const line = (r) => `| ${r.map((x, c) => x.padEnd(w[c])).join(' | ')} |`;
  const table = [line(cells[0]), `|${w.map(n => '-'.repeat(n + 2)).join('|')}|`, ...cells.slice(1).map(line)];
  for (const [a, b, block] of [[s0, s1, summary], [t0, t1, table]].sort((x, y) => y[0] - x[0])) {
    const final = b === raw.length - 1;                 // the file's last line, with no newline after it: keep it so
    raw.splice(a, b - a + 1, ...block.map((l, j) => l + (final && j === block.length - 1 ? '' : C.cr)));
  }
  if (raw.join('\n') === src) return { file: shown(file), changed: false, note: '' };
  const s = stamp(raw, file);
  fs.writeFileSync(file, raw.join('\n'));
  s.commit();
  return { file: shown(file), changed: true, note: s.note };
}

try {
  ({ list, add, due, resolve, report })[cmd]();
} catch (err) {
  // A bug must not look like a result. Under --hook it must not look like anything.
  if (HOOK) process.exit(0);
  console.error(`wick-ledger: ${err?.message || err}`);
  process.exit(2);
}
