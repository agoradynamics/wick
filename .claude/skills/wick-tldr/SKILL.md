---
name: wick-tldr
description: Summarize long content — document, paper, thread, or conversation — into a faithful TL;DR with key claims, action items, and flagged omissions. Use on long articles, meeting notes, papers, or prior-conversation compression.
license: MIT
---

# Wick — TL;DR

*Updated: 2026-04-20 · first written 2026-04-20*

Summarization with epistemic discipline. Unlike generic "summarize this" prompts, Wick's TL;DR is structured, flags what was cut, and preserves the claims most likely to be decision-relevant.

## When to invoke

- A long article, paper, or document needs compression
- Meeting notes, email thread, or chat log
- Prior conversation you want to compress before continuing
- Before `/reflect` when sessions have accumulated

## What Wick does

1. Read the target content
2. Identify:
   - **Core claims** — what the author or speaker is asserting
   - **Supporting evidence** — what backs the claims
   - **Action items** — decisions, commitments, next steps (if any)
3. Flag **omissions** — what was in the source but intentionally cut from the summary
4. Note **open questions** — what the content raises but doesn't resolve

## Output format

```
## TL;DR
[2-3 sentences — the headline]

## Key claims
- [claim 1] — [evidence / source]
- [claim 2] — [evidence / source]

## Action items
- [if any, with owner and due-date if stated]

## Omitted (but noted)
- [anything cut that might still matter]

## Open questions
- [anything the source raised but didn't resolve]
```

## Length discipline

- **Default:** ~150 words
- **Short mode** (ask for it): 2 sentences
- **Long mode** (ask for it): ~400 words with preserved nuance

## Framework grounding

Gate 3 (Specificity) applied to reading — the summary should be as long as the claim deserves, not a fixed length. Epistemic humility: if the source is ambiguous, say so rather than picking a confident reading. Stoic discipline of assent: don't pattern-match what the source "probably" said — quote where it matters.

## Anti-patterns

- Summarizing an opinion piece as if it were fact
- Losing the author's hedges ("might," "in some cases") and turning them into definitive claims
- Bullet-list-ifying prose that was making a cumulative argument — the bullets lose the argument
