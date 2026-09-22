# Rule or Drool

A Reigns-style card swiper where the easy choice now is the ruinous choice later. You lead a
fictional country; every card is a two-way decision that moves four survival meters and a
hidden trajectory. Over a run the country drifts toward Decay or Ascent.

The design spec is `TRANSFER.md`. Progress and decisions live in `ROADMAP.md`. Read both
before changing anything.

## Status

Your support is a **coalition of three blocs**, not one public: the Movement, the Unions and
the Cities if you lead the Commons; the Faithful, the Donors and the Country if you lead the
Ledger. Pleasing one usually costs another, any of them can walk out on you, and elections
are decided by their average.

All seven phases built. Engine, balance harness, content validator, swipe UI, systems layer
(elections, arcs, cabinet traits, run setup), content at full MVP scope (329 cards, 14 arcs,
20 endings across three eras), meta progression (codex, objectives, unlocks, daily seed), and
an installable offline PWA. All section 8 balance targets met.

Playable at https://rcjlabs.github.io/Rule-or-Drool/ — it installs to a home screen and runs
with no network. Add `?debug=1` to see the hidden numbers; `[` and `]` shift drift to preview
the frame theming.

Play packaging is documented in `twa/README.md` but not built: it is blocked on where the
Digital Asset Links file can be served, and on a Play policy check this sandbox could not
reach. Both are explained there. (add `?debug=1` to see the hidden
numbers; `[` and `]` shift drift to preview the frame theming).

## Commands

```
npm install
npm run dev            # Vite dev server at http://localhost:5173/Rule-or-Drool/
npm run build          # production build to dist/ (npm run preview serves it)
npm test               # vitest: engine, content, harness and UI tests
npm run typecheck      # tsc --noEmit
npm run validate       # content validator; exit 1 on any error
npm run validate:mvp   # the MVP gate CI runs: every era, 25 cards per cell, warnings fail
npm run test:browser   # contrast, fit and world-picture audits of dist/ in Chromium
npm run check:browser  # build, then test:browser
npm run check          # typecheck + test + validate + build + browser audits (what CI runs)
npm run simulate       # 10k seeded runs per bot, prints the section 8 report
npm run simulate -- --runs 2000 --bot mixed --danger 40 --set electionMoodThreshold=30
npm run simulate -- --unlocked     # simulate an experienced player with every unlock
```

The browser audits look for Chromium at `CHROME_PATH`, then in the usual places. Without
one they skip with a banner saying so; CI sets `REQUIRE_BROWSER=1`, which makes that a
failure instead.

`simulate --set key=value` overrides any numeric engine constant for a batch (see
`src/engine/config.ts`); `--strict` exits 1 when a target misses. `validate` takes
`--root`, `--min-cell`, `--eras auto|all|1,2`, `--strict`, `--quiet`; see ROADMAP.md for the
rule list and codes.

## Layout

```
src/engine/    pure, serializable game engine (types, rng, state, draw, resolve, preview)
src/content/   JSON content: cards/era1, advisors, endings, epilogues, modifiers, strings.ts
src/sim/       bot policies, headless run loop, report and target checks
src/validate/  JSON schema checker, semantic rules, disk loader (dependency-free)
src/ui/        React app: setup, play (card, meters, frame theming), era transition, ending, codex
src/meta/      progression: objectives, unlocks, daily seed, versioned meta save
public/        manifest, service worker, generated icons
twa/           Play packaging config and the blockers to clear first
scripts/       simulate.ts (harness CLI), validate-content.ts (validator CLI)
tests/         vitest suites, fixture content, and tests/fixtures/broken (a root that
               trips every validator rule on purpose)
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`, which
builds and hands the artifact to the Actions Pages pipeline. Other branches and pull
requests run CI only.

The engine never touches content directly: `buildLibrary(content, configOverrides)` indexes a
content bundle, and every engine function takes that library plus a `GameState` and returns a
new state. RNG state lives inside `GameState`, so any run replays from its seed.
