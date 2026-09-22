# Backlog

Post-MVP improvements, ordered by the analysis in the session that created this file. Every
"evidence" line is measured against the shipped content, not estimated. ROADMAP.md remains
the record of the seven build phases; this is what comes after them.

Status: **doing** · **queued** · **done**

---

## 1. Write elections per side — *done*

**Shipped.** 14 election cards: 5 for the Commons, 5 for the Ledger, 4 shared for the moves
that belong to neither (rigging the count, postponing, scapegoating, abolishing). Weighted
so a player sees their own side's elections **83% of the time** once conditional cards are
excluded, against 0% before. Two new post-election consequences, one per side.

**What the retune taught us.** Making the cheat side more generous made the greedy bot
*avoid* it: greedy stabilises meters toward the middle rather than maximising them, so a big
positive swing reads as displacement, not reward. Its Decay rate fell to 54%. The fix was to
make honest elections genuinely expensive, and to charge that cost in **money and order
rather than Mood** — an honest campaign that also cost votes would compound into losing the
next election, turning a costly choice into a death spiral. A test now enforces that rule.
Greedy cheats 62% of elections again and all five targets pass over 40,000 runs.

<details><summary>Original entry</summary>

**Evidence.** All 4 election cards are `align: "any"`. The content plan said to put
alignment-specific writing into arcs and elections; elections got none. The election is the
most dramatic recurring beat in a run and it currently reads identically for both sides.

**Do.** A per-side election deck. The Commons faces coalition partners threatening to walk,
a base demanding purity tests, the turnout machine, a timed giveaway, a splitting left
party. The Ledger faces donors wanting the tax plank written their way, the church trading
turnout for a plank, voter identification, the generals offering an orderly vote, a foreign
threat that can be made larger by Thursday. Shared cards stay for the genuinely universal
moves: rigging the count, postponing, abolishing.

**Done when** a run sees a side-specific election most of the time, the validator still
finds an unconditional election for every era, band and side, and the section 8 targets hold.

</details>

## 2. Take align-locked arcs to about a third of the pool — *done*

**Shipped.** 20 arcs now, 8 of them locked to a side, which is 40%. Three new left arcs and
three new right arcs, each three cards, each written with the bloc trade-off in from the
start rather than moving the coalition as a block:

| Left | Right |
|---|---|
| `arc_split` — the movement splits and the expelled third stands against you | `arc_dynasty` — your eldest gets a portfolio, then a ministry, then the clause |
| `arc_general_strike` — your own unions strike against your own labour bill | `arc_concordat` — the bishops want the registry, then the schools, then the budget |
| `arc_commune` — a city governs itself and quotes your speeches back at you | `arc_estates` — eleven counties for one line in the finance bill |

**Shared arcs can now tell a different story per side.** A choice may carry `nextByAlign`
instead of `next`, and the engine follows the pointer for the player's alignment. Succession
and the press both branch at step two: the left handover is fought at a movement congress,
the right one at an acclamation the elders have already arranged; refusing the left branch
costs Institutions and the public, refusing the right one costs your donors. The validator
follows both pointers for reachability, membership and cycles, and rejects `nextByAlign`
outside an arc.

**Alignment affinity did most of the work.** A third of the drawable pool is already
side-specific, but a run drew it at the same rate as the shared deck. `alignAffinity` (2)
multiplies the draw weight of cards matching the player's side, and side-locked arcs carry
weight 5 against a shared arc's 2–3. No new content was needed for either.

**Measured over 400 runs:**

| | before | after |
|---|---|---|
| a left run and a right run share | 48% | **35%** |
| two runs on the same side share | 54% | 56% |
| of a run's distinct cards, alignment-specific | 31% | **39%** |

So a run on the other side is now genuinely a different game, where before it was roughly as
familiar as replaying your own. All five section 8 targets still pass (random 54 cards,
bankruptcy 24.0%, greedy 83.7% Decay, saint 100%, mixed 20.8% Ascent) and the validator is
clean at the strict MVP gate.

**Still to do inside this item:** only two shared arcs branch by side so far. The mechanism
is cheap — two cards and a pointer — and the other twelve are candidates.

<details><summary>Original entry</summary>

**Evidence.** 2 of 14 arcs are locked to a side (`arc_purge`, `arc_strongman`). The other 12
play the same on both.

**Do.** Add left arcs (the movement splits, the general strike against your own government,
a commune that declares itself) and right arcs (the dynasty, the concordat, the colonels'
petition). Separately, let shared arcs branch by alignment at step two, so succession is not
the same story for both sides even when the arc id is.

**Done when** at least a third of arcs are align-locked and a left run and a right run share
noticeably less than the 48% of cards they share today.

</details>

## 3. Write epilogues per side — *done*

**Shipped.** 18 epilogues: three bands × three eras × two sides, and no shared text left.
The closing paragraph is now the Commons' future or the Ledger's, never a neutral one.

The Commons decay into a mailing list and a brand of energy drink, murals kept because
murals are cheap, an archive burned in an uninsured warehouse with the anniversary still
observed. The Ledger decays into a nephew, six names and a bishop running the counties, and
the last engineer dying without an apprentice. Muddle is committees that outlive their
problems on one side and orderly stagnation on the other. Ascent is clinics, libraries and
published accounts against ships that leave on schedule and a state remembered for being
solvent and dull.

**Removing the shared set was the point, not a side effect.** `findEpilogue` always prefers
a side match, so keeping the nine `any` texts would have left them unreachable while still
counting toward the codex — a Futures list you could never finish. Three of the best lines
were kept by moving them to the side they actually belonged to. The codex now shows 18, of
which a player collects 9 per side, and a test asserts every key is still reachable.

**Two small things came with it.** The codex entry now names the party, because two entries
reading "Decay · era 1" would otherwise be indistinguishable. And meta saves move to version
2: a v1 save's `band:any:era` keys name texts that no longer ship, so the migration drops
them rather than inflating the count past what can be collected.

**A test was overpromising.** `Ending` had a case called "shows the ending, the epilogue by
exit band and the seed" that never asserted the epilogue text, so it passed while rendering
the "The record ends here" fallback. It now pins a real side-specific line.

<details><summary>Original entry</summary>

**Evidence.** All 9 epilogues are `align: "any"`, so the closing paragraph, the payoff for a
twenty-minute run, is identical whether you led the Commons or the Ledger.

**Do.** Eighteen texts: three bands × three eras × two sides. `findEpilogue` already prefers
an align-specific match and falls back to "any", so this is purely content.

**Cheapest large win on this list.**

</details>

## 4. Give run setup a side — *done*

**Shipped.** `Modifier` takes an `align`, `rollSetup` filters on it, and ten new openings are
written for one side only.

| | the Commons | the Ledger |
|---|---|---|
| Traits | a shop steward (politics with receipts), an academic (published, with footnotes nobody asked for) | an industrialist (has met a payroll, mentions it more than they notice), an officer (commanded people who could have said no) |
| Flaws | committee-brained, a purist, apologetic | a nepotist, sentimental about the army, nostalgic |

**Crises stay shared, on purpose.** A recession, a pandemic, a war and a disaster are things
you inherit, not things you are; giving them a side would make the thing you walked into a
statement about your politics.

**Measured.** Each side now draws from 17 modifiers rather than one shared 15, and its own
side accounts for 26% of setup picks. Distinct openings went from **64 to 168 per side**, of
which **104 are unavailable to the other side** — the two sides now share less than half of
what they can open with, which a test pins.

**The validator caught the real gap.** Six new flaws set flags that nothing read, so each
would have been thirty seconds of different starting meters and then nothing. 12 new gated
cards make them bite: the review into the review reporting that it recommends a review, the
emergency committee that cannot meet until Thursday when the emergency is Tuesday, the
auditor finding four of six contracts went to one surname, the official map still showing
the old borders and someone asking whether that is policy. A test now holds the general
rule — every flag a modifier sets must be read somewhere.

**Two new validator rules.** `setup-empty` is an error when a side has no crisis, trait or
flaw to draw, because that side cannot open a run at all; `setup-thin` warns below four,
because that side's opening repeats within a few runs. Both caught the test fixture, which
had one modifier and therefore could not have opened a run either.

All five targets pass in both states: **23.1% Ascent locked, 19.3% unlocked**.

<details><summary>Original entry</summary>

**Evidence.** `Modifier` has no `align` field, so all 15 crises, traits and flaws are shared.

**Do.** Add `align` to `Modifier`, filter it in `rollSetup`, and write side-specific flaws
and traits. A left flaw is committee-brained or an ideologue; a right flaw is a nepotist or
sentimental about the army. Makes the first thirty seconds of a run feel different.

</details>

## 5. Replace Mood with constituencies — *done*

**Shipped.** Mood is gone as a meter. In its place are three coalition blocs, the same three
slots for both sides, with different people in them:

| Slot | the Commons | the Ledger |
|---|---|---|
| `base` | Movement | Faithful |
| `backers` | Unions | Donors |
| `public` | Cities | Country |

Six meters now: three blocs, a deliberate gap, then Money, Order and Institutions. A bloc
only ends a run at the bottom, when it abandons you (`abandoned_base`, `abandoned_backers`,
and the existing `riots` for the public). There is no per-bloc ceiling, because adoration is
only a problem when it is unanimous: every bloc at 92 or above is a personality cult.
Elections read the **average** of the blocs, so you can win a vote while one bloc is about
to walk out on you.

**Migration was the tractable part.** `mood` survives as a shorthand meaning "the public
moves as one", which writes to all three blocs and reads back as their average. That made
the change behaviour-preserving for all 310 cards that used it, so nothing needed rewriting
and depth appears exactly where trade-offs get authored. Saved runs migrate too
(`RUN_SAVE_VERSION` 3): an old Mood value becomes all three blocs.

**Trade-offs authored so far:** all 14 elections and all 14 arcs, 93 choices in total, none
of which still lean on the shorthand. A purge thrills the base and frightens everyone else;
a donor deal buys the backers and costs the public. Measured over 300 runs, the coalition
spreads by **15 points on average and up to 61**, so the blocs genuinely come apart rather
than moving in lockstep. All 22 endings remain reachable and all five section 8 targets pass.

**Two things worth knowing.** The greedy bot had to change: summing three bloc terms tripled
the weight of public opinion purely because it is now drawn as three bars, so it averages
the coalition and weighs it as one concern. And the test suite caught a real bug on the way
through: `preview` filtered raw effect keys, so a card using the shorthand would have shown
no dots on the blocs it actually moves.

**Still to do inside this item:** the 262 event cards still use the shorthand, so they move
the coalition as a block. Converting them is ordinary content work and every converted card
adds depth without touching the engine.

<details><summary>Original entry</summary>

**Evidence.** One Mood meter serves both sides, so "the public" is the same object whoever
you are. This is why reskinned text can only take path distinction so far.

**Do.** Three blocs per side (unions, activists, city professionals against donors, army,
church and country). A choice pleases one and angers another; you fall by losing your
coalition rather than by one number hitting zero.

**The only item here that changes what the game is.** Touches engine, content, UI, the
harness and the balance targets together. Do it deliberately or not at all.

</details>

## 6. Let consequences chain — *done*

**Shipped.** 25 new cards, 386 in total, and the deferred bill now arrives more than once.

**Chains.** Nine new delayed cards hang off the choice that defers the cost, which is the
whole premise stated mechanically. Default loudly and nobody will lend to you at a price you
want to say aloud; take the one bank that will and its conditions get an office on the third
floor that sees the budget before you do. Blame the east for the dry taps and the eastern
districts queue for eleven days and then stop queueing; send the water police and two
provinces start sending lawyers instead of tax.

A run can now travel **three enqueue steps** from the card that started it, where every
chain used to stop after one. 25 of the 64 cards that enqueue something begin a chain two or
more deep, and **72% of runs reach a second-or-later consequence step**. Condition-gated
cards went from 7% to **21%**, so more of what a run shows is there because of something the
player did.

**Promises.** Four lines — the deficit, the inquiry, fifty thousand homes for the Commons,
no tax rises for the Ledger. Each promise card queues three things at once: a temptation
about eight cards out, and *both* endings of itself at twenty. Between them, breaking the
promise sets a flag, and the two endings are gated on it, so `tickQueue` drops the one that
no longer applies and the player is shown the reckoning they earned. That needed no engine
change; a test pins the behaviour, because the whole design rests on it.

Over 3,000 runs: a promise is made in **97%** of runs, broken in **51%**, and **91%** reach
a reckoning. The delayed deck now supplies 10.7 cards of a 103-card run.

**The validator gained a real rule.** A consequence that enqueues a consequence can loop,
and unlike an arc cycle — a warning, because a refusal always ends an arc — a queue loop is
a run that never stops paying. `enqueue-cycle` is an error.

**Two things the tests caught.** The promise cards first gave *both* sides positive drift,
which breaks the house rule that every card is a real trade. The fix was also the better
design: making the promise is the applause now, so it is the tempting side. And the new
cards swung **1.9× the deck's effect budget** — written as set pieces without checking what
an ordinary card costs. That alone pushed mixed-bot Ascent to 33.8%, past its ceiling.
Scaling effects to the deck's budget and positive drift to 0.75 brought it back to **23.4%
locked and 18.6% unlocked**, against 22.5% and 17.6% before this item. All five section 8
targets pass in both states over 32,000 runs each.

<details><summary>Original entry</summary>

**Evidence.** Consequence chains are exactly one step deep: zero consequence cards enqueue
another. Only 7% of cards are condition-gated.

**Do.** Consequences that trigger their own consequences, and promise cards that record a
commitment and check it twenty cards later. The premise is that the easy choice compounds.
Mechanically it currently does not.

</details>

## 7. Make the rival a person — *done*

**Shipped.** Your rival leads the side you did not pick. Six of them, three a side, with
names, and a run never hands you one of your own: measured over 16,000 runs, the rival was
on the player's own side **0 times**. They are not in your cabinet either — the one role you
cannot fire.

**They are whoever you are not.** Standing is 0-100 and has two parts. They bank what you
hand them: a stolen vote (+9), a clean one (-6), and the cards that are about them. The rest
is read straight off how far you have gone — `|drift| x 0.35` — because the design called
for a reformer while you rot and a demagogue while you ascend. Two confrontation arcs
deliver exactly that, and the measurement says it lands:

| | met the reformer | met the demagogue |
|---|---|---|
| greedy (rotting) | 25.9% | 0.3% |
| mixed (middling) | 7.7% | 29.5% |
| saint (ascending) | 0.0% | 37.0% |

**Two engine findings made this work.** `state.band` only recomputes at an era boundary, so
the first version — arcs gated on band — gave the demagogue to nobody: a run that ends in
era 1 keeps the band it started in whatever its drift. Conditions can now read `drift`
itself, which is what the flavour was always supposed to follow. And a rival who can only
beat you at the ballot can never reach the player who most deserves one, because that player
cheats every election: standing now feeds coup risk too, so taking the vote away does not
take them away.

12 new rival cards in the ordinary deck (they had 11 against the judge's 47), six arc cards,
a `rival_wins` ending, and `{rival}` in any card or ending text resolves to the name of the
person you actually faced.

**Is the ending real?** A bot reaches it 0.7% of the time, which is the item 9 lesson again:
bots never concede. A player who plays toward it — letting them grow, then standing down —
ends there in **35.1% of runs**, and every run that reaches the arc's last card takes it.

**Balance.** The first version cost 3 points of Ascent and pushed the unlocked case below
its floor again: the rival content leaned negative (-3.92 against the deck's -3.52) and the
election pull took another point. Trimming both puts it at **22.8% locked and 19.1%
unlocked** over 32,000 runs each, above the 20.8% and 17.6% this item started from. All five
targets pass in both states.

<details><summary>Original entry</summary>

**Evidence.** The rival speaker has 11 cards against the judge's 47. The design called for a
rival who mirrors the player: a demagogue while you ascend, a reformer while you decay.

**Do.** A named, persistent rival across eras with a rising threat and a confrontation arc
whose flavour follows your drift.

</details>

## 8. Give each era a rule, not just a deck — *done*

**Shipped.** Eras now change the rules, and the player is told which rule at the jump. An
`eraRules` table carries three levers: a standing `passive` on a beat of its own, a
`volatility` multiplier on top of the band's, and a `queueScale` on enqueue delays.

| Era | The rule |
|---|---|
| 1 | The honeymoon. The rules are just the rules. |
| 2 | **The machines.** +1 Money and -1 Public every six cards, with no card to blame. The state gets steadily richer and the country does not, which walks you toward `oligarchy` at one end and `riots` at the other. |
| 3 | **The long shadow.** -1 Institutions every eight cards, every effect landing at 1.15x, and enqueue delays at 0.6x, so the bills you deferred arrive sooner than the delay you were quoted. |

**I did not add the colonies as a fifth meter.** That line predates item 5, which took the
header to six meters; a seventh bar would crowd the display and re-open the balance work.
Era three's rule uses the meters that already exist instead.

**Bands were the weaker axis all along.** 74% of the pool drew in any band, and a run's
draws were only **4.6-7.0%** band-specific. 24 new cards, 12 for Decay and 12 for Ascent:
unpaid police who have found work at roadblocks, a land archive wet since spring, two
departments using different maps, against a surplus nobody has a procedure for, the best
administrators being hired away by the firms your own reforms created, and a week where
nothing happened. Plus `bandAffinity` (3), the same trick `alignAffinity` played in item 2,
so what is written for a band actually surfaces in it. Band-specific share of a run's draws
is now **13.3-19.6%**, roughly tripled.

**A heuristic I tried and threw away.** I tested whether a card's effect shape predicts its
band — both sides costing state meters meaning Decay, a large investment available meaning
Ascent. It found one Decay candidate and 37 Ascent candidates that were nothing of the sort:
estate tax, charter towns, orbital lords. Effect shape does not encode tone, so the cards
were written rather than relabelled.

**Tuning, and a surprise.** A harsher passive *raises* mixed-bot Ascent, because it culls
weak runs early and the survivors skew good: at -3 Public and -2 Institutions, Ascent went to
34.9% and greedy's Decay fell through its floor to 69.5%. The rate, not the size, is the
dial. At every six and eight cards it sits at **25.0% Ascent / 78.9% greedy Decay locked**
and **20.9% / 81.1% unlocked**, all five targets passing in both states over 32,000 runs each.

**Housekeeping.** Eight tests added since item 2 had been landing inside the `elections`
describe block and reading as election tests. They now live in one named for what they
actually check.

<details><summary>Original entry</summary>

**Evidence.** Eras only change which cards are eligible. 72% of the pool draws in any band,
so band does little either.

**Do.** Era two adds standing automation pressure on Money; era three adds the colonies as a
soft fifth meter. Band-gate more content. Three acts instead of one long deck.

</details>

## 9. Re-tier objectives and fix the dead unlock — *done*

**Shipped.** 18 objectives, up from 13, ordered as a ladder because the codex renders them
in list order. Measured as the median first-completion run across **40 independent players
of 120 runs each**, because a single play history is noisy: unlocks change the deck, which
reorders everything downstream.

| Unlock | before | after |
|---|---|---|
| `u_dissident` | run 1 | run 1 |
| `u_truth` | **never (0% of players)** | run 8 (100%) |
| `u_survivor` | run 1 | run 10 (100%) |
| `u_referendum` | run 28 | run 21 (98%) |
| `u_engineer` | run 2 | run 27 (95%) |

`u_truth` no longer sits behind "discover ten endings". A player who keeps surviving reaches
a median of **5 endings of 22**, because 16 of them require losing in a specific way, so
that gate was unreachable by playing well. It now hangs on ending runs in all three bands,
which suits a truth commission better anyway: you need the whole record. `obj_ten_endings`
stays as a long-tail collector goal goal and gates nothing; a player who varies their play
reaches it around run 46.

**Five new objectives**, weighted toward variety rather than only virtue: all three bands,
the same band reached from both sides, all three blocs above 60, ten runs finished, and five
endings as a step below ten. A test now asserts that ten plain runs across both sides and
all three bands earns *every* unlock, so no future gate can quietly become unreachable.

**"Never completes" mostly measured the bot, not the game.** `obj_saint` looked dead at 0%,
but that was a competent bot never playing saintly: 44.5% of saintly runs satisfy it
outright, and a varied player gets it by run 8. `obj_stepped_down` is the one genuinely rare
one left, at 15% over 120 runs, and it gates nothing.

**This surfaced a real regression from item 5**, fixed in the commit before this one. `mood`
in a modifier's `meterStart` writes to all three blocs, so every number authored when
support was a single meter was silently tripled. The four flaws were designed as exact even
trades and two of them had become +8 and −12; two of the three unlocked traits had gone net
*negative*, meaning earning them handed you a worse opening than the traits you started
with. All 11 affected modifiers now name the blocs they move. Mixed-bot Ascent returned to
22.5% locked and 17.6% unlocked over 32,000 runs, against 20.4% and a floor-straddling 15.3%
before; the unlocked target had been failing about a third of the time. The validator now
rejects `mood` in `meterStart` outright.

<details><summary>Original entry</summary>

**Evidence.** A competent bot completes 5 of 13 objectives on run one, then nothing until
run 24, and three never complete in 200 runs. `obj_ten_endings` gates `arc_truth`, but a
good player reaches only 6 of 20 endings in 200 runs, because 14 endings require losing in a
specific way. **That arc is effectively unreachable by playing well.**

**Do.** Spread the early five, add objectives that reward variety rather than only virtue,
and stop gating content behind an ending count good play cannot reach.

</details>

## 10. Make the codex record what you did — *queued*

**Evidence.** The codex's main collectible is endings, and most endings reward dying in
creative ways.

**Do.** Record arcs completed and which branch was taken, advisors kept or fired, legacies
left behind, futures reached. The codex should be a history, not just a death list.
