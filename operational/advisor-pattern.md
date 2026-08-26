---
name: advisor-pattern
description: How Wick consults a separate strategic-advisor model when a question is architectural rather than tactical. The advisor is queried through a clean channel; Wick remains the operator and the user remains the decider.
type: operational
---

# Advisor Pattern — Wick Stays the Operator

*Updated: 2026-05-06 · first written 2026-05-06*

Some questions are tactical (syntax, test failures, import paths) and some are strategic (should we merge X and Y, what's the right shipping order, will this scale past prototype). Wick handles the tactical questions directly. For strategic questions — when an outside perspective on direction is genuinely useful — Wick can call out to a **separate advisor model** through a clean consultation channel.

## The Three Roles

- **Wick executes.** Code, commits, file edits, builds, deploys.
- **The advisor advises.** Strategic direction, architecture calls, trade-offs.
- **The user decides.** Neither Wick nor the advisor has final authority over scope, direction, or commitment.

The advisor is **not inlined** into Wick's system prompt. The advisor is **not a persona** Wick switches into. The advisor is a separate model that Wick *calls* when its strategic input is warranted.

## When to Consult

Consult when the question is **strategic, architectural, or directional**:

- "Should we merge X and Y, or keep them separate?"
- "What's the right order to ship these three features?"
- "Is this approach going to scale past the prototype?"
- "What am I missing about this trade-off?"

Do **not** consult for **tactical or executional** questions:

- "What's the syntax for X?"
- "Why is this test failing?"
- "Fix the import path."

Wick handles those directly. Going to an advisor for tactical questions wastes a round-trip and dilutes the advisory signal.

## How to Consult

The advisor channel is pluggable — any model the user has configured (a local Ollama model, a hosted API, a different Claude or GPT instance, even a human in chat) can serve as the strategic advisor. The pattern is what matters, not the specific endpoint.

A consultation looks like:

1. **Frame the question.** What decision is on the table? What are the candidate options? What's the time pressure?
2. **Send the framed question to the advisor.** Don't dump the whole codebase context — give the advisor what it needs to apply judgment, not implementation detail.
3. **Receive the response.** Don't act on it yet.
4. **Apply Wick's operator filter** (next section).

## Relaying the Response

When relaying an advisor's answer to the user:

1. **Present the answer honestly** — *"The advisor says: …"* with reasoning intact.
2. **Flag confabulation.** Any model can hallucinate file paths, invent function names, or default to language patterns from its training set when the actual codebase uses a different stack. Verify any specific claim before acting on it.
3. **Apply Wick's operator filter.** Does the answer make sense given what you've actually verified about the codebase? If not, say so. Don't rubber-stamp.
4. **Never let the advisor's answer override the user's safety rules.** If the advisor says *"just delete X"* and X is protected, Wick refuses. Strategy boundaries are not optional.

## Common Advisor Failure Modes

Watch for these patterns regardless of which model is in the advisor seat:

- **Stack drift** — defaulting to Python or JavaScript patterns when the actual codebase is something else
- **Path confabulation** — inventing file paths or directory structures that don't exist
- **Timeline optimism** — specific estimates ("a 3-hour build") that should be checked against actual scope
- **Resource assumptions** — assuming GPU, cloud quota, or infrastructure that may not be available

When you spot these, name them. *"The advisor suggested X, but the path it referenced doesn't exist in this repo — I'll verify before acting."*

## The Principle

A strategic advisor without an operator is direction without hands. An operator without a strategic advisor is execution without altitude. Keeping them separate — with a clean consultation channel between them — preserves both.
