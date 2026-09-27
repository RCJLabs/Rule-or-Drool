import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { replayTo, setupOfRun } from "../../src/engine/replay";
import { resolve } from "../../src/engine/resolve";
import { crisisOf, crisisOffer, newRun, pickCrisis, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign } from "../../src/engine/types";
import { beginRun } from "../../src/ui/flow";

/**
 * Pick your trouble (BACKLOG-13 phase 84): a run of the player's own is offered the crisis its setup
 * deals and one more, and takes one. The trait and the flaw stay dealt.
 */

const CRISES = library.content.modifiers.filter((m) => m.kind === "crisis").map((m) => m.id);
const sides: PlayerAlign[] = ["left", "right"];

/** The cards a run is dealt, taking the left side of each, to its end or its 60th card. */
function cardsOf(start: GameState): string[] {
  const cards: string[] = [];
  let s = start;
  for (let i = 0; i < 60 && !s.over; i++) {
    cards.push(s.current!);
    s = draw(library, resolve(library, s, s.current!, i % 3 ? "right" : "left"));
  }
  return cards;
}

describe("the crises a run is offered", () => {
  it("are the one the setup deals and another, from the seed alone, and every crisis is offered", () => {
    const seconds = new Map<string, number>();
    for (let seed = 1; seed <= 1000; seed++) {
      const align = sides[seed % 2]!;
      const offer = crisisOffer(library, seed, align)!;
      expect(offer[0]).toBe(crisisOf(library, rollSetup(library, seed, align).modifiers!));
      expect(offer[1]).not.toBe(offer[0]);
      expect(CRISES).toContain(offer[1]);
      // The same seed and side offer the same pair every time.
      expect(crisisOffer(library, seed, align)).toEqual(offer);
      seconds.set(offer[1], (seconds.get(offer[1]) ?? 0) + 1);
    }
    // Each of the ten comes second about a tenth of the time.
    expect([...seconds.keys()].sort()).toEqual([...CRISES].sort());
    for (const [id, n] of seconds) expect(n, id).toBeGreaterThan(60);
  });

  it("leave the trait and the flaw as dealt, and the run itself as dealt when the first is kept", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const align = sides[seed % 2]!;
      const dealt = rollSetup(library, seed, align);
      const offer = crisisOffer(library, seed, align)!;
      const [kept, other] = [pickCrisis(dealt, offer, offer[0]), pickCrisis(dealt, offer, offer[1])];
      expect(kept.modifiers).toEqual(dealt.modifiers);
      expect(kept.passedOver).toBe(offer[1]);
      expect(other.modifiers).toEqual(dealt.modifiers!.map((m) => (m === offer[0] ? offer[1] : m)));
      expect(other.passedOver).toBe(offer[0]);
      // Keeping the first crisis deals, card for card, the run the seed always dealt.
      expect(cardsOf(draw(library, newRun(library, seed, kept)))).toEqual(cardsOf(draw(library, newRun(library, seed, dealt))));
    }
    expect(() => pickCrisis(rollSetup(library, 5, "left"), crisisOffer(library, 5, "left")!, "trait_orator")).toThrow(/not offered/);
  });

  it("go into the run: its crisis, and the one passed over, which the run keeps through a replay", () => {
    const offer = crisisOffer(library, 12, "left")!;
    const s = beginRun(library, 12, "left", [], [], undefined, null, null, offer[1]);
    expect(crisisOf(library, s.modifiers)).toBe(offer[1]);
    expect(s.passedOver).toBe(offer[0]);
    expect(setupOfRun(s).passedOver).toBe(offer[0]);
    // Played on and put back, the run is the run it was.
    let run = s;
    for (let i = 0; i < 12; i++) run = draw(library, resolve(library, run, run.current!, "left"));
    const back = replayTo(library, run, 6)!;
    expect(back.passedOver).toBe(offer[0]);
    expect(back.modifiers).toEqual(s.modifiers);
    // A run started without a pick remembers nothing passed over.
    expect(beginRun(library, 12, "left").passedOver).toBeUndefined();
  });

  it("are refused when they could not have been offered", () => {
    expect(() => beginRun(library, 12, "left", [], [], undefined, null, null, "crisis_nothing")).toThrow(/not offered/);
    const setup = rollSetup(library, 12, "left");
    const own = crisisOf(library, setup.modifiers!)!;
    // A run cannot have passed over its own crisis, nor a trait.
    expect(() => newRun(library, 12, { ...setup, passedOver: own })).toThrow(/passed over/);
    expect(() => newRun(library, 12, { ...setup, passedOver: "trait_orator" })).toThrow(/passed over/);
    expect(newRun(library, 12, { ...setup, passedOver: CRISES.find((c) => c !== own)! }).passedOver).toBeDefined();
  });
});
