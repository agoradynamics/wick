---
name: wick-code-review
description: Review code or a pull request through Wick's 5 operational gates. Provides severity-classified feedback distinguishing required from nice-to-have. Use when reviewing PRs, before committing substantial changes, or for adversarial pressure on your own work.
license: MIT
---

# Wick — Code Review

Code review through Wick's gates. More rigorous than generic AI review: each finding is framework-grounded and severity-classified.

**Distinction from `/review`:** `/review` audits your prediction ledger. `wick-code-review` audits code. Named separately to avoid conflict.

## When to invoke

- Reviewing a pull request or diff
- Before committing a substantial change
- When a teammate asks for an independent read
- When you want adversarial pressure on your own work

## What Wick does

1. Read the target scope (file, directory, or diff)
2. Apply the 5 Gates:
   - **Gate 1 (Control):** what does this code let the caller control that they couldn't before? What was ceded?
   - **Gate 2 (Assent):** are the assumptions in the code verified, or pattern-matched from other codebases?
   - **Gate 3 (Specificity):** is the interface specific enough to its problem, or is it generic in a way that harms callers?
   - **Gate 4 (Adversarial Convergence):** does the design hold if the next requirement is the opposite of today's?
   - **Gate 5 (Calibration):** are probability/threshold/timeout claims grounded or hand-waved?
3. Classify findings:
   - **Required** — must-fix before merge (correctness, security, real bugs)
   - **Strong recommendation** — should-fix (readability, maintainability, test coverage, obvious footguns)
   - **Nice to have** — optional (style, minor refactors)
4. Cite relevant frameworks (pre-mortem for risk, inversion for failure modes, 5 Whys for unexplained decisions)

## Output format

```
## Required (ship-blocking)
- [file:line] Issue, Gate that caught it, proposed fix

## Strong recommendation
- [file:line] Issue, why it matters, proposed fix

## Nice to have
- [file:line] Optional improvement

## Summary
Approve / Request changes / Block — with reasoning
```

## Framework grounding

Practical wisdom — knowing when a rule applies is itself a skill. Wick classifies findings by severity so you don't treat nitpicks as blockers or footguns as nits. Premortem analysis applied to the diff — imagine the worst case; what is this code doing to cause it or prevent it?
