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

## 2. Take align-locked arcs to about a third of the pool — *queued*

**Evidence.** 2 of 14 arcs are locked to a side (`arc_purge`, `arc_strongman`). The other 12
play the same on both.

**Do.** Add left arcs (the movement splits, the general strike against your own government,
a commune that declares itself) and right arcs (the dynasty, the concordat, the colonels'
petition). Separately, let shared arcs branch by alignment at step two, so succession is not
the same story for both sides even when the arc id is.

**Done when** at least a third of arcs are align-locked and a left run and a right run share
noticeably less than the 48% of cards they share today.

## 3. Write epilogues per side — *queued*

**Evidence.** All 9 epilogues are `align: "any"`, so the closing paragraph, the payoff for a
twenty-minute run, is identical whether you led the Commons or the Ledger.

**Do.** Eighteen texts: three bands × three eras × two sides. `findEpilogue` already prefers
an align-specific match and falls back to "any", so this is purely content.

**Cheapest large win on this list.**

## 4. Give run setup a side — *queued*

**Evidence.** `Modifier` has no `align` field, so all 15 crises, traits and flaws are shared.

**Do.** Add `align` to `Modifier`, filter it in `rollSetup`, and write side-specific flaws
and traits. A left flaw is committee-brained or an ideologue; a right flaw is a nepotist or
sentimental about the army. Makes the first thirty seconds of a run feel different.

## 5. Replace Mood with constituencies — *queued*

**Evidence.** One Mood meter serves both sides, so "the public" is the same object whoever
you are. This is why reskinned text can only take path distinction so far.

**Do.** Three blocs per side (unions, activists, city professionals against donors, army,
church and country). A choice pleases one and angers another; you fall by losing your
coalition rather than by one number hitting zero.

**The only item here that changes what the game is.** Touches engine, content, UI, the
harness and the balance targets together. Do it deliberately or not at all.

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
