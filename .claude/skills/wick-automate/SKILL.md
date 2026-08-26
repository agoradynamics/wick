---
name: wick-automate
description: Detect when a task is being repeated often enough to be worth automating, then propose the right automation — a PROGRAM (deterministic script) or a SKILL (reusable judgment procedure). Analyzes the current session, the memory/ record, or an observation log; classifies program-vs-skill; estimates payoff; drafts the automation. Proposes, never auto-builds. Use when you catch yourself or the user repeating a multi-step task, or to mine an observation log periodically.
license: MIT
---

# Wick — Automate (spot the repetition, propose the automation)

*Updated: 2026-07-02 · first written 2026-07-02*

The efficiency reflex: notice when work is being *repeated* and turn the repetition into an
automation — so the third time you do a thing is the last time you do it by hand.

Complements `/evolve` (which graduates logged *instincts* into skills). This works one level
earlier and broader: it detects **task repetition in the work stream** and proposes a
**program** (for mechanical repetition) or a **skill** (for repeated judgment). The
program-vs-skill call is the whole point.

## When to invoke
- You (or the user) just did the same multi-step task a 3rd time.
- Periodically, to mine `memory/.observations.jsonl` (if the observer hook is installed) for
  frequent command/tool sequences.
- The user says "automate this" / "I keep doing X."

## Step 1 — Detect the repetition
Three kinds (structural is the most valuable):
- **Literal** — the same command/sequence run N times (N≥3). Often just wants an alias.
- **Structural** — the same *shape* of task with different inputs: "ship a version" done for
  1.1 / 1.2 / 1.3; "onboard a client" done 4×. The variable parts (version, name) become
  **parameters.** This is the high-value target.
- **Frictional** — a task that's slow, error-prone, or many-step each time: high per-instance
  cost even at low frequency.

Sources, in order: the current session's tool-call history → `memory/` (decisions,
learning-journal, sessions) → `memory/.observations.jsonl` (if present) → the user pointing at it.

## Step 2 — Decide IF it's worth automating (don't automate reflexively)
Automate only when **payoff > cost AND the task is stable.**
- **Payoff** ≈ (frequency × per-instance friction) over a realistic horizon.
- **Cost** = building it + maintaining it + the risk of ossifying a workflow that's still changing.
- **Stability gate (load-bearing):** if the task is still being figured out — steps changing
  run to run — **wait.** Premature automation freezes a moving target; that's its own waste.
  Automate the settled, not the exploratory.
- **Skip** the rare, the already-a-one-liner, and the moving target.

## Step 3 — Program or Skill? (the classifier)

| The repeated task… | → **Program** (script/tool) | → **Skill** (SKILL.md) |
|---|---|---|
| Same steps every time, no judgment | ✓ | |
| Needs per-instance reasoning / adaptation | | ✓ |
| Deterministic I/O — files, git, data, builds | ✓ | |
| Reads/writes prose, weighs options, decides | | ✓ |
| High frequency, speed & cost matter | ✓ (no LLM = free + fast + reliable) | |
| Infrequent but complex, benefits from the gates | | ✓ |

- **Program** = deterministic, cheap to run, reliable — but brittle to change, can't adapt.
- **Skill** = adapts per instance, carries the gates — but costs tokens each run.
- **Both (the mechanical-with-judgment case, often the right answer):** a thin **skill decides
  whether / when / how**, and calls a **program** for the mechanical heavy-lifting. E.g. a
  `/ship` skill that runs a deterministic `ship.mjs`; or `wick-migrate` (skill) calling
  `wick-path-audit` (program).

## Step 4 — Propose (never auto-build)
Return:
1. **The pattern** — what's repeated, how often, the evidence (cite the instances).
2. **Verdict** — automate now / wait (not stable) / skip (low payoff), with the payoff estimate.
3. **Program, skill, or both** — with the classifier reasoning; name the **parameters** (the
   variable parts abstracted out of the structural repetition).
4. **A draft** — a skeleton `.claude/skills/wick-<name>/SKILL.md` or a script stub, ready to
   build on approval.
5. **Gate** — build only on explicit approval, then **verify the automation on a real instance**
   (verify behavior, not form) before trusting it.

## Cross-session mode (the observation log)
For detection that spans sessions, install the observer (Claude Code): `tools/wick-observer.mjs`
appends a compact `{ts, tool, target}` record to `memory/.observations.jsonl` on each Edit /
Write / Bash via a PostToolUse hook. This skill then mines the log for frequent n-gram
sequences. The log is runtime — keep it gitignored.

```jsonc
// .claude/settings.json
{ "hooks": { "PostToolUse": [ { "matcher": "Edit|Write|Bash",
  "hooks": [ { "type": "command", "command": "node tools/wick-observer.mjs --post-tool-use" } ] } ] } }
```

## What this will never do
- Auto-build an automation (propose + gate, always).
- Automate a moving target (stability gate) or a low-payoff rarity.
- Recommend a skill where a $0 deterministic program would do — or a brittle script where the
  task genuinely needs judgment. Matching the automation to the task is the discipline.
