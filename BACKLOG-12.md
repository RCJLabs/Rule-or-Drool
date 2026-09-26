# Backlog, round twelve: ten ways to enhance the game

Round eleven (BACKLOG-11.md) is phases 66–73: v0.74.0 to v0.81.0. Its ideas 4 and 10, idea 9's
choosing half and idea 8's repetition half are left, all waiting on people's runs. BACKLOG-2's
phase 17, getting the game onto Play, still waits on decisions only the owner can make.

You asked for ten new features, phases or items to enhance the game. Round eleven was held to the
game as it is; this one is not. Some ideas here add content and some add modes. Each says:
- what it is;
- what the audit found that points to it;
- a rough cost, and the risk;
- whether it changes what is dealt (the deck), which decides whether it can be built while people
  are playing for the closed test;
- what to measure before building it.

Numbers are measured, from bots, on v0.80.0–v0.81.0, unless a line says otherwise. How people
will play any of it is a guess until people's runs come in.

## What the audit measured

**How much of the deck a player meets.** 20 profiles of 30 runs for each of two bots:

| | After 10 runs | After 20 | After 30 |
|---|---|---|---|
| Distinct cards met, of 1,816 (informed) | 689 | 1,002 | 1,164 |
| Distinct cards met (eyes) | 678 | 967 | 1,116 |

| Share of a run's cards never met before | Run 1 | Run 5 | Run 10 | Run 20 | Run 30 |
|---|---|---|---|---|---|
| Informed | 100% | 65% | 44% | 24% | 12% |
| Eyes | 100% | 63% | 43% | 21% | 11% |

- By the twentieth run three cards in four are ones the player has seen. The history names carry
  the novelty after that (a new one in 65–89% of runs, BACKLOG-11); the cards do not.
- 251 cards are dealt only in the fourth and fifth eras, which a run of three never reaches; 433
  wait on a condition; each party has about 390 of its own.

**What a setup changes.** 31 crises, traits and flaws. Each crisis sets a flag that one card
reads; each flaw, one or two; the eleven traits set none. A setup moves the starting meters and
the odds of some stories, and changes almost nothing the run says to the player.

**Who the cabinet are.** Cards are written for the eight seats (the chief, the treasurer, the
judge and so on: 159–286 cards each). The 30 people who fill them are named, drawn and have
traits, and have 0–2 cards each in their own voice.

**How hard it is.** 1,000 runs a bot, with three settings a harder mode could turn:

| | Informed: finale, Ascent | Mixed | Eyes |
|---|---|---|---|
| As it is | 97.6%, 24.7% | 98.2%, 12.1% | 96.9%, 63.5% |
| Meters start at 42 | 99.1%, 18.7% | 98.7%, 9.7% | 97.4%, 60.5% |
| Every meter 25% more volatile | 96.7%, 12.9% | 96.2%, 7.1% | 88.1%, 40.3% |
| Honest count needs 4 more | 97.6%, 19.7% | 98.3%, 9.5% | 96.2%, 57.5% |

- Careful play survives whatever is turned: the difficulty is in the band. The eyes bot, which
  plays from what the screen shows, reaches the Ascent in two runs of three.

**How long a run is.** A run of three eras is 105 cards, a long reign 175. The first term, 35
cards, is offered only until a profile's first finale; after that the shortest run is 105 cards.
How long a card takes a person is what the recorder measures, and it has no records yet.

**Other checks.** A whole run replays in 11–17 ms on the audit machine. The profile keeps the last
12 runs. The game is 355 KB gzipped (content 218 KB, code 137 KB), which is not worth a phase.

## 1. A short term, any time — setup

**What.** Keep "A first term" on the menu after the first finale, as "A short term": one era, 35
cards, its own end, for a short sitting.

**Why.** The only run shorter than 105 cards disappears after the first finale. The game is played
on phones.

**Cost.** Small: the first term exists. **Risk.** Low. It should not be a way round anything a full
run is needed for, so contracts and the long reign stay with full runs, as they are now for a
first term. **Deck.** No. **Measure first.** Seconds per card from the records: if a run of 105 is
under ten minutes for people, this matters less.

## 2. The shape of your rule — end screen

**What.** A small chart on the end screen: each meter's fill and the direction the country went,
card by card, the eras marked and the timeline's moments as dots. No numbers, as the play screen.
The same shape can go on the share card.

**Why.** The end screen is where a player asks what went wrong, and by then the meters are gone:
the timeline lists moments in words and the cause names one card. The run can be replayed card by
card (11–17 ms for a whole run), so nothing new needs keeping.

**Cost.** Small to medium. **Risk.** It shows after the run the direction the play screen only
hints at, which could teach the look faster than intended; that is arguably the point. **Deck.**
No. **Measure first.** Replay time on a slow phone; fit at 360 px.

## 3. A chronicle of your reigns — meta

**What.** A page in the codex that tells every run the profile has played, in order, as the
country's history: each reign's name, how it went and ended, the line it belonged to, what it
left. A few lines on how the player rules: runs, bands reached, votes left to the count, promises
kept.

**Why.** The codex says what has been collected, not in what order or by whom; the line of reigns
shows only the line being played. The profile keeps its last 12 runs, a record of about 200 bytes
each.

**Cost.** Small to medium: a profile save version, a longer history, a page. **Risk.** Low; the
habits lines should say what the player did, not grade it. **Deck.** No. **Measure first.** Storage
for a profile of 1,000 runs (about 200 KB).

## 4. A week's scenario — daily and contracts

**What.** One run for everyone each week: a fixed seed, setup and promise, and a goal ("win the
office back honestly", "finish with the Unions over sixty"). One try counts; the result is a line
to share, as the daily's is.

**Why.** The daily gives everyone the same run and no goal; the contracts give goals and no shared
run. A group can compare a daily's end but not whether they did the same hard thing.

**Cost.** Medium: a weekly deal, goals from the contracts' grammar, a page and a share line.
**Risk.** Goals the bots find easy may be hard for people, and the other way. **Deck.** No.
**Measure first.** Each candidate goal's success rate for the informed voter and the eyes bot on
its week's seed: between a fifth and a half.

## 5. Music that follows the look — sound

**What.** A quiet score made in the browser, as the game's other sounds are, that shifts with the
look: brighter as the country climbs, sourer as it decays, a change at each era.

**Why.** The look is the only sign of drift, and it changes 14–15 times in a careful run
(round eleven's audit). A second sense for it helps the players who stop reading colour. The game
already synthesises its cues.

**Cost.** Medium. **Risk.** Taste, and battery on a phone. Off by default, with its own switch.
**Deck.** No. **Measure first.** Nothing a bot can measure; ask testers.

## 6. Harder terms — difficulty

**What.** After a run in the Ascent, optional terms to take a run on, one more at each step: more
volatile meters, a higher bar for an honest count, a stronger rival, a worse crisis, a promise
required. The codex and the share line say the step.

**Why.** Careful play reaches a finale in 97–98% of runs, and the harder settings measured barely
change that: they change how often it reaches the Ascent. If people play as the eyes bot does,
two runs in three reach the Ascent already, and there is nothing left to climb.

**Cost.** Medium. **Risk.** Each step splits comparisons: a daily, a challenge and a playtest
record must say their step. **Deck.** A run on a step deals under its own rules; a run on none is
unchanged. **Measure first.** People's Ascent rate. Then each step's effect, aiming at a steady
fall in the Ascent from step to step with survival held.

## 7. A setup you can feel — content

**What.** Four or five cards for each crisis, trait and flaw, dealt only in runs that have it: the
recession's bread queues, the technocrat's spreadsheets, the vain leader's portraits.

**Why.** A setup changes the starting meters and the odds of a few stories, and one card at most
reads it. By the twentieth run three cards in four are ones the player has met; a setup that says
something new each time it comes would freshen later runs, and it is what idea 9 of round eleven
asked of the setup.

**Cost.** Large: about 130 cards through the validator, the voice report and the balance.
**Risk.** Balance: cards that lean one way per setup move each setup's Ascent, which already runs
from 11% to 40%. **Deck.** Yes. **Measure first.** Each setup's Ascent for the informed voter
before and after, held inside today's spread.

## 8. People, not seats — cabinet

**What.** Each of the 30 people in the cabinet gets a short thread of their own, three or four
cards dealt only while they hold their seat: the chief's memoir, the general's nephew, the spin
doctor's other client. Firing or losing one ends their thread.

**Why.** The cabinet is chosen, appointed, poached and fired, and the people in it speak the seat's
lines: 0–2 cards each are theirs. Who is in the room changes the traits and not the talk.

**Cost.** Large: about 100 cards. **Risk.** Threads for people rarely kept long would go unseen:
the most-served adviser was in the cabinet in 55% of the mixed bot's runs. **Deck.** Yes.
**Measure first.** Cards each person is in the cabinet for, per run, so a thread fits its person.

## 9. An emergency mid-run — rules

**What.** A crisis that arrives in the second or third era, as the setup's crisis arrives in the
first: announced at the era's change, with its own cards and a rule for a stretch (votes
postponed, the treasury halved, a curfew).

**Why.** Every crisis is inherited at the start. The eras after the first differ in pace, not in
what happens, and they are where the repeated cards pile up.

**Cost.** Medium to large: an engine rule, content and balance. **Risk.** It moves every harness
target, and the long reign's. **Deck.** Yes. **Measure first.** How often a careful run is in
danger in eras two and three now, so an emergency makes them harder without making them random.

## 10. Rival kinds — the rival

**What.** Three kinds of rival, one dealt per run and named in the cabinet: the populist, who courts
the groups; the technocrat, who waits for your mistakes; the strongman, who calls for order. Each
has its own moves and voice.

**Why.** The rival plays (BACKLOG-10 phase 65) with one set of moves. When last measured, before
it played (BACKLOG-3 phase 24), it reached its top rung at about one competent election in eleven;
in most runs it is a name more than a person. Not re-measured for this audit.

**Cost.** Medium to large: engine, about 40 cards, balance. **Risk.** A stronger rival costs the
Ascent, as phase 70 measured for opposition. **Deck.** Yes. **Measure first.** The rival's moves per
run and its top rung, for each kind, beside the informed voter's Ascent.

## My order

1. **The shape of your rule (2), a short term (1) and the chronicle (3).** Small, for every
   player, and none changes the deal: they can be built while the closed test runs.
2. **A week's scenario (4) and the music (5).** Nothing dealt changes; each needs a design pass
   and a question for testers.
3. **After the closed test,** the content: a setup you can feel (7) and people, not seats (8).
   Together they answer the freshness numbers above.
4. **Harder terms (6),** once the records say which bot people play like.
5. **An emergency mid-run (9) and rival kinds (10),** the largest, one at a time.

**The closed test.** Ideas 1–5 change no deal. Ideas 7–10 do, and would split the records if they
shipped during it; idea 6 does only for runs taken on a step.

## Also considered

- **Round eleven's leftovers:** the rival hearing a broken promise, a run taking over reading how
  the last one ended, contracts that know the rival (idea 10), and the Institutions ceiling (idea
  4). They are still there, waiting on people's runs.
- **A prompt to rate the game on Play,** after a tenth run, in the Play app only. It helps the
  listing more than the game, and waits for the game to be on Play.
- **A line after each choice** from whoever it moved most. The small phone has no room for it
  under the longest cards (BACKLOG-10 phase 64 measured the room).
- **Translations.** 1,816 cards and every screen: a project of its own.
- **Leaderboards.** A static site has nowhere to keep them; the challenge link and the daily's
  share line are the game's way of comparing.
- **Loading.** 355 KB gzipped is not slow enough to be worth a phase.

## Decisions for you

1. **Which of these become phases,** and in what order. The default is the order above.
2. **Whether anything that changes the deal waits for the closed test.** The default is yes: ideas
   7–10 wait, and idea 6 waits for people's Ascent rate.
3. **Whether the chart (2) shows direction,** which the play screen only hints at. The default is
   yes: after the run, it teaches the look rather than replacing it.

## Phase 74. The shape of your rule (idea 2) — *done; the share card is phase 75*

**Shipped in v0.82.0.** Nothing is dealt differently: the deck is still c8agx015, and records
from v0.81.0 compare. No save changes: nothing new is kept.

- **Where.** Under "How it went" on the end screen, above the moments.
- **What.**
  - A thin line for each meter, card by card, over its whole range. Danger is banded where the
    meters bar draws it: a group's at the bottom, and the state's at both ends, only while in
    office. The line turns the danger colour while the meter was in danger, as the meters bar
    fills it.
  - A strip for the direction, against its middle. The Ascent's side and Decay's are washed from
    their band lines and named at the edge.
  - Hairlines at the eras, named under the plots, and a dot for each decision and each broken
    promise in the timeline.
- **How it is read.** It is a slider along the run: touch or drag along it, or use the arrow
  keys (Shift for five cards, Page Up and Down for ten, Home and End). It says the card in the
  words the meters are read in, "Card 40, era 2: Movement about half · … · Money in danger, too
  low · … · heading for the Ascent.", and names a decision or a broken promise within two cards
  of it. A screen reader hears the same words as the slider's value.
- **The table.** "As a table" says where each era left each meter and the direction. Five eras
  are wider than a small phone: the table scrolls across under the meters' names, and its edge
  fades while there is more.
- **No numbers.** The meters are read in words only. The only digits are card and era numbers,
  as in the timeline.
- **A long reign.** Its band is locked after the third era and drift goes on moving under it.
  From there the line is held inside the band the reign ends in, as its end is drawn (BACKLOG-11
  phase 72).
- **How it is made.** A run is its seed, its setup and its choices, dealt again card by card from
  them: the same replay the way back into a run uses (BACKLOG-5 phase 34), and now the one test
  for both. A run whose record does not deal it again has no chart and no way back: one saved
  before choices were kept, or dealt differently by an update.
- **Direction is shown**, the default of decision 3 below: after the run it teaches the look
  rather than replacing it. It is one row to take away if you decide otherwise.

**Measured.**

- All 160 bot runs tried (four bots, 40 seeds each) are dealt again exactly, and each has a chart.
- The replay and the points for a whole run take 5.6 ms (median) and 14.9 ms at most, in node on
  the audit machine.
- The end screen appeared as fast as before. Timed in Chromium at 360×640, from the last choice
  to the end screen, median of seven:

  | | v0.81.0 | v0.82.0, with the chart |
  |---|---|---|
  | Full speed | 63 ms | 63 ms |
  | CPU slowed six times | 406 ms | 408 ms |

  The chart's replay is the one the end screen already made to offer the way back; drawing it
  costs nothing measurable.
- It fits a 360×640 phone in the Ascent, Decay and Muddle looks, read, as a table, and by key
  and pointer, and passes the contrast audit. The direction strip's colours were checked with the
  palette validator: the light gold is 2.1:1 on the Muddle's paper, so the strip names its sides
  and the table says the same in words.

**Caveats.**

- The share card did not carry the shape: phase 75 puts the direction on it.
- It makes the end screen 465 px longer on a 360 px phone (2,445 to 2,910), most of a small
  phone's screen. If testers skip it, it can fold behind a button.
- A meter's whole range is 34 px high, so one card's move of a few points is under 2 px. The chart
  shows where a run turned, not each card; the words give each card.
- In a long reign the line runs flat along the band's edge wherever drift left the band after the
  lock. The play screen's look followed drift there, so a player may remember a look the chart
  does not show for those cards.
- The bots keep their meters near half, so their charts are quiet. Whether people's are, and
  whether people touch the chart, is for the closed test. The tester brief's third question now
  asks about it.

## Phase 75. The shape on the share card (idea 2, the rest) — *done*

**Shipped in v0.83.0.** Nothing is dealt differently: the deck is still c8agx015. No save changes.

- **What.** A strip under the card's picture carries the run's direction, card by card, as the
  end screen's direction row draws it:
  - the Ascent's side and Decay's washed from their band lines and named at the left;
  - the middle dashed and the eras as hairlines;
  - one white line, and a dot where the run ended.
  No numbers. The six meters stay on the end screen: at a chat preview's size they would be
  noise.
- **Size.** The card grows from 1200×720 to 1200×852. The picture's fade now ends in the strip's
  ground, so there is no seam between them. A run whose record does not deal it again has no
  shape, and its card is the picture alone, as before.
- **How.** The points are the end screen's replay (phase 74); nothing is replayed again to
  share. Where the strip falls in the card's pixels is a function of its own, tested apart from
  the canvas that draws it.

**Measured.**

- The browser audit shares a run played to its end through a share sheet that takes files, and
  reads the picture back. It is 1200×852, white where the geometry puts the run's line at four
  cards, and dark on the Decay side where the run never went. A run moved to its end by
  rewriting its save shares a 1200×720 card. Taking the line out of the drawing fails the audit.
- At 400 px wide, about the size of a picture in a chat, the plot is about 30 px tall. A rise into
  the Ascent, a slide into Decay and a late fall all read; the words ASCENT and DECAY do not, and
  the gold and violet carry them.

**Caveats.**

- Not checked: how chat apps crop a taller picture in their previews. One that crops to a
  fixed shape could hide the strip until the picture is opened.
- The strip shows direction only. A run ended by a meter, a bankruptcy say, shows its ending in
  the words above it, not in the strip.
- The fade is a shade darker behind the facts line on a card with a strip.

## Phase 76. A chronicle of your reigns (idea 3) — *done*

**Shipped in v0.84.0.** Nothing is dealt differently: the deck is still c8agx015. The profile's
save version goes from 9 to 10.

- **What.** The codex's first section, which was "Your administrations", is now *The chronicle*.
  - *How you have ruled*, as a label and a count, never a grade: the reigns and the longest;
    where they went, to the Ascent, the Muddle or Decay; how they ended, seen through, by choice
    or fallen apart; votes left to the count, of those held, and how many of those were lost;
    promises kept, of those made.
  - *The reigns, the latest first*, twenty at a time. Each is numbered as the run it was and
    carries its history name, and a mark for a second road, a line's later reign, and a long
    reign or first term. Then the party, the cards and the band; the ending and the rival; its
    promises; and what it left. What it left is the three things history ranks biggest, and a
    count of the rest: a reign's full list ran to eight lines on a phone.
- **What is kept.** Every run from now on, oldest first, the last thousand. The last twelve are
  still kept as they ended, for the line of reigns to take over from.
- **A profile from before.** Its chronicle starts with the twelve runs its history kept, numbered
  from its count, and the list ends "The chronicle begins at reign 29" for a forty-run profile.
  What each of those left is what it ended with, less what the run before it ended with where it
  took that over. Their votes were never kept, so the vote line counts only the reigns since and
  says so: "in the last 3 reigns".
- **Read with care.** A profile can arrive in a link anyone can send. Each entry is checked:
  in order and one to a run, none past the runs the profile says it finished. Legacies the game
  could not have written are dropped, and so is a vote count with more lost than left to the
  count.

**Measured.**

| A profile of bot runs | JSON | Move my progress code |
|---|---|---|
| 40 runs, before | 11.0 KB | 3.7 KB |
| 40 runs, with the chronicle | 24.4 KB | 5.2 KB |
| 1,000 runs, before | 18.7 KB | 5.7 KB |
| 1,000 runs, with the chronicle | 321.7 KB | 36.4 KB |
| 1,000 runs, the chronicle packed as arrays | 216.1 KB | 33.4 KB |

- Compression takes back nearly all that packing saves, so the entries keep readable names.
- Saving the thousand-reign profile, written and read back: 4.2 ms.
- A thousand reigns unpack to about 340 KB, inside the 1 MB a code may unpack to.
- The browser audit reads and fits a 360×640 phone with twenty-five reigns, twenty shown and then
  all.

**Caveats.**

- The cap: the thousand-and-first reign drops the first, and the chronicle then begins at reign 2.
  Its counts are of the reigns it holds; the codex's other tallies still count every run.
- A profile from before has twelve reigns of chronicle whatever its count; the rest were never
  written down.
- The code to move a profile grows about 38 bytes a reign: 5.2 KB at forty, 36 KB at a thousand.
  Pasting it works. Not checked: which chat apps cut a link that long; the file is the sure way
  for a long profile.
- Whether players read the chronicle, or play differently for its counts, is for testers.

## Phase 77. A short term, any time (idea 1) — *done*

**Shipped in v0.85.0.** Nothing is dealt differently: the deck is still c8agx015. No save format
changes.

- **What.** Once a profile has seen a run through, the menu has *Take a short term* under *Take
  office*: one era, 35 cards, one vote, ending in the first term's three ends. A line under the
  button says so, and that the week's contracts are kept only in full reigns.
- **Where it sits.** The first build put it in the reign picker, as a third choice. That was
  measured and moved:

  | Take office ends at, px | Without it | In the picker |
  |---|---|---|
  | 390×844, past the first term | 739 | 928, below the fold |
  | 412×915, past the first term | 730 | 920, below the fold |
  | 390×844, long reign open | 977 | 1,067 |

  Each row is one page load, measured with the choice and with it hidden. Without the long reign
  there was no picker past the first term, so the choice added all of it: 175–193 px. Measured
  the same way under the button, Take office moves 0 px; the button and its line take 83 px
  below it.
- **What it counts for.** What a first term counts for:
  - its end is not one the codex collects, for a veteran either;
  - it keeps no contracts: a clean era's contract would otherwise be kept in 35 cards rather
    than 105, and a test pins that;
  - it does not open the long reign, which takes a finale.

  It counts as a run finished, as a run lost early always has, so it opens no shortcut: the
  objectives that count runs or promises count runs that ended any way. A line's next reign can
  take over from it, and it can take over.
- **What it is called.** "Short term", for any run of one era: in the chronicle, the share line
  and the saved run's Continue button. A first term was "First term" there before. A challenge
  link to a one-era run offers "A short term: one era and one vote."
- **Its end.** "That was one term. A full reign is three eras, and the next run you start is one"
  now shows only at the end of the run that ends a profile's first terms. Before, it showed at the
  end of any one-era run, which a veteran's short term would have been.

**Caveats.**

- The backlog's measure-first was seconds per card from the recorder, to say whether a run of
  105 cards is too long for a sitting. There are still no records, so whether anyone wants the
  short term is a guess.
- New players' first terms are called "Short term" in the chronicle and on the share line. Their
  menu still says "A first term".
- Under Take office, the short term is below the fold on a 360×640 phone, as Take office already
  is.
