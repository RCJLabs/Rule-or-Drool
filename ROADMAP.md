# ROADMAP

Phases from TRANSFER.md section 11. Each phase ends with passing tests and an update here.

| # | Phase | Status |
|---|---|---|
| 1 | Engine + harness | Done |
| 2 | Validator (`scripts/validate-content.ts`) | **Done** (this commit) |
| 3 | Swipe UI, first human playtest | Next |
| 4 | Elections, arcs, cabinet, run setup; harness targets met | |
| 5 | Bulk content to MVP scope | |
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

## Phase 3 notes (next)

Vite + React scaffolding arrives with the UI; keep `src/engine` and `src/validate` free of
DOM imports so the harness and validator keep running under tsx. The engine's `preview()`
returns `affected` meters for the drag hint and `endingId` for the death preview, and
`GameState.current` is the card on the table, so a save mid-card restores cleanly.
