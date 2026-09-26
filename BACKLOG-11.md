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

## Phase 68. Mark a side that ends your rule (idea 3) — *done*

**Shipped in v0.76.0.** Nothing is dealt differently: the deck is still 7jyrup04.

- A side that would end the run is marked: under its label as the card is dragged or peeked,
  "Ends your rule", ringed in the colour a meter in danger is drawn in; on its button, the same
  ring; and for a screen reader, "This ends your rule." after what the side moves.
- What counts (`sideEnds`) is the side played out as the engine would play it: its own ending, a
  lost count that ends the run, a meter it takes over an edge, or one the era's pressure takes
  over once it is played. Not the coup's roll, which is dice the player is not shown (idea 5),
  and not a finale, which is the run seen through.
- A vote whose loss would end the run says so: "Counted honestly: a final loss", where it said
  "a loss" or "a narrow loss". A first lost vote, which only sends the run out, reads as before.

**Measured,** the eyes bot on 2,000 runs a length, the same seeds each way:

| Cut short | As it was | Reading the mark |
|---|---|---|
| First term | 25 | 15 |
| Three eras | 112 | 78 |
| Long reign | 208 | 145 |

- It took a marked side while the other was clear 12, 40 and 84 times; reading the mark, never.
  What still cuts it short is nearly all a card both of whose sides end the run: 74 of the 78.
- Marks come up on 1–3% of cards, and at least once in 945 of 1,000 runs: 1,336 times a vote
  whose loss would be the last, 1,313 a side whose own words end the reign, 498 a meter the side
  takes over. The first two a careful player can know already; the third is what the dots did
  not say.
- The eyes bot reads the mark now, since the table shows it: in the harness its finale rises from
  94.6% to 96.2%, and its runs ended in the first era fall from 3.1% to 0.5%. No target reads
  the eyes bot, and every target passes.

**Fit.** The first wording for the vote, "Counted honestly: a loss, and your last", took two lines
in the deepest looks and pushed the card's text off it; "a final loss" is shorter than the line
it replaces. The danger colour could not carry the words: on the Ascent's dark paper it reads at
2.9:1, and text needs 4.5. So the words are in ink and the colour is a ring, drawn inside, which
the decay looks show although they draw no borders. A new browser audit stages each side's
longest vote, the office lost once, with the buttons drawn and the side peeked, in all seven
looks on the smallest phone.

**Caveats.**
- It takes away a surprise, as BACKLOG-11 said it would. It also says exactly what the hidden
  numbers add up to: that a meter will cross its edge on this side, where the dots only say how
  far it moves.
- On a button the mark is a ring without words, since words there took room from the card.
  Whether a player who taps the buttons reads the ring is not measured; ask testers.

## Phase 69. Show the rival's hidden dice (idea 5) — *done*

**Shipped in v0.77.0.** Nothing is dealt differently: the deck is still 7jyrup04.

- Once the vote is abolished, a coup is rolled after the card where the vote would have fallen
  due. That card now carries a line where a vote's count would be: "Coup risk after this: low",
  "moderate" or "high". Low is at most 12%, one in ten or so; the floor is one in twenty. High is
  over 30%, one in three or worse. It is said aloud with the card, as the count is.
- The odds are read as the run stands, with the roll's own pull on drift counted, since every
  roll makes it. What the side taken does to the meters is not counted, just as a vote's count
  reads the meters before the card is played.
- The first card after the vote is abolished teaches what happens next: "No count to lose now.
  Where a vote would fall due, the generals decide, and that card says the risk. Order and the
  State keep them loyal; a strong rival does not." When the vote is abolished at a vote, that is
  some thirty cards before the first roll, which is when there is time to act on it.
- The card the coup is rolled after draws no lesson; one that is due waits for the next card.
  The line needs the room a lesson takes (see **Fit**).
- Once the vote is gone, the cabinet speaks of the coup: "With the vote gone they need no ballot,
  only the generals. As things stand the risk of a coup is moderate." It adds "Their standing
  adds to it." once the rival is off the bottom rung. It had still said "Lose a ballot now and
  it is theirs by name."
- Out of office, the cabinet says the rival holds the office you lost, and whether the vote to
  win it back would be won as things stand. It had called the rival who holds the office a
  backbencher taking nothing off you.
- The cabinet's button is flagged for whatever the rival threatens now: a vote lost to them by
  name, as before; a coup whose risk is high; or, out of office, the way back lost as things
  stand. It had flagged a ballot that no longer existed.

**Measured** over 20,000 bot runs: five bots, and 2,000 runs each of three eras and of a long
reign, on the audit's seeds.

| | |
|---|---|
| Rolls | 504. Every one came after a card that carried the line, and no line came without a roll |
| The band shown is the band rolled at | 495 of 504 times; 447 without counting the roll's pull on drift |
| Shown low / moderate / high | 15 / 148 / 341 rolls, of which 20% / 24% / 40% ended the run |

- The low band's 20% is 3 coups in 15 rolls, too few to read.
- Reading the line on the card changes nothing for the eyes bot: 29 coups in 2,000 long reigns
  either way, and 2 in 2,000 runs of three eras. On its 94 roll cards, the two sides leave the
  odds a median of 1.8 points apart, at most 7.8, and in different bands on 10.
- Acting on the risk over the era does help. A version of the eyes bot that reads the cabinet
  every card once the vote is gone was tried: whenever the risk was not low, it leaned to the
  side that leaves Order and the State nearer half. It was couped 23 times instead of 29, and
  cut short 155 times instead of 163. The eyes bot itself is unchanged: it reads the table, not
  the cabinet.

**Fit.** The line is drawn as a count is. The longest-card audit now stages every card that
could carry it (anything but a vote, a campaign card or an appointment) twice: once as it was,
and once with the line at its longest, "moderate". It does this at all five heights and in all
seven looks. The first attempt drew the first lesson as well, and the longest questions, events
and named cards lost 2–30px of their text in Decay 2 and 3, and in Ascent 3 at 860px. So the
card the roll comes after draws no lesson, and the lesson for the coup comes when the vote is
abolished.

**Caveats.**
- A band read before the card can be wrong at the roll: 9 of 504 times, the side taken moved
  the odds across a band's edge.
- Once a player learns where the line comes, the threat's timing is public. There is no number,
  as the backlog asked, but whether people then play the odds rather than the country is for the
  closed test.
- On the card itself there is little to do with the line: what moves the risk moves over many
  cards. The cabinet says the band on any card, and the lesson says what moves it. How much a
  person does with them is measured only by the bot above.
- A lesson whose moment is the roll card waits for its next moment: the lesson for a card sent
  back by an earlier choice, say, waits for the next such card. How many lessons a player still
  lacks by the time the vote is abolished is not measured.

## Phase 70. Tell what happened out of office (idea 6) — *done in part*

**Shipped in v0.78.0.** Nothing is dealt differently: the deck is still 7jyrup04. Of idea 6's
three parts, the third is built. The first two would have made time out of office cost more.
They were measured and not built, because the premise they rested on was wrong.

**What was wrong with the premise.** The audit found that going out cost the informed voter
nothing in survival: 98.2% finales against 96.8%. But the runs that never went out include every
run that ended before its first vote, at card 26. Compared fairly, on runs alive at their first
vote, split by how it went (2,000 runs a bot):

| | First vote lost, went out | First vote won honestly |
|---|---|---|
| Informed: finale | 97.9% | 97.6% |
| Informed: Ascent | 22.0% | 29.3% |
| Mixed: finale | 97.8% | 98.2% |
| Mixed: Ascent | 12.1% | 22.9% |

- Going out costs nothing in survival, and it already costs 7 to 11 points of Ascent.
- The hold that keeps the state off its edges while out never did anything for a careful bot. It
  held a meter on none of their cards out of office: 7,515 for the informed voter, 6,417 for the
  mixed bot.
- It does matter for the eyes bot, which is not shown the state in danger while out. It held a
  meter on 2,658 of that bot's 12,294 cards out of office, in 899 of 1,256 oppositions.

**The two rules, measured and not built.**
- **The rival gaining standing while they govern.** At 1 a card out of office, the informed
  voter's runs that went out lost 4.5 more points of Ascent (23.1% to 18.6%; at 2 a card,
  16.4%), and survival did not move. That widens a gap that already punishes losing an honest
  vote, which phase 55 set out not to teach.
- **The state moving their way.** The parties' own cards differ on the state only in money:
  −0.47 a side for the Commons, +0.07 for the Ledger. So a party's way would help one party's
  runs and cost the other's. The rival as the game defines it, a mirror of the player, would pull
  drift toward the middle instead: another band cost for honest runs, for the reason above.

Each would be a single setting, if they are wanted anyway.

**What was built.**
- **History tells it.** The office lost moved from 71st of history's 74 to 42nd, and the office
  won back honestly from 68th to 31st. Measured on 3,000 runs a bot, one of the two is now among
  the four decisions the end screen follows up on in 95% of the mixed bot's runs that went out
  (was 10%), 97% of the informed voter's (was 31%) and 95% of the eyes bot's (was 2%).
  - They name a run's history in 1.5–5.5% of runs, and the office lost 7.3% of the eyes bot's.
    Each bot's most common name is still the one it was, and the harness's 15% cap holds.
  - The timeline dates them too.
- **The record says how the office came back:** "You lost the office at a count, and won it back
  at the next, honestly", or "…and took it back without winning the next". Before, once a run
  had also won or cheated a vote, it never said a vote was lost at all.
- **A run seen through out of office says so under its ending:** "The count went against you,
  and no vote came to win the office back: {rival} held it to the end, and you saw it from the
  opposition benches." The record no longer repeats it further down. A first term that goes
  out ends the same way.
- **Its sound is its own:** the three notes of a run seen through, walked down instead of up.
- **The end picture flies the rival's flags** over a run that ended out of office, as the
  country under the card did. So do the first road's picture and the sender's beside it.

**Not done:** no card reads that a run lost the office or won it back. Cards are outside this
round.

**Caveats.**
- The fair comparison is still bots. Whether people feel the band cost of going out, or play
  differently because of it, is for the closed test.
- Moving the two up the order changes which four decisions the end screen follows up on for runs
  that went out. The one they displace is listed below the four, with the rest.

## Phase 71. Endings a careful player can reach, and a codex that helps (idea 7) — *done*

**Shipped in v0.79.0.** Nothing is dealt differently: the deck is still 7jyrup04. Run saves are
version 17 and profiles version 9.

- **The endings in three kinds.** The codex sets them apart, each a section with its own count:
  - *Seen through*: the six finales;
  - *Ended by choice*: the 58 a side of a card takes outright, most of them a story's last step;
  - *Fell apart*: the 13 the run falls into, a meter at its edge, a cult, a lost count, the coup
    or the rival.

  A careful player's three finales read as 3 of 6, where they read as 3 of 77.
- **A first term's end** is listed with the finales, and says it is not counted: every profile
  begins with one.
- **Every clue is kept.** The codex gave one clue a run, a different one each time, and kept
  none: a clue read once could be seventy runs from coming back. Now each run's clue is a new
  one, and every clue given stays, newest first, until its ending is found or named as near.
- **A clue says which party can reach its ending** where only one can: "Only a run of the Ledger
  can end this way." That is 18 of the 77, and nothing said so.
- **Near misses over the whole run.** A run keeps the closest it came to each ending a meter can
  end it in, card by card. The codex took them from the last card alone.
- **A story's ways out are called outcomes**, not endings.

**Measured,** 2,000 runs a bot, whole-run near misses against the last card alone:

| | Runs with a near miss | Near endings named per 20 runs |
|---|---|---|
| Informed | 54 → 433 | 0.5 → 2.5 |
| Mixed | 43 → 367 | 0.4 → 2.7 |
| Eyes | 727 → 1,999 | 2.9 → 5.2 |

- No run lost a tie in these 6,000: no ending met its condition on the card another ending took.
  The case the audit named is left as it is.
- How many endings a player who aims at them reaches in 20 runs, with the clues kept, is the
  measure this idea asked for first. The bots cannot aim, so it waits for the closed test.
- The history names counted against what a run can reach were idea 1's (phase 66).

**Fit.** The browser audit gives a profile fifteen clues, three of them to endings only one
party can reach, and a first term's end, then opens each kind on the smallest phone for contrast
and fit.

**Caveats.**
- Kept clues make a list, which phase 58 set out to avoid by showing one at a time. It grows by
  one a run, and only while a clue's ending stays unfound.
- A clue is kept when the run it was out for ends, whether or not the player opened the codex to
  read it.
- A run saved before this version keeps near misses from where it was taken up again, plus its
  last card.
- "Ended by choice" includes endings a player would not call a choice, such as being consumed by
  a purge one started. The line is drawn where the game draws it: a side that says it ends the
  reign.

## Phase 72. An end screen that does not contradict itself (idea 8) — *done in part*

**Shipped in v0.80.0.** Nothing is dealt differently: the deck is still 7jyrup04. No save changes.

Built, the three things on the end screen that were wrong whatever a player feels:
- **A reign cut short is told as one.** Its name stands, under the card it stopped at: "Cut short
  at card 35 · Bankrupt", where every run said "Your rule ends". That is 57–70 of 2,000 careful
  runs, and 1,842 of the random bot's.
- **What the ending told is not followed up again.** "What became of it" and "Also left behind"
  leave out the legacies the story that ended the run left on it, and any its last card set.
  The name still comes from the run's defining decision. The follow-ups carried the road back
  from those decisions, so it is offered under the ending instead.
- **A long reign's end is drawn in the band it locked.** Its band locks at the fourth era and
  drift goes on moving, and the end screen's look and its city were drawn from drift. The end
  now holds drift inside the band. The play screen still follows drift, as its only sign of it.

**Measured,** 2,000 runs a bot, and the long reigns 1,000 each:

| | Ended by a story that left a legacy | Of which a follow-up goes | Left with none |
|---|---|---|---|
| Informed | 58 | 58 | 2 |
| Mixed | 47 | 47 | 2 |
| Eyes | 34 | 34 | 0 |
| Random | 668 | 624 | 41 |

- For the careful bots every one is the general's story: the general unleashed, followed up
  under an ending in which the general has you killed or kept. That follow-up read as a coda, not
  a contradiction. It goes because it repeats the ending.
- The contradictions removed are on endings the careful bots rarely reach, and the codex now
  points a player at: the stadium "paid off in its fortieth year" under The Games, in which it
  hosts a car boot sale; the printing "stopped in time" under The Wheelbarrows; the port's lease
  "broken in court" under The Leased Coast, which "still balances, from a shipping office
  abroad"; "the election you counted twice" under an ending that postponed it; and a question's
  Ascent follow-up, which tells its answer carried out the honest way, under the ending of it
  carried out the other.
- The audit's levee and census do not happen: in both stories the legacy is set only by the side
  that does not end the run.

| Long reigns | Band locked | Drift outside it at the end | Look on the other side | Look paler than the band's |
|---|---|---|---|---|
| Informed | 963 | 363 | 13 | 223 |
| Mixed | 971 | 467 | 42 | 320 |
| Eyes | 965 | 436 | 45 | 250 |

**Not built,** the repetition half of idea 8: leading with what is new and folding the epilogues a
player has read. Its premise is whether the repetition is felt, which is the fourth question in
`TESTERS.md`.

**Also shipped,** `TESTERS.md`: a brief for testers and one questionnaire of 13 questions, gathered
from the per-version notes in `twa/STORE.md`. It works for a playtest in the browser as well as
for the closed test.

**Fit.** Two browser audits on the smallest phone, for contrast and fit: a story's end reached by
taking one side on every card, with its road back under the ending; and a long reign locked in
the Ascent and ended with drift deep in the Decay, which must end in an Ascent look.

**Caveats.**
- The name is not changed. It comes from the run's defining decision, which can be the story that
  ended it, so a run ended by The Games can still be called "The Games That Paid". How often was
  not measured: every careful bot's story end is the general's, whose names fit.
- The general's story, a careful run's most common end short of a finale, loses its follow-up.
  The ending is its account; the screen says less, not more.
- A run whose only legacies its ending told has no "What became of it" at all: 2 of 2,000
  careful runs, 41 of the random bot's.
- A long reign's end looks like its band where drift says otherwise, so it can look different
  from the card before it.
- "Cut short" is said of every run that ended before its finale, including one a player chose to
  end, such as handing the office over.
