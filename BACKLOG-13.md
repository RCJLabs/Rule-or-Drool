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
