# Backlog, round six

Round five (BACKLOG-5.md) is phases 30–39, all done. BACKLOG-2's phase 17, getting the game
onto Play, is prepared and waiting on decisions only the owner can make. The owner asked for
this round to come first: more content and depth, more endings, more choices, less
repetition, and choices like the ones real governments face, such as going to war for an
ally, deporting everyone here without papers, cutting taxes for billionaires and universal
health care. These are phases 40–44.

Same rule as every round: each evidence line is measured against the shipped game at
v0.51.0, not estimated. Where a number comes from a bot, the bot is named, because a bot
measures the bot. "A player" below is the mixed bot playing runs in a row with its profile
carried forward, unlocks and all.

Status: **doing** · **queued** · **done**

The audit these were drawn from, at v0.51.0 (1,053 cards, 22 stories, 26 endings, 297
history names):

| | |
|---|---|
| The four examples, in the three ordinary eras | war for an ally 1 (in era 3, a treaty from the first era) · deportation, or papers **0** · universal health care **0** · the top rate 2 (a wealth tax for the left, a general tax cut for the right) |
| Other questions people vote on, offered as a choice | minimum wage 0 · rent control 0 · guns 0 · abortion 0 · death penalty 0 · tariffs 1 · carbon price 1 |
| Event cards where neither choice moves drift | 0 of 970 |
| A player's 10th run: cards already seen in an earlier run | **74%** (era 1: 74%) |
| A player's 20th run: the same | 91% (era 1: 89%) |
| Era 1, per side: cards a run can draw / the pool they behave like | about 340 / 204. One card is drawn in half of runs; the 40 most drawn are 28–29% of draws |
| 100 / 200 more era-1 cards (copies of existing ones), era 1 at the 10th run | 66% / 60% (20th run: 89% / 80%) |
| The same copies split into 10 groups, a run getting 3 | 69% / 63%: worse than the whole pool |
| Stories a run enters | 6 (median), against a budget of 4–6; the most common is met in 48% of runs |
| Stories with a turning point that can end the run | 8 of 22 |
| Runs that never offer a choice that ends the run | 54% |
| Endings a player is offered by choice in 20 runs / has seen | 5 / 4 of 26 (median) |
| Competent runs (mixed bot) that end in a finale | 95% |

## Three things this round has to get right

### 1. The game does not take sides on policy (TRANSFER §2, LOCKED)

Three of the four examples are one side's policy. Drift is what decides where the country
ends up. If it scored the policies themselves, so that deporting everyone cost drift and
universal care earned it, the game would be telling half its players that their politics
lead to ruin. That breaks the locked rule that alignment and morality are decoupled. It is
also the quickest way to be reviewed as propaganda by whichever half disagrees.

So a **question** is a short story of two or three cards:

- **The question** is the policy, named plainly: *Deport everyone here without papers* or
  *Give them a way to papers*. Its choices move the coalition and the meters (who is
  pleased and who pays) and carry **no drift**. No card does that today, so this is a new
  convention. It applies only to questions, and phase 40 adds a test that holds it there.
- **How it is done** moves drift, as every other card does:
  - hearings or raids;
  - a tax cut paid for, or borrowed and called growth;
  - universal care funded by a tax everyone can see, or promised free and put on the debt;
  - a war the legislature voted for, or a "police action" nobody voted for;
  - casualty figures published, or stopped.

Both sides meet every question, each in its own voice, with the coalition reacting the way
that side's coalition would. Each side's fast road is one of the failure modes TRANSFER §3
names for it:
- right: strongman methods, culture war as distraction, loyalty over competence;
- left: performative policy, loyalty bought with giveaways, bureaucratic capture.

Phase 40 measures it. With the mixed bot made to answer a question one way and then the
other, the share of runs ending in Ascent, and the share ending in Decay, move by at most 5
points. How it is done has to matter as well: the honest road reaches Ascent at least 10
points more often than the fast one.

### 2. Real policies, fictional country (TRANSFER §3)

The guardrail bans real people, parties and countries, not real policies. The ally, the
invader, and wherever the people without papers came from stay fictional. Real slogans and
real bill names stay out too: they belong to real parties, and they would date the satire.
Phase 40 adds a test that scans every card for real country names, party names and a list of
slogans.

### 3. More choices means more decisions, not a third option

The game is a binary swiper, and TRANSFER locks that. A third option on a card would mean
redesigning the swipe, the keys, the screen-reader buttons and the preview, and rebalancing
every bot and target. The questions add decisions a run did not have. That is what this round means by
more choices.

## Decisions for you

The defaults below are in force unless you change them, so phase 40 can start on them.

1. **The framing above:** no drift on the question, drift on how it is done. Default: yes.
2. **How plainly:** policies are named as people name them, but the country and everyone in
   it are fictional, and no real slogans are used. Default: yes.
3. **Which questions go in phase 41.** Default: the twelve listed there.
4. **Your call, off by default:** abortion, guns, the death penalty, religion in schools.
   Each could be written within the rules above, and each is the likeliest to cost reviews
   and to need a careful edit. I left off anything framed around a group of people (race,
   gender identity): the guardrail aims the satire at incentives and institutions, and on
   those subjects I expect it would land on people instead.
5. **Launch timing.** You asked for this before Play, but that is not required. The Play app
   is a TWA over the site, so each phase reaches Play players as soon as it deploys, with
   no store release. The case for finishing first is the content rating: war and deportation
   add to the violence answers in the IARC questionnaire (`twa/STORE.md`). It is simpler to
   answer that once, for the game that launches.

## Recommended order

- **40 first.** It is your four examples, and it sets the conventions and tests the rest
  depends on.
- **41 next.** Four questions, met two or three per run, are all seen within a few runs.
- **42 and 43** can run in either order. 42 makes the answers matter later in the run; 43
  makes endings something a player chooses.
- **44 last.** 40–43 all add era-1 cards, so the top-up is sized from what is left after
  them.

Each phase is drafted for your edit. Taken together, 40–44 are likely to add 400–600 cards,
which is half the deck again. That estimate is speculation. Each phase stands on its own, so
the round can stop after any of them.

---

## Phase 40. The four you named — *queued*

**Why.**
- War for an ally has one card, in era 3, about a treaty signed in the first era.
- Deportation, or papers, has no cards (one era-2 card on migrant farm labour).
- Universal health care has no cards.
- The top rate has two: a wealth tax for the left and a general tax cut for the right.
- The deck satirises the machinery of power: money, spin, loyalty, procurement and
  elections. It says almost nothing about the questions people vote on.

**What.**
- **Four questions**, each a short story either side can meet in era 1.
  - **The treaty.** The ally is invaded, and the treaty is one sentence long: go or stay out.
    Then the method:
    - ask the legislature, or call it a police action;
    - publish the casualty figures, or stop;
    - a draft that takes everyone's children, or one that spares the donors';
    - the peace terms.

    Staying out has a road of its own: say so plainly, or say the treaty never meant it and
    sell arms to both sides.
  - **Without papers.** Deport everyone here without papers, or give them a way to papers.
    Then the method:
    - hearings or raids;
    - what to say when the raids take citizens;
    - a law with the conditions written into it, or enforcement quietly stopped and denied.
  - **The top rate.** The donors want it cut and say it pays for itself; the base wants a tax
    on the very rich. Then the method:
    - pay for it or borrow;
    - publish the forecast, or the flattering one;
    - close the loopholes, or leave them for friends.
  - **Everyone covered.** Care for everyone, paid for by the state, or vouchers and the
    market. Then the method:
    - a tax everyone can see, or a promise of free care put on the debt;
    - the waiting lists published, or managed;
    - drug prices capped, or negotiated.
- **Their own budget.** A run enters about six stories and the story budget is full, so
  questions added to it would crowd out the 22 stories already there. Questions get a budget
  of their own, and a run meets two or three. The card says it is a question, so a player
  knows this is the big decision.
- **What they leave behind.**
  - Each road leaves a legacy the later eras can read (phase 42 does the reading).
  - Each question is a decision a history can be named for, with titles for every
    direction, both sides, and the long view.
  - Each has an ending of its own, chosen at its turning point. At least one of the four is
    not a failure: sign the peace and hand over, as promised.
- **The conventions, as tests:**
  - a question carries no drift, and every card after it does;
  - every question can be met by both sides, in their own words;
  - no real country, party or slogan appears on any card.

**Targets.**
- Each question is met in at least 35% of runs, on each side (mixed bot), and a run meets at
  least two (median).
- Answering a question the other way moves the Ascent share and the Decay share by at most 5
  points each, per side, per question.
- The honest road reaches Ascent at least 10 points more often than the fast road.
- Every existing story is still met in at least 80% as many runs as before.
- No decision defines more than 15% of histories (the existing rule).
- Every harness target still holds, for three eras and for the long reign.

**Cost.**
- About 50 cards, 4 endings and their history titles, drafted for your edit.
- A small engine change: the second budget. Like any content change, it changes which cards
  a given seed draws, so the fingerprint of 8,000 runs is expected to move.

## Phase 41. Twelve more questions — *queued*

**Why.** Four questions, met two or three per run, are all seen within a few runs. The
questions people vote on are almost absent: minimum wage, rent control, guns, abortion and
the death penalty have no cards, and tariffs and a carbon price have one each.

**What.** The same shape as phase 40, for the list you approve (decision 3). The default:

1. **Minimum wage:** raise it by law, or leave it to employers.
2. **Housing:** control rents, or clear the zoning rules and build.
3. **Climate:** put a price on carbon, or drill what is under the ground.
4. **Trade:** tariffs to save the last factories, or open trade.
5. **Pensions:** raise the pension age, or keep it.
6. **Student debt:** cancel it, or leave it.
7. **Drugs:** legalise and tax them, or crack down.
8. **Crime:** more police and longer sentences, or reform and oversight.
9. **Cameras:** face recognition on every street, or none.
10. **Speech:** a law against misinformation, or no such law.
11. **The courts:** add seats to the highest court, or leave it alone.
12. **The banks:** bail them out, or let them fail.

Held back until you decide (decision 4): abortion, guns, the death penalty, religion in
schools.

**Targets.**
- Everything phase 40 measures, for every question.
- The budget is set again for sixteen: a run meets at least three questions (median).
- Every question is met in at least 15% of runs.
- A player has met every question at least once by their 20th run (median).

**Cost.** About 100 cards, their endings and history titles, for your edit.

## Phase 42. The answers come back — *queued*

**Why.**
- Of the cards a run can draw in era 1, 126–131 per side turn up in fewer than 5% of runs.
  All but three of them per side wait on a condition (83–89) or a queue, a story or an
  election (39–40). Cards that wait on something are where the deck's depth is.
- Nothing in eras 2–5 reads what a run did about war, borders or health care, because there
  is nothing yet to read. Taxes have one promise, that taxes will not rise, and three cards
  that follow it.

**What.**
- Each road comes back in the eras after it:
  - **The treaty:** the veterans and the war debt twenty years on, and the ally's gratitude
    or its grudge.
  - **Without papers:** the court backlog, the empty fields, or the new citizens voting.
  - **The top rate:** the deficit a cut left, or the money that left instead.
  - **Everyone covered:** the health service at seventy-five, or the hospitals the market
    closed.
  - **Two centuries on:** what is left of each.
- The end screen names it. A history's "after" line says what became of the question that
  defined the run.
- The codex shows each question and how you have answered it across runs.

**Targets.**
- Every road of every question has at least one card that reads it in era 2, one in era 3,
  and one in era 4 or 5.
- Of the runs that answered a question and reached era 2, at least 60% meet something that
  comes of it.
- No decision defines more than 15% of histories.

**Cost.** About three cards per road. For sixteen questions that is around 100 cards, plus
the codex section.

## Phase 43. Endings you choose — *queued*

**Why.**
- 95% of competent runs end in a finale, so a player sees 4 of 26 endings in 20 runs.
- BACKLOG-3 phase 26 said more failure endings would not change that, and for ousters by
  meters it was right.
- An ending a player can choose is different: they will take it to see it. Today only 8 of
  22 stories have a turning point that can end the run, 54% of runs never offer one, and a
  player is offered 5 distinct endings by choice in 20 runs.

**What.**
- A turning point that can end the run for the 14 stories that have none: the plague, the
  press, the water, the strike, the moonshot and the rest.
- At least a third of the new endings are not failures: hand over in good order, retire to
  the job you wanted, or let the referendum decide and go.
- The endings the questions add in 40–41 count toward the target, and this phase fills the
  gap.
- The objectives that count endings are measured again: choosing endings should make "ten
  endings" reachable.

**Targets.**
- At least 75% of runs offer a choice that ends the run.
- A player is offered at least 12 distinct endings by choice in 20 runs.
- Every story can end the run at its turning point.
- Every harness target still holds.

**Cost.** Around 14 endings and 20–30 cards.

## Phase 44. Fewer repeats — *queued*

**Why.**
- A player's 10th run: 74% of its cards were seen before. Their 20th: 91%.
- Copies of existing era-1 cards, the method phase 36 used, say what more cards buy:
  - 100 more take era 1's 10th run to 66%;
  - 200 more take it to 60%;
  - the 20th run only drops to 80%.
- The alternatives do not help:
  - **Giving each run a subset of the deck** is worse than the whole pool at the same count:
    69% and 63%.
  - **Evening out the draw** has little room: the draw already behaves like 204 of the
    roughly 340 cards a side can draw in era 1, and the rest are conditional or queued by
    design.
  - **A draw that avoided cards this profile has seen** (not measured) would break run
    codes, replay, challenges and the daily, which all depend on a run following from its
    code alone.

**What.** A top-up after 40–43, sized the same way before any of it is written:
- ordinary cards, era 1 first, because every run starts there;
- then eras 2 and 3.

**Targets.**
- A player's 10th run: at most 60% seen before in era 1, and at most 65% over all eras.
- A player's 20th run: at most 85%.

**The limit.** Card count buys little at the 20th run: 200 more era-1 cards take its era 1
from 89% to 80%. Late runs will repeat whatever this phase does.

**Cost.** Not known until 40–43 land. If the copies hold, 150–300 cards.

---

## Considered, and not proposed

- **Scoring the policies themselves.** See the first section: it breaks TRANSFER §2.
- **Real countries, parties, slogans or events.** TRANSFER §3, and they date the satire.
- **A third option per card.** See the first section: it breaks the locked genre and every
  input path.
- **A draw that avoids what a profile has seen.** Likely the strongest lever left (not
  measured), and it breaks every feature that shares or replays a run.
- **Each run getting a slice of the deck.** Measured worse than the whole pool.
