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

## Phase 41. Twelve more questions — *done*

**Shipped.** The default twelve, each asked of both sides in phase 40's shape:
- **The minimum wage.** Raise it by law, or leave it to employers.
- **Somewhere to live.** Clear the zoning rules and build, or control the rents.
- **What we burn.** Put a price on carbon, or drill what is there.
- **The last factories.** Put up tariffs, or open trade.
- **The pension age.** Raise it, or keep it where it is.
- **Student debt.** Cancel it, or leave it to be repaid.
- **The drug laws.** Crack down, or legalise and tax them.
- **Crime and punishment.** More police and longer sentences, or reform and oversight.
- **The cameras.** Face scanners on every street, or ban them.
- **What counts as true.** A law against misinformation, or no such law.
- **The highest court.** Add four seats, or leave it be.
- **The failing banks.** Bail them out, or let them fail.

Abortion, guns, the death penalty and religion in schools are still held back (decision 4).

**What it adds:**
- **126 cards**, drafts for your edit, in each side's own voice: the Movement, the Unions and
  the Cities on one side, the Faithful, the Donors and the Country on the other, each
  reacting as that side's coalition would.
- **12 endings.** Nine are failures, each on the road of the side's own coalition's policy, so
  each side fails on a different answer:
  - *The General Strike*: a raise decreed over the Unions' heads, or farm workers paid in
    vouchers.
  - *Condemned*: a block nobody repaired under a rent freeze, or a tower its builders
    inspected themselves.
  - *The Long Blackout*: coal plants shut before the wind farms opened, or the gas sold
    abroad.
  - *The Grey March*: a pension fund borrowed from, or savings spent on a tax cut.
  - *Under New Management*: the gangs licensed to sell, or police selling what they seized.
  - *The Breakout*: prisons emptied too fast, or a private prison nobody paid to guard.
  - *The Emergency*: police cameras nobody banned, or a firm that kept every face.
  - *The Crowded Bench*: a court packed in a race to pack it. The right fails on the same
    question by ignoring the court it left alone, which is phase 40's *Contempt of Court*.
  - *The Run*: savers never told, or a rescue paid out as dividends.

  Three are honest endings, not failures. Each comes at step 4, after the fast road:
  - *The Last Shift*: you go to the last factory's gate and tell them.
  - *In Those Words*: you say it was a mistake, and that you knew.
  - *The Correction*: you say the story was true, or the fake was yours.
- **24 legacies**, one per answer, with 216 history names and 72 "after" lines. The game now
  has 42 endings and 585 history names.
- **Three a run, in the first two eras.** The budget is 3 (it was 2). A question can be
  asked in era 2 as well as era 1, and its steps can run into era 3.

**How it was balanced:**
- **Asked in the first era only, three a run did not reach every question.** Measured with
  the four questions standing in for sixteen, a run met 2.5 of them and the least asked
  question was met in 14% of runs. Across the first two eras the figures are 2.9 and 17%.
- **Sixteen questions cost the competent bot its Ascent.** At phase 40's drift, mixed play
  reached Ascent 15.1% of the time (the target is 15–30%, and it was 19.9%). It carries out
  63% of question steps honestly. The other 37% it takes the fast way, near a meter's edge,
  which cost it 6.9 drift a run. The honest step is now +7 (was +5) and the honest way out
  +8 (was +6). The fast way stays −12, and phase 40's four are included. Mixed Ascent is
  back to 20.1%, and greedy play still ends in Decay 81.1% of the time.
- **The honest road on the left's papers was too dear.** It reached Ascent only 9–10 points
  more often than the fast road. Its honest steps cost less now, and its fast steps pay less
  (+11.1 to +12.6 on three seed sets).
- **The treaty's war was harder on the right than staying out.** The last step before the
  peace, which a player who will not end the run always takes, cost money 4 and the Country
  3. It costs 2 and 2 now.
- **Taxing the very rich left the right's Donors exposed.** The answer took 5 from them and
  closing the loopholes 5 more, so Decay was 5.0–5.3 points likelier than after the cut. Both
  answers now move the Donors 4.
- **Histories rank the questions in three tiers.** With three a run, nearly every run carries
  several question legacies, and a single block would have named most histories after a
  question. The largest answers (deportation, the war, care for everyone, papers, staying
  out, the court, the cameras, the banks, legal drugs, the truth law, the carbon price, the
  debt cancelled, the gas) rank under the captured feed. The middling ones rank under the
  skim. The status quo (the court left alone, no truth law, the debt kept, the pension age
  kept, wages left to employers) ranks under the broken promises.

**Measured.** The mixed bot on paired seeds, as in phase 40: each seed played with the answer
forced each way, then with the method taken the honest way at every step and the fast way at
every step that does not end the run.

| Question | Side | Answer moves Ascent | Answer moves Decay | Honest road | Fast road | Gap |
|---|---|---|---|---|---|---|
| The treaty | left | 1.2 points | 3.4 points | 23.6% | 7.4% | +16.1 |
| The treaty | right | 0.3 points | 5.0 points | 23.5% | 6.5% | +16.9 |
| Without papers | left | 0.6 points | 1.8 points | 23.4% | 11.3% | +12.1 |
| Without papers | right | 0.4 points | 0.3 points | 24.0% | 11.4% | +12.6 |
| The top rate | left | 0.1 points | 4.1 points | 27.0% | 10.4% | +16.6 |
| The top rate | right | 2.2 points | 1.3 points | 27.3% | 10.0% | +17.3 |
| Everyone covered | left | 0.3 points | 1.8 points | 23.6% | 5.2% | +18.4 |
| Everyone covered | right | 4.4 points | 3.0 points | 27.2% | 5.0% | +22.2 |
| The minimum wage | left | 0.1 points | 0.1 points | 23.5% | 8.7% | +14.7 |
| The minimum wage | right | 1.1 points | 1.0 points | 23.9% | 10.0% | +13.8 |
| Somewhere to live | left | 1.3 points | 1.8 points | 23.8% | 10.0% | +13.8 |
| Somewhere to live | right | 1.6 points | 0.1 points | 24.2% | 10.6% | +13.6 |
| What we burn | left | 0.4 points | 0.7 points | 23.7% | 9.5% | +14.1 |
| What we burn | right | 0.5 points | 0.7 points | 26.1% | 10.7% | +15.3 |
| The last factories | left | 0.5 points | 4.6 points | 22.7% | 6.4% | +16.3 |
| The last factories | right | 0.2 points | 2.0 points | 25.2% | 5.8% | +19.4 |
| The pension age | left | 0.6 points | 1.1 points | 23.8% | 9.3% | +14.4 |
| The pension age | right | 1.7 points | 1.6 points | 27.2% | 9.0% | +18.2 |
| Student debt | left | 0.0 points | 3.1 points | 23.1% | 7.4% | +15.7 |
| Student debt | right | 0.1 points | 0.9 points | 25.3% | 6.9% | +18.4 |
| The drug laws | left | 1.4 points | 0.5 points | 22.6% | 8.9% | +13.6 |
| The drug laws | right | 1.8 points | 0.7 points | 26.3% | 9.4% | +16.9 |
| Crime and punishment | left | 1.9 points | 2.7 points | 22.4% | 9.0% | +13.5 |
| Crime and punishment | right | 2.0 points | 1.8 points | 26.7% | 9.5% | +17.2 |
| The cameras | left | 1.6 points | 0.1 points | 25.7% | 9.9% | +15.8 |
| The cameras | right | 2.4 points | 1.2 points | 22.4% | 9.2% | +13.2 |
| What counts as true | left | 0.7 points | 2.3 points | 23.4% | 5.8% | +17.5 |
| What counts as true | right | 1.8 points | 1.7 points | 25.5% | 5.3% | +20.2 |
| The highest court | left | 2.6 points | 4.7 points | 25.2% | 10.6% | +14.6 |
| The highest court | right | 0.6 points | 1.6 points | 23.5% | 9.8% | +13.7 |
| The failing banks | left | 0.3 points | 0.8 points | 21.7% | 8.9% | +12.9 |
| The failing banks | right | 0.8 points | 1.0 points | 25.0% | 9.6% | +15.4 |

The largest answer effect, the treaty's 5.0 points of Decay on the right, is on the limit on
this seed set and 0.6 on the second. On the second set every row passes: the answer moves
Ascent or Decay by at most 3.9 points, and the gap is at least +11.3.

Over a whole run, with every question it meets carried out the same way, the honest road
reaches Ascent 33.7% of the time against 0.8% for the fast road on the left, and 36.2%
against 0.6% on the right.

**Everything else still holds**, at 20,000 runs a bot:

| Target | Wanted | v0.52.0 | Now |
|---|---|---|---|
| Random: median run length | 40–60 cards | 53 | 49 |
| Random: most common ouster | ≤ 35% | bankruptcy 21.2% | bankruptcy 19.4% |
| Greedy: ends in Decay | ≥ 70% | 80.6% | 81.1% |
| Saint: ousted before era 2 | ≥ 60% | 100% | 100% |
| Mixed: reaches Ascent | 15–30% | 19.9% | 20.1% |
| A player's tenth run: cards seen before | under 75% | 72.4% | 68.6% |
| Long reign: all six targets | as phase 39 | pass | pass |

- **Questions per run:** three (median), 2.9 on average. Each question is met in 17.0–19.4% of
  runs. A player has met all sixteen by their 15th run (median, over 80 players), and by
  their 20th three times in four.
- **Stories are unhurt.** Every story is met in at least 84.7% as many runs as with no
  questions (the target is 80%; the moonshot is the lowest). A competent run enters 5.9 of
  them (6.3 with no questions).
- **History names:** the most any decision names is 8.8% (the ring, an old legacy). The most
  any one title names is 2.8%, and 6,000 runs met 245 different titles. Questions name about
  60% of histories.
- **Random play ends early more often.** 37.7% of random runs end in the first era (33.4% at
  v0.52.0, 25.4% before the questions). Question endings end 24.2% of random runs, none more
  than 2.5%. The competent bots take none.

**Done when, checked:**
- Everything phase 40 measures, for every question: the answer moves Ascent and Decay by at
  most 5.0 points on this seed set (the target is 5), and the honest road reaches Ascent
  at least +12.1 points more often. Stories are at 84.7% or more; histories at 8.8%; every
  harness target passes, for three eras and for the long reign.
- A run meets at least three questions (median): three.
- Every question met in at least 15% of runs: 17.0–19.4%.
- A player has met every question by their 20th run (median): by their 15th.

**Also checked:**
- The unit suite is 563 tests and the browser suite 41. New tests hold the three coverage
  targets, the count of failures that fall on each side's own policy, and all sixteen
  titles.
- **The progress code grew.** A forty-run profile is 9.6 KB now (8.0 KB before). The extra is
  mostly question outcomes and legacies. Its code is 3.1 KB (2.5 KB before), which was past
  the test's 3,000-character bound, so the bound is now 4,000. It is still short enough to
  paste, and a link with it in works in current browsers.
- **The guardrail test** passes on all 126 cards. The cards name real policies and nothing
  else real.
- **The download** grew by 16.4 KB gzipped: the content file went from 130.8 KB to 146.8 KB.

**Yours:**
- **The cards and names are drafts.** 126 cards, 12 endings, 216 history names, 72 "after"
  lines and 24 legacy names, written to the deck's rules and measured, but not edited by you.
- **The content rating now includes drugs.** The drug-laws question refers to illegal drugs
  as policy: dealers, seizures resold by the police, a cartel, packets in playgrounds. No
  drug is named or shown being taken, but the IARC questionnaire asks about references
  (`twa/STORE.md` has the notes). The violence notes add a police officer breaking a boy's
  arm, a prison breakout and a building that falls down empty.
- **Phase 40's numbers changed.** Its four questions now use the new drift and the
  first-two-eras rule, and the papers, treaty and top rate tweaks above. Its entry is kept as
  it shipped.
- **Honest is still on the left** for every method card, as in the rest of the deck (phase
  40's note).
- **Old links and replays:** as with any change to the deck, a run code from before this
  version deals differently, and a run finished before it cannot take the other road.
- **Phase 44 sizes era 1.** Questions now start in era 2 as well, so its top-up should be
  measured again when it starts.

<details><summary>Original entry</summary>

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

</details>

## Phase 42. The answers come back — *done*

**Shipped.** Every answer to every question now comes back in the eras after it:
- **128 cards**, four per answer: one in era 2, one in era 3, and two centuries on in eras
  4–5 (one for a reign locked in Decay, one for Muddle and Ascent). Each reads the answer's
  legacy, so a run meets only what its own answers left behind: the veterans' pensions and
  the war debt, the empty fields and the deported citizens' children, the tax cut's interest
  and the money that left, the health service at seventy-five or the hospitals the market
  closed, and so on for all sixteen.
- **Shared by both sides.** Both sides are asked every question and give the same two
  answers, so each card serves whichever side gave the answer. As in the deck's other shared
  cards, no coalition is named. Each is written to read true whichever way the answer was
  carried out. Honest is on the left, as on every era 2–5 card.
- **The codex has the questions.** A new section lists each question, blank until it has
  been asked, and then how often you gave each answer across your runs ("Send the army 2 ·
  Stay out of it 1"). The count at the top shows how many of the sixteen you have been asked.
  It is read from the legacies a profile already keeps, so nothing new is saved. The
  questions no longer count as stories there.
- **The end screen already names it.** The "what became of it" list shows the first four
  legacies a run carries, each with its "after" line, and phases 40–41 wrote those lines for
  every answer. 90% of the questions a competent run answers are on that list. The rest are
  named in its "also" line.

**How it was built:**
- **Drawn from the deck, not queued.** A queued card would arrive a fixed number of cards
  later whatever the era, and the targets ask for one in each era. Placeholder cards set the
  weight first: at weight 1 a competent run met a comeback for 25% of its answers, at 3 for
  56%, and at 5 for 74%. They are weight 5, and each comes once a run.
- **The war cost more afterwards than staying out.** The veterans' pensions and the war
  debt cost 10 money on the honest side against 4 for staying out's comebacks. That tipped
  Decay 7.7 points toward the war on the right. The money is even now. The top rate's
  comebacks were evened the same way: the cut's fast options paid and the tax's cost.
- **The treaty's honest ending moved on the left.** Both sides had it on the war (*The Last
  Signature*). A player who will not resign pays for that road's extra step, so the war
  answer leaned toward Decay on both sides. Every later question puts its honest ending on
  each side's own base's policy. The left's is now on staying out: the photograph of our
  shells wins a prize abroad, and you say you knew (*In Those Words*). The right keeps *The
  Last Signature*. The right's war road also costs the Donors 3 twice where it cost 4.
- **Two centuries on is written twice.** 96 cards for any band left 19.7% of the deck
  written for a band, under the 20% that keeps the band you are in visible. A long reign's
  band is locked after its third era, so what is left of each answer two centuries on is
  now written for Decay and for the rest: 32 cards more. "The health service is the oldest
  thing that still works" was not true in a reign that went down.

**Measured.** The mixed bot:

| Target | Wanted | Now |
|---|---|---|
| A card that reads each answer in era 2, era 3, and eras 4–5 | every answer | all 32, every band |
| Answered a question, reached era 2, met something that came of it | ≥ 60% | 73.4% and 73.2% (two seed sets) |
| The least-met answer | – | 66% (rents controlled) |
| In a long reign | – | 98.2% |
| No decision names more than 15% of histories | ≤ 15% | 8.3% |

A competent run meets 2.9 comebacks: 1.3 in era 2 and 1.5 in era 3. A long reign meets 2.8
more, nearly all in era 4, where each answer's card becomes eligible at weight 5.
Random play meets one for 40% of its answers, because most of its runs end first.

**Every question still keeps its answer out of the direction.** The paired-seed measure of
phases 40–41, on 12,000 seeds a side (at least 2,129 runs a row):

| Question | Side | Answer moves Ascent | Answer moves Decay | Honest road | Fast road | Gap |
|---|---|---|---|---|---|---|
| The treaty | left | 1.1 points | 0.6 points | 24.3% | 7.5% | +16.9 |
| The treaty | right | 2.2 points | 3.0 points | 23.4% | 6.3% | +17.2 |
| Without papers | left | 1.5 points | 1.3 points | 21.3% | 9.9% | +11.4 |
| Without papers | right | 1.5 points | 0.4 points | 24.1% | 11.7% | +12.4 |
| The top rate | left | 0.8 points | 3.3 points | 25.5% | 10.7% | +14.8 |
| The top rate | right | 2.4 points | 2.4 points | 27.6% | 9.9% | +17.6 |
| Everyone covered | left | 1.0 points | 0.7 points | 22.7% | 6.1% | +16.6 |
| Everyone covered | right | 2.7 points | 3.9 points | 26.1% | 4.8% | +21.3 |
| The minimum wage | left | 0.8 points | 0.4 points | 22.2% | 9.6% | +12.6 |
| The minimum wage | right | 0.9 points | 0.6 points | 23.5% | 9.0% | +14.5 |
| Somewhere to live | left | 0.7 points | 0.5 points | 23.5% | 8.7% | +14.8 |
| Somewhere to live | right | 0.2 points | 1.4 points | 24.3% | 9.9% | +14.4 |
| What we burn | left | 1.9 points | 2.6 points | 22.8% | 8.1% | +14.7 |
| What we burn | right | 1.0 points | 2.1 points | 25.1% | 8.3% | +16.9 |
| The last factories | left | 1.9 points | 2.6 points | 23.9% | 6.2% | +17.7 |
| The last factories | right | 0.2 points | 1.8 points | 22.9% | 5.3% | +17.5 |
| The pension age | left | 0.9 points | 1.5 points | 23.4% | 9.9% | +13.5 |
| The pension age | right | 1.1 points | 1.0 points | 23.6% | 9.3% | +14.4 |
| Student debt | left | 2.6 points | 3.5 points | 22.2% | 7.5% | +14.7 |
| Student debt | right | 1.1 points | 0.5 points | 22.7% | 6.0% | +16.7 |
| The drug laws | left | 0.3 points | 1.0 points | 22.4% | 8.6% | +13.7 |
| The drug laws | right | 1.5 points | 1.4 points | 23.3% | 9.4% | +13.9 |
| Crime and punishment | left | 0.8 points | 2.6 points | 21.2% | 9.2% | +12.0 |
| Crime and punishment | right | 1.2 points | 1.4 points | 25.0% | 10.0% | +15.1 |
| The cameras | left | 0.5 points | 0.5 points | 24.2% | 9.0% | +15.1 |
| The cameras | right | 1.2 points | 1.3 points | 23.8% | 9.2% | +14.6 |
| What counts as true | left | 2.2 points | 1.5 points | 21.9% | 5.9% | +16.1 |
| What counts as true | right | 1.3 points | 2.8 points | 26.0% | 6.4% | +19.6 |
| The highest court | left | 2.1 points | 3.1 points | 22.6% | 9.5% | +13.0 |
| The highest court | right | 1.0 points | 1.1 points | 23.2% | 8.5% | +14.7 |
| The failing banks | left | 1.6 points | 2.3 points | 21.7% | 9.7% | +12.0 |
| The failing banks | right | 0.1 points | 1.0 points | 26.1% | 9.6% | +16.5 |

The answer moves Ascent or Decay by at most 3.9 points (the target is 5), and the honest road
reaches Ascent at least +11.4 points more often than the fast one (the target is +10).

**Everything else still holds**, at 20,000 runs a bot:

| Target | Wanted | v0.53.0 | Now |
|---|---|---|---|
| Random: median run length | 40–60 cards | 49 | 49 |
| Random: most common ouster | ≤ 35% | bankruptcy 19.4% | bankruptcy 18.7% |
| Greedy: ends in Decay | ≥ 70% | 81.1% | 80.6% |
| Saint: ousted before era 2 | ≥ 60% | 100% | 100% |
| Mixed: reaches Ascent | 15–30% | 20.1% | 19.7% |
| A player's tenth run: cards seen before | under 75% | 68.6% | 64.8% |
| Long reign: all six targets | as phase 39 | pass | pass |
| Questions: a run meets three (median), each met in ≥ 15% of runs | phase 41 | 3; 17.0–19.4% | 3; 16.9–19.2% |
| A player has met all sixteen by (median) | run 20 | run 15 | run 17 |

- **Stories:** every story is met in at least 85.7% as many runs as with no questions.
- **Whole-run roads:** carrying every answer out honestly reaches Ascent 33.4% of the time on
  the left and 35.3% on the right, against 0.7% and 0.5% for the fast road.
- **The download** grew by 10.5 KB gzipped: the content file went from 146.8 KB to 157.0 KB.

**Also checked:**
- The unit suite is 572 tests and the browser suite 41. The new tests cover:
  - every answer read in each era and each long-reign band;
  - the comebacks shared, once a run, and naming no coalition;
  - the 60% reach, as a harness test on 2,000 runs;
  - the codex's questions and its counts, including that an outcome of a card an update took
    out is not counted as a story.
- **Two tests changed, and why:**
  - **Section 10's shared-card share** leaves out the comebacks, as it already left out
    cards written for one crisis or one advisor. Such a card serves both sides and is dealt
    only when its answer was given. The 128 shared cards would otherwise have taken the share
    to 64%, against a limit of 60%.
  - **The long reign's targets** play the mixed bot 4,000 times instead of 1,500. "Decay is
    the hard place" is measured on the quarter of its reigns locked in Decay. At 1,500 runs
    one sample put the gap at 1.9 points and another, on the same content, at 5. With and
    without the comebacks, 12,000-run samples put it at 4.4–5.8.

**Yours:**
- **The cards are drafts.** 128 cards, written to the deck's rules and measured, but not
  edited by you. The treaty's new last step on the left is too.
- **The content rating.** The comebacks add more references to drugs of the same kind, as
  policy: a drug squad that became a dynasty selling what it seized, and drug firms
  sponsoring schools. `twa/STORE.md` has the notes.
- **A player meets all sixteen questions two runs later** than at v0.53.0 (the 17th run,
  median). That is still inside the 20.
- **Old links and replays:** as with any change to the deck, a run code from before this
  version deals differently, and a run finished before it cannot take the other road.

<details><summary>Original entry</summary>

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

</details>

## Phase 43. Endings you choose — *done*

**Shipped.** Every story can now end the run at its turning point. The fourteen that could not
each have one choice at their climax that ends it:

| Story | The choice | Ending | Kind |
|---|---|---|---|
| Term limits | Accept, humbly | *Continuity* | failure |
| The moonshot | Theirs, and join them | *The Job You Wanted* | leaving in good order |
| The press | Enjoy the quiet | *The Quiet* | failure |
| The plague | Declare victory | *Victory Declared* | failure |
| The oracle | Follow the advice | *The Model's Advice* | failure |
| The water | Fund the campaign | *The Posters* | failure |
| The referendum | Concede, and go | *The Country Decided* | leaving in good order |
| The truth commission | All nine, and resign | *Clean Hands* | leaving in good order |
| The split (left) | Give them the party | *Given Back* | leaving in good order |
| The general strike (left) | Charter your own union | *The General Strike* | failure |
| The commune (left) | Make it policy, go home | *The Town Council* | leaving in good order |
| The dynasty (right) | Name them successor | *The Family Firm* | failure |
| The concordat (right) | Ask for the blessing | *The Blessing* | failure |
| The estates (right) | Close it | *The Closed Counties* | failure |

- **13 new endings**, drafts for your edit. The general strike story ends in the ending of that
  name the minimum wage added in phase 41. The game has 55 endings now.
- **Five of the fourteen are ways to leave in good order**, on the honest side of the card,
  and their labels say so. Across all 22 stories, 13 of the 24 choices that end a run are on
  the honest side.
- **The choice keeps its effects.** Each ending was an existing choice, so its drift and effects
  stand, and a legacy it set is still left behind. The moonshot's is still "Orbit was
  reached", and the term limit's is still "The vote was abolished".

**How it was placed.** A story's last card is reached in 3–12% of competent runs and its middle
card in 10–25%. The first draft put the plague's and the water's endings on their middle cards,
for the offers. A careless player takes an offered ending half the time, so random play's
median run fell from 49 cards to 39, under the target of 40. Both endings now sit on their
story's last card, with endings written for it, and the median is 43.

**Measured.** The mixed bot, which never takes an ending, for what is offered. A "curious"
player is the same bot, except that it takes an ending it has not found yet some of the time
it is offered one.

| Target | Wanted | v0.54.0 | Now |
|---|---|---|---|
| Runs that offer a choice that ends the run | ≥ 75% | 70.0% | 85.0% |
| ... from a story | – | 46.4% | 72.8% |
| Different endings offered by choice in a player's first 20 runs (median) | ≥ 12 | 13 | 22 |
| Every story can end the run at its turning point | 22 of 22 | 8 | 22 |
| Ten endings found by the 20th run: a player who takes a new one half the time | – | 67% of players | 100% |
| ... a quarter of the time | – | 8% | 52% |
| ... never | – | 0% | 0% |

The ten-endings objective ("Collector") is reachable now by a player who takes a quarter of
the endings they have not seen. Half of such players have it by their 20th run, and one who
takes half gets it by the 13th (median). A player who never takes one finds four endings in
20 runs, as before.

**Everything else still holds**, at 20,000 runs a bot:

| Target | Wanted | v0.54.0 | Now |
|---|---|---|---|
| Random: median run length | 40–60 cards | 49 | 43 |
| Random: most common ouster | ≤ 35% | bankruptcy 18.7% | bankruptcy 15.4% |
| Greedy: ends in Decay | ≥ 70% | 80.6% | 80.3% |
| Saint: ousted before era 2 | ≥ 60% | 100% | 100% |
| Mixed: reaches Ascent | 15–30% | 19.7% | 19.9% |
| A player's tenth run: cards seen before | under 75% | 64.8% | 63.8% |
| Long reign: all six targets | as phase 39 | pass | pass |

- **The questions:** every answer moves Ascent and Decay by at most 3.7 points, and every
  honest road beats the fast one by at least 11.7 (12,000 seeds a side, all 32 rows). A run
  still meets three; a player has met all sixteen by their 16th run.
- **The comebacks:** 73.7% of the answers in runs that reach era 2 meet one.
- **History names:** the most any decision names is 8.5%.

**Also checked:**
- The unit suite is 576 tests and the browser suite 41. New tests cover:
  - every story can end the run;
  - a third or more of the stories' endings are on the honest side;
  - 75% of runs offer an ending, and a player's first twenty runs offer twelve or more.
- **The download** grew by 1.0 KB gzipped.

**Yours:**
- **The endings and five new labels are drafts:** 13 ending texts, and the choices relabelled to
  say they leave. Those are "Theirs, and join them", "Concede, and go", "All nine, and
  resign", "Give them the party" and "Make it policy, go home".
- **The game never warns that a choice ends the run.** The labels of the good exits say so, and
  the failures are consequences, as the questions' are ("Ignore the court"). A mark on such a
  choice would make endings easier to choose on purpose, and would also give the failures
  away. That is a design call, and yours.
- **Careless play is shorter:** random runs last 43 cards (median), against a floor of 40.

<details><summary>Original entry</summary>

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

</details>

## Phase 44. Fewer repeats — *done*

**Shipped.** 160 new ordinary cards, drafts for your edit: 80 in era 1, 40 in era 2 and 40 in
era 3. 76 are shared and 84 belong to one side, and 30 are written for one band. The deck is
1,511 cards.

**Measured** the way this round's audit set the targets: forty players from seed 300,000,
each playing their runs in order with the mixed bot and their unlocks carried forward, the
median at the run named.

| Target | Wanted | The audit (v0.51.0) | v0.55.0 | Now |
|---|---|---|---|---|
| A player's 10th run: cards seen before | ≤ 65% | 74% | 65.7% | **63.8%** |
| ... in its first era | ≤ 60% | 74% | 62.9% | **54.3%** |
| A player's 20th run | ≤ 85% | 91% | 86.7% | **81.9%** |

On two other sets of seeds, 200 players each from 100,000 and from 500,000, both give 61.0%,
54.3% and 83.8%. The harness's own twenty players give 60.0%, 57.1% and 84.8%. The twentieth
run is the tightest, 0.2 points inside its ceiling on the smallest measure. A test holds the
three as measured here, and `npm run simulate` prints them.

**Why 160, the low end of the guess.** Phases 40–43 took the tenth run from 74% to 65.7%
before a card of this phase was written: questions, comebacks and endings spread a run's
draws over more cards. What was left was sized with copies of existing ordinary cards, the
phase 36 method. On two sets of seeds, 120 copies cleared the three targets with no room to
spare, and 160 with some. The real cards landed close to the copies: the twentieth run one
step of the measure worse (83.8% against 82.9%), the rest the same.

**How the drafts were fitted.**
- Written by era and side, gated by `validate:mvp`, and checked for near-duplicates against
  every card in the deck. Seven drafts that were too close to an existing card were
  rewritten with their numbers kept, and a fingerprint of 8,000 seeded runs did not change.
  They were the post-office bank, the tin mine, the family-firm tax, the gold standard, the
  sailing exam, the old bridge and a second party app.
- **The first draft took mixed Ascent to 15.6%**, against a floor of 15%. The new honest
  choices raised Institutions on every card, and by more than the old deck's do. A player
  keeping the meters calm reached Institutions' ceiling sooner, turned greedy, and took the
  temptations.
- So the honest side's Institutions effect was put on the old deck's distribution, by rank,
  the phase 36 method applied to one meter. That moved 74 values, 63 of them by one point.
  Eleven honest choices lost their Institutions gain. One cost the match gave was taken back
  out, because opening the union holiday camps to everyone does not harm institutions.
  Mixed Ascent is 19.3%. Matching drift, Public or Order as well changed nothing measurable.
- **The comebacks (phase 42) came up less in a bigger deck:** 67.9% of answers met one,
  down from 73.7%. Their weight went from 5 to 6, in proportion to the pools they are drawn
  from, and it is 74.0% again.
- The deck's conventions still hold:
  - 117 of the 160 temptations name their habit (bend 53, skim 42, clamp 22);
  - 29 send a bill, 18% of temptations against the deck's 21%;
  - a consequence rides on 34.1% of ordinary choices, over the one-third floor;
  - the everyday deck is 57.1% neutral, inside 40–60%;
  - 24.5% of events are written for one band, over the one-fifth floor.
- **No card scores a policy.** Drafts that turned on a position the questions keep
  drift-free were replaced before measuring: pensions against the young, closing the
  border, strike ballots, an insurance mandate, the right to repair. Every choice turns on
  how something is done: who it is for, what is hidden, and what is taken.

**Everything else still holds**, at 20,000 runs a bot:

| Target | Wanted | v0.55.0 | Now |
|---|---|---|---|
| Random: median run length | 40–60 cards | 43 | 44 |
| Random: most common ouster | ≤ 35% | bankruptcy 15.4% | bankruptcy 13.9% |
| Greedy: ends in Decay | ≥ 70% | 80.3% | 77.1% |
| Saint: ousted before era 2 | ≥ 60% | 100% | 100% |
| Mixed: reaches Ascent | 15–30% | 19.9% | 19.3% |
| Long reign: all six targets | as phase 39 | pass | pass |

- **The questions:** every answer moves Ascent and Decay by at most 3.8 points, and every
  honest road beats the fast one by at least 10.5. That is on 12,000 seeds a side, all 32
  rows. The honest roads have less room than at v0.55.0 (11.7): the left side's courts and
  crime roads lost 2–3 points each. A run still meets three questions, and a player has met
  all sixteen by their 17th run (median, was the 16th).
- **The comebacks:** 74.0% of the answers in runs that reach era 2 meet one.
- **Endings you choose:** 85.4% of competent runs offer one, and a player's first twenty
  runs offer 22 different ones (median).
- **History names:** the most any decision names is 6.9%.

**Also checked:**
- The unit suite is 577 tests and the browser suite 41. `validate:mvp` is clean at 1,511
  cards.
- **One label was shortened for the browser audit.** "One country, one sign" became "One
  language", because the audit's run was dealt that card and its buttons ran 2px past it.
- The first repeat test (under 75% at the tenth run, BACKLOG-5 phase 36) became the three
  above, since they are stricter.
- **The download** grew by 15.2 KB gzipped, all of it in the content chunk (154.7 to 169.9
  KB). A simulated card takes about 56µs.
- The store listing's card count and its content-rating notes cover the new cards: alcohol
  referred to (a brandy duty, wine at official dinners, drunks on the night bus), a party
  lottery, untaxed bookmakers, a protection racket and debt bondage.

**Fixed after shipping, in v0.56.1: long cards on a small phone.** Auditing the new cards
found a fault older than this phase. The conditions are a 360×640 screen, the choice buttons
drawn, the longest promise's badge and the first lesson. There, all 40 of the deck's longest
cards ran 2–10px past the card in decay2, decay3 and ascent3. The two longest questions ran
up to 13px past it in five looks. It was worse than those numbers read. A card's text is
centred, so squeezed text spilled upward as well: over the speaker's role in ascent3, and
over a question's title in decay3. The browser audit never saw it, because it reads only
the cards its seed deals.
- **The text never shrinks.** On a short phone the portrait gives way, as it was meant to
  (BACKLOG-3 phase 18). The prose used to be squeezed along with it.
- **The speaker keeps two lines.** The name and the role always keep their room. A card that
  still cannot fit is cut off where the audit can see it, never drawn over its speaker.
- **Less spacing on short screens.** The Ascent's two roomiest looks set their spacing at
  15px there, not 18–22px.
- **The first lessons are set closer on short screens**, which leaves 12–29px more for the
  card. They are read once, early.
- **A question's title in Decay drops its letter spacing,** as Decay's meter labels already
  do (BACKLOG-5 phase 32). The longest no longer wraps.
- **A new browser test** puts each side's four longest cards, and its longest question, on the
  table in all seven looks under those conditions. On the old stylesheet it fails in 27
  places, and now it passes. The browser suite is 42 tests.
- **What it costs:** in that worst case the portrait gets small. It is 11–19px for the two
  longest questions in decay2 and decay3, and 27px for the longest card in decay3. Everywhere
  else it is 35px or more, and on a phone taller than 700px nothing changes.

**Yours:**
- **The 160 cards are drafts, in your voice, to edit.** They are in `any4.json`,
  `left4.json` and `right4.json` in each of `era1/`, `era2/` and `era3/`.
- **Their Institutions numbers were fitted after they were written.** If you change a
  card's effects or drift, run `npm run simulate`. The tightest margins are the twentieth
  run and the question roads, above.
- **Which habit a temptation names** is my reading of 117 cards.
- **Old run codes and today's daily.** A code sent before this update opens a different run
  after it, and a run begun before it almost certainly cannot take the other road. The
  daily is dealt from the date, so on the day the update lands, players on the two versions
  get different dailies.
- **Late runs still repeat:** four cards in five are familiar by the twentieth run. More
  cards buy little there. The lever left is a draw that avoids what a profile has seen,
  which breaks codes, replay, challenges and the daily ("Considered, and not proposed").

<details><summary>Original entry</summary>

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

</details>

---

## Considered, and not proposed

- **Scoring the policies themselves.** See the first section: it breaks TRANSFER §2.
- **Real countries, parties, slogans or events.** TRANSFER §3, and they date the satire.
- **A third option per card.** See the first section: it breaks the locked genre and every
  input path.
- **A draw that avoids what a profile has seen.** Likely the strongest lever left (not
  measured), and it breaks every feature that shares or replays a run.
- **Each run getting a slice of the deck.** Measured worse than the whole pool.
