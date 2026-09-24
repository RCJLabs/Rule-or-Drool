# Backlog, round seven

Round six (BACKLOG-6.md) is phases 40–44, all done, with a fix after it in v0.56.1.
BACKLOG-2's phase 17, getting the game onto Play, is still prepared and waiting on decisions
only the owner can make. This round comes from a fresh audit of the shipped game. It found
little that is broken. What it found is that every number the game is tuned on comes from a
bot, and that the bots disagree most about the choice that moves drift most: the vote. These
are phases 45–48.

Same rule as every round: each evidence line is measured against the shipped game, at v0.56.1,
not estimated. Where a number comes from a bot, the bot is named. "A player" below is the mixed
bot playing runs in a row with its profile carried forward, unlocks and all:
- the audit's players: 60 of them, 50 runs each, from seed 700,000, with a long reign every
  fourth run once it is open;
- the repeat measures: round six's 40 players from seed 300,000.

Status: **doing** · **queued** · **done**

The audit these were drawn from, at v0.56.1 (1,511 cards, 22 stories, 16 questions, 55
endings, 585 history names, 23 objectives):

| | |
|---|---|
| Endings a player has found by run 10 / 20 / 50 | 5 / 6 / 8 of 55 |
| ... a player who takes an ending they have not found a quarter of the times one is offered | 7 / 12 / 21 |
| Story cards already met, at a player's 10th / 20th run | **82.4% / 100%** (ordinary cards 63.8% / 81.9%, question cards 37.5% / 66.7%) |
| Story outcomes seen by run 10 / 20 / 50 | 37 / 50 / 62 of 91 |
| Objectives most players have not done by run 50 | 7 of 23, each one asking for something done on purpose |
| The look, in the mixed bot's first runs (2,000) | changes 27 times a run (median), and **53% of the changes are undone within three cards** (greedy: 24 changes, 62% undone) |
| Elections, mixed bot (20,000 runs) | 2.93 a run, 65.3% cheated; **two in three of those cheats were votes an honest vote would have won** |
| The same bot, except that it never cheats a vote it can win | Ascent **39.4%** (against 19.2%), Decay 10.0% (against 24.3%) |
| What an election card says about an honest vote's chances | nothing. The cabinet, one tap away, says so when you would lose |
| Long reigns: era 4–5 cards already met, at the 2nd / 3rd / 5th / 10th long reign | 26% / 57% / 79% / 94% (30 players) |
| The temptations | on 82.5% of ordinary cards, the side that keeps the meters calmest is the tempting one |
| Cards you have edited, as git sees it | **none**. All 49 commits that touch the content are mine, and 957 cards were handed over as drafts in phases 36–44 |
| Phrases in the most cards | "now" 191, "nobody" 145, "would like" 142. "Two centuries on" opens 63 of era 4's 155 cards |
| Human play recorded | **none** |
| On a 6×-slowed CPU | first screen 578 ms, first card 239 ms, a card to the next 386 ms |

## Three things this round has to get right

### 1. Bots measure bots

Every number in this file is a bot's. The audit found where the bots disagree most: whether
to cheat an election the player would have won honestly. That one habit is worth 20 points
of Ascent: 19.2% for the mixed bot, 39.4% for the same bot when it never cheats a vote it can
win.
- **It is not about information.** A bot's preview includes the count, so the mixed bot
  always knows whether an honest vote wins.
- **It cheats anyway when a meter is in danger.** The cheat is easier on the meters, and
  every honest vote costs Money or Order, most of them both.

Nobody knows yet which habit people have. So no phase here retunes the game for people. The
one decision that needs people (3, below) waits for them.

### 2. The rules from round six hold

- No card scores a policy (TRANSFER §2, locked).
- The country stays fictional, with no real slogans (§3).
- The game stays a binary swiper, and drift stays hidden.
- The four topics you left off stay off.
- The voice pass (phase 47) changes words and never numbers, so it cannot move balance.

### 3. The look is still the only readout

Drift is hidden, and the frame's look is how a player feels it. TRANSFER §9 asks for early
signs, so that hidden drift does not feel unfair. Settling the look (phase 45) must not delay
them: a look is still entered on the card where drift crosses its line, and only leaving it
waits. It must not lag for long either, so the margin is capped by how many cards show a
look that drift has already left.

## Decisions for you

The defaults below are in force unless you change them.

1. **The closed test, as the first human playtest.**
   - **Why it matters.** Play makes a new personal developer account run one before
     launch: 12 testers for 14 days (`twa/STORE.md`). With "Keep a record of my runs" on,
     it is the first human data this game has.
   - **Only you can** open the account, find the testers, and make the calls STORE.md lists:
     asset links or a custom domain, and the policy check.
   - **Default:** as soon as you can. Nothing in this round waits on it except decision 3.
2. **The edit pass.**
   - **The choice:** (a) you edit everything; (b) I first cut the measured tics, text only,
     and you edit after; (c) the cards launch as they are.
   - **Default:** (b), which is phase 47. *Done: `VOICE-PASS.md` lists my 281 rewrites for
     your edit.*
3. **Which player the balance is for.**
   - **Default:** the mixed bot, as now, until the closed test shows how people vote.
   - **If people rarely cheat a vote they can win,** the game is easier for them than the
     harness says, nearer 39% Ascent than 19%. The targets should then move to a bot that
     votes the way they do.
   - **It cannot be tuned for both now.** No single change to the honest vote's drift keeps
     both habits inside 15–30% ("Considered, and not proposed").
4. **Whether the election card says how the vote stands.**
   - **Today** the card does not say whether an honest vote would win. The cabinet does, and
     only when you would lose.
   - **Putting it on the card is small work.** It would likely move people toward the second
     habit (speculation), so it belongs with decision 3.
   - **Default:** not yet.

## Recommended order

- **45 first.** It is small, it shows on every card, and it cannot move balance.
- **46 before the first records come in.** The report re-reads old records, so it can also
  come after them.
- **47 before 48,** so the new stories are written against the voice check.
- **48 last.** It is the biggest.

Taken together: about 75 new cards and 22 endings, plus the text of about 250 existing cards
if phase 47's first pass is chosen. That is estimated from the copies and the phrase counts
below. Each phase stands on its own, so the round can stop after any of them.

---

## Phase 45. The look settles — *done*

**Shipped.** A look is entered on the card drift crosses its line, as before, and left only
once drift is 4 back past that line. The look lives in the run's state. The frame, the end
screen, the sound and the screen reader all read it.

**Measured** as the audit measured it: the mixed bot's first runs, 2,000 from seed 900,000,
on alternating sides. The real engine gives exactly what the model in the original entry
gave.

| | Wanted | v0.56.1 | Now |
|---|---|---|---|
| Changes of look a run (median) | – | 27 | **15** |
| Changes undone within three cards | ≤ 25% | 53.1% | **24.0%** |
| Cards in a look drift alone has already left | ≤ 12% | – | **10.9%** |
| Cards in a look shallower than drift alone implies | 0 | 0 | **0** |

- **The other seed sets agree.** 2,000 runs from 100,000 give 16 changes, 24.3% undone and
  10.8% held. 2,000 from 500,000 give 16, 23.9% and 10.7%. The undone target has less than
  a point of room on every set.
- **The undone target is 27% since v0.59.1.** With so little room, a change to the deck
  could fail it by chance (phase 48's follow-up).
- **The other bots:**
  - greedy: 24 changes and 62.1% undone before, 12 and 33.0% now;
  - random: 9 and 51.2% before, 6 and 24.5% now;
  - saint: 3 changes, none undone, before and now. It only ever goes one way.
- **The screen reader hears it too.** A change of look is spoken with the card (BACKLOG-5
  phase 30), so a mixed run's look announcements fall from 27 to 15 as well.
- **What it costs.** One card in nine shows a look drift alone has left. It is never more
  than one step past drift, and only while drift is within 4 of that look's line.
- **Nothing else changed.** Every bot's runs are identical: the fingerprint of 1,000 seeded
  runs per bot, with no unlocks and with all of them, is `e2749e06faa8f4f1` over 547,608
  cards before and after (the whole final state, less the look). A test resolves every
  choice of 60 runs from a different look, and only the look differs.

**How it is built.**
- **The rule and the lines are the engine's.** The lines (8, 20, 36) moved from the UI to the
  engine's config as `lookAt`, beside `lookMargin`. `settleLook` is the rule. It is applied
  once, at the end of each choice, after every step that can move drift, including a
  decree's pull on a run with no elections.
- **The frame reads the run's look**, at the strength its drift gives. While a look is held,
  that is the faint end of it, never the other side's.
- **The run save is version 12.** A run saved before resumes in the look its drift implies,
  which is the look it was showing. So does the first road a second road holds.
- **The debug keys jump the look with the drift.** A nudge is not drift easing back, and the
  browser audit steps through the looks that way. The debug line says when the look is
  being held: "theme ascent1 (drift alone: muddle)".
- `npm run simulate` prints the three numbers, and a test holds them.

**Also checked:**
- The unit suite is 592 tests and the browser suite 42. `validate:mvp` is clean.
- The playtest record is unchanged. The look each card was read in follows from the drifts it
  records, which phase 46 can use.

**Yours:**
- **The margin is one number,** `lookMargin` in `src/engine/config.ts`. 3 would undo more
  (32%) and hold less (8.2%); 5 would undo less (19%) and hold more (13.6%). Changing it
  moves no balance.
- **Whether the flicker read as noise is still speculation.** No person has seen either
  version.
- **A run saved before this update** resumes as described above. Nothing else about old saves
  or run codes changes.

<details><summary>Original entry</summary>

**Why.**
- The frame's look is the only sign of drift a player gets: Muddle, three Decay looks and
  three Ascent looks. It follows drift card by card, with no memory. When drift wobbles
  around one of its lines, at 8, 20 and 36, the look flips back and forth.
- The mixed bot's first runs change look 27 times a run (median), and 53% of the changes are
  undone within three cards. Greedy: 62%.
- Speculation: a change that is undone reads as noise. It teaches a player to ignore the one
  readout drift has.

**What.** A look is entered as soon as drift crosses its line, and left only once drift is
back past that line by a margin. The table below is measured as a model of the frame: drift
as each card is shown, over the same 2,000 runs.

| Margin | Changes a run | Undone within three cards | Cards whose look differs from today's |
|---|---|---|---|
| 0 (today) | 27 | 53% | – |
| 2 | 21 | 41% | 5.4% |
| 3 | 18 | 32% | 8.2% |
| **4** | **15** | **24%** | **10.9%** |
| 5 | 14 | 19% | 13.6% |
| 6 | 13 | 15% | 16.3% |
| 8 | 11 | 10% | 21.7% |

- **Default margin: 4.**
- **The look lives in the run's state**, set as each choice resolves, so the frame, the end
  screen and the sound agree after a reload. The run save goes up one version, to 12. A run
  saved before the update opens in the look its drift implies.
- **Nothing else reads it.** The band a run ends in, the endings and every bot are
  unchanged.
- **The debug keys** the browser audit uses to step through the looks set the look as well
  as the drift.

**Targets.**
- Undone within three cards: at most 25% (mixed bot).
- Cards whose look differs from today's: at most 12%.
- Early signs keep their timing: a look is never entered later than today.
- The fingerprint of seeded runs is identical.

**Cost.** Small: an engine field, the frame, a save migration and tests.

</details>

---

## Phase 46. What the first testers can answer — *done*

**Shipped.** `npm run playtests` now answers the question this round turns on. Beside each bot
playing the same runs, it says:
- **where the country ended up:** Ascent, Muddle or Decay;
- **how people voted:** the share of votes cheated, how many of those an honest vote would
  have won, and how many of those were cast with a meter within 25 of its edge (where the
  mixed bot turns greedy);
- **the look each card was read in,** and how often it changed in a run.

The game does not change. Its build is byte for byte the one v0.57.0 deployed.

**How a person's run is read.** The record already held each run's code and every side taken,
so nothing the game records changed.
- The report rebuilds each finished run from those and walks it card by card.
- Every card dealt has to be the card the record says was shown. The meters and drift in
  front of it have to match, and the run has to end where the record ends.
- A run this version would deal differently is left out of the people's rows. The heading
  says how many runs were rebuilt, out of those finished.
- A bot's replay of the same code goes through the same walk, so both are read the same way.

**Checked against runs whose answers are known.** These are bot runs, recorded the way the game
records a person's. What was true at each card was worked out while they were played, not by
rebuilding.
- **Rebuilt,** every look and every vote comes back exactly as played. This was checked on
  mixed, greedy, random and saint runs.
- **Sent through the report as records,** a bot's runs give that bot's own rows: band for
  band, vote for vote and look for look (mixed and greedy).
- **A record that was changed is left out.** The cases tested are one card, one meter or the
  drift changed, another ending, a card missing, no ending, or a code that cannot be read.

A trial report on 30 of the mixed bot's runs, sent in as a person's, shows what the new table
separates:

| | Votes | Cheated | Of those, winnable | And a meter near its edge |
|---|---|---|---|---|
| "people" (the mixed bot's records) | 90 | 64.4% | 72.4% | 100% |
| mixed bot | 90 | 64.4% | 72.4% | 100% |
| greedy bot | 90 | 55.6% | 96.0% | 2.1% |
| random bot | 33 | 48.5% | 81.3% | 30.8% |

**The last column is the tell.** The mixed bot cheats a vote it would have won only with a
meter near its edge; the greedy bot does it with the meters calm. People who rarely cheat a
winnable vote are the audit's other bot, the one that never does. For them the game is easier
than the harness says (decision 3).

**Also checked:**
- The unit suite is 597 tests and the browser suite 42.
- The mixed bot's line is one function now (`nearAnEdge`), shared with the report. The bots'
  fingerprint is unchanged: `e2749e06faa8f4f1`.
- **STORE.md's closed-test section says three new things:** what the report answers, not to
  coach testers on elections, and to run the report on the version the records name.

**Yours:**
- **The closed test** (decision 1). The report is ready for its records.
- **Say nothing to testers about elections** beyond what the game says.
- **A record played before v0.57.0 still rebuilds,** since that update changed no deal. Its
  looks, though, are read as v0.57.0 shows them, settled. No such records exist.

<details><summary>Original entry</summary>

**Why.**
- No person has played a recorded run. The recorder (BACKLOG-5 phase 31) and
  `npm run playtests` are ready. The closed test Play requires is the natural first
  playtest (decision 1).
- The question with the most riding on it is how people vote (the first section).
- The report cannot answer it today. It shows survival, where runs end, time on a card and
  hesitation. It does not show the band runs end in, or how elections were voted.

**What.** Three additions to the report, for people and for each bot playing the same setups:
- **The band runs end in:** Ascent, Muddle or Decay.
- **Elections:**
  - the share cheated;
  - of those, the share an honest vote would have won;
  - whether a meter was in danger at the time.

  The report rebuilds each run from its code and recorded choices, as phase 34's replay
  does, so the record format already carries all of it. Nothing the game records changes.
- **The looks:** the share of cards seen in each.

A short note for testers goes in STORE.md's closed-test section: turn on the record, play,
and send it at the end.

**Targets.** The new lines are checked against runs whose answers are known: a bot's runs,
fed back through the report as records. The game does not change.

**Cost.** Small. The tests use made-up records, and `playtests/` stays out of git.

**The limit.** A record from an older version of the game may not rebuild exactly, since
its cards may have changed. The report says how many it could not rebuild.

</details>

---

## Phase 47. The voice check, and a first pass on the tics — *done*

**Shipped.**
- **`npm run voice`** lists the phrases the deck leans on, against their ceilings, and the
  cards carrying any phrase, by file.
- **A first pass by me** rewrote the text of 281 cards, text only. `VOICE-PASS.md` lists every
  change, old text beside new, for your edit.

| Phrase | Ceiling | v0.57.0 | Now |
|---|---|---|---|
| "would like" | 40 | 142 | **29** |
| "nobody" | 60 | 145 | **52** |
| "your century" | 20 | 60 | **17** |
| "Two centuries on", opening a card | 15 | 63 | **0** |

**Found on the way: 64 comebacks named the wrong century.**
- Phase 42's comebacks for the long reign are drawn in both of its eras. 63 of them opened
  "Two centuries on" and one "Two centuries after", which was wrong in the era headed "Five
  centuries on".
- All 64 now hold in either era. The heading says when it is, and the card says what came of
  the answer. Time words that fit both eras replace the ones that did not: "long ago", "for
  generations", "an ancestor" rather than "a great-grandmother".
- The validator now rejects a card that names one of those eras' spans and is drawn in the
  other (`era-span`). Run on the deck before the pass, it caught all 64. How long something
  has lasted ("not paid tax in two centuries") is not checked.

**How the rewrites were kept honest.**
- **Text only.** Every card's other fields hash the same before and after
  (`51a97c3a7528d1ee`), and the fingerprint of 8,000 seeded runs is unchanged
  (`e2749e06faa8f4f1`).
- **Every placeholder kept, and no text over 160 characters.** Two texts grew by 11
  characters; none grew by more.
- **No replacement became the new habit.** The first pass leaned on "want" and "ask", and a
  second pass varied 18 of them. Across the deck, "want" went from 146 cards to 159 and "ask"
  from 98 to 108. Against that, "would like" fell by 113 cards and "nobody" by 93. No other
  replacement is in more than eight new cards.
- **No rewrite brought a card closer to another.** This was checked on three-word phrases,
  against every card in the deck, before and after.
- **Kept where the phrase is the joke:**
  - "would like": the Donors' "in those words", the portrait's height, the merged lobby's "a
    word, or several";
  - "nobody": "endorsed nobody, which in this country means everybody", "Nobody watches the
    news";
  - "your century": "Your century has been cut, to general relief".

**The check.**
- **The ceilings are one list,** in `src/content/voice.ts`. `validate:mvp` warns when a phrase
  goes over its ceiling, and under --strict a warning fails the build, as every content
  rule's does. There is room under each now: 11, 8, 3 and 15 cards.
- **`npm run voice` also prints the 2–4-word phrases in the most cards,** so the next habit
  shows before it has a ceiling.

**Also checked:**
- The unit suite is 603 tests and the browser suite 42. The browser suite's fit test puts each
  side's longest cards on a small phone in every look. `validate:mvp` is clean.
- The store listing needs nothing: still 1,511 cards, and nothing new for the content rating.
- Run codes, saves, replays and the daily carry card ids, not text, so none of them changes.

**Yours:**
- **`VOICE-PASS.md`: 281 drafts to edit,** by file, each with the text it replaced.
- **The ceilings are my numbers.** Raise one on purpose.
- **"Now" has no ceiling.** It is in 191 cards, mostly as plain English, and is left to your
  edit.

<details><summary>Original entry</summary>

**Why.**
- **Git shows none of your edits.** All 49 commits that touch the content are mine, and 957
  cards were handed over in phases 36–44 as drafts for your edit. TRANSFER §10 ends every
  batch with that edit. Edits you have made outside the repository, if any, are not
  counted.
- **The drafts repeat themselves in ways that can be counted** (cards containing each, of
  1,511):
  - "now" 191, "nobody" 145, "would like" 142 ("would like to" 62);
  - "Two centuries on" opens 63 of era 4's 155 cards;
  - "your century" 60.

  They are spread over every era, not one batch.
- Speculation: a reader notices a phrase long before a percentage. The tenth "would like" is
  louder than the tenth repeated card.

**What.**
- **`npm run voice`** lists the phrases that recur across the deck, and the cards carrying
  each, grouped by file, so an edit pass can go straight to them. It reports and never fails
  the build. `validate:mvp` warns when a new batch pushes a phrase over its ceiling.
- **If you choose (b): a first pass by me, on the measured tics only.**
  - Text changes, numbers never. Every effect, drift, flag and link stays as it is, so the
    fingerprint of seeded runs is identical by construction, and a test holds it.
  - It is gated by `validate:mvp` and phase 44's near-duplicate check.
  - The pass lists every card it changed, for your review. Its rewrites are drafts too.

**Targets.** Cards containing:
- "would like": at most 40;
- "nobody": at most 60;
- "your century": at most 20.

"Two centuries on" opens at most 15 cards. The fingerprint is identical.

"Now" gets no ceiling. Most of its uses are plain English, so it is left to your edit.

**Cost.** The tool is small. The first pass rewrites the text of about 250 cards: what the
ceilings take out, less the cards that carry two of the phrases.

</details>

---

## Phase 48. Twenty-two more stories — *done*

**Shipped.** 22 new stories, drafts for your edit: 66 cards, 22 endings and 8 legacies, each
legacy with its history names. The deck has 1,577 cards, 44 stories and 77 endings.

| Story | Side | Turning point | Ending |
|---|---|---|---|
| The census and its new method | shared | Recount, then vote | *The Recount*, in good order |
| The flood and the new levee | shared | Cut the ribbon | *The Ribbon* |
| A foreign agent in your office | shared | Pay in policy | *The Asset* |
| The games, and their stadium | shared | Guarantee the profits | *The Games* |
| The currency, printed | shared | Pay the army in bread | *The Wheelbarrows* |
| The failed harvest and the grain reserve | shared | Put your name on it | *The Grain Barons* |
| The earthquake and its inspectors | shared | Resign over it | *The Inspectors*, in good order |
| The rigged lottery | shared | Draw her numbers | *The Numbers* |
| The heir to the abolished throne | shared | Sign it | *First Minister* |
| The international lender's terms | shared | Hand over to her | *The Published Terms*, in good order |
| The football captain | shared | Name him your heir | *The Captain* |
| The televised debate | shared | Send an empty chair | *The Empty Chair* |
| The blackout | shared | Declare the emergency | *The Saboteurs* |
| The republic's centenary | shared | Say you will go | *The Centenary*, in good order |
| The Unions' cooperative bank | Commons | Close the branches | *The People's Bank* |
| The youth wing's motion | Commons | Let the count stand | *The Next Generation*, in good order |
| The comedy at the national theatre | Commons | Say that it does | *The Last Act* |
| The crash at the junction | Commons | Resign, and mean it | *The Signal Report*, in good order |
| A Donor family's schools | Ledger | Let it write them | *The Foundation* |
| Honours for sale | Ledger | Sue the newspaper | *The Honours List* |
| The port on a 99-year lease | Ledger | Lease the airport | *The Leased Coast* |
| The veterans' forest | Ledger | Take the logs | *The Clear-Cut* |

- **Three cards each,** 66 in all, where the entry planned three or four and about 75. Each
  ending is on its story's last card, as phase 43 set. Six are ways to leave in good order,
  on the honest side. Across all 44 stories, 19 of 46 endings are on the honest side.
- **Eight stories leave a legacy,** as half of today's do:
  - the census was adjusted;
  - the stadium stands;
  - the money was printed;
  - the building code was enforced;
  - the crown came back;
  - the new levee held;
  - honours were sold;
  - the port was leased.

  Each has six titles, three long-view titles and three "after" lines, so the codex counts
  657 history names now, up from 585.
- **No card scores a policy.** Each choice turns on how something is done: who is told, who
  is paid, and who carries the blame. Two drafts came close, and were reframed:
  - After the blackout, taking the grid back into public hands became making the firm pay for
    its neglect.
  - The lender's last card became handing over to the minister it trusts, or signing and
    blaming the lender.

  The country stays fictional, and the four topics you left off stay off.
- **The shared stories speak of institutions, not blocs.** Each side's stories name its own:
  the Movement and the Unions, or the Faithful and the Donors.

**Measured** as the new test measures it: 200 players from seed 300,000, each playing their
runs in order with the mixed bot and their unlocks carried, the median at the run named.

| Story cards already met | Wanted | v0.58.0 | Now |
|---|---|---|---|
| A player's 10th run | ≤ 65% | 83.3% | **62.5%** |
| A player's 20th run | ≤ 85% | 100% | **83.3%** |

- **Another set of seeds agrees.** From 500,000 it reads 61.9% and 83.3%, where v0.58.0 read
  85.7% and 100%.
- **Why 200 players, not the audit's 40.** A run meets about ten story cards (the middle
  half meet 7 to 13). So each player's share is a coarse fraction such as 5/6 or 7/8, and
  the median is one player's share.
  - **The 40-player reading.** The audit's measure reads 62.5% at the tenth run, the same
    as 200 players. At the twentieth it reads 87.5%, over the line. Those 40 players are the
    first 40 of the 200, and their mean is 85.7%.
  - **The 200-player reading.** All 200 read 83.3% at the twentieth run, with a mean of
    82.6%. The 500,000 seeds give 83.3% and 82.3%.
  - **So the 40 were a high draw, not a miss,** as far as two larger samples can say. The
    margin is 1.7 points.
- **The copies predicted it.** The original entry's 22 copies gave 62.5% and 84.6% on the
  40-player measure.

**Two things were fixed before shipping.**
- **Eight new stories rarely started.** Their entry conditions were too narrow for the way a
  competent player keeps the meters. The blackout and the lottery started in 1.2% and 1.6% of
  runs, and the heir, the games, the lender, the foundation, the youth wing and the captain in
  3.6–8.2%.
  Their conditions were loosened. On 4,000 mixed-bot runs with nothing unlocked, the new
  stories now start in 6–22% of runs and the old ones in 3.5–24%. That leaves aside the
  referendum and the truth commission, which need an unlock.
- **Greedy play drifted less than before.** Greedy's ends in Decay fell from 77.4% to 72.5%,
  against a floor of 70%. Greedy never takes a choice that ends the run. On the 16 last
  cards whose ending is on the tempting side, it was handed the honest side and +4 to +6
  drift every time. Those honest sides now carry +3. Most honest choices in the deck carry +3
  to +5, and 94 carry less. Greedy is back to 73.8%.

**Everything else still holds,** as `npm run simulate` measures it: 10,000 runs a bot, the
repeats as the median of 40 players, and the look over 2,000 first runs.

| Target | Wanted | v0.58.0 | Now |
|---|---|---|---|
| Random: median run length | 40–60 cards | 44 | 44 |
| Random: most common ouster | ≤ 35% | bankruptcy 13.6% | bankruptcy 13.4% |
| Greedy: ends in Decay | ≥ 70% | 77.4% | 73.8% |
| Saint: ousted before era 2 | ≥ 60% | 100% | 100% |
| Mixed: reaches Ascent | 15–30% | 19.5% | 19.5% |
| A player's 10th run, all cards | ≤ 65% | 63.8% | 61.0% |
| ... its first era | ≤ 60% | 54.3% | 57.1% |
| A player's 20th run, all cards | ≤ 85% | 81.9% | 82.3% |
| The look: changes undone within three cards | ≤ 25% | 24.0% | 24.4% |

The long reign's targets, the questions' roads, the answers that come back, the endings
offered by choice and the history names all still pass their tests.

**Also checked:**
- The unit suite is 604 tests and the browser suite 42. `validate:mvp` is clean at 1,577
  cards, and the voice ceilings hold, since no new card uses a watched phrase.
- **Length.** No new card is longer than 148 characters, the longest story card before this
  phase. Drafts that ran longer were cut to fit.
- **Store listing.** It counts the new cards, stories, endings and history names, and its
  content-rating notes cover what the stories add. Among them are a train crash in which
  eleven people die, an earthquake that flattens three schools, and a rigged national lottery.
- The test holds the story repeats, and `npm run simulate` prints them.

**Yours:**
- **The 22 stories are drafts, in your voice, to edit.** Each is one file in
  `src/content/cards/arcs/`, named after it. Their endings are at the end of
  `src/content/endings.json`, and their history names are in `src/content/histories.json`.
- **Two numbers have little room,** as of v0.59.1. Era 1's tenth run is 2.9 points under its
  ceiling, and greedy's Decay is 2.4 points above its floor. If you change a story's effects
  or drift, run `npm run simulate`.
- **Old run codes and today's daily.** New stories change what a seed deals. A code sent
  before this update opens a different run after it, and on the day the update lands,
  players on the two versions get different dailies.

**Followed up after shipping.** Three things from the list above were measured. Two of them
changed the game, in v0.59.1: the drafted drift is back on 16 honest sides, and the look's
undone limit is 27%.

**The story test is a third faster.** It played each player's first ten runs twice: once for
the tenth run, and again on the way to the twentieth. `repeatProfiles` measures several of a
player's runs in one pass. Its results are identical to one pass per run, checked against the
shipped function on 12 players for both kinds of card, runs 10 and 20, era by era.
- The test takes 27 seconds on its own, down from 40. The whole unit suite gains less, 246
  seconds to 238 here, because its files run side by side.
- `npm run simulate` uses it too, and plays 4,800 runs for its repeat lines instead of 7,200.

**The look has no more room to give.** Its two ceilings pull against each other: a look that
lets go later is undone less and held longer. Each range below is v0.59.0 on three sets of
2,000 first runs, from seeds 900,000, 910,000 and 920,000.

| Margin | Undone within three cards | Held past drift (≤ 12%) |
|---|---|---|
| 3 | 32.2–32.9% | 8.0–8.2% |
| 4, as shipped | 23.9–24.7% | 10.7–11.0% |
| 5 | 18.8–19.2% | 13.3–13.6% |
| 6 | 15.5–16.0% | 16.0–16.5% |

- **Nothing lies between 4 and 5,** since drift moves in whole steps.
- **A margin for each line only moves room from one ceiling to the other.** Raising the
  margin at one line (8, 20 or 36) by one takes about 1.5 points off undone and adds 0.7–1.1
  to held. The best of these, 4/4/5, reads 22.8% and 11.5%.
- **v0.59.0's 24.4% moves with the seeds, by ±0.4.** So its rise from 24.0% in this phase
  may be noise rather than the stories, and any change to the deck could fail the 25% limit
  by chance. Phase 45 found under a point of room on every set from the start.

**The drafted drift is back, and the look's limit is 27%.** The +3 did not only touch greedy.
Anyone who wants to keep ruling has to take the honest side on those 16 cards, because the
other side ends the run. Greedy and the mixed bot each meet 0.45 of them a run, and 36% of
their runs meet at least one. At 10,000 runs a bot:

| | +3, in v0.59.0 | +4 to +6, as drafted, in v0.59.1 |
|---|---|---|
| Greedy: ends in Decay (≥ 70%) | 73.8% | 72.4% |
| Mixed: reaches Ascent (15–30%) | 19.5% | 20.2% |
| The look: undone within three cards | 24.4% | 24.8% |
| Drift greedy gets from those honest sides, a run on average | 1.34 | 2.53 |

- **The drafted drift is what shipped in v0.59.1.** Those honest sides give +4 to +6 again,
  in line with the honest steps before them, which give +4 and +5.
- **Every target passes with it:**
  - random play's median run is 45 cards, and its most common ouster is bankruptcy at 13.5%;
  - saint is ousted before era 2 in 100% of runs;
  - repeats read 61.7%, 57.1% and 81.9% for all cards, and 62.5% and 83.3% for stories.
- **The look reads 24.3–24.8%** on five sets of seeds: 900,000, 910,000, 920,000, 100,000
  and 500,000. That is 0.2 points under 25% at worst.
- **So the undone limit is now 27%,** 2.2 points above the highest reading. It still holds
  the look to about half of the 53% phase 45 started from.
- **One guard sits on its line.** The test also holds the look to at most 16 changes a run,
  a guard rather than a target. It reads 16 on the harness's seeds and 15–16 on the others,
  so it too can trip by chance.
- **Old run codes.** A run that meets one of those cards plays on differently from there, so
  its code from v0.59.0 opens a different run.

<details><summary>Original entry</summary>

**Why.**
- **Stories repeat faster than anything else in the game.** By a player's 10th run, 82.4% of
  the story cards they meet are ones they have met before, and by the 20th, all of them
  (median of 40 players). For ordinary cards it is 63.8% and 81.9%, and for questions
  37.5% and 66.7%.
- **The pool is small.** A run enters about six stories of the 18 its side can draw (14
  shared and 4 of its own). Two of those need an unlock, by design: the referendum and the
  truth commission.

**Sized with copies,** the phase 36 and 44 method. Existing stories are copied under new ids,
with their links and their weights from the setups, and played by the same 40 players:

| Stories | Story cards met before, 10th run | 20th run |
|---|---|---|
| 22 (today) | 82.4% | 100% |
| 33 | 70.0% | 92.3% |
| 44 | 62.5% | 84.6% |
| 66 | 46.7% | 72.7% |

Balance did not move with the copies: mixed Ascent was 16.5–17.6% on these players' runs,
against 17.6% today.

**What.** 22 new stories, drafts for your edit:
- **3–4 cards each,** about 75 cards, split as today's are: 14 shared and 4 for each side.
- **Each with a turning point that can end the run, on its last card.** This is phase 43's
  rule: endings on a middle card cut random play's runs short. So there are 22 new endings.
- **History names, "after" lines and legacies,** as today's stories carry them.
- **Entry conditions spread over eras 1–3, bands and meters,** so the new stories do not
  compete for the same moments.
- **The rules above hold.** No card scores a policy, the country stays fictional, and the
  four topics you left off stay off.

**Targets.**
- Story cards met before: at most 65% at a player's 10th run and at most 85% at the 20th.
  These are the ordinary deck's ceilings.
- Every harness target still holds, including random play's median run of at least 40 cards
  and mixed Ascent of 15–30%.
- The question roads keep their margins.

**The limit.** A copy is drawn exactly like the story it copies. New stories with narrower
entry conditions would be met less and so repeat less, but fewer players would see them.

**Cost.** About 75 cards and 22 endings with their names and lines, about the size of phase 41.

</details>

---

## Considered, and not proposed

- **Saying on the election card how the vote stands** (decision 4). It waits on decision 3.
- **Retuning the elections now.** No single change to the honest vote's drift keeps both
  voting habits inside 15–30%. Measured on 8,000 runs each:
  - taking 2 drift off every honest vote: 16.6% and 32.9%;
  - taking 4 off: 14.3% and 26.8%;
  - taking 6 off: 12.2% and 20.8%.

  Which habit to balance for is a question about people.
- **More cards for the long reign.**
  - **Per play, its eras repeat faster than the first three.** A player's 10th long reign has
    met 94% of its cards before. Their 10th run has met 64%.
  - **Per player, it evens out.** Someone who plays one long reign in four runs has played
    their 5th by their 20th run: 79% met before, against 82% for the rest of the deck.
  - **Worth it only if people choose the long reign more often than that.** The closed test
    will show whether they do.
- **Retuning objectives.** The seven most players have not done by run 50 each ask for
  something done on purpose:
  - **three mandate objectives:** the bot never takes a mandate;
  - **a run without one self-serving choice:** the saint bot earns it in 62% of its first
    runs;
  - **stepping down:** 72% of curious players have it by run 50;
  - **ten endings:** every curious player has it by run 50;
  - **three advisors fired in one run:** a player can go looking for those choices.
- **A draw that avoids what a profile has seen,** as in round six. It breaks run codes,
  replay, challenges and the daily.
- **More ordinary cards.** The repeat targets hold (63.8%, 54.3% and 81.9%), and more cards
  buy little by the 20th run.
- **The four topics you left off.** They are still off.
