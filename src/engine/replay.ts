import { draw } from "./draw";
import type { Library } from "./library";
import { resolve } from "./resolve";
import { newRun } from "./state";
import type { GameState, Side } from "./types";

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
  let s = draw(lib, newRun(lib, state.seed, { align: state.align, modifiers: [...state.modifiers], unlocked: [...state.unlocked], mandate: state.mandate }));
  for (let i = 0; i < k; i++) {
    const [card, side] = record[i]!;
    if (s.current !== card) return null;
    s = draw(lib, resolve(lib, s, card, side));
  }
  return s.current === (record[k]?.[0] ?? s.current) ? s : null;
}

export const otherSide = (side: Side): Side => (side === "left" ? "right" : "left");
