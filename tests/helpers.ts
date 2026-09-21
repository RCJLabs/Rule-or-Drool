import { buildLibrary, type Library } from "../src/engine/library";
import type { EngineConfig } from "../src/engine/config";
import { draw } from "../src/engine/draw";
import { resolve } from "../src/engine/resolve";
import { newRun } from "../src/engine/state";
import type { GameState, PlayerAlign, Side } from "../src/engine/types";
import { makeFixture } from "./fixtures/content";

/** Fixture library with long eras and rare elections unless a test says otherwise. */
export function lib(overrides: Partial<EngineConfig> = {}): Library {
  return buildLibrary(makeFixture(), { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0, ...overrides });
}

/**
 * A run with a trait-free cabinet and no advisor flags, so meter assertions test the
 * engine rather than whichever advisor the seed happened to draw. Pass `cabinet` or
 * `flags` in the patch to test trait behaviour deliberately.
 */
export function start(l: Library, patch: Partial<GameState> = {}, align: PlayerAlign = "left", seed = 1): GameState {
  const base = newRun(l, seed, { align });
  const plain = {
    ...base,
    cabinet: { chief: "c0", general: "g0" },
    flags: base.flags.filter((f) => !f.startsWith(l.config.advisorFlagPrefix)),
  };
  return { ...plain, ...patch };
}

/** Put a specific card on the table without going through draw. */
export function table(state: GameState, cardId: string): GameState {
  return { ...state, current: cardId };
}

/** Draw and resolve `n` cards, collecting the drawn ids. */
export function play(l: Library, state: GameState, n: number, side: Side | ((id: string) => Side) = "left"): { state: GameState; ids: string[] } {
  const ids: string[] = [];
  let s = state;
  for (let i = 0; i < n && !s.over; i++) {
    s = draw(l, s);
    const id = s.current!;
    ids.push(id);
    s = resolve(l, s, id, typeof side === "function" ? side(id) : side);
  }
  return { state: s, ids };
}
