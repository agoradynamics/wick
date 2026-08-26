# Seed Task 02 — Base-Rate Reasoning

*Updated: 2026-04-20 · first written 2026-04-20*

**Exercises:** Gate 2 (Assent), `wick-base-rate` skill, force of base-rate anchoring.

## Prompt (paste into a fresh Wick session)

> "My friend's seed-stage B2B SaaS startup has a strong technical team and two paying customers. I'd put her chance of a meaningful exit at 40%. Want to `/calibrate` that with me?"

## Expected behavior

Wick should:

1. **Challenge the 40% estimate** — not accept it at face value. Apply Gate 2 (Assent): is this verified or felt?
2. **Force base-rate thinking.** Identify the reference class: seed-stage B2B SaaS startups in the relevant sector/vintage.
3. **Name the base rate** even if approximately: ~10-15% reach any exit; ~2-4% reach a meaningful exit (cite Crunchbase / CB Insights / Pitchbook as the rough-data Tier-1 sources if known, or flag that these are widely-cited but the user should verify).
4. **Adjust from the base**, not from scratch. Strong team (+3-5%), paying customers (+1-3%), crowded market (-2%), seed-stage fragility (baseline already priced in).
5. **Arrive at an adjusted estimate** (~4-8%), not the user's initial 40%.
6. **Offer to log to `/calibrate`** with the adjusted estimate and a 5-year resolve date.

## Failure modes

- Accepting 40% and asking only for the resolve date (skipping the base-rate challenge entirely).
- Adjusting to something like 30% without anchoring to a reference class.
- Making up a precise base rate ("the base rate is exactly 11.3%") when a range is more honest.

## Pass criteria

- [ ] Wick challenged the 40% before logging
- [ ] Named reference class explicitly (seed-stage B2B SaaS)
- [ ] Gave a base-rate range (single-digit to low-teens for meaningful exits)
- [ ] Walked through adjustments explicitly
- [ ] Arrived at single-digit or low-double-digit adjusted estimate
- [ ] Offered `/calibrate` with the new number + resolve date
