# Backlog, round ten: ideas

Round nine (BACKLOG-9.md) is phases 52–54, all done: v0.62.0 to v0.64.0. BACKLOG-2's phase 17,
getting the game onto Play, still waits on decisions only the owner can make.

You asked for ten new ideas: features, or overhauls. They come from an audit of v0.64.0, which
looked at what the game has and where the measurements say it is thin. They are not phases yet,
except ideas 1, 2, 10, 6, 5, 7 and 8, which you chose: phases 55 to 62, done in v0.65.0 to
v0.70.0, at the end of this file.

Each idea says:
- what it is;
- what the audit found that points to it;
- a rough cost, and the risk;
- what to measure before building it.

Numbers are measured, from bots unless a line says otherwise. How players will feel about any of
this is a guess until the closed test.

## What the audit measured

| Measure (v0.64.0) | Result |
|---|---|
| Content | 1,617 cards: 1,298 events, 305 story cards, 14 elections. 76 stories, 32 of them question arcs. 77 endings, 30 advisors, 31 crises and flaws, 4 promises, 7 lessons |
| Cards that are a real dilemma, for the informed voter (the more honest side costs the meters) | 80.2% of cards shown. 14.1% cost nothing to be honest on; only 4 cards are like that in 90% of showings |
| Votes where one side ends the run, for the informed voter | 33.3% |
| Competent runs that reach the finale | 97%, for the mixed and informed voters alike |
| Endings reached in 23,000 bot runs | 75 of 77. 17 come in under 0.1% of runs. Never reached: `country_decided`, `clean_hands` |
| An informed player's first 50 runs (16 players, the median) | Endings: 3 by run 10, 4 by run 50. Histories: 10 and 42. Legacies: 34 and 56. All 5 unlocks by run 10. Objectives: 14 of 23 from run 20 on |
| A careless first run (random bot, 600 runs) | 44 cards. The election lesson lands in 70% of them, at card 26; the habit lesson in 29% |
| The rival, at the informed voter's votes | At the top rung 4.2% of the time. Wins 0.3% of the mixed bot's runs |
| Advisors | 24 for the cabinet and 6 rivals. Dealt, not chosen: each cabinet advisor serves in 32–38% of runs. 8 cards can fire one |
| Sound | 7 synthesized cues. No music |

The good news first: **the cards hold up.** Four in five are a real choice between the honest
thing and the easy one, and almost none is a free pass.

---

## 1. Lose a vote, go into opposition — overhaul

**What.**
- A lost honest vote no longer ends the run. You leave office for part of an era, and play the
  opposition from a deck of its own: hold the government to account, rebuild a bloc, feed or
  refuse a scandal.
- The rival governs meanwhile, and the meters drift under them.
- An election brings you back, or it doesn't.

**Why.**
- Since phase 54 a third of the informed voter's votes are forced: the honest side ends the run,
  so the only way on is to cheat.
- A player who never cheats loses a vote in 55% of runs.
- The card now says all this before they choose. What it offers them is a principled ending, not
  a choice.

**Cost.** Large.
- A second deck, 60 to 100 cards.
- Opposition state in the engine, and a return election.
- Histories and endings for the new path, and balance.

**Risk.** It changes what losing means, so the balance targets and the codex's loss endings move.
Opposition must never be a better place to be than office.

**Measure first.** How many runs meet a forced vote, and when.

## 2. A campaign before the count — feature

**What.**
- One or two campaign cards before an election. Each spends money, order or a bloc's patience to
  move the coalition a few points before the count.
- The count line on the election card updates as they do.

**Why.**
- Elections decide the Ascent more than any card (BACKLOG-9).
- There are 14 election cards for three votes a run.
- Today a "narrow loss" is final. A campaign makes it something to act on.

**Cost.** Medium: 20 to 30 campaign cards, a queue hook before each vote, and balance. The bar may
have to rise again.

**Risk.** If a campaign always saves the vote, cheating disappears, and the dilemma with it.

**Measure first.** The share of votes within 5 points of the bar, the narrow bands, where a
campaign would matter.

## 3. A rival who plays — feature

**What.** The rival acts as their standing grows:
- they poach an advisor;
- they court one of your blocs;
- they run a scandal;
- at an era's last election they stand against you by name.

**Why.**
- The rival reaches the top rung at 4.2% of the informed voter's votes, and wins 0.3% of the mixed
  bot's runs.
- 28 cards are spoken by the rival and 12 name them, but most of the time they are a number in the
  cabinet.

**Cost.** Medium: 30 to 40 rival cards keyed to the rungs, and a few engine hooks (poach, court).

**Risk.** A rival who pushes back harder on an Ascent run is a second lever on balance.

**Measure first.** The rival's rung over a run, for each bot.

## 4. A dynasty: the next run inherits the country — overhaul

**What.**
- A new run can start in the country the last one left. It keeps the band's lean, a legacy or two
  in force (the seawall stands; the press answers to the office), and the rival's grudge.
- It is chosen at setup, "Take over from your last run", beside a fresh start.
- Dailies and shared codes stay fresh starts.

**Why.**
- An informed player has every unlock by run 10, and no new objective after run 20.
- What still grows is the codex: 42 histories and 56 legacies by run 50. None of it reaches the
  next run, although 832 cards set a flag.

**Cost.** Large.
- Setup from a finished run.
- Cards that read inherited legacies.
- Histories for a line of runs, not one.

**Risk.** A bad inheritance compounds, so a fresh start must always be on offer.

**Measure first.** Which legacies competent runs leave most often, and how much a run started from
them differs.

## 5. A first term — onboarding

**What.** Either of two:
- A new player's first run is dealt to show the game early: a bill coming back by card 12, the
  first election by card 15, a habit by card 20.
- The first run is one era long, and ends in a small finale of its own. The first ending and
  history then arrive in about ten minutes.

**Why.**
- A careless first run lasts 44 cards (random bot).
- The election lesson reaches 70% of those runs, at card 26, and the habit lesson 29%.
- What the game is about arrives after many first-time players have already lost.

**Cost.** Small to medium: draw overrides for run 1, or a one-era mode.

**Risk.** A dealt opening is the same for everyone. The closed test is the first look at real
first runs.

**Measure first.** In the closed test's records: how long first runs are, and where they end.

## 6. Endings you can aim for — feature

**What.**
- The codex gives a clue to each ending not yet found.
- The menu's count leads with histories, which a good player actually collects.
- The two endings no bot reached get a check, and a path if they need one.

**Why.**
- An informed player finds 4 of 77 endings in 50 runs. 71 of the 77 end a run before its finale,
  and a good player rarely ends early.
- "Five ways out" and "Collector" are two of the objectives that stay unfinished.
- The menu counts endings ("Codex 3/77"), the one thing a good player hardly adds to.

**Cost.** Small: 77 clue lines, the menu count, and a look at `country_decided` and `clean_hands`.
Both are the ends of stories (`arc_re3`, `arc_tr3`), so they may only need a person to take a side
no bot takes.

**Risk.** Clues can turn a surprise into a checklist.

**Measure first.** Whether any sequence of choices reaches the two endings.

## 7. Weekly contracts — feature

**What.**
- A few contracts each week, dealt from the date as the daily is, with no server. For example:
  "Reach the Ascent with the Ledger without cheating a vote", or "Finish with the army unleashed
  and no coup".
- A streak, and a mark in the codex.

**Why.**
- Every unlock is earned by run 10, and the objective ladder stops at 14 of 23 by run 20.
- Past that the daily is the only thing that changes.
- Of the nine objectives left, four need a promise or a long reign, which the simulation never
  chose. The other five are:
  - two ending counts;
  - firing three advisors in one run;
  - handing over to someone competent;
  - twenty cards without a self-serving choice.

**Cost.** Medium: a grammar for contracts over run stats, a weekly deal, and room in the codex.

**Risk.** A contract only a bot could plan feels arbitrary.

**Measure first.** How many runs each candidate contract takes a competent player.

## 8. Choose your cabinet and your platform — feature

**What.**
- At each era's start, pick one of two candidates for a seat: say, a competent cynic or a loyal
  fool.
- At setup, pick two promises from a longer list, as a platform.

**Why.**
- There are 24 cabinet advisors, and their traits scale every card they bring. They are dealt,
  not chosen: each serves in 32–38% of runs, and only 8 cards can fire one.
- Setup offers two choices: a party, and one of 4 promises.

**Cost.** Medium: a candidate screen at era boundaries, 6 to 8 new promises each with its
broken-promise card, and balance.

**Risk.** More to choose before the first card. The choices have to stay readable on a phone.

**Measure first.** How much an advisor's traits move a run's band and its survival.

## 9. The country on screen — presentation

**What.**
- A small, living picture of the country beside or behind the table, drawn the way the end screen
  draws it (`src/ui/world.ts`).
- The seawall goes up the moment you build it; the statue stands where the ballot boxes were.

**Why.**
- 832 cards set a flag. Until the run ends, what they did to the country is invisible, except as
  later cards.
- The end screen already draws those flags.

**Cost.** Medium: a compact scene on the play screen in all seven looks, updated as flags are set,
and fit audits at 360×640.

**Risk.** Room. On a small phone the table is full: phase 53's count line only fitted in Decay 3
once it was cut to one line of 13px.

**Measure first.** How much room each look leaves at 360×640, and which flags have a drawing.

## 10. A bot with a person's eyes — tooling

**What.** A harness bot that decides only from what a person sees:
- the size of the preview dots, not the exact effects;
- the meters' levels;
- the count line and the rival's rung.

**Why.**
- Every balance target since phase 4 is set on bots that see both sides' exact effects
  (`src/sim/bots.ts`).
- The closed test will be the first real measure of people. This is a cheaper one that can run
  today, and the test's records can check it afterwards.

**Cost.** Small: one bot, fed from the same preview through `stepOf`.

**Risk.** It is still a model of a person, not one.

**Measure first.** Its Ascent and survival beside the informed voter's.

---

## My order

1. **A bot with a person's eyes (10).** It is small, and it makes every balance change below safer
   to measure.
2. **Endings you can aim for (6), then a first term (5).** Small to medium, and they are the first
   things a practised player and a new one meet.
3. **The election pair (1 and 2).** The biggest change to how the game plays, and where phase 54
   pointed. Best built after the closed test shows how people vote.
4. **The dynasty (4).** The largest. Decide on it after the others.

**The closed test.** BACKLOG-8 advised holding the deck still for its 14 days. Every idea here
except 10 changes cards or balance, and so the deck. Build them either side of the test, not
during it.

## Also considered

- **A score that follows the look.** The game has 7 synthesized cues and no music. It is polish,
  and many phones play muted.
- **Other languages.** Every string is in one file and the cards are JSON, so the code is ready.
  But the satire is in the wording, so each language needs a translator. Worth it only once the
  English game has found players.
- **A shorter mode.** A competent run is 105 cards. Whether that is too long on a phone is a
  question for the closed test's records (time per card).
- **Money.** Nothing in the game asks for any. Not proposed: it is your decision whether the game
  is meant to earn on Play.

## Decisions for you

1. **Which of these become phases,** and in what order. The default is the order above.
2. **Whether the big two (1 and 4) wait for the closed test.** The default is that they wait.

---

## Phase 55. Opposition (idea 1) — *done*

**Shipped in v0.65.0.** You chose idea 1. It was built to the rules proposed, with one number
added: the bar at the return vote.

**Measured first, at v0.64.0** (4,000 runs a bot).
- **A forced vote is common.** 56% of the informed voter's runs meet one, where the honest count
  loses. For the mixed bot it is 58%.
- **The first one is usually the first vote:** three times in four.
- **Every vote falls on card 26 of its era** (cards 26, 61 and 96 of a run). A lost vote leaves 9
  cards of the era.

**The rules.**
1. **The first honest vote a run loses does not end it.** The rival takes the office, and you lead
   the opposition until the era ends. A second lost vote ends the run as it did before:
   `election_loss`, or `rival_wins` when the rival is somebody. A cheated vote is never lost.
2. **In opposition the deal is the opposition deck, and nothing else:**
   - bills wait, their due dates moved on by the cards left in the era;
   - stories and questions pause where they are;
   - the ordinary deck and its habits wait.
3. **Your coalition can still leave you:** a bloc at zero ends the run. The state is the rival's:
   money, order and the institutions are held between 1 and 99 while you are out, so none of them
   can end the run, and no cult grows around a leader out of office. The era's pull toward the
   middle meets you when you return.
4. **The era's last card is the return vote,** an election with two sides:
   - stand again honestly: the count decides, against a bar 3 lower than in office, since
     governing has worn the rival down (`returnSwing`). A loss ends the run;
   - take a shortcut back at a cheat's price: contest the count, start a rumour, call a strike,
     sign a pact, buy the balance, or let the army ask. It counts as a cheated vote.
5. **In the run's last era there is no return vote.** The finale comes with you in opposition,
   and the end screen says so.
6. **Drift and the look go on as ever.**

**The bar at the return vote.** With no help, the informed voter came back by the shortcut more
often than honestly: in 56% of its oppositions, against 37%. A game about the honest road should
not teach that the way back is the other one. So the honest count at the return vote clears a
lower bar. Measured on the first draft of the return votes, 3,000 runs a bot:

| Lower by | Informed Ascent | Back honestly | By the shortcut |
|---|---|---|---|
| 0 | 25.3% | 37% | 56% |
| 3 | 27.4% | 59% | 34% |
| 6 | 29.3% | 74% | 20% |
| 9 | 30.4%, a miss | | |
| 12 | 31.1%, a miss | | |

- **3, not 6.** At 3 the honest road is already the usual way back. At 6 the informed voter is
  0.7 points under its 30% ceiling at 3,000 runs, and at 3 the figure rose 0.7 points between
  3,000 runs and 10,000. At 6 it would sit on the line.
- **Also measured,** at 4,000 runs a bot, all passing:
  - the bar in office at 45, to make room for more help at the return vote: 26.3% with 4, 27.7%
    with 6. Rejected because it moves every vote in office, which phase 54 had just set;
  - the opposition's self-serving sides drifting 2 further toward Decay, with 4: 22.1%, and the
    mixed bot 11.6%, near its 10% floor.

**What was built.**
- **The engine** (`src/engine/opposition.ts`, and the deal, the vote and the ouster rule):
  - run saves are version 13, and a run saved before resumes in office;
  - the deal version is 2;
  - a deck with no opposition cards for a side keeps the old rule. The validator requires 25 or
    more for each side, and a return vote.
- **The content** (`src/content/cards/opposition/`):
  - 60 opposition cards: 30 for either side, and 15 each for the Commons and the Ledger. Each
    weighs principled opposition against opportunism, in each side's own failure modes;
  - seven of them make a promise that comes due in office, as one of 7 bills;
  - 6 return votes: 2 for either side, and 2 each;
  - two legacies with their histories: *A government lost the count, and went*
    (`lost_office`), and *It came back at the next count, honestly* (`won_it_back`).
- **The screen:**
  - the first card out of office says what happened and who holds the office, aloud too;
  - the party chip reads "the Commons, in opposition";
  - out of office only the coalition's meters show danger, and the danger sound and the near
    endings follow them;
  - the return vote's count line reads the lower bar;
  - a lesson, *In opposition*, the first time;
  - the end screen says when a run ended out of office.
- **Tests:**
  - 11 for the engine and 6 for the screen;
  - a browser audit of the first card out of office at 360×640 with the buttons drawn, in all
    seven looks;
  - the harness's check that the card tells the vote true counts a vote that sends a run out
    as a vote lost.
- **The playtest report** counts return votes with the others. Its note on honest votes that
  lose now says what they do.

**Measured after, at 10,000 runs a bot.**
- **The informed voter:** Ascent 28.2% (was 26.8%), 1.8 points under its ceiling. It cheats
  17.1% of its votes (was 34.0%): a lost count no longer ends its run, so it takes the first one
  rather than cheat. Finale 97.1%.
- **The mixed bot:** Ascent 14.1% (was 14.2%). It cheats 61.0% of its votes (was 71.0%).
  Finale 97.2%.
- **Every other target holds:**
  - random's median run is 45 cards (was 42), and no ouster cause takes over 13.5%;
  - greedy ends in Decay 77.7%;
  - saint is ousted before era 2 in every run;
  - the card told 111,441 of 111,441 votes true.
- **The long reign,** 3,000 reigns a bot:
  - informed Ascent 27.3%, mixed 12.5%;
  - the mixed bot reaches era 5 in 96.3% (was 95.5%) and sees the long finale in 94.1% (was
    92.9%).
- **Repeats,** a player's 10th and 20th run: cards already seen 60.0% and 79.0%, story cards
  already met 62.5% and 83.3%. The limits are 65% and 85%.

**What a player meets** (3,000 runs a bot).
- **About one run in two goes out of office:** 55% of the informed voter's, 35% of the mixed
  bot's, which cheats more of its votes, and 6.5% of the random bot's.
- **Most come back.** Of the informed voter's oppositions:
  - 59.5% came back honestly;
  - 33.7% came back by the shortcut;
  - 6.8% saw the finale from the opposition benches.

  The mixed bot took the shortcut in 64% of its oppositions. Neither lost a return vote, or a
  bloc while out. The random bot lost the return vote in 26% of its oppositions.
- **An opposition costs.** It is 9 cards long, and the informed voter's drift fell by 13 over
  one: out of office its blocs are low, and it spends the time sparing them. Its runs that went
  out reached the Ascent 25.5% of the time, against 33.2% for runs that never did.

**The deck moved,** from `5l1dae79` to `0d81nay4`. Codes, links and dailies from before deal
differently, and the game says so (phase 49). The playtest report keeps records from the old
deck apart.

**What it does not settle.**
- **Three margins are thin:**
  - the informed voter's Ascent is 1.8 points under its ceiling;
  - in the long reign, the mixed bot reaches era 5 0.7 points under its limit;
  - and it sees the long finale 0.9 points under its limit.

  The next change that helps a competent run will probably need a retune with it.
- **The bots' opposition is a model.** The informed voter takes the first lost count rather than
  cheat, spares low blocs while out, and never loses a return vote it can see coming. Whether
  people take the loss or the cheat, and how they spend nine cards with none of the state to
  lose, is for the closed test.
- **The 60 cards are a first draft.** They pass the strict validator, voice ceilings included.
  Each side's longest opposition card and return vote fit a 360×640 screen in all seven looks,
  with the buttons drawn. They are also the least-read cards in the game, and yours to read and
  sharpen.

---

## Phase 56. A campaign before the count (idea 2) — *done*

**Shipped in v0.66.0.** You chose idea 2. It was built to the rules proposed, and cost more
balance than they said: the bar rose from 44 to 46, and the return vote's swing from 3 to 5.

**Measured first, at v0.65.0** (3,000 runs a bot).
- **A third of the votes are close.** For the informed voter, 16.7% of votes are narrow losses,
  within 5 points of the bar, and 18.1% narrow wins. 16.7% are lost by more.
- **What a lift would do:** +2 on the count turns 7.0% of all votes from lost to won, +3 10.4%,
  and +5 16.7%, every narrow loss. The mixed bot's votes are the same to within a point.
- **The two cards before a vote already move the count,** by chance: by 3 points or more either
  way in one vote in five, and by 2 or more in half.

**The rules.**
1. **The two cards before each vote in office are the campaign.** They come from a campaign deck,
   this side's and either side's, in any era and band. Out of office there is none: the
   opposition's nine cards are its campaign. Once elections are abolished there is none, and a
   side with no campaign card left gets the ordinary deal.
2. **Each campaign card is a choice of how to campaign,** and both sides lift the coalition:
   - the honest campaign by 2 to 4 bloc points, about a point on the count, often at a small
     cost to the treasury or another bloc. It drifts +1 to +3, as an honest vote has since
     phase 54: it is the least a candidate owes;
   - the easy one by 6 to 9 bloc points, two or three on the count. It costs the state, drifts
     −5 to −7, and hands the rival 3 points of standing to campaign on. About a quarter leave a
     promise that comes due as a bill.

   Two easy campaigns can make up a narrow loss. Nothing makes up a loss by more, so deep losses
   keep the choice between cheating and losing.
3. **A campaign card says where the count stands,** in the election card's bands: "As it stands:
   a narrow loss". The election card's line then reads the count the campaign left.
4. **A lesson,** *Before the count*, the first time.

**Balancing it.** As first written, the honest side drifted +2 to +4, the easy side −3 to −5, and
the rival got nothing. That broke the targets: the informed voter reached the Ascent in 42.3% of
runs, the mixed bot in 25.0%, and the greedy bot ended in Decay in 68.9%, a miss.
- **Where the gain came from.** The campaign cards were close to drift-neutral themselves: −2.0
  a run for the informed voter. The gain was at the votes. Both sides lift the coalition, so
  fewer votes were lost: the informed voter went out of office in 31.6% of runs, from 56.3%, and
  the mixed bot cheated 1.35 votes a run, from 1.77. Each bot gained about 10 drift a run.
- **What was measured** (3,000 runs a bot unless marked):

| Setting | Informed Ascent | Mixed | Greedy in Decay | Long reign: mixed reaches era 5 |
|---|---|---|---|---|
| As first written, bar 44 | 42.3% | 25.0% | 68.9%, a miss | |
| The honest lift cut to 1 bloc point (2,000 runs) | 40.9% | 24.8% | 70.5% | |
| Both sides' drift 1 less (2,000 runs) | 34.5% | 19.8% | 76.2% | |
| Honest drift 1 less, easy 2 less, bar 46 | 27.5% | 14.6% | 79.9% | 97.2%, a miss |
| The same at bar 47 | 25.8% | 13.6% | 80.0% | 97.3%, a miss |
| Bar 46, and the easy side gives the rival 3 | 26.6% | 14.7% | 79.0% | 96.6% |
| The rival 5 instead | 26.7% | 14.5% | 79.3% | 96.7% |

- **Drift is the lever that works.** The honest lift barely moved the Ascent, and each point on
  the bar moved it by one to two points.
- **The long reign.** A campaign card is also a bloc heal: the easy side lifts every bloc, and the
  mixed bot takes it when a meter is near its edge. Its long reigns lasted longer, and no bar
  changed that: `rival_wins` halved, and `personality_cult` appeared. Giving the rival 3 points
  of standing on each easy campaign brought era 5 back under the limit. 5 did no better.
- **The return vote.** At bar 46 the return vote's bar would have been 43, not 41, and honest
  returns fell to 51% of oppositions. The swing went from 3 to 5, which keeps it at 41: 62.5% of
  the informed voter's oppositions end in an honest return, 30.3% in the shortcut.

**What was built.**
- **The engine:** the campaign slot in the deal (`campaignDue`, `campaignLead` 2), and the deal
  version 3. There is no new run state: the slot is the card count against the next vote, so saves
  need no migration.
- **The validator:** each side needs 20 or more campaign cards. A campaign card is an event, not
  a story's or the opposition's. Both sides must lift the coalition, and the easy side at least as
  far as the honest one.
- **The content** (`src/content/cards/campaign/`): 40 campaign cards, 20 for either side and 10
  each for the Commons and the Ledger, and the 11 bills their promises leave.
- **The screen:** the line on a campaign card, said aloud too, and the lesson.
- **The bots:** the engine's preview now carries the count after each choice. The informed voter
  reads a campaign card's line: honestly when that wins, the easy way on a narrow loss, honestly
  when the loss is deeper. The harness reports campaign cards a run and the share taken the easy
  way.
- **Tests:**
  - 9 for the engine and the informed voter, 4 for the screen, 4 for the validator;
  - the small-phone fit audit places each side's longest campaign card with its longest line, in
    all seven looks;
  - the count-line tests expect the line on campaign cards.

**Measured after, at 10,000 runs a bot.**
- **The informed voter:** Ascent 27.5% (was 28.2%), 2.5 points under its ceiling. It cheats 11.1%
  of its votes (was 17.1%).
- **The mixed bot:** Ascent 15.2% (was 14.1%). It cheats 50.4% of its votes (was 61.0%).
- **Every other target holds:**
  - random's median run is 47 cards (was 45), and no ouster cause takes over 15.3%;
  - greedy ends in Decay 78.7%;
  - saint is ousted before era 2 in every run;
  - the card told 112,836 of 112,836 votes true.
- **The long reign,** 3,000 reigns a bot:
  - informed Ascent 27.3%, mixed 14.6%;
  - the mixed bot reaches era 5 in 96.7% (was 96.3%) and sees the long finale in 94.0% (was
    94.1%).
- **Repeats,** a player's 10th and 20th run: cards already seen 56.2% and 79.0%, story cards
  already met 55.6% and 83.3%. The limits are 65% and 85%.

**What a player meets** (3,000 runs a bot).
- **About six campaign cards a competent run.** The informed voter campaigns the easy way on 47%
  of them, the mixed bot on 41%.
- **The campaign decides votes.** It turns a losing count into a winning one at 16.0% of the
  informed voter's votes, and at 11.6% of the mixed bot's. It never turns a win into a loss.
- **The dilemma is still there.** 22.6% of the informed voter's votes are lost honestly at the
  vote, from 33%, and 29.3% of the mixed bot's. The informed voter goes out of office in 42% of
  runs, from 55%.

**The deck moved,** from `0d81nay4` to `3c9ktfpd`. Codes, links and dailies from before deal
differently, and the game says so (phase 49). The playtest report keeps records from the old
deck apart.

**What it does not settle.**
- **One margin is thinner:** the mixed bot's long reign reaches era 5 in 96.7%, 0.3 points under
  its limit (0.7 at v0.65.0). The informed voter's Ascent margin widened, from 1.8 points to 2.5.
- **The bot mostly campaigns the easy way by its danger rule, not by the line.** 88% of the
  informed voter's easy campaigns come with a meter near its edge, where it plays as the mixed
  bot. How people campaign, and why, is for the closed test.
- **The bar rose again,** to 46. An honest campaign lifts the count by about 2 before a vote, so
  for a player who campaigns honestly a vote is about as hard as it was. It is the easy campaign
  that makes one easier.
- **The playtest report** does not yet show campaign choices on their own.
- **The 40 cards and 11 bills are a first draft.** They pass the strict validator, voice ceilings
  included, and each side's longest fits a 360×640 screen in all seven looks with its line. They
  are yours to read and sharpen.

---

## Phase 57. A bot with a person's eyes (idea 10) — *done*

**Shipped in v0.66.1.** It is tooling: the game plays as before, and the deck is still `3c9ktfpd`.

**What it sees.** The eyes bot (`src/sim/bots.ts`) decides from what the table shows a person:
- which side is the honest one, and which way each meter goes, as the card's words say;
- how far, only in the preview's three dot sizes, read as 2, 4 and 8 points;
- the meters, and the danger the screen draws them in: a bloc under 15, or in office a state meter
  under 15 or over 85;
- the count line on a vote or a campaign card;
- a side the card says ends the reign, which it never takes while the other does not.

It plays as the informed voter would with those alone. It is honest unless a meter is drawn in
danger, and then takes the side it reads as leaving the worst of those furthest from its edge. On
a vote it stands honestly unless the line says a loss that would end the run, and on a campaign
card it campaigns the easy way on a narrow loss.

**What it found** (10,000 runs a bot):

| | Informed voter | Eyes bot |
|---|---|---|
| Reaches the Ascent | 27.5% | 69.5% |
| Sees the finale | 97.6% | 92.0% |
| Ousted before era 2 | 0.5% | 2.9% |
| Votes cheated | 11.1% | 39.0% |
| Long reign (3,000 runs): Ascent, finale | 27.3%, 96.4% | 68.9%, 86.2% |

- **The dots are enough.** Given the exact effects instead of the dots, the bot played the same, to
  within 0.3 points on every measure.
- **What decides it is where a player turns careful.** The informed voter turns from the honest
  side on 45.6% of its ordinary choices. On 97.6% of those, nothing is drawn in danger: its
  nearest meter is a median 22 from its edge, over the screen's 15. The eyes bot waits for the
  screen, and turns with its nearest meter a median 13 from the edge. Moving only that line
  (3,000 runs each):

| Turns careful at | Ascent | Finale | Votes cheated |
|---|---|---|---|
| 15, the screen's danger | 68.9% | 91.5% | 39.8% |
| 25, the other bots' line | 37.1% | 96.0% | 23.0% |
| 35, where the screen reader says "low" | 17.3% | 95.4% | 8.4% |

- **Reading the card's own endings is what keeps it alive.** Without it, only 46.7% of runs saw
  the finale: story turning points end the reign on the honest side in 29 cards, and most say so
  in their labels ("Resign over it", "Say you will go").

**What it means.**
- **Established, for bots:** the Ascent's 15–30% holds only for a player who turns careful well
  before the screen warns. The informed voter turns with a meter a median 22 from its edge;
  played the eyes bot's way, the line would have to sit between 25 and 35. A player who stays
  honest until the screen draws danger reaches the Ascent in about 7 runs in 10, and still sees
  the finale in 9.
- **Not established:** where people turn careful. The closed test can say, and the playtest report
  now sets people beside the eyes bot, with a table of their turns from the honest side: how
  often, how often with nothing drawn in danger, and how near an edge.

**What was built.**
- The eyes bot, in the harness beside the other five, and `readAs`, what it reads off the dots.
- `src/ui/signals.ts`: the screen's danger and near-ending lines, moved out of `Meters.tsx`, so
  the bot reads the same numbers the screen draws. The meters bar reads its danger there too.
- The harness: two information rows, not targets, setting the eyes bot beside the informed voter,
  in the ordinary and the long evaluation.
- The playtest report: the eyes bot among the bots, and the new table of turns, for people and
  for every bot on the same runs.
- Tests: 7 for the bot, and one for the table. The rebuild test checks the turns against its
  own count.

**Decisions for you.**
1. **Where the screen warns.** The danger highlight at 15 is later than any balance target
   assumes. Drawing it at 25 would warn where the balanced-for player already turns careful. It
   changes the screen, not the deck. The default: leave it until the closed test shows where
   people turn.
2. **Who the Ascent is balanced for.** Still the informed voter. If the test shows people play
   like the eyes bot, the Ascent is too easy for them by a wide margin, and a retune would be
   large. The default: wait for the test.

## Phase 58. Endings you can aim for (idea 6) — *done*

**Shipped in v0.66.2,** with one clue at a time since v0.66.3. The deck is still `3c9ktfpd`: the
clues live in `src/meta/clues.ts`, not in the content, so rewording one does not move it.

**The two endings no bot reached: no path needed.** `country_decided` and `clean_hands` end the
stories `arc_referendum` and `arc_truth`, on the honest side of each story's last card. Both
stories wait for an unlock: "Three clean votes" and "Every way it can go". The audit's harness
plays without unlocks, so it never dealt them. With every unlock (2,000 runs a bot, and 600 for
the last two rows):

| | `country_decided` | `clean_hands` |
|---|---|---|
| Random bot | 1.4% | 0.7% |
| Mixed, informed and eyes bots | 0% | 0% |
| The informed voter, but honest through the story | 23.2% of runs | 16.8% of runs |
| The same, of runs that deal the story | 91% | 90% |

The careful bots never take either ending, because it is a choice to leave office and they avoid
endings. A person who wants one gets it most times the story comes. A test plays that way for
each ending, and fails if 60 seeds never reach it.

**Clues in the codex.**
- Every ending has one line, 77 in all and none over 76 characters. It says what the ending is
  made of, without naming it: "Money printed until the army is paid in bread." A test checks
  that no clue holds its ending's title. Some share a word with a longer title ("a court" for
  *Contempt of Court*).
- The codex's endings section now has four kinds of row:
  - endings found, as before;
  - near misses, still named, now with their clue after "You came close to this.";
  - a clue to one ending not yet found, under "Heard in the corridors, of a way it has ended:";
  - a count of the rest.
- The clue changes with every run played. On a new profile each comes round every 72 runs, and
  sooner as endings are found. One at a time is the answer to the idea's risk: something to aim
  at, not a list to work down. v0.66.2 gave three; you chose one.
- A clue is never given for an ending the profile cannot reach yet. That means the two unlock
  stories' endings, and the long reign's three finales until a finale opens it.
- The guardrail test now reads the clues with everything else a player can see.

**The menu counts histories.** The codex button said "Codex 4/77", a count a good player hardly
moves. It now says "Codex · 42 histories", which the audit's informed player reaches by run 50.
It says plain "Codex" before any history. The endings count is still in the codex. At 360px the
row fits even at its longest ("Daily #101 played", "Codex · 675 histories"). It wraps onto a
second line rather than running off a phone set to large system text.

**What was built.**
- `src/meta/clues.ts`: the clues, `rumours()` and `withinReach()`.
- The codex's endings section, the menu button, and the strings.
- Tests:
  - 2 for the unreached endings;
  - 8 for the clues and rumours;
  - 2 more for the codex, on near misses, rumours and the menu's count;
  - 1 browser check at 360×640 for the menu row at its longest and the codex's clues, for fit
    and contrast.

**Not established.** Whether clues send people after endings, or make the codex a checklist. Bots
cannot say, and the playtest records do not show what a player read in the codex. STORE.md asks
the testers directly.

**Decisions for you.**
1. **How many clues at once.** Decided: one, since v0.66.3.
2. **The wording.** The 77 lines are one per line in `src/meta/clues.ts`. Rewording any of them
   does not move the deck.

## Phase 59. A first term (idea 5) — *done*

**Shipped in v0.67.0.** You did not choose between the idea's two options, so I built the second:
a one-era first run. The deck moved to `2bocj4mk` for three new endings. The deal did not move
(`yeycfme9`), so a full reign plays exactly as before.

**Why this option.** New-profile first runs today, 2,000 a bot:

| | Random | Mixed | Informed | Eyes |
|---|---|---|---|---|
| Median length | 48 cards | 105 | 105 | 105 |
| Ends in a finale | 7.2% | 97.4% | 98.0% | 92.6% |
| The election lesson lands | 74.2% | 99.6% | 99.6% | 99.9% |
| A bill comes back (median card) | 75.5% (20) | 99.6% (32) | 99.5% (33) | 97.0% (41) |
| The habit lesson lands (median card) | 32.3% (47) | 79.8% (67) | 82.2% (66) | 66.3% (74) |

- A careful player's first ending comes at card 105. A first term brings it to card 35, with the
  vote at 25 still inside it.
- The dealt opening had three aims:
  - an election by card 15 is easy to deal;
  - a bill by card 12 depends on the player taking an easy side, and careful players take few;
  - a habit by card 20 has no clean way in, since a habit is the same decision made many times.
- A dealt opening is also the same for every new player, which the idea named as its risk.

**How it works.**
- A profile's runs start as a first term until it has seen one run through: a first term's end,
  or any finale. A run lost early does not count, so the next is a first term too.
- The menu says so under "How long", with "A first term" chosen and "Three eras" beside it.
- A first term is the ordinary game's first era, dealt the same. It has one vote, at card 25,
  with the campaign before it. A lost vote sends it into opposition until the end, as in any
  last era.
- At card 35 it ends in one of three ends, by band: *Downhill From Here*, *One Term* or *A Good
  Start*. The end screen adds: "That was one term. A full reign is three eras, and the next run
  you start is one."
- A first term's end is not a finale. It does not open the long reign or count for the finale
  objectives.
- It is not an ending the codex collects either. The codex still counts 77, so a veteran who
  never plays a first term is missing nothing.
- Histories, legacies, epilogues and the other objectives count as they do for any run.
- A first term's run code says it is one, so a shared first term, a playtest record and "take the
  other road" all deal it the same. The daily is always a full reign.

**Where a first term ends** (2,000 a bot):

| | Downhill From Here | One Term | A Good Start | Lost before its end |
|---|---|---|---|---|
| Random | 24.3% | 33.8% | 3.6% | 38.3% |
| Mixed | 6.2% | 64.3% | 29.1% | 0.4% |
| Informed | 4.2% | 63.0% | 32.4% | 0.4% |
| Eyes | 0.1% | 11.6% | 87.4% | 0.9% |

**What it costs.**
- The habit lesson lands in 2–7% of first terms. In a full first run it lands in 32–82%, mostly
  after card 35. It now waits for the second run.
- Eras 2 and 3 wait too: their rules, their cards, and the questions asked there.
- A player returning on a new device starts with a first term, unless they pick three eras or
  move their progress.
- Profiles that have played but never seen a run through get first terms from this version.

**Not established.** How long a first term takes a person, and whether they come back for a
second run. The closed test's records can show both. The report sets first terms beside bots
playing the same setups.

**What was built.**
- Engine: `firstTermEras` and `firstTermPrefix` in the config, `isFirstTerm`, the first term's
  end at the era boundary, and `survivedTo` for any run seen through.
- Content: the three ends, which the validator now requires.
- Meta: `firstTermDue` and `collectsEnding`. The codex, the clues and the endings objectives count
  only collected endings. Run codes carry a first term.
- Screen: the reign picker for a new profile, the continue button, the share line, and the end
  screen's line, record and sound.
- Tests:
  - 5 engine tests: the deal is the first era's, the end is by band, most runs see it through,
    the run code, and what it counts for;
  - 6 on screen, one of them for a profile moved in on the menu, which must not start a first term;
  - 1 browser check: a first term from a new profile's menu to its end, at 360×640.

**Decisions for you.**
1. **Which option.** The default is this one. The dealt opening could still go on top for the
   vote and a bill; the habit has no clean way in.
2. **Until when.** The default is until a run is seen through. "The first run only" is simpler,
   but 38% of careless first terms end early, and those players would never see one through.

## Phase 60. Weekly contracts (idea 7) — *done*

**Shipped in v0.68.0.** The deck did not move (`2bocj4mk`): contracts live in the profile, not the
content. The profile's save goes from v6 to v7.

**What it is.**
- Three contracts a week, the same for everyone. They are dealt from the week's number the way
  the daily is dealt from its day, with no server.
- Weeks turn over with the daily, at 00:00 UTC on Monday. Week 1 is the daily's first week.
- There is one contract per tier: easy, fair and hard.
- A full reign that ends in the week keeps any of that week's contracts it meets. The daily
  counts. A first term does not.
- The codex has a section for the week: its three contracts, which are kept, and the run of weeks
  with one kept.
- The menu has a line, "Contracts this week: 1 of 3 kept", which opens that section. It appears
  once the profile has seen a run through.
- The end screen lists each contract a run kept, with what else it earned.

**What a contract can ask.** Only what the screen shows a person:
- the side they lead;
- how the reign ends;
- the votes they cheat or do not;
- the promise they took;
- the choices they make;
- what the country is left carrying.

**Measured first** (`npm run contracts`, 500 runs a policy). Each contract was played by the
competent bots, each doing what a person aiming at it would add:
- leading the side the contract names;
- taking the promise it names, and keeping it;
- counting every vote honestly;
- taking the side that leaves the legacy it asks for.

The best of them is the contract's rate, the share of runs that keep it:

| Tier | Contract | Rate | Runs |
|---|---|---|---|
| Easy | Reach the Ascent finale leading a side | 59–60% | 1.7 |
| | Lead a side all the way down to the Decay finale | 81% | 1.2 |
| | See a side through a reign that ends in Muddle | 55–57% | 1.8 |
| | See a reign through, winning votes honestly and cheating none | 77% | 1.3 |
| | Keep the vote, the cabinet or the decree promise to the finale | 60–75% | 1.3–1.7 |
| | Finish a run of twenty cards or more without one self-serving choice | 50% | 2.0 |
| Fair | Keep "Nobody under forty" to the finale | 45% | 2.2 |
| | See a reign through to the Muddle finale, cheating no vote | 45% | 2.2 |
| | Lose the office at a count, win it back honestly, see the reign through | 22% | 4.5 |
| | Reach the Ascent finale leading a side, cheating no vote | 21–22% | 4.6–4.8 |
| | See a reign through with the press, the skim or the schools legacy | 22–31% | 3.2–4.5 |
| Hard | See a reign through with every group above sixty at the end | 16% | 6.3 |
| | Finish a run of a whole era or more without one self-serving choice | 9% | 10.9 |
| | See a reign through with the ring, the long ship, the seawall, the pensions or the feed legacy | 7–20% | 5–14 |

Left out:
- **Anything that scores a policy.** The answers to the policy questions came out at about 19%
  each, but a contract for one would reward a policy, which no card does. A test holds this.
- **What the deal decides more than the player.** That means a story's legacy kept in fewer than
  one run in fourteen, and firing three advisors in one reign (0.2%).
- **The long reign.** Not every profile has it open.
- **What is free.** Winning three votes honestly came out at 89%.

**What it means.**
- **Established, for bots:** an easy contract takes one or two runs, a fair one two to five, a
  hard one five to fourteen.
- **Not established:** how long they take people. The rates assume a player who always knows
  which side is honest, and which side leaves the legacy. A person will be slower.
- **The Ascent contracts are easy only for some players.** They sit in the easy tier on the eyes
  bot's 59–60%, a player who stays honest until the screen warns. For the informed voter they
  are 21–25%, which is fair.
- **The legacy contracts lean on the deal.** The card or story has to come up.

**What was built.**
- `src/meta/contracts.ts`:
  - the templates, each measured and tiered;
  - the week's number and the weekly deal;
  - which contracts a run keeps;
  - the run of weeks.
- The profile keeps `contracts`, the ids kept by week. A profile arriving in a link is read as
  carefully as its dailies.
- `foldRun` takes the day a run ended.
- The codex section, the menu line and the end screen's lines.
- `npm run contracts` measures the pool and flags any contract outside its tier's band.
- Tests:
  - 11 for weeks, the deal, keeping and the record. One checks that no contract rewards a
    question's answer.
  - 5 on screen.
  - The browser check of the menu at its longest now has the contracts line in it.

**Decisions for you.**
1. **What a contract gives.** The default is a mark and a streak, nothing more. The objectives
   already carry the unlocks.
2. **Whose rate sets the tier.** The default is the best way of playing it. Using the informed
   voter's rate instead would move the Ascent contracts to fair.

## Phase 61. Choose your cabinet (idea 8, first half) — *done*

**Shipped in v0.69.0.** This is the cabinet half of idea 8; the platform half is phase 62. The deck
moved to `4je4vymh`, and the deal to `hxp7kaz5`, because a new card opens each era after the
first.

**Measured first: how much an advisor moves a run.** Each cabinet seat was forced to each of its
three people in turn, on the same 400 seeds, for three bots:

| | Informed | Eyes | Mixed |
|---|---|---|---|
| One seat: how far the finale moves | 0.2–2.5 pts | 0.5–2.7 pts | 0.5–2.0 pts |
| One seat: how far the Ascent moves | 2.7–10.7 pts | 3.2–14.8 pts | 2.5–5.3 pts |
| Every seat stacked "best", then "worst": Ascent | 2.5%, 7.2% (dealt: 25.5%) | 16.8%, 46.5% (60.5%) | 0%, 3.5% (11.3%) |

- **One seat barely moves survival.** It moves the Ascent more, but not the way the traits'
  names suggest. A competent chief or judge gives less Ascent than a corrupt one. The corrupt
  bring the cards about their corruption, whose honest side is a chance to refuse them.
- **A whole cabinet chosen at once would be a different game.** Stacked either way, it sinks the
  Ascent. So the choice is one seat an era, never the whole table.

**How it works.**
- The first card of each era after the first is an appointment. That is era 2 and era 3 of a
  reign, and eras 2 to 5 of a long reign. A first term has none.
- The seat is dealt by the run's own dice, from those held since the first day, so a reign never
  fills the same seat twice.
- Its holder is leaving and names the two other people the seat's pool holds, with what each is.
  Every seat has three people, so there are always exactly two.
- Each side appoints one of them. Nothing else moves: no meters, no drift. The choice is who sits
  at the table from here, and their traits scale every card they bring.
- Out of office there is no appointment.
- An appointment is not a firing, so it keeps the promise of keeping the cabinet.
- A lesson says what an appointment is the first time one comes.
- The bots appoint by the trait blurbs, the careful ones the better reading and the greedy one
  the worse. The random bot picks at random.

**Balance** (10,000 runs a bot): every target passes, and nothing moved far.

| | Before | After |
|---|---|---|
| Informed voter: Ascent, finale | 27.5%, 97.6% | 27.3%, 97.5% |
| Mixed: Ascent | 15.2% | 14.8% |
| Eyes bot: Ascent, finale | 69.5%, 92.0% | 67.4%, 92.4% |
| Long reign, mixed: era 5, long finale | 96.7%, 94.0% | 96.4%, 93.5% |

- The cabinet advisors now serve in 32–52% of runs, where it was 32–42%. Two more people come
  in each reign, and the ones a careful player picks sit at the top. The test that holds every
  advisor between 20% and 45% now allows 55%.

**What was built.**
- Engine:
  - a card field, `appoints`, and the library's appointment cards;
  - `candidatesFor` and `appoint`;
  - the deal's `appointmentDue`;
  - the choice seating its person with the cabinet's flags brought up to date.
- Names: `withNames` fills `{first}`, `{second}` and their traits. The labels on the card and the
  buttons now go through it too.
- Content: eight appointment cards, one a seat, each in the voice of the person leaving.
- The validator: one card a seat, spoken by its holder, naming both, moving nothing, and a label
  that fits with the seat's longest name. They are exempt from the trade-off rule.
- The fit audit places the appointment with its longest names.
- Tests: 5 engine, 2 on screen, and the fit and deck tests.

**Decisions for you.**
1. **One seat an era, or more.** The default is one. Two an era would come near the stacked
   cabinet the measurements warn about.
2. **Whether keeping the cabinet should forbid appointments.** The default is no: a generation
   passing is not letting someone go.

## Phase 62. Choose your platform (idea 8, second half) — *done*

**Shipped in v0.70.0.** This is the platform half of idea 8. A run can be taken on two promises,
from nine. The deck moved to `6pxvizbi`, and the deal to `d2brewqm` (deal version 5): ten new
cards, and a run under a floor now starts at its line.

**Measured first: what each candidate asks.** Each candidate, played by three bots at 300 runs
each. "Unaimed" plays as the bot always does. "Aimed" takes the side that keeps the promise
whenever only one side does and it does not end the run.

| Candidate | Broken, unaimed | Kept to the finale, aimed | |
|---|---|---|---|
| The four shipped: clean count, nobody under forty, the cabinet, no votes | 35–100% | 10–78% (best: 47–78%) | For comparison |
| The treasury never under 40 | 99% | 28–34% | Harder than any shipped |
| The treasury never under 30 | 89–96% | 52–62% | **Shipped**, with its card |
| The institutions never under 40 | 0–8% | 91–97% | Free |
| The institutions never under 50 | 32–49% | 62–63% | Left out: under the line at the start in 38–49% of runs |
| Order never under 40, 45, 50 | 34–78% | 74–98% | Left out: a crackdown keeps it best |
| Never take the skim, bend a rule or clamp down, by habit | 84–100% | 58–97% | Left out: the side that sets a habit does not say so ("Keep the balance" is a skim, "Tighten the licences" a clamp) |
| Never capture the press, unleash the army, bury an audit, or name an heir | 4–15% | 89–100% | Nearly free with no card of its own; three shipped with one |
| Never campaign dirty | 15–65% | 83–86% | **Shipped**, with its card |

- **A floor could be broken before the first card.** A dealt setup put a bloc under forty in 2–5%
  of runs, which broke "Nobody under forty" on card one. A run under a floor now starts at its line.
  A test holds every promise, and every platform, unbroken at the start of 240 setups.
- **An institutions floor that bites starts broken.** The meter starts anywhere from 37 to 66.

**The five new promises** (300 runs a bot, with their cards):

| Promise | Broken by | Broken, unaimed | Kept to the finale, aimed |
|---|---|---|---|
| Something set aside | The treasury under thirty | 90–97% | 56–62% |
| A clean fight | A dirty campaign: a smear, a scare, a bought vote | 40–73% | 83–84% (eyes: 32%) |
| Not a coin for us | Taking the money, or burying an audit that found some | 26–46% | 85–96% |
| The papers print what they like | A paper, a licence or the feed put in friendly hands | 23–44% | 92–98% |
| The army stays in its barracks | The general let loose at home, or a register of the disloyal | 27–40% | 92–100% |

**Two at once** (150 runs a bot, the best of three; the pair aimed at together):

| | Kept, both, to the finale |
|---|---|
| The hardest: nobody under forty with something set aside | 23% |
| Any other two of the hard five (the four shipped, and something set aside) | 32–53% |
| A hard promise with an easy one | about the hard one's own rate |
| A clean fight with one of the easy three | 87–91% |
| Two of the easy three | 98–100% |

**How it works.**
- Setup asks for a second promise once a first is made. It offers only those that can stand
  beside the first.
- Three pairs cannot be made:
  - a clean count with no votes: one keeps the other;
  - a clean fight with no votes: measured, it was kept exactly as often as no votes alone;
  - nobody under forty with no votes: the price of no votes puts the public under forty in a large
    share of runs.
- Each promise is kept or broken on its own. It has its own flag, so the card tempting a run to
  break it keeps coming after the other goes. It has its own card when it breaks, and its own
  mark in the run and line on the end screen and in the codex. `broke_mandate` still means any.
- A run's promises are kept in the catalog's order, so one platform is one run, and one code,
  whichever was picked first.
- The meters draw the line a held floor keeps them above, and a screen reader says so.
- Objectives:
  - "Kept your word" and "A whole term, as promised" need every promise made kept.
  - "Four promises" now counts any four kept, which a profile that kept the first four has done.
- Formats:
  - The run save is v14: the one promise becomes a list of one.
  - The profile is v8: each run in the history lists its promises, and whether each was kept.
  - A run code lists the promises in the promise slot, `m_broad~m_loyal`. A code with one promise
    is unchanged. An older version reads a platform, or a new promise, as a promise it does not
    have, and says it cannot reproduce the run.
- The weekly contracts are unchanged. A new promise in their pool would change what past weeks
  dealt.

**What was built.**
- Engine:
  - `mandates` and `mandatesBroken` in place of one promise and the card it broke at;
  - `platformProblem`, `compatible`, `PLATFORMS`, `inCatalogOrder`, `holds`, `wordKept` and
    `heldFloors`;
  - the check breaks each promise on its own;
  - floors as data on a promise.
- Content: five promises, each with a card that tempts a run to break it and one for when it goes.
  The four temptations there were now stop on their own promise's flag, not on any.
- Screens:
  - a second drop-down;
  - in the run, a platform's two on one line by short names ("A free press", "Nobody under
    40"). Two lines took up to 16px off the longest cards at 360×640;
  - at the end, and in the codex, a line for each;
  - the floor drawn on its meters;
  - the timeline naming the promise broken, when there were two.
- Tests:
  - 9 engine;
  - 4 for the formats (run codes, the run save, the profile);
  - 2 for the profile's record and the objectives;
  - 4 for the picker;
  - 6 for the screens;
  - the browser audits run the widest platform on every phone, and hold a promise's line to one
    line at its widest on the narrowest.

**Caveats.**
- **Three of the five are easy for a player who pays attention.** The press, the money and the army
  are kept to the finale in 92–100% of aimed runs. They catch a player who is not watching:
  23–46% of unaimed runs break them. Refusing is always survivable, so a platform of two of them
  costs almost nothing.
- "Aimed" is a bot looking one card ahead. A person keeps a promise less well, or better, than that.
- Five, not the six to eight idea 8 guessed at. The candidates that would have made more were
  unreadable, broken before the first card, rewarded a crackdown, or scored a policy (the pensions
  and the schools are set by policy cards).

**Decisions for you.**
1. **Whether the easy three should cost more.** The default is no: they are the easy second
   promise. A second temptation each would catch more unaimed runs. It would barely move an
   aimed one.
2. **Whether the second promise should wait until a profile has kept one.** The default is no. It
   is asked for only once a first is made, so a player who promises nothing sees nothing more.
