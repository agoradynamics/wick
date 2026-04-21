# Wick — Benchmark Harness

How Wick is evaluated. Two layers: **seed tasks** for smoke-testing the personality during development, and **external benchmarks** (GAIA2, Inspect AI) for comparable scorecards against the wider agent landscape.

---

## Why benchmark Wick

Most agent packages ship without any numbers. "Trust me it's good" is the genre. Wick ships with a scorecard because:

1. **Calibration requires feedback.** Same principle as `/calibrate` — the only way to know if Wick is good is to measure her against something external.
2. **Commercial credibility.** "Here are the numbers an independent government-grade harness produced" beats "it works in my chats."
3. **Regression detection.** As we tune Wick's gates, voice, and skills, benchmark drift surfaces what broke.

---

## Layer 1 — Seed Tasks (smoke tests, local)

Three small tasks in `seed-tasks/` that exercise Wick's core behavioral surface. Run them by pasting each task's prompt into a Wick session and checking the response against the expected behavior.

| Task | Exercises | Expected edge |
|---|---|---|
| `task-01-epistemic-humility.md` | Level-3 humility when asked for a specific statistic Wick shouldn't know | Refuses to fabricate; offers principled approach; offers to log curiosity |
| `task-02-base-rate-reasoning.md` | Gate 2 (Assent) + base-rate anchoring before probability estimate | Rejects free-floating gut estimate; demands reference class; adjusts from base |
| `task-03-decision-with-convergence.md` | Gate 4 (Adversarial Convergence) on a non-trivial decision | Cites 2+ adversarial frameworks; names where they agree/diverge |

These run in under 5 minutes manually. No automation (yet). Run them before any CLAUDE.md / WICK.md / KNOWLEDGE.md change gets committed.

---

## Layer 2 — External benchmarks (comparable scorecards)

### UK AISI `inspect_ai` — the government-grade harness

**Repo:** `github.com/UKGovernmentBEIS/inspect_ai` — MIT license
**Docs:** `inspect.aisi.org.uk`
**Used by:** Anthropic, DeepMind, xAI (Grok) for internal evaluations.

Inspect AI is the most rigorous open-source agent-evaluation harness currently shipping. 200+ pre-built evaluations, supports Claude Code / Codex CLI / Gemini CLI as subjects, sandboxing via Docker / Kubernetes / Modal / Proxmox.

**Why it matters for Wick:** shipping a Wick-on-Inspect scorecard is the single highest-leverage credibility move. It transforms "our agent is good" into "here are Inspect scores on GAIA2, SWE-Bench, and Cybench."

**Install (once):**
```bash
pip install inspect-ai
```

**Run Wick against an Inspect eval:**
```bash
# Example: agentic Q&A benchmark
inspect eval inspect_evals/gaia --model anthropic/claude-sonnet-4.6 \
  --system-message "$(cat CLAUDE.md)"
```

(The exact invocation will depend on how you're hosting Wick — the Claude Code runtime, an Anthropic API call with `CLAUDE.md` as system prompt, or a local Ollama model with the Wick prompt loaded.)

### GAIA2 — the current SOTA agentic benchmark

**Dataset:** `huggingface.co/datasets/meta-agents-research-environments/gaia2`
**Blog:** `huggingface.co/blog/gaia2`
**Successor to:** the original GAIA (now considered legacy).

GAIA2 has 800 validation scenarios across 5 splits:
- **execution** — multi-step tool-use correctness
- **search** — information retrieval under ambiguity
- **adaptability** — responding to scenario changes mid-task
- **time** — long-horizon planning and memory
- **ambiguity** — resolving unclear instructions

**Wick's expected edge:** the `ambiguity` and `time` splits reward agents that can say "I don't know" or "this depends on X — which X matters?" rather than guessing. Wick's epistemic-humility decision tree and offered-curiosity-queue are exactly the patterns these splits measure.

Expect Wick to underperform on pure-execution splits vs. purpose-built coding agents (OpenHands, Devin) — that's fine, Wick is a thinking partner, not an autonomous engineer.

### galileo-ai/agent-leaderboard — less gamed, closer to deployment

**Spaces:** `huggingface.co/spaces/galileo-ai/agent-leaderboard`
**Repo:** `github.com/rungalileo/agent-leaderboard`

Business-scenario tool-use ranking. Less academic than GAIA2, closer to real commercial deployment signal. Worth tracking once Wick has stabilized.

---

## Running the full scorecard

```bash
# 1. Seed smoke test
#    Open a Wick session, paste each seed-tasks/*.md prompt, verify behavior.

# 2. Inspect AI evaluation
pip install inspect-ai
inspect eval inspect_evals/gaia \
  --model anthropic/claude-sonnet-4.6 \
  --system-message "$(cat CLAUDE.md)" \
  --output-dir .benchmark-results/

# 3. Record results
#    Tag results with: Wick version, model, date, Inspect version.
#    Commit JSONL to .benchmark-results/ if this is your private Wick;
#    share anonymized summaries publicly.
```

---

## What Wick does NOT claim

- Not a SWE-Bench contender. Wick is not a code-execution agent.
- Not a multi-step-tool-use specialist. Wick's strength is reasoning quality, not tool-call chains.
- Not a SOTA pure-IQ benchmark runner. Wick is a *thinking-partner personality layer*; her value shows in sustained use across sessions, not one-shot tests.

Her edge is on calibration, epistemic discipline, and framework-grounded decision support — exactly where generic LLMs hallucinate confidently. That's what the seed tasks and GAIA2 ambiguity/time splits capture.

---

## Results log

Anonymized benchmark results will be posted as Wick stabilizes. As of v1.0-RC, no externally-published scorecards yet — seed tasks only.

---

*Numbers make a package. Pick a yardstick and hold yourself to it.*
