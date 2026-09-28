# Backlog, round fourteen: depth, play and interaction

Round thirteen (BACKLOG-13.md) is phases 80–87: v0.88.0 to v0.95.0. Its ideas 2, 4, 7, 9 and 10
are left, with the open ideas of the rounds before it, in its order (items 8–18). BACKLOG-2's
phase 17, getting onto Play, still waits on the owner. The closed test is next.

You asked for ten new phases on depth, gameplay and interaction. This round measured the game as
it ships, v0.95.0, for:
- what a decision is: how many kinds there are, and what the screen shows before one;
- how far a rule a player could say in a sentence gets;
- which decisions change how a run ends, and whether the screen marks them;
- how much better play could do;
- what the game remembers, and of whom.

Each idea says:
- what it is;
- what the audit found that points to it;
- a rough cost, and the risk;
- whether it changes what is dealt (the deck), which decides whether it can go in during the
  closed test;
- what to measure before building it.

Numbers are from bots on v0.95.0, deck g8u7egs4, unless a line says otherwise. The usual sample is
1,000 runs a bot from seed 700,000 on alternating sides, with every unlock. The eyes bot decides
only from what the screen shows a person (BACKLOG-10 phase 57), so it is the best stand-in for
people there is. It may still read the screen better than a person does. How people play is a
guess until their records come in.

## What the audit measured

### Where it falls short

**1. Every decision in a run is one of two, and comes when the deal brings it.**
- An ordinary reign is about 105 decisions, each left or right on a card. Appointments, votes,
  campaigns and the rival's offers are cards too.
- The setup has three to six choices: the side, the crisis, promises, a fresh start or a takeover,
  and the length. The codex has the pursuit.
- In the run nothing is chosen from more than two, and nothing at a moment the player picks. The
  cabinet only shows who sits.
- A side moves the same meters by the same amounts in any state. Only the band, the era and the
  speaker's trait scale it. The state decides which cards come (433 cards, 24%, have a
  condition), never what a card does.
- Before a choice the screen shows which meters a side moves, in three dot sizes and never which
  way; a side that would end the reign; the count on a vote or campaign card; the coup risk; and
  what sent a bill.

**2. One sentence plays most of the game.**

| 1,000 runs a bot | Seen through | Ascent | Muddle | Decay | Self-serving choices (median) | Cards in danger |
|---|---|---|---|---|---|---|
| Honest, always (the saint) | 0%: out at card 19 (median) | | | | 0 | 29.5% |
| Honest unless that side is marked as ending the reign | 47.6% | 47.5% | 0.1% | 0.0% | 26 | 77.6% |
| Honest unless a meter is in danger, then the other side; reads the mark | 78.9% | 15.3% | 31.1% | 32.5% | 44 | 46.3% |
| Eyes: honest unless in danger, then what the dots say is safer; reads the mark | 96.4% | 56.3% | 37.5% | 2.6% | 40 | 45.7% |
| Informed voter | 97.3% | 23.6% | 57.7% | 16.0% | 45 | 1.1% |
| Mixed | 97.6% | 10.7% | 52.5% | 34.4% | 45 | 1.1% |
| Greedy, the steadier side | 99.7% | 0.1% | 20.7% | 78.9% | 49 | 0.1% |
| Random | 5.6% | 0.2% | 1.4% | 4.0% | 22 | 11.5% |

- **A player who reads only the mark** reaches the Ascent in 47.5% of runs: almost every run it
  sees through ends there.
- **Reading the dots in danger** (the eyes bot) takes the runs seen through from 48% to 96%, and
  the Ascent to 56%.
- **Out of danger the eyes bot takes the honest side,** whatever the card: 56% of its cards. In
  danger the honest side reads as the riskier on 83% of them, and it takes the other.
- So a player who reads the screen plays by one rule: honest until the colour says stop. The
  informed voter, the player the balance is set for, turns careful early and reaches the Ascent in
  24%.

**3. A run turns on a few decisions, and the card rarely says which.** 200 eyes runs. Each of
their 20,824 decisions was taken the other way, and the rest of the run played by the same bot.
- The band changes on 28% of flips. Re-rolling only the bot's coin-flips on ties changes it on 6%.
- A run has a median 26 decisions that would change its band (p10 8, p90 57). By era: 39% of the
  first era's decisions, 29% of the second's, 17% of the third's.
- By what the card is, the share of flips that change the band: a vote 57%, a story or question
  39%, a deck card 26%, a campaign card 23%, a bill 22%, an appointment 19%, and a side marked as
  ending the reign 97%.
- **Nothing on the card sets apart the decisions that matter.** Counting the card's own signs (the
  mark, a count line, a story, a receipt, an appointment), 67% of all decisions carry none, and
  61% of those that change the band. The informed voter's are 64% and 61%. Danger is drawn on 45%
  of the eyes bot's cards, the ones that matter and the ones that do not alike.
- On 11% of decisions, about 12 a run, the other side would have ended the run better.
- The informed voter's runs turn on more: 33% of its flips change the band (4% by coin-flips
  alone), a median 32 decisions a run, and 46%, 33% and 21% by era. On 15% of its decisions,
  about 16 a run, the other side would have ended better.

**4. Thinking ahead would win almost every run.** A player who, on each card, plays each side out
to the end as the eyes bot would, and takes the one that ends better:

| 200 runs | Seen through | Ascent | Decisions it takes the other way from the eyes bot |
|---|---|---|---|
| Eyes | 96.4% | 56.3% | |
| Knows the deal to come: plays each side out once, on the run's own seed | 100% | 98.5% | 0.8% |
| Knows the rules and the state, not the deal: four play-outs a side, each on another seed (150 runs) | 96.0% | 92.0% | 19.5% |

- **Knowing the deal**, taking fewer than one decision in a hundred the other way (about one a
  run, the right one) takes the Ascent from 56% to 98.5%. Nearly every run that misses the Ascent
  has a decision or two that would have turned it.
- **Knowing only the rules and the state,** not the deal, it reaches the Ascent in 92% (about 4
  points either way at 150 runs), taking a fifth of its decisions the other way from the eyes bot.
- So the depth is in the game's systems. What a person lacks to play that way is partly what the
  screen keeps back on purpose (the meters' numbers, which way a side moves them, the direction),
  and partly what no one can see: where a decision leads. Most of the ideas below let a player
  see where a run turned, or give a decision a consequence they can read before they take it.

**5. The game remembers only the self-serving.**
- 287 card sides send a card later: 282 of them are the self-serving side.
- 916 sides set a flag a later card reads: 863 of them are self-serving.
- Of the cards sent back, 119 cost on both sides (a bill), 175 are a choice again, and 1 pays on
  both sides.
- A run sends 8–9 cards for later and meets 7–8 of them, a median 14 cards after the choice
  (p90 22–24). Between the choice and its bill the player has no say.
- An honest choice costs now, and nothing comes of it later but the direction.

**6. The rival is absent for a careful player.**
- The eyes bot meets a median 4 of the rival's cards (their moves, and votes they stand in by
  name). 12% of its runs meet none.
- The informed voter meets none in 57% of its runs.
- A move arrives as a card, with nothing before it but a rung on a ladder the cabinet shows.

**7. Two players on one seed answer differently.** Two players like the eyes bot, each deciding
one card in five their own way, on 300 seeds. 77% of one player's cards are met by the other, and
they answer 43% of those differently: a median 33 cards. A challenge compares only how each run
ended.

### What works

- **The dilemma holds where it matters.** In danger the honest side reads as the riskier on 83% of
  the eyes bot's cards. Out of danger its cost can be paid, which is why the rule works.
- **Votes and stories decide.** A vote taken the other way changes the band 57% of the time, a
  story 39%.
- **The mark does its job.** 97% of the decisions it marks would change the band, and the eyes
  bot takes the other side whenever only one is marked.
- **One deal per seed makes a flip a comparison** (phase 81): most of the run after it is the same
  cards. That is what makes ideas 1 and 2 possible.
- **The bill is the game's memory.** It arrives about 14 cards on, with its receipt (phase 80).

## 1. Turning points — end screen

**What.**
- After a run, the end screen lists the two or three decisions that turned it. Each, taken the
  other way and played on, changes how the reign ends: "Card 34, the dam. Signed, the reign ends
  in the Muddle."
- Each opens the other road (BACKLOG-5 phase 34) from that card, as a player can now from any
  card they choose.
- Worked out on the device after the run. Each decision is taken the other way, and the rest of
  the run is played as a careful player would; one deal per seed keeps the rest of the deal
  comparable.

**Why.**
- A run has a median 26 decisions that would change its band, and nothing tells the player which:
  61% of them carry no sign on the card.
- Round thirteen found that no one can see how a decision changed a run (its finding 3). Phase 81
  made the other road a fair comparison, but the player has to guess which card to take back.
- Knowing where a run turned is how a player learns the game's causes. That is the thesis, told
  after the fact, where it cannot spoil a decision.

**Cost.** Medium.
- About 104 play-outs of about 50 cards each. The audit played each decision both ways, 200 runs
  in 3.5 minutes on one core: about half a second a run for the flips alone. A phone may be three
  to five times slower. It can run after the screen shows, in idle slices, and first over the
  decisions that left a legacy.
- The list on the end screen and its words for a screen reader; a test that pins it for fixed
  runs.

**Risk.**
- **It is a bot's road, not the player's.** A person plays on differently. The screen says so
  ("played on carefully"), and lists only turning points two bots agree on.
- **Noise.** 6% of flips change the band through the bot's coin-flips alone. Fixed coin-flips, or
  agreement between bots, keep those out.
- **It may make the game feel solved.** It says where a run turned, after it ended; it never says
  what to do next time.

**Deck.** No.

**Measure first.**
- Time per run on a slow phone, whole and restricted to legacy decisions.
- The share of runs with at least one turning point, and how often the eyes bot and the informed
  voter agree on it.

## 2. What they did — shared runs

**What.**
- On a challenge link, once the player answers a card the sender also met, a line under it says
  what the sender did: "They signed it."
- Only after the player answers, never before. The end screen counts the cards the two answered
  alike and apart, and lists the three where they parted with the most at stake.
- The link already carries the sender's run code and sides (phase 37). Replaying them gives the
  sender's answer to each card they met.

**Why.**
- Two players on one seed meet 77% of each other's cards, and answer 43% of those differently: a
  median 33 moments a run.
- Phase 81 made the same run shared; the challenge's end screen compares only how each ended.
- It is interaction with a person, card by card, with no server.

**Cost.** Small to medium: the sender's run replayed once at the start; a line after the answer,
and its words for a screen reader; the count and the three on the end screen.

**Risk.**
- **Spoilers.** Shown before the answer, it would decide for the player. It never is.
- **Nothing new is sent or kept:** the link is what the sender shared.
- **A daily has no sender** without a link, so this is a challenge's.

**Deck.** No.

**Measure first.** On the daily's own seeds, the share of cards met by both and answered apart,
for two eyes players and for an eyes player beside the informed voter.

## 3. The rival's next move — cabinet

**What.**
- When one of the rival's moves could come within the next few cards, the cabinet button says so:
  "The rival is courting your Treasurer", "The rival is readying a smear".
- **First half, display only.** Read from the seed's order which of the rival's cards the run
  could be dealt next.
- **Second half, rules.** A card or two to answer a move seen coming: keep the Treasurer sweet,
  get ahead of the smear.

**Why.**
- The eyes bot meets a median 4 of the rival's cards a run; the informed voter meets none in 57%
  of its runs. A move arrives as a card, with nothing before it but a rung on the cabinet's
  ladder.
- A threat seen coming is a decision to prepare for. Every card now is answered on its own.
- The rival is the one other player in the game. This lets the player play against them.

**Cost.** Medium: the look-ahead in the deal, the line and its words, and the answering cards.

**Risk.**
- **A warning that does not come true:** the player's own choices change what can be dealt. The
  words say what the rival is doing, not what will happen.
- **It reads the deal ahead,** which one deal per seed allows. It tells a little of what is
  coming, as the other road already tells after the run.

**Deck.** No for the display. Yes for the answers.

**Measure first.** Of the rival's cards in eyes runs, the share foreseen three cards or more
ahead, and the share of those foreseen that then came.

## 4. Dividends — content

**What.**
- 30–40 honest sides send a card 10–20 cards later that pays: the clinic you funded opens in the
  Cities; the audit you allowed clears your name before the vote.
- It comes with a receipt, as a bill does (phase 80): "Sent by card 41". Some ask something back,
  a choice again.

**Why.**
- 282 of the 287 sides that send a card later are self-serving, and 1 of the cards sent back pays
  on both sides.
- An honest choice is never an investment, so honesty has no horizon but the band. With
  dividends, the honest player plans: what to pay for now, and what it will bring when it lands.

**Cost.** Medium: the writing, through the validator and the voice report.

**Risk.**
- **It makes honesty cheaper,** where the eyes bot already reaches the Ascent in 56%. It belongs
  with danger that bites and the Institutions ceiling (BACKLOG-13's item 8), or each dividend asks
  something (it comes only if what it pays for survived).
- **Balance.** The informed voter's Ascent must stay 15–30%.

**Deck.** Yes.

**Measure first.** Ten dividends on the commonest honest sides: the change in the informed
voter's and the eyes bot's Ascent, and the share of runs that meet one.

## 5. Cards that read the room — content and rules

**What.**
- A side can carry a rider that holds only in a state, and the card says so when it holds: "The
  Unions are restless: they will not take this quietly" (their loss doubles); "The treasury can
  carry it" (the cost halves).
- 150–200 deck cards, 10–15%. A rider reads a meter's band, a flag or the rival's rung.

**Why.**
- A side moves the same meters by the same amounts in any state. The state picks the cards, never
  what they do.
- That is why one rule plays most of the game: a card is the same decision in every run. A rider
  makes it a different one when the country is different.

**Cost.** Medium to large:
- the engine: a rider on a side, which the preview, the dots and the speech read;
- a line on the card that fits 360×640;
- the writing.

**Risk.**
- **Card length** on small phones.
- **A rider is always shown** when it holds, never hidden: the game does not keep its rules from
  the player.
- Balance.

**Deck.** Yes.

**Measure first.** For a candidate set (a restless group's losses, the treasury's costs when it
is full): the share of cards played where one holds (aim 10–20%), and the share of those where it
changes the eyes bot's choice (aim a quarter).

## 6. Own it or bury it — content and rules

**What.**
- When a self-serving choice sends a bill, a card between the choice and the bill offers a way
  out:
  - **own it:** a smaller cost now, and the bill does not come;
  - **bury it:** nothing now, and the bill may come larger, or not at all, on the seed's dice.
- Not every bill: one or two a run, on the bills that cost the most.

**Why.**
- A run sends 8–9 cards for later and meets 7–8, a median 14 cards after the choice. In between,
  the player has no say.
- A cover-up is the oldest story in politics, and the game has none. Owning it is a road back from
  a self-serving choice that costs something; burying it is a second temptation on top of the
  first.

**Cost.** Medium: the rule, a template for the offer (written per family of bill, not per bill),
the dice, the receipt's words, bots and balance.

**Risk.**
- **More cards between the choice and its bill** make the bill less of a surprise.
- **Owning it could become the rule,** as honesty out of danger is now. The price has to vary.

**Deck.** Yes.

**Measure first.** How many bills a run could offer it on, and what owning every one, or burying
every one, does to the eyes bot's and the informed voter's runs.

## 7. The cabinet's moves — rules and cabinet

**What.**
- Once an era, each person in the cabinet can be asked for their move, when the player chooses,
  from the cabinet:
  - the Treasurer finds the money;
  - the General clears the square;
  - the Press Secretary buries a story, and the next bill comes later;
  - the Organizer gets out the vote, for the next count.
- A move is a shortcut, and costs as one: it is self-serving. Traits colour it: a corrupt
  Treasurer finds more, and it costs more.

**Why.**
- Every decision comes when the deal brings it. The cabinet, seated twice a run, is read-only in
  play.
- A move is the one decision taken at a moment the player picks, and a temptation on the player's
  own terms: the easy way out, at a price.

**Cost.** Medium to large: eight seats' moves and their rules, a place in the cabinet at 360×640,
the words for a screen reader, bots and balance.

**Risk.**
- **A panic button flattens danger:** the eyes bot would ask the Treasurer at every money scare.
  Each move's price has to bite (the direction, the rival's standing).
- Room on small phones.

**Deck.** Yes.

**Measure first.** Each move used by a bot at the first danger of its meter: survival, the
Ascent, and the direction at the end.

## 8. A partner at the vote — votes

**What.**
- Before each vote in office, one card asks which group the campaign stands with: three answers,
  as three buttons.
- That group counts double in the count. The next era deals its demands (two or three cards), and
  the other two cool.

**Why.**
- Votes decide: a vote taken the other way changes the band 57% of the time.
- Campaigns are two-way, and the count is close (round thirteen: 22% of the informed voter's
  votes are narrow wins and 10% narrow losses; 68% of the eyes bot's are narrow or lost).
- A three-way choice with a bill in the next era is a real campaign decision.

**Cost.** Medium: the card, the count rule, three buttons at 360×640 and their words, about 18
cards of demands, bots and balance.

**Risk.**
- **The game's only three-way card:** an exception a player has to learn, and a swipe cannot make
  it.
- The count's balance.

**Deck.** Yes.

**Measure first.** How often the partner changes a vote's result. It matters only on narrow votes:
if it is under one vote in ten, it is flavour.

## 9. Put it off — play screen and rules

**What.**
- A deck card can be put off, twice an era: it comes back 6–10 cards later, both sides' costs
  grown by half, and a line says what waiting cost.
- Not a vote, an appointment, a story's step or a bill.
- A button under the card, a key, and a third choice for a screen reader.

**Why.**
- Every decision is one of two, answered now.
- In danger the honest side is the riskier on 83% of the eyes bot's cards, so a careful player
  takes the other: 40 self-serving choices a run.
- Putting off is a decision about time: keep your hands clean now, for a worse card later. It is
  the premise, the easy choice now and the ruin later, as a move the player makes.

**Cost.** Medium:
- the engine: a card put off comes back grown; run codes and records carry a third answer;
- the button, the key and the words;
- a lesson, bots and balance.

**Risk.**
- **The swipe is two-way by design.** A button keeps the swipe as it is, but the game gains a
  third answer.
- **Putting everything off:** the cap and the growth are the answer.
- **The record's format changes** (save and record versions).
- **It is another way out of danger,** where danger already ends few careful runs. It belongs
  after danger that bites.

**Deck.** Yes: a rule, and the record's format.

**Measure first.** A bot that puts a card off when the honest side reads as the riskier: its
survival, Ascent and direction, and how often the card comes back to calmer meters.

## 10. The agenda — era's door

**What.**
- At each era's door, choose one of three programmes for the era: the housing act, the police
  reform, the sovereign fund.
- Its thread of three or four cards comes during the era, and its vote at the era's end. If it
  passes, it leaves a legacy the player chose.

**Why.**
- The player never chooses what to take on. Round thirteen found 13 cards a run come because of
  what the run did; the rest come from the deal.
- The last era decides least: 17% of its decisions change the band, against 39% of the first's,
  and a run's name is settled in the first era in 57–60% of runs (round thirteen).
- A programme chosen at the door gives each era a goal the player set.

**Cost.** Large:
- 9–12 programmes of four cards, with their votes, legacies and names;
- the door's choice, beside the front page (phase 82);
- the deal, which the pursuit's machinery can carry (phase 83).

**Risk.**
- **It overlaps the questions** (BACKLOG-13's idea 4) **and the promises.** One of the three
  could be the question the era would have asked.
- **The door is getting full.**
- Writing cost.

**Deck.** Yes.

**Measure first.** With existing stories standing in for programmes, dealt as a pursuit is: the
share of eras whose programme completes, and the share of runs named for one.

## My order

Every idea in this round, in the order I would build them, and where they go among the open
ideas of the rounds before (BACKLOG-13's order, items 8–18). The closed test decides most of it:
which ideas change the deal, and which need people's records first.

**While the test runs: nothing dealt changes**

1. **Turning points (1).** It shows the depth the game already has: a run turns on a few
   decisions, and a player learns which.
2. **What they did (2).** Small, social, and it uses the shared runs phase 81 made.
3. **The rival's next move, the display (3).** It reads the deal and changes none of it.

**Once the first records are in**

4. BACKLOG-13's item 8, **the Institutions ceiling and danger that bites,** comes first. Most of
   this round's rules give the player new ways through danger. Built before it, they would make
   the careful game easier still.

**After the test: changes to the deal, in batches**

5. **Cards that read the room (5).** The deepest change to the card itself, and it gives danger
   more than a colour.
6. **Dividends (4),** with danger that bites in place, so honesty's horizon does not make the
   Ascent free.
7. **Own it or bury it (6),** on the same machinery as the bills and dividends.
8. **A partner at the vote (8),** if its measure says the partner decides votes.
9. **The rival's answers (3, second half),** with rival kinds (BACKLOG-12's 10).
10. **Put it off (9),** first as a term taken by choice, as danger that bites is to start.
11. **The cabinet's moves (7),** after 10: both are ways out, and one may be enough.
12. **The agenda (10),** with the last era decides (BACKLOG-13's 4). The largest.

## Also considered

- **Goodwill:** honest choices bank a store the player spends to stay honest in danger. It aims
  at the moment the eyes bot gives up honesty, but it flattens danger further, and dividends give
  honesty a future with less machinery.
- **Groups that keep score,** growing loyal or wary. A group given a big win and a big loss the
  next time a card touches it is rare: a median 0–1 a run. BACKLOG-13's habit cards (its idea 7)
  notice patterns with less rule.
- **Half measures:** a short swipe for half the effect. It doubles the answers with no new screen,
  but half of everything is always the safest, and the dilemma goes.
- **Showing which way a meter moves.** The words say it; the preview keeps it back on purpose.
- **A timer.** It shuts out screen-reader and switch users, as round thirteen found.
- **Undo.** A choice that stays made is the premise; the other road already lets a player see.
- **A score for a run.** The contracts and the history's name already reward how a run was played.
  A score would make the Ascent a number to grind.

## Decisions for you

1. **Which of these become phases,** and in what order. The default is the order above.
2. **Whether the swipe stays two-way.** Put it off and a partner at the vote add a third answer.
   The default is a partner at the vote only if its measure says it decides votes, and put it off
   first as a term taken by choice.
3. **Whether turning points name decisions from a bot's play.** The default is to list only the
   ones two bots agree on, and to say they were played on carefully.
4. **Whether honesty should ever pay later.** The thesis is that the easy choice now is the ruin
   later. Dividends add that the hard choice now can pay later. The default is yes: a few, each
   asking something, and only with danger that bites.

## Phase 88. Turning points (idea 1) — *done*

**Shipped in v0.96.0.** On the end screen only: nothing is dealt differently, so the deck is still
g8u7egs4. Nothing new is kept or recorded.

- **"Where it turned"** is a fold under "What became of it", its line counting the run's
  decisions that, taken the other way with the rest played as the player played it, end the
  reign differently. Opened, it says so in a sentence and lists up to three:
  - "Card 34. You chose “Sign the dam”. The other way, the reign ends in the Muddle."
  - each with the other road's button, "Choose “Veto the dam” instead", which plays on from that
    card as the other road (BACKLOG-5 phase 34) always has.
- **"The rest as the player played it."** Wherever the other road deals a card the player met
  after that decision, they answer it as they did; a side it marks as ending the reign they do
  not take. One deal per seed makes most of those cards the same: a road leaves a median one to
  two cards to anyone else.
- **Those cards are answered carefully,** twice: by the eyes bot, which decides only from the
  screen, and by the informed voter. A decision is a turning point only when both roads end the
  same way, and not as the run did. A side that ends the reign on the spot is not one: the card
  marks it.
- **Which three.** Those that set something in motion, not a close run tipped by the card's own
  weight on the direction: a reign kept or cut short first, then the furthest from how it ended,
  then those that moved the direction most. A run whose turning points were all only close says
  so in a line, and one with none says that.
- **Worked out after the screen shows,** in the slices the browser can spare. The fold's line
  counts "…" meanwhile and keeps its height, so nothing below it moves when the work is done; a
  screen reader hears what it found. It is not looked for on a second road, which does not branch
  again, nor in a run that cannot be retraced.
- **Why a fold.** The first version listed them open, and when the list arrived it pushed the
  chart below it down the page while it was being read. The chart's own audit clicked where the
  chart had been, and failed the deploy.
- **Found on the way:** the other road's note on its first card named an appointment's person as
  "{first}". It names them now, as the card did.

**Measured first.** Bots played runs to their end; each decision was then taken the other way.

| Runs played by | Turning points a run: median (p10–p90) | Set something in motion | Runs listing one or more |
|---|---|---|---|
| Eyes, deciding one card in five its own way (100) | 11 (0–48) | 5 | 86% |
| Informed voter (100) | 5 (1–36) | 2 | 80% |
| Eyes, first term (25) | 2 (0–7) | 1 | 56% |
| Eyes, long reign (25) | 16 (1–41) | 11 | 92% |

- **A close run is common.** In a prototype of the same rules, 43% of the eyes-like player's
  turning points, and 60% of the informed voter's, moved the direction no further than the card's
  own weight. Those are counted, not listed.
- **The two careful players agree** on about half the decisions either one finds.
- **A run cut short** usually had a road that was seen through: 6 of 7 in the eyes-like sample.
- **Time.** In node on one core, a median 0.55 seconds for an ordinary reign, 0.05 for a first term
  and 1.1 for a long reign. In Chromium the section is ready 0.75–0.94 seconds after the last
  choice. With the CPU slowed four times it takes 3.7–4.7 seconds, and six times 6.3–8.2, before
  the second careful road was made to run only when the first ends differently (17% less in
  node). The end screen itself still shows in under a second.

**Tests.**
- The finder:
  - finds the same turning points every time;
  - each one's road, worked out again the long way for each careful player, ends as it says;
  - none is a side that ends the reign on the spot;
  - each side is named as the card named it, an appointment's people filled in;
  - a close run is told apart from one set in motion;
  - it works a decision at a time, and finds nothing to look for in a run with no record, one
    that deals differently, or one not over;
  - a first term has turning points too.
- The ones shown: at most three, all set in motion, a reign kept or cut short first, in card
  order; none when every one was only close.
- The end screen:
  - says it is working, then how many, with the three and their roads;
  - taking one goes back to its card;
  - says a run was close, or that nothing would have changed it;
  - looks for none on a second road or without a record.
- The other road's first card names an appointment's person.
- A browser audit plays three bots' runs to their end in three looks at 360×640. The fold keeps
  its height and the chart its place while the work is done. It counts what node finds for the
  same run, reads and fits closed and open, and its first road opens on its card with the note
  that says so.
- Question 3 now asks testers whether the turning points were the ones they thought mattered.

**Caveats.**
- **It is still partly a bot's road.** The player's own answers stand wherever the same card
  comes, but a card they never met is answered by a careful bot. Two bots must agree, and the
  screen says so ("answered carefully"), but a person might have answered otherwise.
- **The player's answers are replayed as they were,** though the country on the other road may
  be in a different state when the same card comes. A player might not have answered it the same
  way there.
- **A slow phone takes several seconds.** The fold is below the first screen of the end, so it is
  usually ready by the time it is reached; until then it counts "…".
- **Folded, it is one tap away.** Whether players open it is question 3's to answer too.
- **It may make the game feel solved.** It says where a run turned after it ended, never what to
  do next time. Whether people read it that way is question 3's to answer.
