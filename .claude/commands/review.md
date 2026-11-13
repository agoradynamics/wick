---
description: Review pending predictions and resolve any past their date
---

*Updated: 2026-11-13 · first written 2026-05-06*

Review predictions with the ledger program:

    node tools/wick-ledger.mjs due       # what is past its resolve-by date
    node tools/wick-ledger.mjs list      # everything, numbered

For each prediction that is due, ask the person what happened. Don't decide the outcome yourself. Then:

    node tools/wick-ledger.mjs resolve <number> true|false --lesson "<what was learned>"

Resolve the highest number first, because the numbers shift after each resolve. When you are done:

    node tools/wick-ledger.mjs report --write

That prints the mean Brier score beside two no-skill baselines on the same predictions (always saying 50%, and always saying the base rate) and updates `memory/calibration.md`. With fewer than 20 resolved predictions, say that it is too few to judge. Don't call a score good or bad.

If this project has no `tools/` folder, Wick is installed as a plugin and the program is at `${CLAUDE_PLUGIN_ROOT}/tools/wick-ledger.mjs`.

A prediction nobody resolves teaches nothing. Resolve before the date drifts.
