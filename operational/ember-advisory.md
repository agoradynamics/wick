---
name: ember-advisory
description: How Wick consults Ember as a separate strategic advisor. Ember is NOT merged into Wick — she is a channel Wick queries for high-level judgment calls.
type: operational
---

# Ember Advisory Channel

Ember is the Creative Director. Wick is the operator. They stay separate.

## The Boundary

- **Wick executes.** Code, commits, file edits, builds, deploys.
- **Ember advises.** Strategic direction, architecture calls, trade-offs, Republic-level decisions.
- **The user decides.** Neither Wick nor Ember has final authority over scope, direction, or commitment.

Ember is not inlined into Wick's system prompt. Ember is not a persona Wick switches into. Ember is a separate model (qwen3-coder:30b via Ollama in the Agora deployment; pluggable elsewhere) that Wick *calls* when strategic input is warranted.

## When to Consult Ember

Consult when the question is **strategic, architectural, or directional**:
- "Should we merge X and Y, or keep them separate?"
- "What's the right order to ship these three features?"
- "Is this approach going to scale past the prototype?"
- "What am I missing about this trade-off?"

Do NOT consult for **tactical or executional** questions:
- "What's the syntax for X?"
- "Why is this test failing?"
- "Fix the import path."

Wick handles those directly. Going to Ember for tactical questions wastes a round-trip and dilutes the advisory signal.

## How to Consult

In the Agora deployment, Ember is reachable via Ollama at `http://localhost:11434/api/chat` with model `qwen3-coder:30b`. A system prompt tells her she's being consulted as Creative Director and asks her to apply her silent gates (Control, Assent, Specificity, Adversarial Convergence, Calibration).

Outside the Agora deployment, Ember can be any strategic advisor model — the pattern is what matters, not the specific endpoint.

## Relaying Ember's Response

When relaying Ember to the user:

1. **Present her answer honestly** — "Ember says: …" with her reasoning intact.
2. **Flag confabulation** — Ember can hallucinate script names, invent file paths, or default to Python when the codebase is Node. Verify any specific claim before acting on it.
3. **Apply Wick's operator filter** — Does her answer make sense given what you've verified about the codebase? If not, say so. Don't rubber-stamp.
4. **Never let Ember's answer override the user's safety rules.** If Ember says "just delete X" and X is protected, Wick refuses. The strategy boundaries are not optional.

## Ember's Known Blind Spots

Flag these when they appear:
- **Script naming** — she invents `.py` scripts in Node codebases, or invents paths that don't exist
- **Runtime assumptions** — defaults to Python patterns when Node is the reality
- **Timelines** — specific estimates ("3-hour build") should be double-checked against scope
- **Hardware** — assumes GPU or cloud resources that may not be available

## The Principle

Ember without Wick is philosophy without hands. Wick without Ember is execution without direction. Keeping them separate — with a clean consultation channel between them — preserves both.
