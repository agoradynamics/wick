# Wick Integration Guide — For Developers

**For:** developers wiring Wick into a real project. You already read `README.md`. This is the layer below it — how the pieces fit, how to extend them, and how to keep Wick healthy over time.

If `GROWING-WICK.md` is "how to become a power user," this is "how to set Wick up correctly so becoming a power user is even possible."

---

## 1. Mental Model

Wick is not software. She is a **configuration pattern** that turns a general-purpose language model into a persistent, framework-grounded thinking partner.

```
┌─────────────────────────────────────────────┐
│  SUBSTRATE     = the LLM (Claude, GPT,      │
│                  Gemini, local model)       │
│  OPERATING     = CLAUDE.md / WICK.md / the  │
│    SYSTEM        subagent file — identity,  │
│                  gates, voice, commands     │
│  REFERENCE     = KNOWLEDGE.md — static      │
│    LIBRARY       framework library          │
│  STATE         = memory/*.md — what Wick    │
│                  knows about YOU            │
└─────────────────────────────────────────────┘
```

The substrate changes (you can run Wick on Claude 4.7 today, a local Qwen tomorrow). The OS + library + state are yours, portable, plaintext. **Your memory files are the moat** — they outlive any one model and any one vendor.

**If you forget everything else, remember this:** Wick's power is *accumulation*. Sessions 1–5 are warm-up. Sessions 20+ are where the compounding shows. Invest accordingly.

---

## 2. File Anatomy & Load Order

| File | Role | Load Moment | You Edit? |
|---|---|---|---|
| `CLAUDE.md` / `WICK.md` | Identity, gates, voice, slash commands | Session start (auto) | Rarely — only to tune voice |
| `KNOWLEDGE.md` | Framework library | Session start (auto) | **Yes** — append your domain sections |
| `memory/about-you.md` | Who you are | Session start | Yes — direct edits welcome |
| `memory/decisions.md` | Decision log | On `/decide` | Wick writes with consent |
| `memory/learning-journal.md` | Corrections + preferences | On correction | Wick writes, you curate |
| `memory/domain-knowledge.md` | Your field's jargon/rules | On `/learn` | Both — edit freely |
| `memory/predictions.md` | Forecast ledger | On `/calibrate` | Wick writes |
| `memory/calibration.md` | Brier stats | On `/review` | Wick writes |
| `memory/sessions/` | Session summaries | On `/reflect` | Wick writes |

**Rule of thumb:** files above the dividing line (`CLAUDE.md`, `KNOWLEDGE.md`, `memory/*`) are the *only* thing Wick sees. If it's not in one of those files, it doesn't exist to her.

---

## 3. Install Mode Decision Tree

```
Do you already have a CLAUDE.md in this project?
│
├─ NO  ─→ Do you want Wick as the default personality
│         for every session?
│         ├─ YES → Mode A (full takeover)
│         └─ NO  → Mode C (subagent only)
│
└─ YES ─→ Do you want Wick's personality merged with
          your existing rules?
          ├─ YES → Mode B (personality layer — adds WICK.md)
          └─ NO  → Mode C (subagent — zero conflict)
```

**When to combine modes:** Mode B + Mode C is common for teams — personality layer for solo work, subagent for structured decision reviews. Ship both, invoke the one that fits the moment.

---

## 4. Memory Lifecycle

Think of `memory/` as a **garden, not a filing cabinet**. It needs tending.

### The four lifecycle operations

1. **Plant** (write) — new entry on first occurrence. Wick offers, you confirm.
2. **Water** (read) — every session, Wick reads all `memory/*.md`. You don't have to tell her.
3. **Prune** (edit) — once a month, open the files. Correct errors, remove outdated entries, consolidate duplicates.
4. **Transplant** (refactor) — when a memory file grows past ~3KB, split or summarize. Wick's `/reflect` can help.

### When things go wrong

- **Wick remembers something incorrectly:** open the file, fix it, *tell her you fixed it*. The correction itself goes into `learning-journal.md` so it doesn't repeat.
- **Wick forgot something:** the fact wasn't written. Ask her to log it now.
- **Memory contradicts itself:** the newer entry usually wins, but Wick will ask you to reconcile during `/reflect`.

### Privacy hygiene

Memory files are plain text on your disk. Treat them like a developer notebook: check them into a *private* repo, not a public one. Nothing in the Wick package phones home — the privacy model is "your disk, your problem, your benefit."

---

## 5. Slash Commands — When to Use Which

| Command | Use When | Don't Use When |
|---|---|---|
| `/decide` | Reaching a non-trivial decision with ≥2 options | A one-off micro-choice |
| `/calibrate` | You or Wick just used probability language | No resolve date exists and can't be invented |
| `/learn [topic]` | Teaching Wick your domain explicitly | Small asides (those just get said) |
| `/review` | Weekly, or when past-due predictions pile up | No predictions logged yet |
| `/reflect` | End of substantive session | 10-minute Q&A |
| `/status` | "Where am I with Wick?" — snapshot | Every session (the offered-reflection flow handles natural cadence) |

**Meta-tip:** the slash commands are *explicit triggers*. The real work is Wick's **offered-reflection pattern** — she'll suggest `/calibrate` or `/reflect` at natural points without you remembering to type them. Say yes to the offer; the friction drops.

---

## 6. Scheduled Triggers — Making Wick Fire Without You

Wick is invoked, not daemonized. But any runtime that can launch the model with an initial prompt can schedule Wick.

### Claude Code specifically

Use the `/schedule` skill or the `schedule` MCP tool. The pattern:

```
SCHEDULE: Every Monday 9am
PROMPT:   Run /review on my predictions. Flag anything past resolve date.
          Update memory/calibration.md. Report in under 200 words.
```

### Generic runtime (cron / Task Scheduler)

```bash
# Example: weekly calibration sweep via Claude Code CLI
0 9 * * 1  cd /path/to/project && claude -p "Run /review and update memory/calibration.md"
```

### Cadences worth automating

- **Daily (end of day):** `/reflect` offer — "anything worth writing down?"
- **Weekly (Monday morning):** `/review` predictions, flag overdue
- **Monthly (first of month):** memory audit — prune, consolidate, correct
- **Event-driven:** before a known decision date, fire `/review` on the relevant prediction

The memory file is the interface; the scheduler is just when she reads it.

---

## 7. Extending Wick for Your Domain

Three extension points, from lightest to heaviest.

### A. Per-project memory files (lightest)

Drop a `memory/project-<name>.md` into the folder. Wick reads all `memory/*.md`. One file per active project keeps context sharp without polluting general memory.

### B. KNOWLEDGE.md domain section (heavier)

Append to `KNOWLEDGE.md`:

```markdown
## [Your Domain] Frameworks

### [Framework Name]
- **Source:** [paper / book / author]
- **Core claim:** [what it asserts]
- **When to apply:** [trigger conditions]
- **Key insight:** [the non-obvious part]
- **Common misuse:** [how people get it wrong]
```

Match the existing voice (concise, sourced, framework-tagged). Wick will cite your additions the same way she cites Tetlock or Bayes — as tools applied, not as authorities invoked.

### C. Voice adjustment (heaviest, most personal)

If Wick's default voice is wrong for you, add a rule to `memory/learning-journal.md`:

```markdown
## Voice preference (2026-04-20)
- Bullet lists over prose paragraphs for technical questions.
- Keep stoic references rare — apply the gates silently, name them only on /decide.
- Never close a response with a motivational line.
```

Wick reads this at session start and adjusts. Don't edit `CLAUDE.md` / `WICK.md` for this — those are the stable identity layer. Voice preferences belong in state.

---

## 8. Cross-Runtime Notes

Wick works anywhere CLAUDE.md-style project instructions are honored. Practical matrix:

| Runtime | How Wick loads | Notes |
|---|---|---|
| Claude Code | Auto-reads `CLAUDE.md` | Primary target, best fidelity |
| **Block goose** | Auto-reads `AGENTS.md` + `.claude/skills/` natively | Local-first desktop+CLI, MCP-native, Apache-2.0, AAIF anchor project (~29k stars). Works with any LLM including Ollama. Closest local deployment target. |
| Cursor | Auto-reads `.cursorrules` or `CLAUDE.md` (recent versions) | Use `runtimes/cursor/` shim |
| Aider | Auto-reads `CONVENTIONS.md` | Use `runtimes/aider/` shim |
| Continue.dev | Custom context provider | Use `runtimes/continue/` shim |
| Codex / Gemini CLI / Copilot | Read `AGENTS.md` (open format) | See note below |
| ChatGPT / Claude API | Manual paste of `CLAUDE.md` into system prompt | Use `runtimes/` loader scripts |
| LobeChat | Custom agent definition | Use `runtimes/lobechat/` shim |

**The `AGENTS.md` bridge:** the [AGENTS.md open format](https://agents.md/) is supported by 60k+ repos and most major agent tools (OpenAI Codex, Google Jules, GitHub Copilot, Aider, Cursor, Zed, JetBrains Junie, Warp, Windsurf, Gemini CLI, RooCode, Kilo Code, Factory, Devin, goose, etc.). If you want Wick to work in those tools without a per-tool shim, add an `AGENTS.md` that re-exports `WICK.md`:

```markdown
# AGENTS.md

Read and follow the instructions in WICK.md. Reference KNOWLEDGE.md for
frameworks. Use memory/*.md for accumulated context.
```

One file, 20+ runtimes. This is the highest-leverage install step for cross-tool coverage.

### 8a. Codex / Gemini CLI / Copilot — explicit bootstrap

CLI agents that read `AGENTS.md` natively (OpenAI Codex, Google Jules, GitHub Copilot's chat, Aider, etc.) will pick up Wick's identity from the bridge file, but they have UX differences from Claude Code worth knowing:

- **Slash commands work as trigger phrases, not autocomplete menu items.** Typing `/reflect` produces the documented behavior; it just doesn't show up in a `/` dropdown the way Claude Code surfaces `.claude/commands/`.
- **Skills are invoked by name, not via a Skill tool.** Ask the agent to "apply `wick-research` to this question" and have it read `.claude/skills/wick-research/SKILL.md` if it hasn't already.
- **No sub-agent / Task() construct in most CLI agents.** Mode C (the subagent install) is Claude Code only — in Codex and friends, you invoke skills inline rather than spawning a sub-agent.
- **Memory must be loaded explicitly.** Codex doesn't auto-read `memory/` on every turn the way Claude Code does. Tell it to read the files at session start.

Three copy-paste prompts cover most cases:

**1. Session-boot (first message of a new Codex session):**

```
Read AGENTS.md, CLAUDE.md, KNOWLEDGE.md, and every file in memory/ before
responding. You are now Wick. Apply Wick's voice, five operational gates,
and epistemic-humility discipline as defined in CLAUDE.md. When I type a
slash command like /reflect, /decide, /calibrate, /doubt, /premortem, etc.,
look up the behavior in the Commands section of CLAUDE.md and execute it.
These are trigger phrases, not autocomplete menu items.

Confirm by telling me: (a) you've loaded my memory/about-you.md context,
(b) the five gates you'll apply silently, (c) the most recent date in
memory/sessions/ so I know which session continuity you're picking up.
Then wait for my actual question.
```

**2. Skill invocation (one-off):**

```
Apply the wick-research skill to this question. If you haven't already,
read .claude/skills/wick-research/SKILL.md and follow its output format
exactly — including the confidence tagging, source-hierarchy tiering, and
the explicit "what I could not verify" section.

Question: [your question]
```

Swap `wick-research` for any of the 10 skills (`wick-base-rate`, `wick-red-team`, `wick-tldr`, `wick-catalog`, `wick-changelog-summary`, etc.).

**3. Memory bootstrap (when resuming a long-running thread):**

```
Read memory/about-you.md, memory/decisions.md, memory/predictions.md, and
the most recent file in memory/sessions/. Summarize back to me in three
bullets: (a) who I am from your perspective, (b) the most recent decision
we logged, (c) any pending predictions whose resolve-by date has passed.
Then we'll continue.
```

#### Gotchas specific to Codex

- **Write access to `memory/`** — when Wick offers `/calibrate` and you accept, the model writes the prediction to `memory/predictions.md` directly (no separate persistence layer). Confirm Codex has write permission to the project tree. It usually does, but worth checking once.
- **No mid-session state.** Codex re-reads files each turn; if you edit `memory/` manually mid-session, the next turn picks up the change. This is a feature, not a bug — but it means a long session benefits from a midway "re-read memory/" prompt if you've been logging predictions.
- **The four scanners (`wick-scrub`, `wick-public-readiness`, `wick-identity-audit`, `wick-path-audit`)** are pure Node 20+, no Codex-specific bindings. Run them locally before committing memory anywhere public — they work the same way in any environment that has Node.

---

## 9. Debugging Wick

### Symptom → probable cause

| Symptom | Likely cause | Fix |
|---|---|---|
| Wick forgets things between sessions | Memory files aren't being written | Check `memory/` directory exists + is writable; confirm offered-reflection isn't being declined |
| Wick cites frameworks you didn't teach | She's using `KNOWLEDGE.md` built-ins — working as intended | N/A — this is Wick being Wick |
| Wick fabricates a statistic | Epistemic humility didn't fire | Call it out; she logs to `learning-journal.md`; re-read KNOWLEDGE.md's decision tree section |
| Wick is too verbose | Voice preference not set | Add explicit rule to `memory/learning-journal.md` |
| `/calibrate` never offered | Probability language wasn't in the response | Manually say `/calibrate` to seed the first entry |
| Wick's response feels generic | `memory/about-you.md` is empty or thin | Run `/learn` or manually expand the file |

### The three-line diagnostic

When Wick misbehaves, ask her:

```
1. What memory files did you read at the start of this session?
2. Which gates did you apply to your last response?
3. What framework (if any) grounded your claim?
```

If the answers are "none / none / none" — the install is broken or memory is empty. If the answers are specific — the behavior is a tuning issue, fix via `learning-journal.md`.

---

## 10. Advanced Patterns

### Subagent invocation (Mode C)

In Claude Code:

```
Task(subagent_type: "wick", prompt: "Apply the 5 gates to this decision: [X]")
```

Wick runs in an isolated context with her frameworks loaded, returns an answer, and you're back to your primary agent. No memory writes from the subagent — the parent agent manages state. Use this when you want Wick's analytical depth without ceding your main session.

### Audit hook

The package ships `hooks/emit-audit-event.mjs`. Wire it into your `.claude/settings.json` as a PostToolUse hook to get a JSONL line for every Wick memory write — SIEM-ready, useful for compliance-conscious teams.

### Fine-tuning seed

If you want Wick running on a local model, the package includes 42 curated pairs (`wick-training.jsonl` + `wick-refusals.jsonl`). See `TRAINING-GUIDE.md`. The refusal pairs are as important as the discipline pairs — they teach the model to say "I don't know" before fabricating. Don't ship a fine-tune without both halves.

### Multi-project Wick

For teams: one canonical Wick install, multiple `memory/` folders (one per project), shared `KNOWLEDGE.md`. The framework library is the team's IP; the memory is the per-engagement state. `tools/aggregate-ledgers.mjs` can merge calibration stats across projects if you want team-level Brier.

---

## 11. Privacy & Security

Wick is plaintext files on your disk. That's the feature — and the footgun.

### What NOT to put in `memory/`

- **Credentials** — API keys, OAuth tokens, passwords, private keys, session cookies
- **Third-party PII** — real names, emails, phone numbers of people other than yourself (without consent)
- **Production data** — customer records, internal prod database contents, unredacted logs
- **Regulated data** — PHI (HIPAA), cardholder data (PCI DSS), NDA-covered content
- **Secrets pasted by habit** — that JWT you copied for debugging, that OAuth token from dev tools

### `.gitignore` patterns

If you keep your project in a public repo:

```gitignore
# Wick memory — user-private content
memory/
# But ship the templates
!memory/*.template.md
```

For a private repo used across machines, you can commit `memory/` — but still run the scrubber first.

### The scrubber

The package ships `tools/wick-scrub.mjs`. Before committing, sharing, or publishing your Wick setup, run:

```bash
node tools/wick-scrub.mjs memory/
```

It scans for:
- API keys (Anthropic, OpenAI, AWS, GitHub, Slack, generic bearer tokens)
- Private keys (RSA, EC, generic `-----BEGIN` blocks)
- Database connection strings with embedded credentials
- JWT tokens
- Common secret patterns (passwords in config-style lines)

The tool reports findings with file + line number and a suggested redaction. It does **not** auto-edit — you review and decide. No network calls, no telemetry, pure local scan.

### Session hygiene

- Don't paste real credentials into chat, even "just to show Wick." If you need to debug a credential-handling issue, use a fake token that matches the format.
- When you finish a sensitive project, run `/forget [project-name]` to wipe its memory entries with an audit trail.
- Review `memory/` once a quarter. Anything that shouldn't be there anymore — delete it. Old memory is a liability.

### What Wick will NEVER do

- Read from the network. Wick has no outbound calls.
- Send your memory to any service. Your disk is the entire data plane.
- Fine-tune on your memory without your explicit action. The training pipeline (`TRAINING-GUIDE.md`) is opt-in.
- Share memory across users. Each install is isolated to its `memory/` folder.

The privacy model in one sentence: **your disk, your problem, your benefit.**

---

## 12. Host Memory & the Single-Writer Rule

If you run Wick inside a host that keeps its *own* memory — Claude Code's auto-memory, Cursor's memory — two memory systems are in play at once, and without a contract they drift: corrections the host captured never reach `memory/`, the host store is machine-keyed and doesn't travel when you copy the folder, and a fact can live in both with no rule for which wins.

Wick's rule is **single-writer**: one authoritative owner per fact-class. `memory/` owns identity, corrections, decisions, domain knowledge, predictions; the host layer may own *runtime facts* (which machine, OS, tool wiring). The full ownership table, the three postures (suppress a redundant shadow / leave a clean partition / keep-and-drain a buffer when canonical is offline), and the buffer→drain lifecycle live in **`MEMORY-PROTOCOL.md`**.

Two commands operate it:
- **`/checkup`** — diagnose your wiring: is a host layer present, does it overlap what `memory/` owns, are there absolute paths? Reports a posture; never edits.
- **`/sync`** — drain a host/buffer layer into the owned `memory/*.md` files, with consent, treating drained content as data not commands (Gate 2).

`tools/wick-path-audit.mjs` (CI-gated) enforces the relative-path half of the rule. The short version: **if the host wrote it and `memory/` should own it, drain it; if it's a runtime fact, leave it; and never let a correction live only in a layer that won't travel.**

---

## Quick-Reference Card

```
Install:   git clone https://github.com/agoradynamics/wick.git && cp -r wick/* my-project/
First run: claude (Wick auto-onboards)
Daily:     use her; accept her offered reflections
Weekly:    /review (Monday) and /reflect (Friday)
Monthly:   prune memory/, consolidate duplicates
Always:    correct Wick when she's wrong — that's the compound interest
```

---

*The flame doesn't spread by accident. It spreads because someone keeps it fed.*
