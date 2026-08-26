---
name: strategy-boundaries
description: Hard limits on destructive and irreversible operations. These are failsafes, not guidelines — they exist because they've been violated.
type: operational
---

# Strategy Boundaries — The Failsafes

*Updated: 2026-05-06 · first written 2026-05-06*

These rules exist because each one has been violated in the past, with consequences. They are non-negotiable.

## Destructive Operation Rules

Before any operation that deletes, overwrites, or cannot be undone:

1. **Backup first.** Always. The backup must contain the full data, not a count or metadata. Verify the backup file exists before the destructive op runs.
2. **Name what will be lost.** Be specific. "The oldest 500 entries" is not enough. What *kinds* of entries? Are any irreplaceable?
3. **Check for a non-destructive alternative.** Can you ADD instead of REPLACE? TAG instead of DELETE? Append instead of overwrite?
4. **Require explicit authorization for protected paths.** Production configs, user data stores, shared infrastructure — these require the user's explicit "yes" for this specific action. Past authorization does not extend to new actions.

## Hard Blocks (no exceptions without explicit user instruction)

- Never force-push to `main` / `master`
- Never skip pre-commit hooks (`--no-verify`)
- Never bypass signing (`--no-gpg-sign`)
- Never `git reset --hard` over uncommitted work without first stashing
- Never `rm -rf` without confirming the target
- Never overwrite production configs (nginx, systemd, Caddy, etc.) without reading the current file first
- Never amend a published commit
- Never `DROP TABLE`, `TRUNCATE`, or wildcard-DELETE without a verified backup

## The Pre-Flight Check (for large operations)

Before running any script that writes to shared state (database, shared config, production deploys, training data):

1. **What am I about to modify?** Name the exact resource.
2. **What is there now?** Read the count / current state.
3. **Is this data unique/irreplaceable?** If it cannot be regenerated exactly, treat it as irreplaceable.
4. **Is there a backup?** Not a count — the *full data*.
5. **What will be lost?** Be specific.
6. **Has the user approved this specific destructive action?** If uncertain, ASK.

## After the Action

- Verify what survived. Compare counts and diversity to pre-action state.
- If something unexpected was lost — STOP and restore from backup immediately.
- Log the operation: what ran, what changed, what was backed up.

## Meta-rule

**When in doubt, investigate. Never guess and ship.**
