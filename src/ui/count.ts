import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { honestCount, type HonestCount } from "../engine/resolve";
import type { Card, GameState } from "../engine/types";

/**
 * How an honest count would go, said on the election card itself (BACKLOG-9 phase 53). The
 * cabinet said it a tap away, and only when you would lose; the bots always knew, since their
 * preview includes the count. So a person decided whether to cheat without knowing whether
 * they needed to.
 *
 * In words, as the rival is (`rival.ts`): won or lost, and roughly by how much. Won or lost is
 * exact, because the vote is decided by the same `honestCount`; how much is a band. Over 2,000
 * runs of the mixed bot at v0.62.0 the margin at a vote had a median of 8 points, and about one
 * vote in five would have been lost honestly, most of those by less than 5. The higher bar of
 * BACKLOG-9 phase 54 makes that about one in three.
 */
export type CountBand = "easy" | "win" | "narrowWin" | "narrowLoss" | "loss";

/** Within this many points of the bar, on either side, the count is narrow. */
export const NARROW_WITHIN = 5;
/** This many points over the bar or more, it is won easily. */
export const EASY_BY = 15;

/** The band for a count. Won or lost comes from the count itself, never from the margin's size. */
export function countBand(count: HonestCount): CountBand {
  if (!count.wins) return count.margin > -NARROW_WITHIN ? "narrowLoss" : "loss";
  return count.margin < NARROW_WITHIN ? "narrowWin" : count.margin < EASY_BY ? "win" : "easy";
}

export interface CountLine {
  band: CountBand;
  wins: boolean;
  text: string;
}

/**
 * The line for a card on the table: an election with an honest side has one, and so does a
 * campaign card, which says where the count stands before the vote it campaigns for (BACKLOG-10
 * phase 56). Nothing else does.
 */
export function countLine(lib: Library, state: GameState, card: Card): CountLine | null {
  const standing = !!card.campaign;
  if (!standing && (card.type !== "election" || !(card.left.honest || card.right.honest))) return null;
  const count = honestCount(lib, state);
  const band = countBand(count);
  return { band, wins: count.wins, text: (standing ? STRINGS.standing : STRINGS.count)[band] };
}
