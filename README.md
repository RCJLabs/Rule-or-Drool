# Rule or Drool

A Reigns-style card swiper where the easy choice now is the ruinous choice later. You lead a
fictional country; every card is a two-way decision that moves four survival meters and a
hidden trajectory. Over a run the country drifts toward Decay or Ascent.

The design spec is `TRANSFER.md`. Progress and decisions live in `ROADMAP.md`. Read both
before changing anything.

## Status

Phase 1 of 7: pure engine, placeholder content and the balance harness. No UI yet.

## Commands

```
npm install
npm test               # vitest: engine, content and harness tests
npm run typecheck      # tsc --noEmit
npm run simulate       # 10k seeded runs per bot, prints the section 8 report
npm run simulate -- --runs 2000 --bot mixed --danger 40 --set electionMoodThreshold=30
```

`--set key=value` overrides any numeric engine constant for a batch (see
`src/engine/config.ts`). `--strict` exits 1 when a target misses.

## Layout

```
src/engine/    pure, serializable game engine (types, rng, state, draw, resolve, preview)
src/content/   JSON content: cards/era1, advisors, endings, epilogues, modifiers, strings.ts
src/sim/       bot policies, headless run loop, report and target checks
scripts/       simulate.ts (harness CLI); validate-content.ts arrives in phase 2
tests/         vitest suites and fixture content
```

The engine never touches content directly: `buildLibrary(content, configOverrides)` indexes a
content bundle, and every engine function takes that library plus a `GameState` and returns a
new state. RNG state lives inside `GameState`, so any run replays from its seed.
