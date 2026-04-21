---
name: wick-consolidate-memory
description: Reflective pass over memory/ files — flag duplicates, stale facts, conflicts, and consolidation candidates. Proposes edits, never applies without confirmation. Use monthly or when /audit flags drift.
license: MIT
---

# Wick — Consolidate Memory

A Wick-flavored memory audit. Memory files are a garden, not a filing cabinet — they need periodic tending or they drift.

## When to invoke

- Monthly, or when `/audit` flags accumulating drift
- Before a major voice/behavior tuning pass
- When a memory file has grown past ~3KB
- When you notice conflicting entries

## What Wick does

1. Read all `memory/*.md` files
2. For each file, identify:
   - **Duplicates** — same content restated under different headings or dates
   - **Stale facts** — superseded by newer entries
   - **Conflicts** — entries that directly contradict each other
   - **Consolidation candidates** — related scattered entries that should merge
   - **Size/shape issues** — oversized files, suspiciously empty files
3. Produce a proposed edit plan, organized per file
4. **Never execute edits without explicit per-item user confirmation**
5. For approved edits, apply with a date-stamped consolidation note

## Output format

```
## memory/[file].md

- **Duplicate** — entries A (line X) and B (line Y) cover the same fact. Propose: merge preserving date range.
- **Stale** — entry C (line Z) superseded by entry D. Propose: remove C.
- **Conflict** — entry E vs F contradict on [point]. User, please reconcile.
- **Consolidate** — G, H, I are variations on one theme. Propose: single merged entry.

Confirm? [y/n per item]
```

## Framework grounding

Discipline-as-habit — memory hygiene is not a one-shot cleanup but a recurring practice. Hierarchy of knowing — belief must be periodically re-examined or it calcifies into unexamined assumption. Finitude — outdated memory is a liability; time prunes what discipline doesn't.
