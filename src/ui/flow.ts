import { draw } from "../engine/draw";
import type { Library } from "../engine/library";
import { resolve } from "../engine/resolve";
import { newRun, rollSetup } from "../engine/state";
import type { GameState, PlayerAlign, Side } from "../engine/types";

/** Pure UI-level flow on top of the engine, kept out of React so it is testable. */

export function beginRun(
  lib: Library,
  seed: number,
  align: PlayerAlign,
  unlocked: readonly string[] = [],
  mandate: string | null = null,
): GameState {
  return draw(lib, newRun(lib, seed, { ...rollSetup(lib, seed, align, unlocked), mandate }));
}

/** Draw if the table is empty (after an era transition, or a save taken between cards). */
export function ensureCard(lib: Library, state: GameState): GameState {
  return state.over || state.current ? state : draw(lib, state);
}

export interface Committed {
  state: GameState;
  /** The era advanced: the next card is not drawn yet so the UI can show the transition. */
  eraChanged: boolean;
}

export function commitChoice(lib: Library, state: GameState, side: Side): Committed {
  if (!state.current || state.over) return { state, eraChanged: false };
  const after = resolve(lib, state, state.current, side);
  if (after.over) return { state: after, eraChanged: false };
  if (after.era !== state.era) return { state: after, eraChanged: true };
  return { state: draw(lib, after), eraChanged: false };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

/** Year within the current era, 1-based, for the status line. */
export function yearInEra(state: GameState, eraLength: number): number {
  return state.cardCount - (state.era - 1) * eraLength + 1;
}
