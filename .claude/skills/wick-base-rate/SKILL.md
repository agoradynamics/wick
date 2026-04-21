---
name: wick-base-rate
description: Force base-rate thinking before a probability estimate. Identify reference class, historical rate, and adjust from there — not from intuition. Use before /calibrate or whenever you catch yourself or someone else estimating a probability from vibes.
license: MIT
---

# Wick — Base Rate

Tetlock-grade discipline applied to any probability claim. The single biggest failure mode in forecasting is estimating from scratch instead of adjusting from the base rate.

## When to invoke

- Before `/calibrate` on any resolvable prediction
- When you catch yourself saying "I think it's about X%"
- When someone else quotes a probability that feels anchored to vibes
- During `/decide` when scenarios get probability weights

## What Wick does

1. Parse the claim
2. Identify the **reference class** — the set of similar events this is a member of
3. Estimate the **base rate** — what fraction of events in that class went the predicted way?
4. Identify **adjustment factors** — what about *this* case moves the probability up or down from the base?
5. Arrive at: **base rate × adjustment**, not a free-floating intuition
6. Log reasoning to `memory/predictions.md` if paired with `/calibrate`

## Example

**Claim:** "I'd put this seed-stage startup's chance of a meaningful exit at 40%."
**Reference class:** seed-stage B2B SaaS in this sector, 2015-2024
**Base rate:** ~10-15% reach any exit; ~2-4% reach a meaningful exit
**Adjustments:**
 - +3-5% — strong technical founding team with prior exit
 - -2% — crowded market, strong incumbents
 - +1-3% — existing paying customers
**Adjusted estimate:** ~4-8%, not 40%.

The gap between gut-40% and base-rate-anchored-5% is the entire value of the skill.

## Output format

```
Reference class: [the class — be specific]
Base rate: [X% — cite source if available, flag if estimated]
Adjustments:
  + [factor 1]: +/-Y%
  - [factor 2]: +/-Y%
Adjusted estimate: ~Z%
Confidence in the base rate itself: [low / medium / high]
Sanity check: does Z% feel wildly different from initial gut estimate? If yes, investigate why.
```

## Framework grounding

Tetlock's superforecasting research. Method of Multiple Explanations — consider alternate reference classes; don't anchor on the first one that fits. Gate 2 (Assent) — the felt probability is an impression; test it before accepting it.

## Anti-patterns Wick will flag

- "Inside view only" — estimating from the features of this case without checking the class
- Hand-waved base rate — "probably most of them..." without actually looking it up
- Reference class too narrow — "similar startups founded on a Tuesday in my city"
- Reference class too broad — "all startups" when "seed-stage B2B in this sector" is available
