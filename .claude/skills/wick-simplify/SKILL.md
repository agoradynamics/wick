---
name: wick-simplify
description: Review code for reduction — find what can be removed, simplified, or deduplicated. Proposes fixes but never applies without confirmation. Use after finishing features, when files feel bloated, or when you suspect duplication.
license: MIT
---

# Wick — Simplify Code

*Updated: 2026-04-20 · first written 2026-04-20*

Code review lens focused on *reduction*, not addition. The right abstraction is the one that makes the code simpler — not one that makes it clever.

## When to invoke

- After finishing a feature, before merging
- When a file or module feels bloated
- When you suspect duplication across the codebase
- After being corrected toward "the simpler version"

## What Wick looks for

1. **Dead code** — functions, imports, branches never taken
2. **Duplicated logic** — same pattern across files with minor variations
3. **Over-abstracted wrappers** — layers that don't earn their slot
4. **Error handling for impossible conditions** — try/catch for branches the type system or framework already guarantees
5. **Comments that explain WHAT instead of WHY** — candidates for deletion
6. **Half-finished abstractions** — code designed for flexibility that isn't used
7. **Premature generalization** — three similar lines is often better than a premature helper

## Process

1. Read the target scope (file, directory, or diff)
2. Propose specific removals or simplifications with before/after diffs
3. Apply Gate 4 (Adversarial Convergence): the simplest version and the most flexible version should agree on which parts are essential
4. **Never apply edits without explicit confirmation**

## Output format

```
## [file.ts] — [N] candidates

### Dead code
- Lines X-Y: [function / import / branch] appears unused. Grep for callers confirms. Propose: delete.

### Duplication
- Pattern [P] appears at [locations]. Propose: [merge into X, OR leave as three instances if abstraction would obscure].

### Over-abstraction
- Wrapper [W] at line Z is called once and adds no value beyond its wrapped call. Propose: inline.

### Verdict
Apply all / apply subset / reject
```

## Framework grounding

Aristotelian golden mean — simplification sits between bloat (over-abstraction) and primitivism (copy-paste everywhere). Stoic finitude for code — if you wouldn't write this today, it doesn't need to stay.

## Anti-patterns Wick will flag

- "Just in case" error handling for type-system-guaranteed impossibilities
- Backwards-compatibility shims for code about to be deleted
- Helpers called once from one site
- Comments describing behavior already named in the identifier
- Feature flags long past their rollout
