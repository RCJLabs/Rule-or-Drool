import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun } from "../../src/engine/state";
import type { GameState, Side } from "../../src/engine/types";
import { alongside, lastAlongside, setupOf, type RunCode } from "../../src/meta";
import { BOTS, makeContext, noisy } from "../../src/sim";

/**
 * A run someone sent, card by card beside the receiver's (BACKLOG-14 phase 89): each card both
 * met, the n-th time one met it beside the n-th time the other did.
 */

const CODE: RunCode = { seed: 2024, align: "left", modifiers: [], unlocked: [], mandates: [] };

/** A run from the code, played by a person-like bot with its own coin-flips. */
function played(salt: number): GameState {
  const bot = noisy(BOTS.eyes, 0.2);
  const rng = makeRng(CODE.seed ^ salt);
  let s = newRun(library, CODE.seed, setupOf(CODE));
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

/** A run that is nothing but its record, for the bookkeeping alone. */
const record = (choices: [string, Side][]) => ({ choices }) as unknown as GameState;

describe("two runs card by card", () => {
  const mine = played(0x1234567);
  const theirs = played(0x7654321);
  const together = alongside(mine, theirs);

  it("pair each card both met with how each answered it, in the receiver's order", () => {
    expect(together.length).toBeGreaterThan(mine.cardCount / 2);
    expect(together.some((a) => a.mine !== a.theirs)).toBe(true);
    expect(together.some((a) => a.mine === a.theirs)).toBe(true);
    for (const a of together) {
      expect(mine.choices![a.k]).toEqual([a.cardId, a.mine]);
      expect(theirs.choices!.some(([id, side]) => id === a.cardId && side === a.theirs)).toBe(true);
    }
    expect(together.map((a) => a.k)).toEqual([...together.map((a) => a.k)].sort((x, y) => x - y));
  });

  it("say of the card just answered what they did, when they met it", () => {
    for (let k = 1; k <= 40; k++) {
      const upTo = { ...mine, choices: mine.choices!.slice(0, k) };
      const last = lastAlongside(upTo, theirs);
      expect(last).toEqual(alongside(upTo, theirs).find((a) => a.k === k - 1) ?? null);
    }
  });

  it("match a card that came round twice time for time, and leave out one they met fewer times or never", () => {
    const me = record([
      ["a", "left"],
      ["b", "right"],
      ["a", "right"],
      ["c", "left"],
    ]);
    const them = record([
      ["a", "right"],
      ["c", "left"],
      ["d", "left"],
    ]);
    expect(alongside(me, them)).toEqual([
      { k: 0, cardId: "a", mine: "left", theirs: "right" },
      { k: 3, cardId: "c", mine: "left", theirs: "left" },
    ]);
    expect(lastAlongside(me, them)).toEqual({ k: 3, cardId: "c", mine: "left", theirs: "left" });
    expect(
      lastAlongside(
        record([
          ["a", "left"],
          ["a", "left"],
        ]),
        them,
      ),
    ).toBeNull();
  });

  it("say nothing for a run with no record", () => {
    const none = { choices: null } as unknown as GameState;
    expect(alongside(none, theirs)).toEqual([]);
    expect(alongside(mine, none)).toEqual([]);
    expect(lastAlongside(none, theirs)).toBeNull();
    expect(lastAlongside(record([]), theirs)).toBeNull();
  });
});
