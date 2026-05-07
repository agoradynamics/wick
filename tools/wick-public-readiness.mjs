#!/usr/bin/env node
// wick-public-readiness.mjs — scan a Wick repo (or any repo) for terms that
// should not ship publicly: internal model identifiers, infrastructure
// endpoints, internal codenames, role names, non-public apprentice names.
//
// Companion to tools/wick-scrub.mjs (which catches credentials). This tool
// catches the *other* failure mode that produced the May 6 2026 leak —
// internal vocabulary that should never have been vendored into a public repo.
//
// Usage:
//   node tools/wick-public-readiness.mjs [path]              # scan path (default: .)
//   node tools/wick-public-readiness.mjs --config <file>     # custom blocklist
//   node tools/wick-public-readiness.mjs --json              # machine-readable
//
// Exits 0 if clean, 1 if findings, 2 on error.
//
// No network calls, no telemetry, no LLM. Pure file scan.

import fs from 'node:fs';
import path from 'node:path';

// ─── CLI parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = { path: '.', configPath: '.wick-blocklist.json', json: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--config') opts.configPath = args[++i];
  else if (a === '--json') opts.json = true;
  else if (a === '--help' || a === '-h') {
    console.log(`wick-public-readiness — scan for leak-prone vocabulary.\n\nUsage:\n  node tools/wick-public-readiness.mjs [path]\n  --config <file>  Custom blocklist (default: .wick-blocklist.json)\n  --json           Machine-readable output\n  --help           This message\n\nExits 0 clean / 1 findings / 2 error.`);
    process.exit(0);
  }
  else if (!a.startsWith('-')) opts.path = a;
}

// ─── Load config ─────────────────────────────────────────────────────────
let config;
try {
  const configFull = path.resolve(opts.configPath);
  if (!fs.existsSync(configFull)) {
    console.error(`error: blocklist not found at ${configFull}`);
    console.error(`Run from a Wick repo root, or pass --config <path>.`);
    process.exit(2);
  }
  config = JSON.parse(fs.readFileSync(configFull, 'utf8'));
} catch (e) {
  console.error(`error: failed to parse blocklist: ${e.message}`);
  process.exit(2);
}

const SCAN_EXTENSIONS = new Set(['.md', '.txt', '.json', '.jsonl', '.yaml', '.yml', '.mjs', '.js', '.ts', '.tsx', '.html', '.sh', '.cff']);
const ignorePaths = (config.ignore_paths || []).map(p => p.replace(/\\/g, '/'));

// ─── Allowlist helpers ───────────────────────────────────────────────────
function isAllowed(filePath, matchedTerm) {
  const allow = config.allowlist || {};
  const rel = path.relative(opts.path, filePath).replace(/\\/g, '/');
  const entry = allow[rel];
  if (!entry || !Array.isArray(entry.terms)) return false;
  // Match if the matched term contains (or is contained by) any allowlisted term.
  // Case-insensitive substring match either direction so we tolerate slight differences.
  const m = matchedTerm.toLowerCase();
  return entry.terms.some(t => {
    const tl = t.toLowerCase();
    return m.includes(tl) || tl.includes(m);
  });
}

// ─── Walk filesystem ────────────────────────────────────────────────────
function walk(dir, files = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return files; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(opts.path, full).replace(/\\/g, '/');
    if (ignorePaths.some(p => rel === p.replace(/\/$/, '') || rel.startsWith(p))) continue;
    if (ent.isDirectory()) walk(full, files);
    else if (ent.isFile() && SCAN_EXTENSIONS.has(path.extname(ent.name))) files.push(full);
  }
  return files;
}

// ─── Pattern compile ────────────────────────────────────────────────────
function compilePattern(p) {
  if (p.type === 'regex') {
    return new RegExp(p.value, 'gi');
  }
  // literal: case-insensitive substring, escaped for regex
  const escaped = p.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'gi');
}

// ─── Scan one file ──────────────────────────────────────────────────────
function scanFile(filePath, categories) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); }
  catch { return []; }
  const lines = content.split('\n');
  const findings = [];
  for (const [catName, cat] of Object.entries(categories)) {
    for (const pat of cat.patterns) {
      const re = compilePattern(pat);
      lines.forEach((line, i) => {
        re.lastIndex = 0;
        for (const m of line.matchAll(re)) {
          const matched = m[0];
          if (isAllowed(filePath, matched)) continue;
          findings.push({
            file: filePath,
            line: i + 1,
            col: (m.index ?? 0) + 1,
            category: catName,
            pattern: pat.value,
            severity: cat.severity,
            reason: cat.reason,
            matched,
            snippet: line.length > 140 ? line.slice(0, 100) + '…' + line.slice(-30) : line,
          });
        }
      });
    }
  }
  return findings;
}

// ─── Run ────────────────────────────────────────────────────────────────
const root = path.resolve(opts.path);
if (!fs.existsSync(root)) {
  console.error(`error: path not found: ${root}`);
  process.exit(2);
}

const files = walk(root);
const allFindings = [];
for (const f of files) allFindings.push(...scanFile(f, config.categories));

// ─── Report ─────────────────────────────────────────────────────────────
if (opts.json) {
  console.log(JSON.stringify({
    scanned: files.length,
    findings: allFindings.length,
    by_severity: allFindings.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, {}),
    items: allFindings,
  }, null, 2));
} else {
  if (allFindings.length === 0) {
    console.log(`✓ wick-public-readiness: scanned ${files.length} file(s), no findings.`);
  } else {
    console.log(`✗ wick-public-readiness: ${allFindings.length} finding(s) across ${files.length} scanned file(s).\n`);
    const byCategory = {};
    for (const f of allFindings) {
      (byCategory[f.category] ||= []).push(f);
    }
    for (const [cat, items] of Object.entries(byCategory)) {
      console.log(`── ${cat} (${items[0].severity}) ──`);
      console.log(`   why: ${items[0].reason}`);
      for (const f of items) {
        const rel = path.relative(root, f.file).replace(/\\/g, '/');
        console.log(`   ${rel}:${f.line}:${f.col}  matched "${f.matched}"`);
        console.log(`     ${f.snippet.trim()}`);
      }
      console.log('');
    }
    console.log(`To allow a known-legitimate use, add the file + term to the "allowlist" section of .wick-blocklist.json.`);
  }
}

process.exit(allFindings.length === 0 ? 0 : 1);
