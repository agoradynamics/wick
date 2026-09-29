#!/usr/bin/env node
// ─── wick-ask — ask your memory a question, get an answer FROM it ───────────
// wick-recall names the files that answer a question for zero model tokens. wick-ask goes one step further: it reads
// them and answers, from what the memory actually says, or says plainly that the memory doesn't hold it.
//
// PIPELINE (each step is the measured one - see MEMORY-PROTOCOL.md, "Answering from memory"):
//   1. wick-recall's router picks the top-2 memory files
//   2. their bodies are cut into paragraph chunks (<= 600 chars; stamps and bare headings dropped)
//   3. the 3 chunks with the highest BM25 against the question become the sources, kept in file order
//   4. a LOCAL model (ollama; default qwen2.5:7b) answers from those sources under a grounding prompt
// Everything stays on your machine: no API key, no spend, no data leaves the box.
//
// MEASURED (2026-09-29, this tool end to end, on a real 57-file memory layer; 48 questions verified against it, half
// answerable from the files, half on-topic but NOT answerable): 17 of 24 answerable questions answered correctly,
// 24 of 24 unanswerable ones refused, with qwen2.5:7b. Why a local 7B and not a smaller model: with the same
// retrieval, a RAFT-trained 0.6B refused just as well but answered only 10 of 24 - small models reproduce a matching
// source instead of extracting the fact from it, and a memory paragraph holds many facts.
//
// Zero dependencies. Node >= 18. Needs ollama running with the model pulled (`ollama pull qwen2.5:7b`).
//   node tools/wick-ask.mjs "what did we decide about pricing?"
//   node tools/wick-ask.mjs --sources "..."        also print the three chunks it read, and their files
//   node tools/wick-ask.mjs --dry "..."            retrieval only - no model call
//   node tools/wick-ask.mjs --json "..."           one JSON object: {answer, refused, files, sources}
//   node tools/wick-ask.mjs --model llama3.1:8b "..."     any ollama model (the measurement above is qwen2.5:7b)
// WICK_MEMORY=<dir> points it at another memory layer; OLLAMA_HOST overrides http://127.0.0.1:11434.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { load, rank, tok, MEM } from './wick-recall.mjs';

const CHUNK = 600;
const SYSTEM = 'You answer questions from the sources you are given, briefly and honestly.';
const HEAD = 'Use the sources below to answer. If they do not contain the answer, say so.\n\n';
const REFUSAL = /(do(es)? not (contain|provide|mention|include|specify)|not (mentioned|provided|specified)|no (information|mention)|cannot (answer|determine)|can't (answer|determine))/i;

// Lengths and cuts count CODE POINTS, not UTF-16 units, so a memory file with astral characters (some emoji) is cut
// exactly where the measured Python pipeline cut it (the port first counted units and split one block differently).
const cpLen = (s) => [...s].length;

export function chunks(text) {
  // CRLF -> LF first. On Windows with core.autocrlf a memory file arrives with CRLF, every "\r" counts toward the
  // 600-character cut, and a block can split where it would not on Linux (found while measuring this tool). Python's
  // text mode does this silently; Node's readFileSync does not.
  text = text.replace(/\r\n?/g, '\n');
  const out = [];
  for (let blk of text.split(/\n\s*\n/)) {
    blk = blk.trim();
    if (!blk || /^(#+ .*|\*Updated:.*\*)$/.test(blk)) continue;
    const parts = cpLen(blk) > CHUNK ? blk.split(/\n(?=- |\* |\d+\. )/) : [blk];
    for (let p of parts) {
      p = p.split(/\s+/).join(' ').trim();
      while (cpLen(p) > CHUNK) {
        const cps = [...p];
        const win = cps.slice(0, CHUNK).join('');
        const at = win.lastIndexOf('. ');                       // a full ". " inside the first CHUNK code points
        let cut = at === -1 ? -1 : cpLen(win.slice(0, at));
        cut = cut > CHUNK / 2 ? cut + 1 : CHUNK;
        out.push(cps.slice(0, cut).join('').trim());
        p = cps.slice(cut).join('').trim();
      }
      if (cpLen(p) >= 40) out.push(p);
    }
  }
  return out;
}

export function bm25Top(query, cands, k = 3, k1 = 1.5, b = 0.75) {
  const toks = cands.map(c => tok(c));
  const N = cands.length, df = new Map();
  for (const t of toks) for (const w of new Set(t)) df.set(w, (df.get(w) || 0) + 1);
  const avg = toks.reduce((s, t) => s + t.length, 0) / Math.max(1, N);
  const q = tok(query);
  const sc = toks.map((t, i) => {
    const tf = new Map();
    for (const w of t) tf.set(w, (tf.get(w) || 0) + 1);
    let s = 0;
    for (const w of q) {
      const f = tf.get(w);
      if (f) s += Math.log(1 + (N - df.get(w) + 0.5) / (df.get(w) + 0.5)) * f * (k1 + 1) / (f + k1 * (1 - b + b * t.length / avg));
    }
    return { s, i };
  });
  sc.sort((a, c) => (c.s - a.s) || (a.i - c.i));
  return sc.slice(0, k).map(x => x.i).sort((a, c) => a - c).map(i => i);
}

export function retrieve(question) {
  const files = rank(question, load(), 2).map(h => h.d.path);
  const cands = [], origin = [];
  for (const f of files) {
    for (const c of chunks(fs.readFileSync(path.join(MEM, f), 'utf8'))) { cands.push(c); origin.push(f); }
  }
  const idx = cands.length ? bm25Top(question, cands) : [];
  return { files, sources: idx.map(i => cands[i]), where: idx.map(i => origin[i]) };
}

async function answer(question, sources, model) {
  const body = [...sources];
  while (body.length < 3) body.push('(no further source)');
  const prompt = HEAD + 'Sources:\n' + body.map((s, i) => `[${i + 1}] ${s}`).join('\n\n') + '\n\nQuestion: ' + question;
  const host = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const res = await fetch(`${host}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: false, options: { temperature: 0, seed: 0, num_predict: 200 },
                           messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`ollama answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).message.content.trim();
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (f) => { const i = args.indexOf(f); if (i !== -1) { args.splice(i, 1); return true; } return false; };
  let model = 'qwen2.5:7b';
  const mi = args.indexOf('--model');
  if (mi !== -1) { model = args[mi + 1]; args.splice(mi, 2); }
  const dry = flag('--dry'), json = flag('--json'), showSources = flag('--sources');
  const question = args.join(' ').trim();
  if (!question) {
    console.log('usage: node tools/wick-ask.mjs [--sources] [--dry] [--json] [--model M] "<question>"');
    process.exit(1);
  }
  const r = retrieve(question);
  if (dry) {
    console.log(`files: ${r.files.join(', ') || '(no match)'}`);
    r.sources.forEach((s, i) => console.log(`\n[${r.where[i]}]\n${s}`));
    return;
  }
  let text;
  try {
    text = await answer(question, r.sources, model);
  } catch (e) {
    console.error(`wick-ask: the local model is not answering (${e.message}). Start ollama and pull ${model}, or use --dry.`);
    process.exit(1);
  }
  const refused = REFUSAL.test(text.slice(0, 200));
  if (json) { console.log(JSON.stringify({ answer: text, refused, files: r.files, sources: r.sources, where: r.where })); return; }
  console.log(text);
  if (refused) console.log(`\n(memory doesn't hold this - or not in the files the router picked: ${r.files.join(', ') || 'none'})`);
  if (showSources) r.sources.forEach((s, i) => console.log(`\n[${r.where[i]}]\n${s}`));
}

// Run as a CLI only when invoked directly; `import { retrieve } from './wick-ask.mjs'` runs nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
