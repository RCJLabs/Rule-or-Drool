# Backlog, round eleven: improving what is there

Round ten (BACKLOG-10.md) is phases 55–65, all done: v0.65.0 to v0.73.1. BACKLOG-2's phase 17,
getting the game onto Play, still waits on decisions only the owner can make.

You asked for another audit, and this time not for new cards: for ways to improve what the game
already has. How its systems work on each other, how its endings land, and so on. Every idea
here works on the rules, the screens, the endings and the meta. None adds or changes a card.

Each idea says:
- what it is;
- what the audit found that points to it;
- a rough cost, and the risk;
- what to measure before building it.

Numbers are measured, from bots unless a line says otherwise. The informed voter is the bot the
balance is set for; the eyes bot sees only what the screen draws, as a person does; the mixed
bot is the careful floor; the random bot is a player who has not learned anything yet. How
people will play any of this is a guess until the closed test.

## What the audit measured

**Runs.** 2,000 runs of three eras for each of four bots, 2,000 long reigns for two, and a codex
over 60 runs for 20 profiles of each of three bots, folded by the game's own code. Two read-only
passes over the code, one on how the systems read each other and one on the end of a run. Every
bug named below was checked in the code; the numbers from those two passes are marked as theirs.

**How runs end.**

| | Informed | Mixed | Eyes | Random |
|---|---|---|---|---|
| Runs that reach a finale | 97.4% | 97.0% | 93.2% | 8.4% |
| Different endings in 2,000 runs | 8 | 11 | 11 | 69 |
| Runs that never have a meter drawn in danger | 67% | 72% | none | 44% |
| Runs cut short | 52 | 60 | 137 | 1,832 |
| of which the last card ended it either way | 52 | 53 | 81 | 95 |
| of which the side taken ended it, the other would not | 0 | 0 | 55 | 1,731 |
| of which no side's preview showed it coming | 0 | 7 | 1 | 5 |

- 91–97% of a careful run's endings are one of the three finales. The endings a player collects
  are almost all ways to fall: across 10,000 careful runs, three-era and long, the bots reached
  19 of the codex's 77 endings. The random bot reached 74.
- 47 of the informed voter's 52 runs cut short end on one card, the last step of the story in
  which the general is unleashed: both of its sides end the run. It is written as a choice of
  endings, and warned of in its text.

**The codex over a player's runs** (the mean of 20 profiles):

| After | Endings (of 77) | Futures (of 30) | Objectives (of 25) | History names (of 675) | Stories (of 179) |
|---|---|---|---|---|---|
| 10 runs | 3.0–3.1 | 4.4–5.0 | 11.6–13.1 | 9.6–9.7 | 37–41 |
| 30 runs | 3.6–4.2 | 6.0–6.3 | 13.2–14.1 | 26–27 | 76–83 |
| 60 runs | 4.0–5.0 | 6.8–7.2 | 14.1–14.3 | 46–48 | 100–108 |

- After the tenth run a new ending comes in 1–6% of runs, and a new history name in 65–89%.
  The history names and the stories carry the novelty; the endings count stands still.
- Objectives stop at 14 of 25. Most of the other eleven need a mode the bots never pick
  (promises, long reigns, a line of reigns), so that part is the bots' limit, not the game's.
  But "Collector", ten endings, was done in none of 30 profiles in 60 runs, and "Five ways
  out" in 11.

**Why careful play turns from the honest side.** At each choice with an honest side that the
bot took the other way, the meter nearest the edge that ends a run:

| | Informed | Mixed | Eyes |
|---|---|---|---|
| Honest-side choices turned | 45.7% | 44.0% | 39.3% |
| Institutions near the top | 54% | 56% | 74% |
| Money near the bottom | 26% | 24% | 17% |
| A bloc near the bottom | 13% | 14% | 9% |

The honest side of a card adds 2.4 to Institutions on average, and Institutions at 100 ends the
run ("Pending Review"). So the most common reason to take the self-serving side is not
temptation: it is to let the pressure out of Institutions.

**What a run is dealt.** The informed voter reaches the Ascent in 21–37% of runs depending on its
crisis, 13–39% depending on its trait, and 11–40% depending on its flaw. The setups that start
Institutions high are the worst of them: academic 13%, committee-brained 11%, naive 13%. The
setup screen shows a name and a line of character.

**Out of office.** A lost honest vote sends the run out until the era ends.
- It costs the informed voter nothing in survival: 98.2% of the runs that went out reached a
  finale, against 96.8% of those that did not. Out of office the state's meters cannot end the
  run: they are held off their edges.
- The way back is mostly the dirty one. Of the runs that came back, the eyes bot came back
  honestly in 73 of 1,345, the mixed bot in 183 of 646, the informed voter in 549 of 795.
- The eyes bot ended 49 runs by winning its way back: the office came back with a meter held at
  its edge, and the vote's own effect pushed it over on that card.

## 1. Fix what the audit found broken — fixes

**What.** Ten things the game says or does wrong, found by the audit and checked in the code:
1. **A lost honest vote is counted as a win.** The record says "You won one vote honestly" above
   "You saw the end of it from the opposition benches", and "A clean win", "Three clean votes"
   and the weekly contracts' "honestly" all credit it. The second pass measured it in 32–64% of
   first terms, depending on the bot, and 2–24% of full reigns.
2. **Winning the office back can end the run on that card** (above: 49 of the eyes bot's 2,000
   runs, 36% of its runs cut short). The code's own comment says the office is never handed back
   already lost.
3. **"A clean fight" survives a dirty campaign.** Its cost says one smeared, scared or bought
   campaign breaks it; it breaks only on `dirty_politics`, which none of the 40 campaign cards
   sets. The second pass kept it in 329 of 578 finales that took every easy campaign.
4. **The rival loses standing when they beat you.** An honest vote costs the rival 6 whether you
   win it or lose it, so the rival who has just taken the office comes out of the count weaker.
5. **Postponing a vote does nothing.** Every vote falls on card 26 of its era; a 15-card delay
   runs past the era's end, where the clock is set again.
6. **"They Won" describes a count that never happened.** With elections abolished, the rival
   wins through the coup roll, and the text says "The count came in on time".
7. **"The line redeemed" cannot be earned by a long reign:** it asks for the ordinary Ascent
   finale by name.
8. **The end screen credits the last reign's legacies to the heir.** History and the codex leave
   them out; the record's "things you did to it", "Also left behind" and the picture do not.
9. **The codex counts 18 history names no run can reach:** six legacies can only be set by one
   side, and the total counts both.
10. **The time scales disagree.** A long reign's finale is "Five centuries on"; its codex clue says
    "Two centuries survived", and the picture "A thousand years later". An ordinary finale is
    "Seventy-five years on", captioned "Centuries later".

**Cost.** Small: most are a line or a condition. **Risk.** Two change what the game deals and
scores, so the deck stamp moves: the hold on the way back into office (2), and the rival's
standing after a lost vote (4). The first raises the eyes bot's finale; the second makes the
rival stronger at the top rung. Earned objectives stay earned.

**Measure first.** The harness before and after 2 and 4. For 1, how many objectives existing
profiles hold on a lost vote alone: they keep them, but the numbers say what the fix costs.

## 2. Say why the run ended — end screen

**What.** A line on the end screen for how it ended: the meter and where it stood, the card and
the side taken; for a vote, the coalition against the bar; for a coup, the odds it was rolled at.

**Why.**
- The screen leads with the history's name. What ended the run is a small kicker ("Your rule
  ends · Under its own weight") and one sentence. The final meters are never shown: the game
  goes to the end screen on the card that ended it.
- The only lesson on it says hitting bottom ends your rule. The four endings for a meter that
  goes too high (oligarchy, police state, paralysis, the cult) are never explained.
- A player cut short, 2.6–6.8% of careful runs and 91% of the random bot's, learns a name and a
  sentence, and has to guess the rest.

**Cost.** Small: the run's last state holds all of it. **Risk.** A line of numbers on a screen
that is prose. It can be written as prose: "Public trust was at 3 when you backed the curfew."

**Measure first.** Nothing a bot can say. Ask testers what ended their last run, and whether they
knew.

## 3. Mark a side that ends your rule — play screen

**What.** When a side would end the run, the card says so as the side is peeked, as it already
shows which meters move: a mark on the side, and the words for a screen reader. And a vote whose
loss would end the run says that, not only that it is lost.

**Why.**
- The preview knows: the engine computes the ending of each side. The card shows dots.
- The eyes bot, which reads the dots as a person would, ended 55 of 2,000 runs on a side that
  ended it when the other side would not, and 49 more by winning its office back (idea 1).
- After a run has lost office once, a second lost count ends it. The vote's line reads "Counted
  honestly: a loss" either way.

**Cost.** Small. **Risk.** It takes away a surprise. The game hides where the country is heading;
it does not hide where a meter's edge is, and the dots already say a meter is about to move a
lot. **Measure first.** The eyes bot's runs cut short, with the mark read.

## 4. Honesty runs into the Institutions ceiling — rules

**What.** Let an honest run stay honest longer without the game getting easier elsewhere. The
options, none of which touches a card:
- a gain toward a state meter's edge shrinks as the meter nears it;
- paralysis after some cards at the top, not at the first;
- Institutions eased back toward the middle each era more than the other meters.

**Why.**
- 54–74% of the careful bots' turns from the honest side are made with Institutions nearest its
  top. The honest side adds 2.4 to it on average.
- The self-serving side is therefore a pressure valve as often as it is a temptation, which is
  not the choice the game means to offer.
- The setups that start Institutions high cut the informed voter's Ascent to a third (idea 9).
  The general's story, which ends a run either way, is entered from a self-serving side, often
  taken for this reason.

**Cost.** Medium: the rule is small, the balance is not. **Risk.** It is the biggest lever on how
the game plays since phase 54. The informed voter's Ascent (15–30%) and the long reign's targets
would move, and every tuning since phase 54 assumed this ceiling.

**Measure first.** For each option: the share of turns by meter, the informed voter's Ascent and
the long reign's finale. Then whether people turn there too, which needs the closed test.

## 5. Show the rival's hidden dice — rival

**What.** Once elections are abolished, each vote's slot becomes a coup roll against Order,
Institutions and the rival's pressure. Show it as a vote shows its count: a line for how it
stands, on the card the slot falls on. Tell the rival apart on the cabinet screen when elections
are gone, and when you are out of office.

**Why.**
- Every one of the mixed bot's rival wins in 2,000 long reigns, 55 of them, came from that roll,
  and so did all 6 in 2,000 three-era runs. None could be seen on any card.
- The cabinet still says "Lose a ballot now and it is theirs by name" after the ballots are
  gone. Out of office it says "Taking nothing off you yet", about the rival who holds the office.
- The ending itself describes a count (idea 1).

**Cost.** Small. **Risk.** A number on screen makes a gamble of what was a threat. It can be a
band, as the count's line is: safe, restless, at risk.

**Measure first.** How often abolishing runs die of it: 7 of 62 of the mixed bot's three-era runs
that abolished the vote did.

## 6. Make opposition cost something — rules

**What.** Time out of office should change the run:
- the rival's standing rises while they govern, instead of falling when they win (idea 1);
- the state moves under their government, their way, rather than being held for you;
- what happened out of office is told: history, the record and the picture.

**Why.**
- Losing office costs the informed voter nothing in survival (98.2% finales against 96.8%), and
  the way back is mostly bought (above).
- No card reads that a run lost office or won it back. The two flags rank 68th and 71st of 74 in
  history's order, and named no history; the end picture flies your flags on a run that ended in
  opposition, where the play screen's strip flew the rival's.
- A vote lost in a run's last era, or a first term's, ends in the finale text and its sound.

**Cost.** Medium. **Risk.** Balance: this is phase 55's system, tuned to its targets. **Measure
first.** Finale and band for runs that went out against those that did not, under each change.

## 7. Endings a careful player can reach, and a codex that helps — codex

**What.** Without new endings:
- keep every rumour a player has heard, and say which side can reach each ending;
- record how close a run came to each ending during it, not only at its last card;
- set the ways to fall apart from the ways to finish in the codex, so 4 of 77 does not read as
  a failure;
- count what can be counted: list a first term's end without adding it to the total, and count
  history names the run can reach (idea 1).

**Why.**
- Careful play reaches 19 of 77 endings in 10,000 runs, and a profile has 4 or 5 after 60 runs.
  "Collector" (ten endings) was not done in any of 30 profiles.
- The codex shows one rumour at a time, a new one each run, and keeps none. A rumour read once
  may not come back for about 70 runs.
- 18 endings can only be reached from one side, and nothing says so.
- A near miss is only taken from a run's last state, and only for the ten meter endings. One
  that triggered but lost the tie is kept as a near miss at distance 0: "You came close to this".
- The Stories section calls story outcomes "endings".

**Cost.** Small to medium. **Risk.** Low: nothing is dealt differently. **Measure first.** How
many endings a player aiming at them can reach in 20 runs with the rumours kept: the bots
cannot aim, so this is for the closed test.

## 8. An end screen that does not repeat or contradict itself — end screen

**What.**
- Fold what the player has already read into a line, and lead with what is new to them: the
  codex already knows which epilogues they have seen.
- Tell a reign cut short as one: its history name stands, but under the year it stopped.
- Leave out "what became of it" for a legacy the ending card itself set or undid.
- In a long reign, style the frame and the picture from the band, which is locked, not from
  drift, which is not.

**Why.**
- A player who survives reads one of six epilogues under one of three finale texts, every time.
- The name ignores the ending: the eyes bot went bankrupt at card 35 and history called it "The
  War That Kept Its Word". 63 of its 208 history names went both to finales and to runs cut
  short.
- "The Games" ends on a car boot sale and thirty years of payments; its legacy, on the Ascent,
  says the stadium paid off in its fortieth year.
- A long reign locked in the Ascent whose drift later fell can show a gold city in a Decay frame
  (read in the code; how often is not measured).

**Cost.** Small to medium. **Risk.** Low. **Measure first.** Whether repetition is felt: ask
testers at their tenth run whether the end screen still tells them anything.

## 9. The dealt setup decides more than it shows — setup

**What.** Say what the setup does: the meters it starts, raised or lowered, on the setup screen,
and what that means for a run. Offer one redraw, or a choice of trait and flaw from two, as the
promises are chosen.

**Why.** The informed voter's Ascent runs from 11% to 40% with the flaw it is dealt, and from 13%
to 39% with the trait. The worst are the ones that start Institutions high (idea 4), which read as
advantages: the academic, the technocrat. The screen says "You cannot decide anything without a
room."

**Cost.** Small for showing, medium for choosing. **Risk.** A choice makes the best setup
everyone's. Showing alone keeps the deal. **Measure first.** The spread under idea 4's rule, which
may close most of it; then what people pick, if they may.

## 10. Systems that do not talk to each other — rules and meta

**What.**
- A broken promise feeds the rival, as a stolen vote does.
- A run that takes over reads how the last one ended: after the rival won, the heir starts
  against a rival who held the office, not one halved back toward the start.
- Objectives and contracts learn the rival: beat them by name, keep your cabinet from them, win
  back the office honestly. New contract templates only from the week they are added, so past
  weeks keep their contracts.
- The treasury promise does not count while the rival holds the treasury.

**Why.**
- `checkMandate` breaks a promise, sets its flags and queues its card. The rival never hears.
- The takeover never reads the ending: after `rival_wins`, a coup or a finale in opposition, the
  heir starts in office, and the handover card speaks of "your predecessor's desk".
- No objective or contract reads the rival's standing, poaching, votes by name, appointments or
  questions. Contracts deal 4 of the 9 promises.
- "Something set aside" broke while out of office in 6 of 1,000 of the informed voter's runs, the
  second pass found, while the lesson says the state is not yours to lose.

**Cost.** Small to medium, one at a time. **Risk.** Each changes what a run is scored on; the
rival's standing and the takeover move the deck. **Measure first.** For the rival: its win rate
and the informed voter's Ascent with broken promises counted.

## My order

1. **The fixes (1).** They are bugs, and most are a line. Two move the deck, the return vote's
   hold and the rival's standing after a lost vote; build them with a harness run beside them.
2. **Say why it ended (2) and mark a fatal side (3).** Small, and what a new player trips on.
   Neither moves the deck.
3. **The rival's dice (5), then opposition (6).** They touch the same code.
4. **The codex (7) and the end screen (8).** Nothing is dealt differently.
5. **The Institutions ceiling (4), then the setup (9).** The biggest lever on play. Best decided
   once the closed test shows where people turn.
6. **The systems that do not talk (10),** one at a time, as the others open the code they need.

**The closed test.** Ideas 2, 3, 5 (the display), 7, 8 and 9 (the display) change no deal, so
they can be built while the deck is held still for the test. Ideas 1 (two of its fixes), 4, 6
and 10 cannot.

## Also considered

- **Difficulty.** Two in three of the informed voter's runs never have a meter drawn in danger,
  and 97% reach a finale. As in BACKLOG-5, it is a question for people's runs: the bots see
  exact numbers, and the stakes the game means are the band, not survival.
- **The general's story.** Its last card ends a run either way, 2.4% of careful runs and all of
  their deaths in era 1. It is a choice of two endings, warned of in its text, and entered by a
  self-serving choice; idea 4 changes how often that is taken.
- **How often the look changes,** 14–15 times in a careful run. Phase 45 settled it; nothing new
  was measured.

## Decisions for you

1. **Which of these become phases,** and in what order. The default is the order above.
2. **Whether the fixes that move the deck wait for the closed test.** The default is no: they are
   bugs, and the test should play the game as it is meant.
3. **Whether a side that ends the run should be marked (3).** The default is yes: the edge of a
   meter is already on screen, and the mark only says the side reaches it.
4. **Whether the Institutions ceiling (4) waits for people's runs.** The default is yes.

## Phase 66. Fix what the audit found broken (idea 1) — *done*

**Shipped in v0.74.0.** The deck moved (DEAL_VERSION 7): the return vote's hold, the rival's
standing after a lost count, the coup after abolition and a clean fight's break each change what
is dealt or how a run ends. Run saves are v16.

1. **A lost honest vote was counted as a win.** A run counts the honest counts it lost
   (`electionsLost`), and a vote is won honestly only when it was honest and not lost
   (`honestWins`). The record, "A clean win", "Three clean votes" and the contracts' "honestly"
   read wins. A run that left every vote to the count and lost them says so. A save from before
   can have lost only the vote that sent it out, which its flag says, so the count comes forward
   exact. Objectives already earned stay earned. What it costs, measured on this fix alone,
   2,000 runs a bot:

   | "A clean win" | First term | Full reign | Long reign |
   |---|---|---|---|
   | Informed voter | 99.5% → 68.0% | 99.5% → 96.7% | 99.5% → 98.8% |
   | Mixed bot | 57.4% → 32.1% | 91.0% → 78.3% | 96.0% → 90.8% |
   | Eyes bot | 99.6% → 35.9% | 99.6% → 76.5% | 99.6% → 91.1% |

   "Three clean votes" moved by 2 points at most, and the contracts that ask for an honest vote
   not at all: a reign that sees its finale without cheating a vote has won one.
2. **Winning the office back could end the run on that card.** The card that brings a run back
   is played out of office, so its effects on the state are held off the edges as the
   opposition's are. Every honest return vote builds Institutions and spends the Treasury, which
   is how a meter held at 99 or 1 went over. On the audit's seeds, the eyes bot's deaths on
   winning back went from 49 to none, and its finale from 93.2% to 96.0%.
3. **A clean fight survived a dirty campaign.** Taking a campaign card's easy side, the one that
   drifts toward Decay, sets `easy_campaign`, and the promise breaks on it as on
   `dirty_politics`. The validator asks every campaign card for an easy side
   (`campaign-no-easy`). Kept at the finale, 1,000 runs a bot taken on the promise alone:
   - by bots that pay it no attention, 57.5% → 2.2% (informed) and 34.6% → 1.7% (mixed);
   - by the same bots taking the other side wherever their pick would break it and the other is
     safe, 85.5% → 81.7% and 85.8% → 86.2%, with survival unchanged.

   The card that follows the break said "The rumour did its work". Most easy campaigns are a
   cheque, a ribbon or a poll, and several of the other ways to the break, buying the balance or
   signing a pact among them, were never rumours. It now says the cheap win worked, and its
   right side is "Say it was fair": the one card this phase touched, its words only.
4. **The rival lost standing when they beat you.** A clean count costs the rival 6 only when you
   win it; one they win costs them nothing. In runs that lost the office the rival ends 6–7
   points stronger: 41.8 → 47.8 for the eyes bot, 57.6 → 65.1 in the mixed bot's long reigns.
   They are at the top rung at the end of 52.6% of those eyes runs, from 38.3%. The saint bot,
   which loses its first vote and then the return vote, now loses the second to the rival by
   name: `rival_wins` 2.4% → 10.6%, `election_loss` 9.9% → 1.8%.
5. **Postponing a vote did nothing.** `electionDelay` is gone from the engine, the schema, the
   validator and the two cards that had it. Every vote falls on card 26 of its era, and the
   opposition, the campaign and the votes by name are built on that. A working 15-card delay
   would move a vote into the next era's first cards, where losing it would put a run out of
   office for most of an era. The two emergencies play as they did: the vote is not held this
   era.
6. **"They Won" described a count that was never held.** With elections abolished, the coup
   check ends in a coup whoever is behind it; the rival's standing still makes it likelier. In
   the mixed bot's long reigns, on the audit's seeds, the coup roll ended 60 runs, 55 of them as
   the rival's win; now it ends 56, every one a coup. `rival_wins` comes from a count lost at the
   top rung, or a card that chooses it. The clues already said so.
7. **The line redeemed** is earned by a long reign's Ascent as well as the ordinary one.
8. **An heir was credited with what it took over.** The record's "things you did to it" and
   "Also left behind" leave out the legacies the reign inherited, which the end screen names
   beside its place in the line. A reign that left nothing of its own says it carries only what
   it carried before. The picture keeps them: they still stand in the country.
9. **The codex counted 18 names no run could reach.** Its total is the names a run of this deck
   can be given, 657 of the 675 written; six legacies are set by one side's cards only. A name a
   profile already holds always counts, so no profile shows more found than there are.
10. **The time scales.** A long reign's clues say five centuries survived. The picture after a
    run that ended in era 4 or 5 is captioned "Two centuries on" or "Five centuries on", as the
    epilogue under it begins; it said "Centuries after that" and "A thousand years later". The
    audit's other example was wrong: the ordinary finale's epilogues look ahead ("Centuries
    on"), so its caption, "Centuries later", already agreed with them and is kept.

**Balance.** Every harness target passes. 10,000 runs a bot, long reigns 4,000:

| | Before | After |
|---|---|---|
| Informed voter, Ascent | 27.5% | 26.9% |
| Mixed bot, Ascent | 14.5% | 14.4% |
| Greedy bot, Decay | 77.6% | 77.7% |
| Eyes bot, finale | 92.2% | 94.6% |
| Mixed bot, long reign, reaches era 5 | 96.3% | 96.0% |
| Mixed bot, long finale | 93.8% | 93.5% |
| Informed voter, long reign, Ascent | 26.7% | 25.8% |

One test's bound moved. The most-served adviser was at 54.9% of the mixed bot's runs against a
ceiling of 55%, and at 55.7% on another seed, before any of this; after, it was 55.0%. The
ceiling was set when the range was 32–52%, before the rival could take people. It is 60% now,
with the range measured over three seeds, 32–56%, beside it.

**Caveats.**
- The rival is stronger after a lost vote, which is the fix, and nothing was retuned for it.
  Whether the way back into office now feels harder than it should is for the closed test.
- "A clean win" is rarer from a first term, where a lost vote is common. Profiles keep what they
  have.
- A clean fight is now broken in most runs on it that do not watch the campaign cards, as its
  cost says. Whether a player reads the cost before the first campaign is not measured.

## Phase 67. Say why the run ended (idea 2) — *done*

**Shipped in v0.75.0.** Nothing is dealt differently: the deck is still 7jyrup04.

A run cut short says why under the ending's own words, in one or two sentences read back from
its last choice and the run as it stood with that card on the table (`endCause`, `causeLine`):

- **A meter at its edge:** where it stood, the side taken, and that it was the last of it. "Money
  was already at the edge when you chose “Pay the new rate”, and that took the last of it." When
  the side left the meter short and the era's own pressure took the rest, it says that instead.
- **A meter over the top** says what the top means, which nothing in the game said before: "Too
  much order ends a rule too: the police come to answer to nobody."
- **A vote** says what the card called the count, and why losing it was the end: a second lost
  vote, or the way back into office lost. A first lost vote only sends a run out, so a run that
  lost one and emptied a bloc on the same card is told about the bloc.
- **A coup** gives the odds it was rolled at, in words: "about one in five".
- **An ending chosen outright** says the side that chose it; **a cult**, what every bloc at the
  top at once means.

It is in words, not numbers: the game shows no meter's number anywhere, and the end screen does
not start. Where the meter stood uses the words its icon gave the eye, "already at the edge" for
a meter the screen showed in danger. A run that cannot be read back, from before choices were
recorded, still names the meter.

**The first card's lesson** said any meter hitting bottom ends your rule. It now says the state's
also fail at the top, in no more characters than it had: a longer one pushed the first card's
buttons off it in the deepest looks, up to 16px, on every 360px-wide phone the audit measures.

**Measured,** 1,000 runs a bot for each length of reign:
- Every run cut short gets a line: none of 2,654 went without one.
- A meter was already shown in danger before the card that ended the run in 98–100% of meter
  endings. The line says what the screen showed; it rarely has news in it about the meter.
- Careful players are cut short mostly by a story's end they chose: 21 of the mixed bot's 26
  cut-short three-era runs and 29 of the informed voter's 30. In long reigns coups and cults
  join them. The eyes bot's are mostly meters, 44 of 68.
- The longest line is 187 characters, a meter over the top with what the top means. The browser
  audit plays a run to that ending on the smallest phone and checks it reads and fits.

**Caveat.** Whether a person reads the line, or already knew, is not something a bot can say.
Ask testers what ended their last run and whether the screen told them anything they did not
know.
