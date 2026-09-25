import type { Card, GameState } from "./types";

/**
 * A rival who plays (BACKLOG-10 phase 65). The rival's standing was a number that raised the bar
 * an honest vote must clear and, past `rivalWinsAt`, made a lost vote their win. Now they act as
 * it grows: the cards written for them read the same pressure the engine acts on, and two moves
 * need the engine. A seat's holder can go over to them (`poach`), and a vote can come with them
 * standing against you by name (`rivalStands`, in state.ts beside the pressure it reads).
 *
 * Nothing here imports the rest of the engine, so the promises can read it too.
 */

/** Set when someone in the cabinet has gone over to the rival, so later cards can say so. */
export const RIVAL_POACHED_FLAG = "rival_poached";
/** `poached_<advisor id>`: who went. The cabinet lists them, and they are not offered a seat again. */
export const POACHED_PREFIX = "poached_";

/** The people who have gone over to the rival this run, in the order they went. */
export function poachedAdvisors(state: Pick<GameState, "flags">): string[] {
  return state.flags.filter((f) => f.startsWith(POACHED_PREFIX)).map((f) => f.slice(POACHED_PREFIX.length));
}

/**
 * A card dealt only because the rival is somebody: one whose condition needs their pressure over
 * a line, one that follows someone going over to them, or a vote they stand in by name. The
 * playtest report counts these for people beside the bots.
 */
export function isRivalCard(card: Card): boolean {
  return !!card.rivalStands || card.cond?.meters?.rival?.gt !== undefined || !!card.cond?.flags?.includes(RIVAL_POACHED_FLAG);
}
