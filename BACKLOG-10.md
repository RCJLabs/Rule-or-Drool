# Backlog, round ten: ideas

Round nine (BACKLOG-9.md) is phases 52–54, all done: v0.62.0 to v0.64.0. BACKLOG-2's phase 17,
getting the game onto Play, still waits on decisions only the owner can make.

You asked for ten new ideas: features, or overhauls. They come from an audit of v0.64.0, which
looked at what the game has and where the measurements say it is thin. They are not phases yet.

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
