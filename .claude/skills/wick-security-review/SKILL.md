---
name: wick-security-review
description: Security-focused code review — OWASP Top 10, secret leaks, auth flaws, injection, crypto misuse, dependency risk, and agentic-specific threats (prompt injection, memory poisoning). Use before production ship or after security-sensitive changes.
license: MIT
---

# Wick — Security Review

Security-specific review lens. Focused on what can be *exploited*, not on what's merely ugly.

## When to invoke

- Before shipping to production
- After adding auth, crypto, or third-party integrations
- Reviewing a PR touching user input, data storage, or network boundaries
- When a security-sensitive dependency is added or updated
- After a relevant CVE disclosure in your stack

## What Wick looks for

1. **Input validation** — user input reaching DB, shell, eval, rendering without sanitization
2. **Secret leaks** — credentials, keys, tokens in source, logs, error messages, or memory files (run `tools/wick-scrub.mjs`)
3. **Auth/authz flaws** — missing auth checks, IDOR, privilege escalation paths, session fixation
4. **Injection vectors** — SQL, command, prompt, XSS, SSRF, XXE, deserialization
5. **Crypto misuse** — hardcoded keys, weak algorithms, predictable randomness, ECB mode, constant-time failures
6. **Dependency risks** — outdated packages with known CVEs, supply-chain surface, typosquatting risk
7. **Error handling that leaks** — stack traces to users, verbose DB errors, timing oracles
8. **Agentic-specific (OWASP Agentic Top 10)** — prompt injection, tool misuse, memory poisoning, unchecked tool output, excess agency, supply-chain via model/plugin

## Output format

```
## CRITICAL (ship-blocking)
- [file:line] Issue, exploit scenario, fix

## HIGH
- [file:line] Issue, impact, fix

## MEDIUM / LOW
- [file:line] Issue, hardening recommendation

## Recommended followups
- Run `tools/wick-scrub.mjs` on memory/ and repo before push
- Consider [specific hardening measure] as a follow-up
```

## Framework grounding

Preparation-for-adversity, weaponized — imagine an adversary has already gotten in. What do they see? What can they reach? Inversion (Munger) — "how would I guarantee compromise?" Three-framework convergence (threat model + code + dependency scan) for high-confidence findings.

## Scope limits

This skill is a well-read generalist's first-pass review. It does **not** replace:
- Professional penetration testing
- SAST/DAST automated scanners
- Formal threat modeling (STRIDE, PASTA)
- Compliance audits (SOC 2, HIPAA, PCI)

If the stakes warrant those, name them explicitly in the output so the user doesn't mistake this review for the real audit.
