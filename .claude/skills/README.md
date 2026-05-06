# Wick Skills

Skills are on-demand capabilities Wick can invoke without bloating the main prompt. They load when called, stay out of the way when not.

## Index

| Skill | When to use |
|---|---|
| `wick-consolidate-memory` | Monthly memory hygiene — flag duplicates, stale facts, conflicts |
| `wick-simplify` | Review code for reduction — dead code, duplication, over-abstraction |
| `wick-code-review` | Code/PR review through Wick's 5 gates, severity-classified |
| `wick-security-review` | Security-focused review — OWASP Top 10 + agentic-specific threats |
| `wick-tldr` | Faithful summarization with flagged omissions |
| `wick-red-team` | Adversarial critique of a plan (inverse of `/steelman`) |
| `wick-base-rate` | Force base-rate reasoning before a probability estimate |
| `wick-research` | Structured research with CRAAP test and source hierarchy |
| `wick-catalog` | Extract structured fields from a source and save a queryable record to `memory/catalog/` |

## Relationship to slash commands

Wick's 14 slash commands (`/reflect`, `/calibrate`, `/decide`, `/learn`, `/review`, `/status`, `/premortem`, `/steelman`, `/frame`, `/doubt`, `/forget`, `/audit`, `/evolve`, `/promote`) ship as `.claude/commands/*.md` files — they appear in Claude Code's `/` autocomplete menu and are also pattern-recognized from the main `CLAUDE.md` on every session.

Skills are **on-demand** — they load only when you invoke them. This keeps the core prompt lean while making specialized capabilities available when needed.

## Format — compliant with Anthropic Agent Skills spec

Every skill is a **directory** named after the skill, containing a `SKILL.md` file with YAML frontmatter. Compliant with the [agentskills.io specification](https://agentskills.io/specification) (Linux Foundation / AAIF), so these skills validate cleanly via `skills-ref validate` and can be redistributed to any spec-compliant agent host.

```
.claude/skills/
  ├── wick-consolidate-memory/
  │   └── SKILL.md
  ├── wick-simplify/
  │   └── SKILL.md
  └── ...
```

Each `SKILL.md` frontmatter:

```markdown
---
name: skill-name               # Required. Must match the parent directory name.
description: What this skill does and when to use it. Max 1024 chars.
license: Personal use          # Optional.
compatibility: Claude Code     # Optional — only if environment requirements exist.
---

# Skill Name

Instructions for what Wick does when invoked.
```

## Adding your own skills

1. Create a new directory under `.claude/skills/` named `your-skill-name` (lowercase, hyphens allowed, no leading/trailing hyphen).
2. Inside it, create `SKILL.md` with the required `name:` (matching directory name) and `description:` fields.
3. Write the instructions in Wick's voice (direct, framework-grounded, humility-disciplined). Reference `KNOWLEDGE.md` for framework citations.
4. Optional: add a `scripts/`, `references/`, or `assets/` folder inside your skill directory for scripts, extended docs, or templates — see the spec for conventions.
5. Validate with `skills-ref validate .claude/skills/your-skill-name` if you have the ref library installed.

Examples of domain-specific skills you might add:
- `wick-spec-review` — review a product spec
- `wick-interview-prep` — structured interview question drills
- `wick-postmortem` — after-the-fact incident analysis
- `wick-regulatory-check` — compliance review for your specific framework

See `../../WICK-INTEGRATION.md` §7 "Extending Wick" for patterns.
