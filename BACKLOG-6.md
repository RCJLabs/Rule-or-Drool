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
every bot and target. The questions add decisions a run did not have. That is what this
round means by more choices.

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

## Phase 40. The four you named — *done*

**Shipped.** Four questions, asked plainly, of both sides:
- **The treaty.** Go to war for the ally, or stay out.
- **Without papers.** Deport everyone here without papers, or give them a way to papers.
- **The top rate.** Cut it, or tax the very rich.
- **Everyone covered.** Care for everyone, paid for by the state, or vouchers and a market.

The answer moves the coalition and carries no drift. How it is carried out decides where the
country goes. A run meets two of the four, in its first era. The card says it is the
question, and every step after it carries the question's title.

**What it adds:**
- **44 cards**, drafts for your edit. Each question is an arc per side, in that side's own
  voice, with the coalition reacting as that side's would:
  1. the question, which carries no drift;
  2. how the answer is carried out: the honest way (drift +5) leaves the story, and the fast
     way (−12) goes on;
  3. a turning point on the fast road: an honest way out (+6), or worse (−12);
  4. on two roads, a fourth step before an ending that is the honest way out (+8).
- **4 endings**, one per question, each reached by choosing it:
  - *The Last Signature*: the enemy will sign with anyone but you, so you sign and step down.
    Not a failure.
  - *Taking Responsibility*: a death on a list you managed; you say so and resign. Not a
    failure.
  - *Contempt of Court*: you ignore the court on papers or deportations.
  - *In Receivership*: you hand the budget to the lenders after the top rate goes wrong.
- **Each side fails on its own base's policy.** On the left the court ending sits on the
  road to papers and the lenders on the tax on the very rich; on the right, on deportation
  and the cut. Care's resignation follows the same rule: care for everyone on the left, the
  market on the right. The treaty's, which is not a failure, is on the war for both.
- **8 legacies**, one per answer, each named in the codex, with 72 history names and 24
  "after" lines. They rank as a block just under the captured feed: deportation, the war,
  care for everyone, papers, staying out, the market, the cut, the tax.
- **An engine change:** questions are arcs with a `question` id and a budget of their own
  (2 a run, one at a time), so they neither take the stories' slots nor wait for them. With
  no questions in the content, every run is exactly what it was: the hash of 8,000
  three-era runs did not change.
- **The conventions, as tests and validator rules:** a question carries no drift; every card
  after it carries drift of opposite signs; every question is asked of both sides; each
  answer leaves a named legacy; an honest ending waits a step; the court and the lenders fail
  each side on a different answer.
- **A guardrail test** (`tests/guardrails.test.ts`) searches everything the game can show
  for real countries, peoples, faiths, parties, slogans and politicians. It found none,
  before or after.

**How it was balanced.** Each draft was measured against the targets below, and each miss
changed the design, not the target:
- **The first draft ended random play at card 31** (median; the target is 40–60). Both
  answers' fast roads could end the run, three questions a run. Now each side's arc has one
  ending, on its own base's policy.
- **Greedy play reached Decay 68% of the time** (target ≥ 70%). The fast ways were no better
  for the meters than the honest ones, so nothing tempted. They were put on the deck's own
  pattern: the fast way helps now, the honest way costs now.
- **The answers carried money.** The war, deportation, the cut and care for everyone all cost
  money, and the other answers saved it. The mixed bot, near a meter's edge on 37% of the
  questions it met, took the cheaper answer 63% of the time, and an answer moved Ascent by up
  to 10 points. The answers now move the coalition, and money moves with how it is done.
- **An honest ending left no honest way to go on.** Signing the peace or resigning ends the
  run, so anyone who wants to keep playing was pushed down the fast road, and the answer
  carrying that ending was harsher. Those endings now wait a step, behind an honest way out.
- **The honest road was worth only 4–8 points of Ascent a question** at +4 and −8. It is +5
  and −12 now, inside TRANSFER's range for a story's steps (±5 to ±15).
- **Three questions a run became two.** At three, nearly every run met three of the same four,
  and a war for the ally named up to a quarter of all histories.
- **On the left, care moved the Movement and the Unions together.** Every other question splits
  a coalition whichever way it goes, and that one did not. Now the Unions prefer the health
  plans they bargained for, as unions often do, and the money on the honest ways is evened out.
- **Histories rank the questions under the captured feed, deportation first.** Ranked first
  among them, just under the moonshot, a war for the ally named 15.0–15.5% of competent runs'
  histories on two fresh samples of 6,000, over the rule that no decision names more than 15%.

**Measured.** The mixed bot, paired seeds: each seed played twice, the question answered one
way and then the other, or its method taken the honest way at every step and then the fast
way at every step that does not end the run. Everything else as the bot plays it.

| Question | Side | Answer moves Ascent | Answer moves Decay | Honest road | Fast road | Gap |
|---|---|---|---|---|---|---|
| The treaty | left | 2.9 points | 2.9 points | 22.5% | 8.1% | +14.4 |
| The treaty | right | 0.8 points | 1.7 points | 21.4% | 5.7% | +15.8 |
| Without papers | left | 0.5 points | 1.1 points | 21.4% | 9.9% | +11.5 |
| Without papers | right | 1.5 points | 0.9 points | 21.2% | 9.9% | +11.3 |
| The top rate | left | 1.6 points | 4.5 points | 21.6% | 9.9% | +11.7 |
| The top rate | right | 0.9 points | 2.1 points | 22.7% | 8.8% | +13.9 |
| Everyone covered | left | 2.3 points | 1.1 points | 24.2% | 5.9% | +18.4 |
| Everyone covered | right | 0.1 points | 1.3 points | 25.0% | 3.8% | +21.2 |

Over a whole run, with every question it meets carried out the same way, the honest road
reaches Ascent 24.5% of the time against 3.6% for the fast road on the left, and 26.2%
against 2.4% on the right.

**Everything else still holds**, at 20,000 runs a bot:

| Target | Wanted | v0.51.0 | Now |
|---|---|---|---|
| Random: median run length | 40–60 cards | 59 | 53 |
| Random: most common ouster | ≤ 35% | bankruptcy 26.1% | bankruptcy 21.2% |
| Greedy: ends in Decay | ≥ 70% | 75.7% | 80.6% |
| Saint: ousted before era 2 | ≥ 60% | 100% | 100% |
| Mixed: reaches Ascent | 15–30% | 21.2% | 19.9% |
| A player's tenth run: cards seen before | under 75% | 73.3% | 72.4% |
| Long reign: all six targets | as phase 39 | pass | pass |

- **Each question** is met in 45–47% of runs on each side, and a run meets two (median).
- **Stories** are unhurt: every story is still met in at least 90% as many runs as with no
  questions (the target was 80%), and a competent run still enters 6.1 of them (6.2 before).
- **History names:** the most any decision names is 13.6% (deportation), and the most any one
  title names is 4.0%. A harness test now holds the 15% rule on 6,000 runs.
- **Random play** ends early more often: 33.4% of random runs end in the first era, up from
  25.4%. The four new endings end 5.2% (the lenders), 5.1% (the court), 2.5% (the peace) and
  2.4% (the resignation) of random runs. Competent bots take none of them.
- **The bundle** grew by 6.2 KB gzipped.

**Done when, checked:**
- Each question met in at least 35% of runs, each side: 45–47%.
- A run meets at least two (median): two.
- An answer moves the Ascent share and the Decay share by at most 5 points: at most 4.5.
- The honest road reaches Ascent at least 10 points more often than the fast road: at least
  +11.3.
- Every existing story met in at least 80% as many runs: at least 90%.
- No decision names more than 15% of histories: 13.6%.
- Every harness target holds, three eras and long: all pass.

**Also checked:**
- The unit suite is 561 tests and the browser suite 41. The new browser audit puts the
  longest question card each side can be asked on a 360px phone in all seven looks, and
  checks contrast and fit.
- A screen reader hears the question's title before the card, as a sighted player sees it.
- Two tests pinned to the old deck were re-pinned: the screen-reader test's seed (seed 3 no
  longer opens on a card that names its speaker; 21 does again) and one malformed challenge
  link ("AAAA" is three bytes, the right length for a run of 17–24 cards, which the new deck
  happened to deal).
- **A card that did not fit, found on the way.** The audit seed now opens on a median-length
  card, and at 360×640 in the brightest Ascent look, with the choice buttons, a promise and the
  first lesson all drawn, its last line was cut off by 5px. The Ascent's line spacing (up to
  1.7) is now 1.5 on screens 700px tall or less. That was true before this phase, for any
  card of that length.
- **The browser drivers play like someone paying attention.** They swiped on a fixed pattern
  chosen to survive the old deck. The new one walked a run into a question's ending at card 12,
  and another up to Money 96, where card 35 ended it either way. They now never take a side
  that ends the run when the other does not, and take the calmer side while a meter is within
  15 of an edge.

**Yours:**
- **The cards and names are drafts.** 44 cards, 4 endings, 72 history names, 24 "after" lines
  and 8 legacy names, written to the deck's rules and checked, but not edited by you. These
  are the most sensitive cards in the game: read them for tone before launch.
- **Honest is on the left.** 907 of the deck's 970 event cards put the honest choice on the
  left swipe, and the method cards here follow that so as not to stand out. A player who
  notices can steer the hidden drift without reading a card. This predates the phase. Moving
  half the deck's honest choices to the right is mechanical and changes nothing for the bots.
- **Repeats.** Four questions, two a run: a player has met all four within a few runs, and
  from then on the questions repeat. Phase 41's twelve are the fix, and the budget can go
  back to three with sixteen.
- **No picture yet.** The world drawn after a run has no landmark for the new legacies.
- **Old links and replays.** As with any change to the deck, a run code sent before this
  version deals differently now, and a run finished before it cannot take the other road.
- **The content rating.** The store notes now list the war, the raids and the two deaths
  (`twa/STORE.md`). The questionnaire should be answered from them.

<details><summary>Original entry</summary>

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

</details>

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
