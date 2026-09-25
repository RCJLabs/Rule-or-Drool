# Rule or Drool

A Reigns-style card swiper where the easy choice now is the ruinous choice later. You lead a
fictional country; every card is a two-way decision that moves four survival meters and a
hidden trajectory. Over a run the country drifts toward Decay or Ascent.

The design spec is `TRANSFER.md`. Progress and decisions live in `ROADMAP.md`, which says
where the project stands and indexes the rounds of work since in `BACKLOG*.md`. Read both
before changing anything.

## Status

Your support is a **coalition of three blocs**, not one public: the Movement, the Unions and
the Cities if you lead the Commons; the Faithful, the Donors and the Country if you lead the
Ledger. Pleasing one usually costs another, any of them can walk out on you, and elections
are decided by their average. The election card says whether an honest count would win.
Lose an honest count and you lead the opposition until the era ends, when a return vote
decides whether you come back. A second lost count ends the run. The two cards before each vote
are the campaign: each says where the count stands, and can move it, a little if you play fair
and further if you don't.

A new profile starts with a **first term**: the first era alone, with its one vote, ending in an
end of its own. Once a run is seen through, runs are full reigns of three eras.

Each era after the first opens with an **appointment**: a seat's holder leaves, names the two
people who could follow, and you choose. What they are (competent, loyal, a zealot, corrupt)
scales every card they bring you.

Every week brings three **contracts**, the same for everyone and dealt from the date like the
daily: an easy one, a fair one and a hard one, such as "Reach the Ascent finale leading the
Ledger, cheating no vote". A full reign that ends in the week keeps them, and a run of weeks with
one kept is a streak. `npm run contracts` measures how many runs each takes a player aiming at it.

A run can be taken on a **promise**, or on two: a platform. There are nine, and each is broken by
something the screen shows, a meter under a line drawn on it or a choice that says what it does.
Each is kept or broken on its own, with a card that tempts the run to break it and one that tells
the country when it goes.

A run can **take over** the country the last one left, beside a fresh start: the same side,
leaning the way the last reign ended, with its two biggest legacies still in force and its rival
back. What the country already has is not built or asked again, and history names what the new
reign did. A line of reigns is kept in the codex; the daily is always a fresh start.

The **rival** plays once they are somebody. When the cabinet calls them the obvious alternative,
they offer your people jobs, court the bloc you have let slide, and make a campaign of what you
buried; on the way up they tell the rallies your success is a lie. When they are ready to take
the office off you, every vote is against them by name, and a rigged count, an emergency or the
end of elections is offered against them too.

The **country** stands under the card on any phone 740px tall or more: a strip of the world the end
screen draws, where a decision that leaves a legacy puts up its landmark as it is made. Warships
leave the harbour when the country goes to war, turbines rise on the ridge when carbon gets a price,
and the statue stands where the ballot boxes were. On a shorter phone the country is drawn at each
era's change.

All seven phases built. Engine, balance harness, content validator, swipe UI, systems layer
(elections, arcs, cabinet traits, run setup), content at full MVP scope (329 cards, 14 arcs,
20 endings across three eras), meta progression (codex, objectives, unlocks, daily seed), and
an installable offline PWA. All section 8 balance targets met. Since BACKLOG-9 the Ascent is
balanced for a player who never cheats a vote they can win honestly, which the election card
now shows them.

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
npm run store:assets   # Play screenshots, feature graphic and icon from dist/ (twa/STORE.md)
npm run playtests      # report on the playtest records players sent, from playtests/
npm run playtests -- some/folder --min 3 --look 300
npm run voice          # phrases the cards lean on, against their ceilings (src/content/voice.ts)
npm run voice -- "a phrase"      # the cards carrying a phrase, by file
npm run deck           # after changing what is dealt: rewrite src/content/deck.json
```

`npm run deck` writes the deck's stamp: a hash of everything that decides what is dealt and
how a choice lands, with the wording left out (BACKLOG-8 phase 49). Links, saves, the daily
log and playtest records carry it, so the game can say when a shared run was dealt from
another deck. A change to cards, stories, crises, advisors, endings, promises or the engine's
config needs it run, and the tests fail until it is; a change to wording does not. If the
engine's own code starts dealing differently, bump `DEAL_VERSION` in `src/version.ts` first.
The tests catch a change there only if it moves one of 96 bot runs, so bump it by hand
whenever engine code changes what is dealt or how a choice lands.

The browser audits look for Chromium at `CHROME_PATH`, then in the usual places. Without
one they skip with a banner saying so; CI sets `REQUIRE_BROWSER=1`, which makes that a
failure instead. They draw in Roboto, as an Android phone does, from `tests/browser/fonts/`
(SIL Open Font License). Chromium reads the font through fontconfig, which only it does on
Linux, and CI is Linux. On a Mac or Windows the audits see the system's own font, and a fit
result there belongs to that font.

`playtests` reads the records players send from the game (Settings › Keep a record of my
runs, then Send my record) and prints what they did beside each bot playing the same runs:
survival, where runs end, time on a card, and the cards people hesitate on. One of the bots,
`eyes`, decides only from what the screen shows a person (BACKLOG-10 phase 57). Put the files in
`playtests/`, which git ignores: they are other people's play, and this repository is
public. A file that is not exactly the format is named and skipped. The format, and what it
leaves out, is at the top of `src/playtest/record.ts`.

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
src/playtest/  the playtest record: its format, the strict reader, the card clock, the report
public/        manifest, service worker, generated icons
twa/           Play packaging config and the blockers to clear first
scripts/       simulate.ts (harness CLI), validate-content.ts (validator CLI),
               playtests.ts (playtest report), store-assets.ts (Play images)
tests/         vitest suites, fixture content, and tests/fixtures/broken (a root that
               trips every validator rule on purpose)
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`, which
builds and hands the artifact to the Actions Pages pipeline. Other branches and pull
requests run CI only.

The engine never touches content directly: `buildLibrary(content, configOverrides)` indexes a
content bundle, and every engine function takes that library plus a `GameState` and returns a
new state. RNG state lives inside `GameState`, so any run replays from its seed.
