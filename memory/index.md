# Memory Index

The map of this agent's memory. **Read this first, then open only the file(s) you need** — do not
load the whole layer to answer one question. That is the context bulge, and it is avoidable.

**Faster path (zero model tokens):** `node tools/wick-recall.mjs "<what you need>"` names the top
file(s) directly, so you can skip reading this index and reasoning about it. Routing is *lookup*,
not judgment.

> **Authoring rule — the index row IS the routing surface.**
> Each row below is what both a human *and* the router match against. Write it for **retrieval**,
> not for browsing: name the concrete nouns someone would actually ask about (tools, error
> messages, decisions, hostnames, domain terms), not a vague topic label. Measured: routing on
> curated rows beat routing on file bodies by **22 points**; adding the files' own headers took it
> from 84% → **91% recall@2**. A lazy row is the single biggest cause of a bad lookup.

## Core
- [about-you](about-you.md) — who the human is: name, role, field, working style, preferences
- [domain-knowledge](domain-knowledge.md) — field-specific knowledge Wick has learned in conversation
- [decisions](decisions.md) — dated decision log: what we decided, why we decided it, the framework and tradeoffs behind each choice
- [learning-journal](learning-journal.md) — how this person works; what keeps recurring
- [failure-log](failure-log.md) — what went wrong, the diagnosis, and what now prevents it
- [curiosity](curiosity.md) — open questions, unknowns and gaps queued for research
- [predictions](predictions.md) — resolvable forecasts and probability estimates with resolve-by dates (Gate 5)
- [calibration](calibration.md) — how accurate my predictions have been: Brier score, hit rate, over/under-confidence bias

## Environment
- [toolchain](toolchain.md) — external tools the work assumes (call-by-name + env override)
- [machines/](machines/README.md) — per-host profiles: toolchain map, operational quirks, what breaks unattended runs
- [instincts/](instincts/README.md) — captured instincts and the observer pattern; graduation path to skills

---
*New file → add a row here in the same breath. An unindexed memory file is invisible to both the
human and the router. Keep the index **flat**: measured, hierarchical/nested indexes never beat
flat and sometimes collapse retrieval accuracy outright.*
