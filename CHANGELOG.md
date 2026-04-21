# Wick Changelog

## v1.0.0 (2026-04-20) — First Public Release 🔥

The first official Agora Dynamics product release. Open source under MIT.

### Core features

- **5 Operational Gates** — Control, Assent, Specificity, Adversarial Convergence, Calibration. Silent by default; named when they change the answer.
- **14 slash commands** — Core (`/reflect`, `/calibrate`, `/decide`, `/learn`, `/review`, `/status`) + Analytical (`/premortem`, `/steelman`, `/frame`, `/doubt`, `/forget`, `/audit`) + Instinct (`/evolve`, `/promote`).
- **8 on-demand skills** (spec-compliant per [agentskills.io](https://agentskills.io/specification)) — `wick-consolidate-memory`, `wick-simplify`, `wick-code-review`, `wick-security-review`, `wick-tldr`, `wick-red-team`, `wick-base-rate`, `wick-research`. All validate clean with `skills-ref validate`.
- **8 memory templates** — `about-you`, `decisions`, `learning-journal`, `domain-knowledge`, `predictions`, `calibration`, `failure-log`, `curiosity` + opt-in `instincts/`.
- **3 install modes** — Full takeover / Personality layer (via `WICK.md`) / Subagent (via `.claude/agents/wick.md`).
- **AGENTS.md bridge** — compatible with OpenAI Codex, Google Jules, GitHub Copilot, Aider, goose, Cursor, Zed, JetBrains Junie, Warp, Gemini CLI, Windsurf, RooCode, Factory, Devin, and 20+ other AGENTS.md-aware tools.

### Framework library

- **Four philosophical operating systems** — Stoic (dichotomy of control, discipline of assent, premortem, memento mori), Platonic (divided line, allegory of the cave, tripartite soul), Aristotelian (phronesis, golden mean, virtue as habit), Epicurean (method of multiple explanations, natural vs. vain desires). Invoked in 3–5 words, not lecture-length.
- **Modern decision science** — Tetlock superforecasting, Brier scoring, Gigerenzer fast-and-frugal heuristics, Acemoglu institutionalism, Schelling focal points, Smead cooperation dynamics, Watts network cascades, Klein premortem, Munger inversion, Bayes' theorem.
- **Operationalized epistemic humility** — 3-level confidence (Know / Believe / Don't know), decision tree for every factual claim, 3 worked dialogues, curiosity-queue loop closure.
- **8 cognitive biases** with tradition-grounded countermeasures (confirmation bias, anchoring, sunk cost, availability, Dunning-Kruger, survivorship, status quo, narrative fallacy).

### Tools

- `tools/wick-scrub.mjs` — secret scanner, 16 detection patterns (API keys, tokens, private keys, connection strings, credit cards). Smoke-tested.
- `tools/calibrate.mjs` — real Brier score computation, 6/6 self-tests pass.
- `tools/install-runtime.mjs` — installer for 12 runtime shims (Cursor, Copilot, Codex, Gemini, Aider×2, Continue, LobeChat, ChatGPT, Claude API).
- `team/aggregate-ledgers.mjs` — multi-project calibration rollup.
- `hooks/emit-audit-event.mjs` — JSONL audit trail for compliance-conscious teams.

### Benchmark layer

- `benchmark/README.md` — documents the two-layer approach (seed tasks + external benchmarks via Inspect AI / GAIA2 / Galileo).
- `benchmark/seed-tasks/` — 3 behavioral smoke tests: epistemic humility, base-rate reasoning, decision with adversarial convergence. Each has prompt + expected behavior + pass criteria.

### Training data (optional, for fine-tuners)

- `wick-training.jsonl` — 23 hand-curated analytical-mastery pairs
- `wick-refusals.jsonl` — 14 hand-curated epistemic-humility refusal pairs
- HuggingFace dataset card at `huggingface/README.md` (MIT, with data provenance + intended-use blocks)

### Portability story

Wick works **wherever markdown and chat exist** — Claude Code, Cursor, ChatGPT (web + API), Claude API, Aider, Continue.dev, LobeChat, Block goose, local Ollama / LM Studio, and any AGENTS.md-compatible runtime. The same `memory/` folder moves between all of them — no vendor lock-in.

### License

**MIT** — fork it, modify it, run it commercially, ship derivatives. Trademark notice for "Wick" and "Agora Dynamics" lives separately in `LICENSE`.

---

## Pre-release history (kept for archaeology)

### v1.0-RC (2026-04-16 through 2026-04-20)

Multi-round audit sequence that produced v1.0.0:
- Round 1: operationalized epistemic humility, added Bayes + Gigerenzer, offered-reflection pattern
- Round 2: AGENTS.md bridge, Portability positioning, 6 analytical commands, developer integration guide
- Round 3: Agora pattern imports (privacy/security, failure-log, curiosity queue, wick-scrub tool)
- Round 4: SKILL.md spec compliance + goose runtime row + benchmark layer + grill-me patterns
- Round 5: Agora Summit review; License swap to MIT, compared-to table, instinct pattern port
- Round 6 (final): philosophy recalibration — tradition-anchored but lean, anti-wordy voice rules added, Ember recall bug fixed on the Agora backend (out-of-scope for Wick package itself)

### v0.3 (2026-04-16)

- Epistemic humility section added to CLAUDE.md
- KNOWLEDGE.md expanded (game theory, Tetlock, Republic principle)
- Two-file training strategy: `wick-training.jsonl` + `wick-refusals.jsonl`
- 10 Atlas-specific geopolitical prediction pairs removed (leakage fix)
- Full quality audit: 0 identity claims, 0 confabulation triggers, 0 truncation

### v0.2 (2026-04-15)

- Deduplicated training data (58 → 33 unique pairs, 43% duplicates removed)
- Added `wick-meta.json` with honest metadata

### v0.1 (2026-04-14)

- Initial internal release
- 58 training pairs (with 43% duplication, fixed in v0.2)
- CLAUDE.md personality, KNOWLEDGE.md frameworks, README
