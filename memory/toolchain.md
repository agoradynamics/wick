# Toolchain — external tools this agent's code/builds assume

*Updated: 2026-08-03 · first written 2026-06-28*

Ships as a template. List the system-level tools your project needs, how to call them
portably, and per-machine status. The binaries are deliberately **not bundled** (a TeX distro
is gigabytes; compilers are OS-specific) — name what to assume and how to install it. See
`../PORTABILITY.md` → "Machine-awareness layer".

## Invocation convention (portable)

Call tools **by name on PATH**, with an **env-var override** — never a hardcoded absolute
path. Examples: `gcc` / `$CC`, `pdflatex`, the launcher (`python`/`node`) not an absolute
interpreter. This is Step 13 of `PORTABILITY.md` restated as a standing rule.

## Required tools

| Tool | Why it's needed | Call as | Install | Added |
|---|---|---|---|---|
| _gcc (example)_ | _compile native extensions_ | `gcc` / `$CC` | _w64devkit (portable single-folder) · apt · brew_ | _YYYY-MM-DD_ |

**Date every row you add.** *Added* records when the assumption entered the toolchain — it is not
a claim the tool is installed. A dependency nobody can date is a dependency nobody remembers
choosing.

## Per-machine status

Whether each tool is present (and its version) is per-host — see `machines/<hostname>.md`.
Presence is a fact with an expiry; the row above is a fact about what the code assumes.
