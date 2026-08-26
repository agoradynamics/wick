---
name: wick-research
description: Structured research on a topic — applies CRAAP test, source hierarchy (Tier 1-4), steel manning, and base-rate reasoning. Tags findings with confidence level. Use when closing memory/curiosity.md entries or before major decisions depending on external data.
license: MIT
---

# Wick — Research

*Updated: 2026-04-20 · first written 2026-04-20*

Framework-grounded research — not "Google it and pick three links." Every finding is tagged with confidence level and source tier. This is the skill that closes `memory/curiosity.md` entries.

## When to invoke

- Closing a `memory/curiosity.md` entry
- Starting a `/learn` session on a technical topic
- Before a major decision that depends on external data
- When Wick hit a Level-3 epistemic gap and the gap now matters enough to close

## What Wick does

1. **Clarify the question** — what specifically do we need to know? Vague questions yield vague research.
2. Target the **source hierarchy**:
   - **Tier 1** — peer-reviewed journals, formal models, Nobel lectures, primary data
   - **Tier 2** — university press, RAND/Brookings/CSIS reports, government statistical agencies
   - **Tier 3** — working papers (NBER, SSRN), CRS reports, conference proceedings
   - **Tier 4** — news analysis, expert commentary (inputs only, never framework basis)
3. Apply the **CRAAP test** to each source:
   - **C**urrency — is it recent enough for this question?
   - **R**elevance — does it address this specific question, not a neighboring one?
   - **A**uthority — credentials, peer review, institutional backing
   - **A**ccuracy — evidence-backed, independently verifiable
   - **P**urpose — why does this source exist? Is there undisclosed bias?
4. Find **3-5 converging sources** (adversarial convergence preferred — opposing-assumption sources agreeing is stronger than correlated ones)
5. **Steelman** any opposing view before dismissing it
6. Classify confidence:
   - *"I know this"* — Tier 1-2 convergence
   - *"I believe this, here's why"* — reasoning from frameworks, Tier 3 support
   - *"I don't know"* — no Tier 1-2 support; flag the gap honestly

## Output format

```
## Question
[restated precisely]

## Findings
- [claim 1] — [confidence level] — [1-3 best sources with tier]
- [claim 2] — [confidence level] — [sources]

## Steelmanned opposing view
[strongest form of the dissenting position, and why it doesn't (or does) change the finding]

## What I could not verify
- [gap] — [how one could resolve it; worth staying open?]

## Recommended next step
- Close-out: write finding into `memory/domain-knowledge.md` or `KNOWLEDGE.md`
- Or: park as `status: researching` in curiosity queue
```

## Framework grounding

Platonic divided line — research moves claims from impression through belief up to reasoned understanding. Stoic discipline of assent at scale. Fast-and-Frugal heuristics (Gigerenzer) when time is short — take-the-best cue from the highest-tier source available, acknowledge the rest as pending. Epistemic humility — if the research doesn't close the gap, *say so explicitly*; don't paper over it with adjacent findings.

## What Wick will never do

- Fabricate a citation to fill a gap
- Cite a summary of a paper when the paper itself is accessible
- Present inferential claims as observed ones
- Conclude before the research supports a conclusion
