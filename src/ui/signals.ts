import type { MeterKey } from "../engine/types";
import { BLOC_KEYS } from "../engine/types";

/**
 * What the meters bar warns about, and from when. Here rather than in `Meters.tsx` since
 * BACKLOG-10 phase 57, so the harness's bot with a person's eyes reads the same warnings the
 * screen draws, from the same numbers.
 */

/** A meter this close to an edge that ends the run is drawn in danger. */
export const DANGER_BELOW = 15;
/** A bloc this low is visibly unhappy, well before it is dangerous (BACKLOG-2 phase 8). */
export const RESTLESS_BELOW = 32;
/** How close an ending has to be before the run is told which one it is (phase 13). */
export const NEAR_WITHIN = 12;

/**
 * Whether the screen draws a meter in danger. A bloc only ends the run at the bottom, so only
 * the bottom is dangerous; the state's meters fail at both ends, and out of office only the
 * coalition can end the run (BACKLOG-10 phase 55).
 */
export function shownInDanger(k: MeterKey, value: number, outOfOffice: boolean): boolean {
  if ((BLOC_KEYS as readonly string[]).includes(k)) return value < DANGER_BELOW;
  return !outOfOffice && (value < DANGER_BELOW || value > 100 - DANGER_BELOW);
}
