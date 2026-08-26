# Seed Task 03 — Decision with Adversarial Convergence

*Updated: 2026-04-20 · first written 2026-04-20*

**Exercises:** Gate 4 (Adversarial Convergence), `/decide` gate chain, framework citation discipline.

## Prompt (paste into a fresh Wick session)

> "`/decide` — my small team is burned out and we have a feature gap vs a competitor. Options: (a) hire two more engineers, (b) cut scope on our roadmap, (c) raise a bridge round to extend runway. Walk me through the gates."

## Expected behavior

Wick should run the `/decide` gate chain, **one question at a time** with recommended answers (applying the grill-me pattern), and explicitly cite **at least two adversarial frameworks** (frameworks built on opposing assumptions that nevertheless converge).

Expected gate chain:

1. **Control Filter** — What's actually controllable? (Wick proposes: team morale and scope are largely controllable; competitor's behavior and the bridge market are largely not.)
2. **Assent Check** — What do we know vs. assume? (Wick names the load-bearing assumption: *"burned-out" is a hypothesis; what's the evidence — measured output drop, retention signals, explicit complaints?*)
3. **Specificity** — Is "feature gap" specific enough? (Wick proposes sharper form: *which feature, how much of the customer base asks for it, what's the conversion/churn impact?*)
4. **Adversarial Convergence** — Name two or more frameworks:
   - **Aristotelian golden mean** says: neither exhaustion (status quo) nor over-hiring; cut scope is the midpoint that fits the situation.
   - **Stoic dichotomy of control** says: focus on what you actually control — cut scope and protect the team, don't bet on uncontrollables like market timing.
   - *If both agree on (b), that's convergence, which raises confidence.*
   - Alternatively: if Acemoglu institutionalism (sustainable team as capital) agrees with Lean startup (cut non-validated scope), same answer from different assumptions.
5. **Recommendation** — Wick proposes (b) cut scope as the leading option, with (a) as a conditional follow-up only if scope cut doesn't relieve the morale issue within ~4 weeks.

## Failure modes

- Asking all 5 gate questions in one message (violates one-at-a-time discipline).
- Not proposing Wick's own recommendation — just asking the user to fill in blanks.
- Citing only one framework ("the Stoic dichotomy of control says…"). Adversarial convergence requires at least two with opposing assumptions.
- Recommending all three options as "it depends" without a lean.
- Failing to flag "burned out" as an unverified assumption.

## Pass criteria

- [ ] Ran the 5 gates in order, one question at a time
- [ ] Proposed a recommended answer at each gate before asking
- [ ] Cited at least two adversarial frameworks that converge
- [ ] Flagged the "burned out" claim as Gate-2-unverified
- [ ] Produced a specific recommendation (not "it depends")
- [ ] Offered to save the decision to `memory/decisions.md`
