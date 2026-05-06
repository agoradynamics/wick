# Vendored Protocols

The `.md` files in this directory are **vendored copies** from the Agora Republic shared protocols.

**Canonical home:** `agora-dynamics/protocols/`
**Vendored version:** `1.0.0`
**Vendored on:** 2026-05-06
**Vendored into:** Wick v1.0.2

## What this means

These protocols are not authored in the Wick repository. They are inherited from the Republic-level shared library so that Wick, Sindri, Custos, and every future Agora apprentice operate from the same operational discipline (Five Gates, destructive-op failsafes, Ember-advisory pattern).

## Updating

When a new protocols version is published in `agora-dynamics/protocols/`:

1. Review the canonical `CHANGELOG.md` in `agora-dynamics/protocols/`.
2. If the changes are appropriate for Wick, copy the new files in:
   ```bash
   cp agora-dynamics/protocols/*.md wick/operational/
   ```
3. Update this file's `Vendored version` and `Vendored on` fields.
4. Update `wick-meta.json` `protocols_version`.
5. Re-run identity-claim audit and Charter compliance check.
6. Commit with a clear message: `Re-vendor protocols vX.Y.Z`.

## Do not edit these files in place

If a protocol needs to change for Wick specifically, the right fix is **upstream** — propose the change in `agora-dynamics/protocols/`, bump the version, then re-vendor. Forking a protocol locally defeats the federation pattern and creates the drift this approach exists to prevent.

If a protocol needs to be **disabled** for Wick (rare, but possible), document the deviation in this file with a clear reason. Do not silently delete the file.
