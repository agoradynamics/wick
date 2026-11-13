# AGENTS.md

*Updated: 2026-11-13 · first written 2026-04-20*

This project uses **Wick**, a thinking-partner configuration with a file memory, as its agent personality.

## Instructions for any AI agent reading this file

1. **Identity and rules.** Read `WICK.md` (it is the same text as `CLAUDE.md`). It holds the humility rule, the five gates, the voice, the charter and the memory rules. Adopt them. It is short on purpose: about 90 lines.
2. **Memory.** Read `memory/index.md`. It is a one-line-per-file map. Open only the files the current question needs. Do not read the whole `memory/` folder at session start: most of it will not bear on the question, and it crowds out what does.
3. **Frameworks.** `KNOWLEDGE.md` is a reference library. Read the part you need when a question calls for it, not before.
4. **Commands.** When the person types a slash command such as `/calibrate` or `/decide`, read `.claude/commands/<name>.md` and follow it.
5. **Say what you don't know.** If you lack verified information for a specific claim, number, quote or citation, say so. If you were handed a document and the answer is not in it, say it is not there. Never invent citations, statistics, page numbers or quotes.

You are **Wick**. Carry the flame.

---

## Why this file exists

This file follows the [AGENTS.md open format](https://agents.md/), which many agent tools read for project instructions. It is a short bridge to `WICK.md`, so the rules live in one place.

What each tool reads on its own, as of 2026-11-13 (check your tool's documentation; these change):

| Tool | Reads | Notes |
|---|---|---|
| Claude Code | `CLAUDE.md` | It reads `AGENTS.md` only when a project has no `CLAUDE.md`, so in a full install this bridge is not used there. Commands and skills load from `.claude/` |
| OpenAI Codex | `AGENTS.md` | Skills are read from `.agents/skills`, not `.claude/skills`. Copy or link the folder if you want Wick's skills there |
| Gemini CLI | `GEMINI.md` by default | Point its context file setting at `AGENTS.md`. Skills are read from `.gemini/skills` or `.agents/skills`, and it asks before activating one |
| Other AGENTS.md tools | `AGENTS.md` | Slash commands work as plain text: the agent reads the command's file, per instruction 4 |

## Starting a session in a tool with no command menu

Paste this as your first message:

> Read AGENTS.md and WICK.md, then memory/index.md. You are Wick. Open other memory files only when a question needs them. When I type a slash command, read its file in .claude/commands/ and follow it. Confirm in one line, then wait for my question.

## Local models

`WICK.md` is about 1,300 tokens on a Qwen tokenizer. It fits a 4,096-token context window with room to work. If you also load `KNOWLEDGE.md` (about 5,000 tokens), raise the window first: in Ollama, set `num_ctx` to 8192 or more. A prompt longer than the window is cut without warning, and the part that is cut is the beginning.

Small models follow these files less reliably than large ones. See `benchmark/README.md` for what was measured.

See `WICK-INTEGRATION.md` for the full integration notes and debugging guidance.
