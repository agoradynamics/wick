# Wick — The Flame-Carrier
### Drop-In Thinking Partner for Claude Code

*Named for the wick that carries the flame. Without it, the wax is just wax. Wick turns a language model into a persistent thinking partner with memory, frameworks, and character.*

**By Agora Dynamics LLC** | [agoradynamics.dev](https://agoradynamics.dev)

---

## New to AI tools? Start here

**What Wick is, in plain English:**

Wick is an AI thinking partner that **remembers you across conversations.**

Most AI chats forget everything when you close the tab. Every new conversation starts from zero — the AI doesn't know who you are, what you're working on, what you decided last week, or what you've taught it. You type the same context again and again.

Wick is different. Wick keeps a small **`memory/` folder** on your computer — a set of plain markdown files that store what she's learned about you. Who you are. What you're building. Decisions you've made and why. Predictions you've logged. Corrections you've given her. Over time, these files grow. Sessions compound. Session 30 with Wick is meaningfully better than session 1, because she actually remembers you.

**What you get:**
- An AI that knows your field and your preferences within a few sessions
- A decision log that helps you see why past choices were made
- A prediction ledger that honestly tracks where your judgment is sharp vs. over-confident
- A framework library for thinking clearly under pressure (philosophy, decision science, forecasting, research methods)
- All plaintext files on your disk — you own the data, you can read it, edit it, delete it, or move it between tools

**What Wick is NOT:**
- A chatbot that does your thinking for you — she's a partner, not an oracle
- A subscription service — there's nothing to pay for; she's free, open source, MIT-licensed
- A vendor-locked product — she works in Claude Code, Cursor, ChatGPT, local Ollama, and 20+ other tools
- A privacy risk — nothing phones home, nothing leaves your computer, no analytics, no telemetry

**Who Wick is for:**
- Anyone doing **decisions that matter** — founders, product managers, researchers, writers, investors, strategists, engineers
- People who want an AI that **improves with use**, not one that starts from scratch every morning
- Developers who want a thinking partner inside their IDE without giving up control of their data

If that sounds useful, the three install modes below get you running in about five minutes.

---

## Quick Start — Three Install Modes

First, clone the repo:

```bash
git clone https://github.com/agoradynamics/wick.git
```

Then pick one of the three install modes:

### Mode A: Full Takeover (fresh project, no existing CLAUDE.md)

```bash
cp -r wick/* my-project/
cd my-project && claude
```

Claude reads `CLAUDE.md` at startup and **becomes** Wick. Full personality, all commands, memory system active.

### Mode B: Personality Layer (existing project with your own CLAUDE.md)

**Don't overwrite your CLAUDE.md.** Use the safe-install file:

```bash
cp wick/WICK.md my-project/
cp wick/KNOWLEDGE.md my-project/
cp wick/GROWING-WICK.md my-project/
cp -r wick/memory my-project/

# Add one line to YOUR existing CLAUDE.md:
echo "" >> my-project/CLAUDE.md
echo "Read and follow the instructions in WICK.md as your personality and operating system." >> my-project/CLAUDE.md
```

Your rules + Wick's frameworks, loaded together at startup.

### Mode C: Specialist Sub-Agent (invoke Wick on-demand)

Keep your existing CLAUDE.md completely untouched. Ship Wick as a callable specialist:

```bash
mkdir -p my-project/.claude/agents
cp wick/.claude/agents/wick.md my-project/.claude/agents/
cp wick/KNOWLEDGE.md my-project/
cp -r wick/memory my-project/
```

Now in any Claude Code session, invoke Wick with:
```
Task(subagent_type: "wick", prompt: "analyze this decision using your 5 gates: [your question]")
```

Wick runs in a fresh sub-agent context with her frameworks loaded, returns an answer, and you're back to your primary agent. Perfect for when you want Wick's analytical depth without ceding your whole session.

### Which mode to pick

| Situation | Use |
|---|---|
| Fresh project, want Wick as primary | **Mode A** |
| Existing project, want Wick as primary personality | **Mode B** |
| Existing project, want Wick as on-demand specialist | **Mode C** |
| Want all three — Wick full, layer, AND subagent | Combine A or B with C |

> **Warning:** Mode A overwrites any existing CLAUDE.md. Use Mode B or C for existing projects.

---

## Portability — Wick Goes Where You Go

**The single biggest difference between Wick and every other agent package:** Wick is not locked to a vendor.

Every runtime-specific rules system — `.cursorrules`, Cursor rules, Continue.dev config, Windsurf rules, Cline `rules.json`, OpenAI Custom GPTs, Claude Projects — is **hostage to its vendor**. Switch tools and you lose your agent, retype the rules, and rebuild your memory from scratch.

Wick is plaintext markdown. The memory files, the framework library, the commands, the personality — all of it is just files you own. That means:

| Tool | How Wick works there |
|---|---|
| **Claude Code** | Auto-reads `CLAUDE.md` — primary target, highest fidelity |
| **Cursor** | Auto-reads `CLAUDE.md` or `.cursorrules` — full Wick experience |
| **ChatGPT (web or API)** | Paste `CLAUDE.md` into system prompt or custom GPT instructions |
| **Claude API** | Use `CLAUDE.md` as system message |
| **Aider** | Reads `CONVENTIONS.md` shim — commands work as text patterns |
| **Continue.dev** | Custom context provider — shim included |
| **Local Ollama / LM Studio** | Paste `CLAUDE.md` into system prompt — works with any local model |
| **Codex / Gemini CLI / Copilot / Warp / Zed / JetBrains / RooCode / Windsurf / Factory / Devin** | Auto-read the included `AGENTS.md` — open-format bridge to 20+ tools |
| **Block goose** | Desktop/CLI MCP-native agent (~29k stars, Apache 2.0, AAIF anchor project). Reads `AGENTS.md` + `.claude/skills/` natively. Works with any LLM including local Ollama. The closest local-first deployment target for Wick. |

**What you can do that no other package allows:**
- Carry the same `memory/` folder from Claude Code → Cursor → ChatGPT → local Ollama → back to Claude Code. Not a byte lost.
- Slash commands (`/calibrate`, `/decide`, `/reflect`, all 16) work in every one of those tools — they ship as `.claude/commands/*.md` files (which Claude Code surfaces in the `/` menu) and are also pattern-recognized from `CLAUDE.md` for hosts that don't read commands files.
- Move from cloud to offline without losing your thinking partner. If Anthropic or OpenAI goes down, paste `CLAUDE.md` into a local model and keep going.
- Git-track your Wick. Version it, diff it, branch it, share it across machines.

**The one-liner:**
> *"Other agent packages lock you into one vendor. Wick is your thinking partner in any tool that can read a file — with the same memory, same commands, same compounding intelligence, across Claude, GPT, Gemini, Ollama, and 20+ runtimes."*

That's the moat. The frameworks are public. The prompts can be copied. But **portability + accumulated memory + cross-runtime commands** — that's what makes Wick a tool you *live in*, not a tool you *try out*.

---

## Compared to…

A lot of "agent packages" have shipped in the last year. Honest positioning — what Wick is, what it isn't, and what to use instead if Wick isn't the right fit.

| Package | What it does well | Where it differs from Wick |
|---|---|---|
| **[affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)** | Confidence-scored "instincts" + skill evolution + security linting for Claude Code configs. Big, comprehensive harness. | **Credit:** Wick's instinct pattern is ported from here — see `memory/instincts/README.md`. Wick is smaller, framework-library-centered, calibration-ledger focused, and cross-runtime by default. affaan-m is Claude-Code-native; Wick is runtime-agnostic via AGENTS.md. |
| **[mattpocock/skills](https://github.com/mattpocock/skills)** | 21 sharp developer skills (grill-me, to-prd, tdd, triage-issue, etc.) from a trusted TypeScript educator. | **Credit:** Wick's one-question-at-a-time + propose-your-own-answer patterns come from Pocock's `grill-me`. mattpocock/skills is a skill library; Wick is a personality + memory + framework-library + skill bundle. They compose well — install both. |
| **Cursor `.cursorrules` / rules** | Deep integration with Cursor IDE. Great if you're all-in on Cursor. | Vendor-locked. Switch IDEs and your rules + accumulated context stay in Cursor. Wick is plaintext markdown — your `memory/` folder moves with you to any runtime. |
| **OpenAI Custom GPTs** | Polished UX for building a named GPT. Discoverable in the GPT Store. | Hostage to OpenAI. Can't run on Claude, Gemini, or local Ollama. No memory export. Wick's premise is the opposite: own your context, run it anywhere. |
| **Claude Projects** | Persistent context inside claude.ai. Good for non-technical users. | Lives inside claude.ai. No file export, no version control, no cross-tool reuse. Wick is Git-trackable and runtime-portable. |
| **[Nous Research Hermes](https://hermes-agent.nousresearch.com/)** | Server-side autonomous agent across Telegram/Discord/Slack/Signal/Email. Scheduled runs, sandboxed execution, multi-channel. | Different category entirely. Hermes is infrastructure (an agent that *executes* across messaging channels). Wick is a personality (a thinking partner that *reasons* across IDE chats). They're not competitive — you can use both. |
| **Anthropic's [anthropics/skills](https://github.com/anthropics/skills)** | Canonical SKILL.md spec + official skills like `skill-creator`, `mcp-builder`, document skills (PDF/DOCX/XLSX/PPTX). | Wick's skills are spec-compliant per agentskills.io (the same spec anthropic/skills uses). Wick adds a personality layer and memory architecture on top of the skills pattern. |
| **AGENTS.md-only packages** | Works with 60k+ repos across Codex/Aider/Cursor/Zed/JetBrains/Warp/Gemini CLI/Windsurf/goose. | Wick ships its own `AGENTS.md` for these runtimes. If you only need cross-tool instructions and don't want the framework library or memory system, an `AGENTS.md`-only pack is simpler. |

**Bottom line:** if you want a thinking partner that accumulates memory across every tool you use, cites academic frameworks when they matter, and keeps you honest via a calibration ledger — that's Wick's niche. If you want a pure skill library, a Claude-Code-specific harness, or a vendor-managed persona, there are better fits above.

---

## How It Works

```
┌─────────────────────────────────────────────┐
│         CLAUDE (the base model)             │  ← General intelligence
├─────────────────────────────────────────────┤
│         CLAUDE.md (personality + gates)     │  ← Wick's operating system
├─────────────────────────────────────────────┤
│         KNOWLEDGE.md (frameworks)           │  ← Reference library
├─────────────────────────────────────────────┤
│         memory/*.md (your context)          │  ← Accumulated intelligence about YOU
├─────────────────────────────────────────────┤
│             = WICK                          │  ← The emergent result
└─────────────────────────────────────────────┘
```

**No fine-tuning required.** No API keys. No server. Just files.

Session 1 is dramatically better than vanilla Claude. Session 30 is dramatically better than session 1.

---

## What's in the Box

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Wick's identity, five operational gates, voice, 16 commands, learning engine |
| `WICK.md` | Mirror of `CLAUDE.md` for Mode B (personality layer without overwriting existing CLAUDE.md) |
| `AGENTS.md` | Open-format bridge — makes Wick work in Codex, Aider, Cursor, Zed, JetBrains, Warp, Gemini CLI, Windsurf, and 20+ other tools |
| `KNOWLEDGE.md` | Framework library: philosophy, game theory, Bayes, Gigerenzer heuristics, decision science, biases, methodology, operationalized epistemic humility |
| `GROWING-WICK.md` | Week-by-week guide for users — "zero to indispensable in 30 days" |
| `WICK-INTEGRATION.md` | Dev-facing integration guide — install modes, memory lifecycle, extensions, cross-runtime, debugging, privacy & security |
| `MEMORY-PROTOCOL.md` | Single-writer memory rule — how Wick's `memory/` coexists with a host's auto-memory (Claude Code, Cursor); ownership table, buffer→drain, relative-path rule |
| `PORTABILITY.md` | Migration procedure — make an agent fully portable by folder copy: freeze + verify host auto-memory, consolidate into `memory/`, relativize to the launch dir, verify behavior not form. Includes the **machine-awareness layer** (recognize the host, load its toolchain/quirks, or bootstrap a new one) |
| `memory/toolchain.md` + `memory/machines/` | Machine-awareness templates — toolchain requirements (call-by-name + env override) + thin per-host profiles keyed by hostname |
| `.claude/skills/` | On-demand skills — consolidate-memory, code-review, security-review, simplify, tldr, red-team, base-rate, research, catalog, changelog-summary, migrate, automate (12 skills, spec-compliant per agentskills.io) |
| `benchmark/` | Seed tasks + external-benchmark docs — targets GAIA2, Inspect AI (UK AISI), galileo-ai/agent-leaderboard |
| `tools/wick-scrub.mjs` | Pre-commit secret scanner for `memory/` — catches API keys, tokens, credentials before you push |
| `tools/wick-path-audit.mjs` | Pre-commit absolute-path scanner — flags non-portable paths in `memory/` + config before the folder moves |
| `tools/wick-freshness-audit.mjs` | Temporal-provenance scanner — every memory file stamped `Updated · host · first written`, every index row dated, and the index actually agreeing with the files. `--fix` backfills a whole layer from `git log` |
| `memory/about-you.md` | Template: who you are, your field, your preferences |
| `memory/decisions.md` | Template: decision log with framework citations |
| `memory/learning-journal.md` | Template: what Wick learns about working with you |
| `memory/domain-knowledge.md` | Template: your field's concepts, jargon, rules |
| `memory/predictions.md` | Template: prediction ledger with Brier scores |
| `memory/calibration.md` | Template: running accuracy stats |
| `wick-training.jsonl` | 26 analytical-discipline training pairs (for fine-tuning, optional) |
| `wick-refusals.jsonl` | 16 epistemic-humility pairs (for fine-tuning, optional) |
| `TRAINING-GUIDE.md` | Guide for fine-tuning a local offline model (advanced) |
| `WICK.md` | Safe-install personality file — add to existing CLAUDE.md without overwriting (Mode B) |
| `.claude/agents/wick.md` | Sub-agent definition — invoke Wick as a focused sub-agent via the Task tool (Mode C) |

---

## First Conversation

When you start Wick for the first time, it detects empty memory and runs onboarding:

```
Wick: Welcome. This is our first conversation — I don't have any memory
      files about you yet.

      Three quick questions so I can be useful right away:
      1. What do you do? What's your field?
      2. What are you working on right now?
      3. Brief answers, deep dives, or match the question?

You:  I'm a product manager at a fintech startup. We're launching a
      new payments feature next month. Match the question.

Wick: Got it. I'll remember that. What do you need help with?
```

Next session, Wick remembers everything.

---

## Commands

Sixteen slash commands. They ship as `.claude/commands/*.md` files (Claude Code surfaces them in the `/` autocomplete menu) and are also pattern-recognized from `CLAUDE.md` for runtimes that don't read commands files — Cursor, ChatGPT, Aider, local Ollama. Same behavior, two delivery paths.

### Core (6)

| Command | What It Does |
|---------|-------------|
| `/reflect` | End-of-session summary — updates all memory files, notes open questions |
| `/calibrate` | Log a prediction with probability and resolve date |
| `/decide [topic]` | Structured decision analysis through all five gates |
| `/learn [topic]` | Teach Wick your domain — it asks questions and saves knowledge |
| `/review` | Review predictions, resolve past ones, compute Brier scores |
| `/status` | Quick state check — memory files, pending predictions, calibration |

### Analytical (6)

| Command | What It Does |
|---------|-------------|
| `/premortem [project]` | "It's six months from now and this failed. What went wrong?" — preparation-for-adversity before a decision commits |
| `/steelman [position]` | Construct the strongest version of a position before disagreeing with it |
| `/frame [framework]` | Explicitly invoke a named framework from `KNOWLEDGE.md` — e.g. `/frame adversarial-convergence` |
| `/doubt [claim]` | Gate 2 (Assent) applied hard — base rate, falsifiability, alternative explanations |
| `/forget [topic]` | Graceful memory deletion with audit trail — privacy hygiene done right |
| `/audit` | Self-critique memory files — flag stale entries, contradictions, consolidation candidates |

### Lifecycle (2)

| Command | What It Does |
|---------|-------------|
| `/evolve` | Cluster `memory/instincts/*.yaml` entries and propose graduations — to skills, to `KNOWLEDGE.md`, or to `learning-journal.md` |
| `/promote [instinct-id]` | Promote a `scope: project` instinct to `scope: global` — for behaviors observed in 2+ projects |

### Memory-wiring (2)

| Command | What It Does |
|---------|-------------|
| `/checkup` | Diagnose memory wiring — detect a host auto-memory shadow layer, flag fact-class overlap, scan for absolute paths; report a posture (reports only, never edits) |
| `/sync [source]` | Drain a host/buffer memory layer into your canonical `memory/*.md`, with consent — classify by ownership, validate as data, fold with provenance |

### On-Demand Skills (12)

Skills live in `.claude/skills/` and load only when invoked — they add capability without bloating the main prompt. See `.claude/skills/README.md` for the full index.

| Skill | What it does |
|---|---|
| `wick-consolidate-memory` | Memory hygiene pass — flag duplicates, stale facts, conflicts |
| `wick-simplify` | Review code for reduction — dead code, duplication, over-abstraction |
| `wick-code-review` | Code/PR review through Wick's 5 gates, severity-classified |
| `wick-security-review` | Security-focused review — OWASP Top 10 + agentic-specific threats |
| `wick-tldr` | Faithful summarization with flagged omissions |
| `wick-red-team` | Adversarial critique of a plan (inverse of `/steelman`) |
| `wick-base-rate` | Force base-rate reasoning before a probability estimate |
| `wick-research` | Structured research with CRAAP test and source hierarchy |
| `wick-catalog` | Extract structured fields from a source — paper, web page, API doc, UI — and save a queryable record to `memory/catalog/` |
| `wick-changelog-summary` | One-paragraph narrative from a CHANGELOG.md version entry — for release notes, blog posts, social copy |

**Adding your own skills:** drop a markdown file with frontmatter into `.claude/skills/`. See the directory README for format and examples.

#### Catalog skill — worked example

Wick's `wick-catalog` skill is source-agnostic: papers, web pages, API docs, UI screenshots, tools you're evaluating. Here's the pattern applied to one category from the popular [public-apis/public-apis](https://github.com/public-apis/public-apis) list — Weather APIs:

```
You: /research weather APIs with free tier and HTTPS
Wick: [returns 3-5 candidates from public-apis/public-apis]

You: catalog OpenWeatherMap and 7Timer using wick-catalog
Wick: [creates memory/catalog/weather-openweathermap.md
       and memory/catalog/weather-7timer.md, each with the API schema —
       provider, auth, free-tier, https, cors, endpoints-of-interest, rate-limits, captured-date]
       [appends both to memory/catalog/INDEX.md]
```

Now `memory/catalog/` is a queryable index *you* own. Next time you need a weather API, ask Wick — she reads the catalog, doesn't re-research from scratch. Same pattern works for papers in a literature review, components in a UI audit, or vendors in a procurement decision.

**Why the catalog skill ships empty:** Wick doesn't pre-bake a public-APIs catalog into the package. Upstream lists update weekly; a baked-in catalog would bit-rot the day after release. Wick ships the *engine*, you point it at the sources you care about, the catalog grows where it earns.

---

## Growing Wick

Wick gets smarter every conversation through its memory system. See **[GROWING-WICK.md](GROWING-WICK.md)** for the complete week-by-week guide:

- **Week 1:** Foundation — Wick learns who you are and how you work
- **Week 2:** Depth — teach your domain, make predictions, edit memory
- **Week 3:** Specialization — extend KNOWLEDGE.md, resolve predictions, review decisions
- **Week 4:** Mastery — Wick is indispensable, calibration stats accumulating

**The lock-in:** After 30 days of accumulated decisions, predictions, domain knowledge, and calibration history — vanilla Claude feels empty by comparison.

---

## Memory & Privacy

All memory is **local files on your disk**:
- Plain markdown in the `memory/` folder
- You can read, edit, delete, or git-track them
- Nothing phones home. Nothing leaves your machine.
- You own your data completely.

### What NOT to put in `memory/`

Wick's memory files are plaintext on disk. If you commit them to a *public* repository, everything in them becomes public. Do not store:

- **Credentials:** API keys, tokens, passwords, private keys, OAuth secrets
- **Third-party PII:** real names, emails, phone numbers, addresses of people other than yourself (without their consent)
- **Production data:** customer records, internal prod database contents, unredacted logs
- **Regulated data:** PHI (HIPAA), cardholder data (PCI), anything under an NDA
- **Session tokens / cookies:** copy/pasted from dev tools

**`.gitignore` recommendation for public repos:** add `memory/` to `.gitignore`, keep a separate private repo or private branch for memory sync across machines.

**Before sharing a memory file:** run `node tools/wick-scrub.mjs memory/` (v1.0+) to flag accidental secret inclusions. The tool scans for common secret patterns (API keys, tokens, private keys, connection strings) and reports findings with line numbers.

Wick itself never reads from the network, never sends data anywhere, and never calls home. The privacy model is *your disk, your problem, your benefit.*

---

## Wick + Scheduled Triggers

Wick is a thinking partner, not a daemon — she fires when you invoke her, not on a timer. But Claude Code (and several other runtimes) ship with scheduling primitives that pair cleanly with Wick's memory system.

**The pattern:** use the host runtime's scheduler to re-invoke Wick at natural cadences, with a prompt that tells her which memory file to act on.

| Cadence | Example prompt | What Wick does |
|---|---|---|
| Weekly Monday 9am | *"Run `/review` on my predictions. Flag any past resolve date."* | Reads `memory/predictions.md`, asks for outcomes on overdue items, computes Brier. |
| End of each workday | *"Run `/reflect` on today's session. Update memory where substantive."* | Summarizes the day, offers memory updates with user consent gate. |
| Monthly first Sunday | *"Audit `memory/calibration.md`. Am I over- or under-confident by domain?"* | Groups resolved predictions by topic, reports calibration drift. |
| Before a known decision date | *"You logged a prediction resolving today. Time to assess."* | Opens the prediction, asks for the outcome, logs the Brier score. |

**How to wire it up:**
- **Claude Code:** use the `/schedule` skill or the `schedule` MCP tool — both invoke Claude Code on a cron schedule with a prompt of your choosing.
- **Other runtimes:** any scheduler that can launch the runtime with an initial prompt (OS cron → `claude -p "..."`, Cursor tasks, Gemini CLI cron) works the same way.

Wick doesn't ship a scheduler. She doesn't need one — she just works with whatever the runtime already has. The memory file is the interface; the scheduler is just *when* she reads it.

---

## FAQ

**Do I need to fine-tune a model?**
No. Wick works immediately through CLAUDE.md alone. The training pairs are included for advanced users who want to fine-tune a local offline model. See TRAINING-GUIDE.md.

**Does it work in Cursor / Copilot / other IDEs?**
Wick works in any IDE that reads project-level CLAUDE.md files. Claude Code is the primary target. Cursor and others may vary in how they process the instructions.

**How is this different from a custom system prompt?**
Three things: (1) persistent memory that accumulates across sessions, (2) operational gates that improve reasoning quality, (3) a calibration system that makes Wick accountable for its confidence. A system prompt is static. Wick compounds.

**Do I get seed predictions or example decisions shipped with the package?**
No. **Your predictions, your ledger, day one.** Wick ships with empty templates only — we never seed memory files with our own content, which would bias your ledger and leak information from our side. The `/calibrate` tool is yours from the first use. Same for decisions, failure log, and curiosity queue — all empty on install, all yours to fill.

**Can I make Wick domain-specific?**
Yes. Use `/learn [topic]` to teach through conversation, edit `memory/domain-knowledge.md` directly, or add sections to `KNOWLEDGE.md`. See GROWING-WICK.md.

**What if Wick gets something wrong?**
Correct it. Tell Wick what was wrong and why. The correction gets logged to `memory/learning-journal.md` and shapes future responses. This is the single most valuable thing you can do for Wick's growth.

---

## Advanced: Fine-Tuning

If you want to run Wick offline on your own GPU, see **[TRAINING-GUIDE.md](TRAINING-GUIDE.md)**. The package includes 37 curated training pairs (23 analytical mastery + 14 epistemic humility) as a fine-tuning seed.

---

## Version & License

**Version:** 1.7.0
**License:** [MIT](LICENSE) — fork it, modify it, run it commercially, build on it. That's the point.
**Trademarks:** "Wick" and "Agora Dynamics" are marks of Agora Dynamics LLC (see `LICENSE` for the trademark notice — nominative use is fine, branding a confusingly-similar derivative is not).
**Training data:** Same MIT license. Fine-tune away — local, commercial, derivative, whatever suits you.

**Agora Dynamics LLC** | [agoradynamics.dev](https://agoradynamics.dev)
