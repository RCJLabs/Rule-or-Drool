# ROADMAP

Phases from TRANSFER.md section 11. Each phase ends with passing tests and an update here.

| # | Phase | Status |
|---|---|---|
| 1 | Engine + harness | Done |
| 2 | Validator (`scripts/validate-content.ts`) | Done |
| 3 | Swipe UI, first human playtest | Built and deployed; playtest is yours |
| 4 | Elections, arcs, cabinet, run setup; harness targets met | **Done** (this commit) |
| 5 | Bulk content to MVP scope | Next |
| 6 | Meta: codex, objectives, unlocks, daily seed, save migration | |
| 7 | PWA, then TWA | |

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
  flags). `Choice.electionDelay` lets a cheat shorten the next interval (postponement).
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
| `election-honest`, `honest-misplaced` | error | Election cards mark exactly one honest side; `honest`/`electionDelay` only on election cards. |
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
- **The deploy job is gated on the repository default branch.** Enabling Pages creates the
  `github-pages` environment, which GitHub restricts to the default branch. That branch is
  still `claude/new-session-x759ml`, so the deploy job triggered by a push to `main` is
  rejected before its first step, with no log to read: a one-second failure that looks like
  a broken workflow and is not one. Proved by dispatching the identical commit from the
  current default branch, which deployed successfully. Switching the default branch to
  `main` fixes it for good.

### Deploying

The site is live at https://rcjlabs.github.io/Rule-or-Drool/ and Pages is already enabled
with its source set to "GitHub Actions". No settings visit was needed for that.

- **One thing left, and it matters:** Settings → General → Default branch → `main`. GitHub
  made the first branch pushed to an empty repo the default, which was the feature branch.
  Until that changes, a push to `main` starts a Deploy run whose deploy job is rejected by
  the `github-pages` environment (default-branch-only policy) and shows up red after one
  second. The build half still passes; nothing is broken in the code.
- Until then, deploy by dispatching the workflow from the current default branch: Actions →
  Deploy → Run workflow → pick `claude/new-session-x759ml`. That is how the live build got
  there.
- Once the default branch is `main`: push to `main` and it runs check, build and deploy, and
  the site updates a minute or two later. Other branches and pull requests run CI only, so a
  push to `main` no longer triggers two duplicate runs.
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

## Phase 5 notes (next)

`npm run validate:mvp` is the gate: every era, 25 cards per cell, warnings fatal. It
currently reports 12 thin cells, all of them era 2 and 3 at 16–23 cards against 25. That is
the phase 5 target, roughly 170 more cards. Generate by era, band and alignment in batches of
20–30, run the validator, then edit by hand; section 13 is right that the edit pass is the
bottleneck. Keep the per-side effect budget in view while writing: the balance above is a
property of the whole deck, and `npm test` will catch a batch that breaks it.
