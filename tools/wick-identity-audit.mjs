#!/usr/bin/env node
// wick-identity-audit.mjs — scan .md files for claim-based identity anchors
// that produce confabulation in the underlying model.
//
// The failure mode: prompts like "You are a master of X" or "You are the
// expert in Y" anchor the model at a confident-performance stance, causing
// it to fabricate specifics rather than flag what it can't verify.
//
// The fix: practice-based phrasing. "I study X." "I work with frameworks
// in Y." "When I don't know, I say so." Replace claim with demonstration.
//
// Usage:
//   node tools/wick-identity-audit.mjs [path]    # default: .
//
// Exits 0 if clean, 1 if findings, 2 on error. No network calls.
//
// Companion to wick-scrub.mjs (credentials) and wick-public-readiness.mjs
// (internal-vocabulary). This one catches the third failure mode:
// confabulation-prompting identity claims.

import fs from 'node:fs';
import path from 'node:path';

const GAP = '[\\s\\S\\w*,.;:"\'`\\-]{0,60}?';

const PATTERNS = [
  { sev: 'HIGH', re: new RegExp('you are' + GAP + '\\b(an?|the)\\s+(master|top|world[-\\s]class|premier|leading|the\\s+best|greatest|ultimate|elite|renowned|authoritative|genius|virtuoso)\\b', 'gi'), label: 'bold identity claim' },
  { sev: 'HIGH', re: new RegExp('i am' + GAP + '\\b(an?|the)\\s+(master|top|world[-\\s]class|premier|leading|the\\s+best|greatest|ultimate|elite|renowned|authoritative|genius|expert|specialist|authority)\\b', 'gi'), label: 'first-person identity claim' },
  { sev: 'HIGH', re: new RegExp('you are' + GAP + '\\b(an?|the)?\\s*expert\\s+(in|at|on|modder|developer|engineer)\\b', 'gi'), label: 'expert-in claim' },
  { sev: 'HIGH', re: new RegExp('you are' + GAP + '\\b(an?|the)\\s+expert\\b', 'gi'), label: 'bare expert identity' },
  { sev: 'HIGH', re: /operates as\s+(an?|the)\s+(expert|master|specialist|authority)/gi, label: 'operates-as-expert claim' },
  { sev: 'MED',  re: new RegExp('you are' + GAP + '\\b(an?|the)\\s+(specialist|professional|pro)\\b', 'gi'), label: 'specialist identity' },
  { sev: 'MED',  re: /\byour\s+(expertise|mastery)\s+(in|at|on)/gi, label: 'expertise/mastery noun' },
  { sev: 'MED',  re: /you\s+(always|never)\s+(succeed|fail|get it right|make mistakes|forget|miss)/gi, label: 'absolutist behavior claim' },
  { sev: 'LOW',  re: /confidently\s+(generate|produce|write|output|answer)/gi, label: 'confidence mandate' },
  { sev: 'LOW',  re: /\byou\s+know\s+(every|all|each)\s+/gi, label: 'total-knowledge claim' },
  { sev: 'LOW',  re: /\bas\s+(an?|the)\s+(expert|master|specialist)/gi, label: 'as-expert self-framing' },
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(md|markdown)$/i.test(e.name)) out.push(full);
  }
  return out;
}

const files = walk('.');
let total = 0;
const byFile = {};

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const lines = text.split('\n');
  for (const p of PATTERNS) {
    lines.forEach((line, i) => {
      p.re.lastIndex = 0;
      for (const m of line.matchAll(p.re)) {
        (byFile[f] ||= []).push({ sev: p.sev, line: i + 1, label: p.label, match: m[0].slice(0, 120), context: line.trim().slice(0, 200) });
        total++;
      }
    });
  }
}

if (total === 0) {
  console.log(`✓ identity-claim audit: ${files.length} files scanned, 0 matches.`);
  process.exit(0);
}

console.log(`identity-claim audit: ${total} matches across ${Object.keys(byFile).length} files.\n`);
for (const [f, hits] of Object.entries(byFile)) {
  console.log(`── ${f} (${hits.length} hits) ──`);
  for (const h of hits) {
    console.log(`  [${h.sev}] L${h.line}  ${h.label}`);
    console.log(`    → "${h.match}"`);
    console.log(`    ctx: ${h.context}`);
    console.log('');
  }
}
process.exit(1);
