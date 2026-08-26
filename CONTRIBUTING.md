# Contributing to Wick

*Updated: 2026-05-06 · first written 2026-05-06*

Wick is small, opinionated, and MIT-licensed. Contributions welcome — especially the kind that sharpen the discipline rather than expand the surface.

## What contributions are most welcome

- **Bug fixes in `tools/`** — the scanner stack (`wick-scrub.mjs`, `wick-public-readiness.mjs`), `calibrate.mjs`, `install-runtime.mjs`. Reproducible, tested, narrow.
- **New skills** — additional `.claude/skills/wick-*/SKILL.md` files that fit Wick's voice and discipline. Must validate clean against the [agentskills.io spec](https://agentskills.io/specification).
- **Memory schema improvements** — better templates in `memory/`, better instinct examples, better worked dialogues in `KNOWLEDGE.md`.
- **Cross-runtime fixes** — Wick claims to work in Claude Code, Cursor, ChatGPT, Aider, goose, local Ollama, and 20+ runtimes. If you find a runtime where it breaks, a PR with a fix (or even a clear bug report) is high-value.
- **Documentation that catches real confusion** — if a section of the README or `WICK-INTEGRATION.md` produced a misunderstanding for you, an edit that prevents that misunderstanding for the next reader is gold.

## What contributions are unlikely to land

- **New slash commands** — the 14 we ship are deliberate; adding a 15th has a high bar. Pitch it in an issue first.
- **Voice changes to `CLAUDE.md` / `WICK.md`** — Wick's voice is load-bearing for the product. Voice edits need broad agreement.
- **Telemetry, analytics, or "phone home" features** — incompatible with the privacy stance documented in [`SECURITY.md`](SECURITY.md).
- **Vendor lock-in** — Wick's value is portability. PRs that tie Wick to a single runtime get reshaped or declined.

## Before you open a PR

Run both scanners. CI will run them too, but catching issues locally is faster.

```bash
node tools/wick-scrub.mjs               # secret scan
node tools/wick-public-readiness.mjs    # internal-vocabulary scan
```

Validate any new or edited skills against the spec:

```bash
npx skills-ref validate .claude/skills/<your-skill>/
```

(Install skills-ref globally with `npm i -g skills-ref` if you don't have it.)

## PR checklist

- [ ] Both scanners pass (CI will also run them)
- [ ] If you added/edited a skill: `skills-ref validate` passes
- [ ] If you changed `CLAUDE.md` or `WICK.md`: kept the file lean and quoted any framework citation
- [ ] If you changed `wick-meta.json`: updated `version` if it's a release, kept `audit_status` honest
- [ ] If you added a new file: included it in the relevant index (e.g. `.claude/skills/README.md`)
- [ ] Wrote a CHANGELOG.md entry under the appropriate version

## Code of conduct

See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Treat people like you'd want Wick to treat you — with directness, warmth, and zero patience for bad-faith argument.

## Licensing

By contributing, you agree your contribution is licensed under the same MIT license as the rest of Wick. Trademarks (`Wick`, `Agora Dynamics`) remain the property of Agora Dynamics LLC; the trademark notice in `LICENSE` covers nominative use vs. derivative branding.

## Questions

Open an issue with the `question` label, or email contact@agoradynamics.dev. We read both.
