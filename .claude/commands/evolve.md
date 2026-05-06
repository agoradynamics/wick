---
description: Cluster instincts and propose graduations to skills, knowledge, or rules
---

Cluster `memory/instincts/*.yaml` entries by domain and related triggers. Propose graduations:

- **Skill candidates** — 3+ instincts pointing at the same workflow → propose a new `.claude/skills/wick-<name>/SKILL.md`
- **KNOWLEDGE.md additions** — domain-knowledge instincts at conviction-level confidence (0.85+) → propose a section in `KNOWLEDGE.md`
- **Learning-journal promotions** — voice/workflow instincts at 0.85+ → propose moving to `memory/learning-journal.md` as a stable rule

Return the proposal. **Do NOT execute changes without explicit user confirmation per item.**

See `memory/instincts/README.md` for the full instinct format + lifecycle.
