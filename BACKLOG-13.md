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
  - Phase 84 measured it again on the same seeds, each crisis with the same trait and flaw:
    24–30% for the informed voter and 61–66% for the eyes bot, with no pair 10 points apart. The
    spread above is mostly the sample: about 100 runs a crisis, each with its own trait and flaw.

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
  - Phase 84 found that this was mostly the sample. On the same seeds, the median pair differs by
    2 points, and none by 10.
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
  - On the same seeds the crisis alone is 24–30% (phase 84). The spread by setup may be partly
    sample too; it has not been measured that way.
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

## Phase 84. Pick your trouble, crises only (idea 8) — *done*

**Shipped in v0.92.0.** Only a run that takes the second crisis is dealt differently, and a run's
code already says which crisis it has, so the deck is still g8u7egs4 and no code changes format.
Both saves keep their versions:
- a run keeps the crisis it passed over, and one saved before passed over none;
- a reign in the chronicle keeps which it chose, and one from before says nothing of a pick.

- **On the menu.** A run of the player's own offers two crises, under *You inherit, your pick of
  two*: the one its setup deals, and one more.
  - Each says what it starts higher or lower, as the setup has since phase 73. The summary under
    them keeps the trait and the flaw, and its edges count the crisis taken.
  - The first is taken until the player presses the other. A new seed starts again at its first,
    even when it offers the one taken before, so every second crisis the report counts was
    pressed for its own run.
  - Not offered in the first term, whose one era keeps what it was dealt, nor when taking over:
    a line's next reign keeps the crisis it is dealt. The daily, the week's scenario and a link
    keep theirs.
- **The offer.** The second crisis comes from dice the seed keeps for it alone.
  - The same seed and side always offer the same two, and each crisis comes second about a tenth
    of the time.
  - The trait and the flaw stay as dealt. Keeping the first crisis deals, card for card, the run
    the seed always dealt.
- **The code.** A run's crisis was already in its code, so a run that took the second is written,
  replayed, shared and taken down its other road with it. The crisis passed over is not in the
  code: the run's save keeps it, and so do a replay and the other road.
- **What says so.**
  - The chronicle, under the reign: *Chose a war over a leak*.
  - The share text: *Chose a war over a leak.*
  - The playtest record keeps the crisis passed over. `npm run playtests` has a new section: how
    many runs were offered two, how many kept the first, and how often each crisis was taken and
    passed over.

**Measured first.** The same 1,000 seeds, from 700,000 on alternating sides, each played under
every one of the ten crises with the trait and the flaw it was dealt.

| Crisis | Informed: survived; Ascent | Eyes: survived; Ascent |
|---|---|---|
| A recession | 98.2%; 28.4% | 95.4%; 62.0% |
| A pandemic | 98.0%; 24.2% | 96.9%; 63.7% |
| A war | 97.7%; 28.0% | 95.2%; 63.2% |
| A disaster | 96.8%; 27.8% | 96.7%; 64.8% |
| A drought | 97.8%; 24.7% | 96.6%; 61.5% |
| A leak | 97.8%; 28.5% | 97.0%; 66.3% |
| A failed coup | 96.8%; 27.2% | 95.4%; 61.1% |
| A debt crisis | 97.5%; 25.8% | 95.6%; 62.5% |
| Blackouts | 97.8%; 25.3% | 96.7%; 61.0% |
| A predecessor who will not leave | 98.1%; 30.1% | 97.0%; 66.2% |

- **Pairs.** Of the 45, the median pair's Ascent differs by 2.2 points for both bots. The widest
  differ by 5.9 (informed: the pandemic and the predecessor) and 5.3 (eyes: the leak and the
  blackouts). No pair is 10 points apart for either bot.
- **Noise.** On these seeds a pair's gap has a standard error of about 1.7 points, so the median
  pair's is inside it.
  - 11 pairs (informed) and 13 (eyes) differ by more than twice that. Against a bar set for 45
    comparisons, one pair passes for the informed voter and none for the eyes bot.
  - The predecessor is the one crisis both bots find easier than most.
- **An offer of two,** the crisis dealt and the seed's second:

| | Informed: survived; Ascent | Eyes: survived; Ascent |
|---|---|---|
| The crisis dealt | 97.6%; 28.3% | 96.9%; 64.3% |
| Always the easier of the two | 97.7%; 30.0% | 96.6%; 66.2% |
| Always the harder | 97.4%; 25.8% | 96.1%; 60.7% |

  - Which is easier is read off the table above, from the same runs, which flatters it. Read off
    half the seeds and scored on the other half, the easier is 1.8 points up for the informed
    voter and 1.6 for the eyes bot.
  - The two offered differ by 2.1–2.2 points (median) and 4.3–4.8 (p90).

**The audit's number was not the crisis.** Idea 8 was chosen on 17% under a recession to 36% in a
war, and 10 points or more in 27% of pairs. That came from 1,000 runs grouped by the crisis each
was dealt: about 100 runs a crisis, each with its own trait and flaw.
- Measured that way on today's game, the spread is still wide: 21–36% for the informed voter,
  with 10 pairs of 45 that far apart, and 54–74% for the eyes bot, with 12.
- Its order is not the same seeds' order. Grouped, the pandemic is the eyes bot's easiest crisis,
  at 74%. On the same seeds it is 64%, the middle of the table.
- So the pick is a choice of story, not of difficulty. What a crisis changes is which meters start
  low, which stories come more often, and, for a debt or the blackouts, a rule of the run.
- The audit's line, idea 8's reason and BACKLOG-12's idea 7 now point here.

**Tests.**
- The engine:
  - the offers of 1,000 seeds: the first is the crisis dealt, the second another, the same every
    time, and every crisis comes second more than 60 times;
  - the trait and the flaw stay as dealt, and keeping the first deals the same 60 cards (40 seeds);
  - the pick goes into the run, and the crisis passed over survives a replay;
  - a crisis that was not offered, the run's own or a trait cannot be passed over.
- The menu:
  - it offers the two with the first pressed, and the summary loses its crisis row;
  - the second can be taken, and the run takes it and remembers the first;
  - a new seed starts at its first, even when it offers the one taken before, and a side offered
    the same two keeps the pick;
  - nothing is offered in the first term, when taking over, or by the daily.
- The chronicle's line and the share text's.
- The playtest record reads every kind of run code the game writes, with the crisis passed over.
  The report's count leaves out a pair its seed could not have offered.
- Browser audits: the menu with the pick, either crisis pressed, reads and fits at 360×640; the
  chronicle, with the longest pair of names, too.
- Question 11 asks testers how they chose between the two.

**Fixed on the way.** `npm run playtests` refused a whole record for holding one run of three
kinds:
- a platform of two promises, since phase 62;
- a run that took over the country, since phase 63;
- a run that went looking for an ending, since phase 83.

The pattern it checked each run's code against knew formats 1 and 2, and one promise. No record
from people had come in, so nothing was lost. The first tester to play any of those would have
sent a file the report could not read. A test now writes a run of each kind and reads it back.

**Caveats.**
- **For the bots, the pick barely moves the odds:** 2 points between the median pair, 6 at most.
  If it is to be a lever, the crises have to be made to differ. That belongs to idea 15, a setup
  you can feel.
- **The menu says what each crisis starts, not how it tends to go.** A recession starts Money much
  lower and reads as the hard one. For the bots it is in the middle of the table.
- **The crisis passed over is not in the run code.** Someone who opens a link to a run that took
  the second crisis plays that crisis, and their chronicle and share text say nothing of a pick.
- **A player can take the same crisis every run** it is offered. Nothing stops it; the chronicle
  shows it.
- **The first term offers no pick,** so a new player meets it on their second run at the earliest.

## Phase 85. Contracts that know the rival (round eleven's idea 10, its contracts half) — *done*

**Shipped in v0.93.0.** Nothing is dealt differently, so the deck is still g8u7egs4. Both saves
keep their versions: a run saved before counts the rival's moves from where it is.

A week's contracts are dealt from its number and the pool, so adding to the pool changes every
week it can deal. The new contracts are therefore dealt only from week 3, Monday 5 October, the
first week to begin after this version shipped. Weeks 1 and 2 keep the contracts they were dealt,
and a test holds them to it.

- **Two new contracts:**
  - Easy: *Keep someone the rival tries to hire away, lose nobody to them, and see the reign
    through.* The rival offers a minister a job from the third rung, "The obvious alternative".
    Keeping them is the card's self-serving side, and costs money.
  - Fair: *Win an honest vote the rival stands in by name, and see the reign through.* The rival
    stands by name at a vote held at the top rung, "Ready to take the office off you".
- **The third the idea named was already there.** *Lose the office at a count, win it back
  honestly, and see the reign through* has been a fair contract since phase 60.
- **The engine counts both** in the run's stats, `rivalBeaten` and `poachRefused`. Only the
  contracts read them.
- **Over weeks 3 to 106,** keeping the cabinet is dealt in 14 of 104 weeks, the vote by name in
  23, and the office won back in 17. Half the weeks deal one of the three.
- `npm run contracts` measures the new two with a player aiming at each: one keeps everyone the
  rival tries to hire; the other lets the rival climb on their own cards, then counts every vote.

**Measured first.** Five candidates, 500 runs a policy, on the runs `npm run contracts` plays.

| Contract | Best, aiming | Without aiming | Built |
|---|---|---|---|
| An offer turned down, nobody lost, seen through | 57.2% (mixed) | 8–15% | Easy |
| The rival beaten by name at an honest count, seen through | 36.6% (mixed) | 20.6% (eyes) | Fair |
| The rival back on the bottom rung at the end, seen through | 49.0% | 47.6% (informed) | No |
| The Ascent finale, the rival never at the top rung | 24.8% | 21.8% (informed) | No |
| A scandal the rival brought, answered, seen through | 27.4% | 18.6% (greedy) | No |

- **Left out:**
  - The bottom rung is the informed voter's ordinary Muddle: it keeps it without aiming, and it is
    close to *the Muddle finale, cheating no vote*.
  - The Ascent without the rival at the top is close to *the Ascent finale, cheating no vote*.
  - The scandal answered would need the scandal cards marked in the content. The deck's stamp
    hashes every field of a card but its words, so that moves the deck, and every link and save
    from before would say it came from another deck.
- **How often the rival makes each move,** by player: an offer to someone in the cabinet in 25% of
  the informed voter's runs and 54–62% of the eyes, mixed and greedy bots'; a vote by name in 10%
  and 36–47%; someone gone over in 17% and 43–47%.

**What it means.**
- **Established, for bots:** keeping the cabinet takes one or two runs of a player who lets the
  rival reach the third rung and keeps who they try to hire. The vote by name takes two or three
  runs of a player who lets them reach the top and then wins the count.
- **The careful player seldom meets either.** The informed voter is offered a job for someone in a
  quarter of its runs and meets the vote by name in a tenth: 23% and 6% at best. Like the Ascent
  contracts, these are easy or fair for a player who lets the rival grow. Aiming at them means
  doing so on purpose.

**Found on the way: five of phase 60's contracts have drifted out of their tier.** The deal has
changed since v0.68.0. `npm run contracts` now reads, a player aiming at each:

| Contract | Tier | Band | Now |
|---|---|---|---|
| Twenty cards without a self-serving choice | Easy | 50–90% | 49.6% |
| Keep "Nobody under forty" to the finale | Fair | 20–50% | 51.6% |
| "The schools were starved" in the record | Fair | 20–50% | 17.2% |
| Every group above sixty at the end | Hard | 7–20% | 21.0% |
| "The seawall stands" in the record | Hard | 7–20% | 3.8% |

- Three are within the sample's error of their band's edge (about 2 points at 500 runs).
- Two are well outside. The seawall takes a player aiming at it 26 runs, and phase 60 left out
  any legacy under one run in fourteen. The schools legacy belongs in the hard tier.
- **Not changed here.** Moving a contract between tiers, or dropping one, changes every week that
  can deal it. It could be done from a week not yet begun, as the rival's were added. Neither is
  a goal of the week's scenario, whose table is fixed. Phase 87 did it from week 4.

**Tests.**
- The engine counts a vote won honestly against the rival by name, and not one lost, cheated or
  held against nobody. It counts an offer turned down, and not one taken. A run saved before the
  counts counts on from where it is.
- The contracts:
  - weeks 1 and 2 deal what v0.92.0 dealt, and nothing added later;
  - from week 3 each new one comes up in its tier;
  - each is kept only for what it asks, and not by a run saved before the counts;
  - real reigns aiming at each keep it, in a week that deals both.

**Caveats.**
- **A device still on v0.92.0 in week 3 deals week 3 from the old pool,** so two players can see
  different contracts until the older one updates. The service worker updates on the next visit,
  and week 3 starts a week after this version shipped.
- **A run under way when v0.93.0 loads** counts the rival's moves from then on. An offer it turned
  down, or a vote it won, before the update does not count.
- **Keeping the cabinet asks for the offer card's self-serving side,** as the legacy contracts
  ask for a self-serving legacy. It is a strategy against the rival, not a policy.
- **Weeks 3 to 11 happen to deal the rival's contracts often:** keeping the cabinet in 3 of 9, the
  vote by name in 4. Over 104 weeks it is 14 and 23.
- **Objectives were not taught the rival.** They carry the unlocks, which change what is dealt, so
  they wait for the rules half, item 13.

## Phase 86. An end screen that does not repeat itself (round eleven's 8, the half left) — *done*

**Shipped in v0.94.0.** On screen only: nothing is dealt differently, so the deck is still
g8u7egs4. The run's save is unchanged. The profile keeps one more list, and its version is
unchanged: a profile from before has read no follow-ups.

- **What a player has read on an end screen before folds into a line** they can open:
  - *Read before: how it ends*: the ending's words, when the profile has reached that ending;
  - *Read before: where it went*: the epilogue, under its heading and band, when the profile has
    read it;
  - *Read before: The housing was built · The schools were starved*: the follow-ups of "What
    became of it" read before, under the names of their decisions, each with its road back.
- **The new lead.** The follow-ups new to the player come first, in full, and the folded line
  after them. A decision's follow-up is read in the band it was told in: the same decision ended
  in another band says something new, and is new.
- **The profile keeps** the follow-ups each end screen showed, as `flag:band`. It already kept
  the endings and the epilogues.
- **An end screen with nothing to say what was read** folds nothing: one put back after a reload,
  or a profile's first.
- **Not folded:**
  - the history's name, which is new on nine end screens in ten;
  - the timeline and the record, whose facts are the run's own;
  - the share text and picture.

**Measured first.** 100 players a bot, each playing 20 runs on one profile, dealt as the game
deals them: the first a first term.

| On the end screen of run | 1 | 3 | 5 | 10 | 20 |
|---|---|---|---|---|---|
| Eyes: the ending's words read before | 0% | 49% | 80% | 90% | 95% |
| Eyes: the epilogue read before | 0% | 0% | 52% | 90% | 97% |
| Eyes: the name given before | 0% | 1% | 4% | 12% | 15% |
| Eyes: every follow-up read before | 0% | 0% | 0% | 0% | 17% |
| Eyes: the fixed words read before | 0% | 18% | 36% | 54% | 70% |
| Informed: the ending's words read before | 0% | 44% | 63% | 91% | 97% |
| Informed: the epilogue read before | 0% | 1% | 43% | 84% | 91% |
| Informed: the fixed words read before | 0% | 12% | 24% | 47% | 62% |

- **The fixed words** are the ending's, the epilogue's and the follow-ups': about 104 on a
  screen, 14 of them the ending's and 18 the epilogue's.
- **The follow-ups repeat most, by words:** 27 of 72 by the tenth run for the eyes bot, 43 by the
  twentieth. Rarely are all of them old at once, so leading with the new ones matters more than
  folding the section.
- **The ending's words and the epilogue** are old on nine end screens in ten by the tenth run, as
  the idea said. They are short, so folding them shortens the screen little. It puts what is new
  first.

**Tests.**
- The profile keeps the follow-ups shown, each once, and reads them back by band. It says whether
  the ending's words and the epilogue were read, and reads a moved profile's list carefully.
- The end screen:
  - the first time, everything is in full;
  - after, the ending's words and the epilogue fold into lines that open on them;
  - the new follow-up leads, and the ones read fold after it under their names;
  - with every follow-up read, the section is one line;
  - with no fold, nothing folds.
- A browser audit plays a profile that has read everything to its end in all seven looks at
  360×640. Each end folds the ending, the epilogue and the follow-ups, and reads and fits closed
  and open.
- Question 4 now asks testers whether they opened the folded lines, or missed what they hid.

**Caveats.**
- **Folded is not the same as read.** The profile knows what an end screen showed, not what the
  player read: one who skipped it last time finds it folded now. The line opens on it.
- **A profile from before this version** has read no follow-ups, so they show in full once more
  each. Its endings and epilogues fold at once, from what it always kept.
- **A second road that ends as the first did** folds the ending read minutes before.
- **Whether people want it folded is not known.** Round eleven's measure first, whether the
  repetition is felt, is question 4, and waits on testers.

## Phase 87. The contracts back in their tiers (phase 85's finding) — *done*

**Shipped in v0.95.0.** No card or run is dealt differently: the deck is still g8u7egs4. The
weekly contracts change from week 4, Monday 12 October 2026, and weeks 1 to 3 deal what v0.94.0
dealt. The run's save and the profile are unchanged.

- **"The seawall stands" is no longer dealt.** A player aiming at it keeps it one run in 26. The
  hard tier asks one in five to fourteen, and phase 60 left out any legacy under one in fourteen.
- **"The schools were starved" moves from the fair tier to the hard,** in the seawall's place: a
  player aiming at it keeps it one run in six. A week that would have dealt the seawall deals the
  schools.
- **The clean run asks eighteen cards, not twenty.** A player who never serves themselves is
  never made to, so a run misses it only by ending first. 46% last twenty cards, and 63%
  eighteen. No week had dealt it yet (week 9 is the first), so nobody kept it on twenty.
- **A contract kept before it moved still reads as kept,** in the tier it was dealt in. A
  profile's record names its contracts, so every name ever dealt stays good.
- **Left as they are:**
  - "Nobody under forty" kept to the finale, at 52%, on the fair tier's 50% line. Moving it
    would put it on the easy tier's line instead, and change the easy and fair deal of most weeks
    from week 4.
  - Every group above sixty, at 19.5% on fresh seeds, inside the hard tier. The 21.0% phase 85
    read was the sample's.

**Measured first.** Each figure is the best of the ways a player could aim at the contract, as
`npm run contracts` plays them. Phase 85's 500 runs are seeds 900,000 on; the 2,000 more are
seeds 910,000 on, with a 95% margin of about 2 points.

| Contract | Tier | Band | 500 runs | 2,000 fresh runs |
|---|---|---|---|---|
| Twenty cards without a self-serving choice | Easy | 50–90% | 49.6% | 46.0% |
| Eighteen cards without one | Easy | 50–90% | 64.2% | 62.7% |
| Keep "Nobody under forty" to the finale | Fair | 20–50% | 51.6% | 52.1% |
| "The schools were starved" in the record | Fair, now hard | 7–20% | 17.2% | 17.8% |
| Every group above sixty at the end | Hard | 7–20% | 21.0% | 19.5% |
| "The seawall stands" in the record | Hard, now none | 7–20% | 3.8% | |

- **The clean run.** The median run of a player who never serves themselves lasts 19 cards: 46%
  last twenty, 63% eighteen, 81% fifteen.
- **The whole pool from week 4,** at 500 runs a contract on phase 85's seeds: every contract in its
  band but the two left as they are, just over their lines, "Nobody under forty" at 51.6% and
  every group above sixty at 21.0%.

**What the weeks deal.** Weeks 1 to 18 deal just what v0.94.0 dealt; the first to differ is week
19, from 25 January 2027. Of the first 160 weeks, 23 differ:
- 9 deal the schools where they dealt the seawall;
- 14 deal another fair legacy: the fair tier's legacy picks from two where it picked from three,
  so 10 weeks that dealt the schools deal the skim, and 4 that dealt the skim deal the press.

The easy tier deals the same in every week.

**Tests.**
- Weeks 1 to 3 deal what v0.94.0 dealt; the seawall is in their pool, and the schools as a hard
  contract are not.
- From week 4 neither the seawall nor the schools as fair are dealt, and the schools as hard come
  up.
- A contract kept before it moved reads as kept, in its old tier, and a run keeps it as before.
- The clean run asks eighteen cards, and no week before week 9 deals it.
- Every contract the pool deals from week 4 comes up within 400 weeks.

**Caveats.**
- **A device still on v0.94.0 deals the same weeks until week 19,** but reads the clean run as
  twenty cards when week 9 deals it.
- **The bands are for bots aiming well.** People may find the clean run harder: the saint bot
  sees every card's honest side, which a person has to judge.
- **"Nobody under forty" sits on a line** whichever tier holds it. Its three aims read 44–52%.

## Phase 91. The last era decides: a question an era (idea 4, first half) — *done*

**Shipped in v0.99.0.** It changes the deal: the deck is now aszkbk6a, from g8u7egs4. The
reckoning, the idea's second half, is not built.

- **A question an era.** A run may have been asked one question by the end of its first era, two
  by the end of its second and three by the end of its third, and every question can now begin
  in the third. A question the first era did not ask can come in the second. Before, the 32 could
  begin only in the first two eras, and a run's budget of three was spent early: the third era
  asked none.
- **A first term is the ordinary game's first era,** as it has been since BACKLOG-10 phase 59, so
  it asks one question where it asked two. A long reign asks as the ordinary game does, and has
  asked all three by its fourth era.
- **In the code:** `questionsDue` in `src/engine/draw.ts` is the share, and the 32 questions, and
  their first cards, take the third era in. `DEAL_VERSION` is 10.
- **"A whole era without one self-serving choice"** is not dealt from week 4: see the contracts,
  below.

**Measured first.** 1,000 runs a bot on seeds 1 to 1,000.

| The informed voter | Before | After |
|---|---|---|
| Questions begun, era 1 / 2 / 3 | 2.19 / 0.70 / 0.00 | 0.95 / 0.98 / 0.98 |
| Cards from questions, era 1 / 2 / 3 | 4.99 / 1.97 / 0.04 | 2.12 / 2.43 / 2.49 |
| Decisions that leave a legacy, era 1 / 2 / 3 | 5.85 / 1.94 / 0.58 | 4.75 / 2.19 / 1.48 |
| Runs seen through, named for a decision in era 1 / 2 / 3 | 55% / 33% / 12% | 31% / 41% / 28% |
| Questions a run | 2.90 | 2.92 |

- **The measure asked for:** runs seen through named for a third-era decision. The eyes bot and a
  person-like player move as the informed voter does: 27% of their runs, from 10–11%.
- **Letting questions begin in the third era, without the share,** did little: 0.09 a run began
  there, and the third era named 12–13% of runs, since the budget was spent by then.
- **The band is decided later too.** The band at card 70 is the one a run ends in for 73% of the
  informed voter's runs seen through (77% before), and 78% of the eyes bot's (82%).
- **Which names runs get.** A question names about 58% of runs seen through, before and after,
  and the informed voter's 966 runs seen through were given 182 different names, where 975 were
  given 179.
- **Every harness target holds,** at 5,000 runs a bot, and the long reign's at 10,000:
  - the informed voter reaches the Ascent in 26.4% (25.9% before), and the mixed bot in 13.8%
    (13.8%);
  - random runs last a median 50 cards (48), no cause ends more than 18.8% of them (17.1%), and
    the greedy bot ends in the Decay in 76.4% (76.7%);
  - in the long reign the mixed bot reaches its fifth era in 96.4% and sees its finale in 92.9%,
    and a random run past its third era finishes in 9.5% in the Decay and 48.0% on the Ascent.
    At 2,000 runs that last read 12.6% and 25.0%, a miss: 8% of random runs reach era 4, and few
    of those are on the Ascent. At the harness's own 10,000 runs it passes before and after.
  - The eyes bot, a line for information, reaches the Ascent in 60.9% (63.2%): the third era's
    question asks the honest way or the fast way, and the eyes bot often takes the fast one.
- **First terms,** 2,000 a bot: one question where there were two (0.96, from 2.22 for the
  informed voter). As many are seen through, 99.3% of the informed voter's, and more random ones,
  68.5% from 62.6%.

**The contracts.** `npm run contracts`, 500 runs a policy: every contract stays in or near its
band as before, but one. At 3,000 runs a player never serving themselves lasts a whole era in
4.0% of runs, from 7.9%: one in 25, where the hard tier asks one in five to fourteen. The easy
clean run, eighteen cards, is 57.7% from 64.1%, still in its tier.
- Most fall at the first vote, with its campaign from card 23: 38% of them last twenty cards and
  9% twenty-four. Past the vote no length of run keeps them clear of the tier's floor (7.0% at 26
  cards, 5.7% at 30), so the contract is not dealt at another length. It is not dealt from week
  4, 12 October (`SAINT_ERA_UNTIL`); weeks 2 and 3 deal it as their hard contract, as every
  device already deals them.
- The likely reason, not measured: the first era deals about three fewer question cards and as
  many more ordinary ones, where the honest side is the costlier.
- 49 of the first 160 weeks deal something else in its place: 25 "all three of your groups above
  sixty", the rest a hard legacy. No other week changes.

**The weeks' scenarios.** Weeks 3 to 156 were searched again on the new deck
(`npm run scenarios -- --from 3`): 3,764 candidates in 43 minutes, every week searched in its
band, the informed voter meeting a week's goal in 34.6% of runs and the eyes bot in 34.1%. Week
2, under way, keeps its goal, and meets it in 43% and 41% on the new deck; week 3 found the goal
and seed it had.

**Tests.**
- The share: one by the end of the first era, two and three by the second and third; the same in
  a long reign; a game of one era has the whole budget.
- On a fixture, the questions come at the start of each of three eras, one each; on the game's own
  deck, never past the share, and the last era asks one in more than 80% of runs that reach it.
- A first term still deals the first 35 cards of the full run on its seed.
- The hard clean run is dealt in weeks 2 and 3, and never from week 4; the hard tier still deals;
  a profile that kept it still reads it.
- The front page's test of an era that decided nothing searched 60 runs for one; since such an era
  is about one run in a hundred now, it searches up to 600.

**Caveats.**
- **A run saved before the update** plays on under the new deal from where it is, as a run from
  another deck always has, and its end screen cannot deal it again for its chart.
- **A link sent before the update** names the old deck: the offer says it was played on another
  version, and the end sets the two runs side by side without comparing them.
- **Today's daily** deals differently after the update than before it, for the rest of the day.
- **A first term meets one question where it met two.** A new player sees fewer of them in the run
  that teaches the game. The first term's promise, the ordinary game's first era, decided it.
- **The hard clean run is one run in 25 in weeks 2 and 3,** until it stops being dealt.
- **Questions dealt late miss the runs that end early:** 1.6% of the informed voter's end before
  the third era (1.3% before), and 3.7% of a person-like player's (3.9%).
- **"The last era decides" only as far as a question can.** Questions name runs in the middle of
  history's order: a run carrying a great story's legacy, a ring or a ship, is named for that
  whenever it was decided. The reckoning is the half that would decide more.

## Phase 92. The last era decides: the reckoning (idea 4, second half) — *done*

**Shipped in v0.100.0.** It changes the deal: the deck is now z1rhb4xy, from aszkbk6a. With phase
91, idea 4 is done.

- **The reckoning.** Once a run, in the ordinary game's last ten cards and in office, the engine
  deals a card that asks what becomes of what the reign will be remembered for: the highest legacy
  in history's order that the reign left, not one it took over, and that a reckoning is written
  for. It comes after any vote due, so it is the card after the last count, the 97th, in 99.7–99.9%
  of the runs that meet it. A long reign meets it where the ordinary game does, or, out of office
  through those ten cards, when it returns; a first term ends first.
- **Three are written, each opening on the legacy in its own words:**
  - **the sale,** for eight things the state owns that a reign built, funded or leased (the ring,
    the port, the seawall, the levee, the stadium, the oracle, the housing, the moonshot): your
    donors will take it off the state's hands;
  - **the decree,** for any answer to a question: the next government means to reopen it, and a
    decree would put it beyond the chamber's reach;
  - **the files,** for 68 legacies, all but six of those a reign can leave before it: they open
    the day you leave, unless you seal them for fifty years.

  Where two are written for the legacy, the seed's order picks one. Each asks the honest way (keep
  it, let the chamber decide, let them open) against the self-serving one, and none scores a
  policy: the decree is about how an answer is kept, not what it was.
- **What it leaves.** The self-serving side of the sale renames the reign, "The Closing-Down Sale"
  and the like, and so does the decree's, "The Last Decree"; each ranks just above what its card
  is written for. Sealed files are told first in what became of the reign, and never name it:
  history now has legacies it records and does not name a reign for (`unnamed` in
  `histories.json`), with no titles, which the codex does not count. All three have front-page
  headlines in every band.
- **Told besides the rest.** What a reign leaves at its reckoning is its last act (`lastActs` in
  `histories.json`), and the end screen tells it besides the four decisions it follows up on.
  Ranked among them, it pushed the office lost or won back out of the four: of the runs that went
  out, on 3,000 runs a bot, one of the two was among them in 87–91%, and is now in 94–96%, as
  BACKLOG-11 phase 70 measured it (95–97%). The timeline dates the office lost in every such run
  measured, either way. The content gate holds every legacy a reckoning leaves to be a last act.
- **On the card,** "The reckoning" is its title where a question's goes, and a screen reader hears
  it with the card. `{legacy}` in a reckoning's text is filled with the legacy's own words: the
  highest of those the card is written for that the run left, which is the one it was dealt for.
  The content gate holds the text, filled with its longest legacy, under 160 characters.
- **In the code:** `reckoningDue` and the reckoning's place in the draw in `src/engine/draw.ts`,
  `reckonedLegacy` in `src/engine/reckoning.ts`, the cards in `src/content/cards/reckoning.json`
  (`reckons` lists what each is written for), and `reckoningCards` in the config. `DEAL_VERSION`
  is 11, and history's order, which picks the legacy reckoned, is in the deck's stamp.

**Measured first.** 1,000 runs a bot on seeds 1 to 1,000. Of the runs that reach the ordinary
game's last ten cards, 97–99% meet a reckoning; 56% of them the files, 33% the decree and 11% the
sale. The informed voter takes the self-serving side in 79%, the eyes bot in 58% and a person-like
player in 51%.

| Runs seen through | Informed | Eyes | Person-like |
|---|---|---|---|
| Named for a third-era decision, phase 91 → now | 28% → 54% | 27% → 49% | 27% → 46% |
| Named by a reckoning's name | 32% | 25% | 23% |
| Different names given, phase 91 → now | 182 → 179 | 158 → 156 | 161 → 158 |

**Where its names rank decided it.** A name at the top of history's order takes every reign that
earns it. For the informed voter:

| The reckoning's names | Named for a third-era decision | By a reckoning's name | Different names |
|---|---|---|---|
| All three at the top | 84% | 77% | 123 |
| The sale's and the decree's above what they reckon (shipped) | 54% | 32% | 179 |
| And the files' among the questions | 59% | 39% | 155 |
| And the files' just above the scandals | 57% | 36% | 161 |
| The sale's alone | 35% | 9% | 183 |
| None | 27% | 0% | 177 |

The files are dealt most, for nearly any legacy, so wherever their names ranked, the reigns below
them would share their nine: at either place measured, 155–161 different names where the shipped
design gives 179.

**The rest held.**
- **Every harness target holds,** at 5,000 runs a bot, and the long reign's at 10,000:
  - the informed voter reaches the Ascent in 25.9% (26.4% in phase 91), and the mixed bot in
    14.1% (13.8%);
  - random runs last a median 50 cards (50), no cause ends more than 18.7% of them (18.8%), and
    the greedy bot ends in the Decay in 75.5% (76.4%);
  - in the long reign the mixed bot reaches its fifth era in 96.4% (96.4%) and sees its finale in
    92.7% (92.9%), and a random run past its third era finishes in 7.5% in the Decay and 42.1% on
    the Ascent (9.5% and 48.0%);
  - the eyes bot, a line for information, reaches the Ascent in 61.1% (60.9%).
- **The band after card 95** changes in 29% of the informed voter's runs seen through (27% before),
  and in 21–24% of the others' (22–23%).
- **The contracts,** `npm run contracts`, 500 runs a policy: none moves out of its band, and the
  two just over their lines stay there, "Nobody under forty" at 52.6% and every group above sixty
  at 21.0%.
- The codex has 693 names written and 675 a run can be given, from 675 and 657, and 1,819 cards,
  from 1,816.

**The weeks' scenarios.** Weeks 3 to 156 were searched again on the new deck
(`npm run scenarios -- --from 3`): 4,227 candidates in 44 minutes, every week searched in its
band, the informed voter meeting a week's goal in 35.9% of runs and the eyes bot in 34.3%. Week 2,
under way, keeps its goal, and meets it in 43% and 42% on the new deck; week 3 found the goal and
seed it had.

**Tests.**
- A reckoning comes once a run, in office, in the ordinary game's last ten cards, to more than 90%
  of the informed voter's runs that get there. It answers for the highest legacy in history's
  order a reckoning is written for, picks between two by the seed's order, and opens on the
  legacy's words.
- It is not dealt for a legacy the reign took over, out of office, or before its window. A first
  term never meets it; a long reign meets it at the same card, and the same one, as the ordinary
  game on its seed.
- Reckonings are never in the pools, and every legacy one is written for is one history ranks.
- In history, the sale and the decree rename a reign, each ranking just above what its card is
  written for, and the great works and the powers seized still keep theirs. Sealed files come
  first in what became of a reign, with no titles and no name in the codex. All three have
  headlines.
- On screen, the card is titled "The reckoning" and opens on the legacy, and a screen reader hears
  both; no other card is titled so. The browser audit puts the longest reckoning, filled, on the
  table in all seven looks at 360×640, both sides.
- A reckoning opens on the highest legacy the card itself is written for: the sale, on a run that
  also abolished the vote, still opens on what it would sell.
- The small-phone fit check places each side's longest reckoning as a kind of its own, filled with
  the longest legacy it is written for, at every phone height. Its placeholder had made it a card
  with a name, and the longest of those, in the placeholder's fallback words, had taken the place
  of the longest card that names a person.
- In what became of a reign, a last act is told besides the four decisions followed up on, and
  pushes none of them out; every legacy a reckoning leaves is a last act.
- The test that every legacy has its names now leaves out the one that names none; the country's
  drawing leaves the three undrawn, since each changes who owns a thing or who may read or undo it.
- The deck stamp's test knows a reckoning's legacies are what it deals by and their words are
  wording. The content carries the legacies as a list in history's order, each with its words, so
  the stamp hashes the order and not the words.
- **The long reign's harness test** plays the random bot's 10,000 reigns, where it played 1,500.
  Its target, that Decay is the hard place for a random reign that gets past its third era, was
  measured against the random reigns that got there on the Ascent: one of 1,500 on the test's
  seeds, which did not finish, so the test missed at 0%. At 10,000, 19 get there and 8 finish,
  42.1% against Decay's 7.5%, and the harness passes as it did. The test takes about 40s more.

**Caveats.**
- **A run saved before the update** plays on under the new deal from where it is, and its end
  screen cannot deal it again for its chart. **A link sent before the update** names the old deck.
  **Today's daily** deals differently after the update, for the rest of the day.
- **The bots take the self-serving side more than people may,** 51–79% of the time. If people
  keep what they built, a reckoning renames fewer reigns than measured. That share is a guess
  until people play it.
- **Sealed files are recorded, never named.** A reign that sealed them is told so first, and keeps
  the name it earned.
- **Six legacies a reign can leave before it have no reckoning:** losing office, winning it back,
  the three habits and the habit of the cheap win. A run that left only those meets none.
- **A long reign meets it in its third era,** the ordinary game's last, and lives two more with
  what it chose: a long reign plays as the ordinary game does until its fourth era. One out of
  office through the ordinary game's last ten cards meets it on its return, in its fourth era: 2.1%
  of the informed voter's long reigns and 2.5% of a person-like player's, on 1,000 each.
- **A first term never meets it,** and neither does a reign out of office at the end.
- **The end screen can follow up on five things where it followed up on four,** in a run that
  took a reckoning's self-serving side. The chronicle of past reigns, which lists three things
  each left, lists sealed files first, and a reign's third thing goes under ", and 1 more".
- **The random bot's long reign target stands on 19 runs** even at 10,000. It passes with 14
  points to spare, and a change to the deal can still move it past its line.
