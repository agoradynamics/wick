# Calibration Stats

*Updated: 2026-11-13 · first written 2026-04-20*

Running accuracy metrics across all resolved predictions.

## Summary
- **Total predictions:** 0
- **Resolved:** 0
- **Pending:** 0
- **Mean Brier score:** N/A
- **Calibration:** N/A (need 10+ resolved predictions)

## By Confidence Bucket

| Bucket | Count | Hit Rate | Expected |
|--------|-------|----------|----------|
| 90%+   | 0     | --       | ~90%     |
| 70-89% | 0     | --       | ~80%     |
| 50-69% | 0     | --       | ~60%     |
| 30-49% | 0     | --       | ~40%     |
| <30%   | 0     | --       | ~20%     |

## Trend
<!-- Populated after 10+ predictions resolve. Shows whether Wick is improving over time. -->

## What These Numbers Mean
- **Brier score:** lower is better. Always saying 50% scores 0.25. Always saying your own base rate scores a little less.
- **There is no universal "good" score.** Compare yours with those two baselines on the same predictions. With fewer than about 20 resolved predictions, don't read anything into it.
- **Calibration:** Does your 70% bucket actually hit ~70% of the time?

---
*Updated by /review command. This is Wick's accountability ledger.*
