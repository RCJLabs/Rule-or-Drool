export * from "./types";
export * from "./config";
export * from "./rng";
export * from "./library";
export * from "./state";
export * from "./look";
export * from "./endings";
export * from "./draw";
export * from "./resolve";
export * from "./preview";
export * from "./replay";
export * from "./deck";
export * from "./rival";

import { draw } from "./draw";
import type { Library } from "./library";
import { preview } from "./preview";
import { resolve } from "./resolve";
import { newRun } from "./state";
import type { Card, GameState, RunSetup, Side } from "./types";

/** Convenience: engine functions bound to one content library. */
export function createEngine(lib: Library) {
  return {
    lib,
    newRun: (seed: number, setup: RunSetup) => newRun(lib, seed, setup),
    draw: (state: GameState) => draw(lib, state),
    resolve: (state: GameState, cardId: string, side: Side) => resolve(lib, state, cardId, side),
    preview: (state: GameState, card: Card, side: Side) => preview(lib, state, card, side),
  };
}

export type Engine = ReturnType<typeof createEngine>;
