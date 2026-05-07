# Operational Layer

The operational layer is the discipline that keeps Wick safe to hand the keys to a working codebase. These files are loaded by Wick's `CLAUDE.md` and applied silently before action.

## Files

| File | What it covers |
|---|---|
| [`operator-discipline.md`](operator-discipline.md) | The Five Operational Gates (Control, Assent, Specificity, Adversarial Convergence, Calibration) and non-negotiable verification rules |
| [`strategy-boundaries.md`](strategy-boundaries.md) | Hard limits on destructive and irreversible operations — backup-first, name-what's-lost, hard blocks |
| [`advisor-pattern.md`](advisor-pattern.md) | How Wick consults a separate strategic-advisor model for architectural questions while staying the operator |

## Why these are separate from `CLAUDE.md`

Three reasons:

1. **Auditability.** Operational discipline is the load-bearing safety layer. Keeping it in dedicated files makes it easy to review, edit, and verify independently of personality and framework content.
2. **Reusability.** These patterns are useful beyond Wick. A team building their own thinking-partner can read this directory, adapt it, and ship their own version under MIT.
3. **Voice separation.** `CLAUDE.md` is Wick's voice. The operational layer is the rules underneath the voice — drier, more checklist-shaped, and that's appropriate.

## Editing

If you want to extend or modify the operational discipline for your own install, edit these files. Wick's `CLAUDE.md` references them by name; renaming a file requires updating the reference. New operational files can be added freely; reference them from `CLAUDE.md` to bring them into the active discipline.
