# TWO FUTURES (working title) — Transfer Document

Handoff spec for building this game in Claude Code. Read the whole file before writing code. Sections marked **LOCKED** are decided. Sections marked **PROPOSED** are starting points to implement and then tune. Sections marked **OPEN** need a decision from Evan before they block work.

---

## 1. Concept

A Reigns-style card swiper. The player is the leader of a fictional country. Each card is a decision with two options, swiped left or right. Choices move four survival meters and a hidden trajectory value. Over a 20-minute run spanning centuries, the country drifts toward one of two futures:

- **Decay**: a society that gets progressively dumber, more distracted, and more broken until it collapses under its own garbage.
- **Ascent**: a united, competent, spacefaring civilization.

The satirical point is mechanical: **the easy choice now is the ruinous choice later.** Self-serving, dishonest, short-term decisions stabilize your meters and keep you in power. Honest, empathetic, long-term decisions cost you now. The player is seduced into Decay rather than choosing it.

## 2. Decisions

### LOCKED
- Genre: Reigns-style binary card swiper.
- Player role: the leader (the office). Not an advisor.
- Player chooses a starting alignment, Left or Right. Alignment sets flavor: card pools, cast, coalition, temptations.
- Alignment and morality are **decoupled**. Drift tracks self-serving/dishonest/short-term versus honest/empathetic/long-term. Both alignments can reach both futures, each by its own road.
- The two futures are consequences of accumulated choices, not a fixed fork.
- Run length target: about 20 minutes.
- Replayability comes from recombining systems (arcs, run setup, cabinet, codex), not from raw card count.
- Built with Claude Code. Web first, PWA, then TWA for Google Play.

### PROPOSED (defaults in force unless Evan changes them)
- Fictional country, fictional parties, fictional cast. Data uses keys `left` / `right`; display names live in a strings file.
- Drift is hidden. The UI itself is the tell (section 9).
- React + TypeScript + Vite. Procedural SVG and CSS only, no art assets.
- Local save only. No backend.

### OPEN
- Title, country name, party names.
- Monetization.
- Whether one alignment's road to Ascent is tuned steeper than the other's. Default is symmetric.

## 3. Content guardrails

- No real people, real parties, or real countries. Archetypes only. This also keeps the satire from dating.
- "Idiocracy-type" and "Futurama-type" describe tone. Do not lift names, characters, settings, or gags from either property.
- Aim the Decay satire at incentives and institutions (attention economy, gutted schools, bought media, cronyism). Never at genetics or "dumb people breeding."
- Each alignment gets its own failure modes, written with equal bite. Right-flavored decay: strongman cronyism, culture-war distraction, loyalty over competence. Left-flavored decay: purity purges, performative policy, bought loyalty through giveaways, bureaucratic capture.
- Ascent needs its own dangers (technocratic overreach, complacency, brittle consensus) or it is boring to play.

## 4. Core loop

1. Draw a card (section 7).
2. Player swipes left or right. Dragging previews which meters will move, not by how much or in which direction (Reigns convention).
3. Apply meter effects, drift delta, flags, and enqueue any delayed cards.
4. Check ouster conditions. If ousted, show the ending and the epilogue, write to the codex, end the run.
5. Tick the card counter. Fire an election or an era transition if due.
6. Repeat.

## 5. Systems

### 5.1 Survival meters (visible)
Four meters, range 0–100, start at 50. Either extreme ousts you.

| Meter | At 0 | At 100 |
|---|---|---|
| Mood | Riots remove you | Personality cult consumes you |
| Money | Bankruptcy | Oligarchs own you |
| Order | Anarchy | Police state turns on you |
| Institutions (shown as "State") | State collapse | Bureaucratic paralysis |

### 5.2 Drift and bands (hidden)
- `drift` ranges -100 to +100, starts at 0.
- Typical card choice: ±1 to ±4. Arc steps: ±5 to ±15. Rigging an election: about -20.
- **The core rule:** choices that help meters now should usually cost drift. Choices that gain drift should usually cost meters.
- Bands: `decay` at drift ≤ -25, `ascent` at drift ≥ +25, otherwise `muddle`. Band is recomputed at each era boundary.
- Band lock-in after era 3. Before that, recovery is possible but expensive.
- Volatility scales with band: meter effects are multiplied by about 1.4 in decay and 0.8 in ascent. Without this the easy path stays easy forever and the satire has no bite.

### 5.3 Eras
Five eras: your term, +20 years, +75 years, +200 years, +500 years (finale). MVP ships three. About 30–40 cards each. At each era boundary a successor from your political lineage takes office, time jumps, band is recomputed, and the card pool and visual theme change.

### 5.4 Elections
- An election card fires every ~25 cards.
- If Mood is below the threshold (start at 40), the honest outcome is a loss, which ends the run.
- The card always offers a way to cheat: rig, scapegoat, postpone, abolish term limits. Cheating keeps you in office, costs a lot of drift, and sets flags that unlock autocrat arcs.
- Once `elections_abolished` is set, elections are replaced by a coup-risk check against Order and Institutions.
- Conceding an honest loss is a legitimate ending with its own codex entries, not a failure screen.

### 5.5 Ousters, endings, epilogues
- An ouster ends the run: impeachment, coup, assassination, exile, election loss, plus one per meter extreme.
- Every ending is followed by an **epilogue** chosen by band at time of exit, showing where the country ends up without you. Short runs still reveal the futures.
- Endings are collectibles in the codex.

### 5.6 Delayed consequences
Choices enqueue future cards with a delay in card count. Defund schools in era 1, and 20 cards later "nobody can read the ballot" arrives. Queued cards outrank normal draws once due. Delays may cross era boundaries. This mechanic matters more than the meters.

### 5.7 Arcs
An arc is a small state machine: entry condition, 3–6 cards, branches by choice, exit flags, optional ending hook. Every step can be refused. Each run draws 4–6 arcs by weight from those eligible, so runs differ in plot. Example: `term_limits` enters when an election is at risk, then "postpone" → "emergency powers" → "leader for life."

### 5.8 Cabinet
Advisors are drawn from a pool at run start. Each has a role (speaker slot) and hidden traits: loyal, corrupt, competent, zealot. Traits modify the effects of that speaker's cards and gate betrayal arcs. Advisors can be fired and replaced.

A **rival** speaker mirrors the player: when drift is positive the rival is a demagogue tempting the public, when drift is negative the rival is a reformer.

### 5.9 Run setup
Alignment × opening crisis (recession, pandemic, war, disaster) × one drawn leader trait and one flaw. Each modifies starting meters, adds flags, and weights arcs.

### 5.10 Meta progression
- Codex of endings and epilogues (target 50+ at full scope).
- Run objectives ("reach orbit without lying once," "survive three elections honestly").
- Unlockable leader archetypes and arcs.
- Daily seed.
- Meta save is stored separately from run state.

## 6. Data schemas

Content is JSON. Engine types live in `src/engine/types.ts`.

```ts
type Align = "left" | "right" | "any";
type Band = "decay" | "muddle" | "ascent";
type MeterKey = "mood" | "money" | "order" | "inst";

interface Choice {
  label: string;
  fx?: Partial<Record<MeterKey, number>>;
  drift?: number;
  setFlags?: string[];
  clearFlags?: string[];
  enqueue?: { id: string; delay: number }[];
  next?: string;            // arc branching: id of next arc card
  ending?: string;          // ending id, if this choice ends the run
}

interface Card {
  id: string;
  type: "event" | "arc" | "election" | "ending";
  align: Align;
  eras: number[];
  bands: Band[];
  speaker: string;          // role id, resolved to an advisor at runtime
  text: string;
  cond?: {
    flags?: string[];       // all required
    notFlags?: string[];
    meters?: Partial<Record<MeterKey, { lt?: number; gt?: number }>>;
  };
  weight?: number;          // default 1
  oneShot?: boolean;
  arc?: string;
  step?: number;
  left: Choice;
  right: Choice;
}

interface Arc {
  id: string;
  align: Align;
  entry: Card["cond"] & { eras: number[]; bands: Band[] };
  weight: number;
  cards: string[];          // card ids; first is the entry card
}

interface Advisor { id: string; role: string; name: string; traits: string[]; }
interface Modifier { id: string; kind: "trait" | "flaw" | "crisis";
  meterStart?: Partial<Record<MeterKey, number>>; flags?: string[];
  arcWeights?: Record<string, number>; }
interface Ending { id: string; title: string; text: string; }
interface Epilogue { band: Band; align: Align; era: number; text: string; }

interface GameState {
  seed: number; rngState: number;
  align: "left" | "right";
  era: number; cardCount: number;
  meters: Record<MeterKey, number>;
  drift: number; band: Band; bandLocked: boolean;
  flags: string[];
  queue: { id: string; dueAt: number }[];
  seen: string[]; cooldown: string[];
  activeArcs: { id: string; nextCard: string | null }[];
  cabinet: Record<string, string>;   // role -> advisor id
  modifiers: string[];
  nextElectionAt: number;
  over: { endingId: string; epilogueKey: string } | null;
}
```

## 7. Engine

Pure, serializable, UI-free. Every function takes state and returns new state. RNG state lives inside `GameState` so any run replays from a seed.

Reducers: `newRun(seed, setup)`, `draw(state)`, `resolve(state, cardId, side)`, `tickQueue`, `checkElection`, `checkOuster`, `advanceEra`.

**Draw order:**
1. Election card, if due.
2. Due queued cards, oldest first.
3. Next card of an active arc, with some probability per draw so arcs interleave with events.
4. Possible arc entry, if fewer than the run's arc budget have started.
5. Weighted draw from eligible events: matches era, band, align (own or `any`), cond; not in cooldown; not a seen one-shot.

Cooldown: the last ~15 drawn ids are ineligible.

### File layout
```
src/engine/     types, rng, state, draw, resolve, election, eras, endings
src/content/    cards/era1..5/*.json, arcs/*.json, advisors.json,
                modifiers.json, endings.json, epilogues.json, strings.ts
src/ui/         Card, Meters, Frame (band theming), Codex, Setup
scripts/        validate-content.ts, simulate.ts
tests/          engine unit tests, harness assertions
ROADMAP.md
```

## 8. Balance harness and validator

### Harness (`scripts/simulate.ts`)
Plays N seeded runs headlessly with bot policies and reports run length, ouster causes, and band distribution.

Acceptance targets (starting values, tune later):
- **Random bot:** median run 40–60 cards. No single ouster cause above 35%.
- **Greedy-meter bot** (always picks what best stabilizes meters): survives long, ends in Decay ≥ 70% of the time. This verifies the temptation rule.
- **Saint bot** (always picks max drift): ousted before era 2 in ≥ 60% of runs. This verifies that good is costly.
- **Mixed bot** (saint unless a meter is in danger): can reach Ascent in 15–30% of runs. This verifies that good is possible.

### Validator (`scripts/validate-content.ts`)
Build this before bulk content. Fails CI on:
- Schema violations, duplicate ids.
- `enqueue`, `next`, or `ending` ids that do not exist.
- Flags that are set but never read, or read but never set.
- Arc cards unreachable from the arc's entry card, or arcs with no exit.
- Endings with no path to them.
- Era × band × align cells with fewer than a minimum number of eligible cards.
- Cards where both choices have the same sign on both meters and drift (no real tradeoff). Warn, not fail.

## 9. UI

- One card centered, drag to swipe, keyboard arrows on desktop. Mobile first.
- Four meter icons at top. On drag, affected meters show a dot (size hints at magnitude, direction hidden).
- **Frame theming by band is the trajectory meter.**
  - Decay: sponsor banners creep into the frame, labels get dumber, typography degrades, colors get louder, layout goes slightly crooked.
  - Ascent: cleaner layout, better typography, more whitespace, calmer palette.
  - Muddle: neutral baseline.
  - Theming should show early signs within a band, before the era boundary, so hidden drift does not feel unfair.
- Text degradation: a render-time `degrade(text, level)` transform for light typos. Keep it subtle. The real Decay voice comes from authored decay-band cards.
- Procedural SVG portraits per speaker role, varied by seed.

## 10. Content plan

| | MVP | Full |
|---|---|---|
| Eras | 3 | 5 |
| Cards | ~300 (era 1 heaviest) | 1,000+ |
| Arcs | 12 | 40+ |
| Endings | 20 | 50+ |
| Advisors | 12 | 30+ |
| Traits, flaws, crises | 4 each | 10+ each |

- Target about 50% `align: "any"` cards. Put alignment-specific writing into arcs and elections.
- Generate in batches by era × band × align, 20–30 cards per batch, run the validator, then Evan edits.
- Voice guide per batch: speaker role, band tone, two example cards. Card text under ~160 characters. Choice labels under ~24 characters.
- Templated cards with procedural nouns are filler only.

## 11. Build phases

Each phase ends with passing tests and an updated ROADMAP.md.

1. **Engine + harness.** Types, RNG, reducers, 30 placeholder cards, `simulate.ts` with the four bots. Done when the harness prints a report from 10k runs.
2. **Validator.** All rules in section 8. Done when it passes on placeholders and fails on a deliberately broken fixture set.
3. **Swipe UI.** Card, meters, drag preview, band frame theming, setup screen. **First human playtest happens here.**
4. **Elections, arcs, cabinet, run setup.** Three complete arcs including `term_limits`. Harness targets from section 8 met.
5. **Bulk content to MVP scope.** Batched generation, validator, edit pass.
6. **Meta.** Codex, objectives, unlocks, daily seed, save and migration.
7. **PWA, then TWA.** Service worker, manifest, offline play, Play packaging.

## 12. House conventions

- Every deploy bumps `APP_VERSION` in `src/version.ts` and `CACHE_NAME` in `public/sw.js` together.
- `SAVE_VERSION` gates save migrations. Change it only with a migration function. Run state and meta state are versioned separately.
- Keep `ROADMAP.md` current at the end of every phase.
- GitHub Pages for web. Stay on TWA for Play until feature-complete.

## 13. Risks and known limits

- **Replayability.** Tens of hours is a realistic target with these systems. Hundreds of hours is unproven for this genre and should not drive scope.
- **Comedy at volume.** Generated card text goes samey past about 50 cards per batch style. The edit pass is the real bottleneck and it is human work.
- **Harness blind spot.** Bots tune survival and band distribution. They cannot tell whether temptation feels tempting. That needs human playtests from phase 3 on.
- **Hidden drift.** If players cannot infer it from the frame, band changes feel arbitrary. Test this early.
- **Templated variance** wears out fast.
- **Store review** for political satire on Google Play has not been checked against current policy. Verify before phase 7.

## 14. First prompt for Claude Code

> Read TRANSFER.md in full. Implement phase 1 only: the pure engine in `src/engine/` per sections 6 and 7, 30 placeholder cards covering era 1 across all three bands and both alignments, and `scripts/simulate.ts` with the four bot policies from section 8. Use Vitest. No UI yet. When done, run 10k simulations, print the report, and list where results miss the section 8 targets. Create ROADMAP.md with the phases from section 11.
