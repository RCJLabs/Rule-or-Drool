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
   - **Default:** (b), which is phase 47.
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

## Phase 45. The look settles — *queued*

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

---

## Phase 46. What the first testers can answer — *queued*

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

---

## Phase 47. The voice check, and a first pass on the tics — *queued (decision 2)*

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

---

## Phase 48. Twenty-two more stories — *queued*

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
