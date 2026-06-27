---
description: Memory-wiring diagnostic — detect a host auto-memory shadow layer, fact-class overlap, and absolute paths
---

Run a **wiring** check on Wick's memory setup. This is not `/audit` (which checks the
*contents* of `memory/` for staleness and contradictions) and not `/status` (which counts
files and predictions). `/checkup` checks the **environment around** `memory/` — whether a
second memory system is in play and whether anything is silently non-portable. See
`MEMORY-PROTOCOL.md` for the model.

Walk these four checks and report a posture, not just findings:

1. **Host auto-memory layer present?**
   - Claude Code keeps its own memory at `~/.claude/projects/<path-encoded-folder>/memory/`
     (the folder name is the absolute project path with separators replaced by `-`). Check
     whether that directory exists and has content for this project.
   - Note other host stores if the runtime has one (Cursor memory, IDE project memory).
   - If none exists, say so — a clean single-store install is the simplest healthy state.

2. **Fact-class overlap.** If a host layer exists, read it and classify each entry by the
   ownership table in `MEMORY-PROTOCOL.md` §2:
   - **Runtime facts** (which machine, OS, tool wiring) → the host layer may own these. Fine.
   - **Anything Wick owns** (identity, feedback/corrections, decisions, domain knowledge,
     predictions, about-you) living *only* in the host layer → flag it. That's a correction
     or fact that won't travel and isn't governed.

3. **Absolute paths.** Run `node tools/wick-path-audit.mjs memory/` (and the loaded config
   files). Any hit is a portability landmine — it works until the folder moves. Report
   file:line for each.

4. **Posture verdict.** Conclude with exactly one of:
   - **OK / partitioned** — host layer holds only runtime facts (or doesn't exist); paths
     are relative. Nothing to do.
   - **Shadow / suppress** — host layer is duplicating fact-classes Wick owns *and*
     canonical `memory/` is live. Recommend `/sync` then disabling host auto-memory
     (Claude Code: `{"autoMemoryEnabled": false}` in project settings).
   - **Buffer / drain** — canonical `memory/` is temporarily unreachable or frozen, so the
     host layer is the only live writer. Recommend keeping it on and `/sync`-ing when
     canonical returns. Confirm `memory/.buffer-manifest.md` is tracking what accrues.

**Do NOT change any settings or files.** `/checkup` only reports and recommends. The user
decides; `/sync` does the moving. A diagnostic that edits is a diagnostic you stop trusting.
