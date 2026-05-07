# Wick Changelog

## v1.0.3 (2026-05-06) — operational/ scrub and rewrite

### Fixed (security / hygiene)

- **Removed `operational/ember-advisory.md`** and **`operational/vigil-protocols.md`** from the public repo. These files contained internal-deployment specifics — model identifiers, local endpoint URLs, and an internal-perspective critique of a sibling tool's failure modes — that should never have shipped publicly. The architectural patterns they captured (when to consult a separate strategic advisor, the operator-discipline habits) are preserved in clean, generic replacements; the leaky specifics are gone.
- **Removed `operational/VENDORED-FROM.md`.** Wick's `operational/` is Wick's. The directory is no longer vendored from any external source.
- **Soft-edited the v1.0.0 build-history bullets** to remove references to internal review processes that were not appropriate for public changelog history.

### Changed

- **`operational/advisor-pattern.md`** (new) — generic strategic-advisor consultation pattern. Pluggable to any model the user configures (local Ollama, hosted API, a different Claude or GPT instance, a human in chat). No model-specific or endpoint-specific details. Replaces the old advisory file.
- **`operational/operator-discipline.md`** (new) — the Five Operational Gates and watchful-operator non-negotiables, framed as Wick's own discipline. Replaces the old protocols file.
- **`wick-meta.json`** — removed `protocols_source` and `protocols_version` fields (Wick's `operational/` is self-contained, not vendored).

### Note on git history

These three files were committed in v1.0.2 and have lived in the public repo for a brief window. HEAD is now clean; `git log` history retains the prior versions for transparency. If your install of Wick was synced during that window, re-clone or `git pull` to get the sanitized HEAD.

## v1.0.2 (2026-05-06) — Changelog-summary skill added

### Added

- **`wick-changelog-summary` skill** — produces a one-paragraph narrative summary of a `CHANGELOG.md` version entry, suitable for release announcements, blog posts, or social copy. Defaults to the latest version; takes an optional version argument like `v1.0.0`. Preserves technical specifics (file paths, command names, counts) rather than vaguifying them. Refuses to invent content if the requested version isn't in the file. Validates clean against agentskills.io spec.
- **Skills count: 9 → 10.** All 10 pass `skills-ref validate` (v0.1.5).

### Note

This is the first skill built end-to-end through the new `/wick` execution path — Wick now plans and ships in a single turn rather than handing off to the operator. Internal scaffolding change for Ryan's local setup; no impact on customer installs (which always had Wick as the sole assistant).

## v1.0.1 (2026-05-06) — Commands shipped as files; catalog skill added

### Fixed

- **Slash commands now ship as `.claude/commands/*.md` files.** v1.0.0's changelog promised 14 slash commands, but they only existed as trigger phrases inside `CLAUDE.md`. Mode C installs (sub-agent only, no `CLAUDE.md`) had no working commands; Mode A/B installs worked but commands didn't appear in Claude Code's `/` autocomplete menu. This release ships all 14 as proper command files: `reflect`, `calibrate`, `decide`, `learn`, `review`, `status`, `premortem`, `steelman`, `frame`, `forget`, `doubt`, `audit`, `evolve`, `promote`.
- **README count corrections** — fixed three references to "12 commands" that should have read 14 (lines 131, 187, and the Commands section header).

### Added

- **`wick-catalog` skill** — extract structured fields from a source (paper, web page, API doc, UI screenshot, tool) and save a queryable record to `memory/catalog/<slug>.md`. Domain-agnostic. Complements `wick-research` (find) and `wick-tldr` (summarize) by adding a structured-index layer. Includes a worked README example pointing the skill at the [public-apis/public-apis](https://github.com/public-apis/public-apis) Weather category. Ships empty by design — Wick provides the engine, users build the catalog they care about.
- **Skills count: 8 → 9.** README and skills/README updated.

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
- Round 3: privacy / security pattern imports (failure-log, curiosity queue, wick-scrub tool)
- Round 4: SKILL.md spec compliance + goose runtime row + benchmark layer + grill-me patterns
- Round 5: license swap to MIT, compared-to table, instinct pattern port
- Round 6 (final): philosophy recalibration — tradition-anchored but lean, anti-wordy voice rules added

### v0.3 (2026-04-16)

- Epistemic humility section added to CLAUDE.md
- KNOWLEDGE.md expanded (game theory, Tetlock, decision-science framing)
- Two-file training strategy: `wick-training.jsonl` + `wick-refusals.jsonl`
- 10 domain-specific prediction pairs removed from prior drafts (leakage fix)
- Full quality audit: 0 identity claims, 0 confabulation triggers, 0 truncation

### v0.2 (2026-04-15)

- Deduplicated training data (58 → 33 unique pairs, 43% duplicates removed)
- Added `wick-meta.json` with honest metadata

### v0.1 (2026-04-14)

- Initial internal release
- 58 training pairs (with 43% duplication, fixed in v0.2)
- CLAUDE.md personality, KNOWLEDGE.md frameworks, README
