# Wick Changelog

## v1.0.5 (2026-05-07) — Verify-final-state rule + temporal-trust framing

The lesson from v1.0.4's CI catch, codified into the discipline.

### Added (operational discipline)

- **`operational/operator-discipline.md` non-negotiable rule #8**: *"Verify the final state, not the working state. Every edit between your last verification and your commit is an unverified change."* Re-vendored from `agora-dynamics/protocols/` v1.1.0.
- **New section: "Temporal Trust — the failure mode rule #8 catches"**, naming the cognitive error explicitly. Verification is a snapshot at time T; subsequent edits invalidate it. The mental model: every edit invalidates every prior check; your "done" state is the state you committed, not the state you last looked at. Pre-commit hooks become load-bearing infrastructure under this rule, not a nice-to-have.
- **Pre-ship checklist** updated with re-verification step.

### Added (training corpus)

- **3 new analytical-mastery pairs** in `wick-training.jsonl` demonstrating the verify-before-claim pattern: a "ready to commit?" dialogue that catches the temporal-trust assumption, a "comment-only edit" pair establishing that even comment patches require re-verification, and a meta-explainer of the three-layer model (pre-commit hook, CI gate, mental model).
- **2 new epistemic-humility refusal pairs** in `wick-refusals.jsonl`: refusing to claim "the latest edit didn't break anything" without re-running, and refusing to skip a re-scan when a new file was added to a previously-scanned PR.
- Training totals: 26 mastery + 16 refusal = **42 pairs total** (was 37).

### Why this matters

The v1.0.4 CI catch was the canonical example of the gap this rule closes. The CHANGELOG entry describing v1.0.4's fixes itself triggered the public-readiness scanner — the scanner had been run before the CHANGELOG edit but not after. Textbook temporal-trust failure. CI caught what local discipline missed; this rule and the training pairs that demonstrate it are what make the discipline *mechanical* rather than reliant on memory.

If your fork or downstream package wants to encode this rule, the `agora-dynamics/protocols/` v1.1.0 source is canonical, the vendored copy in `operational/` is the local artifact, and the new training pairs in `wick-training.jsonl` + `wick-refusals.jsonl` are the corpus for fine-tuning models that should embody the discipline rather than just have it documented.

## v1.0.4 (2026-05-06) — Built the immune response

### Added (the discipline lives in code now, not just in heads)

- **`tools/wick-public-readiness.mjs`** — sibling to the existing `wick-scrub.mjs` (which catches credentials). The new scanner catches the *other* failure mode that produced the v1.0.2 leak: internal vocabulary that should never have been vendored into a public repo. Reads `.wick-blocklist.json`, supports per-file allowlist for known-legitimate uses, exits 1 on findings. Use locally before any commit, or trust the CI gate (below).
- **`.wick-blocklist.json`** — default ship-safe blocklist with five categories (model-identifiers, infrastructure-endpoints, internal-codenames, internal-roles, internal-apprentice-names). Each pattern carries a `reason` string so failure messages explain *why* a term is blocked, not just *that* it is. Forks should add their own internal-vocabulary patterns and commit the modified config.
- **`.github/workflows/public-readiness.yml`** — runs both scanners (`wick-public-readiness` + `wick-scrub`) on every PR and main push. PRs that introduce a blocklisted term fail the check.
- **`.github/workflows/validate-skills.yml`** — runs `skills-ref validate` on every skill on every PR. Today `wick-meta.json` self-attests "10/10 skills pass"; this workflow makes that attestation automatic and falsifiable.
- **`SECURITY.md`** — vulnerability disclosure path, scanner-stack documentation, what Wick stores about you (and what it doesn't), what to still treat with care.
- **`CONTRIBUTING.md`** — what kinds of contributions are most welcome, what's unlikely to land, the PR checklist (run both scanners, validate skills, update CHANGELOG).
- **`CODE_OF_CONDUCT.md`** — direct, warm, zero patience for bad-faith argument. Standard governance hygiene for a public MIT repo with traction.
- **Three seed instincts** in `memory/instincts/` — `summarize-error-traces-root-cause-first`, `offer-calibrate-on-probability-language`, `propose-before-asking-blank`. Replace with your own as you accumulate observations; they exist so a new install doesn't feel echoey on day one.

### Fixed (closing the small residuals from v1.0.3)

- **`CLAUDE.md:103` and `WICK.md:103`** — closing rule reworded so it no longer names the publisher's internal context inside the don't-leak rule itself. Same intent, no internal-vocabulary leak. The original wording named what it was protecting *while* protecting it — self-defeating.
- **`CLAUDE.md:99` and `WICK.md:99`** — redirect line reworded so the "if asked about [internal]" trigger no longer names the internal context. Same behavior, less leak surface.

### The story this release tells

The v1.0.2 leak happened because there was no check that should have existed. v1.0.3 was the apology — files removed, history honest, the embarrassment named. v1.0.4 is the discipline — the scanner, the CI, the governance docs that point at the scanner. Without the scanner, every future commit relies on whoever runs it remembering. With the scanner, the discipline is in code, and "remembering" stops being load-bearing.

If your fork or downstream package needs additional patterns, edit `.wick-blocklist.json`. The default ships with patterns relevant to upstream Wick; your context will need its own.

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
