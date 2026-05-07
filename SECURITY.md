# Security Policy

## Reporting a vulnerability

If you discover a vulnerability in Wick — whether it's a leak in the shipped files, an issue with the secret-scanner or public-readiness scanner, or a problem with how Wick handles user memory — please report it privately rather than opening a public issue.

**Email:** contact@agoradynamics.dev
**Subject line:** start with `[wick-security]` so we triage promptly.

What to include:
- A description of the issue and its impact
- Steps to reproduce (or the file path / commit SHA where you found it)
- The Wick version (`wick-meta.json` `version` field, or the git SHA if you're tracking main)
- Whether you'd like to be credited in the fix release notes (default: yes, by name; you can opt out)

We aim to acknowledge reports within 72 hours and ship a fix within 14 days for high-severity issues. If you don't hear back, feel free to nudge us — sometimes mail filters bite.

## What this scanner stack covers

Wick ships with two complementary scanners. **Run them before committing**, and CI runs them on every PR.

| Tool | Catches | When |
|---|---|---|
| [`tools/wick-scrub.mjs`](tools/wick-scrub.mjs) | Credentials — API keys, tokens, private keys, connection strings, credit cards | Before any commit, especially commits that touch `memory/` |
| [`tools/wick-public-readiness.mjs`](tools/wick-public-readiness.mjs) | Internal vocabulary — model identifiers, infrastructure endpoints, internal codenames, role names | Before any commit, especially commits that touch documentation or new files |

**Run both:**

```bash
node tools/wick-scrub.mjs              # exits 1 if findings
node tools/wick-public-readiness.mjs   # exits 1 if findings
```

If you maintain a fork or downstream package, edit [`.wick-blocklist.json`](.wick-blocklist.json) to add patterns relevant to your context (your own internal codenames, your own infrastructure terms, etc.). The default blocklist ships with patterns relevant to upstream Wick.

## What Wick stores about you

By design, Wick keeps your memory **on your computer**, in the `memory/` folder of whatever project you're using it in. That folder is plain markdown — readable, editable, deletable by you at any time.

Wick does not phone home. There is no telemetry, no analytics, no auto-upload. The only network traffic that leaves your machine is whatever your AI runtime (Claude API, Cursor, Ollama, etc.) sends — Wick itself adds no outbound calls.

If you discover otherwise — e.g. a packaged version of Wick that includes telemetry — please report it as a security issue. That would be a bug, not a feature.

## What you should still treat with care

Even with the scanners above, the safest practice for `memory/` is:

- Don't paste credentials, API keys, or production database URLs into Wick conversations. Wick has no way to know whether a string is sensitive when it's part of natural prose.
- Don't store PII about third parties. *"My team includes Alice and Bob"* is fine; full names + roles + contact details for non-consenting people is not.
- If you commit your `memory/` folder to a public repo (some users do, for transparency), run both scanners first. The default `.gitignore` does not exclude `memory/` — that's a deliberate per-user choice, not an oversight.

## License

Security is part of the product. The scanner tools and `.wick-blocklist.json` are MIT-licensed alongside the rest of Wick — adapt them, extend them, and contribute improvements back if they're generally useful.
