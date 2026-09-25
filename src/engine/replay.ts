import { draw } from "./draw";
import type { Library } from "./library";
import { resolve } from "./resolve";
import { newRun } from "./state";
import type { GameState, RunSetup, Side } from "./types";

/**
 * Putting a card of a run back on the table (BACKLOG-5 phase 34). A run is its setup and its
 * seed, dealt the same way every time, and then the choices made on it: replay the first k of
 * those and the table holds exactly the k-th card again, with everything the run had become
 * by then.
 *
 * "Exactly" holds for the content the run was played with. A run saved on one version of the
 * game and finished on the next could deal a different card somewhere along the way, so every
 * card dealt is checked against the card the record says was there, and a replay that parts
 * from the record stops rather than handing back a run that never happened.
 */

/** Whether a finished (or unfinished) run holds the record a replay needs: a choice for every card. */
export function canRetrace(state: GameState): boolean {
  return state.choices !== null && state.choices.length === state.cardCount;
}

/**
 * The run as it stood with its k-th card (0-based) on the table, before choosing; or null if
 * the run cannot be retraced that far.
 */
export function replayTo(lib: Library, state: GameState, k: number): GameState | null {
  const record = state.choices;
  if (!record || k < 0 || k > record.length) return null;
  const setup = { align: state.align, modifiers: [...state.modifiers], unlocked: [...state.unlocked], mandates: [...state.mandates], eraCount: state.eraCount, inheritance: state.inherited };
  let s = draw(lib, newRun(lib, state.seed, setup));
  for (let i = 0; i < k; i++) {
    const [card, side] = record[i]!;
    if (s.current !== card) return null;
    s = draw(lib, resolve(lib, s, card, side));
  }
  return s.current === (record[k]?.[0] ?? s.current) ? s : null;
}

/**
 * Whether the whole record still deals the run it was made on, and ends where it ended, so
 * that every way back into it goes back into this run. A run begun before an update can fail
 * this where the update changed what a seed deals: a third advisor in each role changes the
 * cabinet a seed draws, which can deal the same cards for a while and still not be the same
 * run (BACKLOG-5 phase 35).
 */
export function replays(lib: Library, state: GameState): boolean {
  if (!canRetrace(state)) return false;
  const again = replayTo(lib, state, state.cardCount);
  const run = (s: GameState) => JSON.stringify([s.cabinet, s.meters, s.drift, s.flags, s.over]);
  return again !== null && run(again) === run(state);
}

export const otherSide = (side: Side): Side => (side === "left" ? "right" : "left");

/**
 * A run dealt from its setup and played with these sides, one a card, to its end (BACKLOG-5
 * phase 37). The deal decides which card comes, so the sides are all a run needs to come
 * back: this is how a link carries someone's whole run in about twenty characters. Null when
 * the sides run out before the run ends, or go on after it.
 */
export function playSides(lib: Library, seed: number, setup: RunSetup, sides: readonly Side[]): GameState | null {
  let s = draw(lib, newRun(lib, seed, setup));
  for (const side of sides) {
    if (s.over || !s.current) return null;
    s = draw(lib, resolve(lib, s, s.current, side));
  }
  return s.over ? s : null;
}
