import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { resolve } from "../../src/engine/resolve";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState, Side } from "../../src/engine/types";
import { closeRun, openRun, takeCard, type RecordedRun } from "../../src/playtest/record";

/** A whole run played the way the game plays one, and recorded the way the game records it. */
export function recordRun(seed: number, pick: (i: number) => Side = (i) => (i % 3 ? "right" : "left"), ms = (i: number) => 900 + 37 * i): { run: RecordedRun; state: GameState } {
  let s = newRun(library, seed, rollSetup(library, seed, "left", []));
  let run = openRun(s, { kind: "own", run: 1, game: "0.43.0" });
  for (let i = 0; !s.over; i++) {
    s = draw(library, s);
    const side = pick(i);
    const after = resolve(library, s, s.current!, side);
    run = { ...run, cards: [...run.cards, takeCard(s, after, side, { ms: ms(i), looked: side === "left" ? [400, 0] : [0, 400] })] };
    s = after;
  }
  return { run: closeRun(library, run, s), state: s };
}
