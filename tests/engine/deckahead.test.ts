import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { deckAhead, draw, select } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { BOTS, makeContext, noisy } from "../../src/sim";

/**
 * The deck's next cards as a run stands (BACKLOG-14 phase 90): of the cards it can deal now, the
 * ones not yet met, in the seed's order, the first of them the one it deals next.
 */

/** The states a person-like run passes through, each before its next card is drawn. */
function beforeEachCard(seed: number): GameState[] {
  const bot = noisy(BOTS.eyes, 0.2);
  const rng = makeRng(seed ^ 0x2545f491);
  let s = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
  const out: GameState[] = [];
  while (!s.over) {
    out.push(s);
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return out;
}
const states = [3, 17, 2024].flatMap(beforeEachCard);

describe("the deck's next cards", () => {
  it("begin with the card the deck deals next, whenever the deck deals", () => {
    let dealt = 0;
    for (const s of states) {
      const next = draw(library, s);
      if (next.currentFrom !== "deck" && next.currentFrom !== "habit") continue;
      const ahead = deckAhead(library, s, 3);
      // Only once every card it can deal has been met does one come round again, by the seed's dice.
      if (ahead.length === 0) expect(s.seen).toContain(next.current);
      else expect(ahead[0]!.id).toBe(next.current);
      dealt++;
    }
    expect(dealt).toBeGreaterThan(150);
  });

  it("go on in the seed's order: with the first met, the rest move up", () => {
    let checked = 0;
    for (const s of states.filter((_, i) => i % 5 === 0)) {
      const ahead = deckAhead(library, s, 4);
      if (ahead.length < 4) continue;
      const met = { ...select(library, s, ahead[0]!.id), current: null };
      expect(deckAhead(library, met, 3).map((c) => c.id)).toEqual(ahead.slice(1).map((c) => c.id));
      checked++;
    }
    expect(checked).toBeGreaterThan(30);
  });

  it("never hold a card already met, and hold nothing out of office or when asked for none", () => {
    for (const s of states) for (const c of deckAhead(library, s, 5)) expect(s.seen).not.toContain(c.id);
    const s = states[10]!;
    expect(deckAhead(library, s, 5)).toHaveLength(5);
    expect(deckAhead(library, { ...s, opposition: { since: s.cardCount, returnAt: null } }, 5)).toEqual([]);
    expect(deckAhead(library, s, 0)).toEqual([]);
  });
});
