import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim/bots";
import { shapeOf } from "../../src/ui/shape";
import { lib, start, table } from "../helpers";

/**
 * The bill's receipt (BACKLOG-13 phase 80): a card a choice sent later comes back knowing which
 * choice, by that card's number in the run. The queue keeps it, since several choices can send
 * the same card and the latest of them is not always the one that came due.
 */

describe("the queue keeps who sent each card", () => {
  it("as the number of the card whose choice sent it", () => {
    const l = lib();
    const s = resolve(l, table(start(l, { cardCount: 10 }), "ev_enq"), "ev_enq", "left");
    expect(s.queue).toEqual([{ id: "q1", dueAt: 12, from: 11 }]);
  });

  it("brings it to the table with the card, and lets it go with the next card from anywhere else", () => {
    const l = lib();
    let s = resolve(l, table(start(l, { cardCount: 10 }), "ev_enq"), "ev_enq", "left");
    s = draw(l, s);
    expect(s.current).not.toBe("q1");
    expect(s.sentBy).toBeUndefined();
    s = draw(l, resolve(l, s, s.current!, "left"));
    expect([s.current, s.currentFrom, s.sentBy]).toEqual(["q1", "queue", 11]);
    s = draw(l, resolve(l, s, "q1", "left"));
    expect(s.currentFrom).not.toBe("queue");
    expect(s.sentBy).toBeUndefined();
  });

  it("names each sender when one card is sent twice, though the latest sender did not send the first to come", () => {
    const l = lib();
    let s = resolve(l, table(start(l, { cardCount: 10 }), "ev_enq"), "ev_enq", "left");
    s = resolve(l, table(s, "ev_enq"), "ev_enq", "left");
    expect(s.queue).toEqual([
      { id: "q1", dueAt: 12, from: 11 },
      { id: "q1", dueAt: 13, from: 12 },
    ]);
    s = draw(l, s);
    expect([s.current, s.sentBy]).toEqual(["q1", 11]);
    s = draw(l, resolve(l, s, "q1", "left"));
    expect([s.current, s.sentBy]).toEqual(["q1", 12]);
  });

  it("gives none to a card the engine queued itself, even straight after a bill", () => {
    // A broken promise's card and a handover are queued by the engine, not sent by a choice.
    const l = lib();
    let s = start(l, {
      cardCount: 12,
      queue: [
        { id: "q1", dueAt: 12, from: 11 },
        { id: "chained", dueAt: 12 },
      ],
    });
    s = draw(l, s);
    expect([s.current, s.sentBy]).toEqual(["q1", 11]);
    s = draw(l, resolve(l, s, "q1", "left"));
    expect([s.current, s.currentFrom]).toEqual(["chained", "queue"]);
    expect(s.sentBy).toBeUndefined();
  });

  it("comes from a save written before it was kept as no receipt at all", () => {
    const l = lib();
    const s = draw(l, start(l, { cardCount: 12, queue: [{ id: "q1", dueAt: 12 }] }));
    expect([s.current, s.currentFrom]).toEqual(["q1", "queue"]);
    expect(s.sentBy).toBeUndefined();
  });
});

describe("in the game's own runs", () => {
  /** Runs played by the careful bots, each card with the sender it came with. */
  const runs = Array.from({ length: 40 }, (_, k) => {
    const seed = 900_000 + k;
    const bot = k % 2 ? BOTS.eyes : BOTS.informed;
    const rng = makeRng(seed ^ 0x5bd1e995);
    let s: GameState = newRun(library, seed, rollSetup(library, seed, k % 4 < 2 ? "left" : "right", []));
    const cards: { id: string; from: string | null; sentBy: number | undefined; n: number; choices: readonly (readonly [string, string])[] }[] = [];
    while (!s.over) {
      s = draw(library, s);
      const card = getCard(library, s.current!);
      cards.push({ id: card.id, from: s.currentFrom, sentBy: s.sentBy, n: s.cardCount + 1, choices: s.choices ?? [] });
      s = resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 })));
    }
    return { end: s, cards };
  });

  it("name, on every card that came back, an earlier choice whose side sent that very card, and are on no other", () => {
    let bills = 0;
    for (const { cards } of runs) {
      for (const c of cards) {
        if (c.from !== "queue") {
          expect(c.sentBy, `${c.id}, card ${c.n}`).toBeUndefined();
          continue;
        }
        bills++;
        // These runs take no promise, so every card from the queue was sent by a choice.
        expect(c.sentBy, `${c.id}, card ${c.n}`).toBeDefined();
        expect(c.sentBy!).toBeLessThan(c.n);
        const [id, side] = c.choices[c.sentBy! - 1]!;
        const sent = (getCard(library, id)[side as "left" | "right"].enqueue ?? []).map((e) => e.id);
        expect(sent, `${c.id} at card ${c.n}, said to be sent by ${id} at card ${c.sentBy}`).toContain(c.id);
      }
    }
    expect(bills).toBeGreaterThan(100);
  });

  it("are dealt again the same when the run is, which is how the end screen lists them", () => {
    for (const { end, cards } of runs) {
      const points = shapeOf(library, end)!;
      expect(points).not.toBeNull();
      const again = points.slice(1).map((p) => p.sentBy);
      expect(again).toEqual(cards.map((c) => c.sentBy));
    }
  });
});
