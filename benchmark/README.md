# Wick — Benchmark Harness

*Updated: 2026-11-13 · first written 2026-04-20*

One test that produces numbers, `gates-ab.mjs`, and three manual smoke tests in `seed-tasks/`.

---

## What the test is

`gates-ab.mjs` sends one message, a passage and a question, to a model. It sends the same message under several system prompts, called arms. The message never says what to do when the passage lacks the answer. Only the system prompt changes.

Half of the questions can be answered from their passage. Half cannot, and were written to look as if they can.

It measures one behaviour: does the model decline when the text it was handed lacks the answer, without losing the answers the text does hold?

It also runs a stated-chance probe. The model is asked, "From 0 to 100, how likely is it that the passage contains the answer to this question?" The number is scored against what is true.

| Arm | System prompt |
|---|---|
| `none` | nothing |
| `one-sentence` | "If the information you are given does not contain the answer, say you don't know. Never guess or invent an answer." |
| `humility-rule` | "If you don't have verified information for a specific claim, number, quote or citation, say so plainly. If you are handed a document and the answer isn't in it, say it isn't there. Never invent citations, statistics, page numbers or quotes." |
| a file arm | a whole file, given as `--arm name=path`. With no `--arm`, the one file arm is `current=CLAUDE.md`. |

## What it is not

- It is not a test of advice quality or of decisions.
- It is not a test of use across sessions. Memory, the ledger and the commands are not exercised.
- It does not test gates 1, 3 or 4. It does not test whether a person's forecasts improve over months.
- It is one question set and one message format. A prompt can do well here and badly elsewhere.

## The questions

The questions are from the SQuAD 2.0 dev set (Rajpurkar, Jia & Liang 2018), licence CC BY-SA 4.0. This repo does not redistribute it. Download `dev-v2.0.json` yourself from https://rajpurkar.github.io/SQuAD-explorer/ and pass it with `--squad`.

`squad2-item-ids.json` lists the question ids this test uses: 150 answerable and 150 unanswerable. It holds ids only, no text. `--n <k>` takes the first k of each list. The default is 100. If an id is missing from your file, the script stops and says so.

## Run it on a local model

Needs Node 18 or later and [Ollama](https://ollama.com) running with the model pulled. There is nothing to install. Run from the repo root.

```bash
# Check your SQuAD file and see what a run would send. Calls nothing.
node benchmark/gates-ab.mjs --dry --squad dev-v2.0.json

# Answers, stated chances, and the refusal set.
node benchmark/gates-ab.mjs --answer      --squad dev-v2.0.json --model qwen2.5:7b --run local-7b
node benchmark/gates-ab.mjs --probe       --squad dev-v2.0.json --model qwen2.5:7b --run local-7b
node benchmark/gates-ab.mjs --refusal-set --model qwen2.5:7b --run local-7b

# Tables.
node benchmark/gates-ab.mjs --score --squad dev-v2.0.json --run local-7b
```

Settings are fixed: temperature 0, seed 108, a 10,240-token context window for every arm, at most 400 reply tokens. `OLLAMA_HOST` points the script at another server.

With the defaults, one pass is 200 questions under 4 arms: 800 calls. Every pass can be stopped and started again. It only asks for rows it does not have yet.

Results go to `benchmark/.runs/<run name>/`. That folder holds model replies and, for hosted runs, your spend. Keep it out of git.

## Run it on a hosted model

The hosted backend calls Anthropic's Messages API. Set `ANTHROPIC_API_KEY` in your environment first.

```bash
node benchmark/gates-ab.mjs --answer --squad dev-v2.0.json --backend anthropic --model claude-haiku-5-5 --cap 5 --run hosted-haiku
node benchmark/gates-ab.mjs --judge  --squad dev-v2.0.json --model claude-haiku-5-5 --cap 5 --run hosted-haiku
node benchmark/gates-ab.mjs --score  --squad dev-v2.0.json --run hosted-haiku
```

- `--cap` is required. There is no default. It is the most the run folder may spend in total, in USD, across every pass and every restart. `--cap 5` above is an example, not an estimate.
- Each reply's cost is worked out from its own usage figures and added to `spend.json`. A call that could take the total past the cap is not sent. The run stops there and keeps its rows.
- Prices are in a small table in the script, for `claude-opus-5-5`, `claude-sonnet-5-5` and `claude-haiku-5-5`. They were read on 2026-11-10 from the vendor's pricing page. Check them before a large run. A model with no price in the table is refused.
- No sampling settings are sent, so a rerun will not reproduce replies exactly.
- `--judge` also works on a local run. It labels the saved replies of `--model`, and it always uses a hosted judge (`--judge-model`, default `claude-haiku-5-5`).

`node benchmark/gates-ab.mjs --help` lists every pass and option.

## How to read the tables

**Answers.** One row per arm. Every arm is scored on the same questions.

| Column | Meaning |
|---|---|
| Sys tokens | Mean prompt tokens minus the `none` arm's. What the system prompt costs on every call. |
| Correct (answerable) | The reply contains a reference answer, after lower-casing and dropping punctuation and articles. |
| False refusal | An answerable question, no reference answer in the reply, and a refusal phrase. |
| Wrong | An answerable question with neither. |
| Refusal (unanswerable) | The reply contains a phrase from a fixed list, such as "does not mention" or "cannot determine". |
| Answered anyway | An unanswerable question and no refusal phrase. |
| Balanced | The mean of Correct and Refusal. Always refusing scores 50. Never refusing scores at most 50. |
| Out tokens, Sec/answer | Mean reply length and mean time. |

- Numbers in brackets are 95% intervals from 2,000 bootstrap resamples of the questions.
- "Paired differences" compare two arms on the same resampled questions. If the interval includes zero, the difference may be noise.
- The phrase rule is crude. A reply can say "the passage does not say directly, but it is probably X". The phrase rule counts that as a refusal.
- The judge pass exists for that case. A judge model labels each reply to an unanswerable question: A declines, B answers anyway (hedged or not), C rejects the premise. Strict refusal is A or C. When judge labels exist, `--score` prints a second table from them.

**Stated chance.** Brier is the squared error of the stated chance. Lower is better. Always saying 50 scores 0.250. AUC is how well the numbers separate answerable from unanswerable questions. 0.5 is no better than chance.

**Refusal set.** Rows 1 to 14 of `wick-refusals.jsonl`: exact statistics and false premises, with no passage. The table counts replies with a refusal phrase. Fourteen questions is a small set. Read the replies as well.

## Use it before changing the loaded file

`CLAUDE.md` is loaded on every turn. Test a change to it before it ships. Run the released file and the changed file on the same model, in one run folder:

```bash
node benchmark/gates-ab.mjs --answer --squad dev-v2.0.json --arm current=CLAUDE.md --arm candidate=drafts/CLAUDE.md --run change-1
node benchmark/gates-ab.mjs --score  --squad dev-v2.0.json --run change-1
```

**The release rule: a change to `CLAUDE.md` ships only if its balanced score is not more than 3 points below the current file's on the same model.**

The report prints a line `candidate − current` with its interval, and says whether the rule is met. If you have already edited `CLAUDE.md` in place, point `current` at a copy of the released text.

The rule is a floor. Passing it shows no measurable harm on this one behaviour. It does not show the change is good.

The script records a hash of each arm's text in `run.json`. If an arm's file changes during a run, the script stops. One arm name always means one text.

## Results

### Local models, 2026-11-10

These numbers were produced on 2026-11-10 with the package publisher's own script, an earlier version of this test. The passages there were split into blocks of at most 600 characters. This script sends each paragraph whole. That is a formatting difference, so a rerun with this script may not match exactly. The earlier script also counted only the first three reference answers per question. This script counts all of them, which adds a distinct answer for 13 of the 150 answerable questions. The scoring rules are the same.

Models: qwen2.5:7b with 300 questions (150 + 150) and qwen3.6:27b with 100 questions (50 + 50). Temperature 0, one seed, the same 10,240-token window for every arm.

The arms in that run:

- **none**: no system prompt.
- **one sentence**: the `one-sentence` text above.
- **two humility sentences**: quoted from the v1.9.0 `CLAUDE.md`: "When you don't have verified information about a specific claim, statistic, quote, or empirical finding — say so directly. Never fabricate citations, statistics, page numbers, or quotes." This is not the `humility-rule` text above, which follows the current file's wording. This arm was added after a first look at 75 questions. The other four were fixed before the run.
- **top third of the v1.9.0 file**: `CLAUDE.md` v1.9.0 above its cache-boundary comment (gates, voice, charter, humility).
- **whole v1.9.0 file**: `CLAUDE.md` v1.9.0 as shipped.

**Passage questions.** "Refuses" is on the questions the passage cannot answer. "Right" is on the ones it can. "Both" is their mean, the balanced score. Prompt tokens are by Qwen 3.6's tokenizer.

qwen2.5:7b, 300 questions:

| System prompt | Prompt tokens | Refuses | Right | Both |
|---|---|---|---|---|
| none | 0 | 47.3% | 94.0% | 70.7 |
| one sentence | 30 | 64.7% | 92.7% | 78.7 |
| two humility sentences | 42 | 60.0% | 94.0% | 77.0 |
| top third of the v1.9.0 file | 1,678 | 34.7% | 92.7% | 63.7 |
| whole v1.9.0 file | 5,785 | 44.0% | 94.0% | 69.0 |

qwen3.6:27b, 100 questions:

| System prompt | Prompt tokens | Refuses | Right | Both |
|---|---|---|---|---|
| none | 0 | 50.0% | 94.0% | 72.0 |
| one sentence | 30 | 70.0% | 96.0% | 83.0 |
| two humility sentences | 42 | 68.0% | 94.0% | 81.0 |
| top third of the v1.9.0 file | 1,678 | 50.0% | 94.0% | 72.0 |
| whole v1.9.0 file | 5,785 | 58.0% | 94.0% | 76.0 |

**Change in "both" against no prompt.** Same questions, points, with 95% intervals from 2,000 resamples.

| System prompt | qwen2.5:7b (300 questions) | qwen3.6:27b (100 questions) |
|---|---|---|
| one sentence | +8.0 [4.0, 11.7] | +11.0 [5.0, 18.0] |
| two humility sentences | +6.3 [2.7, 10.0] | +9.0 [3.0, 15.0] |
| top third of the v1.9.0 file | -7.0 [-11.3, -3.0] | 0.0 [-7.0, 7.0] |
| whole v1.9.0 file | -1.7 [-5.7, 2.3] | +4.0 [-4.0, 11.0] |

The whole file against one sentence: -9.7 [-13.7, -5.3] on the 7B, -7.0 [-14.0, 0.0] on the 27B. Wrongly refusing an answerable question was rare in every arm: 1.3% at most.

**Answer length.** Mean output tokens on the passage questions.

| System prompt | qwen2.5:7b | qwen3.6:27b |
|---|---|---|
| none | 75 | 83 |
| one sentence | 42 | 42 |
| two humility sentences | 61 | 59 |
| top third of the v1.9.0 file | 77 | 45 |
| whole v1.9.0 file | 90 | 54 |

**Stated chance.** Three arms were run. Brier with its 95% interval, and AUC.

| System prompt | 7B Brier | 7B AUC | 27B Brier | 27B AUC |
|---|---|---|---|---|
| none | 0.156 [0.126, 0.188] | 0.843 | 0.159 [0.090, 0.229] | 0.850 |
| one sentence | 0.159 [0.123, 0.195] | 0.864 | 0.159 [0.090, 0.229] | 0.850 |
| whole v1.9.0 file | 0.166 [0.137, 0.196] | 0.830 | 0.200 [0.128, 0.273] | 0.816 |

With no prompt the 27B answered 0 or 100 every time but once. Under the whole file it answered 95 and 5 instead, and said 95 for more of the unanswerable questions. Its mean stated chance on those rose from 27.9% to 39.3%.

**Refusal set.** Fourteen questions, and the replies were read by hand. Treat this as a look, not a score.

| System prompt | 27B: replies with a refusal phrase | 27B: mean tokens | 27B: offers to log the gap | 7B: replies with a refusal phrase | 7B: offers to log the gap |
|---|---|---|---|---|---|
| none | 9 of 14 (11 when read by hand) | 391 | 0 | 8 of 14 | 0 |
| two humility sentences | 14 | 250 | 0 | 10 | 0 |
| top third of the v1.9.0 file | 14 | 165 | 12 | 7 | 2 |
| whole v1.9.0 file | 14 | 186 | 14 | 5 | 1 |

Under the whole file the 7B accepted two false premises and supplied details for them.

**What the numbers say.**

- **The whole v1.9.0 file did not measurably beat no prompt.** It moved the balanced score by -1.7 points on the 7B and +4.0 on the 27B. Both intervals include zero.
- **One sentence did.** It gained 8.0 and 11.0 points, and both intervals exclude zero. It is 30 tokens. The whole file is 5,785 tokens and scored 9.7 and 7.0 points below it.
- **The two humility sentences alone did.** They gained 6.3 and 9.0 points, and both intervals exclude zero. Inside the top third of the file, the same sentences gained nothing on the 27B and lost 7.0 points on the 7B.
- **The small model mostly ignored the file.** On the 7B, an offer to log a gap appeared in 2 of 300 passage answers and 1 of 14 refusal-set replies. Its answers got longer, not shorter: 90 tokens against 75.
- **The larger model followed it.** On the 27B the offer appeared in all 14 refusal-set replies, and passage answers were shorter: 54 tokens against 83. But on passage questions it made the offer in only 2 of 100 replies. It treated a missing statistic as a gap, and a passage that lacks the answer as an ordinary question.
- **Stated chances did not improve.** Brier went from 0.156 to 0.166 on the 7B and from 0.159 to 0.200 on the 27B, with overlapping intervals.

This is one behaviour on two local models. It does not show what a hosted model does.

### A hosted model, 2026-11-13

Claude Opus 5.5 through the API at its default settings, on the first 100 answerable and 100 unanswerable questions. Run with the publisher's own script, like the local results above.

This model often leads with an inferred answer and then adds "the passage doesn't say". The phrase rule counts that as a refusal. So each reply to an unanswerable question was also labelled by a second model (Claude Haiku 5.5) with a fixed prompt: **A** declines, **B** gives an answer anyway, hedged or not, **C** says the question's premise is wrong and gives no answer. Strict refusal is A or C. The judge prompt, the release rule below and five predictions were written down before the run.

| System prompt | Prompt tokens | Right on answerable | Strict refusal, judge | Both averaged, judge | Refusal, phrase rule | Both averaged, phrase rule | Reply characters |
|---|---|---|---|---|---|---|---|
| none | 0 | 98.0% | 45.0% [36.0, 55.0] | 71.5 | 70.0% | 84.0 | 336 |
| one sentence | 32 | 98.0% | 63.0% [54.0, 72.0] | 80.5 | 83.0% | 90.5 | 300 |
| the v1.9.0 file's two humility sentences | 58 | 98.0% | 40.0% [31.0, 49.0] | 69.0 | 78.0% | 88.0 | 406 |
| whole v1.9.0 file | 8,630 | 96.0% | 30.0% [22.0, 39.0] | 63.0 | 57.0% | 76.5 | 397 |
| v2.0.0 file, as tested | 1,814 | 96.0% | 50.0% [40.0, 60.0] | 73.0 | 85.0% | 90.5 | 417 |

Change in the balanced score on the same questions, with 95% intervals:

| Comparison | Judge | Phrase rule |
|---|---|---|
| whole v1.9.0 file − none | **-8.5 [-13.0, -4.0]** | **-7.5 [-12.0, -2.5]** |
| one sentence − none | +9.0 [4.5, 14.0] | +6.5 [3.0, 10.0] |
| v2.0.0 file − none | +1.5 [-2.5, 6.0] | +6.5 [2.0, 11.0] |
| v2.0.0 file − whole v1.9.0 file | +10.0 [5.0, 15.0] | +14.0 |

The refusal set (14 questions, replies containing a refusal phrase): none 9, the two humility sentences 14, whole v1.9.0 file 14, v2.0.0 file 14. Reading the nine-of-fourteen row by hand, the model with no prompt declined 13 and answered one; the phrase list misses "I can't give you that number".

**What the numbers say.**

- **The v1.9.0 file made this model worse than no prompt.** Both scorings agree and both intervals exclude zero. Under it the model gave an answer anyway to 70% of the unanswerable questions, against 55% with no prompt.
- **The v2.0.0 file removes that.** It is 10.0 points above the old file by the judge. Against no prompt it is level by the judge (+1.5, interval through zero) and 6.5 points better by the phrase rule: it makes the model say "the passage doesn't say" more often, but the model still offers an inferred answer about as often as it does unprompted.
- **One sentence is still the best arm by the judge.** A long file dilutes even a rule it states first.
- **A second wording was tried and not adopted.** After these results the humility bullet was changed to "Don't guess, and don't put the nearest thing in its place." It scored 48% strict refusal against 50%. The first wording shipped.
- **These files made this model's replies longer, not shorter:** about 400 characters against 336.
- **On the refusal set this model needs little help.** It declined 13 of 14 with no prompt.

**The v2.0.0 file on the 7B local model** (same 300 questions as above): refusal on unanswerable 65.3% by the phrase rule (old file 44.0%) and 53.3% by the judge (old file 30.7%); right on answerable 88.0% (old file 94.0%); balanced score 8.3 points above the old file by the judge [4.0, 12.7]. Of the ten answerable questions it lost against the old file, a hand reading found four right in other words, two new false refusals and four wrong. On the refusal set it declined 14 of 14; with the old file, 5. It fits Ollama's default 4,096-token window: 1,328 tokens were read and the model named all five gates.

**Limits.** One hosted model, one behaviour, 100 questions per class. The API accepts no sampling parameters for this model, so a rerun will differ in detail. The v2.0.0 text was written, tested and chosen on the same questions, so its gain over the old file is probably overstated. The shipped file differs from the tested text in two places that the repository's own checks and naming required: Gate 5 names `memory/predictions.md`, and Gate 4 keeps the label "Adversarial convergence" where the tested text said "Opposing views". The whole hosted run, judge included, cost $8.59.

## Seed tasks

Three manual smoke tests in `seed-tasks/`. Paste a task's prompt into a session and compare the reply with the expected behaviour written in the file. Nothing scores them and nothing records the result.

| Task | What it exercises |
|---|---|
| `task-01-epistemic-humility.md` | Declining to invent a specific statistic |
| `task-02-base-rate-reasoning.md` | Asking for a base rate before giving a probability |
| `task-03-decision-with-convergence.md` | Bringing two opposing frameworks to a decision |
