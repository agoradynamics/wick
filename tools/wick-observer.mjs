#!/usr/bin/env node
// wick-observer.mjs — the observation-capture half of wick-automate.
// A Claude Code PostToolUse hook: reads the hook JSON on stdin and appends a compact record to
// memory/.observations.jsonl so `wick-automate` can mine repeated task sequences across
// sessions. No LLM, no network. Never blocks the tool (always exits 0).
//
// The log is runtime state — keep memory/.observations.jsonl gitignored.
//
// Hook config (.claude/settings.json):
//   { "hooks": { "PostToolUse": [ { "matcher": "Edit|Write|Bash",
//     "hooks": [ { "type": "command", "command": "node tools/wick-observer.mjs --post-tool-use" } ] } ] } }
//
// Env: WICK_OBSERVATIONS overrides the log path.

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));               // <repo>/tools
const LOG = process.env.WICK_OBSERVATIONS || resolve(HERE, '..', 'memory', '.observations.jsonl');

function main() {
  let raw = '';
  try { raw = readFileSync(0, 'utf8'); } catch { /* no stdin */ }
  let ev = {};
  try { ev = JSON.parse(raw); } catch { /* not JSON */ }

  const tool = ev.tool_name;
  if (!tool) return;                                               // nothing meaningful to log

  const ti = ev.tool_input || {};
  // A compact "target" — the file/command/pattern that identifies what the tool acted on.
  let target = ti.file_path || ti.path || ti.command || ti.pattern || ti.notebook_path || '';
  if (typeof target !== 'string') target = JSON.stringify(target);

  const rec = {
    ts: new Date().toISOString(),
    session: ev.session_id || null,
    tool,
    target: target.slice(0, 200),
  };

  try {
    mkdirSync(dirname(LOG), { recursive: true });
    appendFileSync(LOG, JSON.stringify(rec) + '\n');
  } catch { /* logging must never break the tool */ }
}

try { main(); } catch { /* swallow everything */ }
process.exit(0);
