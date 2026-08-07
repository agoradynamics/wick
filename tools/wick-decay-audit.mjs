#!/usr/bin/env node
// wick-decay-audit.mjs — separate memory that describes THE WORLD from memory that describes
// HOW TO BE A MODEL. Sixth companion to wick-scrub (credentials), wick-public-readiness
// (vocabulary), wick-identity-audit (confabulation anchors), wick-path-audit (portability),
// and wick-freshness-audit (temporal provenance).
//
// WHY THIS EXISTS. There is live advice — including from model vendors — to delete your .md
// files and skills every ~6 months because they go stale as models update. That advice is
// right about a real failure mode and wrong about the remedy.
//
// The failure mode is real: an instruction written to patch a model's weakness becomes dead
// weight when the weakness is fixed, and can actively cage a better model. If your agent's
// behaviour DEGRADES when the model improves, the file was compensating rather than
// describing. That is what "agents went astray on the new model" usually means.
//
// The remedy is wrong because markdown is a container for two different things:
//   WORLD — measurements, decisions, machine facts, people, domain knowledge. "The HF cache
//           lives in WSL, not Windows." "Corpus-union beat distillation, +0.150 [+0.111,
//           +0.188]." None of that is model-scoped. It does not decay when a model ships.
//   PATCH — a workaround for a SPECIFIC model's behaviour. This is the only class with a
//           genuine expiry, and its expiry is a MODEL CHANGE, not a calendar date.
//
// Deleting the container to expire one class destroys the other. Measured on a mature layer
// (2026-08-06, 2594 substantive lines): 48 lines mentioned a model at all — and on reading,
// essentially none were prompting workarounds. They were findings where a model was the
// SUBJECT, architecture notes, and citations. Time-based deletion would have destroyed ~2500
// lines of measurement history to clean up a handful of patches.
//
// THE LOAD-BEARING RULE: a patch must state its TRIGGER — the observed behaviour that
// justifies it. An instruction that says "always X" is unfalsifiable; you can only trust it
// or delete it, and blanket deletion is the only available remedy PRECISELY BECAUSE the rule
// carries no reason. "X because Y, observed Z" can be re-tested: if Y no longer holds, X goes
// today; if Y still holds, X stays indefinitely. Reasons, not calendars.
//
// TAG ONLY THE EXCEPTION. `world` is the unmarked default. A discipline that requires tagging
// 98% of a layer to find the 2% will not be adopted, and the noise would drown the signal.
//
//   Format, inline on the entry (not the file — one file can hold both classes):
//     [patch: <the observed behaviour that justifies this, and how to re-test it>]
//
//   Example:
//     - Pin thinking-disabled on API calls.
//       [patch: sonnet-5 thinks by default; 9/13 generations returned EMPTY at max_tokens.
//        Re-test by generating without the pin.]
//
// What it checks:
//   1. every [patch: ...] carries a non-empty trigger            (HIGH — mechanically checkable)
//   2. inventory of every patch, for the model-upgrade re-test    (--list)
//   3. ADVISORY: lines that look like an untagged patch           (LOW — never blocks)
//
// Rule 3 is deliberately advisory. The heuristic matches "names a model AND gives a directive",
// which on a real layer is mostly false positives — a finding about a model is not a patch.
// A scanner that auto-classified here would produce a plausible answer where a judgement call
// belongs, which is the exact failure this tool exists to prevent.
//
// Usage:
//   node tools/wick-decay-audit.mjs             # default: memory/
//   node tools/wick-decay-audit.mjs <path>      # a specific file or directory
//   node tools/wick-decay-audit.mjs --list      # print the patch inventory (upgrade checklist)
//   node tools/wick-decay-audit.mjs --json      # machine-readable
//   node tools/wick-decay-audit.mjs --warn      # report but always exit 0
//
// Exits 0 if clean, 1 if blocking findings, 2 on error. No network, no telemetry, no LLM.
//
// IT NEVER DELETES, ARCHIVES, OR DOWN-RANKS ANYTHING. MEMORY-PROTOCOL.md §10's boundary holds:
// a tool reports; a human retires. This tool adds the field that makes a re-test possible —
// it does not decide the outcome.

import fs from 'node:fs';
import path from 'node:path';

// ─── CLI ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = { path: null, list: false, json: false, warn: false };
for (const a of args) {
  if (a === '--list') opts.list = true;
  else if (a === '--json') opts.json = true;
  else if (a === '--warn') opts.warn = true;
  else if (a === '--help' || a === '-h') {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8')
      .split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n'));
    process.exit(0);
  } else if (a.startsWith('-')) { console.error(`error: unknown flag ${a}`); process.exit(2); }
  else opts.path = a;
}

const ROOT = process.cwd();
const target = opts.path ?? path.join(ROOT, 'memory');
if (!fs.existsSync(target)) { console.error(`error: path not found: ${target}`); process.exit(2); }

function walk(p, out = []) {
  const st = fs.statSync(p);
  if (st.isFile()) { if (p.endsWith('.md')) out.push(p); return out; }
  for (const e of fs.readdirSync(p)) {
    if (e.startsWith('.') || e === 'node_modules' || e.startsWith('_archived')) continue;
    walk(path.join(p, e), out);
  }
  return out;
}

// ─── detection ───────────────────────────────────────────────────────────
// Advisory heuristic: does the line NAME a model and also GIVE A DIRECTIVE? Both are required.
// Naming a model alone is overwhelmingly a finding, a citation, or an architecture note.
// "the model" was dropped as a trigger term: too loose. It fired on 3 of 6 false positives in the
// first dogfood ("refined the model live", "the model cannot predict from its input") — prose
// ABOUT a model is not an instruction TO one. A named model is the far stronger signal.
const NAMES_MODEL = /\b(claude|opus|sonnet|haiku|gpt-?\d|gemini|llama|qwen|mistral)\b/i;
// Hyphen-guarded: a bare \b let "don't" match inside the framework name "verify-don't-assert",
// producing false positives on pure findings. A directive starts a clause; it is not a fragment
// of a compound noun.
const DIRECTIVE = /(^|[^-\w])(always|never|be sure to|make sure|remember to|you must|do not|don't|avoid|prefer|instead of|force|pin|disable|override|work ?around)(?![-\w])/i;
// Lines that are plainly reporting rather than instructing — a measurement is not a patch.
const REPORTING = /\b(measured|observed|found|result|verified|scored|F1|%|pp\b|arXiv|20\d\d-\d\d-\d\d|commit)\b/i;

const findings = [];
const patches = [];
const files = walk(target).sort();

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // Patch tags are matched against the WHOLE FILE, not line-by-line: memory prose wraps, and a
  // tag routinely spans two lines. Matching per-line missed those AND then falsely flagged them
  // as untagged patches — the worst outcome, since it punishes the discipline being followed.
  // (Caught in dogfooding against a fixture, not in review.)
  // Mask fenced blocks and inline code spans. Prose that DOCUMENTS the syntax must not be parsed
  // AS the syntax — MEMORY-PROTOCOL.md §11 and any index row describing the feature would
  // otherwise report themselves as malformed tags. (Found by running the scanner on the document
  // that defines it, which is the obvious dogfood and was not obvious until it fired.)
  const masked = new Uint8Array(text.length);
  for (const re of [/```[\s\S]*?```/g, /`[^`\n]*`/g]) {
    let cm;
    while ((cm = re.exec(text)) !== null) masked.fill(1, cm.index, cm.index + cm[0].length);
  }

  const taggedLines = new Set();
  const RE = /\[patch:([^\]]*)\]/gis;
  let m;
  while ((m = RE.exec(text)) !== null) {
    if (masked[m.index]) continue;          // a documented example, not a live tag
    const startLine = text.slice(0, m.index).split('\n').length;
    const endLine = startLine + m[0].split('\n').length - 1;
    // Cover the whole ENTRY, not just the lines the tag spans. A tag usually sits on a wrapped
    // continuation line, so marking only its own lines left the entry's FIRST line still firing
    // the untagged-patch advisory — i.e. following the discipline did not clear the warning,
    // which is how a tool teaches people to ignore it. Walk back to the bullet/heading that owns
    // the tag, and forward to the end of that block.
    let blockStart = startLine;
    while (blockStart > 1) {
      const prev = (lines[blockStart - 1] || '');
      if (/^\s*([-*+]|\d+\.)\s/.test(prev) || /^#{1,6}\s/.test(prev)) break;
      if (!prev.trim()) { blockStart++; break; }
      blockStart--;
    }
    let blockEnd = endLine;
    while (blockEnd < lines.length && lines[blockEnd] !== undefined
           && lines[blockEnd].trim() && !/^\s*([-*+]|\d+\.)\s/.test(lines[blockEnd])
           && !/^#{1,6}\s/.test(lines[blockEnd])) blockEnd++;
    for (let l = blockStart; l <= blockEnd; l++) taggedLines.add(l);
    const trigger = m[1].replace(/\s+/g, ' ').trim();
    const excerpt = (lines[startLine - 1] || '').trim().slice(0, 110);
    if (trigger.length < 12) {
      // The whole point of the class is that it can be re-tested. Without a stated trigger there
      // is nothing to test, so the entry is exactly the unfalsifiable rule that forces people to
      // delete on a calendar.
      findings.push({
        file: rel, line: startLine, severity: 'high', rule: 'patch-without-trigger',
        reason: 'a [patch:] must state the observed behaviour that justifies it, or it cannot be re-tested',
        text: excerpt,
      });
    } else {
      patches.push({ file: rel, line: startLine, trigger, text: excerpt });
    }
  }

  let fenced = false;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (/^```/.test(line)) { fenced = !fenced; return; }
    if (fenced || !line || taggedLines.has(i + 1)) return;
    if (NAMES_MODEL.test(line) && DIRECTIVE.test(line) && !REPORTING.test(line)) {
      findings.push({
        file: rel, line: i + 1, severity: 'low', rule: 'possible-untagged-patch',
        reason: 'names a model and gives a directive — if this is a workaround, tag it [patch: <trigger>]; if it describes the world, leave it',
        text: line.slice(0, 110),
      });
    }
  });
}

// ─── report ──────────────────────────────────────────────────────────────
const blocking = findings.filter(f => f.severity === 'high' || f.severity === 'med');

if (opts.json) {
  console.log(JSON.stringify({ scanned: files.length, patches, findings }, null, 2));
  process.exit(blocking.length === 0 || opts.warn ? 0 : 1);
}

if (opts.list) {
  console.log(`\nPATCH INVENTORY — the model-upgrade re-test list (${patches.length} entr${patches.length === 1 ? 'y' : 'ies'})\n`);
  if (!patches.length) {
    console.log('  none. Every tagged memory in this layer describes the world, not the model.');
    console.log('  A model upgrade requires no memory changes.\n');
  } else {
    for (const p of patches) {
      console.log(`  ${p.file}:${p.line}`);
      console.log(`    ${p.text}`);
      console.log(`    TRIGGER: ${p.trigger}`);
      console.log('    -> on a model change, re-test the trigger. Still true? keep. Gone? delete.\n');
    }
  }
  process.exit(0);
}

console.log(`\nwick-decay-audit — ${files.length} file(s) scanned under ${path.relative(ROOT, target) || '.'}`);
console.log(`  tagged patches: ${patches.length}   findings: ${findings.length} (${blocking.length} blocking)\n`);

const rank = { high: 0, med: 1, low: 2 };
for (const f of findings.sort((a, b) => rank[a.severity] - rank[b.severity])) {
  console.log(`  [${f.severity.toUpperCase().padEnd(4)}] ${f.file}:${f.line}  ${f.rule}`);
  console.log(`         ${f.text}`);
  console.log(`         ${f.reason}\n`);
}

if (!findings.length) console.log('  clean.\n');
console.log('  LOW findings never block — they are prompts for judgement, not classifications.');
console.log('  Run with --list for the patch inventory to re-test on a model upgrade.\n');

process.exit(blocking.length === 0 || opts.warn ? 0 : 1);
