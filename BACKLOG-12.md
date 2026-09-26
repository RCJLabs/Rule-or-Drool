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

## Phase 74. The shape of your rule (idea 2) — *done in part*

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

- The share card does not carry the shape yet: idea 2's second half.
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
