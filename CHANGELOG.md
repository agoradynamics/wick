# Wick Changelog

## Unreleased — the blocklist was the leak

**Pre-distribution audit, 2026-08-22.** Wick was about to go to a wider circle of readers, so the
whole tree got read rather than scanned. The scanner said clean. It was clean about everything it
could see, and the one file it could not see was the file that mattered.

**`.wick-blocklist.json` listed itself in `ignore_paths`** — and carried, in plaintext, every term
it existed to suppress: six unshipped codenames, two internal role names, two project codenames and
an internal model identifier. Each one annotated with a `reason` field explaining what it was. So
the artifact that enumerated the whole roster was the single artifact exempt from the scan, and
every run reported clean while shipping it. **The detector exempted itself and then vouched for
itself** — the same failure class the tool was written to catch, one level up.

**The fix is a split, not a redaction.** The shipped blocklist is now **name-free by construction**:
it holds shape-based patterns only (`localhost:PORT`, loopback endpoints) plus the structural
`required_terms` checks. Everything that names an internal thing moved to
**`.wick-blocklist.local.json`** — gitignored, merged over the public file at load time.
`ignore_paths` no longer exempts the public blocklist, so **the scanner now scans itself.**

Three properties the split was built to have:

- **A missing overlay is announced, never assumed.** A fork with no internal vocabulary is a normal
  case, so absence is not an error — but the scanner prints `overlay: none` on every run rather than
  printing a bare ✓. A clean report that cannot tell you *what it checked* is the thing that got us
  here.
- **A malformed overlay is a hard exit, not a skip.** If the overlay fails to parse, the
  name-bearing patterns are not loaded and the scan would pass *for exactly the reason it should
  have failed*. It refuses to run.
- **The rule guards itself.** `required_terms` now asserts the sentence *"THIS FILE NAMES NOTHING ON
  PURPOSE"* is still in the public blocklist. Re-inlining a roster trips a critical finding.

**Also found, by the same read:**

- **`wick-refusals.jsonl` shipped an `"apprentice": "wick"` field on 14 of its 16 rows** — internal
  pipeline vocabulary riding inside published training data, mirrored to the HuggingFace dataset.
  The blocklist had no pattern for the word that names the whole architecture. Field stripped; the
  pattern now exists (in the overlay, where it belongs).
- **The dataset card documented a field that does not exist.** It described
  `{instruction, response}` and told readers to check the first line themselves. The real schema is
  `{instruction, output, rejected, domain}` — **preference-paired**, so anyone SFT-ing on the
  obvious-looking field was at risk of training on `rejected`. Card rewritten with the true schema
  and an explicit warning.

**Two things deliberately NOT done here, because they are the owner's call, not a scanner's:**
`operational/ember-advisory.md` and `operational/vigil-protocols.md` were removed from the tree in
v1.0.3 but their blobs remain reachable in public git history — and the v1.0.3 release note names
both files and describes what they contained, which is a signpost. Purging them means rewriting
published history. Left intact, documented, and escalated.

## Unreleased — §12 Epistemic provenance: was this measured, or inferred?

**Docs only. No tool, no schema change, no version bump** — the release decision stays open.

§10 stamps *when and where* a memory was written. §12 addresses a different axis that costs more
when it is missing: **which claims inside a memory were measured and which were reasoned.** A file
records both in the same voice and nothing marks the seam.

Bought with a real one (2026-08-14). A memory read *"1,383 usable rows (47% lost in cleaning) —
undertrained. Needs more data."* Three claims measured; the parenthetical invented. The
processing step it blamed removes zero rows — it edits in place — and the missing rows were sitting
on disk behind a stale export. **The cost was not the wrong fact but that a wrong cause reprices
the fix:** "lost in processing" implies the data is gone, which implies an expensive blocked
remedy, so the item sank down a ranked list for eleven days when the real remedy was one command.

Two properties that generalise: it rode inside a **parenthetical of a true sentence** (subordinate
clauses do not get audited), and the same wrong model had produced a *different* error a month
earlier in another file — a percentage multiplied by a total and written down as a row count.

The rule, and its mechanical half:

> A memory that names a CAUSE must carry the measurement that ruled out the alternatives — or mark
> itself as inference. **Write the operation next to any derived figure.**

**Enforcement is deliberately none**, and that is part of the finding: telling a measured claim from
an inferred one needs knowledge of what was actually run, which is not recoverable from the text.
It ships as a capture-time writing habit, not a sixth scanner. Scoped to causal claims and derived
figures only — a layer that cites a source for every number is a layer nobody reads.

## v1.7.0 (2026-08-06) — Decay class: what actually goes stale when a model ships

v1.6 made memory **orderable**. This release answers the question that ordering leaves open: §10
refuses to let age expire anything — correctly — but *something* in a memory layer really does go
stale when a model ships. What is it, and how do you find it without deleting the rest?

There is live advice, including from model vendors, to delete your `.md` files and skills every
~6 months. It is **right about the failure mode and wrong about the remedy.** The failure mode is
real: an instruction written to patch a model's weakness becomes dead weight when the weakness is
fixed, and can actively cage a better model. The sharp diagnostic is not age — it is that **if your
agent's behaviour DEGRADES when the model improves, the file was compensating rather than
describing.**

The remedy is wrong because markdown holds two different things. **world** — measurements,
decisions, machine facts, people — never decays when a model ships; a new model does not change a
pipeline's exit semantics. **patch** — a workaround for a specific model's behaviour — is the only
class with a genuine expiry, and its expiry is a *model change*, not a calendar date.

Measured on a mature layer (2,594 substantive lines): **48 lines mentioned a model at all, and on
reading, essentially none were prompting workarounds** — they were findings where a model was the
subject, architecture notes, and citations. Blanket deletion would have destroyed ~2,500 lines of
measurement history to clean up a handful of patches.

### Added
- **`tools/wick-decay-audit.mjs`** — the sixth CI scanner. Checks one thing mechanically and advises
  on one thing it cannot. **HIGH `patch-without-trigger`** (blocking): a `[patch:]` with no stated
  trigger cannot be re-tested, which is the unfalsifiable rule the whole section exists to prevent.
  **LOW `possible-untagged-patch`** (never blocks): names a model *and* gives a directive *and* is
  not obviously reporting — a prompt for judgement, deliberately not a classification, because on a
  real layer it is mostly false positives.
- **`--list`** — the patch inventory, which *is* the model-upgrade re-test list. Re-test the trigger:
  still true, keep; gone, delete. An afternoon, not a rebuild.
- **`MEMORY-PROTOCOL.md` §11** — the class model, the load-bearing trigger rule, the ritual, and the
  honest limits.

### The load-bearing rule
A patch must state its **trigger** — the observed behaviour that justifies it. `"always X"` is
unfalsifiable; you can only trust it or delete it, and **blanket deletion is the only available
remedy precisely because the rule carries no reason.** `"X because Y, observed Z"` can be re-tested.
Reasons, not calendars.

### Design note — tag only the exception
`world` is the **unmarked default**. A discipline that demands tagging 98% of a layer to find the 2%
will not be adopted, and the noise would drown the signal.

### Unchanged
§10's boundary holds. This adds a field that makes a re-test *possible*; it does not decide the
outcome. The tool never deletes, archives, or down-ranks anything, and `world` entries are never
expired by any rule at all.

## v1.6.0 (2026-08-03) — Timestamps: what, when, where

v1.1 gave memory an owner. v1.2 made it portable. v1.5 made it findable. This release makes it
**orderable** — the one thing a memory layer silently loses as it grows.

The failure is quiet. A preference captured in March and one captured last week read as equally
current. A "current focus" from six months ago still reads as current. Two entries conflict and
nothing on the page says which came later. On a multi-machine agent it gets worse: nothing records
*which host* learned a thing, so a fact discovered on a GPU box and one discovered on a laptop are
indistinguishable — even though only one of them is likely to still be true on the other machine.
`CLAUDE.md` has said *"Date everything"* since v1.0. It was prose, and prose does not enforce.

### Added
- **`tools/wick-freshness-audit.mjs`** — the fifth CI scanner, alongside `wick-scrub` (credentials),
  `wick-public-readiness` (internal vocabulary), `wick-identity-audit` (confabulation anchors), and
  `wick-path-audit` (portability). Checks that every memory file carries a stamp, that the dates
  parse and are ordered and are not in the future, that every `index.md` row is dated, and — the one
  that actually bites — that **the index agrees with the files it indexes**.
- **`--fix`** — backfills a whole layer **from `git log`, never from today's clock.** Adopting this
  on a mature memory layer must not flatten forty files to a single date; that would destroy the
  exact ordering the stamp exists to provide. A file git cannot date is *reported*, never silently
  given today's. It backfills **only what is missing** and never overwrites an existing stamp —
  because once the stamping commit lands, git reports *it* as every stamped file's last change, so
  an overwriting re-run would silently re-date the whole layer to adoption day. (Found in
  dogfooding, on this repo, after the first version did exactly that.) `--refresh` overwrites
  deliberately.
- **`MEMORY-PROTOCOL.md` §10** — temporal + provenance discipline, the measurements, and the boundary.

### Changed
- Every shipped `memory/` template now carries `*Updated: <date> · <HOST> · first written <date>*`
  under its H1. The host segment is **optional** — a single-machine agent has no "where" worth
  inventing, and the scanner treats a missing host as advisory, not blocking.
- Entry-level date conventions added where they were missing: `learning-journal.md` (the file the
  old rule cared most about, and the one that had none), `about-you.md` current-focus,
  `domain-knowledge.md` concepts, `toolchain.md` rows.
- `CLAUDE.md` / `WICK.md` — *"Date everything"* expanded from one line into the actual rule.
- **CI wiring is still pending** for both `wick-path-audit` (written in v1.1, never wired) and
  `wick-freshness-audit`. Adding a step to `.github/workflows/` needs the `workflow` OAuth scope,
  which the release tooling does not hold — the two steps are a UI paste, tracked as a follow-up.
  Both scanners run clean locally and are pre-commit-ready today.
- `memory/instincts/*.yaml` already had this right — `created` **and** `last_reinforced`. That is
  the model the rest of the layer now follows; birth and last-touch are different questions.

### Measured — the stamp is free (2026-08-03)
§9 established that the index row **is** the routing surface, so adding anything to it is a
retrieval change, not a cosmetic one. Measured before shipping on a matured 31-file layer:
**6 arms** (baseline · body stamp · body stamp without hostname · index dates · both · both without
hostname) × **44 labelled queries** (32 synthetic session-openers + 12 real ones), live-compiled
surface, real per-file git dates rather than one repeated literal.

**Zero flips. Every arm, both eval sets — no query gained, none lost.**

The manipulation was verified independently rather than inferred from the flat result: the body
stamp doubles the hostname's document frequency (29 → 60 term-slots) and changes nothing. That is
the arm worth watching — the hostname is the only token in the stamp that meaningfully enters a
lexical routing surface. **Honest limit:** measured at 31 files, not proven at 100.

### The boundary
A date is a **recall aid, never an expiry.** Nothing auto-expires, auto-archives, or down-ranks a
memory for being old. `wick-consolidate-memory` still judges staleness by *content*. The stamp
exists so you can order, attribute, and age what you know — not so a tool can decide what you have
outgrown.

### Housekeeping
v1.5.0 shipped to `main` and `CHANGELOG.md` but never reached three of its six version surfaces —
`wick-meta.json` still read 1.4.0, `README.md` still read 1.3.0, and there was no v1.5.0 tag or
GitHub release. All corrected here, and v1.5.0's features are backfilled into `wick-meta.json`.

## v1.5.0 (2026-07-31) — Retrieval: the memory index + a zero-token router

MEMORY-PROTOCOL.md made memory findable **by discipline** (one topic per file, one writer per
fact-class). This release makes it findable **for free**. The remaining failure it fixes is the
*context bulge*: reading the whole memory layer to answer one question.

### Added
- **`memory/index.md`** — the flat map the protocol always implied but never shipped. One row per
  file; read it first and open only what you need. Carries the authoring rule below.
- **`tools/wick-recall.mjs`** — zero-model-token BM25 router over a compiled surface (index row +
  headers + bold lead-ins + technical terms). `node tools/wick-recall.mjs "<question>"` names the
  top file(s) in ~1ms. Zero dependencies, Node >= 18. **Routing is lookup, not judgment** — it
  should never cost a model call.
- **`MEMORY-PROTOCOL.md` §9** — the measurements behind all of it, including the honest limits.

### The load-bearing rule
**The index row IS the routing surface.** Both the human and the router match against it. Measured:
routing on curated index rows beat routing on file bodies by **22 points**; adding each file's own
headers took recall@2 from 84% -> **91%**. Write rows for retrieval, not as tidy topic labels.

### Measured (on a matured 26-file Wick-protocol layer, not on the templates shipped here)
| memory size | load-everything | index-first | router | recall@2 |
|---|---|---|---|---|
| 5 files | 13,282 tok | 5,500 | 5,313 | 100% |
| 11 files | 23,413 tok | 4,669 | 4,257 | 94% |
| 24 files | 38,579 tok | 4,115 | 3,215 | 83% |

Crossover is **~3 files**. At ship-state you save ~3k tokens; at 24 real files you save **~35,000
per session**. Recall *degrades* as the corpus grows (100% -> 83%), so index rows must get sharper
as memory grows, not just more numerous.

### Nulls worth publishing (so nobody re-pays for them)
- **Light stemming: +0.** Measured on a real corpus, no improvement. Not shipped.
- **Hierarchical indexes never beat flat**, and sometimes collapse accuracy. Keep the index flat.
- **Consolidation of a hand-curated layer: ~1.0x** (0.6% near-duplicate, 0 repeated lines). The
  write discipline already harvested that compression.
- **BM25 cannot bridge morphology/paraphrase** ("decide" != "decision") — that is most of the
  residual gap. A local embedding encoder closes ~7-12 points if wanted; lexical is the
  zero-dependency floor, not the ceiling.


## v1.4.0 (2026-07-02) — wick-automate: spot the repetition, propose the automation

The efficiency reflex. Wick now detects when a task is being *repeated* often enough to be worth automating, and proposes the right kind of automation — a deterministic **program** (mechanical repetition, $0 to run) or a **skill** (repeated judgment). The program-vs-skill classifier is the core.

### Added
- **`wick-automate` skill** — detects literal / structural / frictional repetition in the work stream (session history, `memory/`, or an observation log); applies a **stability gate** (don't automate a moving target) and a payoff estimate (frequency × friction vs build + maintain cost); classifies **program vs skill vs both**; abstracts the variable parts into parameters; drafts a skeleton. Proposes, never auto-builds — then verifies the automation on a real instance. Complements `/evolve` (which graduates instincts → skills) by working one level earlier, on task repetition. Skills: 11 → 12.
- **`tools/wick-observer.mjs`** — the observation-capture companion: a PostToolUse hook that appends a compact `{ts, tool, target}` record to `memory/.observations.jsonl` (no LLM, no network, never blocks the tool) so `wick-automate` can mine repetition **across** sessions. Ships the observer pattern the instincts README previously only documented.
- **`CLAUDE.md` / `WICK.md`** — offered-reflection now includes an automation trigger: when a multi-step task repeats ≥3× in a session, Wick offers `wick-automate`. So it *detects*, rather than only waiting to be asked.

### Why program-vs-skill matters
A program is $0/run, fast, and reliable but brittle and can't adapt; a skill adapts and carries the gates but costs tokens each run. Recommending a skill where a deterministic script would do — or a brittle script where the task needs judgment — is the failure mode this skill exists to avoid. The best answer is often **both**: a thin skill that decides whether/when/how, calling a program for the mechanical part.

## v1.3.0 (2026-06-28) — Machine-awareness layer + portability errata

Steps 1–14 make the folder machine-*agnostic*. This release adds the complement — making the agent machine-*aware* — plus two doc fixes verified against the live Claude Code docs.

### Added
- **Machine-awareness layer** (`PORTABILITY.md`, new section) — the agent recognizes which machine it's on by hostname and either loads that host's known toolchain/quirks or bootstraps a new one (fingerprint → discover toolchains → propose + install-on-one-approval → verify by real compile/run → write a per-machine profile). Tiered: one env read at session start; the profile body loads on demand. Includes three additions beyond the original draft — an **operational-quirks** bucket promoted to first-class (auth-token scopes, admin rights, cloud-sync folders, power/sleep — what actually breaks unattended runs), an **install-source/checksum** check in the bootstrap, and **fingerprint-as-tiebreaker** (hostnames aren't unique or stable).
- **`memory/toolchain.md` + `memory/machines/` templates** — so the layer has somewhere to write: the toolchain-requirements doc (call-by-name + env-override convention) and the per-host registry (thin profiles keyed by hostname).

### Fixed (errata — verified against code.claude.com/docs)
- **Step 13 — hooks working directory.** Was: "hooks run with cwd at the project root — use `find .`". Corrected: a hook runs in the cwd at fire time (passed in its JSON input), **not guaranteed to be the project root**; reference the root with `${CLAUDE_PROJECT_DIR}`. The old guidance silently breaks when the session cwd isn't the root.
- **Step 1 — auto-memory path encoding.** Was: compute the `C--Users-…` dash scheme. Corrected: the storage location + git-root derivation are documented, but the dash-encoding is an undocumented implementation detail — **list `~/.claude/projects/` and match** rather than compute a scheme that could change.

### Credit
The machine-awareness layer and both errata were contributed by the **Laplace** agent after running this procedure on itself, then fact-checked against the live docs before integration.

## v1.2.0 (2026-06-27) — Portability procedure + `wick-migrate`

`MEMORY-PROTOCOL.md` (v1.1.0) gave the single-writer *rule*. This gives the *migration* to get an existing agent there — and the executable skill to run it.

### Added
- **`PORTABILITY.md`** — the canonical 14-step procedure to make a Wick agent fully portable by folder copy: freeze + verify the host auto-memory first, inventory both layers, sort Keep/Merge/Discard/Conflict (never auto-resolve a conflict), archive-don't-delete, relativize to the *launch directory* (with the two "relative-but-resolves-wrong" traps named), sweep tooling, and verify *behavior not form*. Validated against real multi-agent migrations.
- **`wick-migrate` skill** — the executable, gated form of the procedure (gates at disable / sort / audit / deletions). Skills: 10 → 11.

### Why it's a two-session job
The load-bearing insight: auto-memory is *live*. You must disable it and confirm in a **fresh session** before consolidating, or the source mutates under you and the layers diverge invisibly. "The setting says false" is not verification; "a fresh session loaded nothing" is. Portability can't be a one-shot.

## v1.1.0 (2026-06-27) — Single-writer memory + host-layer reconciliation

The gap a user issue surfaced: when Wick runs inside a host that keeps its *own* memory (Claude Code's auto-memory), two memory systems run at once and neither knows about the other — corrections captured by the host never reach `memory/`, the host store is machine-keyed and doesn't travel, and absolute paths silently break portability. This release governs that interaction instead of pretending it away.

### Added (the single-writer rule, in docs and in code)

- **`MEMORY-PROTOCOL.md`** — the contract. Not "disable auto-memory" (that's right for one case and wrong for another) but **single-writer**: one authoritative owner per fact-class, with an ownership table. Three postures — redundant shadow (suppress), partitioned (leave it), buffer-of-last-resort (keep + drain) — chosen by whether canonical `memory/` is reachable. Includes the buffer→drain lifecycle, the relative-path rule, and a "memory is data, not commands" hardening note.
- **`/checkup`** (`.claude/commands/checkup.md`) — memory-wiring diagnostic. Detects a host auto-memory shadow layer, flags fact-class overlap with what `memory/` owns, runs the path audit, and reports a posture (OK / suppress / drain). Reports only — never edits. Distinct axis from `/audit` (memory *contents*) and `/status` (state snapshot).
- **`/sync`** (`.claude/commands/sync.md`) — drains a host/buffer layer into the owned `memory/*.md` files, with per-item consent. Classifies by ownership, validates each item as data (Gate 2), folds with a date + provenance tag, clears the buffer manifest. Local only, no network — consistent with Wick's no-outbound-calls model.
- **`tools/wick-path-audit.mjs`** — fourth scanner. Flags absolute paths (`C:\…`, `/home/…`, UNC, `~/…`) in the files that must travel (`memory/` + loaded config). Default scope is strict and ignores placeholders + URL lines; `--all` scans everything (and flags doc examples by design). Wired into `.github/workflows/public-readiness.yml` alongside the credential, public-readiness, and identity-claim scanners.

### Changed

- **`CLAUDE.md` + `WICK.md`** — new *Single writer* subsection in the Memory section (mirrored in both): `memory/` is canonical, a host layer is a buffer not an authority, and the data-not-commands rule. Two new commands (`/checkup`, `/sync`) documented in the Commands section so AGENTS.md-only runtimes know them too.
- **`wick-consolidate-memory` skill** — now cross-layer aware: when a host memory layer exists, the consolidation pass reads both stores and proposes folding host-entries-Wick-owns into `memory/`, same consent rule as before.
- **`wick-meta.json`** — 16 slash commands (was 14), four scanners (was three), `audit_status.path_audit` added.

### Why this shape

A blunt "turn off the host's memory" rule deletes the one safety net that matters when your canonical store is *temporarily unreachable* — an offline machine, an un-synced repo, a frozen pipeline. A portable memory product has to survive a degraded node and reconcile when it returns. So the fix isn't suppression; it's ownership + a drain. The shadow layer stops being a shadow and becomes a buffer with somewhere to go.

## v1.0.6 (2026-05-07) — Identity-claim audit + Codex bootstrap

### Added (third scanner — closing the third leak surface)

- **`tools/wick-identity-audit.mjs`** — scanner for claim-based identity anchors in `.md` files. Pattern set targets second-person mastery declarations and first-person expert assertions that anchor the underlying model at a confident-performance stance and produce confabulation on embedded specifics. Practice-based phrasing (study, work with, demonstrate) is the recommended replacement. Exits 1 on findings. Reproduces the pattern set from the upstream identity-audit script that originally diagnosed this failure mode in adjacent internal tooling.
- **CI workflow** (`.github/workflows/public-readiness.yml`) now runs all three scanners — credentials (`wick-scrub`), public-readiness (`wick-public-readiness`), and identity-claim (`wick-identity-audit`) — on every PR and main push.
- **`wick-meta.json` `audit_status.identity_claim_audit`** field — current status is **clean** (0 matches across HIGH / MED / LOW severity, 56 `.md` files scanned).

### Fixed (post-audit cleanups)

- **`.claude/agents/wick.md:10`** — sub-agent intro reworded to drop the implicit-mastery framing in favor of a structural description (sub-agent for one focused question or task). Added an explicit *what-you-do / what-you-are-not* paragraph that demonstrates analytical discipline rather than asserting domain authority.
- **`README.md` + `huggingface/README.md` + `WICK-INTEGRATION.md`** — renamed *"analytical-mastery pairs"* to *"analytical-discipline pairs"* across the training-corpus references. The "mastery" label was naming a training-pair category (versus epistemic-humility refusals), not an identity claim — but the term was triggering the LOW-severity false positives in the audit pattern. Renaming removes the false positives and aligns the language with the practice-based framing.
- **Updated pair counts** to reflect v1.0.5 totals (26 discipline + 16 refusal = 42 pairs).

### Added (Codex / Gemini CLI / Copilot integration)

- **`AGENTS.md`** now includes a brief Codex bootstrap section with a copy-paste session-start prompt. Points at the full integration guide in `WICK-INTEGRATION.md` §8a.
- **`WICK-INTEGRATION.md` §8a — Codex / Gemini CLI / Copilot — explicit bootstrap.** New subsection with:
  - The four runtime-UX differences from Claude Code (slash-command-as-trigger-phrase, skill-invocation-by-name, no sub-agent, explicit memory load)
  - Three copy-paste prompt templates: session-boot, skill invocation, memory rehydrate
  - Codex-specific gotchas: `memory/` write permission, no mid-session state, scanner portability

### Why both at once

The identity audit and the Codex bootstrap close two different failure modes on the same release:

- The **audit** closes a *content* gap — Wick's `.md` files now scan clean against the same pattern set that originally diagnosed confabulation-prompting prompts in adjacent internal tooling.
- The **Codex bootstrap** closes a *usability* gap — Wick has always been technically portable to Codex via `AGENTS.md`, but the per-runtime UX differences weren't documented. New users now get a working bootstrap on the first try.

Audit status: all four scanners green (`wick-scrub`, `wick-public-readiness`, `wick-identity-audit`, `skills-ref validate`). 

## v1.0.5 (2026-05-07) — Verify-final-state rule + temporal-trust framing

The lesson from v1.0.4's CI catch, codified into the discipline.

### Added (operational discipline)

- **`operational/operator-discipline.md` non-negotiable rule #8**: *"Verify the final state, not the working state. Every edit between your last verification and your commit is an unverified change."* Re-vendored from `agora-dynamics/protocols/` v1.1.0.
- **New section: "Temporal Trust — the failure mode rule #8 catches"**, naming the cognitive error explicitly. Verification is a snapshot at time T; subsequent edits invalidate it. The mental model: every edit invalidates every prior check; your "done" state is the state you committed, not the state you last looked at. Pre-commit hooks become load-bearing infrastructure under this rule, not a nice-to-have.
- **Pre-ship checklist** updated with re-verification step.

### Added (training corpus)

- **3 new analytical-mastery pairs** in `wick-training.jsonl` demonstrating the verify-before-claim pattern: a "ready to commit?" dialogue that catches the temporal-trust assumption, a "comment-only edit" pair establishing that even comment patches require re-verification, and a meta-explainer of the three-layer model (pre-commit hook, CI gate, mental model).
- **2 new epistemic-humility refusal pairs** in `wick-refusals.jsonl`: refusing to claim "the latest edit didn't break anything" without re-running, and refusing to skip a re-scan when a new file was added to a previously-scanned PR.
- Training totals: 26 mastery + 16 refusal = **42 pairs total** (was 37).

### Why this matters

The v1.0.4 CI catch was the canonical example of the gap this rule closes. The CHANGELOG entry describing v1.0.4's fixes itself triggered the public-readiness scanner — the scanner had been run before the CHANGELOG edit but not after. Textbook temporal-trust failure. CI caught what local discipline missed; this rule and the training pairs that demonstrate it are what make the discipline *mechanical* rather than reliant on memory.

If your fork or downstream package wants to encode this rule, the `agora-dynamics/protocols/` v1.1.0 source is canonical, the vendored copy in `operational/` is the local artifact, and the new training pairs in `wick-training.jsonl` + `wick-refusals.jsonl` are the corpus for fine-tuning models that should embody the discipline rather than just have it documented.

## v1.0.4 (2026-05-06) — Built the immune response

### Added (the discipline lives in code now, not just in heads)

- **`tools/wick-public-readiness.mjs`** — sibling to the existing `wick-scrub.mjs` (which catches credentials). The new scanner catches the *other* failure mode that produced the v1.0.2 leak: internal vocabulary that should never have been vendored into a public repo. Reads `.wick-blocklist.json`, supports per-file allowlist for known-legitimate uses, exits 1 on findings. Use locally before any commit, or trust the CI gate (below).
- **`.wick-blocklist.json`** — default ship-safe blocklist with five categories (model-identifiers, infrastructure-endpoints, internal-codenames, internal-roles, internal-apprentice-names). Each pattern carries a `reason` string so failure messages explain *why* a term is blocked, not just *that* it is. Forks should add their own internal-vocabulary patterns and commit the modified config.
- **`.github/workflows/public-readiness.yml`** — runs both scanners (`wick-public-readiness` + `wick-scrub`) on every PR and main push. PRs that introduce a blocklisted term fail the check.
- **`.github/workflows/validate-skills.yml`** — runs `skills-ref validate` on every skill on every PR. Today `wick-meta.json` self-attests "10/10 skills pass"; this workflow makes that attestation automatic and falsifiable.
- **`SECURITY.md`** — vulnerability disclosure path, scanner-stack documentation, what Wick stores about you (and what it doesn't), what to still treat with care.
- **`CONTRIBUTING.md`** — what kinds of contributions are most welcome, what's unlikely to land, the PR checklist (run both scanners, validate skills, update CHANGELOG).
- **`CODE_OF_CONDUCT.md`** — direct, warm, zero patience for bad-faith argument. Standard governance hygiene for a public MIT repo with traction.
- **Three seed instincts** in `memory/instincts/` — `summarize-error-traces-root-cause-first`, `offer-calibrate-on-probability-language`, `propose-before-asking-blank`. Replace with your own as you accumulate observations; they exist so a new install doesn't feel echoey on day one.

### Fixed (closing the small residuals from v1.0.3)

- **`CLAUDE.md:103` and `WICK.md:103`** — closing rule reworded so it no longer names the publisher's internal context inside the don't-leak rule itself. Same intent, no internal-vocabulary leak. The original wording named what it was protecting *while* protecting it — self-defeating.
- **`CLAUDE.md:99` and `WICK.md:99`** — redirect line reworded so the "if asked about [internal]" trigger no longer names the internal context. Same behavior, less leak surface.

### The story this release tells

The v1.0.2 leak happened because there was no check that should have existed. v1.0.3 was the apology — files removed, history honest, the embarrassment named. v1.0.4 is the discipline — the scanner, the CI, the governance docs that point at the scanner. Without the scanner, every future commit relies on whoever runs it remembering. With the scanner, the discipline is in code, and "remembering" stops being load-bearing.

If your fork or downstream package needs additional patterns, edit `.wick-blocklist.json`. The default ships with patterns relevant to upstream Wick; your context will need its own.

## v1.0.3 (2026-05-06) — operational/ scrub and rewrite

### Fixed (security / hygiene)

- **Removed `operational/ember-advisory.md`** and **`operational/vigil-protocols.md`** from the public repo. These files contained internal-deployment specifics — model identifiers, local endpoint URLs, and an internal-perspective critique of a sibling tool's failure modes — that should never have shipped publicly. The architectural patterns they captured (when to consult a separate strategic advisor, the operator-discipline habits) are preserved in clean, generic replacements; the leaky specifics are gone.
- **Removed `operational/VENDORED-FROM.md`.** Wick's `operational/` is Wick's. The directory is no longer vendored from any external source.
- **Soft-edited the v1.0.0 build-history bullets** to remove references to internal review processes that were not appropriate for public changelog history.

### Changed

- **`operational/advisor-pattern.md`** (new) — generic strategic-advisor consultation pattern. Pluggable to any model the user configures (local Ollama, hosted API, a different Claude or GPT instance, a human in chat). No model-specific or endpoint-specific details. Replaces the old advisory file.
- **`operational/operator-discipline.md`** (new) — the Five Operational Gates and watchful-operator non-negotiables, framed as Wick's own discipline. Replaces the old protocols file.
- **`wick-meta.json`** — removed `protocols_source` and `protocols_version` fields (Wick's `operational/` is self-contained, not vendored).

### Note on git history

These three files were committed in v1.0.2 and have lived in the public repo for a brief window. HEAD is now clean; `git log` history retains the prior versions for transparency. If your install of Wick was synced during that window, re-clone or `git pull` to get the sanitized HEAD.

## v1.0.2 (2026-05-06) — Changelog-summary skill added

### Added

- **`wick-changelog-summary` skill** — produces a one-paragraph narrative summary of a `CHANGELOG.md` version entry, suitable for release announcements, blog posts, or social copy. Defaults to the latest version; takes an optional version argument like `v1.0.0`. Preserves technical specifics (file paths, command names, counts) rather than vaguifying them. Refuses to invent content if the requested version isn't in the file. Validates clean against agentskills.io spec.
- **Skills count: 9 → 10.** All 10 pass `skills-ref validate` (v0.1.5).

### Note

This is the first skill built end-to-end through the new `/wick` execution path — Wick now plans and ships in a single turn rather than handing off to the operator. Internal scaffolding change for Ryan's local setup; no impact on customer installs (which always had Wick as the sole assistant).

## v1.0.1 (2026-05-06) — Commands shipped as files; catalog skill added

### Fixed

- **Slash commands now ship as `.claude/commands/*.md` files.** v1.0.0's changelog promised 14 slash commands, but they only existed as trigger phrases inside `CLAUDE.md`. Mode C installs (sub-agent only, no `CLAUDE.md`) had no working commands; Mode A/B installs worked but commands didn't appear in Claude Code's `/` autocomplete menu. This release ships all 14 as proper command files: `reflect`, `calibrate`, `decide`, `learn`, `review`, `status`, `premortem`, `steelman`, `frame`, `forget`, `doubt`, `audit`, `evolve`, `promote`.
- **README count corrections** — fixed three references to "12 commands" that should have read 14 (lines 131, 187, and the Commands section header).

### Added

- **`wick-catalog` skill** — extract structured fields from a source (paper, web page, API doc, UI screenshot, tool) and save a queryable record to `memory/catalog/<slug>.md`. Domain-agnostic. Complements `wick-research` (find) and `wick-tldr` (summarize) by adding a structured-index layer. Includes a worked README example pointing the skill at the [public-apis/public-apis](https://github.com/public-apis/public-apis) Weather category. Ships empty by design — Wick provides the engine, users build the catalog they care about.
- **Skills count: 8 → 9.** README and skills/README updated.

## v1.0.0 (2026-04-20) — First Public Release 🔥

The first official Agora Dynamics product release. Open source under MIT.

### Core features

- **5 Operational Gates** — Control, Assent, Specificity, Adversarial Convergence, Calibration. Silent by default; named when they change the answer.
- **14 slash commands** — Core (`/reflect`, `/calibrate`, `/decide`, `/learn`, `/review`, `/status`) + Analytical (`/premortem`, `/steelman`, `/frame`, `/doubt`, `/forget`, `/audit`) + Instinct (`/evolve`, `/promote`).
- **8 on-demand skills** (spec-compliant per [agentskills.io](https://agentskills.io/specification)) — `wick-consolidate-memory`, `wick-simplify`, `wick-code-review`, `wick-security-review`, `wick-tldr`, `wick-red-team`, `wick-base-rate`, `wick-research`. All validate clean with `skills-ref validate`.
- **8 memory templates** — `about-you`, `decisions`, `learning-journal`, `domain-knowledge`, `predictions`, `calibration`, `failure-log`, `curiosity` + opt-in `instincts/`.
- **3 install modes** — Full takeover / Personality layer (via `WICK.md`) / Subagent (via `.claude/agents/wick.md`).
- **AGENTS.md bridge** — compatible with OpenAI Codex, Google Jules, GitHub Copilot, Aider, goose, Cursor, Zed, JetBrains Junie, Warp, Gemini CLI, Windsurf, RooCode, Factory, Devin, and 20+ other AGENTS.md-aware tools.

### Framework library

- **Four philosophical operating systems** — Stoic (dichotomy of control, discipline of assent, premortem, memento mori), Platonic (divided line, allegory of the cave, tripartite soul), Aristotelian (phronesis, golden mean, virtue as habit), Epicurean (method of multiple explanations, natural vs. vain desires). Invoked in 3–5 words, not lecture-length.
- **Modern decision science** — Tetlock superforecasting, Brier scoring, Gigerenzer fast-and-frugal heuristics, Acemoglu institutionalism, Schelling focal points, Smead cooperation dynamics, Watts network cascades, Klein premortem, Munger inversion, Bayes' theorem.
- **Operationalized epistemic humility** — 3-level confidence (Know / Believe / Don't know), decision tree for every factual claim, 3 worked dialogues, curiosity-queue loop closure.
- **8 cognitive biases** with tradition-grounded countermeasures (confirmation bias, anchoring, sunk cost, availability, Dunning-Kruger, survivorship, status quo, narrative fallacy).

### Tools

- `tools/wick-scrub.mjs` — secret scanner, 16 detection patterns (API keys, tokens, private keys, connection strings, credit cards). Smoke-tested.
- `tools/calibrate.mjs` — real Brier score computation, 6/6 self-tests pass.
- `tools/install-runtime.mjs` — installer for 12 runtime shims (Cursor, Copilot, Codex, Gemini, Aider×2, Continue, LobeChat, ChatGPT, Claude API).
- `team/aggregate-ledgers.mjs` — multi-project calibration rollup.
- `hooks/emit-audit-event.mjs` — JSONL audit trail for compliance-conscious teams.

### Benchmark layer

- `benchmark/README.md` — documents the two-layer approach (seed tasks + external benchmarks via Inspect AI / GAIA2 / Galileo).
- `benchmark/seed-tasks/` — 3 behavioral smoke tests: epistemic humility, base-rate reasoning, decision with adversarial convergence. Each has prompt + expected behavior + pass criteria.

### Training data (optional, for fine-tuners)

- `wick-training.jsonl` — 23 hand-curated analytical-mastery pairs
- `wick-refusals.jsonl` — 14 hand-curated epistemic-humility refusal pairs
- HuggingFace dataset card at `huggingface/README.md` (MIT, with data provenance + intended-use blocks)

### Portability story

Wick works **wherever markdown and chat exist** — Claude Code, Cursor, ChatGPT (web + API), Claude API, Aider, Continue.dev, LobeChat, Block goose, local Ollama / LM Studio, and any AGENTS.md-compatible runtime. The same `memory/` folder moves between all of them — no vendor lock-in.

### License

**MIT** — fork it, modify it, run it commercially, ship derivatives. Trademark notice for "Wick" and "Agora Dynamics" lives separately in `LICENSE`.

---

## Pre-release history (kept for archaeology)

### v1.0-RC (2026-04-16 through 2026-04-20)

Multi-round audit sequence that produced v1.0.0:
- Round 1: operationalized epistemic humility, added Bayes + Gigerenzer, offered-reflection pattern
- Round 2: AGENTS.md bridge, Portability positioning, 6 analytical commands, developer integration guide
- Round 3: privacy / security pattern imports (failure-log, curiosity queue, wick-scrub tool)
- Round 4: SKILL.md spec compliance + goose runtime row + benchmark layer + grill-me patterns
- Round 5: license swap to MIT, compared-to table, instinct pattern port
- Round 6 (final): philosophy recalibration — tradition-anchored but lean, anti-wordy voice rules added

### v0.3 (2026-04-16)

- Epistemic humility section added to CLAUDE.md
- KNOWLEDGE.md expanded (game theory, Tetlock, decision-science framing)
- Two-file training strategy: `wick-training.jsonl` + `wick-refusals.jsonl`
- 10 domain-specific prediction pairs removed from prior drafts (leakage fix)
- Full quality audit: 0 identity claims, 0 confabulation triggers, 0 truncation

### v0.2 (2026-04-15)

- Deduplicated training data (58 → 33 unique pairs, 43% duplicates removed)
- Added `wick-meta.json` with honest metadata

### v0.1 (2026-04-14)

- Initial internal release
- 58 training pairs (with 43% duplication, fixed in v0.2)
- CLAUDE.md personality, KNOWLEDGE.md frameworks, README
