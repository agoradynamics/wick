---
name: wick-changelog-summary
description: Produce a one-paragraph narrative summary of a CHANGELOG.md version entry — suitable for release announcements, blog posts, or social copy. Preserves technical specifics (file paths, command names, counts) rather than vaguifying them. Defaults to the latest version; optionally takes a version like "v1.0.0". Refuses to invent content if the version isn't in the file.
license: MIT
---

# Wick — Changelog Summary

Turns a structured CHANGELOG entry into a paragraph a human can read aloud. The opposite of bullet-list compression — same content, narrative shape.

## When to invoke

- Drafting a release announcement, blog post, or social post about a new version
- A teammate or user asks "what shipped in vX.Y.Z?" and you want to answer in prose, not a bullet dump
- Compressing multiple changelog entries down for a "what changed this quarter" summary
- Filling the body of a GitHub Release from the CHANGELOG entry without copy-pasting the bullets

## What Wick does

1. **Read `CHANGELOG.md`** from the project root (or the path you specify).
2. **Identify the target entry** — by default the topmost `## v...` block. If invoked with a version argument like `v1.0.0`, find that exact heading. If not found, say so honestly — never fabricate.
3. **Extract the load-bearing facts**: version number, release date, headline change, supporting changes, file paths/command names/counts that matter.
4. **Compose 3-5 sentences** in narrative prose. Lead with the version + headline. Follow with the *why* (what was broken, what's now possible). Close with one specific so the reader can verify (a filename, a number, a commit hash).
5. **Preserve technical specifics.** Don't downgrade `wick-catalog skill` to "a new feature." Don't downgrade `9/9 skills validate clean` to "validation improvements." Specifics are the point.
6. **Apply Gate 2 (Assent)** — every claim in the paragraph must be sourced from the CHANGELOG entry. If the entry is sparse, the paragraph is sparse. Don't pad.

## Output format

```
[3-5 sentence paragraph in flowing prose]
```

That's it. No headers, no bullets, no preamble. The output is meant to be pasted directly into a release page, a Discord post, or a tweet thread.

If the user asks for *multiple* versions in one summary (e.g., "summarize v1.0.0 through v1.0.2"), produce one short paragraph per version, each separated by a blank line.

## Worked example

Given a CHANGELOG entry like:

```
## v1.0.1 (2026-05-06) — Commands shipped as files; catalog skill added
### Fixed
- Slash commands now ship as .claude/commands/*.md files...
### Added
- wick-catalog skill — extract structured fields from a source...
- Skills count: 8 → 9.
```

Wick produces:

> Wick v1.0.1 (May 6, 2026) brings the slash commands the v1.0.0 changelog promised: all 14 of them — `/reflect`, `/calibrate`, `/decide`, and the rest — now ship as proper `.claude/commands/*.md` files, so they appear in Claude Code's `/` autocomplete menu and work in Mode C sub-agent installs that don't load `CLAUDE.md`. The release also adds a ninth on-demand skill, `wick-catalog`, which extracts structured fields from papers, web pages, API docs, or UI screenshots and writes them to a queryable record under `memory/catalog/`. Three "12 commands" references in the README were corrected to 14, the audit status was honestly flagged for revalidation, and a worked example points the new catalog skill at the public-apis/public-apis Weather category.

## Framework grounding

Aristotelian *phronesis* — narrative is the form humans actually use to remember change. Bullet lists are reference material; paragraphs are mnemonic. Stoic discipline of assent — every clause is sourced from the changelog, not invented. Memento mori in operational form — a version paragraph is a small obituary for the previous version: what it lacked, what replaced it, what's next.

## What Wick will never do

- Invent changes that aren't in the CHANGELOG to make the paragraph sound bigger
- Strip technical specifics to make the paragraph "more readable" — readability without specifics is marketing copy, and we ship engineering
- Summarize a version that isn't in the file. If asked for `v9.9.9` and the file stops at `v1.0.1`, say so directly: *"v9.9.9 isn't in CHANGELOG.md — latest is v1.0.1. Want me to summarize that instead?"*
- Pad. If a version's entry is two bullets, the paragraph is two sentences. Length follows substance, not the other way around.
