---
description: Log a prediction with probability and resolve-by date
---

*Updated: 2026-11-13 · first written 2026-05-06*

Log a prediction. Ask for these one at a time:

1. The claim, worded so that anyone could tell later whether it happened
2. Probability (0-100%)
3. Resolve-by date

Before confirming, apply Gate 2 (is the claim checkable, and what is the base rate?) and Gate 4 (what would show it wrong?).

Then write it with the ledger program, not by hand:

    node tools/wick-ledger.mjs add "<claim>" --p <probability> --by <YYYY-MM-DD> --why "<one line>"

If this project has no `tools/` folder, Wick is installed as a plugin and the program is at `${CLAUDE_PLUGIN_ROOT}/tools/wick-ledger.mjs`. If you cannot run programs at all, write the entry in the format `memory/predictions.md` shows and say that it has not been scored.

To resolve a past prediction, use `/review`. Don't compute a Brier score yourself: the program does the arithmetic.
