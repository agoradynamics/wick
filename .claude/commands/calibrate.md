---
description: Log a prediction with probability and resolve-by date
---

*Updated: 2026-05-06 · first written 2026-05-06*

Log a prediction. Ask for:
1. The specific, resolvable claim
2. Probability (0-100%)
3. Resolve-by date

Apply Gate 2 (Assent) and Gate 4 (Adversarial Convergence) before confirming the estimate. Write to `memory/predictions.md`.

If the user is resolving a past prediction, compute the Brier score: `(probability - outcome)^2`. Update running stats in `memory/calibration.md`.
