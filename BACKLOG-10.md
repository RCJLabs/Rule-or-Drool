# Backlog, round ten: ideas

Round nine (BACKLOG-9.md) is phases 52–54, all done: v0.62.0 to v0.64.0. BACKLOG-2's phase 17,
getting the game onto Play, still waits on decisions only the owner can make.

You asked for ten new ideas: features, or overhauls. They come from an audit of v0.64.0, which
looked at what the game has and where the measurements say it is thin. They are not phases yet,
except idea 1, which you chose: it is phase 55, done in v0.65.0, at the end of this file.

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
