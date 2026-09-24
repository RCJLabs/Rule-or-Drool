import { hash53 } from "../engine/deck";
import { draw } from "../engine/draw";
import { getCard, type Library } from "../engine/library";
import { MANDATES } from "../engine/mandates";
import { resolve } from "../engine/resolve";
import { makeRng } from "../engine/rng";
import { newRun, rollSetup } from "../engine/state";
import type { GameState } from "../engine/types";
import { allUnlockTokens } from "../meta/objectives";
import { BOTS, makeContext } from "./bots";

/**
 * What a deck deals (BACKLOG-8 phase 49): 96 runs by the mixed bot, on both sides, under every
 * promise and none, three eras and five, with nothing and with everything unlocked, as the
 * cards dealt, the sides taken and the endings reached, hashed to eight letters and digits.
 * The deck stamp has to move whenever this does; tests/engine/deck.test.ts holds it to that.
 */
export function dealOf(lib: Library): string {
  const seq: string[] = [];
  const promises = [null, ...MANDATES.map((m) => m.id)];
  for (let i = 0; i < 96; i++) {
    const seed = 6_000_000 + i;
    const rng = makeRng(seed ^ 0x5bd1e995);
    const setup = { ...rollSetup(lib, seed, i % 2 ? "left" : "right", i % 3 === 0 ? allUnlockTokens() : []), mandate: promises[i % promises.length]! };
    let s: GameState = newRun(lib, seed, i % 4 === 3 ? { ...setup, eraCount: lib.config.longEraCount } : setup);
    while (!s.over) {
      s = draw(lib, s);
      const card = getCard(lib, s.current!);
      const side = BOTS.mixed(makeContext(lib, s, card, rng, { danger: 25 }));
      seq.push(`${card.id}${side[0]}`);
      s = resolve(lib, s, card.id, side);
    }
    seq.push(s.over.endingId);
  }
  return (hash53(seq.join(" ")) % 36 ** 8).toString(36).padStart(8, "0");
}
