# Machines registry

One thin profile per regularly-used machine, **keyed by hostname**. At session start the agent
reads the hostname (one env read) and loads the matching profile **on demand** when
build/sim/external-path work arises — it does not assume the last machine's setup. Full
protocol in `../../PORTABILITY.md` → "Machine-awareness layer".

## Known machines

| Hostname | OS | Role | Last verified |
|---|---|---|---|
| _EXAMPLE-HOST_ | _Windows 11 / Ubuntu 24.04_ | _dev · build · operator_ | _YYYY-MM-DD_ |

## Profile template (`<hostname>.md`)

- **Identity:** hostname / user / OS + build
- **Hardware:** CPU cores·threads / RAM / GPU / free disk
- **Toolchain map:** each required tool → on PATH? path? version (checked against `../toolchain.md`)
- **Operational quirks:** the things that break automation — auth-token scopes, admin rights,
  cloud-sync folders, power/sleep behavior — not just compilers
- **Machine-local resources:** pointers to large external data/models that live only on this host
- **Last verified:** YYYY-MM-DD

Keep profiles thin — specs + pointers + toolchain map, **never project state.**
