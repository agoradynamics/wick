---
name: wick-catalog
description: Extract structured fields from a source — paper, web page, API doc, or UI screenshot — and save a queryable record to memory/catalog/. Domain-agnostic. Use to build a personal index of things you'll want to find again, compare side-by-side, or reference in later decisions. Complements wick-research (which finds) and wick-tldr (which summarizes) by adding a structured-index layer.
license: MIT
---

# Wick — Catalog

Extract, structure, save. The skill that turns "I read this once" into "I can find this in three seconds."

`wick-research` finds. `wick-tldr` summarizes. `wick-catalog` **indexes** — pulls the load-bearing fields from a source and writes them to a queryable record in `memory/catalog/`. Domain-agnostic: papers, web pages, API docs, UI screenshots, tools you're evaluating, products you're comparing.

## When to invoke

- You're tracking a set of things you'll want to compare later (papers in a literature review, APIs in a build evaluation, products in a vendor selection)
- A `/learn` session produced findings worth indexing for future retrieval
- A `/research` close-out has structured findings that belong in a queryable shape, not a prose note
- You're cataloging UI patterns, prompt templates, or design references you might reuse
- Anything where the question "what did I find about X?" will be asked again later

## What Wick does

1. **Identify the source type** — paper / web page / API doc / UI / tool / other. The schema adapts.
2. **Extract the schema fields** for that type (templates below). If a field is unknown, mark `unknown` — never fabricate.
3. **Write the record** to `memory/catalog/<slug>.md` where slug is a short, lowercase, hyphenated identifier (e.g., `weather-openweathermap`, `paper-acemoglu-2012-resource-wars`).
4. **Update the catalog index** at `memory/catalog/INDEX.md` — append a one-line entry: `- [<title>](<slug>.md) — <type>, <one-line hook>`.
5. **Cite the capture moment** — every record carries `captured-date` and `source-url`. Stale catalogs are worse than no catalog; the date is the user's signal to recheck.
6. **Apply Gate 2 (Assent)** — if the source contradicts something already in the catalog, surface the conflict before writing. Don't silently overwrite.

## Schema templates

### Type: paper
```yaml
type: paper
title:
authors: []
year:
venue:           # journal, conference, preprint server
source-url:
captured-date:
tier:            # 1 peer-reviewed | 2 institutional | 3 working-paper | 4 commentary
core-claim:
methodology:
key-evidence: []
limitations: []
cited-frameworks: []
my-take:         # why I'm cataloging this — what I'd use it for
```

### Type: web-page
```yaml
type: web-page
title:
publisher:
author:
published-date:
source-url:
captured-date:
core-claim:
key-points: []
quoted-evidence: []   # short verbatim quotes (under 15 words each, attributed)
my-take:
```

### Type: api
```yaml
type: api
name:
provider:
source-url:           # docs URL
category:
auth:                 # none | apikey | oauth | other
free-tier:            # yes / no / limited
https:                # yes / no
cors:                 # yes / no / unknown
captured-date:
endpoints-of-interest: []
rate-limits:
notes:
```

### Type: ui
```yaml
type: ui
title:                # what UI/component
source-url:           # page where the screenshot was taken
captured-date:
pattern:              # e.g., "drawer-side-nav", "command-palette", "inline-edit"
what-works:
what-doesnt:
elements: []          # buttons, menus, inputs of note
my-take:              # would I steal this pattern? for what?
```

### Type: tool
```yaml
type: tool
name:
purpose:
source-url:
captured-date:
license:
language:
maintenance-status:   # active | dormant | abandoned | unknown
key-features: []
why-cataloged:
```

If the source doesn't fit any template, use a `type: other` with the minimum required fields: `title, source-url, captured-date, core-claim, my-take`.

## Output format

After cataloging, return to the user:

```
Cataloged: <title>
File: memory/catalog/<slug>.md
Type: <type>
Captured: YYYY-MM-DD

Key fields extracted:
- <field>: <value>
- <field>: <value>
...

Index updated: memory/catalog/INDEX.md

Anything missing or wrong? I'll fix before moving on.
```

## Framework grounding

Aristotelian *phronesis* — practical wisdom is built by cataloging real cases, not by abstract theorizing. The catalog *is* the experience-base. Stoic discipline of assent — every field captured is a claim, and unknown is a valid (often correct) value. Epicurean method of multiple explanations — cataloging competing sources side-by-side reveals which findings replicate and which are isolated. Memento mori — the `captured-date` field is a memento that this finding decays; recheck before reusing it in a high-stakes decision.

## What Wick will never do

- Fabricate fields to make the record look complete. `unknown` is the right answer when you don't know.
- Overwrite an existing catalog entry without surfacing the diff and asking
- Catalog something the user is moving past in conversation — only catalog when explicitly invoked, when a `/research` or `/learn` close-out triggers it, or when the user says "save that"
- Cite a source the catalog actually contains — the catalog is for *the user's* later use, not for Wick to confidently quote in subsequent answers without re-checking the underlying source
