#!/usr/bin/env node
// wick-path-audit.mjs — scan portable Wick files for ABSOLUTE paths, which break
// the moment the folder moves to another machine. A portability lint, not a secret
// scanner. Fourth companion to wick-scrub (credentials), wick-public-readiness
// (internal vocabulary), and wick-identity-audit (confabulation anchors).
//
// Absolute paths are the silent portability killer (MEMORY-PROTOCOL.md §5): a
// reference like C:\Users\you\project\memory\x.md or /home/you/project works until
// the folder moves, then every pointer breaks at once on the one machine that isn't
// the original. Host auto-memory writes machine-keyed absolute paths by default, so
// anything drained from it is a prime suspect.
//
// Usage:
//   node tools/wick-path-audit.mjs            # default: memory/ + loaded config files
//   node tools/wick-path-audit.mjs <path>     # scan a specific file or directory
//   node tools/wick-path-audit.mjs --all      # scan the whole repo (flags doc examples)
//   node tools/wick-path-audit.mjs --json     # machine-readable
//
// Exits 0 if clean, 1 if findings, 2 on error. No network, no telemetry, no LLM.

import fs from 'node:fs';
import path from 'node:path';

// ─── CLI parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = { path: null, all: false, json: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--all') opts.all = true;
  else if (a === '--json') opts.json = true;
  else if (a === '--help' || a === '-h') {
    console.log(`wick-path-audit — flag absolute paths in portable Wick files.\n\nUsage:\n  node tools/wick-path-audit.mjs            Default: memory/ + CLAUDE.md/WICK.md/KNOWLEDGE.md/AGENTS.md\n  node tools/wick-path-audit.mjs <path>     Scan a specific file or directory\n  node tools/wick-path-audit.mjs --all      Scan the whole repo (will flag doc examples)\n  node tools/wick-path-audit.mjs --json     Machine-readable output\n  node tools/wick-path-audit.mjs --help     This message\n\nExits 0 clean / 1 findings / 2 error.`);
    process.exit(0);
  }
  else if (!a.startsWith('-')) opts.path = a;
}

// ─── What counts as an absolute path ─────────────────────────────────────
const PATTERNS = [
  { name: 'windows-drive', severity: 'high', re: /\b[A-Za-z]:[\\/](?:[\w .~-]+[\\/])*/g, reason: 'Windows absolute path (drive-rooted) — breaks on any other machine.' },
  { name: 'unc-share',     severity: 'high', re: /\\\\[A-Za-z0-9_.$-]+\\[^\s"'`]+/g,      reason: 'UNC network share path — host-specific, non-portable.' },
  { name: 'unix-home',     severity: 'high', re: /\/(?:home|Users)\/[^\s/"'`]+\/[^\s"'`]*/g, reason: 'User-home absolute path — encodes a username, breaks for any other user.' },
  { name: 'unix-system',   severity: 'med',  re: /\/(?:var|opt|etc|usr|mnt|root|tmp)\/[^\s"'`]+/g, reason: 'System-root absolute path — machine-specific; make it project-relative.' },
  { name: 'home-tilde',    severity: 'med',  re: /~\/[^\s"'`]+/g, reason: 'Home-relative path (~/...) — user/machine-specific; use a project-relative path.' },
];

// Lines that are obviously placeholders or examples — never flag.
const PLACEHOLDER = /\/path\/to|your-project|<[^>]+>|\bC:\\path\b|\/Users\/you\b|\/home\/user\b|example\.com/i;

const SCAN_EXTENSIONS = new Set(['.md', '.txt', '.json', '.jsonl', '.yaml', '.yml']);
const DEFAULT_FILES = ['CLAUDE.md', 'WICK.md', 'KNOWLEDGE.md', 'AGENTS.md'];

// ─── Walk filesystem ────────────────────────────────────────────────────
function walk(dir, files = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return files; }
  for (const ent of entries) {
    if (ent.name === '.git' || ent.name === 'node_modules') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (ent.isFile() && SCAN_EXTENSIONS.has(path.extname(ent.name))) files.push(full);
  }
  return files;
}

// ─── Resolve the scan target list ───────────────────────────────────────
function targets() {
  const root = process.cwd();
  if (opts.path) {
    const p = path.resolve(opts.path);
    if (!fs.existsSync(p)) { console.error(`error: path not found: ${p}`); process.exit(2); }
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  }
  if (opts.all) return walk(root);
  // default: the portable state (memory/) + the agent-loaded config files
  const list = [];
  const mem = path.join(root, 'memory');
  if (fs.existsSync(mem)) walk(mem, list);
  for (const f of DEFAULT_FILES) {
    const full = path.join(root, f);
    if (fs.existsSync(full)) list.push(full);
  }
  return list;
}

// ─── Scan one file ──────────────────────────────────────────────────────
function scanFile(filePath) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); }
  catch { return []; }
  const findings = [];
  content.split('\n').forEach((line, i) => {
    if (line.includes('://')) return;     // skip URL lines (paths inside URLs are not file paths)
    if (PLACEHOLDER.test(line)) return;   // skip documented placeholders / examples
    for (const pat of PATTERNS) {
      pat.re.lastIndex = 0;
      for (const m of line.matchAll(pat.re)) {
        findings.push({
          file: filePath, line: i + 1, col: (m.index ?? 0) + 1,
          rule: pat.name, severity: pat.severity, reason: pat.reason,
          matched: m[0].length > 80 ? m[0].slice(0, 77) + '…' : m[0],
        });
      }
    }
  });
  return findings;
}

// ─── Run + report ───────────────────────────────────────────────────────
const files = targets();
const all = [];
for (const f of files) all.push(...scanFile(f));

if (opts.json) {
  console.log(JSON.stringify({ scanned: files.length, findings: all.length, items: all }, null, 2));
} else if (all.length === 0) {
  console.log(`✓ wick-path-audit: scanned ${files.length} file(s), no absolute paths.`);
} else {
  console.log(`✗ wick-path-audit: ${all.length} absolute path(s) across ${files.length} scanned file(s).\n`);
  for (const f of all) {
    const rel = path.relative(process.cwd(), f.file).replace(/\\/g, '/');
    console.log(`   ${rel}:${f.line}:${f.col}  [${f.severity}] ${f.rule}  →  ${f.matched}`);
    console.log(`     ${f.reason}`);
  }
  console.log(`\nRewrite each as a path relative to the project root. See MEMORY-PROTOCOL.md §5.`);
  console.log(`Placeholders (/path/to, your-project, <…>) and URL lines are ignored automatically.`);
}

process.exit(all.length === 0 ? 0 : 1);
