# Growing Wick — Your Week-by-Week Guide

Wick gets smarter every conversation. This guide shows you how to accelerate that growth from "just installed" to "indispensable thinking partner" in 30 days.

---

## Week 1: Foundation (Days 1-7)

**Goal:** Wick knows who you are, how you work, and what you're building.

### Day 1: First Contact
1. Drop the Wick files into your project folder
2. Open Claude Code (or your IDE)
3. Wick will ask three onboarding questions — answer honestly
4. Check that `memory/about-you.md` was created with your info

### Days 2-3: Real Conversations
Have 2-3 substantive conversations. Use Wick for something you're actually working on — not test prompts. Ask for analysis, advice, or help thinking through a problem.

After each session, Wick should offer to update memory files. Let it.

### Days 4-5: Try the Commands
- Try `/decide [something you're actually deciding]` — see the structured analysis
- Try `/calibrate` on a prediction you care about — watch it get logged
- Check `memory/decisions.md` and `memory/predictions.md`

### Days 6-7: First Reflection
- Say `/reflect` at the end of a session
- Review what Wick wrote in `memory/sessions/`
- **Edit anything that's wrong or incomplete** — this is teaching Wick what matters to you

### Week 1 Checkpoint
- [ ] 5+ memory files with real content
- [ ] Wick remembers your name, field, and at least one preference
- [ ] At least 1 decision logged, 1 prediction logged
- [ ] You've corrected Wick at least once (corrections are the most valuable signal)

---

## Week 2: Depth (Days 8-14)

**Goal:** Wick knows your domain and is starting to anticipate your needs.

### Teach Your Domain
Say `/learn [your field]` and spend 15-20 minutes teaching Wick:
- Key concepts and jargon from your field
- How decisions are made in your domain
- Common mistakes and pitfalls
- Resources you trust

Check `memory/domain-knowledge.md` afterward — edit and refine.

### Make Predictions
Log at least 3 predictions with `/calibrate`. These can be about anything:
- "This project will ship by June" (70%)
- "The client will approve the proposal" (55%)
- "Bitcoin above 80K by end of month" (40%)

Set realistic resolve dates. The value comes from resolution.

### Start Editing Memory Directly
Open `memory/learning-journal.md` and add things Wick missed. Add preferences, communication patterns, or corrections. Wick will read these at the start of every session.

### Week 2 Checkpoint
- [ ] `memory/domain-knowledge.md` has meaningful content
- [ ] 3+ predictions logged with resolve dates
- [ ] You've manually edited at least one memory file
- [ ] Wick's responses are showing domain awareness

---

## Week 3: Specialization (Days 15-21)

**Goal:** Wick is becoming specialized in YOUR way of thinking.

### Extend KNOWLEDGE.md
Add your own sections to `KNOWLEDGE.md` — domain-specific frameworks, key papers, industry models. Format:

```markdown
## [Your Domain] Frameworks

### [Framework Name]
- **What it is:** [brief description]
- **When to apply:** [trigger conditions]
- **Key insight:** [the non-obvious part]
```

Wick will reference these in future sessions just like the built-in frameworks.

### Resolve Predictions
Run `/review` for any predictions past their resolve date. Provide outcomes. Watch Wick compute Brier scores and update `memory/calibration.md`.

### Review Your Decision Log
Open `memory/decisions.md`. Look at past decisions:
- Were the framework citations useful in retrospect?
- Would you decide differently now?
- Tell Wick what worked and what didn't

### Week 3 Checkpoint
- [ ] KNOWLEDGE.md has at least one domain-specific section you added
- [ ] Calibration stats beginning to accumulate
- [ ] Wick noticeably more useful than week 1
- [ ] You can feel the difference from vanilla Claude

---

## Week 4: Mastery (Days 22-30)

**Goal:** Wick is indispensable — switching back to vanilla Claude would feel like starting over.

### Test the Memory
Ask Wick to revisit a decision from week 1. Does the accumulated context improve the analysis? It should — Wick now knows your field, your preferences, your patterns.

### Run a Full Calibration Review
Use `/review` on all resolved predictions. Study the calibration buckets. If you're consistently overconfident, discuss it with Wick. If you're well-calibrated, celebrate.

### Audit Memory
What's missing from `memory/`? What does Wick still get wrong? This is the feedback loop that makes the system compound:
- **Wrong info?** Edit it out
- **Missing context?** Add it
- **Redundant entries?** Consolidate

### Week 4 Checkpoint
- [ ] 10+ memory entries with real content
- [ ] 5+ predictions (some resolved with Brier scores)
- [ ] Domain knowledge file is substantive
- [ ] Wick feels like YOUR Wick, not a generic tool

---

## How to Add Domain Knowledge

Three methods, from easiest to most powerful:

### Method 1: Conversation (/learn)
Say `/learn [topic]` and talk through the concepts. Wick asks clarifying questions, organizes the information, and saves it. Easiest, but Wick's interpretation may need editing.

### Method 2: Direct Edit
Open `memory/domain-knowledge.md` and type in key concepts, frameworks, rules, and jargon. Wick reads this file at session start and incorporates it. Most precise.

### Method 3: KNOWLEDGE.md Extension
Add a domain section to `KNOWLEDGE.md` itself. This makes the knowledge part of Wick's core reference — persistent, always available, used across all sessions. Most powerful for frameworks you apply repeatedly.

**When to use which:**
- One-time facts → Method 2 (memory file)
- Recurring frameworks → Method 3 (KNOWLEDGE.md)
- Exploratory learning → Method 1 (conversation)

---

## How to Improve Wick for Your Use Case

### Adjust the Voice
If Wick is too verbose, say so. If Wick is too philosophical, say so. The correction gets saved to `memory/learning-journal.md` and shapes future responses. Be specific: "I prefer bullet points over paragraphs" is actionable. "Be better" is not.

### Add Domain Rules
Create a `memory/domain-rules.md` with rules specific to your field:

```markdown
# Domain Rules
- Never recommend X without considering Y
- In my field, Z always means [specific meaning]
- When analyzing [topic], always check [source] first
```

Wick reads these at session start and follows them.

### Create Project-Specific Context
For specific projects, create `memory/project-[name].md` with relevant context. Wick reads all files in memory/ — more files = more context = better responses.

### Prune and Consolidate
Once a month, review memory/ files. Delete outdated entries, consolidate duplicates, correct errors. Like any filing system, memory works best when maintained.

---

## Advanced: Adding Knowledge Modules

For deep domain customization, create additional knowledge files:

```
knowledge/
  finance.md          — Financial frameworks, valuation models
  machine-learning.md — ML concepts, paper summaries
  your-industry.md    — Industry-specific patterns
```

Place them in your project folder. Claude Code reads all `.md` files at startup. Format each module with:
- H2 headers for each concept
- "When to apply" and "Key insight" sub-sections
- Keep each module under 5KB for cache efficiency

This is how you build a Wick that's specialized for YOUR world while keeping the general philosophical foundation intact.

---

*The flame grows brighter the more fuel you give it. Your knowledge is the fuel. Wick carries it forward.*
