import type { MeterKey } from "./types";
import { BLOC_KEYS } from "./types";

/** A meter this close to an edge that ends the run is drawn in danger. */
export const DANGER_BELOW = 15;

/**
 * Whether a meter is drawn in danger. A bloc only ends the run at the bottom, so only the bottom
 * is dangerous; the state's meters fail at both ends, and out of office only the coalition can
 * end the run (BACKLOG-10 phase 55). The screen, the bot with a person's eyes and the clock all
 * read it here (BACKLOG-13 phase 93).
 */
export function inDanger(k: MeterKey, value: number, outOfOffice: boolean): boolean {
  if ((BLOC_KEYS as readonly string[]).includes(k)) return value < DANGER_BELOW;
  return !outOfOffice && (value < DANGER_BELOW || value > 100 - DANGER_BELOW);
}

/**
 * On the clock (BACKLOG-13 phase 93): a run taken on it gives a meter drawn in danger at its
 * bottom this many decisions to leave it, and one still there when they run out goes the way it
 * goes at its edge. Without the clock, danger was a warning with a second warning behind it: the
 * bot with a person's eyes made 46% of its decisions with a meter drawn in danger, and saw 96% of
 * its runs through.
 *
 * Only the bottoms. The top of the state's meters is where honest government takes the State,
 * and on the clock it ended the most runs of a person-like player (315 of 686 at eight
 * decisions); the ceiling planned for it (BACKLOG-11's idea 4) more than doubled the informed
 * voter's Ascent. A meter too high still ends a run at its edge, as it always has.
 */
export const CLOCK = 8;

/** Whether the clock runs for this meter: drawn in danger at its bottom. */
export function clockRuns(k: MeterKey, value: number, outOfOffice: boolean): boolean {
  return value < DANGER_BELOW && inDanger(k, value, outOfOffice);
}
