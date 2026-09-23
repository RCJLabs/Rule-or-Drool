import { draw } from "../engine/draw";
import { getCard, type Library } from "../engine/library";
import { resolve } from "../engine/resolve";
import { makeRng } from "../engine/rng";
import { newRun, rollSetup } from "../engine/state";
import type { GameState, PlayerAlign } from "../engine/types";
import { emptyMeta, foldRun } from "../meta/state";
import { BOTS, makeContext } from "./bots";

export interface RepeatOptions {
  /** How many players, each with their own seeds. */
  players: number;
  /** Which of each player's runs to measure (1 is their first). */
  run: number;
}

/**
 * For each player, the share of the cards in their `run`th run that they had already played
 * in an earlier one. A player plays their runs in order with the mixed bot, on alternating
 * sides, keeping what each run unlocks: the audit behind BACKLOG-5 phase 36, which found 89%
 * at run ten when the deck held 554 cards.
 */
export function repeatShares(lib: Library, { players, run }: RepeatOptions): number[] {
  const shares: number[] = [];
  for (let p = 0; p < players; p++) {
    let meta = emptyMeta();
    const seen = new Set<string>();
    for (let r = 1; r <= run; r++) {
      const seed = 100_000 + p * 1000 + r;
      const align: PlayerAlign = (p + r) % 2 ? "left" : "right";
      const rng = makeRng(seed ^ 0x5bd1e995);
      let state: GameState = newRun(lib, seed, rollSetup(lib, seed, align, meta.unlocks));
      const drawn: string[] = [];
      while (!state.over) {
        if (state.cardCount >= 1000) throw new Error(`run exceeded 1000 cards (seed ${seed})`);
        state = draw(lib, state);
        const id = state.current!;
        drawn.push(id);
        state = resolve(lib, state, id, BOTS.mixed(makeContext(lib, state, getCard(lib, id), rng, { danger: 25 })));
      }
      if (r === run) shares.push(drawn.filter((id) => seen.has(id)).length / drawn.length);
      for (const id of drawn) seen.add(id);
      meta = foldRun(lib, meta, state).meta;
    }
  }
  return shares;
}
