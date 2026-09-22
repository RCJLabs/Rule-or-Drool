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

## 4. Give run setup a side — *queued*

**Evidence.** `Modifier` has no `align` field, so all 15 crises, traits and flaws are shared.

**Do.** Add `align` to `Modifier`, filter it in `rollSetup`, and write side-specific flaws
and traits. A left flaw is committee-brained or an ideologue; a right flaw is a nepotist or
sentimental about the army. Makes the first thirty seconds of a run feel different.

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

## 6. Let consequences chain — *queued*

**Evidence.** Consequence chains are exactly one step deep: zero consequence cards enqueue
another. Only 7% of cards are condition-gated.

**Do.** Consequences that trigger their own consequences, and promise cards that record a
commitment and check it twenty cards later. The premise is that the easy choice compounds.
Mechanically it currently does not.

## 7. Make the rival a person — *queued*

**Evidence.** The rival speaker has 11 cards against the judge's 47. The design called for a
rival who mirrors the player: a demagogue while you ascend, a reformer while you decay.

**Do.** A named, persistent rival across eras with a rising threat and a confrontation arc
whose flavour follows your drift.

## 8. Give each era a rule, not just a deck — *queued*

**Evidence.** Eras only change which cards are eligible. 72% of the pool draws in any band,
so band does little either.

**Do.** Era two adds standing automation pressure on Money; era three adds the colonies as a
soft fifth meter. Band-gate more content. Three acts instead of one long deck.

## 9. Re-tier objectives and fix the dead unlock — *queued*

**Evidence.** A competent bot completes 5 of 13 objectives on run one, then nothing until
run 24, and three never complete in 200 runs. `obj_ten_endings` gates `arc_truth`, but a
good player reaches only 6 of 20 endings in 200 runs, because 14 endings require losing in a
specific way. **That arc is effectively unreachable by playing well.**

**Do.** Spread the early five, add objectives that reward variety rather than only virtue,
and stop gating content behind an ending count good play cannot reach.

## 10. Make the codex record what you did — *queued*

**Evidence.** The codex's main collectible is endings, and most endings reward dying in
creative ways.

**Do.** Record arcs completed and which branch was taken, advisors kept or fired, legacies
left behind, futures reached. The codex should be a history, not just a death list.
