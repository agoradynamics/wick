---
language:
  - en
license: mit
size_categories:
  - n<1K
task_categories:
  - text-generation
tags:
  - claude-code
  - agent-skills
  - thinking-partner
  - philosophy
  - decision-making
  - calibration
  - epistemic-humility
  - wick
  - agora-dynamics
pretty_name: Wick — Thinking-Partner Training Pairs
---

# Wick — Thinking-Partner Training Pairs (v1.0)

A small, hand-curated dataset of conversation pairs that encode Wick's
two core disciplines: analytical mastery and epistemic humility.

Part of the [Wick](https://github.com/agoradynamics/wick) package — a
drop-in thinking-partner personality layer for Claude Code, Cursor,
ChatGPT, and any AGENTS.md-compliant agent runtime.

- **Curated by:** Agora Dynamics LLC
- **License:** MIT (same as the parent Wick package)
- **Total pairs:** 37 (23 analytical-mastery + 14 epistemic-humility refusals)
- **Languages:** English
- **Intended use:** fine-tuning small local models to inherit Wick's
  voice + discipline

## Dataset Summary

Two JSONL files, each pair a single-turn instruction/response example:

| File | Count | Purpose |
|---|---|---|
| `wick-training.jsonl` | 26 | Analytical-discipline pairs — decision framing, base-rate reasoning, framework application, false-premise correction, verify-before-claim |
| `wick-refusals.jsonl` | 16 | Epistemic-humility refusals — Level-3 "I don't know, here's how I'd approach it" patterns |

The refusal half is as important as the discipline half — it teaches the
model to say "I don't know" before fabricating. Shipping a fine-tune
with only the discipline pairs produces a confident confabulator; shipping
both halves teaches calibration.

## Supported Tasks

- **text-generation** — standard SFT (supervised fine-tuning) for
  instruction-following
- **conversational** — single-turn conversation pairs that can be
  composed into multi-turn traces

## Data Structure

Each line is a single JSON object with this shape:

```json
{
  "instruction": "User-facing query or prompt",
  "response": "Wick's response, written in her voice with framework-grounded reasoning and explicit uncertainty where appropriate"
}
```

(Exact field names — check the first line of each file; format may
vary slightly between the two sets.)

## Dataset Creation

### Source

All pairs are **human-curated** by Agora Dynamics LLC. No pairs were
generated autonomously by a large model. Some pairs draw on published
frameworks in the Wick `KNOWLEDGE.md` reference library — the frameworks
themselves are academic/public-domain sources (Tetlock superforecasting,
Bayes, Gigerenzer fast-and-frugal, CRAAP test, source-hierarchy taxonomy,
classical decision heuristics).

### Provenance

- **Authorship:** human-curated, single-author
- **Model lineage:** pairs were designed for model-agnostic fine-tuning;
  they are not distilled from any specific model's outputs
- **Scrubbing:** all pairs passed through `tools/wick-scrub.mjs` (16
  secret-detection patterns) to catch accidental credential inclusion
  before packaging

### Annotations

No annotator pool. Single-author curation. Quality standard: every
pair should exemplify either (a) a rigorous analytical move, or (b) a
clean Level-3 epistemic-humility refusal without fabrication.

## Intended Use / Not For

**Intended use:**
- Fine-tuning small local language models (3B–7B) to inherit Wick's
  voice and epistemic discipline
- Research into calibration, refusal quality, and framework-grounded
  reasoning in small models
- Evaluation of base-model alignment against epistemic-humility norms
- Educational reference for prompt-engineering patterns

**Not for:**
- Safety-critical deployment without independent evaluation
- Replacing a safety-trained instruction dataset (this is a
  voice/discipline layer, not a safety-alignment layer)
- Training large frontier models (too small; use as a voice-seasoning
  supplement, not primary training data)
- Any use that violates the parent project's MIT license (see LICENSE)

## Considerations

### Known Limitations

- **Small sample size.** 37 pairs is seeds, not corpus. Intended as a
  voice-inheritance seed, not standalone training data.
- **English-only.** Voice and framework references have not been
  translated or tested in other languages.
- **Domain-general.** Pairs favor general-purpose thinking-partner
  contexts (decisions, forecasting, research). Domain specialists
  (medical, legal, financial) should supplement with domain-specific
  data.

### Social Impact

Positive: encodes an explicit epistemic-humility discipline that
counteracts the common LLM failure mode of confident fabrication.

Caveats: a thinking-partner voice is not a substitute for professional
advice. Wick fine-tunes should carry the same disclaimers as the parent
package (see `README.md`). Crisis-resources pathways (988 / Text HOME
to 741741) are encoded in Wick's Charter — models fine-tuned from these
pairs should not override those pathways.

## Citation

```bibtex
@misc{wick2026,
  author = {{Agora Dynamics LLC}},
  title = {Wick: A Drop-In Thinking-Partner Package for Agent Runtimes},
  year = {2026},
  publisher = {{Agora Dynamics LLC}},
  url = {https://github.com/agoradynamics/wick}
}
```

## Links

- **Package repo (MIT):** <https://github.com/agoradynamics/wick>
- **Specification compliance:** [agentskills.io](https://agentskills.io/specification)
- **Runtime bridge (AGENTS.md):** [agents.md](https://agents.md/)

## Questions

- Technical / package issues → GitHub repo
- Commercial licensing (trademark) → `contact@agoradynamics.dev`
- Dataset-specific issues → include `[dataset]` in your GitHub issue title
