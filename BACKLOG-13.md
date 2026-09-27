# Backlog, round thirteen: replayable, its own, and fun

Round twelve (BACKLOG-12.md) is phases 74–79: v0.82.0 to v0.87.0. Its ideas 6–10 are left, and
are measured again at the end of this file. Round eleven's ideas 4 and 10 still wait on people's
runs. BACKLOG-2's phase 17, getting onto Play, still waits on the owner.

You asked what would make the game more replayable, more its own, and more fun. This round
measured the game as it ships, v0.87.0, for what makes a run worth playing again:
- what is at stake on a card;
- what a decision changes;
- what a profile still has to find;
- what the game does that others of its kind do not.

Each idea says:
- what it is;
- what the audit found that points to it;
- a rough cost, and the risk;
- whether it changes what is dealt (the deck), which decides whether it can go in before the
  closed test;
- what to measure before building it.

Numbers are from bots on v0.87.0, deck c8agx015, unless a line says otherwise. The usual sample is
1,000 runs a bot from seed 700,000 on alternating sides. The eyes bot decides only from what the
screen shows a person (BACKLOG-10 phase 57), so it is the best stand-in for people there is. It
may still read the screen better than a person does. How people play is a guess until their
records come in.

## What the audit measured

### Where it falls short

**1. Danger on screen seldom ends a run.**

| 1,000 runs a bot | Seen through | Ascent | Muddle | Decay | Endings met |
|---|---|---|---|---|---|
| Random | 8.4% | 6.4% | 45.3% | 48.3% | 70 |
| Greedy, the steadier side | 99.5% | 0.1% | 21.4% | 78.5% | 5 |
| Saint, the honest side | 0%: out at card 20 (median) | | | | 9 |
| Mixed | 97.2% | 13.5% | 58.6% | 27.9% | 6 |
| Informed voter | 96.2% | 25.6% | 61.1% | 13.3% | 8 |
| Eyes | 96.7% | 66.2% | 32.4% | 1.4% | 7 |

- **The informed voter turns careful early.** It is the player the balance is set for. It turns
  careful 10 points before the screen draws a meter in danger. A meter is drawn in danger on
  1–2% of its cards.
- **The eyes bot stays honest until the screen says danger.**
  - A meter is in danger on 30% of its cards in the first era, and 53–54% in the second and
    third.
  - In a fifth of its runs, a meter comes within 5 points of its edge.
  - It still sees 96.7% of runs through, and reaches the Ascent in two runs of three.
- **Why it survives.** A side that would end the run is marked (BACKLOG-11 phase 68), and the
  eyes bot takes the other side.
- **How the few careful runs that end early do end** (3–4% of them):
  - mostly in the general's story, whose last card ends the run on either side;
  - or at a meter's edge. For the eyes bot that is the treasury, in 1.5% of its runs.
- **Where the danger comes from.** Institutions is at its top on 33.5% of the eyes bot's cards,
  and the treasury at its bottom on 12.5%. The honest side raises Institutions: round eleven's
  idea 4.
- **What this does to the premise.** TRANSFER.md says honest choices cost you now and the player
  is seduced into Decay. For a player who reads the screen, the cost is only the danger colour.

**2. After the first few runs, new endings stop coming.** 20 profiles of 40 runs. Each profile
plays as the eyes bot, deciding one card in five its own way, and alternates sides. The first
term is dealt as the game deals it.

| After run | 1 | 5 | 10 | 20 | 40 |
|---|---|---|---|---|---|
| Endings found, of 77 | 0 | 2.1 | 2.8 | 3.2 | 4.5 |
| Story outcomes found | 1% | 11% | 21% | 34% | 49% |
| Legacies left | 7% | 29% | 43% | 62% | 75% |
| Objectives met, of 25 | 2.2 | 9.0 | 11.6 | 12.9 | 14.0 |
| Unlocks, of 5 | 0.5 | 2.6 | 4.2 | 4.5 | 4.8 |

| Share of profiles whose run *n* found | Run 2 | 3 | 5 | 10 | 20 | 30 | 40 |
|---|---|---|---|---|---|---|---|
| A new ending | 100% | 45% | 25% | 5% | 0% | 10% | 0% |
| A new history name | 100% | 95% | 100% | 85% | 80% | 80% | 70% |
| A new story outcome | 100% | 95% | 95% | 95% | 85% | 75% | 45% |

- **Endings.** A careful player meets three to five of the 77 in forty runs: the finales, and a
  fall or two.
- **Endings by choice are offered, but rarely.**
  - These are the 58 a side of a card takes outright, most of them a story's last step.
  - 1,000 informed runs offer 56 of them, one or two a run.
  - Each is offered in at most 7% of runs. The codex keeps a rumour of each ending not found
    (BACKLOG-11 phase 71), and one can take 15–20 runs to come up.
- **Unlocks** are spent by run 10.
- **Objectives.** 11 of the 25 are unmet at run 40.
  - Five need a promise, a line or a long reign. The bot never takes those.
  - The rest ask for ten endings, five endings (half the profiles managed that), or a way of
    playing.
- **What keeps coming** is a history name: a new one in 70–85% of runs, up to run 40.
- **Caveat.** The bot never takes a promise, a line, a long reign, or an ending it is offered.
  A curious person does.

**3. One decision changes the run, but no one can see how.** 200 informed runs. In each, 8
decisions are taken the other way, and the bot plays on from there.

- The deal differs a median three cards after the flip. Of the cards after it, 43% are met
  either way.
- The band the run ends in changes in 33–36% of flips. The history name changes in 56–58%.
- **Why.** The engine's dice are one stream. A different choice changes what can be dealt, so a
  different card comes, and every roll after it falls elsewhere.
- So the other road (BACKLOG-5 phase 34) shows a different run, not what the choice did.

**4. The daily is the same run for six cards.** Two players like the eyes bot, each deciding one
card in five their own way, on the same seed. 300 seeds.

| | Cards in common | The same cards, in the same order, from the start |
|---|---|---|
| One seed, two such players | 29% of one's cards met by the other (Jaccard 0.16) | 6 cards (median), 13 (p90) |
| Two seeds, one side | Jaccard 0.08 | |
| A Left run and a Right run | Jaccard 0.03 | |

- The daily, the week's scenario and a challenge link give everyone the same setup and the same
  opening. After that, they are different runs.

**5. The last era decides little.** Per informed run:

| Era | 1 | 2 | 3 |
|---|---|---|---|
| Decisions that leave a legacy | 5.4 | 1.8 | 0.6 |
| Cards from a question | 5.0 | 2.0 | 0 |
| Consequences arriving | 1.0 | 3.5 | 3.6 |
| Cards with a meter in danger: informed, eyes | 0.8%, 30% | 1.0%, 53% | 2.0%, 54% |

- **The history name is settled early.** A run seen through is named for a decision made in the
  first era in 57–60% of runs, and in the third in 10–12%.
- **So is the band.** The band at card 70 is the band the run ends in, in 77–82% of runs seen
  through.

### What works

- **The dilemma.** On 81% of the informed voter's cards, and 87% of the eyes bot's, the honest
  side leaves the meters less steady than the other side does. On 5% there is no honest side. On
  8–14% the honest side is also the steadier.
- **Votes are close.**
  - Of the informed voter's votes in office, 22% are narrow wins, 10% narrow losses and 11%
    losses.
  - Of the eyes bot's votes, 68% are narrow or lost.
- **The game remembers.** Each run, 13 cards come because of what the run did:
  - 8 consequences;
  - 3 cards that read a flag the run set;
  - 1–1.5 habits.

  295 card sides send a card later, and 98% of them are self-serving: the bill for the easy
  choice. It arrives 14 cards later (median; p90 22).
- **Pacing.**
  - Half the cards (50–57%) are plain deck cards: no story, vote or memory of the run.
  - The longest stretch of them is 9 cards (median), 14–15 (p90).
  - A card is met twice in a run 1–2 times.
- **Runs differ.**
  - Two runs on two seeds share 8% of their cards (Jaccard).
  - 2,000 seeds open on 384 different first cards. The commonest opens 1.2% of runs.
- **The rival** is a presence for a player who plays from the screen:
  - the eyes bot meets a median 5 of the rival's cards, and the top rung in 61% of runs;
  - the informed voter meets none (median), and the top rung in 12.5%.
- **The cabinet.** Informed runs seat 24 people. Each of them sits in 33–53% of runs, for a
  median 71–105 cards when they do.
- **The setup matters, a little.**
  - The informed voter reaches the Ascent in 17% of runs under a recession and 36% in a war. Two
    crises differ by 10 points or more in 27% of pairs.
  - For the eyes bot the range is 61–74%, and 9% of pairs differ that much.

## 1. One deal per seed — the deal

**What.**
- Each seed fixes the order in which its deck cards are dealt. A draw from the deck takes the
  first card in that order that the run can be dealt now, and has not met.
- Stories, consequences, votes and the campaign come in as they do now.
- The dice that decide whether a story starts or goes on read the seed and the card number, not
  the run's history.

**Why.**
- **The same run is not shared.** The daily, the week's scenario and a challenge link promise
  the same run, and deliver the same setup and opening: 29% of one player's cards are met by the
  other.
- **The other road is not a comparison.** It shows a different run: the deal differs three cards
  after the choice.
- **A prototype says it works.** It changed two things in `draw`: deck cards in an order the seed
  fixes, weighted as the deal's weights are, and those dice. Measured with it:

  | | The game's deal | One deal per seed |
  |---|---|---|
  | One seed, two players like the eyes bot: one's cards met by the other | 29% | 71% |
  | The same order from the start (median) | 6 cards | 8 cards |
  | After a flipped decision: the rest of the run's cards met either way | 43% | 81% |
  | After a flipped decision: the band changes / the name changes | 33% / 56% | 25% / 43% |
  | Informed voter: seen through, Ascent, Decay | 96.2%, 25.6%, 13.3% | 97.5%, 25.8%, 16.8% |
  | Eyes: seen through, Ascent, Decay | 96.7%, 66.2%, 1.4% | 96.3%, 63.4%, 2.3% |
  | Mixed: seen through, Ascent, Decay | 97.2%, 13.5%, 27.9% | 98.2%, 12.4%, 29.1% |

**What it would give.**
- Two people on the daily meet the same cards and can compare what they did on each one ("you
  signed the dam?").
- The other road shows what one choice changed.
- A challenge becomes a real rematch.

**Cost.** Small to medium:
- the draw, one file, and `DEAL_VERSION`;
- the week's scenarios measured again (27 minutes of search);
- the harness targets checked again.

Links and saves from before are told they come from another deck, as they have been since
BACKLOG-8 phase 49.

**Risk.**
- **Spoilers.** A daily can be spoiled ("card 12 is the dam; go left"). For a shared run that
  is arguably the point.
- **Movement.** A few more cards come round in the same order within one seed. That is all:
  every seed still has its own order.

**Deck.** Yes, for every run.

**Measure first.**
- The full harness, and the repeat measures (cards met by run 20).
- The scenario table.
- The prototype's numbers again, on the daily's own seeds.

## 2. Danger that bites — rules

**What.**
- A meter drawn in danger starts a count of decisions, shown as pips on its bar.
- If the meter is still in danger when the count runs out, it goes the way it goes at its edge
  now: the Unions walk out, or the treasury defaults.
- The count starts again once the meter is out of danger.
- The meter's number is still never shown; only the decisions left.

**Why.** The eyes bot lives in danger and sees 96.7% of runs through. A side that would end the
run is marked, so danger is a warning with a second warning behind it.

Played as the bots play now, a clock would end:

| Clock | Eyes runs ended | Eyes' Ascent left | Informed runs ended |
|---|---|---|---|
| 5 decisions | 77% | 16% | 6.8% |
| 8 decisions | 38% | 41% | 2.6% |
| 12 decisions | 12% | 59% | 0.8% |

The bots would learn to read it, so these are the most it could do. The informed voter hardly
notices it; the eyes bot's honest-until-danger rule stops being free.

**Cost.** Medium: the rule, the pips, the words a screen reader hears, one lesson and the balance.

**Risk.**
- **Feel.** This is the biggest change to how the game feels since the opposition.
- **It could punish honesty.** Most of the eyes bot's danger is Institutions at its top, which
  honesty builds. A clock there punishes honesty for strengthening the state, unless the state
  has honest ways down when it is high: cards that hand power back or sunset an agency.
  - That is round eleven's idea 4 from the other side, so the two are one decision.
  - TRANSFER.md asks for the Ascent to have dangers of its own ("technocratic overreach"). This
    would be one.

**Deck.** Yes: a rule.

**Measure first.**
- The eyes bot reading the pips, turning careful with three left: how often it sees a run
  through, and how often it reaches the Ascent. The informed voter should be unchanged.
- Whether people sit in danger as the eyes bot does. The playtest report's split at the danger
  line answers that (BACKLOG-7 phase 46).
- It could come first as the opening step of BACKLOG-12's harder terms (idea 6), taken by
  choice, and go into the ordinary game only if people's records say so.

## 3. Endings you can go looking for — codex

**What.**
- In the codex, a rumour you have heard can be pursued.
- The next run raises the weight of the story or card that offers that ending, in the eras it
  can come, and says so at the start: *Pursuing: The Posters*.
- One pursuit a run. The daily, the week's scenario and links do not take one.

**Why.** It gives the collection somewhere to go after run 5:
- a careful player meets 3–5 of 77 endings in 40 runs, and no new one after run 5 in most
  profiles;
- each of the 58 endings a player chooses is offered in at most 7% of runs, so a rumour can take
  15–20 runs to pay off;
- phase 58 found that a player who wanted either of two such endings got it nine times in ten
  when its story came.

**Cost.** Small to medium.

**Risk.**
- Collecting becomes a checklist; one pursuit at a time keeps it an aim.
- A pursued run is dealt differently, as an unlock's run is, so its record and share line say
  so.

**Deck.** Only a pursued run's.

**Measure first.** For each ending, the share of pursued runs that offer it (aim: three in four
or more), and what the pursuit does to the band.

## 4. The last era decides — questions and stories

**What.** The third era gets decisions of its own. Two ways, which can be combined:
- **Spread the questions.** One question in each era, rather than most of them in the first.
  Today the first era deals 5 cards from questions, the second 2 and the third none. This is
  config and each question's entry eras.
- **A reckoning.** In the last ten cards, a story that reads the run's defining legacy and asks
  what becomes of it: sell the railway you built, or keep it. It can rename the run.

**Why.**
- Decisions that leave a legacy fall from 5.4 in the first era to 0.6 in the third.
- A run's name is settled in the first era in 57–60% of runs seen through, and in the third in
  10–12%.
- The third era is consequences: 3.6 a run, and 2.7 cards reading flags. The last third of a run
  lives with what the first third decided. A finale era that decides something would give the
  run a climax.

**Cost.** Spreading the questions: small to medium, and the balance. The reckoning: large, with
writing for each family of legacy.

**Risk.**
- Questions dealt late miss the 1–2% of runs that end early.
- Moving them moves which names runs get.

**Deck.** Yes.

**Measure first.** Among runs seen through, the share named for a decision in the third era
(10–12% now), with every harness target holding.

This covers part of BACKLOG-12's idea 9, an emergency mid-run.

## 5. The papers at each era's door — era change

**What.** The era's door shows a front page:
- a masthead in the look's style: a broadsheet in the Ascent, a tabloid in the Muddle, the
  state's paper in Decay;
- the headline: the era's biggest decision;
- a strap for the vote;
- a line from the rival;
- the reign's name so far: *The papers are calling it "The Paid-For Pensions".*

It can be shared as a picture, as the end screen's card is.

**Why.**
- The era's decisions are told only at the run's end.
- A run's name is settled early (point 5 above). Showing the name so far lets a player see it,
  and, with idea 4, try to change it.
- A satire's natural form is the newspaper, and nothing else of its kind has one.
- The first era has 5.4 decisions to lead with. The third has 0.6, so its page leads with the
  bills that came due and the vote.

**Cost.** Medium:
- the page;
- headlines for about 80 legacies in three looks, or templates built on each legacy's name.

**Risk.**
- The door is already busy: the era's rule, the country, the scenario's goal and the music.
- The fit at 360×640.

**Deck.** No.

**Measure first.**
- The share of eras with a headline in each band.
- The fit on the smallest phone in every look.

## 6. The bill comes with a receipt — play and end screens

**What.**
- A consequence card says what sent it, in small type under the speaker: *Card 23: you took the
  builder's money.*
- The end screen's timeline joins each bill to its cause.

**Why.**
- This is the game's thesis at its plainest. 295 card sides send a card later, 98% of them
  self-serving.
- A bill comes 14 cards later (median; p90 22), 7–8 a run.
- Nothing says which choice sent it. A player who does not remember card 23 sees a new problem,
  not the bill for an old one.

**Cost.** Small. The run keeps its choices (BACKLOG-5 phase 34), so the sender is known.

**Risk.**
- A line more on the longest cards at 360×640.
- The receipt comes with the bill, not before, so the bill is still a surprise. An opt-in
  variant can show *This will come back* when a bill is sent.

**Deck.** No.

**Measure first.** Fit in every look on the smallest phone. Whether people connect a bill to its
cause is for testers.

## 7. The deck notices how you rule — content

**What.** More habit cards: the deck noticing a pattern rather than a single choice. Examples:
- one bloc pleased six times running;
- every vote cheated;
- no clean campaign;
- the treasury first, always.

20–30 cards, each dealt only after its pattern.

**Why.**
- There are 6 habit cards, and a run meets 1–1.5 of them.
- Of 13 callbacks a run, 8 answer a single card.
- Patterns are everywhere: 75% of informed runs please the same bloc most four or more times
  running (p90 six).
- A card that says how you rule is the game noticing the player, and every run is different.

**Cost.** Medium.

**Risk.** Voice (the phrase ceilings of BACKLOG-7 phase 47), and a small shift in balance.

**Deck.** Yes.

**Measure first.** Each pattern's share of runs, with thresholds set so each is met in 10–30% of
runs.

## 8. Pick your trouble — setup

**What.**
- The setup offers two crises, and the player picks one. The trait and the flaw stay dealt.
- The daily, the week's scenario, links and a line's next reign keep theirs.

**Why.**
- A run's choices before its first card are the side, the promises and whether to take over. The
  crisis is dealt.
- The crisis matters. The informed voter's Ascent runs from 17% under a recession to 36% in a
  war, and two crises differ by 10 points or more in 27% of pairs.
- A choice at the start gives each run a plan, and a reason to try the other crisis.

**Cost.** Small: the setup screen, and the roll offering two.

**Risk.** Players will take the easier crisis. The chronicle and share line say which was chosen.
Contracts could ask for the harder one.

**Deck.** No. How a setup deals is unchanged; only which setup is.

**Measure first.** The spread for each offered pair, for the informed voter and the eyes bot.

## 9. Great works across reigns — the line

**What.**
- A handful of projects too big for one reign: a moonshot, a canal, a new constitution.
- A line of reigns builds one in stages. A reign that takes over carries the work on, and each
  stage has its own cards.
- A line that finishes a work gets an ending and a codex entry of its own.

**Why.**
- Taking over (BACKLOG-10 phase 63) carries the last reign's lean, two legacies and the rival.
  It gives the next reign a start, not a goal.
- A goal that spans reigns gives a profile its long game after the unlocks run out, by run 10.

**Cost.** Large.

**Risk.** Few would see it if few take over. The bots never take over, so nothing measures how
many people do.

**Deck.** Yes, for a line's reigns.

**Measure first.** How often people take over: the records carry the inheritance. So it waits
for the test.

## 10. Rare sightings — content

**What.**
- 20–30 cards so rare a player meets one every few runs: the country's strangest days. The
  census counts a town that isn't there; the anthem's lost second verse turns up.
- The codex keeps the ones seen.

**Why.**
- By the twentieth run, three cards in four are ones the player has met (BACKLOG-12).
- A rare card is a surprise late in a profile, and a story to tell someone.

**Cost.** Medium: writing.

**Risk.** Rare cards go unseen. They also have to be good, which is human work.

**Deck.** Yes.

**Measure first.** The weight that brings a sighting every three to five runs across the pools.

## BACKLOG-12's open ideas, measured again

- **6. Harder terms.**
  - The eyes bot reaches the Ascent in 66% of runs and sees 97% through. If people play like it,
    the Ascent is the usual outcome.
  - Idea 2's clock could be the first step.
  - It still waits on people's Ascent rate.
- **7. A setup you can feel.**
  - Ascent by setup is 12–39% for the informed voter and 50–80% for the eyes bot. By crisis
    alone it is 17–36%.
  - Its measure first was to hold each setup inside that spread.
- **8. People, not seats.**
  - Its measure first is answered. Each person sits in 33–53% of informed runs, for a median
    71–105 cards when they do.
  - A thread of three or four cards fits. Its risk, threads going unseen, is smaller than feared.
- **9. An emergency mid-run.**
  - For careful play the second and third eras are calm: danger on 1–2% of cards, and 1.8 and
    0.6 decisions that leave a legacy.
  - Idea 4 answers part of it with less engine.
- **10. Rival kinds.**
  - The informed voter meets none of the rival's cards (median). The eyes bot meets 5, and the
    top rung in 61% of runs.
  - For people who play from the screen, the rival is a person, so kinds would be felt.

## My order

Every open idea, this round's and the earlier rounds', in the order I would build them. What
decides most of the order is the closed test: which ideas change the deal, and which need
people's records before they are worth building.

**Before the test link goes out**

1. **The bill comes with a receipt (6).** Small, and nothing dealt changes. It lets the test ask
   whether people connect a bill to its cause, which is the thesis.
2. **One deal per seed (1).** The one change to the deal worth making before the test.
   - In the prototype, survival and the Ascent moved under 3 points and the informed voter's
     Decay 3.5.
   - Made first, it puts the test's records on the deal that stays, and the scenario table is
     measured again once.

**While the test runs: nothing dealt changes, or only in runs a player opts into**

3. **The papers at each era's door (5).** The largest payoff that changes no deal.
4. **Endings you can go looking for (3).** It comes after 1, since a pursuit moves a card up the
   seed's order. A pursued run is marked in its record.
5. **Pick your trouble, crises only (8).** Run codes already carry the setup's modifiers, so no
   format changes. The test shows whether people take the easy crisis.
6. **Contracts that know the rival (round eleven's 10, its contracts half).** Nothing dealt
   changes: new templates count only from the week they are added.
7. **An end screen that does not repeat itself (round eleven's 8, the half left).** Polish, and
   on screen only.

**Once the first records are in**

8. **The Institutions ceiling and danger that bites, as one phase (round eleven's 4, and 2).**
   - Worth building only if people sit in danger as the eyes bot does; the report's split at the
     danger line says.
   - The ceiling comes first, or the count punishes honesty.
   - It starts as a term taken by choice.
9. **Harder terms (BACKLOG-12's 6),** built on 8, once people's Ascent rate is known.

**After the test: changes to the deal, in batches**

10. **The last era decides (4).** Spreading the questions first, which is mostly config; then
    the reckoning.
11. **People, not seats (BACKLOG-12's 8).** Its measure first is answered.
12. **The deck notices how you rule (7).**
13. **The rival hears a broken promise, and a takeover reads how the last reign ended (round
    eleven's 10, its rules half).** Small rules that 14 and 18 build on.
14. **Rival kinds (BACKLOG-12's 10),** if people meet the rival as the eyes bot does.
15. **A setup you can feel, and choosing a trait and flaw (BACKLOG-12's 7, and round eleven's 9,
    its choosing half).** After 8, which round eleven thought might close most of the setup's
    spread.
16. **Rare sightings (10).** Their surprise pays off only past a player's twentieth run.
17. **An emergency mid-run (BACKLOG-12's 9),** as far as 10 leaves anything to do.
18. **Great works across reigns (9).** The largest. It needs 13, and people's rate of taking
    over.

## Also considered

- **Two players on one phone,** leading two parties in a coalition, turn about. Social and its
  own, but a game of its own too.
- **A press conference with a timer.** Tense, but a timer shuts out screen-reader and switch
  users, and the swipe has never been timed.
- **The cabinet taking sides on each card.** It would give the room a voice, but it tells which
  way a meter moves, which the preview keeps back on purpose.
- **Longer, branching stories.** 98% of stories started are finished, and each is three cards.
  Deeper ones are the most expensive writing there is. People not seats (BACKLOG-12's 8) gets
  more of the same effect per card.
- **A month's theme,** raising some stories' weights by date. It is weakly grounded: the audit
  found no shortage of story variety, only of stakes and of reasons to come back.

## Decisions for you

1. **Which of these become phases,** and in what order. The default is the order above.
2. **Whether one deal per seed goes in before the closed test starts.** It changes every run's
   deal. In the prototype, survival and the Ascent moved under 3 points and the informed voter's
   Decay 3.5. The default is yes, if the test link goes out after it; otherwise it waits for the
   test to end.
3. **Whether danger that bites is the ordinary game or a term taken by choice,** and whether it
   is decided together with the Institutions ceiling. The default is a term by choice first, and
   the ceiling in the same phase.
4. **Whether the papers name the run while it is going on.** The default is yes. The name is the
   game's main reward, so it could be kept for the end. Shown during the run, the third era
   gets something to play for.

## Phase 80. The bill comes with a receipt (idea 6) — *done*

**Shipped in v0.88.0.** Nothing is dealt differently: the deck is still c8agx015. The run save
keeps its version: a saved run now also keeps who sent each card waiting to come back, and one
saved before loads as it did.

- **On the card.** A card that came back from an earlier choice says which, in small type under
  its speaker: *Sent by card 23: "Trust the software"*. It quotes the side as its button said
  it. A screen reader hears *This card came back: your choice on card 23, "Trust the software",
  sent it.* Before, it heard only that the card came back.
- **At the end.** The end screen lists what came back, folded under *How it went*: *8 of your
  choices came back to you*. Opened, each entry is the choice and how its card began: *Card 23:
  "Trust the software"*, then *Back on card 37: They went through the wrong door at four in the
  morning.*
- **How it knows.**
  - The queue keeps, with each card a choice sends, the number of the card that sent it. When
    the card comes due, the table has it.
  - It cannot be read off the run's choices afterwards. 40 of the 97 cards sent this way are
    sent by more than one card, and two copies of one can wait in the queue at once. Taking the
    latest choice that sends a card names the wrong one for 1.4–2.0% of the cards that come
    back, in 10.5–13.2% of runs.
  - The end screen reads the list off the replay its chart already makes (BACKLOG-12 phase 74).
    That replay now keeps who sent each card too. Nothing more is saved.
- **Only a choice's bill.** A card the engine queues itself carries no receipt: a broken
  promise's card, or the handover that opens a line's next reign.

**Measured.** 1,000 runs each for the informed voter and the eyes bot:

| | Informed | Eyes |
|---|---|---|
| Cards that come back in a run (median, p90, most) | 8, 12, 17 | 7, 10, 15 |
| Runs where none does | 1.0% | 0.5% |
| A card coming back a second time in its run, in 1,000 runs | 381 | 390 |
| The latest sender would have named the wrong card | 1.4% of cards | 2.0% of cards |

- 4,000 bot runs checked every receipt against an independent account of the queue. Every
  receipt names a choice earlier in the run whose side sent that very card. The account and
  the engine disagreed on 40 of 28,116 cards, all from 20 ties.
  - In each tie, two copies of one card, sent by different choices, fell due on the same card,
    and the account could not tell which came first.
  - The other 20 disagreements were the second copy of each, arriving later.
  - The queue carries each sender with its own copy, so the engine can tell them apart.
- The replay and the list take 7.8 ms a run in node. Almost all of that is the chart's replay,
  which the end screen already made.
- **Fit.** The small-phone audit now puts each side's longest bill on the table with the longest
  receipt there is: *Sent by card 175: "Bless them and look away"*. It is staged with the
  buttons, two promises and the first lesson drawn, at five heights, in all seven looks.
  - At 12px, Decay's narrow card (236px wide in Decay 3) wrapped the receipt onto two lines. With
    the portrait already given up, the right side's longest bill ran 5px past the card at 360×640.
  - At 11px and set closer, as the mark on a side that ends the run is, it fits in every look.
    It is on one line in every look but Decay 3, where the portrait keeps 4px.
  - The end screen's list, opened on the smallest phone, reads and fits in the looks the chart's
    audit covers: Ascent 3, Decay 3 and the Muddle.

**Caveats.**

- A card already waiting to come back when a player updates comes without a receipt: the queue
  did not keep its sender then.
- The receipt names the choice, not what it cost. Whether people connect a bill to its cause is
  for testers: question 5 now asks.
- The list is folded, one line closed. Open, it runs to 17 entries at the most measured.

## Phase 81. One deal per seed (idea 1) — *done*

**Shipped in v0.89.0.** Every run is dealt differently from before: the deck stamp moves from
c8agx015 to g8u7egs4, and `DEAL_VERSION` from 8 to 9. A link, a saved run or a record from before
says it was dealt from another deck, as they have since BACKLOG-8 phase 49. No save format
changes.

- **The deck's order.** Each seed fixes the order its cards are dealt in.
  - A draw from the deck takes, of the cards the run can be dealt now and has not met, the one
    that comes first in the seed's order. The order is weighted as the deal weighs cards: a
    card's own weight, more for its side, more for a band it was written for.
  - The order is the key of weighted sampling without replacement (Efraimidis and Spirakis): a
    number the seed and the card's id make, to the power one over its weight.
  - Only when every card the run can be dealt has been met does one come round again, by the
    seed's dice at that card.
  - Which story or question starts is the first in the seed's order of those that can.
- **The other dice.** Every other die the deal and the rules roll reads the seed, the card
  number and what it is for, not the run's history:
  - whether a story starts or goes on, and which one goes on;
  - whether a question is asked;
  - the seat an era's appointment fills, and who replaces an advisor;
  - once elections are abolished, the coup's roll where a vote would have fallen due.
  The run's own stream of dice now rolls only the setup.
- **What it gives.** Two players on a daily meet mostly the same cards, and can compare what
  they did on each. The other road shows what one choice changed. A challenge is a rematch.

**Measured.** Beside v0.88.0, whose deal is the game's before this phase:

| | v0.88.0 | One deal per seed |
|---|---|---|
| The daily's first 300 seeds, two players like the eyes bot on one side: one's cards met by the other | 28.6% | 74.8% |
| The same pairs: the tenth and ninetieth percentiles of the 300 | 19.1%, 38.6% | 62.3%, 86.0% |
| The same pairs: the same order from the first card (median, p90) | 7, 13 cards | 8, 16 cards |
| After one decision turned the other way: the rest of the run's cards met either way | 43% | 83.4% |
| After one decision turned: the band changes / the history's name changes | 33% / 56% | 27.7% / 42.2% |
| A deck card dealt twice in its run, 1,000 runs (informed, eyes) | 624, 1,134 | 0, 0 |
| Informed voter: seen through, Ascent, Decay | 96.2%, 25.6%, 13.3% | 97.2%, 27.3%, 14.8% |
| Eyes: seen through, Ascent, Decay | 96.7%, 66.2%, 1.4% | 95.9%, 65.6%, 2.4% |
| Mixed: seen through, Ascent, Decay | 97.2%, 13.5%, 27.9% | 97.6%, 14.8%, 30.2% |

- The players like the eyes bot each decide a card in five their own way (`noisy`), which is
  how the week's scenarios measure people. They share the start until their first different
  choice puts a different card in reach, so the same order from the first card moves only from
  7 to 8. What changes is after: they come back to the same cards.
- Every harness target passes: section 8's, the informed voter's and the long reign's, and the
  file's other 17 tests, repeats by run ten and twenty among them.
- **Speed.** The first build took 102 µs a card in the simulator, where v0.88.0 took 81–89 µs
  on the same machine. Each card's place in the order is now kept for the run's seed, and the
  draw reuses the set of cards met that it already builds: 90 µs a card. Runs are dealt exactly
  as before the speed-up: the deck stamp, which replays 96 runs card by card, is the same.
  - The harness's section 8 test, 12,000 runs, takes 103 s where it took 91 s. That is too near
    its budget of 120 s for CI, which runs at about this machine's pace, so it now has 240 s, as
    the file's other long simulations do.
- **Tests.** The dice read only the seed, the card and what they are for, and fall evenly; a
  card's place follows its weight (three to one comes first in about three seeds of four). A run
  leaves its own dice where the setup left them. On a thin deck every card is dealt once before
  any again, and a card a choice puts in reach takes its place without moving the others. Two
  players on one seed share more than 60% of their cards, and a turned decision keeps more than
  65% of the rest. The five that play a run fail on v0.88.0's deal.

**The week's scenarios.** A goal is only as hard as the run it is set on, and every seed now
deals another run.
- Week 1 ends today and may already have been tried. A profile keeps its try against the week,
  and the week's page shows the goal beside it, so week 1 keeps its goal. Its last day plays on
  the new deal, where the informed voter meets the goal in 9% of runs, below the band the search
  holds a week to, and the eyes bot in 20%, at its floor.
- Weeks 2–156 were searched again on the new deal (`npm run scenarios -- --from 2`): 3,894
  candidates in 51 minutes, and every week searched is in the band. Across the table the
  informed voter meets a week's goal in 36.2% of runs and the eyes bot in 34.1%.
- The table now says from which week it was searched on its deck, and only those weeks are held
  to the band. Before, a deck move would have failed the band test on any kept week that fell
  out of it. The search's comment now says to run it from the week after the current one, and
  its summary names any kept week outside the band.

**Caveats.**
- **Spoilers.** A daily can be spoiled: "card 12 is the dam; go left" is now true for everyone
  on that seed and side. For a shared run that is arguably the point.
- **A run saved before the update** plays on under the new deal from where it is, as a run from
  another deck always has. Its end screen has no chart or list of what came back, since it
  cannot be dealt again.
- **A card that answers a meter near its edge comes once in a run.** The 15 of them (`edges` and
  `blocs`, such as the treasurer's *The payroll clears on Thursday or it does not clear*) are
  heavy and not one-shot, and before, one could come again whenever the meter was back there.
  Now each comes once, unless the run has met every card it can be dealt, and comes sooner,
  since a heavy card is early in every seed's order:

  | 1,000 runs | Informed | Eyes | Mixed |
  |---|---|---|---|
  | Runs that met one, v0.88.0 → now | 381 → 570 | 860 → 912 | 392 → 552 |
  | Runs that met one a second time, v0.88.0 → now | 48 → 0 | 235 → 0 | 49 → 0 |

  Seeing a run through moved under a point for each bot (the table above). If testers miss the
  second rescue, the fix is to let these cards come again, not to change the deal.
- **Weights mean order now, not frequency.** A heavier card comes sooner in a seed's order, and
  every card comes once before any comes again. The harness's repeat targets pass.
- The prototype measured 71% for two players, and as built it is 75–76%. The prototype put the
  deck's order and whether a story starts or goes on on the seed; the build puts every other die
  there too.

## Phase 82. The papers at each era's door (idea 5) — *done*

**Shipped in v0.90.0.** Nothing is dealt differently: the deck is still g8u7egs4. Nothing new is
saved: the page is read from the run as it stands, and its votes by dealing the era again from
the run's record.

- **The page.** The era's door shows the front page of the paper of the direction the country is
  going, in place of the list of what the country carries.
  - The papers: *The Long View*, a broadsheet, in the Ascent; *The Daily Fuss*, a tabloid, in the
    Muddle; *The Grateful Nation*, the state's own, in Decay.
  - The headline is the era's biggest decision: the first, in history's order, of the legacies
    set on the era's own cards, not taken over from the last reign.
  - Under it, the era's other decisions, the first named and the rest counted. A door with a
    crisis's rule, the week's goal or the long reign's lock to say as well leaves them out; the
    end screen tells them all.
  - The strap is the era's vote, its biggest news: won honestly, held by cheating, lost and won
    back (honestly or not), lost, or no count since the vote was abolished.
  - A line from the rival, by name, on the cabinet's four rungs, and another once the vote is
    abolished.
  - The name so far: *Historians are already calling it "The Open Door"*, which is what history
    would call the reign if it ended there.
  - The country the era hands on is the page's photograph.
- **The words.** 210 headlines, one for each of the 70 decisions that can name a reign in each
  paper, and none of them says whether the decision was right.
  - Each paper has its own voice. The broadsheet reports; the tabloid shouts; the state's paper
    thanks the office.
  - Both answers to a question get the same treatment, and a vote's own legacies are told by the
    strap, not the headline.
  - An era that decided nothing leads with one of the paper's three lines of its own, the same
    for every run on the seed at that door.
  - The guardrails now search the papers too. The first draft borrowed a real slogan, "no new
    taxes", which they caught.
- **Shared as a picture.** *Share this page*, beside Continue, sends the page as a picture with a
  few words and a link to the same run, as the end screen's card is sent.
  - The picture is 1,080 wide and as tall as its words, the paper on its own stock with its
    masthead.
  - Beside Continue, the button costs the door no height.

**Measured first.** 1,000 runs each; the door into era 2 is about era 1, and so on.

| Share of doors with a decision to lead with | Informed | Eyes | Mixed |
|---|---|---|---|
| Into era 2 (every band) | 100% | 100% | 100% |
| Into era 3: Decay, Muddle, Ascent | 87%, 84%, 83% | 100% (9 doors), 90%, 91% | 92%, 90%, 86% |
| Into era 3, all | 84.3% | 90.5% | 89.9% |
| The name so far is the name the reign ends with, into era 2 / era 3 | 35% / 66% | 40% / 68% | 29% / 60% |

- Every door has a vote to tell. A third of the doors into era 2 have two: a count lost, and the
  one that won the office back.
- A long reign's doors into eras 4 and 5 lead with a decision in 36% and 11% of runs (333
  informed long reigns). The rest lead with the paper's own line.
- **Fit.** The page first overflowed the smallest phone by up to 78px. The state paper's
  masthead ran to two lines, and a 60-character headline to four.
  - Now the headline is at most 42 characters, two lines in every paper; a test holds every
    headline to it.
  - A phone under 700px tall drops the motto and some of the picture.
  - The browser audit prints each paper at its longest in all seven looks at 360×640: the longest
    headline it has, the longest list of other decisions, its longest strap and rival line with
    the longest rival's name, and the longest name a reign is called. The door does not scroll,
    nothing is cut, and every line reads.
  - The audit seed's own door and a crisis's fit without scrolling, as they did. The week's
    scenario's door, with week 1's crisis bending its era too, scrolled 4px before this phase and
    5px with the page. A door with a crisis's rule, the week's goal or the long reign's lock to say
    as well now leaves out the era's other decisions, and that one fits with room for its vote.
- **Tests.** In 60 careful runs, the page leads with the era's biggest decision at every door,
  and says how the era's votes went exactly as they went: the votes read by dealing the era
  again match those recorded as the run was played.

**Caveats.**
- **The name so far is not the name at the end.** It is at era 2's door in a third of runs, and
  at era 3's in two thirds. That is the point: the name is there to be changed. It is also
  decision 4 above, taken as its default; say if the name should wait for the end.
- **A run the era cannot be dealt again for** (one saved before the update, or one moved by the
  debug keys) prints its page without the vote.
- **A decision's headline is the same every time it leads.** A player who keeps making the same
  decisions will see the same jokes, and the tabloid's wear fastest. Question 12 now asks whether
  testers read the page, and whether its name for the reign changed what they did.
- The serif is the phone's own. The audits measure it in DejaVu Serif, which is wider than
  Android's, so a fit that passes there has room on a phone.

## Phase 83. Endings you can go looking for (idea 3) — *done*

**Shipped in v0.91.0.** Only a run that goes looking for an ending is dealt differently, so the
deck is still g8u7egs4. Both saves keep their versions:
- a run keeps what it went looking for, and one saved before looked for nothing;
- the profile keeps the rumour being looked for, and one from before looked for none.

- **In the codex.** Each rumour of an ending a choice in a story takes has *Go looking for it*.
  - One rumour is looked for at a time. Pressing another moves the looking there, and pressing
    the same one again stops it.
  - The profile holds the looking from run to run until the ending is found, by whichever run
    finds it, or until the player stops.
  - Only the 58 endings *Ended by choice* can be looked for. A meter's edge, a cult, a lost
    count, a coup, the rival and the finales have no story to deal first.
- **On the menu.** Above *Take office*: *Looking for "…"*, with *Stop looking* under it. It also
  says whether the run about to start can look:
  - *This run is dealt to look for it*;
  - or why not: the other party's story (18 of the 58 endings are one party's), a country taken
    over that has settled it, or, under the short term's button, a story that comes later than
    one era.
  - The daily, the week's scenario and a run from a link never take the player's own looking.
- **The deal.** The story or question that ends the run this way comes first, in the seed's
  order, of those that can start.
  - It also starts sooner: at a chance of 1 in 4 on a card where it can, where the ordinary game
    has 0.075 for a story and 0.12 for a question.
  - Nothing else changes. Until its story can start, a run looking for an ending meets the very
    cards the same run would meet not looking.
- **The code.** A run looking for an ending is written in a new run-code format, 4, with the
  ending last: `4.2r.L.-.-.-.-.-.the_posters`.
  - The replay, the other road, the run's shape, a link and a playtest record all deal it the
    same way.
  - Every other code is the code it was. A version from before says it cannot reproduce a format
    4 run.
- **At the end.** *You went looking for "…"*, and one of: *Found.* / *Its story came, and went
  another way.* / *Its story did not come this time.*
  - The share text adds *Went looking for: "…"*.
  - A shared run that went looking says so on its offer.
  - `npm run playtests` counts the records that went looking; its bots replay them dealt the same
    way.

**Measured first.** All 58 endings, each on every side that can reach it: 98 cases, 200 seeds
each. The player follows the rumour: the simulator's new `pursue` aim, on the eyes bot and on the
informed voter.

| Offered the ending | Eyes | Informed |
|---|---|---|
| Not looking | 15.7% | 16.6% |
| Looking: its story dealt first | 89.1% | 90.2% |
| Looking: dealt first, and sooner (as built) | 93.4% | 94.9% |
| Cases offered in 3 runs in 4 or more, as built | 89 of 98 | 93 of 98 |

- **Also tried.**
  - A slot kept free for the pursued story added nothing: the story budget never kept one out.
  - Starting the story on the first card it could raised the eyes bot to 95.6%, but dealt a
    first-era story on the run's first two cards.
- **When the ending is offered** (median card):
  - card 8, for a story that can start in the first era (card 16 when it is only dealt first);
  - cards 42–44, for one that waits for the second era.
- **A short term**, with the eyes bot and 100 seeds a case:
  - 73 of the 98 cases can be looked for in one era;
  - 89.9% are offered the ending, against 7.9% not looking;
  - 63 of the 73 reach 3 runs in 4.
- **What stays under 3 in 4:** the endings whose story waits on the country.
  - *Blackmailed*, 27–29% for both bots. The cabinet plot needs a corrupt minister in the seat
    its first card is spoken from.
  - The eyes bot:
    - the family firm 44%, the party given back 48%, the town councils 56%;
    - the games 58% (Left) and 71% (Right);
    - the people's bank 61%, the foundation 65%.
  - The informed voter: the town councils 55%, continuity 71%, the games 72% (Left).
  - Each of those stories waits on a meter (the base above 54, order under 50, money above 40),
    or on the second era.

**What it does to a run.** The same 98 cases and 200 seeds:

| | Eyes: survived; Ascent / Muddle / Decay | Informed: survived; Ascent / Muddle / Decay |
|---|---|---|
| Not looking | 96.7%; 64.0 / 33.8 / 2.3 | 95.9%; 23.8 / 58.8 / 17.4 |
| Looking, playing as ever | 95.4%; 63.8 / 33.9 / 2.3 | 96.4%; 26.2 / 59.2 / 14.6 |
| Looking, following the story, turning the ending down | 93.1%; 54.7 / 41.3 / 4.0 | 94.6%; 20.0 / 58.7 / 21.3 |
| Looking and taking it | ends at card 26 (mean) | ends at card 25 |

- The deal alone moves little: the eyes bot survives 1.3 points less, and its Ascent moves 0.2.
  The informed voter's Ascent is 2.4 points up.
- Following the story moves more, and should. Most of these endings lie at the end of the
  self-serving road.
  - The questions' dark answers take the eyes bot's Ascent down by 34–55 points in those cases
    (the words said on camera, the correction, the care list).
  - The general's last card ends the run either way, so turning one of his endings down means
    taking the other.

**Tests.**
- The engine:
  - which endings can be looked for, and on which sides;
  - the side that leads to each;
  - why a setup cannot look;
  - that a run takes only one it can reach.
- 1,176 bot runs looking for their ending, 12 for each case, are offered it more than 85% of the
  time; the same runs not looking, under 30%. Three stories that wait on nothing come in 36 or
  more runs of 40.
- Before its story can start, a pursued run is dealt card for card as the same run not looking
  (30 seeds).
- A pursued run is put back card for card by its own record.
- Format 4 codes: they round-trip, reproduce the run, and refuse an ending the run could not
  reach.
- The profile:
  - which rumours can be looked for, and one at a time;
  - the looking stops once the ending is found;
  - a looking travels with the profile, and a name that is not one is dropped.
- The codex's toggle, and the whole way from pressing it to a run dealt to look.
  - A run that cannot look says why and starts looking for nothing.
  - The daily looks for nothing.
  - A short term that cannot look says so.
  - *Stop looking* on the menu.
- The end screen's three outcomes, the share text and link, and the report's count.
- Browser audits:
  - the menu and the codex, with the longest rumour being looked for, read and fit the smallest
    phone;
  - a new audit ends a run that looked in all seven looks at 360×640, and the end says how it
    went and reads.
- Question 10 asks testers whether the story came, and whether they knew it when it did.

**Caveats.**
- **Nine of 98 cases stay under 3 in 4** for the eyes bot: the stories that wait on the country.
  - The end screen says *Its story did not come this time*, which is true, but not why.
  - A line on where to look would help a player steer: order high, the base content, a corrupt
    minister. It is not built, because it gives away more of a story than a rumour does. Say if
    testers ask for it.
- **Finding an ending ends the run**, at about card 25 once it is taken. A player looking for
  endings one after another plays short runs.
  - The codex gives one new rumour a run, so this comes to about one ending a run at most.
- **A link to a pursued run looks for the sender's ending** for whoever opens it, since it is the
  same run. Their own looking waits for their next run.
- **The bots follow a rumour perfectly.** A person may miss the story's turn, or not know it for
  the story they want. Question 10 asks.
