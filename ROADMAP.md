# ROADMAP

Phases from TRANSFER.md section 11. Each phase ends with passing tests and an update here.

| # | Phase | Status |
|---|---|---|
| 1 | Engine + harness | Done |
| 2 | Validator (`scripts/validate-content.ts`) | Done |
| 3 | Swipe UI, first human playtest | Built and deployed; playtest is yours |
| 4 | Elections, arcs, cabinet, run setup; harness targets met | Done |
| 5 | Bulk content to MVP scope | Done |
| 6 | Meta: codex, objectives, unlocks, daily seed, save migration | Done |
| 7 | PWA, then TWA | **Done for the web half** (this commit); Play packaging needs a machine with the Android SDK |

## Where the project stands now (v0.78.0)

The seven phases above built the game. Since then the work has been planned in rounds, each in
its own file: every item measured before it was built, and written up with what it did after.

| Round | File | Phases |
|---|---|---|
| 1 | `BACKLOG.md` | ten numbered items |
| 2 | `BACKLOG-2.md` | 8–17 |
| 3 | `BACKLOG-3.md` | 18–27 |
| 4 | `BACKLOG-4.md` | 28–29 |
| 5 | `BACKLOG-5.md` | 30–39 |
| 6 | `BACKLOG-6.md` | 40–44 |
| 7 | `BACKLOG-7.md` | 45–48 |
| 8 | `BACKLOG-8.md` | 49–51 |
| 9 | `BACKLOG-9.md` | 52–54 |
| 10 | `BACKLOG-10.md` | 55–65 |
| 11 | `BACKLOG-11.md` | 66–70, and five ideas not yet chosen |

Every phase is done but one: BACKLOG-2's phase 17, getting the game onto Play, which waits on
decisions only the owner can make.

| | |
|---|---|
| Content | 1,816 cards; 76 arcs, which are 44 stories and 16 questions written for each party; 80 endings, 77 of which a run can collect; 30 advisors; 31 modifiers; 675 history names written, 657 of which a run can be given; three eras, and five in a long reign |
| Tests | 892 unit tests and 59 browser tests |
| Balance | every harness target passes: section 8's, the informed voter's (BACKLOG-9 phase 54) and the long reign's (BACKLOG-5 phase 39) |
| Gates in CI | typecheck, unit tests, the strict content gate, and the browser audits |

### What is left

1. **A human playtest.** Still never done: every balance number in every round is from bots.
   The recorder and its report beside the bots (BACKLOG-5 phase 31, taken further in BACKLOG-7
   phase 46) are ready for it; the closed test is the way to get the runs.
2. **Getting onto Play** (BACKLOG-2 phase 17): where `assetlinks.json` lives, the policy check,
   whether the account needs a closed test first, then a signed build. The listing, the
   graphics (made from v0.73.1), the Data safety answers and the content-rating notes are in
   `twa/STORE.md`.
3. **Round eleven** (BACKLOG-11.md): ten ways to improve how the systems, the endings and the
   codex work, without adding cards. Phase 66 (v0.74.0) fixed the ten bugs the audit found,
   among them a lost honest vote counted as a win and a run ended by winning the office back;
   phase 67 (v0.75.0) says why a run cut short ended, phase 68 (v0.76.0) marks a side that
   would end it, phase 69 (v0.77.0) says the risk of the coup rolled once the vote is
   abolished, and phase 70 (v0.78.0) tells what happened out of office. Its two rule changes
   were measured and not built. Five ideas are left to choose from.

The list this file ended on after phase 7, and what became of it:

1. The human playtest: still open, above.
2. The voice edit pass: BACKLOG-7 phase 47, and `npm run voice` since.
3. The saint problem: BACKLOG-5 considered it and proposed no change. The saint bot takes the
   more honest side whatever it costs, so it dies by design; the mixed bot plays the same line
   but steps in when a meter nears its edge, and finishes 97% of runs.
4. Play packaging: still open, above.
5. Post-MVP scope: eras 4 and 5 are the long reign (BACKLOG-5 phase 39), and the content is past
   a thousand cards, forty arcs and fifty endings.

## Phase 1: what shipped

- `src/engine/`: types (section 6), mulberry32 RNG stored in state, `newRun`, `draw` with the
  section 7 draw order, `resolve` = apply choice + `checkOuster` + `checkElection` + `advanceEra`,
  `tickQueue`, `preview` for the UI's swipe hints, `endRun` with epilogue lookup.
- `src/content/`: 30 placeholder event cards for era 1 (16 any, 7 left, 7 right, every band
  covered for both alignments), 5 queued consequence cards, 4 election cards, 12 advisors, 13
  endings, 9 epilogues. No arcs or modifiers yet (phase 4).
- `src/sim/` + `scripts/simulate.ts`: random, greedy-meter, saint and mixed bots; report with run
  length, ouster causes, band distribution, relaxed-draw counts, and the section 8 target checks.
- `tests/`: 69 tests over RNG, state, draw priority and filters, arcs, elections, eras, endings,
  determinism, content integrity, and harness invariants. The section 8 target assertions exist
  but are skipped until phase 4 tunes content.

## Phase 1: harness results (10,000 runs per bot, seed 1, alternating alignment)

| Bot | Median cards | Ended in era 1 | Reached finale | Exit band decay / muddle / ascent | Top ending |
|---|---|---|---|---|---|
| random | 58 | 27% | 3% | 40 / 57 / 4 | bankruptcy 69% |
| greedy | 105 | 0% | 75% | 80 / 20 / 0 | finale_decay 66% |
| saint | 25 | 100% | 0% | 0 / 0 / 100 | bankruptcy 50%, election_loss 48% |
| mixed | 105 | 4% | 53% | 40 / 58 / 2 | bankruptcy 43% |

| Target (section 8) | Result |
|---|---|
| random: median run 40–60 cards | PASS, 58 |
| random: no single ouster cause above 35% | **MISS**, bankruptcy 69% |
| greedy: survives long | 105-card median, 75% reach the finale (no number in the spec) |
| greedy: ends in Decay ≥ 70% | PASS, 80% |
| saint: ousted before era 2 ≥ 60% | PASS, 100% |
| mixed: reaches Ascent 15–30% | **MISS**, 1.8% by exit band, 0.2% finale-in-Ascent |

Reproduce with `npm run simulate`. 40k runs take about 17 s.

### Why the two misses happen (established from the report, not guessed)

1. **Bankruptcy dominates because the placeholder deck drains Money.** Mean effect per event
   choice is Money −1.30 against roughly 0 for the other meters, and only seven choices in the
   whole deck add Money. The random bot bleeds out on Money long before any other meter moves
   far. Lever: phase 5 content needs Money inflows (revenue events, sponsor deals as tempting
   options) and honest costs spread across all four meters. This is a content fix, not a knob.

2. **The mixed bot cannot reach Ascent because honest choices cost far more than tempting
   ones give.** Drift-positive choices average −3.8 total meter points; drift-negative ones
   average +0.3. Playing honestly drives Mood under the election threshold, so the mixed bot's
   survival rule cheats 84% of elections at −20 drift each. Sweeps confirm knobs do not fix it:
   `--danger 40` cuts cheating to 60% but Ascent falls to 0.3% because the bot spends the time
   in greedy mode; `--set electionMoodThreshold=30` on top changes nothing. Lever: make the
   honest side's immediate meter cost close to the tempting side's benefit (roughly ±2 vs ±2)
   and put the real difference in delayed consequences (section 5.6 says this mechanic matters
   more than the meters). Also give honest play some Mood-neutral options.

3. **Not a miss, but a warning: the saint dies at card 25 in essentially every run** (100%
   before era 2, median 25). The spec asks for good to be costly, not impossible. The same
   content fix as item 2 will pull this down toward the 60% floor.

4. **Greedy passes partly for the wrong reason.** Half its Decay drift comes from rigging
   elections whenever Mood is under 40 at election time. Re-check this target after item 2.

Other observations: `relaxed draws` are high (random bot: 30 cooldown-relaxed and 23
era-relaxed draws per run) because 35 event cards cannot fill 105 slots with a 15-card cooldown
and only era 1 has content. Band relaxation never triggered. Expect these to fall to zero with
MVP content; the phase 2 validator enforces minimum cell sizes.

## Decisions made in phase 1 that TRANSFER.md did not spell out

Change any of these by editing `src/engine/config.ts` or the types; tests cover each.

- **Election honesty marker.** `Choice.honest: true` marks the honest side of an election card.
  The engine applies `election_loss` (or the choice's own `ending`) only when Mood is below the
  threshold; otherwise the honest choice's fx apply as a win. Cheat sides are plain data (drift,
  flags). `Choice.electionDelay` lets a cheat shorten the next interval (postponement). (Removed
  in BACKLOG-11 phase 66: the era's end reset the clock first, so it never took effect.)
- **Abolished elections** become a coup roll in `checkElection`: risk = 0.05 + 0.01 × (Order
  shortfall below 50 + Institutions shortfall below 50). No card is shown for it yet.
- **Finale.** The last era (3 in MVP) ends the run with `finale_<band>`; those are endings.
- **Exit band for epilogues** is the band implied by drift at exit (or the locked band), not the
  band stored at the last era boundary. Otherwise every era-1 death would show the muddle
  epilogue and short runs would never reveal the futures.
- **Era boundary** also pulls meters halfway back to 50 (`eraMeterPull: 0.5`) and restarts the
  election clock. With `eraMeterPull=0` the random median drops to 44 and greedy's finale rate to
  45%; still passes the same targets. Kept at 0.5 pending a human playtest.
- **Era 1 is always muddle** under the spec's "band recomputed at era boundaries" rule, so
  era-1 cards without `muddle` in `bands` never draw in era 1. Phase 1 content still tags bands
  as the brief asked; those cards only appear in eras 2–3 via the fallback below. Decide in
  phase 4 whether era 1 should read the live band (drift) instead.
- **Draw fallback ladder.** When a strict pool (era × band × align, cond, cooldown, oneShot) is
  empty the engine relaxes cooldown, then band, then era, then both, and throws only when
  nothing exists. The harness counts these as `relaxed draws`.
- **Queued cards respect `cond`** and are dropped if it fails when due, so a consequence can be
  averted (re-fund the schools before "nobody can read the ballot" lands). They ignore era,
  band, align and cooldown.
- **`weight: 0`** means a card is never drawn from the random pool (queue, arc or election only).
- **`next` on a non-arc card** queues the target for the very next draw. On arc cards it moves
  the arc pointer; arcs continue with `arcContinueProb` per draw and enter with `arcEntryProb`
  per draw while under the run's `arcBudget` (4–6, rolled from the seed).
- **State additions:** `current` (card on the table) and `arcBudget`.
- **Bots.** Greedy minimizes squared distance of all meters from 50 and never picks a side that
  ends the run on the spot. Mixed is saint unless a meter is under 25 or over 75 (`--danger`),
  and also swaps sides when the saint choice ends the run and the other does not. "Reaches
  Ascent" is scored by exit band; the report also prints finale-in-Ascent as the stricter
  reading.

## Open decisions for Evan

- Title, country and party names (`src/content/strings.ts` holds placeholders).
- Whether era 1 should use the live band for its card pool (see above).
- Which reading of "reaches Ascent" the mixed-bot target should use.
- Keep `eraMeterPull` at 0.5, or let inherited crises carry over in full.
- Monetization and one-alignment-steeper tuning remain open from TRANSFER.md.

## Phase 2: what shipped

- `src/validate/`: a dependency-free schema checker for the raw JSON (unknown fields, wrong
  types, bad enums, id pattern, ranges, duplicate entries, exact paths in every message), the
  semantic rules below, a disk loader that classifies every file under a content root, and a
  cross-check that every item on disk is imported by `src/content/index.ts` and vice versa.
- `scripts/validate-content.ts`: the CLI. `npm run validate` is the day-to-day check;
  `npm run validate:mvp` is the gate for phase 5 (`--eras all --min-cell 25 --strict`).
- `.github/workflows/ci.yml`: typecheck, tests and validator on every push and pull request,
  so "fails CI" in section 8 means something.
- `tests/fixtures/broken/`: a content root that trips every rule on purpose, plus
  `tests/fixtures/valid.ts`, a minimal set the validator accepts with zero issues. Tests
  cover each rule in isolation, the broken root, the shipped root, and the CLI exit codes.

### Rules and their codes

Errors fail the run. Warnings pass unless `--strict`.

| Code | Level | Rule |
|---|---|---|
| `schema`, `json-syntax`, `file-unclassified`, `file-missing` | error | Malformed JSON, unknown or mistyped fields, stray files, missing `advisors/modifiers/endings/epilogues.json`. Schema-failed items are dropped before semantic checks. |
| `duplicate-id` | error | Duplicate card, arc, ending, advisor, modifier id or epilogue band:align:era. |
| `unknown-ref` | error | `enqueue`, `next`, `ending`, `arc`, arc `cards` or modifier `arcWeights` naming an id that does not exist. |
| `flag-unread`, `flag-unset`, `flag-cleared-unset`, `flag-set-and-cleared` | error | Flags must be both set and read. `elections_abolished` counts as read by the engine (only a warning if nothing sets it). |
| `arc-unreachable`, `arc-no-exit`, `arc-membership`, `arc-next-outside`, `arc-dead` | error | Every listed arc card reachable from the entry card via `next`; some reachable choice must exit (no `next`, or an `ending`); membership consistent both ways with `type: "arc"`; `next` stays inside the arc; weight 0 arcs never start. |
| `arc-cycle`, `next-into-arc` | warn | A `next` loop; a plain card's `next`/`enqueue` jumping into an arc card. |
| `ending-unreachable`, `ending-missing` | error | Every ending is named by a reachable card or by the engine (meter extremes, election loss, coup, finales); every engine ending is defined. |
| `card-unreachable` | error | A non-arc card with `weight: 0` (or type `ending`) that nothing enqueues or points at. |
| `cell-thin` | error | Fewer than `--min-cell` eligible event cards for an era × band × align (default 16, cooldown + 1). |
| `election-missing` | error | No unconditional election card for an era × band × align, which would let a due election be skipped. |
| `epilogue-missing` | error | No epilogue resolves for a band × align × era. |
| `election-honest`, `honest-misplaced` | error | Election cards mark exactly one honest side; `honest` only on election cards (and `electionDelay`, until BACKLOG-11 phase 66 removed it). |
| `speaker-unknown` | error | Speaker role with no advisor. |
| `cond-unsatisfiable` | error | A flag both required and forbidden; meter bounds outside 0..100 or leaving no integer. |
| `no-tradeoff` | warn | Both choices move every meter and drift in the same direction (section 8). |
| `text-length`, `label-length`, `fx-zero`, `era-out-of-range`, `era-empty`, `trait-unknown`, `ending-card` | warn | Content-plan limits (160 / 24 characters), zero effects, eras beyond `eraCount`, eras with no cards in `auto` mode, unknown advisor traits, `ending` cards that do not end on both sides. |
| `not-imported`, `not-on-disk` | error | Real content only: disk and `src/content/index.ts` disagree. |

`--eras auto` (default) checks only eras that have event cards and warns about the rest, so
the placeholders pass today; the phase 5 gate uses `--eras all`. Ids are lowercase
snake_case by rule; loosen `ID_PATTERN` in `src/validate/schema.ts` if that gets in the way.

Not checked, on purpose: whether a card's `cond` is ever satisfiable at runtime (that needs
simulation, and the harness's `relaxed draws` already shows starved cells), and card
reachability through arcs beyond "the arc can start".

## Phase 3: what shipped

Live at https://rcjlabs.github.io/Rule-or-Drool/ (deploys from `main`, see below).

- **App shell**: Vite + React + TypeScript, `src/main.tsx` and `src/ui/`. Procedural SVG
  and CSS only, system fonts only, no art assets. Mobile first; keyboard on desktop.
- **Setup screen**: pick a side (party names from `strings.ts`), a seed (shown on the ending
  screen so odd runs can be reported and replayed), continue a saved run.
- **Play screen**: four meter silhouettes filled to their value (Mood's mouth follows the
  value; meters under 15 or over 85 pulse red). One card: procedural portrait, speaker name
  and role, text. Drag to swipe; the choice label for that side fades in with the drag, and
  affected meters show a dot sized by magnitude with direction hidden (section 9). Keyboard:
  an arrow peeks, the same arrow again (or Enter) commits, Escape cancels. Era name and year
  in the footer with a progress bar. A hint line shows until the first swipe.
- **Era transition** overlay between eras; the next card is not drawn until dismissed.
- **Ending screen**: ending title and text, the epilogue with its band named, run stats.
- **Frame theming as the trajectory meter**: `themeFor(drift)` puts the frame in stage 1 at
  |drift| 10, stage 2 at 30, stage 3 at 55, on live drift, so signs show before the ±25 band
  line and before an era boundary. Decay: louder palette per stage; a sponsor banner at stage 1,
  a news ticker at 2, an AD badge and a crooked layout at 3; Comic-style font from stage 2;
  meter labels dumb down ("Vibes", "Cash", "Cops", "Gov Stuff", then worse); card text gets
  the `degrade()` typo transform (0.3 at stage 2, 0.6 at stage 3). Ascent: calmer blue-grey
  palette, serif type and more whitespace from stage 2, thinner rules and more line-height at 3.
- **Portraits**: procedural SVG per role (cap, wig, glasses, top hat, headset, monocle, bandana,
  rosette) with skin, hair, background, head shape and eye spacing varied by seed and advisor.
- **Local save** after every step under `RUN_SAVE_VERSION`; a different version is ignored.
- **Debug mode**: add `?debug=1` to the URL for a panel with drift, band, theme, era, card id,
  flags and queue. `[` and `]` shift drift by 10 so every look can be checked in seconds.
- **Deploy**: `.github/workflows/deploy.yml` runs on every push to `main`: check, build, and
  publish `dist/` to the `gh-pages` branch. CI now also builds.
- **Tests**: 122 passing (UI: degrade, theme, flow, save, App keyboard flow, saved-run resume,
  theming via the debug nudge, CardView drag threshold, Ending). A headless Chromium run of the
  production build went setup → drag → Decay/Ascent looks → era transition → ending with no
  page errors before this was pushed.

### First human playtest: what to look for

Section 13 says the harness cannot tell whether temptation feels tempting. Only this can.

1. **Temptation.** Note cards where the honest side was the obvious pick anyway, and cards
   where you took the easy side knowing better. Both lists are content bugs of different kinds.
2. **Hidden drift.** Which stage-1 sign did you notice first (palette, banner, tilt, labels)?
   Did a band change ever feel arbitrary? Use `?debug=1` on a second run to compare.
3. **Dots.** Is magnitude-only enough to plan, or does hiding direction just feel random?
4. **Elections.** Did rigging feel like a choice or an obligation? Was the honest loss fair?
5. **Feel.** Does the drag ever fight the browser (scroll, back-swipe, text selection)? Is the
   card reachable one-handed? Is the fly-off too slow?
6. **Voice.** Anything that reads as a real party, person or country. Anything that is not
   funny by the third time.

Log the seed and card id (debug panel) for anything odd; runs replay exactly from a seed.

### Decisions made in phase 3

- The theme follows live drift, not the era-locked band, per section 9's "early signs".
- Keyboard uses peek-then-confirm so labels stay hidden until you ask, like a drag.
- The era transition holds the next draw so the interstitial is not skippable by accident.
- Choice labels are only visible while dragging or peeking (Reigns convention). Screen-reader
  users cannot choose yet: known limit, fix in phase 6 or 7 with hidden buttons.
- Sponsor names are procedural placeholders; the meter label variants and era jump texts
  live in `strings.ts` for editing.
- Decay's font stack asks for Comic Sans, Chalkboard or Marker Felt and falls back to
  `cursive`. On devices without any of them (Linux, some Android) the fallback is whatever
  the browser maps `cursive` to, sometimes a serif. Bundling a font would fix it and is a
  phase 7 decision (offline size).
- Deploying goes through the **GitHub Actions Pages pipeline** (`configure-pages`,
  `upload-pages-artifact`, `deploy-pages`), not a `gh-pages` branch. The first attempt used
  the branch method on the theory that GitHub would auto-enable Pages for a public repo. It
  did not, and the branch method has no way to ask for it. `configure-pages` with
  `enablement: true` does, and it worked: `deploy-pages` then published successfully, which
  it only does when the Pages source is "GitHub Actions". Nobody had to open Settings. The
  method also keeps build output out of git history.
- The old `gh-pages` branch is now unused. It is harmless, but delete it if you want the
  branch list clean; nothing reads it any more.
- **The deploy job is gated by the `github-pages` environment's branch list, and `main` is
  still not on it.** The environment was created while `claude/new-session-x759ml` was the
  repository default, and GitHub wrote that branch into its deployment-branch policy.
  Neither changing the default branch to `main` nor editing the environment has yet cleared
  it. A push or dispatch on `main` is rejected before the deploy job's first step: a
  one-second failure with no log, which looks like a broken workflow and is not one. The
  build half passes every time.

  The cleanest test, run on commit `9b450d8` minutes apart: dispatching the workflow on
  `main` failed, and dispatching the identical commit on `claude/new-session-x759ml`
  deployed successfully. That rules out the event type and the commit, and leaves the
  branch. `deploy-pages` itself succeeds, so Pages is correctly configured with the
  "GitHub Actions" source; only the branch list is wrong.

  **Two ways to fix it, both in the UI, since the environments API is blocked from a
  session.** Either set Settings → Environments → `github-pages` → Deployment branches and
  tags to "No restriction", or delete the `github-pages` environment outright: the next
  deploy recreates it, and it will pick up `main` now that `main` is the default branch.
  A "Selected branches and tags" list only matches an entry spelled exactly `main`, and a
  tag rule or a pattern like `main/*` will not match.

## Phase 3: what shipped

Live at https://rcjlabs.github.io/Rule-or-Drool/ (deploys from `main`, see below).

- **App shell**: Vite + React + TypeScript, `src/main.tsx` and `src/ui/`. Procedural SVG
  and CSS only, system fonts only, no art assets. Mobile first; keyboard on desktop.
- **Setup screen**: pick a side (party names from `strings.ts`), a seed (shown on the ending
  screen so odd runs can be reported and replayed), continue a saved run.
- **Play screen**: four meter silhouettes filled to their value (Mood's mouth follows the
  value; meters under 15 or over 85 pulse red). One card: procedural portrait, speaker name
  and role, text. Drag to swipe; the choice label for that side fades in with the drag, and
  affected meters show a dot sized by magnitude with direction hidden (section 9). Keyboard:
  an arrow peeks, the same arrow again (or Enter) commits, Escape cancels. Era name and year
  in the footer with a progress bar. A hint line shows until the first swipe.
- **Era transition** overlay between eras; the next card is not drawn until dismissed.
- **Ending screen**: ending title and text, the epilogue with its band named, run stats.
- **Frame theming as the trajectory meter**: `themeFor(drift)` puts the frame in stage 1 at
  |drift| 10, stage 2 at 30, stage 3 at 55, on live drift, so signs show before the ±25 band
  line and before an era boundary. Decay: louder palette per stage; a sponsor banner at stage 1,
  a news ticker at 2, an AD badge and a crooked layout at 3; Comic-style font from stage 2;
  meter labels dumb down ("Vibes", "Cash", "Cops", "Gov Stuff", then worse); card text gets
  the `degrade()` typo transform (0.3 at stage 2, 0.6 at stage 3). Ascent: calmer blue-grey
  palette, serif type and more whitespace from stage 2, thinner rules and more line-height at 3.
- **Portraits**: procedural SVG per role (cap, wig, glasses, top hat, headset, monocle, bandana,
  rosette) with skin, hair, background, head shape and eye spacing varied by seed and advisor.
- **Local save** after every step under `RUN_SAVE_VERSION`; a different version is ignored.
- **Debug mode**: add `?debug=1` to the URL for a panel with drift, band, theme, era, card id,
  flags and queue. `[` and `]` shift drift by 10 so every look can be checked in seconds.
- **Deploy**: `.github/workflows/deploy.yml` runs on every push to `main`: check, build, and
  publish `dist/` to the `gh-pages` branch. CI now also builds.
- **Tests**: 122 passing (UI: degrade, theme, flow, save, App keyboard flow, saved-run resume,
  theming via the debug nudge, CardView drag threshold, Ending). A headless Chromium run of the
  production build went setup → drag → Decay/Ascent looks → era transition → ending with no
  page errors before this was pushed.

### First human playtest: what to look for

Section 13 says the harness cannot tell whether temptation feels tempting. Only this can.

1. **Temptation.** Note cards where the honest side was the obvious pick anyway, and cards
   where you took the easy side knowing better. Both lists are content bugs of different kinds.
2. **Hidden drift.** Which stage-1 sign did you notice first (palette, banner, tilt, labels)?
   Did a band change ever feel arbitrary? Use `?debug=1` on a second run to compare.
3. **Dots.** Is magnitude-only enough to plan, or does hiding direction just feel random?
4. **Elections.** Did rigging feel like a choice or an obligation? Was the honest loss fair?
5. **Feel.** Does the drag ever fight the browser (scroll, back-swipe, text selection)? Is the
   card reachable one-handed? Is the fly-off too slow?
6. **Voice.** Anything that reads as a real party, person or country. Anything that is not
   funny by the third time.

Log the seed and card id (debug panel) for anything odd; runs replay exactly from a seed.

### Decisions made in phase 3

- The theme follows live drift, not the era-locked band, per section 9's "early signs".
- Keyboard uses peek-then-confirm so labels stay hidden until you ask, like a drag.
- The era transition holds the next draw so the interstitial is not skippable by accident.
- Choice labels are only visible while dragging or peeking (Reigns convention). Screen-reader
  users cannot choose yet: known limit, fix in phase 6 or 7 with hidden buttons.
- Sponsor names are procedural placeholders; the meter label variants and era jump texts
  live in `strings.ts` for editing.
- Decay's font stack asks for Comic Sans, Chalkboard or Marker Felt and falls back to
  `cursive`. On devices without any of them (Linux, some Android) the fallback is whatever
  the browser maps `cursive` to, sometimes a serif. Bundling a font would fix it and is a
  phase 7 decision (offline size).
- Deploying goes through the **GitHub Actions Pages pipeline** (`configure-pages`,
  `upload-pages-artifact`, `deploy-pages`), not a `gh-pages` branch. The first attempt used
  the branch method on the theory that GitHub would auto-enable Pages for a public repo. It
  did not, and the branch method has no way to ask for it. `configure-pages` with
  `enablement: true` does, and it worked: `deploy-pages` then published successfully, which
  it only does when the Pages source is "GitHub Actions". Nobody had to open Settings. The
  method also keeps build output out of git history.
- The old `gh-pages` branch is now unused. It is harmless, but delete it if you want the
  branch list clean; nothing reads it any more.
- **The deploy job is gated by the `github-pages` environment's branch list, and that list
  does not follow the default branch.** Enabling Pages created the environment while
  `claude/new-session-x759ml` was still the default, and GitHub wrote that branch name into
  the environment's deployment-branch policy. Changing the repository default branch to
  `main` afterwards did not rewrite it: pushes to `main` are still rejected before the
  deploy job's first step, a one-second failure with no log, which looks like a broken
  workflow and is not one. The build half passes every time.

  Established by three observations, not inference: the same commit deploys successfully
  when dispatched from `claude/new-session-x759ml`; a push to `main` failed identically both
  before and after the default branch changed; and `deploy-pages` itself succeeds, which it
  only does when the Pages source is "GitHub Actions". So Pages is configured correctly and
  only the branch list is wrong.

  **The fix is one setting:** Settings → Environments → `github-pages` → Deployment branches
  and tags → add `main`, or switch it to "No restriction". Nothing in the repository needs
  changing, and the API path that would let a session do this is blocked by the sandbox.

### Deploying

The site is live at https://rcjlabs.github.io/Rule-or-Drool/ and Pages is already enabled
with its source set to "GitHub Actions". No settings visit was needed for that.

- **One thing left:** clear the `github-pages` environment's branch restriction, either by
  setting it to "No restriction" or by deleting the environment and letting the next deploy
  recreate it. Until then a push to `main` starts a Deploy run whose deploy job is rejected
  after one second, as described above. Both the default-branch change and an edit to the
  environment have already been tried and did not clear it.
- Until then, deploy by dispatching the workflow from the branch the environment does allow:
  Actions → Deploy → Run workflow → pick `claude/new-session-x759ml`. That is how every live
  build so far got there, and both branches point at the same commit.
- Once `main` is on the environment's list: push to `main` and it runs check, build and
  deploy, and the site updates a minute or two later. Other branches and pull requests run
  CI only, so a push to `main` no longer triggers two duplicate runs.
- The repository's default branch was set to the first branch pushed
  (`claude/new-session-x759ml`). Switch it to `main` in Settings → General so pull requests
  target the right branch.
- Every deploy bumps `APP_VERSION` in `src/version.ts`; from phase 7 also `CACHE_NAME` in
  `public/sw.js`.

## Phase 4: what shipped

All five section 8 targets pass. Measured over 10,000 runs per bot, `npm run simulate`:

| Target | Result |
|---|---|
| random: median run 40–60 cards | PASS, 51 |
| random: no single ouster cause above 35% | PASS, bankruptcy 31.8% |
| greedy: ends in Decay ≥ 70% | PASS, 95.3% |
| saint: ousted before era 2 ≥ 60% | PASS, 100% |
| mixed: reaches Ascent 15–30% | PASS, 23.8% |

`npm test` now asserts these, so a content change that breaks the balance fails CI.

- **Cabinet (5.8).** Two advisors per role, eighteen in all, each carrying hidden traits.
  A trait scales the meter effects of that advisor's own cards: `competent` 1.3 gain and
  0.7 loss, `loyal` 0.85 loss, `zealot` 1.4 both ways, `corrupt` 1.35 loss. Traits multiply
  when stacked, and stack on top of band volatility. Run start writes one
  `advisor_<trait>` flag per trait sitting in the cabinet, which is how arcs and cards gate
  on cabinet quality. A choice may carry `fireSpeaker`, which swaps that role's advisor and
  refreshes the flags; `preview` deliberately does not, so the swipe hint stays honest.
- **Run setup (5.9).** `rollSetup` draws one opening crisis, one leader trait and one flaw
  from twelve modifiers, deterministically from the seed. They move starting meters, set
  flags that gated cards read, and weight arcs. Starting meters are then clamped to 25–75
  so no run opens in the danger zone. The setup screen shows the draw before you commit,
  and the ending screen repeats it.
- **Arcs (5.7), three of them.** `term_limits` enters when mood is under 45 and elections
  still exist, and runs find-an-emergency, permanent-powers, leader-for-life, each step
  refusable. `cabinet_plot` enters only with a corrupt advisor in the room and ends either
  in a firing, a confession, or the `blackmailed` ending. `moonshot` enters on strong
  institutions and pays off only if you keep funding it and open the tender.
- **Content: 130 cards across all three eras**, up from 39 in era 1. Era 2 is automation,
  captured feeds and private policing; era 3 is code nobody can read, orbital colonies and
  a heat belt. Eighteen consequence cards, thirty-one tempting choices now enqueue one.
  The validator passes clean at the default cell minimum for every era, band and alignment.

### How the balance was actually found

The harness prints a per-side effect budget, which is the dial worth watching:

```
  tempting  n=116  drift  -3.56  mood  1.40  money  1.88  order  1.02  inst -1.62
  honest    n=116  drift   3.70  mood -1.47  money -3.21  order -0.81  inst  2.09
```

Three findings, each established by measurement rather than taste:

1. **Institutions were the hidden killer.** Honest play raised Institutions about 3 a card,
   so a careful player hit the paralysis end inside twenty cards and, more importantly, sat
   permanently in the mixed bot's danger zone, which forced it into greedy mode and made it
   cheat 72% of elections. Halving the Institutions swing on both sides fixed the Ascent
   target more than any other change.
2. **Mood must stay flat across the deck.** When honest choices were made cheap in mood,
   mood inflated for everyone, personality-cult endings hit 55%, and the greedy bot started
   picking honest options purely to push meters back toward the middle, which collapsed its
   Decay rate to 22%. Tempting and honest mood effects have to roughly cancel.
3. **Run length and Ascent need different levers.** Overall effect magnitude sets how long a
   random run lasts; `eraMeterPull` sets how much recovery room a careful player gets. Trying
   to fix both with one knob fails: at pull 0.3 random is fine and Ascent is 7%, at 0.5 the
   reverse. Magnitudes went up 20% and pull went 0.5 to 0.65, and both targets land.

`eraMeterPull` is the single most sensitive constant in the game. Ascent runs 12% at 0.5,
24% at 0.65, 26% at 0.7. Treat it as a balance dial, not a detail.

### Decisions made in phase 4

- Traits change meter effects only, never drift. The spec says traits "modify the effects of
  that speaker's cards"; letting them touch drift would make cabinet luck silently decide the
  ending, which the hidden-drift design cannot afford.
- `term_limits` ends in abolished elections rather than an ending card, so the existing
  coup-risk check does the killing. That reuses a mechanic instead of adding a cul-de-sac.
- Arc entry gates on cabinet traits through flags rather than a new condition type, so the
  validator's flag rules cover them for free.
- The validator learned two things: `advisor_*` flags are engine-set, so reading one without
  setting it is legal, but naming a trait no advisor has is an error; and `fireSpeaker` on a
  role with only one advisor is a warning, since it silently does nothing.
- The saint bot sits at 100% ousted before era 2 against a floor of 60%. It passes, but the
  margin is one-sided: honest play is currently not merely costly, it is fatal without the
  occasional compromise. Worth revisiting in phase 5 if playtests say good feels impossible
  rather than expensive.

## Phase 5: what shipped

Every number in the section 10 MVP column is met, and `npm run validate:mvp` passes with
zero errors and zero warnings. That gate is now what CI runs, so the scope cannot silently
regress.

| | MVP target | Shipped |
|---|---|---|
| Cards | ~300 | 323 |
| Arcs | 12 | 12 |
| Endings | 20 | 20 |
| Advisors | 12 | 18 |
| Traits, flaws, crises | 4 each | 4 each |
| Alignment-neutral share | ~50% | 50% exactly |
| Cards per era × band × align | 25 minimum | 29 to 75 |

- **262 event cards** across three eras, 130 alignment-neutral, 66 left and 66 right. Era 1
  is heaviest as the plan asks. Era 2 is automation, captured feeds, private policing and
  the first orbital ring; era 3 is code nobody can read, hereditary offices, the heat belt
  and the long ship.
- **Nine new arcs**, twelve in total: `purge` and `strongman` give each alignment its own
  road down, and `impeachment`, `succession`, `secession`, `press`, `plague`, `oracle` and
  `water` are open to both. Seven of them carry an ending.
- **Six new endings** fill the ouster list section 5.5 names: impeachment, assassination and
  exile, plus leader-for-life, stepping down cleanly, and being consumed by your own purge.
  A 12,000-run sample reaches **all twenty**, none orphaned.
- **Arcs now fire 4.3 times per run** against a budget of four to six, so plot varies
  between runs the way section 5.7 intends.

### Rebalancing after the content tripled

Tripling the deck broke the balance, as expected, and the per-side budget showed exactly
where. The new cards leaned on Institutions and swung harder than the old ones:

| | Institutions swing | Random median | Mixed reaches Ascent |
|---|---|---|---|
| After writing, before tuning | tempting −2.65, honest +3.16 | 33 cards | 8% |
| After tuning | tempting −1.77, honest +1.99 | 50 cards | 22.8% |

Four passes got there, each aimed at one measured problem: scale Institutions and Mood back
toward the phase 4 budget, compress all magnitudes by 15% because the new cards had larger
individual swings and were ending random runs too early, ease the honest Money cost because
bankruptcy had grown to 42% of all ousters, and re-centre `eraMeterPull`.

**`eraMeterPull` moved from 0.65 to 0.22**, which looks dramatic and is not. A bigger deck
with twelve arcs supplies its own variance and its own recovery, so the artificial pull back
toward the middle at each era boundary is doing far less work than it was with 39 cards. It
remains the most sensitive constant in the game: Ascent runs 19% at 0.18, 23% at 0.22 and
37% at 0.35.

Final state over 40,000 runs, all five targets passing:

| Target | Result |
|---|---|
| random: median run 40–60 cards | 50 |
| random: no single ouster cause above 35% | bankruptcy 17.8% |
| greedy: ends in Decay ≥ 70% | 77.6% |
| saint: ousted before era 2 ≥ 60% | 100% |
| mixed: reaches Ascent 15–30% | 22.8% |

### What phase 5 did not do

- **The human voice pass is still owed.** Section 13 predicted the edit pass would be the
  bottleneck and it was right about the shape of the problem, if not the source: these cards
  were written in one long sitting to a fixed effect budget, which keeps them balanced and
  makes them rhyme. Read them in batches of twenty and cut the ones that land the same joke
  twice. The structure will survive edits; `npm test` catches anything that breaks balance.
- **The saint bot still dies before era 2 in every run.** Unchanged from phase 4 and still
  the most questionable number in the build. Honest play remains fatal without compromise
  rather than merely expensive. A playtest, not the harness, should decide whether that is
  the satire working or an option that is not really an option.
- **Some endings are very rare.** Anarchy appears in one run in ten thousand and exile in
  about one in eight hundred. For a codex of collectibles that is arguably correct, but if
  phase 6 wants them findable, the meter-extreme endings need cards that push Order and
  Institutions to the floor rather than the ceiling.
- **The bundle grew to 396 kB, 114 kB gzipped**, most of it inlined content JSON. Fine over
  the network today; worth revisiting in phase 7, where the service worker has to cache it
  for offline play.

## Phase 6: what shipped

Meta progression per section 5.10, stored and versioned separately from run state as
section 12 requires.

- **Codex.** A screen listing all twenty endings, all nine futures and all thirteen
  objectives, with progress counts. Undiscovered entries show a dashed placeholder and no
  text, so the codex is something to fill rather than a spoiler list.
- **Thirteen objectives.** Eleven are judged on a finished run, two on the meta state
  ("finish a run for each side", "discover ten endings"). Everything they ask about lives in
  the new `GameState.stats` counters, so no run is ever replayed to score it.
- **Unlocks.** Five objectives grant a token, and content opts in with `requires`. Three
  leader archetypes (the Dissident, the Engineer, the Survivor) and two arcs (a real
  constitutional referendum, and a truth commission into the century) stay out of the draw
  until earned. The content total is now 329 cards and 14 arcs.
- **Daily seed.** One shared seed per UTC day, derived from the date, with the result
  recorded in meta. The setup screen offers it and marks it played.
- **Saves.** Meta lives under its own key at `META_SAVE_VERSION`, with a forward-migrating
  loader. Run state moved to `RUN_SAVE_VERSION` 2 with a real migration: a version 1 save
  predates `stats` and `unlocked` and now resumes with empty counters instead of being
  thrown away.

### Engine and tooling changes

- `GameState` gained `stats` (tempting, honest and neutral choices, honest and cheated
  elections, advisors fired, arcs entered) and `unlocked`. `draw` skips arcs whose
  `requires` is not held, and `rollSetup` skips gated modifiers.
- The validator learned the unlock rules, mirroring how it already handles flags: naming a
  `requires` no objective grants is an error, and granting a token nothing requires is a
  warning. The token list is a rule option, so a content set with no meta layer passes.
- The harness takes `--unlocked` to simulate an experienced player. **All five section 8
  targets pass in both states**, which matters because unlocked archetypes change starting
  meters: Ascent runs at 22.9% locked and 18.8% unlocked, both inside the 15–30 band.

### Decisions made in phase 6

- Objectives are code, not JSON. They are predicates over a finished run, and expressing
  them as data would have meant inventing a small query language for one file's worth of
  logic. They live in `src/meta/objectives.ts` and the validator checks their unlock tokens
  against content, which is where the coupling actually needs catching.
- Folding a run into meta happens in the choice handler, not an effect, so a finished run is
  scored exactly once even under React's double-invoked development rendering.
- `foldRun` is pure and returns what the run earned, which is what the ending screen shows
  under "Earned this run". The same function is what the tests assert on.
- Unlocks are additive only. Nothing is ever taken away, and a player with no unlocks sees
  the full base game, so the meta layer cannot make a first run worse.

### Known limits

- **Progression is local and unsynced.** Everything sits in `localStorage` on one device.
  Clearing site data loses the codex. There is no account and no cloud save, and adding one
  would be a backend, which section 2 rules out for now.
- **The daily run is honour-system.** The button disables once a day, and clearing storage
  would let it be replayed. Without a backend there is no scoreboard to cheat against, so
  this is a solitaire streak, not a competition.
- **The codex is 29 entries against the 50+ the spec wants at full scope.** Twenty endings
  is the MVP number and it is met; the rest arrives with the last two eras.

## Phase 7: what shipped

The web app is a complete installable PWA that plays with the network switched off. The
Android half is documented and configured but cannot be built from here, and one real
blocker stands in its way.

- **Manifest and icons.** `public/manifest.webmanifest` with standalone display, portrait
  orientation, theme and background colours matching the muddle frame, and four icons:
  192 and 512 in both `any` and `maskable` purposes, plus a 180px Apple touch icon. They are
  rendered from SVG through headless Chromium, so there are still no binary art assets in
  the repo's source, only generated output.
- **Service worker** at `public/sw.js`. Cache-first for precached files, and every
  navigation resolves to the cached shell, which is what actually makes offline play work.
  Non-GET and cross-origin requests are left alone.
- **The precache list is generated at build time.** Vite content-hashes asset filenames, so
  a hand-written worker cannot know them. A small plugin in `vite.config.ts` rewrites
  `dist/sw.js` after the build with the files that were really emitted, and derives
  `CACHE_NAME` from `APP_VERSION`. **Section 12's convention is now enforced rather than
  remembered**: the two cannot drift, and `tests/pwa.test.ts` checks the literal in the
  source still matches.
- **Updates never interrupt a run.** The worker deliberately does not call `skipWaiting` on
  install. A new version installs and waits, the page shows a small "A new version is ready"
  banner, and only when the player taps Reload does the new worker take over. This reverses
  the note left at the end of phase 6, which argued for activating immediately; with local
  saves and twenty-minute runs, swapping the bundle mid-run is the worse failure.

### Verified in a real browser, offline

Driven through headless Chromium against the production build, with `setOffline(true)`:

| Check | Result |
|---|---|
| Worker scope | `/Rule-or-Drool/`, activated and controlling |
| Cache after first load | `rod-v0.7.0`, 10 entries |
| Reload with the network cut | app loads from cache |
| Play with the network cut | six cards swiped, no errors |
| Non-ok requests from the app | none |

### The TWA blocker, which is worth knowing now

**Digital Asset Links must be served from the origin root**, at
`https://rcjlabs.github.io/.well-known/assetlinks.json`. That path belongs to the user Pages
site, a different repository, and this project can only publish under `/Rule-or-Drool/`.
A file placed under the project path will not be read. Without verification a TWA still
runs, but it keeps a Chrome address bar across the top, which defeats the point of wrapping
it at all.

The fix is a custom domain for the game, or adding the file to the `rcjlabs.github.io`
repository. `twa/README.md` sets out both, with the Bubblewrap steps and a filled-in
`twa/twa-manifest.json`.

### Play policy: still unverified, and that was the instruction

Section 13 asked for this to be checked **before** phase 7. It has not been, and not for
lack of trying: the sandbox this was built in cannot reach Google's policy pages, which are
blocked by the network egress proxy. Rather than guess at current policy wording, `twa/README.md`
carries a checklist to work through in the Play Console: elections and political content,
sensitive events, the content rating questionnaire, store listing wording, and the target
API level. **Do that before building the package, not after.** The one thing already in the
game's favour is structural: section 3's rule that everything is fictional was followed
throughout, so there are no real parties, people or countries anywhere in the content.

## Where the project stood after phase 7

This is the state at phase 7, kept as it was written. The current state is at the top of this
file.

All seven phases are built. The game is playable at
https://rcjlabs.github.io/Rule-or-Drool/, installs to a home screen, and runs offline.

| | |
|---|---|
| Content | 329 cards, 14 arcs, 20 endings, 18 advisors, 15 modifiers |
| Tests | 164, covering engine, content, harness, validator, UI, meta and PWA |
| Balance | all five section 8 targets pass, locked and unlocked |
| Gates in CI | typecheck, tests, and the strict MVP content gate |

### What is genuinely left

1. **A human playtest.** Never done. Section 13 predicted the harness cannot tell whether
   temptation feels tempting, and it still cannot. The checklist under phase 3 is the thing
   to work through.
2. **The voice edit pass** over cards written to one effect budget in one sitting, per the
   note under phase 5.
3. **The saint problem.** A perfectly honest player still dies before era 2 in every single
   run. Passing the target is not the same as being right.
4. **Play packaging**, blocked on the asset links decision and the policy check above.
5. **Post-MVP scope** from section 10: eras 4 and 5, a thousand cards, forty arcs, fifty
   endings. The engine, validator and harness were built for that scale and do not need
   changing to reach it.
