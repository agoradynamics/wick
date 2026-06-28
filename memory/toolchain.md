# Toolchain — external tools this agent's code/builds assume

Ships as a template. List the system-level tools your project needs, how to call them
portably, and per-machine status. The binaries are deliberately **not bundled** (a TeX distro
is gigabytes; compilers are OS-specific) — name what to assume and how to install it. See
`../PORTABILITY.md` → "Machine-awareness layer".

## Invocation convention (portable)

Call tools **by name on PATH**, with an **env-var override** — never a hardcoded absolute
path. Examples: `gcc` / `$CC`, `pdflatex`, the launcher (`python`/`node`) not an absolute
interpreter. This is Step 13 of `PORTABILITY.md` restated as a standing rule.

## Required tools

| Tool | Why it's needed | Call as | Install |
|---|---|---|---|
| _gcc (example)_ | _compile native extensions_ | `gcc` / `$CC` | _w64devkit (portable single-folder) · apt · brew_ |

## Per-machine status

Whether each tool is present (and its version) is per-host — see `machines/<hostname>.md`.
