/**
 * What the meters bar warns about, and from when. Here rather than in `Meters.tsx` since
 * BACKLOG-10 phase 57, so the harness's bot with a person's eyes reads the same warnings the
 * screen draws, from the same numbers. Danger itself is the engine's since BACKLOG-13 phase 93,
 * whose clock reads it too.
 */
export { DANGER_BELOW, inDanger as shownInDanger } from "../engine/danger";

/** A bloc this low is visibly unhappy, well before it is dangerous (BACKLOG-2 phase 8). */
export const RESTLESS_BELOW = 32;
/** How close an ending has to be before the run is told which one it is (phase 13). */
export const NEAR_WITHIN = 12;
