import { draw } from "../engine/draw";
import type { Library } from "../engine/library";
import { resolve } from "../engine/resolve";
import { newRun, rollSetup } from "../engine/state";
import type { GameState, PlayerAlign, Side } from "../engine/types";
import { setupOf, type RunCode } from "../meta/runcode";

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

/**
 * Start exactly the run a code describes, whatever this profile has unlocked
 * (BACKLOG-2 phase 11). This is how a shared run and the daily start: from a setup, not from
 * a seed read through the local profile.
 */
export function beginRunFromCode(lib: Library, code: RunCode): GameState {
  return draw(lib, newRun(lib, code.seed, setupOf(code)));
}

/**
 * The daily for a side: the same setup for every player, so the base game with no unlocks.
 * A veteran loses their unlocked traits for this one run, which is the price of the daily
 * being the same run for everyone rather than the same seed read two different ways.
 */
export function dailyCode(lib: Library, seed: number, align: PlayerAlign, mandate: string | null): RunCode {
  return { seed, align, modifiers: rollSetup(lib, seed, align, []).modifiers ?? [], unlocked: [], mandate };
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
