import type { Library } from "./library";
import { hasFlag } from "./state";
import type { Card, GameState } from "./types";

/**
 * Opposition (BACKLOG-10 phase 55). The first honest vote a run loses does not end it: the
 * rival takes the office, and the run plays the opposition until the era ends, when a return
 * vote says whether it comes back. A second lost vote ends the run, as every lost vote used to.
 *
 * Measured at v0.64.0, 56% of the informed voter's runs met a vote an honest count would lose,
 * three in four of them at the run's first. Every vote falls on card 26 of its era, so an
 * opposition is the era's last nine cards.
 */

/** Carried once a run has lost the office at a count. A run loses it only once. */
export const LOST_OFFICE_FLAG = "lost_office";
/** Carried once a run has won the office back at the return vote, honestly. */
export const WON_BACK_FLAG = "won_it_back";

/**
 * Whether losing this honest vote sends the run into opposition, rather than ending it. A deck
 * with no opposition for this side keeps the old rule: the vote lost is the run lost.
 */
export function goesOut(lib: Library, state: GameState, card: Card): boolean {
  if (card.opposition || state.opposition || hasFlag(state, LOST_OFFICE_FLAG)) return false;
  const ours = (c: Card) => c.align === "any" || c.align === state.align;
  return lib.oppositionCards.some(ours) && lib.returnVotes.some(ours);
}

/**
 * The card count at which the return vote is dealt, for an opposition that begins at this
 * vote: the era's last card. Null in the run's last era, which ends with the run still out,
 * and when the vote was itself the era's last card, since the era's end brings it back.
 */
export function returnAtFor(lib: Library, state: GameState): number | null {
  const last = state.era * lib.config.eraLength - 1;
  if (state.era >= (state.eraCount ?? lib.config.eraCount) || last <= state.cardCount) return null;
  return last;
}

/** Whether the return vote is due on the table now. */
export function returnDue(state: GameState): boolean {
  const at = state.opposition?.returnAt;
  return at !== null && at !== undefined && state.cardCount >= at;
}
