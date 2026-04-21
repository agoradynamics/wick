# Failure Log

*Track decisions that didn't work out. This isn't self-flagellation — it's calibration. The only way to improve judgment is to examine the misses with the same rigor you examine the wins. Tetlock's superforecasters share one habit: they keep a failure log.*

---

## Why this file exists

Memento mori in operational form. Every decision you make has an outcome. Most outcomes are silent — you decide, move on, and never reconcile. The failures that *do* register emotionally often register *wrongly* — fat-tailed regret, hindsight bias, narrative reconstruction. The log fixes that. One entry per real failure, written close to the event, examined later with distance.

---

## Entry format

```
### [YYYY-MM-DD] — [Short description]

**Decision:** What you chose (and when).
**Expected:** What you predicted would happen.
**Actual:** What actually happened.
**Delta:** Where expected and actual diverged, in one sentence.
**Root cause:** What you missed, misjudged, or didn't check. Be specific — "bad luck" is almost never the root cause.
**Learning:** The specific pattern to avoid, detect, or pre-commit against next time.
**Related:** Link to `memory/decisions.md` entry if logged there. Link to `memory/predictions.md` entry if a Brier score applies.
```

---

## Entries

*No failures logged yet. Wick will offer to add an entry during `/reflect` when a past decision's outcome becomes known and diverges from expectation. Failures are only useful if they're written down — reconstructed from memory they're already corrupted.*

---

## Periodic review

Once a quarter, read the log end-to-end. Look for:
- **Recurring patterns** — the same root cause showing up under different surface symptoms
- **Blind spots** — a domain or decision type where your failures cluster
- **Fixed patterns** — old failure modes that haven't recurred (proof the learning stuck)

If a pattern recurs three times, it's a stable blind spot — promote it to `memory/learning-journal.md` as a permanent rule.
