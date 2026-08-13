#!/usr/bin/env node
// ─── wick-recall — zero-token memory routing ────────────────────────────────
// Point a question at the memory layer and get back the 1-2 files that answer it,
// for ZERO model tokens and ~1ms. BM25 over a compiled retrieval surface (each file's
// index row + its headers + bold lead-ins + technical terms).
//
// WHY: MEMORY-PROTOCOL.md makes memory *findable by discipline* (one topic per file,
// one writer per fact-class). This makes it findable *for free*. Reading the whole
// memory layer to answer one question is the context bulge; routing is the fix.
//
// WHEN IT PAYS (measured 2026-07-31, see MEMORY-PROTOCOL.md §9):
//   - index-first beats load-everything from ~3 files onward (an index row is ~38 tok,
//     a mean memory file ~1,600)
//   - the ABSOLUTE saving only becomes material as memory grows:
//     11 files ≈ 4.7k -> 1.3k tok  ·  24 files ≈ 38.6k -> 3.2k tok
//   - routing recall DEGRADES with corpus size (100% @5 files, 94% @11, 83% @24) —
//     so as memory grows, the index rows must get sharper, not just longer.
//
// Zero dependencies. Node >= 18.
//   node tools/wick-recall.mjs "how do I handle a flaky prediction?"
//   node tools/wick-recall.mjs -k 3 "what did we decide about pricing?"

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MEM = path.resolve(HERE, '..', 'memory');

const STOP = new Set(('the a an and or of to in for on is are was were be with as at by from this ' +
  'that it its not but we you our your they their has have had will would can could should how do ' +
  'i what when where which who why my me').split(' '));

const tok = (s) => (s || '').toLowerCase().match(/[a-z0-9][a-z0-9\-_]+/g)?.filter(w => !STOP.has(w) && w.length > 2) ?? [];

function entities(txt) {
  const out = [];
  for (const re of [/`([^`\n]{2,40})`/g, /\b([A-Z]{2,}(?:[-_][A-Z0-9]+)*)\b/g,
                    /\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g, /\b(\w+\.(?:mjs|js|md|json|sh|py))\b/g,
                    /\b([a-z]+(?:-[a-z]+){1,3})\b/g]) {
    for (const m of txt.matchAll(re)) out.push(m[1]);
  }
  return out;
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function load() {
  // DO NOT return [] here. An empty corpus and an unreadable one are different facts, and this
  // function's caller cannot tell them apart once both become "(no match)". That is the same
  // defect that shows up in retrieval-grounded models: asserting an absence you have not
  // established. Grounded honesty has to apply to our own I/O or it is a slogan.
  if (!fs.existsSync(MEM)) {
    console.error(`wick-recall: cannot read ${MEM} — memory is UNREACHABLE, not empty.`);
    console.error('  Refusing to report "(no match)": that would claim the memory contains nothing');
    console.error('  when what is true is that it could not be opened. Check the path and re-run.');
    process.exit(2);
  }
  const body = {};
  for (const p of walk(MEM)) body[path.relative(MEM, p).replace(/\\/g, '/')] = fs.readFileSync(p, 'utf8');

  // curated one-liners from memory/index.md — the highest-signal routing surface
  const desc = {};
  const idx = body['index.md'] || '';
  for (const m of idx.matchAll(/^\s*-\s*\[([^\]]+)\]\(([^)]+)\)\s*[—\-:]*\s*(.*)$/gm)) {
    let p = m[2].split('#')[0].replace('./', '').trim();
    if (!body[p]) p = Object.keys(body).find(k => k.endsWith(p.split('/').pop())) || p;
    if (body[p]) desc[p] = [m[1], m[3]];
  }

  const docs = [];
  for (const [rel, txt] of Object.entries(body)) {
    if (rel === 'index.md') continue;
    const [label, d] = desc[rel] || ['', ''];
    const heads = (txt.match(/^#{1,4}\s*(.+)$/gm) || []).slice(0, 25).join(' ');
    const bolds = [...txt.matchAll(/\*\*(.+?)\*\*/g)].slice(0, 25).map(m => m[1]).join(' ');
    const surface = [label, d, label, d, label, d,
                     rel.replace(/[/\-]/g, ' ').replace('.md', ''),
                     rel.replace(/[/\-]/g, ' ').replace('.md', ''),
                     heads, bolds, entities(txt).join(' ')].join(' ');
    docs.push({ path: rel, bytes: txt.length, desc: d, terms: tok(surface) });
  }
  return docs;
}

function rank(query, docs, k = 2, k1 = 1.5, b = 0.75) {
  const N = docs.length, df = new Map();
  for (const d of docs) {
    d.tf = new Map();
    for (const t of d.terms) d.tf.set(t, (d.tf.get(t) || 0) + 1);
    d.len = d.terms.length;
    for (const t of new Set(d.terms)) df.set(t, (df.get(t) || 0) + 1);
  }
  const avg = docs.reduce((s, d) => s + d.len, 0) / Math.max(1, N);
  const idf = new Map([...df].map(([t, n]) => [t, Math.log(1 + (N - n + 0.5) / (n + 0.5))]));
  const q = tok(query);
  return docs.map(d => {
    let s = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (f) s += (idf.get(t) || 0) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avg));
    }
    return { s, d };
  }).sort((a, b2) => b2.s - a.s).slice(0, k).filter(x => x.s > 0);
}

const args = process.argv.slice(2);
let k = 2;
const ki = args.indexOf('-k');
if (ki !== -1) { k = parseInt(args[ki + 1], 10); args.splice(ki, 2); }
const query = args.join(' ');
if (!query) {
  console.log('usage: node tools/wick-recall.mjs [-k N] "<what you are looking for>"');
  process.exit(1);
}
const docs = load();
if (!docs.length) { console.log('(no memory/*.md files found)'); process.exit(0); }
const hits = rank(query, docs, k);
if (!hits.length) { console.log('(no match — read memory/index.md directly)'); process.exit(0); }
for (const { s, d } of hits) {
  console.log(`  ${d.path.padEnd(38)} ${(d.bytes / 1024).toFixed(1).padStart(5)} KB  score ${s.toFixed(2).padStart(6)}  ${d.desc.slice(0, 60)}`);
}
