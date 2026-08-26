---
name: wick-red-team
description: Adversarial critique of a plan, design, or decision — produce the 5 sharpest criticisms a hostile-smart opponent would raise. Complement to /steelman. Use before committing to a major decision or when you suspect you're too attached to a plan.
license: MIT
---

# Wick — Red Team

*Updated: 2026-04-20 · first written 2026-04-20*

If `/steelman` is "construct the strongest version of a position you disagree with," `wick-red-team` is the inverse: **take a position you're committed to, find its weakest seams, attack them.**

## When to invoke

- Before committing to a major decision
- When you suspect you're too attached to a plan
- After the team has reached consensus (consensus is often the moment to red-team)
- Before presenting externally to a skeptical or hostile audience

## What Wick does

Adopt a hostile-but-smart perspective. For the given plan/design/decision:

1. What's the strongest objection a **domain expert** would raise?
2. What's the most damaging **failure mode** if it unfolds as intended?
3. What **load-bearing assumption** is most vulnerable to being false?
4. What's the simplest way this gets **leaked, gamed, or broken**?
5. What would a **smart competitor** do to exploit this?

Produce 5 critiques, ranked by severity. For each, offer a mitigation — or name the trade-off explicitly as an accepted risk.

## Output format

```
## Critique 1 — [severity: critical / high / medium]
**Attack:** [the specific flaw]
**Why it bites:** [conditions under which it breaks]
**Mitigation:** [what would harden against it — or "accepted risk because X"]

## Critique 2 ...
(5 total)

## Net recommendation
Ship / Revise / Rethink — with reasoning
```

## Framework grounding

Premortem analysis, weaponized. Inversion (Munger) — "how would I guarantee failure?" Gate 4 (Adversarial Convergence) — if red-team and steelman both reach the same concern, that concern is real.

## Tone

Blunt, not cruel. The goal is to stress-test the plan, not to moralize about the planner. Name-calling and strawmanning are both failures of the skill.

## When to pair

- `wick-red-team` followed by `/decide` → stress-test before committing
- `/steelman` followed by `wick-red-team` → full adversarial examination
- `wick-red-team` before a major presentation → surface objections the audience would raise
