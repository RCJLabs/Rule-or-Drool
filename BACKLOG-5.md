# Backlog, round five

Round four (BACKLOG-4.md) is phases 28 and 29, both done. BACKLOG-2's phase 17, getting the
game onto Play, is prepared and waiting on decisions only the owner can make. These are the
next ten, numbered as phases 30–39.

Same rule as every round: each evidence line is measured against the shipped game at
v0.41.0, not estimated. Where a number comes from a bot, the bot is named, because a bot
measures the bot. Every bot also sees the exact numbers on both sides of a card, which a
person never does. "A player" below is the mixed bot playing runs in a row with its profile
carried forward, unlocks and all.

Status: **doing** · **queued** · **done**

The audit these were drawn from, at v0.41.0 (526 cards, 22 arcs, 23 endings, 4 crises,
16 cabinet advisors):

| | |
|---|---|
| A player's 10th run: cards already seen in an earlier run | **89%** (era 1: 92%) |
| A player's 20th run: the same | 98% |
| Share of the deck seen after 5 / 10 / 20 runs | 57% / 74% / 85% |
| Every crisis met by | run 7 |
| Every cabinet advisor met by | run 5 |
| Era names written / eras that can be played | 5 / 3 |
| Competent runs (mixed bot) that reach a finale | 96% |
| Flip a run's defining decision: history name changes / ending changes | 99% / 40% |
| One run code, two different players: different history name / ending | 98% / 76% |
| Controls a screen reader can use to choose a side | **0** |
| Phone held sideways (844×390): height of the card | 101px, text cut off |
| Meter names cut short at 360px, in Roboto | 9 |
| On a phone at 6× CPU throttling: first screen / a card committing | 0.45s / 0.33s, no long tasks |
| A 40-run profile | 6.8 KB |

## Recommended order

The phases are numbered in the order worth doing them:

- **30–31 first.** A screen reader can't play at all today, and the playtest recorder has to
  exist before the closed test starts if that test is to produce data.
- **32–33 are small and time-sensitive.** The meter names need only your decision, and
  moving progress between addresses has to ship before any change of address.
- **34, then 35–36.** The other road is the most direct answer to "decisions should
  matter". After it comes the writing, which can run in batches alongside everything else.
- **37–38 once there are players** to challenge and a daily worth coming back to.
- **39 last**, because the long reign wants a bigger deck under it first.

---

## Phase 30. A screen reader can play — *done*

**Shipped.** A run can be played start to finish without seeing it or dragging anything,
and nothing about how a run plays has changed. It is a second way to press the same two
choices, and the game saying out loud what a sighted player takes in.

- **Two buttons for the two choices**, named by their labels. They call the same commit
  that the drag and the arrow keys do. They are always there for a screen reader, and out of
  sight otherwise: a new setting, *Show choice buttons*, draws them under the card for anyone
  who would rather tap than drag. They are also drawn while one has keyboard focus, so Tab
  shows where you are and peeks that side.
- **Each button says what it moves, the way the preview dots do**: which meters and how
  much, never which way. As heard: *"Top it up. Moves Money a fair bit, Institutions a
  little."*
- **When a card lands, the game says what changed and what is next**: the meters the last
  choice moved, anything that went into danger, a change of look, and the card. As heard,
  from a real run in Chromium: *"Unions down a lot, Cities up a fair bit, Money down a fair
  bit, Institutions up a fair bit. A gold light comes up. Ordin Pell, Chief Scientist,
  Zealot. The ten-year model says close the coal towns now."*
- **The look, in its own words.** The frame's look is the only sign of where the country is
  heading, and it was purely visual. Each stage now has a line: *"The broadcast has gone
  live"*, *"The chat has started talking"*, *"It is all stream now"* on the way down, a gold
  light and a projection on the way up, and a line for easing back or going plain again.
  None of them mentions drift.
- **Meters say their level in words.** Each meter used to tell a screen reader its exact
  value, *"Money 47 of 100"*, which the screen hides from everyone else. Now it says *"Money,
  low"*, *"Order, in danger, too high"*. They use plain names too, not the deep looks' slang:
  *"CA$H"* is a joke for the eye and noise read aloud. For the same reason, the text late
  Decay misspells on screen is read as written.
- **Focus follows the screen.** A run's first card, and the first after an era, take focus.
  The era panel's words describe it, so arriving on *Continue* is not all a screen reader
  hears. The end of a run lands on the history's name.

**A bug this fixed, and one it did not.** I expected a race where one Enter press spent two
cards, and I added a guard for it. The regression test passed without the guard, so the
race was not real: React has re-rendered before the click that Enter triggers. The guard
came out. The real bug was different, and a browser test on v0.41.0 showed it: with a side
peeked, pressing Enter on the teaching note's *Got it* dismissed the note **and** played
the card. The window's Enter handler now leaves Enter to whatever control has focus. The
test fails without the fix and passes with it.

**Checked:**
- In the browser suite (24 tests):
  - every control on the run screen has a name;
  - a card played from its button reaches the live region;
  - no meter says a number;
  - Tab draws the hidden row and peeks that side;
  - with the buttons drawn, the smallest phone (360×640) still fits in all three
    directions, and the buttons pass contrast in all seven looks for both parties.
- 14 new unit and UI tests. The two guarding what a later change could quietly undo, the
  Enter fix and the meters' words, were each shown to fail without their fix.
- Settings move to version 3, for the new preference. The bundle grew by 1.6 KB gzipped.

**Not checked:** TalkBack on a real phone. Everything here is checked through the page's
accessibility tree in Chromium, not a screen reader speaking. That, and the decay look's
*Got it* button drawn as bare text (the share button's old problem; noted for phase 32), are
yours to look at.

<details><summary>Original entry</summary>

**Evidence.** On the run screen a screen reader finds three controls: *Your cabinet*,
*Settings* and the teaching note's *Got it*. The card has no role and no label. There is no
control for either choice. Nothing is announced when a card lands, a meter crosses a danger
line or an era turns. A keyboard player has the arrow keys; a TalkBack user, on the phone
the game is built for, has nothing to press.

**Do.**
- Two real buttons for the two choices, named by their labels, in the order they sit.
- The card as a labelled group (speaker, role, text), announced when it lands.
- A polite live region for what changed: a meter going into danger, an era, the end.
- Focus that follows the screen: to the era panel when it opens, to the end screen's heading.

Visible buttons are an option as well, a target to tap for anyone who does not drag. That is
a design change to show you before making. Add a browser check: every action on every
screen has a named control, and a new card reaches a live region.

**Done when** the audit finds a named control for every action on every screen, and a
TalkBack run from setup to an ending works on a real phone. That second part is yours to
confirm, like the playthrough.

</details>

## Phase 31. Let the playtest measure itself — *done*

**Shipped.** A tester can keep a record of how they play and send it, and a folder of these
reads beside the bots with one command. The game itself still sends nothing, and nothing
about how a run plays has changed.

- **The setting.** *Keep a record of my runs* is in Settings and off by default. It starts
  with the next run, since a run already under way was not seen from its start. Settings
  move to version 4.
- **What a card records:**
  - the card and the side taken;
  - how long the card was in front of the player;
  - how long each side's preview was up;
  - the drift, and the six meters before and after.

  The clock stops while the page is hidden or the settings are open. It keeps running in
  the cabinet, because looking up the rival before an election is part of deciding.
- **What a run records:**
  - the game version and the run code (seed and setup);
  - whether the run was the player's own, the daily or a shared code;
  - which of the player's runs it was, and how it ended.

  **What it leaves out:** dates, the device and settings. Settings are left out on purpose,
  because *Show choice buttons* or the plain screen can say more about a player than they
  meant to send.
- **It stays on the device**, in two keys of its own. A run left for another is kept as
  unfinished. A card left and come back to (the menu, a reload) is marked, and the report
  does not time it.
- **Size.** A full-length run is 14.6–14.8 KB (measured over 20 of them), so the cap of 100
  runs is about 1.5 MB. A full record stops taking runs rather than dropping its first ones,
  which are the ones worth most.
- **Clearing it.** *Delete my record* and *Erase all progress* both clear it. Turning the
  setting off stops recording the run under way and keeps what is already there.
- **Send my record** hands a plain-text file to the share sheet. The file types a browser
  will share include text/plain and not JSON. Where there is no share sheet, the file
  downloads. It has one card to a line, so a tester can read it before sending.
- **`npm run playtests`** reads `playtests/`, which git ignores. It refuses any file that is
  not exactly the format: an unknown field at any level is an error, the same rule the
  content validator applies. A run sent twice is counted once, and files that share a run
  are taken to be one player's. It prints:
  - survival for people, and for each bot playing the same run codes;
  - how that changes over a player's runs;
  - where runs end, and the cards they ended on;
  - time on a card, by era and card type;
  - the cards people hesitate on, measured against each player's own median time.

**A measure I changed while building it.** The report first counted "looked at a side before
choosing". A drag shows the preview of the side it is heading to from 8px of travel, so a slow
swipe counted as looking at the side taken. The report now leads with *looked at the side not
taken*, which no gesture produces on the way to a choice. It gives the other number with
that caveat attached.

**Done when, checked:**
- **Exports, imports and reports.** A browser test plays a run to its end in Chromium with
  the record on. It sends the record, which downloads here because this Chromium has no
  share sheet. It reads the file back with the strict reader and runs `npm run playtests`
  on it: one player, one run, and every bot replaying it.
- **Off unless turned on.** A fresh profile plays with nothing kept. Settings saved before
  v0.43.0 load with the setting off.
- **Nothing but game state.** A test holds every field at every level of the file to the
  format's list, and checks that no date appears. The reader refuses a file with an extra
  field, such as a device, a setting or a date.

**Also checked:**
- 32 new unit and UI tests. The clock's three behaviours were each shown to fail without
  their code: it stops for the settings, it stops while the page is hidden, and it is read
  at the moment of choosing, not after the card's 260ms flight.
- The browser suite is 27 tests. The settings with a record in them fit a 360×640 phone and
  pass contrast.
- The strict reader, and the validator it borrows from, are not in the game's bundle. The
  bundle grew by 2.0 KB gzipped.

**Yours:**
- **The Data safety answer.** twa/STORE.md sets out both readings. I could not open Google's
  pages to settle it.
- **The share sheet on a phone.** Sharing a text file is a standard path, but it is
  untested here.
- **The data.** It exists only if testers turn the setting on before they start playing.
  STORE.md has the three lines to send them.

<details><summary>Original entry</summary>

**Evidence.** Every balance number in four rounds comes from bots with perfect information.
The mixed bot finishes 96% of runs because it sees the exact meters each side would leave,
which a person never does. No human run has ever been measured. If the Play account needs a
closed test (12 testers for 14 days), those are the game's first real players, and nothing
they do can be seen today.

**Do.**
- An opt-in setting, off by default: *Keep a record of my runs*. For each card it records the
  time to decide, whether the player previewed a side, the side chosen, and the meters
  before and after.
- The record stays on the device. *Send my record* hands a file to the share sheet.
- `npm run playtests` reads a folder of these files and prints a report for the humans
  beside the bots': survival, time per card, the cards that make people hesitate, where runs
  end.

The game itself sends nothing, so the Data safety answer stays "no data collected". Check
that wording again when this ships.

**Done when** a recorded run exports, imports and reports; the setting is off unless turned
on; and the file holds nothing but game state.

</details>

## Phase 32. Everything fits — *done*

**Shipped.** Every meter name is whole on a 360px phone in all seven looks, for both
parties. A phone held sideways is asked to turn upright, rather than shown a card 101px
tall. On a laptop, the party chip and the menus sit beside the card. The owner's calls were:
- measure the fit in Roboto;
- rename "Institutions" to "State";
- rename "THE SYSTEM" to "THE MAN";
- ask for upright, rather than build a sideways layout.

**Two things this entry had wrong.**
- **The evidence and the audit used different fonts.** The evidence counted 9 names cut
  short in Roboto, the font Android draws the game in. The audit ran in this machine's
  DejaVu Sans, a fifth wider, and listed 15. Emptying that list would have meant renaming
  words that fit on every Android phone ("Movement", "Everyone", "Gov Stuff").
- **Sideways was rarer than it read.** Both manifests already lock the installed app
  upright, so only a phone's browser tab can be turned sideways.

**The names.**
- "Institutions" is now "State". The meter fails at both ends the same way: no ministry
  left, or forty-one committees.
- The deepest decay slang for it is now "THE MAN" instead of "THE SYSTEM".
- The decay looks dropped the 0.02em between letters on meter names. That spacing was what
  cut "THE MONEY", "EVERYONE!!" and "MOVEMENT" short, each by 1.1px or less. The capitals
  and the bold stay.
- Every other name keeps its words. The tightest is "The Money", with 0.6px to spare.

**The audit is measured in Roboto.** The five weights the game uses (400 to 800) are in
`tests/browser/fonts/`: 620 KB, under the SIL Open Font License, never shipped to players.
Chromium is pointed at them through fontconfig. A guard test lays text out in the system
font and again in that Roboto file loaded as a web font, and requires the widths to match.
With the fontconfig removed, the guard fails, and so does the name check. The store
screenshots use the same font and were taken again; no name is cut in them now.

**Sideways.** During a run, a touch screen held sideways and under 500px tall shows *Turn
your phone upright* over the run. The run itself is untouched underneath. The stylesheet
alone decides when the notice shows, and it is hidden from screen readers, since someone
playing by ear loses nothing sideways. The menus, the codex and the end of a run are pages
that scroll, and they fit sideways.

**Laptop.**
- The row under the card is capped at the teaching note's 460px. The chip and the menus now
  sit about 40px from the card, where they used to sit at the window's edges.
- In decay2 and decay3, the card kept a gutter for the stream chat at every width, which
  pushed it off centre under a centred footer. The gutter now applies only below 600px, the
  width at which a centred card could reach the chat.
- "The chat never covers the card" was a rule nothing tested. A check now covers every
  phone size and the laptop. It fails if the gutter is taken away on phones.

**The decay looks' "Got it"** was a word on the teaching note with nothing to show it could
be pressed: no border, and a face the same colour as the note. It now wears the accent
outline the party chip has in those looks.

**Done when, checked:**
- **844×390**, as a touch phone, in three looks: the notice covers the screen, fits, and
  passes contrast. Turned upright again, the run is back. The menus, the codex and the end
  of a run fit.
- **1280×720**, in three looks: nothing is cut off and nothing scrolls. The chip and the
  menus are within 60px of the card, and the chat stays off the card. The menus, the codex
  and the end of a run fit.
- **The list of names allowed to be cut short is gone.** The test now fails any name cut
  short at 360px.

**Also checked:** the browser suite is 30 tests and the unit suite 435. The bundle grew by
296 bytes gzipped.

**Not checked:**
- **Other phones' fonts.** Samsung's own font and an iPhone's San Francisco are not
  measured. "The Money" has 0.6px to spare in Roboto; a wider system font could cut it.
- **Tablets.** My understanding is that Android 16 ignores the portrait lock on tablets and
  unfolded foldables for apps targeting API 36, as the Play build does. Those screens are
  tall enough for the laptop layout, which the 768×1024 audit covers, but no tablet has
  been tried.

<details><summary>Original entry</summary>

**Evidence.** Three layouts the audits either do not cover or cannot pass:

- **Meter names cut short at 360px** (phase 29). In Roboto that's 9 names across 6 looks; the
  worst is "Institutions", 12.4px too long in the first decay stage. The store screenshots
  show it.
- **A phone held sideways** (844×390). The card shrinks to 101px, the speaker's name
  overlaps the text, and the portrait disappears.
- **A laptop** (1280×720). The game is a phone-width column in an empty page, with the party
  chip and the menu icons pinned to the far edges. Laptops are where shared links often get
  opened.

**Do.** The names are your call: a shorter name for the institutions meter, and either
shorter slang for the deep looks or no capitals and letter-spacing on narrow screens. Then:

- a landscape layout, with the meters beside the card;
- a wide layout that keeps the party chip and menus near the card;
- the fit audit extended to both sizes, and the known-truncation list emptied.

**Done when** the audit passes at 844×390 and at 1280×720 with nothing cut off, and the
list of meter names allowed to be cut short is empty.

</details>

## Phase 33. Carry your progress — *done*

**Shipped.** Settings › *Move my progress* takes a profile from one address to another:
another browser, the Play app when it is not the same browser, or the game at a new domain.
- **What moves:** the codex, the unlocks, the history and the settings, lessons already given
  included. A run in progress stays where it is, and so does a playtest record, which has
  its own way out. The dialog says both.
- **Taking it away:**
  - a file of plain JSON, handed to the share sheet or saved where there is none;
  - a code to copy. It is compressed: a forty-run profile is 7.1 KB of JSON and about
    2.2 KB of code. A browser that cannot compress still makes a longer code that reads back.
- **Bringing it here:** paste the code, open the file, or open a link with `#progress=` and
  the code. The link also works in a tab that already has the game open, where only the
  fragment changes.
  - Nothing is replaced until the player has seen what is here beside what is coming in
    (runs, endings found, unlocks) and pressed *Replace what is here*.
  - Bringing in fewer runs than are already here gets its own warning.
  - Progress from a newer version is refused, with the version named. An older profile is
    brought forward by the same migration a saved one goes through.
  - A code that would unpack to more than 1 MB is refused. Forty runs are 7 KB, and a link
    is something anyone can send.

**A bug this found.** The move test could not press *Move my progress*, because Settings ran
off the bottom of the screen:
- on a 360×640 phone, the dialog was 846px tall, with 218px out of reach;
- on a 412×732 Samsung, 57–77px were out of reach.

The overlay is fixed, so nothing could be scrolled, and *Close* and *Erase all progress*
were below the edge. Every row the last phases added made it worse. The audits missed it:
a fixed overlay does not scroll the page and no box clips it, so neither fit check fired.
Every dialog card is now capped at the screen's height and scrolls inside itself. A new
check fails any dialog that runs past the screen, and a test opens Settings, the cabinet,
*How this works* and *Move my progress* on the smallest phone. With the cap taken away, that
test fails.

**Done when, checked:**
- **A 40-run profile survives export and import exactly.** Unit tests check the compressed
  code, the uncompressed one, the file and the link. In the browser, two profiles that share
  nothing stand in for two addresses: the code copied out of one and brought into the other
  matches exactly after a reload. The link route passes too.
- **A newer version is refused with a message.** This is covered by the unit and dialog
  tests. Both fail with the check taken out.

**Also checked:** 15 new unit and dialog tests, and 3 new browser tests. The dialog passes
contrast and fits a 360×640 phone. The bundle grew by 2.4 KB gzipped.

**Yours, if you move to a custom domain:** GitHub Pages redirects the old address once a
domain is set, and what was stored there can no longer be reached. So the move has to happen
before the switch: ship a release that tells web players to move their progress, or keep the
old address serving the game for a while. twa/STORE.md says the same.

<details><summary>Original entry</summary>

**Evidence.** A profile lives in one browser's storage for one address. A 40-run profile is
6.8 KB. Moving to a custom domain, the recommended fix for Play's asset links, would start
every web player over. The Play app shares its storage with the phone's browser only when
both are the same browser at the same address.

**Do.** Settings › *Move my progress*:
- export as a file through the share sheet, or as a code to copy;
- import shows what will be replaced and asks first;
- older versions migrate through `migrateMeta`, and newer ones are refused.

Ship it before any change of address.

**Done when** a 40-run profile survives export and import exactly, and a newer version is
refused with a message.

</details>

## Phase 34. Take the other road — *done*

**Shipped.** On the end screen, every decision under *What became of it* that the run made
on a card now has *Choose “‹the other side›” instead*, which names the side not taken.
Pressing it:
1. replays the run to that card;
2. takes the other side;
3. hands the run back, and the player plays on.

The first card of the second road says where it left the first. When it ends, the end
screen shows both roads side by side: each world's picture, the name each road earned, and
where they parted ("card 17: “Build instead” the first time, “Freeze rents” the second").

**The codex rule.** The owner left the backlog's default in place: a second road counts toward
the codex, is marked *The other road* in the history, and is never the daily. A second road
does not branch again. It is not in the playtest record either, since that record times
runs from their first card.

**How it works.**
- **The record.** A run now keeps its choices, as the card and the side taken on each (run
  save v10).
- **The replay.** It deals the run from its setup and seed again and checks every card it
  deals against that record. A replay that parts from the record stops: a run could be
  saved on one version and finished on the next, and it is not handed back as something
  that never happened.
- **When going back is offered.** Only when the record covers every card. A run saved
  before v10 has no record, and neither does a save edited to skip ahead, as the audits do.
- **Saves.** A second road holds its finished first road inside its save, so leaving and
  coming back keeps both.

**Measured, over 1,000 competent runs (the mixed bot):**
- Every run offers at least one way back, and 3.97 on average.
- In 9.0% of those, the other side ends the run on the spot. The second road is then over
  before it starts; it still counts, and its end screen shows both roads.
- A replay takes 1.4 ms on this machine.

**Done when, checked:**
- **Replaying reproduces the state exactly.** Across 1,000 seeded runs, the replay put the
  run back identical to the original state at every card checked: the first, the last and
  two random ones in each run, over 3,000 in all. The runs cover every bot, both sides,
  with and without every unlock and a promise. With the promise left out of the replay's
  setup, the test fails, and the replay's own card check catches the divergence.
- **A second road's end screen shows both roads.** A browser test plays a real run to its
  end on a 360×640 phone. It goes back from the end screen and reads the note on the first
  card, then reloads mid-road and continues. Played out, the second road's end screen shows
  two pictures and both names, and passes contrast and fit.

**Also checked:**
- 12 new unit tests, covering:
  - the daily left alone;
  - a second road not branching;
  - the case where the other side ends the run at once;
  - the codex mark;
  - the save migration.
- The browser suite is 34 tests. The bundle grew by 1.1 KB gzipped.

<details><summary>Original entry</summary>

**Evidence.** Flip one decision and let the same player (the mixed bot) play on, 1,500 runs
for each kind of flip:

| Flip | History name changes | Ending changes | Later cards unchanged |
|---|---|---|---|
| The run's defining decision | 99% | 40% | 27% |
| A random decision mid-run | 70% | 39% | 27% |
| One of the first ten | 93% | 47% | 14% |

Decisions matter a great deal, and nothing in the game lets a player find that out. The end
screen says what each big decision became (phase 28), never what the other side would have
done.

**Do.**
- Record each run's choices (run save v10).
- On the end screen, beside the defining decision and each of the others under *What became
  of it*: *Go back and choose otherwise*.
- Replay the run to that card. The same seed and the same choices give the same state, so the
  replay is exact. Hand it back with the other side taken, and the player plays on.
- When the second road ends, show both: the name each road earned, and each world's picture.

Decide whether a second road counts toward the codex. The simple rule is yes, marked as a
second road, and never toward the daily.

**Done when** replaying to any card reproduces the original state exactly, across 1,000
seeded runs in a test, and a second road's end screen shows both roads.

</details>

## Phase 35. More crises, more faces — *done*

**Shipped.** Six new crises and a third advisor in every cabinet role. A run now inherits one
of ten crises and is served by people drawn from twenty-four.

**The crises.** Each starts you somewhere of its own and deals one card nobody else gets, in
your first era. Four favour an arc. Two bend an era, which is a rule the game did not have
before.

| Crisis | Starts you | Its rule | Its card |
|---|---|---|---|
| A drought | Public −6, Money −6, Base −4 | favours the water arc (×2.2) | the river, and who gets it |
| A leak | Public −6, Backers −6, State −2, Base +2 | favours the press (×1.8) and impeachment (×1.5) arcs | the predecessor's messages |
| A failed coup | Order +8, Money −8, Backers −3, Public −3, Base −2 | favours the purge on the left and the strongman on the right (×1.8 each) | the plotters in the cells |
| A debt crisis | Money −10, Backers −4, Public −2 | bends your own term: every bill you put off comes due in 70% of the time | the pension fund as collateral |
| Blackouts | Money −7, Public −4, Backers −3, Order −2 | bends era 2: Public −1 every 6 cards, beside the era's own pressure | the rota that skips the ministries |
| A predecessor who will not leave | Public −5, Backers −5, Money −5, State −3 | favours the succession arc (×2.2) | the locks at the residence |

Five of the six cards send a consequence back later on their tempting side.

**How a bend works.** A modifier can now carry `bends`: rules for one era, added to the era's
own rather than replacing them. Its standing pressure runs on its own beat beside the era's,
and its multipliers multiply the era's. The era jump says it under the era's own rule. The
debt crisis bends your own term, which has no jump, so its blurb says it at setup.

**The faces.** Each role gained a third advisor with a trait combination it did not have:

| Role | New advisor | Traits |
|---|---|---|
| Treasurer | Hester Coyne | zealot, loyal |
| General | Casimir Orde | competent, corrupt |
| Press Secretary | Juno Farrant | zealot |
| Chief of Staff | Rufus Tolliver | corrupt |
| Chief Justice | Evander Crane | loyal, corrupt |
| Chief Scientist | Anouk Veldt | loyal |
| Donor | Cosima Wexler | zealot |
| Organizer | Lorna Pike | competent, corrupt |

Each has two cards in their own voice. The first is what they want from the job, and it feeds
the owed and snubbed cards every role already had. The second comes once they have served a
while.

**What changed in existing content, and why:**
- **A card about a kind of advisor now waits for that kind.** Seven cards named whoever spoke
  them as corrupt or as loyal, but were gated on the flag for the whole room. So "{advisor}
  has been managing the reserve for years. A junior has found the second set of workings"
  could name Odalys Brenn, the treasurer who wants the accounts published. A condition can
  now read the speaker's own traits (`speakerTraits`), and those seven use it.
- **The cabinet plot needs a crooked treasurer.** Its entry needed only a crook somewhere in
  the room, and it always sacked the treasurer, so two times in three it sacked an honest one
  for skimming. It was entered in 50% of competent runs, which put all three treasurers at
  47–50% of runs, over the ceiling below. Its entry now reads the treasurer's traits, and its
  three cards name the treasurer. It is entered in 17.3% of runs.
- **Pronouns.** Nineteen cards named whoever held a role and gave them a gender. Six roles now
  have both men and women in them, and some of those cards were already wrong: the general's
  parade card called Ines Corvo "he". They are written without a pronoun for the speaker
  now. Cards written for one person keep theirs.
- **A way back only into the same run** (phase 34). A third advisor in each role changes the
  cabinet a seed deals, so a run begun before this update deals differently after it. The
  end screen used to check only that the record covered every card. It now replays the whole
  record and offers a way back only when that ends where the run ended.

**Measured:**
- **Crises.** Over 20,000 seeded setups, each of the ten is dealt in 9.9–10.2% of runs, for a
  new player and a fully unlocked one alike.
- **Advisors.** Over 20,000 competent runs (the mixed bot), each of the 24 serves in
  32.8–41.3% of runs. Serving means holding the role at any point, including after
  someone is let go. `npm run simulate` now prints this range, and the most common crisis.
- **Meeting them all.** Measured as the audit measured it (the mixed bot playing runs in a
  row; the median of 400 players), a player now meets every crisis by run 28 instead of run
  8, and every cabinet advisor by run 9 instead of 5. The audit said run 7 for the crises; this
  sample says 8 for the same four.
- **Balance,** 20,000 runs per bot, before → after:
  - random median run: 60 → 60 cards (mean 59.8 → 60.2);
  - the most common ouster: bankruptcy, 23.4% → 23.6%;
  - greedy ends in Decay: 75.1% → 75.3%;
  - saint ousted before era 2: 100% → 100%;
  - mixed reaches Ascent: 18.3% → 21.2%.
- **The first draft missed.** Its random median was 61 cards. Three of its crises cut State,
  which honest play pushes up. Those runs ended in paralysis later, and they gave the mixed
  bot more room before State became a danger: 31–35% Ascent. After retuning, measured over
  10,000 runs (about 1,000 per crisis):

  | | Random run, mean | Mixed Ascent |
  |---|---|---|
  | The new six | 56.8–61.2 cards | 18.4–22.5% |
  | The old four | 59.6–61.7 cards | 18.6–23.3% |

  The failed coup ends random runs soonest.

**Done when, checked:**
- **10 crises, none in more than 15% of runs:** 9.9–10.2%. A test deals 20,000 setups for
  each kind of player.
- **24 advisors, each serving in 20–45% of runs:** 32.8–41.3%. A test plays 2,000
  competent runs.

**Also checked:**
- `validate:mvp` is clean at 554 cards. The validator now rejects a bend that never applies,
  changes nothing or bends one era twice, and a speaker condition nobody in the role can
  meet.
- The unit suite is 482 tests and the browser suite 35. The new browser test takes a
  blackouts run to the era 2 jump on 360×640 and 412×732: the panel does not scroll, and it
  passes fit and contrast. That run already carries the most the panel shows, with 142px to
  spare.
- Mutation-checked, each failing a test:
  - speaker traits ignored;
  - an arc entry read without its first speaker;
  - a bend's beat or its multipliers dropped;
  - the replay check cut down to the cards, or to the record's length;
  - a pronoun put back;
  - a tenure card reading the room again.
- The neutral-card test now measures the everyday deck. A card for one crisis or one named
  advisor has to serve both sides. Counting those put the share past 60% without changing
  what either side draws. The everyday deck is 56.0% neutral, as before.
- "A predecessor who will not leave" fits the setup offer and the end screen at 360px.
- The bundle grew by 3.7 KB gzipped.
- **A simulated card is 14% slower.** On the same engine it takes 57–61µs with the new cards
  and 50–51µs without. The draw checks every card in its pool, and era 1's pools grew by a
  sixth. Two harness tests that ran on vitest's 5s default went over it on CI (5.6s), so they
  now carry a budget like the file's other simulations.

**Yours:**
- **The new writing.** Read it before or after it ships:
  - the six crises' names and blurbs (`strings.ts`);
  - their cards and consequences (`era1/gated.json`, `era1/queued.json`);
  - the eight advisors (`advisors.json`), their wants (`wants.json`) and their second cards
    (`voices.json`).
- **Changes to writing you shipped.** The cabinet plot's three cards, and the nineteen
  pronoun rewrites in `kept.json`, `tenure.json`, `strongman.json`, `mandates.json` and
  `elections/shared.json`.
- **Old run codes.** A code sent before this update opens with a different cabinet after it.
  Any new card could already change what a code deals.

<details><summary>Original entry</summary>

**Evidence.**
- The first thing a run tells you is the crisis you inherit. There are 4, and a player has
  met every one by run 7.
- The cabinet is 16 advisors, two per role, and a player has met them all by run 5.
- Traits (11) and flaws (10) meet the design's target. Crises and the cabinet are the thin
  ones: the full plan asks for 10+ crises and 30+ advisors.

**Do.**
- Six new crises, each with a rule of its own (a starting position, an arc it favours, or an
  era it bends) and a card only it brings.
- A third advisor for each of the eight roles, with a trait combination the role doesn't
  have yet, and a card or two in their own voice.

**Done when** there are 10 crises, none in more than 15% of runs, and 24 advisors, each
serving in 20–45% of runs.

</details>

## Phase 36. The deck by run five — *done*

**Shipped.** 300 new ordinary cards and 12 new bills, drafted for you to edit. The deck is
866 cards, up from 554: 130 more in era 1, 90 in era 2 and 80 in era 3, 45% of them shared
and the rest split between the two sides, and 51 written for one band. By their tenth run a
player has seen 73% of that run's cards before, down from 89%.

**The guide in this entry was wrong.** It said 200 more ordinary cards would take run ten to
about 71%. Placeholder cards shaped like the deck's measured 79.5% at 200 (81.0% by the
audit's median of 20) and 73.1% at 300 (73.3%), so the batch is 300. The guide treated a
run's draws as independent; where that undercounts was not pursued.

**The index came first.** A draw checks every card in its pool, and each check searched the
run's history: the cards seen, the cooldown, the flags. The draw now gathers those into sets
once per draw, a pool holds a card once, and a choice's effects are worked out once rather
than once per meter. Results are identical: a fingerprint of 1,000 seeded runs per bot did
not change. A simulated card took 54–58µs at 554 cards before the index and 35–36µs
after. At 866 cards it takes 37–50µs.

**How the drafts were fitted.**
- They were written in batches by era and side, each gated by `validate:mvp`.
- The first full draft missed two targets: a random median of 61 cards, and mixed Ascent at
  15.1%. The drafts spread small costs over many meters, and the old deck's costs are few
  and large: an old honest choice costs a lot of Money or none, and more of them help a
  bloc. A player keeping the meters calm prefers many small costs, so the greedy bot took
  the honest side of 66% of the new era 1 cards, against 35% of the old ones.
- So each new card's effects were put on the old deck's distribution, meter by meter, per
  era and side, by rank: the card with the biggest effect keeps the biggest. That added 618
  effects, mostly ±1 and ±2, and removed 114. Thirty-seven of the additions contradicted
  their card and were taken back out, among them a tax that cost money, donors cheering a
  songbook, and Order from planting a garden, which leaves 581.
- That fixed run length and mixed Ascent, and made greedy worse, because what the greedy
  bot's drift depends on is which temptations it takes. Drift was matched to the old deck
  the same way, then moved a point at a time between cards of the same era, side and kind:
  the temptations a calm player takes when nothing is wrong corrupt more, the ones taken to
  pull a meter off an edge corrupt less, and honest choices only a saint takes earn more
  than the cheap ones everyone takes. Taken together, the new temptations corrupt a little
  more than the old ones.
- The pick counts that decided which cards moved came from seeds the targets are not
  measured on, and the targets were then checked on three sets of seeds.

**The deck's other conventions, kept.** Every choice that sends a bill also names the habit
it was, and 170 of the new temptations do (skim 42, bend 82, clamp 46; clamp had 15 cards
before). Each of the 12 new bills is sent by at least two cards. A consequence rides on
36.4% of ordinary choices, over the one-third floor, and cards written for one band are
21.1% of the deck, over the one-fifth floor.

**Measured** the audit's way (the median of 20 players):

| | The audit, v0.41.0 (526 cards) | v0.48.0 (866 cards) |
|---|---|---|
| A player's 10th run: cards already seen | 89% (era 1: 92%) | **73.3%** (eras 1/2/3: 71/71/77%) |
| A player's 20th run: the same | 98% | 92.4% |
| Share of the deck seen after 5 / 10 / 20 runs | 57% / 74% / 85% | 47% / 70% / 89% of a bigger deck |

At 554 cards, before this phase, the tenth run measured 89.3%.

**Balance,** 20,000 runs per bot, before → after:
- random median run: 60 → 59 cards (mean 60.2 → 59.5);
- the most common ouster: bankruptcy, 23.6% → 26.1%;
- greedy ends in Decay: 75.3% → 75.7%;
- saint ousted before era 2: 100% → 100%;
- mixed reaches Ascent: 21.2% → 21.2%.

**Done when, checked:** a player's tenth run is 73.3% cards already seen, under 75%,
measured the same way: twenty players, the mixed bot, runs in order with unlocks carried
forward, the median at run ten. A test holds it, and `npm run simulate` prints it.

**Also checked:**
- `validate:mvp` is clean at 866 cards.
- The unit suite is 483 tests and the browser suite 35.
- The content chunk grew from 73.0 to 104.0 KB gzipped. On a 6×-throttled CPU at 412×732
  the first screen took 503–529ms, against 488–519ms before, and the first card
  232–257ms, against 222–266ms: no difference beyond the noise.
- The everyday deck is 51.2% neutral, down from 56.0% and inside the 40–60% band: 55% of
  the new cards belong to one side.
- The screen-reader test pinned seed 21 because its first card named its speaker through a
  placeholder. The new deck changed that card, so it pins seed 3. About 6% of first cards
  open with a placeholder now, against 9.5%.
- The store listing's card count and its content-rating notes cover the new cards: water
  cannon, armed militias, a casino licence, cigarettes as a currency, and churches as
  landowners.

**Yours:**
- **The 300 cards and 12 bills are drafts, in your voice, to edit**: `any3.json`,
  `left3.json` and `right3.json` in each of `era1/`, `era2/` and `era3/`, and the last
  twelve bills in `bills.json`.
- **Their numbers were fitted after they were written** (above). If you change a card's
  effects or drift, run `npm run simulate` after the batch. The random median is the
  tightest target: 59 against a ceiling of 60.
- **Which habit a temptation names** (skim, bend or clamp) is my reading of 170 cards.
- **Era 3 repeats most now:** 77% at run ten. A next batch would go there.
- **Old run codes and today's daily.** A code sent before this update opens a different run
  after it, and a run begun before it almost certainly cannot take the other road: phase
  34's replay no longer ends where the run did. The daily is dealt from the date, so on the
  day the update lands, players on the two versions get different dailies.

<details><summary>Original entry</summary>

**Evidence.** A player has seen 57% of the deck after five runs and 74% after ten. By the
tenth run, 89% of a run's cards are ones they have played before; by the twentieth, 98%.
The cause isn't a few overused cards: only 3 cards turn up in more than 60% of runs. It is
the deck's size. A run draws about 100 of 526 cards, fairly evenly. Era 1, which every run
plays, repeats the most: 92% by run ten. The design's full plan is 1,000+ cards.

**Do.** Write where repetition bites first: era 1, then eras 2 and 3, by band and side, in
batches the validator gates. A run draws 76 ordinary cards from a pool of 384; the other 28
are arc, consequence, election and habit cards. Treating those 76 as independent draws
predicts 86% repeats at run ten, against the 89% measured, so as a rough guide:

- 200 more ordinary cards would take run ten to about 71% repeats;
- doubling the ordinary deck would take it to about 61%.

This is your voice work. Batches can be drafted for you to edit.

Each card added makes every draw slower, because the draw checks every card in its pool.
Phase 35's 28 cards made a simulated card 14% slower. Two hundred more may be worth an index
on the draw's `seen` and cooldown lookups first, or the harness and the replay tests will
slow with them.

**Done when** a player's tenth run is under 75% cards already seen, measured the same way.

</details>

## Phase 37. Challenge a friend — *done*

**Shipped.** A shared link says how the sender's run went, and the receiver's game deals
that run again from it. The offer says what they got: *They left The Homes Never Built. Out
of Office, after 60 cards.* The receiver's end puts the two worlds side by side under *Their
run* and *Your run*. A line says how they differ (*They went to Decay. You went to
Ascent.*), and a table compares what history called each, how each ended, the cards and the
direction. There is no server.

**Not a run code v2, as planned.** The result rides beside the run code, as `?run=…&vs=…`,
and the run code itself is unchanged:
- **The code is what a run started from.** The playtest record and the replay both key on
  it, and a result is not part of that.
- **A version of the game from before this still opens the link.** A stale tab, or the Play
  app before it reloads, reads the code and ignores the rest. A new code format would have
  been a broken link to it.

**The result** is `1.<history>.<ending>.<cards>.<sides>`. It is the format version, what
history called the run, how it ended, how many cards it took, and the side taken on every
card, a bit each. It is 56 characters on average and 70 at most, so the audit's whole link
is 166 characters.
- **The sides bring the run back.** The deal decides which card comes, so the receiver's
  game plays the same sides from the same code, and draws the sender's world from their run.
- **A run that no longer deals the same** (played on a version that changed the deck) does
  not end where the link says. Then the comparison uses what the link says, without their
  picture, and says why.

**Also:**
- **Saved with the run.** A challenge left mid-run still compares at the end.
- **A daily sent on its own day is today's daily** for whoever plays it (phase 38), and the
  offer says so. Otherwise the menu would go on to offer the run they had just played.
- **A second road taken from a challenge does not compare.** Its end already shows two
  roads.
- **Every share link now carries its run's result,** so a reply to a challenge is one back.

**Found, and fixed: a key pressed as a card landed was dropped.** This phase's first deploy
failed in CI. The daily audit hung, waiting for a card to show its peeked side, though the
same commit had passed on its branch. The game re-attached its keyboard listener a moment
after each new card was on the page. A key pressed in that moment went to the old listener,
which still took the last card for leaving, and dropped it. In a reproduction, every press
made as the next card landed was lost (0 of 6). The listener now changes with the card (6 of
6), and a browser test presses at exactly that moment. No person presses that fast, but the
audits do.

**Done when, checked:**
- **A v2 link round-trips:** across 400 runs by every bot, the result reads back exactly,
  and the run dealt again from it is the sender's run to the last meter and flag. A fixed
  example pins the format, so a change to it cannot quietly break links already sent.
- **A v1 link still works:** it opens as before, with no comparison, and a v2 link's run
  code is exactly the v1 code.
- **The end screen compares the two runs:** unit tests, and a browser audit that opens a
  real link on a 360×640 phone, reads the offer, and ends the run in each direction. It
  checks both worlds, the comparison, contrast and fit. Ending the run reloads the page
  mid-run, so the audit also covers a challenge that is left and taken up again.

**Also checked:**
- The unit suite is 518 tests and the browser suite 39.
- Fifteen mutations were each caught by a test. A sixteenth found a check that could never
  fail, a card count that the replay already guarantees, and it was taken out.
- The bundle grew by 1.8 KB gzipped.

**Yours:**
- **The link holds every choice the sender made.** Nothing shows them before the end, but a
  curious receiver could read them out of the link. It is a satire with no scores, so it
  seemed fine; say if not.
- **The share text still says** *Play the same run:* before the link. Something like *Beat
  mine:* would say what the link does now; the words are yours.
- **The store listing** says a friend "starts the very run you played". It could add that
  they see both at the end. That is your listing copy, so it is unchanged.
- **Links sent before this version** carry no result, so they open as before, with no
  comparison.

<details><summary>Original entry</summary>

**Evidence.** A shared link starts the sender's run (phase 11) and says nothing about how it
went. Two different players given the same code almost always end differently: over 1,000
codes, the mixed and greedy bots earned different history names 98% of the time, different
endings 76% and went different directions 75%.

**Do.** The link carries the sender's result as well as the setup: run code v2 adds the
history, the ending and the cards played, and v1 links still open. The offer says what the
sender got, along the lines of *They left The Seawall Years*. The receiver's end screen puts
the two runs side by side, with both pictures. There's no server; everything rides in the
link.

**Done when** a v2 link round-trips, a v1 link still works, and the end screen compares the
two runs.

</details>

## Phase 38. The daily, every day — *done*

**Shipped.** The profile keeps every daily played to its end, and the game shows them as a
month, with a streak and a number for each day.

- **The log** (meta v6): one entry a day with the day, the history key, the ending and the
  cards played. A v5 profile kept only its latest daily; that one becomes the log's first
  day, named by its ending, because v5 never recorded what history called it.
- **The number.** #1 is 2026-09-21, the first daily the game dealt, so 2026-09-23 is #3. A
  daily's share line leads with it, *Rule or Drool #412 — "The Seawall Years"*, and so does
  the picture's title pill. A day before #1 has no number: a phone whose clock has lost its
  place says it is 1970, and gets the plain wording.
- **The streak** counts days in a row with a daily played to its end. It stays alive through
  today while today's daily is still there to play, and a missed day ends it. The best
  streak is kept too.
- **The month view.**
  - **In the codex:** the streak, the month in weeks with each day played marked, missed
    days struck through, and each day's name under it. It pages back to the first month
    played.
  - **At the end of a daily**, in whatever look the run ended in, under a line with the
    day's number and the streak.
  - **On the menu:** the button says *Daily #3* or *Daily #3 played*, with the streak
    under it.
- **Moving a profile** now shows dailies played and the streak beside the other numbers, so
  replacing a profile says what it would lose.

**Found, and fixed:**
- **A daily left mid-run stopped being the daily.** Only memory knew a run was the day's
  daily. Reopened in a new tab, or after a phone killed the app (a run is 105 cards), it
  finished as an ordinary run: the day went unrecorded and the menu offered it again. With
  a streak on top, closing the app would have broken it. The run's save now carries the
  day. A browser audit reloads each of its seven dailies mid-run, and every one still
  counts.
- **The spent daily button read 3.31:1.** "Daily run played" was dimmed with half opacity.
  No audit had a profile that had played today's daily, so none had seen it. It is dimmed
  by colour now, as the codex already did for the same reason.

**Done when, checked:**
- **A year of dailies stays under 40 KB:** 34.2 KB for a year of typical entries (94 bytes a
  day). The test takes the worst case: a leap year with the longest history key and ending
  the game has on every day, 39.2 KB (107 bytes a day).
- **The month view reads in every look:** a browser audit plays today's daily on a
  360×640 phone and ends it in each of the seven looks. It checks the end screen for
  contrast and for fit. It also reads the menu and the codex, with a month of dailies in
  them, with the plain screen on and off.
- **A missed day breaks the streak:** unit tests, across month and year ends and a leap day.

**Also checked:**
- The unit suite is 501 tests and the browser suite 37. Twelve mutations were each caught
  by a test: the resume, the saved day, the streak's two rules, one entry a day, the seed
  check, the migration and its clean-up, a day before the first, the menu's played state,
  the share number and the numbering.
- The bundle grew by 2.3 KB gzipped.
- A year of dailies makes a forty-run profile's move code 7,210 characters instead of 2,202.

**Yours:**
- **Days are UTC days,** as the daily itself always was, and the screen says so: *a new
  daily every day at 00:00 UTC*. In the Americas that is afternoon or evening. So someone
  who plays in their evening one day and their afternoon the next misses a UTC day without
  missing one on their own calendar. A daily by local date, as Wordle does it, would fix
  that, but changes which run a group spread across time zones counts as today's. It is
  your call, and cheapest before launch.
- **#1 is 2026-09-21.** If you would rather the first public daily be #1, move
  `FIRST_DAILY` in `src/meta/daily.ts` before anyone shares a number.
- **The 40 KB bound has 2% to spare in the worst case.** Phase 39's history names for the
  long view could be longer than today's longest key. The test measures with the real keys,
  so it would say so.
- **The daily button is at the bottom of the menu,** under the whole setup. On a phone it
  is out of sight until you scroll. Not changed here.
- **A move link with a year of dailies in it** is over 7,000 characters. It pastes, but some
  chat apps may cut a link that long (not measured).
- **The new wording** (`STRINGS.daily`): the streak lines, the month view and the menu line.

<details><summary>Original entry</summary>

**Evidence.** The daily is now the same run for everyone (phase 11), but the profile keeps
only its latest result. There is no record of past dailies and no streak: nothing to come
back for tomorrow.

**Do.**
- Keep a log of dailies: the day, the history name, the ending, the cards played. That's
  meta v6, and about 100 bytes a day.
- A month view with each day's name, and a streak.
- A daily share line carrying the day's number (*Rule or Drool #412*), so a group can compare
  without sending links.

**Done when** a year of dailies stays under 40 KB, the month view reads in every look, and
a missed day breaks the streak.

</details>

## Phase 39. Eras four and five — *done*

**Shipped.** The long reign is two more eras, *Two centuries on* and *Five centuries on*, for a
player who has reached a finale. It is chosen on the menu, beside the promise. The direction
is set as the fourth era begins, as the original design had it (5.2: "band lock-in after era
3"), and the jump into that era says so. A long reign ends in a finale of its own, and history
names it from the long view.

**What it adds:**
- **187 cards:** 91 for two centuries on and 96 for five. Like phase 36's, they are drafts
  for you to edit. In each era:
  - 46 cards for either side and any direction;
  - 23 written for one direction;
  - 12–14 for one side;
  - 10 that answer a legacy of the first three eras (the seawall, the election counted twice,
    the long ship and others).

  Three more in era 5 answer a decision made two centuries on. Their effects were fitted to
  era 3's averages, honest side and tempting side separately, without removing any meter a
  card touches.
- **A rule for each era:**
  - *Two centuries on:* nobody owes your party anything, and your base and your backers drift
    away every six cards.
  - *Five centuries on:* this is where it was always going. Every five cards, a country in
    Decay comes apart a little (order and the state), a Muddle one loses a little of the
    public's patience, and one on the Ascent adds to the state. Everything lands 1.3 times
    harder in Decay and 0.8 times as hard on the Ascent.
- **An ending, an epilogue and a history name for five centuries:**
  - three finales: *The Long Way Down*, *The Oldest Argument* and *The Far Shore*;
  - twelve epilogues for eras 4 and 5;
  - 99 history names for the long view, one for each decision and direction. They name no
    side, because two centuries on nobody remembers your name, or your party.
- **Opened by the first finale.** *Outlast yourself* now opens the long reign. A new
  objective, *The long view*, is for seeing one through. A long finale counts for the other
  finale objectives too (*Under its own weight*, *Orbit, honestly*).
- **Elections** come round in eras 4 and 5 as in the first three.

**Three-era runs are exactly unchanged.** A long reign deals what the ordinary run on its
setup deals until its fourth era. A draw that has to widen reaches eras 4 and 5 only once a
run is in them.
- A hash of 8,000 three-era runs, every card and choice, is the same before and after, with
  no unlocks and with all of them.
- The 20,000-run harness gives the same numbers to the decimal for every bot, ending and
  target: random median 59 cards, bankruptcy 26.1%, greedy Decay 75.7%, saint 100%, mixed
  Ascent 21.2%.

**Its own targets, and why they are not about survival.** The bots see every effect before
they choose, so they offset any steady pressure an era applies. Measured while balancing:
- draining 24 points of order and 24 of the state over era 5 left the greedy bot finishing
  95% of its Decay reigns;
- 42 points of standing for the rival over era 5 changed nothing, because the bots cheat the
  one election in it when they would lose it.

Survival targets for competent play would measure the bots' foresight, not the game. How
hard five centuries are for a person waits on playtest records, as the ordinary game's
difficulty does (see *Considered, and not proposed*). So the targets hold the long reign's
shape. At 20,000 long reigns per bot:

| Target | Wanted | Measured |
|---|---|---|
| Mixed bot reaches era 5 | 85–97% | 93.7% |
| Mixed bot sees the long finale | 80–95% | 91.5% |
| Where the country ends up is unchanged: mixed Ascent | 15–30% | 21.2% |
| Where the country ends up is unchanged: greedy Decay | ≥ 70% | 75.7% |
| Decay is the hardest place to spend it (mixed, finishing from era 4) | ≥ 3 points under Ascent | 92.8% against 98.4% |
| The same for careless play (random) | ≥ 20 points under Ascent | 5.9% against 49.5% |

A harness test holds these on 1,500 runs per bot, and `npm run simulate -- --long` prints them.

**Links, saves and the daily:**
- **A long reign's run code is format 2,** with the era count as a seventh part:
  `2.<seed>.L.<crisis~trait~flaw>.-.-.5`. An ordinary run's code is the same six-part format
  1 as before, so every link sent since phase 11 still opens. A long reign's link does not
  open on an older version, which could not play it, and that version says it cannot
  reproduce the run.
- **Run saves go to v11.** Every run saved before is an ordinary one, and so is the first road
  a second road holds.
- **A challenge carries a long reign too** (up to 175 cards), and the receiver's game replays
  it exactly. The daily stays three eras.
- **A playtest record takes a long reign's code.** Its reader accepted only format 1 and would
  have refused a tester's whole file for one long reign in it.

**Done when, checked:**
- **Eras 4 and 5 pass the validator's minimum cards per cell.** Each of their twelve cells
  holds 69–74 cards, against the validator's default of 31 and CI's gate of 25. The validator
  now checks all five eras. The deck-depth test (every cell more than twice the cooldown)
  covers them too. None of 15,000 long reigns, by three bots, needed a relaxed draw.
- **A mixed bot reaches era 5 in a share set during the phase:** set at 85–97%, measured at
  93.7%.
- **Every section 8 target for three-era runs is unchanged:** identical, above.

**Also checked:**
- The unit suite is 541 tests and the browser suite 40. The new audit chooses the long reign
  on the menu, jumps to the fourth era and ends five centuries on, in each direction at
  360×640, checking contrast and fit.
- Twenty mutations of the new logic were each caught by a test. One of them showed that a
  test could hang rather than fail: it searched for a long finale forever. It now gives up
  after fifty runs.
- The bundle grew by 21 KB gzipped, nearly all of it the cards and names.

**Yours:**
- **The cards and names are drafts.** The 187 cards and 99 long-view names were written to
  the deck's rules and checked, but not edited by you. Five of era 5's cards are about a
  religion of some kind, which may be one theme too many.
- **Difficulty for people is unknown.** Competent bots finish 91.5% of long reigns; careless
  play almost never survives Decay. The era rules were set by how they read, since the bots
  offset any setting.
- **Repetition.** A long reign draws about 57 of the 187 new cards. By the second long reign
  48% of them have been seen before, by the third 68% and by the fourth 81% (median of 20
  players, mixed bot). More cards for eras 4 and 5 are the fix once people play it.
- **The lock.** Eras 4 and 5 cannot change where the country is going, as 5.2 has it. If
  playtests show that makes them feel settled, it is one config value, `bandLockAfterEra`.
- **Everyone sees the new totals.** The codex counts 26 endings, 297 history names and 30
  epilogues for every player, including those who have not opened the long reign.
- **The store listing's numbers are updated** (1,053 cards, 26 endings, 297 names). Its copy
  still says "for three eras". Whether it mentions the long reign is your wording.
- **Most players get it straight away.** The first finale opens it, and every profile that
  has already reached one has it at once.

<details><summary>Original entry</summary>

**Evidence.**
- Two era names are written and never shown: *Two centuries on* and *Five centuries on*.
  No card belongs to era 4 or 5.
- A competent player (the mixed bot) finishes 96% of runs at card 105. The game ends just as
  they have learned it.
- The premise, that the bill comes later, has its largest canvas two centuries on.

**Do.** An optional long reign, unlocked by finales:

- eras 4 and 5, each with a rule of its own, as eras 2 and 3 have;
- about 70 cards each;
- their own finales and epilogues, and history names for the long view.

Balance it with its own harness targets. It must not move the three-era ones.

**Done when** eras 4 and 5 pass the validator's minimum cards per cell, a mixed bot reaches
era 5 in a share set during the phase, and every section 8 target for three-era runs is
unchanged.

</details>

---

## Considered, and not proposed

- **The saint problem** (ROADMAP). The saint bot takes the side with more drift whatever it
  costs, so it dies by definition, at a median of 19 cards. The fair test is the mixed bot,
  which plays the same line but steps in when a meter is in danger. It finishes 96% of runs.
- **Difficulty.** Competent bots finish 96–99% of runs, which would make the game too easy,
  except that the bots see exact numbers. Decide once phase 31 has human runs to go on.
- **Performance.** At 6× CPU throttling the first screen is up in 0.45s and a card commits
  in 0.33s, 0.26s of which is the animation. There are no long tasks.
- **A stats page.** Nearly everything the profile records is already on the codex screen.
- **A voice pass as a measured item.** The writing is not formulaic: the most common
  opening, "{advisor} has", starts 21 of 526 cards. The edit pass is still yours to do, but
  no number says where to start.
- **Music.** A drone that follows drift, as the cues already do, would be easy in the same
  synth. Nothing measured says its absence costs anything. Revisit with playtest records.
