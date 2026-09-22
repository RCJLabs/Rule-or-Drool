# Backlog, round four

Rounds one to three are done bar one item in BACKLOG-2: **phase 17 (get it onto Play)**.
Phase 11 (share a run) shipped as v0.39.0.

Same rule as before: every number is measured against the shipped content, and where it
comes from a bot the bot is named, because a bot measures the bot. A "player" below is one
bot playing forty runs in a row with its profile carried forward, the way a real profile is.

Status: **doing** · **queued** · **done**

## Phase 28. Every run a history — *done*

**Asked for.** A post-run screen unique to each playthrough; a picture of the world after
your term showing its rise or its fall; and many more endings — hundreds — so that
decisions visibly matter.

**Shipped.** Every run is named by history for what it did, from **198 written names**; the
end screen opens on **a picture of the world the run left**, drawn from its decisions; and it
says what became of each big decision and when it was made.

### Why more endings of the old kind would not have worked

Phase 26 measured the problem: **97% of a competent player's runs survive to a finale**, and
the other twenty endings are ways of failing. Adding failure endings adds endings a winning
player never sees. So a history is not *how* the run stopped. It is what the run *did*, and
every run gets one — including the ones that win.

### The histories

Keyed by the run's **defining decision** (32 legacies, plus one for a run that left none),
**where the country went** (Decay, Muddle, Ascent) and **who held the office**: 33 × 3 × 2 =
**198 names**, every one written rather than assembled, and all of them different. The same
decision reads differently by direction and by side — the seawall is *The Last Wall* on the
way down, *The Dry Coast* on the way up under the Commons, *The Harbour Boom* under the
Ledger. Each decision also has a line, per direction, for what became of it.

**The defining decision needed care, and a measurement found out why.** Three legacies are
carried by **95–99.5% of runs** (`habit_skim`, `habit_bend`, `cheated_election`), so a naive
pick would have given nearly everyone the same name. Legacies are ranked by how much history
they make, and a run is defined by the highest-ranked one it carries.

| player over 40 runs | endings met, 20 runs (before) | **histories met, 20 runs** | 40 runs | runs that earned a new one |
|---|---|---|---|---|
| **mixed** (competent) | 3 | **17** (range 12–20) | 28 | **70.5%** |
| greedy | 2 | 15 | 25 | 61.8% |
| random | 10 | 18 | 32 | 79.2% |

Across 200 competent players, 139 of the 198 were reached and **no single history took more
than 5.2%** of runs. The other 59 need rarer decisions — the bot does not take branches that
cost it meters, and a player will.

### The world after

A procedural picture, drawn as flat silhouettes in the style of the portraits and icons, with
no image files, so it stays offline and costs nothing to fetch:

- **Where the country went** sets the sky and the city: a clear gold dawn over a city of
  spires on the way up, a flat grey sky over an unchanged city in the middle, a red sun
  through smoke over broken towers on the way down — deeper the further it went.
- **Each defining decision puts a landmark in the world**: the ring across the sky, the
  seawall on the coast, the statue where the ballot boxes were, the tanks in the square, a
  boat stranded in a drained bay. 25 landmarks, one place each, the most history-making first.
- **Who held the office** flies pennants (the Commons) or square flags (the Ledger) — the
  same shape distinction the card makes during the run.
- The skyline is drawn from the run's seed, so two runs that did the same things still do not
  get the same city.

Over 8,000 competent runs: **1,531 distinct pictures** by direction and landmark set alone,
3.2 landmarks each, none empty.

**Two things the rendered gallery caught that no test would have.** Posters and banners at
fixed spots were drawn over the school and the broadcast screen; they now take whatever
ground is free. And capping the picture at six landmarks was not enough: the near-universal
habits filled the room most runs had left, so a heroic Ascent still got a gold private tower
and a gated house. The four habits now appear only in a picture that would otherwise be
sparse — the run whose story they are.

### The end screen

Read top to bottom: the world the run left; *"Your rule ends · Orbit"* and **what history
calls it**, marked when it is a name you have not had before; **what became of it** — the
run's four biggest decisions, each with its fate in the direction the country went and the
card it was made on; **how it went**, a timeline of those decisions, the years passing and a
broken promise; what you did with the office (phase 27); and the long view.

To date the decisions the run now records **when each flag was first set** (`flagSince`,
run save v9). A run in progress keeps its old flags undated rather than dated to card 0,
which would put them at the start of a timeline they did not happen at the start of.

### Also

- The codex lists the histories found (meta save v5) and names each past run, and a new
  objective asks for ten — reached by winning, unlike the endings objectives.
- The validator rejects a legacy with no history, a duplicate name, a missing line or a gap
  in the ranking; each was checked by corrupting the file and watching it fail.
- The projection's panes now stay on the run screen. On the end screen, a document, they cut
  across the text as stray boxes; the stream's badges read anywhere and stay.
- The picture is an image named by its history and described by its landmarks, as two
  attributes rather than one concatenated string — which a test caught.
- Balance is unchanged: dating flags consumes no randomness, and every section 8 target
  passes.

## Phase 29. What only a browser can check, checked on every push — *done*

**Asked for.** The contrast, fit and picture checks were scratch scripts, run by hand after a
change and forgotten otherwise. Fold them into `npm run check` and CI.

**Shipped.** `npm run check` now builds the site and reads it in Chromium. That is 21 browser
tests, taking about 30 seconds. CI runs them on every branch push. The deploy runs them
against the exact build it uploads, with `REQUIRE_BROWSER` set, so a missing browser fails
the deploy instead of skipping the audit. On a machine with no Chromium they skip, under a
banner that says so.

- **Contrast**, WCAG AA, for every text on:
  - the menus;
  - a run in all seven looks, for both parties, with the plain screen off and on;
  - the cabinet, and an era boundary, each in three directions;
  - the end of a run in three directions at 390 and 360px, and the codex after it;
  - a shared run's offer, with a good link and with a broken one.
- **Fit**:
  - seven phone and tablet sizes, in three directions, with the fullest footer a run has
    (the longest mandate and a teaching note). The page must not scroll and no box may cut
    off what is in it;
  - the era panel on the two short phones;
  - the end screen and the offer must never scroll sideways.
- **The world pictures**: every landmark in every slot it may take, in every direction and
  depth, which is 720 renders. Each must stay inside its slot within 2 units and inside the
  picture.
- **Sound**, as a unit test: every cue is held to phase 22's phone-speaker model, its
  energy through two 500 Hz highpasses. Today's cues lose 3.6–12.2 dB and the limit is
  15. The cues phase 22 replaced lost 26–42.

Every run starts from a run code (phase 11), so the same cards are dealt each time and a
failure reproduces.

**Every check was shown to fail.**

| Planted defect | What failed |
|---|---|
| The 1.02:1 button put back | Contrast, naming the button, its colours and the ratio |
| A footer 90px taller | Fit at 360×640: the card cuts 7px off its own text |
| The old 62-unit hedge | The landmark test, in every slot the mansion takes |
| The commit cue's voice moved down to its root | The sound test, with each version's loss |

**The first version of the fit check could not fail.** It checked that the page did not
scroll. The run screen is a flex column, so a taller footer squeezes the card until the card
cuts off its own text, and the page never scrolls. The check now also fails on any box that
is hiding part of its content.

**What it found.**
- **Landmarks that touched.** The broadcast screen and the mansion's hedge overlapped by 4
  units whenever the two stood side by side, and five more pairs came within 2. Five
  drawings sat off-centre or were wider than the places they could be given: the statue, the
  tanks, the broadcast screen, the bunker and the mansion. Each now centres on its slot and
  fits it. This was found by measuring what each drawing covers, counting solid shapes only
  (a searchlight at 12% is light, not a landmark). Which placements a run can actually reach
  came from 420,000 random compositions.
- **Meter names cut short, not fixed here.** A meter slot is 54px wide at 360px. The decay
  looks set the names in bold capitals and the ascent looks space them out. How many
  names don't fit depends heavily on the font, so this was measured twice:

  | Width | Roboto (what Android draws) | DejaVu Sans (this sandbox) |
  |---|---|---|
  | 360px | 9 names, in 6 of the 7 looks | 15, in all 7 |
  | 390px | 5 | 10 |
  | 412px | 1 | 9 |

  In Roboto the main offender is "Institutions": 12.4px too long in the first decay stage's
  capitals and 5.2px in each ascent look. "THE SYSTEM" misses by 5.6px. "THE MONEY",
  "The Money", "EVERYONE!!" and "Movement" each miss by a pixel or less, but the ellipsis
  is drawn all the same. Fitting them is a writing decision (a shorter name for the
  institutions meter, shorter slang in the deep looks) or a design one (less capitals or
  spacing on narrow screens). Until then the test holds them to today's list as a
  ceiling: no new name can be cut short, and a fixed one comes off the list.
- **The probe itself was wrong the first time.** It read overflow from `scrollWidth`, which
  is a whole number. An ellipsis is drawn for any overflow at all, so a label 0.47px too
  long read as fitting while the screenshot showed "EVERYON…". Labels are now measured by
  their text's own width, to the fraction. And a guess that went the other way: I expected
  pixel density to change the results, since Chromium rounds letters to device pixels. At
  1× and 3× the sets came out identical. The audits run at 3× anyway, as phones do.
- **A race in the test, not the game.** Two key presses sent back to back could both arrive
  before the first peek was drawn. The second press then peeked again instead of
  committing, and a run stalled at random: 3 attempts in 4. No player presses twice inside
  one frame, so the test now waits for the peek to be drawn plus one more frame. It then
  passed five runs in a row.

**Limits.**
- Fit is measured with the fonts on the machine running it: DejaVu Sans in this sandbox,
  whatever the CI image has on GitHub. The whole suite was also run in Roboto, pointing
  Chromium's fontconfig at it, and passed. DejaVu sets a line of bold capitals 22% wider than
  Roboto, so a pass here is conservative for Android. It is still not a measurement on a
  phone.
- Contrast reads solid backgrounds only. Text over a gradient or a picture needs a solid
  ground of its own, which the game gives it.
- Fit covers the cards this seed deals, not the longest card in the deck.

388 unit tests and 21 browser tests. v0.40.0.
