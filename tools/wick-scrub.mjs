#!/usr/bin/env node
// wick-scrub.mjs — scan Wick memory files for accidentally committed secrets.
//
// Usage:
//   node tools/wick-scrub.mjs [path]
//
// Default path: memory/
// Exits 0 if clean, 1 if findings, 2 on error. No network calls, no telemetry.

import fs from 'node:fs';
import path from 'node:path';

const PATTERNS = [
  { name: 'Anthropic API key',        re: /sk-ant-api\d{2}-[A-Za-z0-9_\-]{60,}/g,                              severity: 'critical' },
  { name: 'OpenAI API key',           re: /sk-(?:proj-)?[A-Za-z0-9_\-]{40,}/g,                                severity: 'critical' },
  { name: 'GitHub PAT (classic)',     re: /gh[pousr]_[A-Za-z0-9]{36,}/g,                                      severity: 'critical' },
  { name: 'GitHub fine-grained PAT',  re: /github_pat_[A-Za-z0-9_]{60,}/g,                                    severity: 'critical' },
  { name: 'AWS access key',           re: /AKIA[0-9A-Z]{16}/g,                                                severity: 'critical' },
  { name: 'AWS secret key pattern',   re: /aws(?:_|-)?secret(?:_|-)?access(?:_|-)?key\s*[:=]\s*["'`][^"'`]{30,}/gi, severity: 'critical' },
  { name: 'Slack token',              re: /xox[baprs]-[0-9]+-[0-9]+-[A-Za-z0-9]+/g,                           severity: 'critical' },
  { name: 'Google API key',           re: /AIza[0-9A-Za-z_\-]{35}/g,                                          severity: 'critical' },
  { name: 'Stripe secret key',        re: /sk_live_[A-Za-z0-9]{24,}/g,                                        severity: 'critical' },
  { name: 'JWT token',                re: /eyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/g, severity: 'high' },
  { name: 'Private key block',        re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,     severity: 'critical' },
  { name: 'DB URL with credentials',  re: /(?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis):\/\/[^:\s]+:[^@\s]+@/g, severity: 'critical' },
  { name: 'Password assignment',      re: /(?:password|passwd|pwd)\s*[:=]\s*["'`][^"'`\s]{6,}["'`]/gi,        severity: 'high' },
  { name: 'Generic secret',           re: /(?:secret|api[_-]?key|auth[_-]?token|access[_-]?token)\s*[:=]\s*["'`][A-Za-z0-9_\-]{20,}["'`]/gi, severity: 'high' },
  { name: 'Bearer token',             re: /Bearer\s+[A-Za-z0-9_\-\.]{30,}/g,                                  severity: 'high' },
  { name: 'Credit card (Visa/MC-ish)', re: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/g,                severity: 'high' },
];

const ALLOW_FILES = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.jsonl']);

function scanFile(filePath) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); }
  catch { return []; }
  const lines = content.split('\n');
  const findings = [];
  for (const pat of PATTERNS) {
    lines.forEach((line, i) => {
      pat.re.lastIndex = 0;
      for (const m of line.matchAll(pat.re)) {
        findings.push({
          file: filePath,
          line: i + 1,
          col: (m.index ?? 0) + 1,
          pattern: pat.name,
          severity: pat.severity,
          snippet: line.length > 120 ? line.slice(0, 80) + '…' + line.slice(-30) : line,
          match: m[0].length > 16 ? m[0].slice(0, 8) + '…' + m[0].slice(-4) : m[0],
        });
      }
    });
  }
  return findings;
}

function walkDir(dir) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.claude') continue;
    if (e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkDir(full));
    else if (e.isFile() && ALLOW_FILES.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

const target = process.argv[2] || 'memory/';
if (!fs.existsSync(target)) {
  console.error(`wick-scrub: target not found: ${target}`);
  process.exit(2);
}

const stat = fs.statSync(target);
const files = stat.isDirectory() ? walkDir(target) : [target];

const sevRank = { critical: 0, high: 1, medium: 2 };
let critical = 0, high = 0;

console.log(`wick-scrub v1.0 — scanning ${files.length} file(s) under ${target}\n`);

for (const f of files) {
  const findings = scanFile(f);
  findings.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
  for (const x of findings) {
    const tag = x.severity === 'critical' ? 'CRITICAL' : 'HIGH';
    console.log(`[${tag}] ${x.file}:${x.line}:${x.col}  ${x.pattern}`);
    console.log(`   ${x.snippet}`);
    console.log(`   matched: ${x.match}\n`);
    if (x.severity === 'critical') critical++; else high++;
  }
}

const total = critical + high;
if (total === 0) {
  console.log(`\n✓ wick-scrub: clean. ${files.length} file(s) scanned, no secrets detected.`);
  console.log(`  Note: no automated scanner is perfect. Human review before committing is still wise.`);
  process.exit(0);
} else {
  console.log(`\n✗ wick-scrub: ${critical} critical, ${high} high-severity finding(s).`);
  console.log(`  Review each finding above. Redact before committing, sharing, or publishing.`);
  console.log(`  If a finding is a false positive (e.g. documentation of a pattern), add a comment like`);
  console.log(`  "wick-scrub: false-positive, reason" on the same line — that's just a note for humans;`);
  console.log(`  the scanner is pattern-based and doesn't suppress findings.`);
  process.exit(1);
}
