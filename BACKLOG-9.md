# Backlog, round nine

Round eight (BACKLOG-8.md) is phases 49–51, all done, with the promise drop-down and the codex
index since. BACKLOG-2's phase 17, getting the game onto Play, still waits on decisions only
the owner can make.

You asked for more cards and a retune, then for the election card to show how the vote
stands. Both had been parked until the closed test, because the bots disagree about the one
habit that decides balance most. So this round measured first, at v0.61.2, and one number
changed the order.

## What the measurements say

| Measure (v0.61.2) | Result |
|---|---|
| Harness targets | all 5 pass; the mixed bot reaches Ascent in 20.2% (target 15–30%) |
| Cards already seen, 10th / 20th run (40 players) | 61.7% / 81.9% (limits 65% / 85%) |
| Era 3 already seen, 10th / 20th run (200 players, two seed sets) | 64.4% / 84.0% |
| Event cards a side can draw, eras 1 to 5 | 346, 322, 312, 149, 153 |
| A long reign's eras 4–5 already met, a player's 10th long reign | 94.3% |

**How a player votes decides the game more than any card.** Each bot played 8,000 runs:

| Voting habit | Ascent | Decay | Votes cheated |
|---|---|---|---|
| The mixed bot, today's balance target | 21.8% | 22.2% | 64.5% |
| Never cheats a vote it can win honestly | 42.1% | 8.7% | 19.9% |
| Never cheats at all | 57.2% | 4.3% | none; 35.8% of runs lost a vote |

- **The mixed bot cheats when a meter is in danger,** even when it would win honestly. The
  cheat is easier on the meters.
- **An election card that says how the vote stands** puts the second habit in every player's
  hands (speculation: how many take it). That player finds Ascent twice as often as the target
  allows.

## The order

- **You asked:** more cards and a retune now, the election card after.
- **Recommended, and in force unless you change it:** more cards (52), the election card
  (53), then the retune (54).
- **Why.** A retune now would balance the game for the mixed bot. The election card would then
  move players toward the informed habit, at 42% Ascent, and the retune would have to be done
  again. Tuned after the card, it is tuned once, for the player the card makes.
- **The cards do not wait on either.** Each has its own drift, so 54 measures after them too.

## Decisions for you

1. **The order above.** Default: 52, 53, 54.
2. **Which player the balance is for once the card shows the vote.** Default: the informed
   voter, who never cheats a vote they can win. The mixed bot stays a floor.
3. **Cards for the long reign.** Not proposed until people are seen to play it often (below).

---

## Phase 52. More cards for era 3 — *done*

**Shipped in v0.62.0.** Forty new cards, drawn only in era 3, "Seventy-five years on":
- 20 for either side, in `src/content/cards/era3/any5.json`;
- 10 for the Commons (`left5.json`) and 10 for the Ledger (`right5.json`).

**Why era 3.** It is the era the ordinary game repeats most, and every run that lasts reaches
it. Sized first with copies of existing cards, as phase 44 did:
- **40 copies drawn in eras 3 to 5** took era 3 at the 20th run from 88.6% to 82.9%, and moved
  a long reign's eras 4–5 hardly at all.
- **The long reign is not helped by cards era 3 shares.** A card drawn in era 3 is met there in
  nearly every run, so by a long reign's fourth era it is a repeat. Its eras 4–5 draw 86% of
  their cards from ones written for that era alone, and 97% of those are met before by the
  10th long reign.
- **40 copies drawn only in eras 4–5** took that 94.3% to 92.9%, and 80 to 90.0%. That is near
  the noise of 40 players, and only matters to players who choose the long reign.

**What the cards are.** Each is a situation three generations on, with the voice of the era's
cards before them:
- **One side is honest** and costs money, a bloc or order.
- **The other is the shortcut.** It gains something now, and sets the habit it builds (the rule
  bent, the money skimmed, the grip tightened) with a mark toward its habit card. Some queue a
  bill that comes due later.
- **Each side's own failure modes** (TRANSFER §3):
  - The Commons: pensions for anyone who says they marched, an anti-corruption office that
    charges to watch less, a tree planted for every ministerial speech.
  - The Ledger: prison contracts that promise full cells, a loyalty oath firefighters swear
    before every fire, a voluntary day of gratitude where attendance is taken.
- **The rules held:** no card scores a policy, the country stays fictional, the four topics
  stay off.
  - One draft scored force against diplomacy at a moved border. It now turns on keeping an
    out-of-date map so a town across the river still votes in your safest seat.
- **Mixed across the deck:** all eight speakers; 13 cards drawn only in Decay or only in
  Ascent (8 and 5); 30 one-shot; 16 queue a bill.

**Checked.**
- **The validator** passes under `--strict`, with no warning.
- **The voice report** counts no new watched phrase.
- **The guardrails and fit tests** pass. The longest new card is 145 characters, under the 160
  the fit check measures.
- **Near-duplicates.** Each new card was set against all 1,617 by shared words. Four drafts
  retold an older joke or setting and were replaced:
  - a guaranteed job that is empty, told already in era 1;
  - a tax amnesty that teaches waiting, told already in era 1;
  - a second seed vault;
  - a flooded valley, too near the sea wall that saves the minister's town.

**Measured, at v0.62.0.**
- **Era 3 already seen,** 200 players on each of two seed sets, as a mean:
  - 10th run: 64.4% before, 61.9% after;
  - 20th run: 84.0% before, 82.4% after.
- **The 40-player medians first said 88.6% to 82.9%.** That was granularity: one card of an
  era's 35 is 2.9 points. The gain is real and about two points, as BACKLOG-7 found: more cards
  buy little by the 20th run.
- **All 5 harness targets pass.** The mixed bot reaches Ascent in 19.5%.
- **The informed voter** reaches Ascent in 40.7%, still outside the target. That is phase 54.
- **The deck stamp** moved to `gw5s4s8l`, as it should. Codes, links and dailies from before
  deal differently now, and the game says so (phase 49).

**Yours.** Read the forty as you read the voice pass. They are yours to cut or sharpen, and a
change of words keeps the deck.

---

## Phase 53. The election card says how the vote stands — *queued*

**Why.**
- **An election card does not say whether an honest vote would win.** The cabinet does, one tap
  away, and only when you would lose (`src/ui/rival.ts`).
- **So a player decides to cheat without knowing whether they need to.** The bots all know;
  their preview includes the count.

**What.**
- **Under the card's text, one line:** whether an honest count wins, and by roughly how much,
  in the game's words rather than a number.
- **Said aloud too,** on the screen-reader path.
- **The playtest report** already splits votes by whether a meter was in danger (BACKLOG-7
  phase 46). It adds whether the honest count stood to win, so the closed test shows whether
  people use the line.

**Targets.**
- Every election card carries the line, in every look, readable at 360×640.
- The line agrees with what the vote then does, in every harness run.

**Cost.** Small: one line, its words, tests and an audit. It moves no number by itself.
Players moving to the informed habit is what moves them, which is why phase 54 follows.

---

## Phase 54. Retune for the voter the card makes — *queued*

**Why.** With the vote on the card, the informed voter is the player to balance for, and today
that player reaches Ascent in 40.7%, against a target of 15–30%.

**What.**
- **Move the harness's Ascent target** to the informed voter, and keep the mixed bot as a
  floor.
- **Find the change that brings the informed voter inside the target:** the honest vote's
  drift, the election bar, or the rival's pressure. Measure each first.
  - BACKLOG-7 measured the first. Taking 2, 4 or 6 drift off every honest vote gave the
    informed voter 32.9%, 26.8% or 20.8%, and the mixed bot 16.6%, 14.3% or 12.2%.
  - To be measured again after 52 and 53.

**Targets.**
- The informed voter reaches Ascent in 15–30%.
- The mixed bot, as a floor, in at least 10% (proposed).
- Every other harness target holds.

**Cost.** Small in code, one or two numbers. Most of it is measuring, and choosing the lever.

---

## Considered, and not proposed

- **More cards for the long reign.** Eras 4 and 5 have half the cards of the first three, and a
  player's 10th long reign has met 94% of them. Eighty cards written for those eras alone
  bring that to 90%, and only for players who choose the long reign. The closed test will show
  whether they do.
- **More cards for eras 1 and 2.** Their repeats sit inside the targets, and the 20th run
  barely moves with more.
