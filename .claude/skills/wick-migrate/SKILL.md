---
name: wick-migrate
description: Make a Wick agent fully portable between machines — consolidate a host's auto-memory into the Wick memory/ layer, disable the shadow portably, and relativize all paths and tooling. Guided, gated, archive-don't-delete. Use when moving an agent to a new machine, or to converge a single-machine agent onto one governed memory layer. Full reference in PORTABILITY.md.
license: MIT
---

# Wick — Migrate (portability)

Consolidate everything into one portable, git-mergeable memory layer and disable the
machine-keyed shadow. This skill is the executable form of `PORTABILITY.md` — read that for
the full rationale and the failure modes; this is the operating checklist with the gates.

## When to invoke

- Moving a Wick agent to a second machine (the `memory/` folder must travel whole)
- A host keeps its own auto-memory (Claude Code, Cursor) and you want one governed layer
- Convergence: corrections or facts live only in the host layer and you want them in `memory/`

## The load-bearing facts

- **Freeze before you migrate.** Auto-memory is live. Disable it (Step 1) and **verify in a
  fresh session** before consolidating — else the source mutates under you and the layers
  diverge invisibly. This makes it a **two-session** job, not one.
- **Verify behavior, not form.** "The setting says false" and "the path is relative" are the
  two ways this silently fails. Confirm by a fresh session and by resolving paths from the
  launch CWD.
- **Archive, don't delete.** Discards and prunes go to `memory/_archived-auto-memory/` (the
  reversibility net), never to nothing.

## Procedure (gates marked 🚦 — get explicit sign-off)

1. 🚦 **Freeze.** Find `~/.claude/projects/<path-encoded-folder>/memory/`. If present, write
   `{ "autoMemoryEnabled": false }` to the project's in-folder `.claude/settings.json`
   (verify the key against current docs; check `settings.local.json` doesn't re-enable).
   **Then start a fresh session and confirm no auto-memory loaded.** Do the rest there.
2. **Inventory** both layers (Wick `memory/` + frozen auto-memory). Note duplicates,
   convention-bleed (`feedback_X.md`), and what's already in `CLAUDE.md`. Present it.
3. 🚦 **Sort** auto-memory: Keep / Merge / Discard / **Conflict**. Never auto-resolve a
   conflict — surface both versions, recommend, let the user decide. Present the sort.
4. 🚦 **Audit** Wick memory: redundancy, overlap, bloat. **Never flag by mtime** — judge by
   whether content is still true. Present findings.
5. **Consolidate feedback** into `memory/feedback/*.md` topic files — *only if* it isn't
   already in `CLAUDE.md`. Strip YAML frontmatter; keep tables/values; <200 lines each.
6. **Write** kept/merged content (read target first; append, dated). Project detail →
   `projects/<name>/` with a status line + pointer.
7. **Archive** the raw auto-memory `memory/` subfolder → `memory/_archived-auto-memory/` with
   an INERT README. Not the `*.jsonl` transcripts.
8. 🚦 **Prune** now-redundant Wick files (approval required). Immutable logs stay as written.
9. **Fix dangling references** in `memory/`, `CLAUDE.md`, and tooling.
10. **Rewrite `memory/index.md`** — relative paths, <100 lines, no "as of <date>" blocks,
    archives excluded.
11. **Update `CLAUDE.md`** memory protocol — deterministic session-start loading, feedback
    capture, write discipline, portability note (`memory/` is the single source of truth).
12. **Relativize to the launch directory** — pin the frame in `CLAUDE.md`; run
    `node tools/wick-path-audit.mjs`. Watch the two "relative-but-resolves-wrong" traps
    (own-folder-name doubling; missing `memory/` prefix).
13. **Tooling sweep** — scripts self-locate; `.mcp.json` uses `${CLAUDE_PROJECT_DIR}`; no
    plaintext secrets (`node tools/wick-scrub.mjs`); hooks use relative cwd.
14. **Verify behavior** — fresh session loads nothing; sample paths resolve from launch CWD;
    all four scanners green; nothing lost; no conflict silently resolved. Report.

## What this skill will never do

- Pass a 🚦 gate without explicit user sign-off.
- Delete the only copy of anything (archive first).
- Auto-resolve a conflict between the host layer and `CLAUDE.md`.
- Claim "disabled" or "portable" from text inspection — only from a fresh session and real
  path resolution.
