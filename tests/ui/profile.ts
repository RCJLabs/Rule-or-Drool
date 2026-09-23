import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign } from "../../src/engine/types";
import { emptyMeta, foldRun, type MetaState } from "../../src/meta";
import { BOTS, makeContext } from "../../src/sim";

/** A profile played, not written: forty runs of the mixed bot folded in by the game's own fold. */
export function playedProfile(runs = 40): MetaState {
  let meta = emptyMeta();
  for (let i = 0; i < runs; i++) {
    const seed = 1000 + i * 7919;
    const align: PlayerAlign = i % 2 ? "right" : "left";
    const rng = makeRng(seed ^ 0x5bd1e995);
    let s: GameState = newRun(library, seed, { ...rollSetup(library, seed, align, meta.unlocks), mandate: null });
    while (!s.over) {
      s = draw(library, s);
      s = resolve(library, s, s.current!, BOTS.mixed(makeContext(library, s, getCard(library, s.current!), rng, { danger: 25 })));
    }
    meta = foldRun(library, meta, s).meta;
  }
  return meta;
}
