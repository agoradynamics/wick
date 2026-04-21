# Wick Instincts — Confidence-Scored Behaviors

*A layer between raw conversation and polished skills. An instinct is a confidence-weighted atomic rule Wick learned from you — "prefer bullet lists for technical summaries," "flag when I say 'obviously'," "run `npm test` before proposing changes." Over time, reinforced instincts graduate into memory-journal rules, skills, or `KNOWLEDGE.md` extensions.*

*Pattern credit: affaan-m/everything-claude-code. Adapted for Wick's file-based architecture.*

---

## Why instincts exist

Wick already captures explicit corrections via `memory/learning-journal.md`. Instincts capture **implicit** patterns — things the user never formally stated but demonstrably prefer, tolerate, or reject. The `/reflect` flow writes when you confirm something matters; instincts file themselves when a pattern *repeats*.

The difference in one sentence: **learning-journal is intentional memory; instincts is observed memory.**

This is an **opt-in layer.** If you never put anything in `memory/instincts/`, Wick behaves exactly as before. The moment you add a file (or Wick offers to, and you say yes), she starts honoring it.

---

## Instinct format

Each instinct is a YAML file in `memory/instincts/`. One instinct per file, filename matches the `id`:

```yaml
id: prefer-bullet-lists-for-technical-summaries
trigger: "when user asks for a technical summary or review"
behavior: "default to bullet points over paragraphs; preserve prose only when argument is cumulative"
confidence: 0.65         # 0.3 tentative, 0.6 working, 0.85 near-certain
domain: "voice"          # voice, workflow, domain-knowledge, tooling, ethics
source: "user-correction"  # user-correction, repeated-pattern, explicit-request
scope: "project"         # project or global
created: 2026-04-20
reinforced: 2            # times observed/confirmed since creation
last_reinforced: 2026-04-20
notes: "Ryan said 'bullets' on 4/18 and again on 4/20 when I paragraphed a security review."
```

**Required fields:** `id`, `trigger`, `behavior`, `confidence`, `domain`, `source`, `scope`, `created`.
**Optional but encouraged:** `reinforced`, `last_reinforced`, `notes`.

### Confidence levels (guidance, not rule)

| Range | Meaning |
|---|---|
| 0.30 – 0.50 | **Tentative** — observed once, might be coincidence. Honor lightly; be ready to abandon. |
| 0.50 – 0.70 | **Working** — repeatable pattern, 2-3 confirmations. Apply consistently; surface if violated. |
| 0.70 – 0.85 | **Near-certain** — 4+ confirmations, actively corrected if violated. Eligible for `/promote` to global or to `learning-journal.md` as a permanent rule. |
| 0.85 – 0.95 | **Conviction** — candidate for graduation into a skill or KNOWLEDGE.md extension. Wick should offer this via `/evolve`. |

### Domain taxonomy

- `voice` — tone, length, formality, response style
- `workflow` — how the user works (run tests first, commit frequently, etc.)
- `domain-knowledge` — field-specific conventions (finance uses "P&L" not "profit and loss")
- `tooling` — preferences about tools and commands
- `ethics` — soft lines the user holds (don't use ChatGPT, avoid proprietary SaaS, etc.)

### Scope

- `project` — applies only inside this specific Wick install / project
- `global` — applies across all Wick installs owned by this user (requires `/promote` from a project instinct observed in 2+ projects)

---

## Lifecycle

```
Observation (session)
      ↓
Wick offers to log instinct  ←─── offered-reflection pattern
      ↓
memory/instincts/<id>.yaml   (confidence: 0.40, reinforced: 1)
      ↓
Re-observation (later session, same pattern)
      ↓
Wick reinforces: confidence += 0.15, reinforced += 1, last_reinforced updated
      ↓
(repeat)
      ↓
Confidence ≥ 0.70 → Wick offers /evolve or /promote
      ↓
/promote → moves to global install or to learning-journal.md as permanent rule
/evolve  → clusters related instincts; proposes new skill or KNOWLEDGE.md section
```

### Reading instincts at session start

Wick reads all `memory/instincts/*.yaml` at session start alongside other memory files. Higher-confidence instincts take precedence. Conflicting instincts (same `trigger`, different `behavior`) are flagged for user reconciliation — never silently resolved.

### Reinforcement

When Wick notices a pattern match an existing instinct during a session:
1. Silently note the reinforcement (do not interrupt the user)
2. At session end (during `/reflect` or offered-reflection), mention it:
   *"I noticed `prefer-bullet-lists-for-technical-summaries` (confidence 0.65) matched twice today. Bump to 0.75?"*
3. On user yes → update the YAML

### Decay

Instincts reinforced < 1x in 90 days are candidates for pruning. `/audit` surfaces them. Wick does not auto-delete.

---

## Commands

### `/evolve`

Scan `memory/instincts/*.yaml`, cluster by `domain` and related triggers, and propose:
- **Skill candidates** — 3+ instincts pointing at the same workflow → offer a new `.claude/skills/wick-<name>/SKILL.md`
- **KNOWLEDGE.md additions** — domain-knowledge instincts with conviction confidence → offer section in KNOWLEDGE.md
- **Learning-journal promotions** — voice/workflow instincts at 0.85+ → propose moving to `memory/learning-journal.md` as stable rules

Does NOT execute changes. Returns a proposal the user approves item-by-item.

### `/promote [instinct-id]`

Move a `scope: project` instinct to `scope: global` (or to a user-level Wick install's memory directory if you run Wick in multiple projects). Only valid if the instinct has been observed in 2+ distinct projects (user confirms). Writes a tombstone in the origin project's `learning-journal.md` noting the promotion.

---

## Optional — the Observer Hook (Claude Code only)

For users running Wick in **Claude Code**, affaan-m's observer pattern can be wired as a PostToolUse hook that writes raw observations to `memory/instincts/.observations.jsonl`, and a background pass (manual or cron) clusters them into proposed instincts using a small model (Haiku or local Ollama).

**This is not shipped with Wick.** It's Claude-Code-specific and requires API access. Documented here so users who want it know the pattern:

```jsonc
// .claude/settings.json snippet
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "node tools/wick-observer.mjs --event post-tool-use"
        }]
      }
    ]
  }
}
```

The `tools/wick-observer.mjs` script (not shipped — a ~100 LOC user exercise) appends `{tool, input, output, timestamp}` to `.observations.jsonl`. A separate pass (`wick-evolve-instincts.mjs`, also not shipped) uses a cheap model to classify observations into draft instincts.

For most users: **don't bother with the hook.** Let Wick offer instincts via the offered-reflection pattern during explicit `/reflect` calls. The hook is a power-user accelerator, not a requirement.

---

## Example: a real instinct from scratch

Session 1:
> **User:** Can you review this PR?
> **Wick:** [writes a 300-word paragraph review]
> **User:** Too long. Bullets next time.

Wick offers: *"Noted. Want me to log that as an instinct — `prefer-bullet-lists-for-code-review` — so I default to bullets on future reviews?"*
User: Yes.

→ `memory/instincts/prefer-bullet-lists-for-code-review.yaml` written with `confidence: 0.40, reinforced: 1`.

Session 4 (two weeks later):
> **User:** Review this diff?
> **Wick:** [uses bullets — instinct honored]
> **User:** Good.

At session end, Wick notes: *"The bullet-lists-for-reviews instinct matched today. Bump confidence to 0.55?"*
User: Yes.

Session 9 (six weeks total, 4 reinforcements, confidence 0.85):
During `/evolve`, Wick proposes: *"This instinct has stabilized. Promote to `memory/learning-journal.md` as a permanent rule?"*
User: Yes.

The instinct is now a first-class voice rule. Wick's default changes. The compound-interest loop has closed.

---

## What NOT to log as an instinct

- **One-off requests** — "just for today, respond in haiku" is not an instinct
- **Context-free preferences** — "use bullets always" — without a trigger, Wick can't apply it
- **Identity rules** — things that belong in the Charter (like "don't help with harm") — those are not negotiable preferences
- **Explicit corrections** — those go in `learning-journal.md` directly, not as an instinct

If in doubt: does it have a *trigger* (when to apply) and a *behavior* (what to do)? If yes, it's an instinct candidate. If no, it's something else.

---

*The flame doesn't spread by accident. Every instinct is a small piece of the user's judgment, crystallized.*
