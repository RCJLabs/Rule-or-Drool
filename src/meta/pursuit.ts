import type { Library } from "../engine/library";
import { pursuable, pursuitProblem, type PursuitProblem, type PursuitSetup } from "../engine/pursuit";
import { heardRumours } from "./clues";
import type { MetaState } from "./types";

/**
 * Going looking for an ending (BACKLOG-13 phase 83), as the profile keeps it: one rumour at a time,
 * chosen in the codex, held from run to run until the ending is found or the player stops looking.
 * A pursuit that ran out with the next run would have to be chosen again after every run that
 * fell before its story came, and one at a time keeps it an aim rather than a list to work down.
 */

/** Whether the codex offers to go looking for this ending: a rumour it has given, of an ending a story's choice takes. */
export function canGoLooking(lib: Library, meta: MetaState, id: string): boolean {
  return pursuable(lib, id) && heardRumours(lib, meta).includes(id);
}

/**
 * The ending the profile is looking for, while it still can: none once it is found, or if the
 * rumour is one the codex no longer gives (a profile moved in from another version, say).
 */
export function lookingFor(lib: Library, meta: MetaState): string | null {
  const id = meta.pursuing;
  return id && canGoLooking(lib, meta, id) ? id : null;
}

/** The profile looking for this ending, or for none. */
export function withPursuit(meta: MetaState, id: string | null): MetaState {
  const { pursuing: _was, ...rest } = meta;
  return id ? { ...rest, pursuing: id } : rest;
}

/**
 * What a run of the player's own, started now, would go looking for: the profile's pursuit when
 * this run can reach its ending, with why not when it cannot. The daily, the week's scenario and a
 * run from a link are dealt as they are for everyone, and look for nothing.
 */
export function pursuitFor(lib: Library, meta: MetaState, setup: PursuitSetup): { id: string; problem: PursuitProblem | null } | null {
  const id = lookingFor(lib, meta);
  return id ? { id, problem: pursuitProblem(lib, setup, id) } : null;
}
