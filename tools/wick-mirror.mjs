#!/usr/bin/env node
// ─── wick-mirror — WICK.md is CLAUDE.md, byte for byte ────────────────────────────────────────────────
// CLAUDE.md is the file a full install loads. WICK.md is the same text for people who already have a CLAUDE.md of
// their own and import Wick into it. They were kept in step by hand, and by v1.9.0 they had drifted: one rule added
// to CLAUDE.md in v1.7.0 never reached WICK.md. A mirror kept by hand is a mirror that drifts, so this writes it and
// checks it.
//
// Zero dependencies. Node >= 18.
//   node tools/wick-mirror.mjs --check     exit 0 when WICK.md equals CLAUDE.md, 1 when it does not, 2 when unreadable
//   node tools/wick-mirror.mjs --write     copy CLAUDE.md over WICK.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const known = new Set(['--check', '--write', '--help', '-h']);
const bad = args.find((a) => !known.has(a));
if (bad) { console.error(`wick-mirror: unknown flag ${bad}`); process.exit(2); }
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log('wick-mirror: keep WICK.md identical to CLAUDE.md\n  --check   exit 1 if they differ\n  --write   copy CLAUDE.md over WICK.md');
  process.exit(0);
}
const src = path.join(ROOT, 'CLAUDE.md'), dst = path.join(ROOT, 'WICK.md');
let a;
try { a = fs.readFileSync(src); } catch { console.error('wick-mirror: cannot read CLAUDE.md'); process.exit(2); }
if (args.includes('--write')) {
  fs.writeFileSync(dst, a);
  console.log(`✓ wick-mirror: WICK.md written from CLAUDE.md (${a.length} bytes).`);
  process.exit(0);
}
let b;
try { b = fs.readFileSync(dst); } catch { console.error('wick-mirror: cannot read WICK.md'); process.exit(2); }
if (a.equals(b)) { console.log(`✓ wick-mirror: WICK.md equals CLAUDE.md (${a.length} bytes).`); process.exit(0); }
const la = a.toString('utf8').split('\n'), lb = b.toString('utf8').split('\n');
let i = 0; while (i < la.length && i < lb.length && la[i] === lb[i]) i++;
console.error(`✗ wick-mirror: WICK.md differs from CLAUDE.md, first at line ${i + 1}. Run: node tools/wick-mirror.mjs --write`);
process.exit(1);
