# Wick Portability Procedure

Make a Wick-based agent fully portable between machines by folder copy. This is the
operational companion to `MEMORY-PROTOCOL.md`: the protocol states the single-writer
*rule*; this states the *migration* that gets an existing agent there. Hand this document
to the agent (or invoke the `wick-migrate` skill) and let it execute, gate by gate.

**Prerequisites**
- **Back up the entire project folder before starting.**
- This spans **at least two sessions.** Step 1 disables auto-memory; verifying it took
  effect requires a *fresh* session — you cannot confirm auto-memory is off from inside a
  session that already loaded it. Do the consolidation (Steps 2+) in that confirmed-off
  session, so the source layer is frozen before you migrate from it.
- The agent runs from the project directory it's consolidating.
- **Approval gates** at Steps 1 (disable), 3 (sort), 4 (audit), 8 (deletions). Don't pass a
  gate without explicit user sign-off.

## What you're doing and why

Consolidating memory into a single, portable layer. Two systems usually coexist:

1. **The Wick `memory/` folder** — structured, indexed, governed by `CLAUDE.md`. Loaded on
   demand per the memory protocol.
2. **Host auto-memory** (e.g. Claude Code's, at `~/.claude/projects/<path-encoded-folder>/memory/`).
   Its `MEMORY.md` index is auto-loaded at session start; often the *only* memory loaded
   automatically.

Host auto-memory is not portable (the folder name encodes the absolute path), is not
governed by your memory discipline, and may hold corrections the Wick layer lacks — or that
*contradict* it. This procedure merges everything into the Wick layer, disables the shadow
portably, and relativizes all paths including tooling.

**The key risk:** auto-memory is *live* — read and written every session. If you migrate
from it while it's active, or only *believe* you disabled it without confirming, the layers
diverge again, this time invisibly, because you'll treat the consolidated layer as
authoritative. (On a real run, auto-memory wrote a new file *after* the initial inventory —
caught only because the archive was taken from the live folder, not the stale inventory.)
So freeze and verify the source first.

## Step 1 — Freeze the source: disable auto-memory and verify

Check for a per-project auto-memory dir at `~/.claude/projects/<project>/memory/`. The
`<project>` segment derives from the **git repository root** (so all worktrees and
subdirectories of one repo share a single auto-memory dir), or the project root when it's not
a git repo. The segment is a path-derived encoded name, but the exact scheme is an
implementation detail (not in the docs) — rather than compute it, **list `~/.claude/projects/`
and match your project.** No `memory/` subfolder → nothing to consolidate; skip to **Step 4**.

If it exists, disable it via the project's own `.claude/settings.json` (project-tier,
portable — travels with the folder):

```json
{ "autoMemoryEnabled": false }
```

- `autoMemoryEnabled` defaults to `true`; `false` stops reads/writes (it does not delete the
  folder — inventory still works). Also togglable via `/memory` or
  `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. **Verify the key name against current docs first** —
  config keys drift between versions.
- A project may also have `.claude/settings.local.json`, which overrides shared
  `settings.json`. Check it doesn't re-enable auto-memory.
- On a new machine the setting applies only **after the workspace-trust dialog is accepted**
  (already-trusted folders get no new prompt — expected, not a failure).

**Then verify empirically — the load-bearing check.** Writing the key ≠ the feature being
off. Start a **fresh session** and confirm no auto-memory `MEMORY.md` loaded. Do the rest in
that confirmed-off session. "The file says false" is not verification; "a fresh session
loaded nothing" is.

## Step 2 — Inventory both layers

Read every file in `memory/` and in the frozen auto-memory folder (start with its
`MEMORY.md`). For each: filename, type, one-line summary, current vs superseded, and whether
it duplicates the other layer.

- Watch for **convention bleed**: auto-memory-style per-event files (`feedback_X.md`,
  `project_Y.md`) already written into the Wick folder. Prime consolidation targets.
- **Check what's already in `CLAUDE.md`.** On some agents most "feedback" has already been
  promoted into `CLAUDE.md`; on others not. This determines whether feedback files are Keep
  or Discard — don't assume; check.

Present the inventory before proceeding.

## Step 3 — Sort auto-memory files: Keep / Merge / Discard / Conflict

- **Keep** — durable, actionable, not already in `CLAUDE.md` or Wick memory → write into `memory/`.
- **Merge** — overlaps an existing file but has unique details → fold in only the new parts.
- **Discard** — ephemeral (session recaps, stale snapshots), belongs in project docs, or
  already present. Discarded content is preserved in the Step-7 archive, so discarding is
  "don't promote to active memory," not deletion.
- **Conflict** — contradicts `CLAUDE.md` or another file (e.g. a feedback entry that loosens
  a rule the docs enforce). **Do not auto-resolve.** Surface each with both versions and a
  recommendation; let the user decide. The consolidating agent is also the entity whose past
  writes created the conflicts — it is not a neutral arbiter. Conflicts are the highest-value
  thing this pass finds.

Present the sort (including conflicts) for approval before writing.

## Step 4 — Audit the Wick memory

Flag: empty scaffolding (keep as stubs), redundant files, overlap clusters, and bloat (one
topic scattered across many files, or files that outgrew their topic).

**Do not flag by modification date.** A knowledge base is not code: a foundational file
untouched for months is stable, not stale. Judge staleness by whether the *content* is still
true (a shipped "in progress" project, a superseded parameter table) — never by mtime, which
would flag the most valuable durable content. Present findings.

## Step 5 — Consolidate feedback into topic files

If there are >5–6 feedback files **that aren't already in `CLAUDE.md`**, group them into a
few topic files under `memory/feedback/` (e.g. `method.md`, `code.md`, `workflow.md`): rule
in bold, then why, then how to apply; strip auto-memory YAML frontmatter; preserve
tables/schemas/exact values; under 200 lines each. **Skip entirely if the feedback already
lives in `CLAUDE.md`** — a `feedback/` folder that duplicates `CLAUDE.md` is worse than none.

## Step 6 — Write kept and merged content

Kept → `memory/` (or a subfolder). Merged → read the target first, add only what's new.
Relocate project-specific detail to `projects/<name>/` and keep a status line + pointer in
memory. Date entries; append, don't overwrite.

## Step 7 — Archive raw auto-memory into the project

The source is frozen (Step 1), so this snapshot is stable. Copy the auto-memory `memory/`
subfolder into the project as `memory/_archived-auto-memory/` — **only the `memory/`
subfolder, not the `*.jsonl` session transcripts beside it.** This is the reversibility net
and the sole record of "Discard" items. Add a `README.md` marking the folder **INERT — do
not load**, dated, naming what was archived and where each file went. Ensure `CLAUDE.md`
(Step 11) excludes `_archived-auto-memory/` from session-start loading — the `_` prefix
helps, but an explicit exclusion is more reliable.

## Step 8 — Prune redundancies in Wick memory

Re-evaluate now that Steps 5–6 added content. Propose deletions for approval, then delete:
fully redundant files, one-time stale snapshots, category subsets a master file now covers.
Do not delete without explicit approval; the user should have the Prerequisites backup.

**Append-only logs are immutable.** Never rewrite history in a session log — not even to
relativize a path. Leave past entries as written; fix the discipline going forward.

## Step 9 — Fix dangling references

Search `memory/`, `CLAUDE.md`, and the wider project (tooling) for references to files that
were deleted, moved, or consolidated: load instructions, cross-references, scripts that load
memory by name. Update or remove every one (a warning on a missing file is tolerable; a crash
is not).

## Step 10 — Rewrite the index

Update `memory/index.md` to match disk: organized by section, **relative paths only**,
one-line descriptions, under 100 lines. **Strip "current state / counts as of <date>"
blocks** — they go stale immediately; point to the live files for status. Confirm no orphans
and nothing listed-but-missing; exclude archive folders.

## Step 11 — Update the CLAUDE.md memory protocol

Add a Memory Protocol section:
- **Session-start loading** — which files load always vs on demand, by mode/lane if
  applicable. Deterministic, not "hope auto-recall surfaces it." Since `CLAUDE.md` is always
  loaded, an explicit "read `index.md` first" is *more* reliable than auto-recall — which is
  what makes disabling safe.
- **Feedback capture** — where a new correction goes; update existing entries, don't spawn files.
- **Write discipline** — read before writing; one file per topic not per event; add an index
  row on new files; prune superseded entries; project detail → `projects/<name>/`; specs and
  session recaps are not memory; relative paths only.
- **Portability note** — auto-memory disabled via in-folder `.claude/settings.json`; name
  `memory/` the single source of truth; how to re-disable if it ever turns back on.

## Step 12 — Make all paths relative — to the *launch directory*, and pin the frame

First, **pin the frame**: identify the exact directory the agent launches from (where its
`CLAUDE.md` lives and where you start the tool), and relativize to *that*. "The project root"
is ambiguous for a nested agent. **State the launch directory explicitly in `CLAUDE.md`**
("You run from `…/agent/`; all paths here are relative to it") so the frame is declared, not
inferred.

Then sweep every live `memory/` file and `CLAUDE.md` for absolute paths (`C:/Users/...`,
`/home/...`, `/Users/...`) and rewrite them relative to the launch directory. Two failure
modes — both *"relative ✓ but resolves ✗"*, so a check that only asks "is it relative?"
misses them:
- **Nested agent → path doubling.** An agent launching from `…/agent/` with a reference
  `agent/file.md` resolves to `…/agent/agent/file.md`. The agent's own folder name must not
  appear as a prefix; sibling references go up (`../sibling/…`).
- **Standalone agent → missing prefix.** An agent launching from the project root with a
  cross-reference `decisions.md` looks for `./decisions.md`, but the file is at
  `memory/decisions.md`. Loader/index references must be launch-CWD-relative
  (`memory/decisions.md`).

Self-check: **if the first segment of a relative path repeats your current directory's name —
or omits the subfolder (`memory/`) the target lives in — it won't resolve.** Don't prepend
your own folder name; don't drop the folder you're not in.

**Don't launch one agent from two different directories.** That ambiguity *is* the bug.

Exceptions (leave as-is): immutable log history (Step 8); intentional anti-pattern examples
inside a "never write `C:/...`" rule; directory-tree diagrams; security-boundary phrasing
(prefer "within its own root directory" over a hard-coded absolute). `tools/wick-path-audit.mjs`
automates the sweep and is CI-gated.

## Step 13 — Tooling and code portability

Memory portability doesn't make *tooling* portable. Sweep scripts and config:
- **Scripts:** replace hard-coded paths with self-location (`Path(__file__).resolve().parent`
  / `.parents[N]`) and/or an env-var override (`os.environ.get("X") or <default>`).
- **`.mcp.json`:** Claude Code expands `${VAR}` / `${VAR:-default}` and sets
  `${CLAUDE_PROJECT_DIR}`. Use `["${CLAUDE_PROJECT_DIR:-.}/scripts/server.py"]` for args. The
  interpreter (`command`) is machine-specific — keep the working absolute as an overridable
  default: `"${PYTHON:-<current absolute>}"`. Bare `python` on PATH isn't reliable.
- **Credentials:** secrets in plaintext config travel with every copy. Move to env vars or an
  untracked secrets file; document per-machine setup. (`tools/wick-scrub.mjs` catches these.)
- **Hooks** (`settings.json`/`settings.local.json`): a hook runs in the **current working
  directory at the moment it fires — not guaranteed to be the project root** (the cwd is passed
  to the hook in its JSON input). Don't assume `find .` starts at the root; reference the root
  explicitly with `${CLAUDE_PROJECT_DIR}`. Editing `settings.local.json` may require explicit
  user authorization.
- **Multi-agent dependency:** if one agent's tooling imports a sibling's, the portability
  unit is the *set of siblings together*. State this in the agent's notes.

## Step 14 — Verify behavior, not form

Every step that changed a setting or a reference is checked from the real runtime context,
not by inspecting text. "It's relative" and "the setting says false" are not verifications —
they're the two ways this procedure silently fails.

- [ ] **A fresh session loads no auto-memory** (re-confirm the Step-1 check now settings are final)
- [ ] **References resolve from the launch CWD** — actually open/test-resolve a sample of
  load-bearing paths (every `index.md` entry, every path in `CLAUDE.md`'s load protocol,
  memory-to-memory cross-references) *from the directory the agent launches in*
- [ ] Every live `memory/` file uses relative paths (immutable log history excepted)
- [ ] `CLAUDE.md` uses relative paths (intentional examples excepted)
- [ ] `memory/index.md` matches files on disk; archive folders excluded
- [ ] `CLAUDE.md` specifies deterministic session-start loading and excludes `_archived-auto-memory/`
- [ ] Auto-memory disabled in the **in-folder** project settings (and per sub-agent)
- [ ] No content lost — kept/merged present; discarded/pruned items in the in-folder archive
- [ ] No dangling references; tooling self-locates; no plaintext secrets
- [ ] No conflicts silently resolved (all surfaced to the user)

## After completion

Portability unit = the folder (or the sibling set, if agents share tooling). To transfer:
1. Copy the folder(s), preserving sibling layout if tooling crosses between them.
2. Open in the tool; **accept the workspace-trust dialog** — project-tier settings apply only
   after trust. The one manual step for memory.
3. Set any per-machine env vars the tooling needs (interpreter path, secrets).
4. Confirm the first session loads no auto-memory. The agent then has full memory from session 1.

## Machine-awareness layer

*Steps 1–14 make the folder **machine-agnostic** — no hardcoded machine paths (Step 12),
tooling by name not absolute path (Step 13). This layer is the complement: the agent
**recognizes which machine it's on** and either loads that machine's known setup or bootstraps
a new one. Without it, a portable agent still can't locate the local compiler/TeX, doesn't know
machine-specific quirks, and stalls on a fresh machine that lacks a required tool. Generic —
any agent, any machine, any OS; touches none of Steps 1–14.*

**Two artifacts.**

1. **`memory/toolchain.md`** — the external tools the agent's code/builds assume (compiler,
   LaTeX, language runtimes), the **portable invocation convention** (call by name on PATH + an
   env-var override — `gcc`/`$CC`, `pdflatex`, the launcher not an absolute interpreter; Step 13
   restated as a standing rule), and per-machine status. Binaries are system-level and
   deliberately **not bundled** (a TeX distro is gigabytes; compilers are OS-specific) — the doc
   says what to assume by name and how to install it.

2. **`memory/machines/<hostname>.md`** — one thin profile per regularly-used machine, **keyed by
   hostname** (`$env:COMPUTERNAME` on Windows; `hostname`/`$HOSTNAME` on *nix). Each profile:
   **identity** (hostname / user / OS+build), **hardware** (cores·threads, RAM, GPU, disk), a
   **toolchain map** (where each required tool is or that it's on PATH, + version), **operational
   quirks** (the things that actually break automation — auth-token scopes, admin rights,
   cloud-sync folders, power/sleep behavior — not just compilers), pointers to machine-local
   resources, and a **last-verified date**. A `machines/README.md` holds the detection/bootstrap
   protocol and a known-machines table. Keep profiles thin — specs + pointers + toolchain map,
   never project state.

**Session-start detection (one env read).** Read the hostname. **Known** (`<hostname>` profile
exists) → note the machine; load its toolchain map/quirks **on demand** when build/sim/
external-path work arises — don't assume the last machine's setup. **New** (no profile) → say so
and bootstrap. The profile body is *triggered, not eagerly loaded* — same tiering as the memory
layer, so the always-on cost stays one env read. Wire it into `CLAUDE.md` as a session-start
step, peer to the memory-load step.

**New-machine bootstrap.**
1. **Fingerprint:** hostname, user, OS+build, CPU cores·threads, RAM, GPU, free disk. Probe for
   real — some OS APIs misreport (e.g. Windows `Win32_VideoController` undercounts GPU VRAM).
2. **Discover toolchains** against `toolchain.md`: each required tool on PATH? version? path? For
   a runtime, also confirm the required **libraries import** — don't just check the interpreter
   resolves. On Windows PowerShell, check `$LASTEXITCODE` not `$?`, and don't `2>&1` a native
   exe's stderr.
3. **Missing essentials → propose, then install on one approval** (a gate — never install
   unattended). Show exactly what and **from where; verify the source/checksum** (you're
   executing an installer), and prefer a **portable single-folder** install (e.g. w64devkit is a
   one-folder GCC you can carry on the agent's own drive). After install, **verify with a minimal
   compile/run, not "the file exists."**
4. **Write the profile** `memory/machines/<hostname>.md` (copy an existing one as the template)
   and add a row to the registry table. Hostname is the key; the **fingerprint is the tiebreaker**
   — auto-names (`DESKTOP-V9G4N49`) and CI/container hostnames aren't unique or stable, so
   OS+user+hardware disambiguates a collision or rename.
5. **Report** found / installed / recorded — and note that an already-running session won't see a
   newly-added PATH entry (new sessions do).

This generalizes the goal from *"the folder is portable"* to *"the agent recognizes the machine
and makes itself fully functional on it."* Credit: contributed by the **Laplace** agent
(2026-06), validated end-to-end across a two-machine case (one fully-provisioned host; one fresh
host where a missing compiler was detected, installed on approval, and verified by a real compile
+ link + run).

## Multi-agent projects

- **Auto-memory is keyed by project root, and project-tier `settings.json` only applies at a
  project root.** A `.claude/settings.json` in a mere *subfolder* is **not** independently
  read. So: if the agent's folder is opened as its own root, a `settings.json` there works;
  if it's only ever a subfolder, disable via the user tier (`~/.claude/settings.json`, not
  portable) or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, documented as per-machine setup. Either
  way, **verify per agent with a fresh session.**
- **Each agent consolidates independently.** Run this once per agent; don't mix one agent's
  auto-memory into another's.
- **Cross-agent references** use `../sibling/` form; survives a move only if sibling layout is
  preserved — document the assumption.
- **Shared memory** lives in one canonical location, referenced via relative path; don't
  duplicate into both agents.
