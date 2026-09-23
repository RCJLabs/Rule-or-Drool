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

## Phase 34. Take the other road — *queued*

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

## Phase 35. More crises, more faces — *queued*

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

## Phase 36. The deck by run five — *queued*

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

**Done when** a player's tenth run is under 75% cards already seen, measured the same way.

## Phase 37. Challenge a friend — *queued*

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

## Phase 38. The daily, every day — *queued*

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

## Phase 39. Eras four and five — *queued*

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
