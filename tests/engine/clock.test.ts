import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { CLOCK, DANGER_BELOW, clockRuns } from "../../src/engine/danger";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { sideEnds } from "../../src/engine/preview";
import { replayTo, setupOfRun } from "../../src/engine/replay";
import { resolve, tickClock } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState, Meters } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim";

/**
 * On the clock (BACKLOG-13 phase 93): a meter drawn in danger at its bottom has `CLOCK` decisions
 * to leave it, and one still there when they run out ends the run at its bottom.
 */

const cfg = library.config;
const onClock = (meters: Partial<Meters> = {}, patch: Partial<GameState> = {}): GameState => {
  const s = newRun(library, 7, { align: "left", clock: CLOCK });
  return { ...s, meters: { ...s.meters, base: 50, backers: 50, public: 50, money: 50, order: 50, inst: 50, ...meters }, ...patch };
};

/** Ticks the clock `n` times on the same meters, as `n` decisions that left them where they are. */
const tick = (s: GameState, n: number): GameState => {
  let out = s;
  for (let i = 0; i < n && !out.over; i++) out = tickClock(library, out);
  return out;
};

describe("the clock", () => {
  it("gives a meter that comes into danger at its bottom eight decisions, one going with each decision it stays there", () => {
    expect(CLOCK).toBe(8);
    const s = onClock({ money: DANGER_BELOW - 5 });
    expect(tick(s, 1).dangerLeft).toEqual({ money: CLOCK });
    expect(tick(s, 3).dangerLeft).toEqual({ money: CLOCK - 2 });
    expect(tick(s, CLOCK).dangerLeft).toEqual({ money: 1 });
    expect(tick(s, CLOCK).over).toBeNull();
  });

  it("ends the run at the meter's bottom when they run out, and keeps the 0 that says so", () => {
    const money = tick(onClock({ money: 10 }), CLOCK + 1);
    expect(money.over?.endingId).toBe(cfg.meterEndings.money.low);
    expect(money.dangerLeft).toEqual({ money: 0 });
    // A bloc goes the way it goes at its bottom too.
    const base = tick(onClock({ base: 3 }), CLOCK + 1);
    expect(base.over?.endingId).toBe(cfg.meterEndings.base.low);
  });

  it("starts again once the meter is out of danger", () => {
    const low = tick(onClock({ money: 10 }), 5);
    expect(low.dangerLeft).toEqual({ money: CLOCK - 4 });
    const out = tickClock(library, { ...low, meters: { ...low.meters, money: DANGER_BELOW } });
    expect(out.dangerLeft).toEqual({});
    expect(tickClock(library, { ...out, meters: { ...out.meters, money: 10 } }).dangerLeft).toEqual({ money: CLOCK });
  });

  it("does not run at the top of the state's meters, which end a run only at the edge", () => {
    const high = onClock({ inst: 100 - DANGER_BELOW + 5, money: 100 - DANGER_BELOW + 5, order: 95 });
    expect(clockRuns("inst", high.meters.inst, false)).toBe(false);
    const after = tick(high, CLOCK * 3);
    expect(after.over).toBeNull();
    expect(after.dangerLeft).toEqual({});
  });

  it("runs out of office for the coalition only, as only the coalition can end the run there", () => {
    const out = onClock({ money: 5, base: 5 }, { opposition: { since: 10, returnAt: null } });
    expect(tickClock(library, out).dangerLeft).toEqual({ base: CLOCK });
  });

  it("changes nothing in a run not on the clock", () => {
    const plain = { ...newRun(library, 7, { align: "left" }), meters: { ...onClock().meters, money: 1 } };
    expect(plain.clock).toBeUndefined();
    expect(tick(plain, CLOCK * 2)).toBe(plain);
  });

  it("is a clock of this game's length or none", () => {
    expect(() => newRun(library, 7, { align: "left", clock: CLOCK - 1 })).toThrow(/clock/);
    expect(newRun(library, 7, { align: "left", clock: CLOCK }).clock).toBe(CLOCK);
  });
});

/** A run on the clock played by the bot with a person's eyes, to its end. */
function played(seed: number, clock: number | undefined): { run: GameState; drawn: GameState[] } {
  const rng = makeRng(seed ^ 0x3c6ef372);
  let s = newRun(library, seed, { ...rollSetup(library, seed, seed % 2 ? "left" : "right", []), ...(clock ? { clock } : {}) });
  const drawn: GameState[] = [];
  while (!s.over) {
    s = draw(library, s);
    drawn.push(s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS.eyes(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return { run: s, drawn };
}

describe("a run on the clock", () => {
  it("is played by it in the game: some of the eyes bot's runs end on it, and none of its ordinary ones carry a count", () => {
    let ranOut = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { run } = played(seed, CLOCK);
      const left = Object.entries(run.dangerLeft ?? {});
      if (left.some(([, n]) => n === 0)) {
        ranOut++;
        const [meter] = left.find(([, n]) => n === 0)!;
        expect(run.over!.endingId).toBe(cfg.meterEndings[meter as keyof Meters].low);
      }
      expect(played(seed, undefined).run.dangerLeft).toBeUndefined();
    }
    expect(ranOut).toBeGreaterThan(3);
  });

  it("is replayed on it, card for card, as the other road and the end screen replay it", () => {
    const { run, drawn } = played(4, CLOCK);
    expect(setupOfRun(run).clock).toBe(CLOCK);
    for (const at of new Set([0, Math.floor(drawn.length / 2), drawn.length - 1])) {
      const back = replayTo(library, run, at)!;
      expect([back.current, back.dangerLeft]).toEqual([drawn[at]!.current, drawn[at]!.dangerLeft]);
    }
  });

  it("marks a side that would run the clock out, as it marks any side that ends the rule", () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const s of played(seed, CLOCK).drawn) {
        if (!Object.values(s.dangerLeft ?? {}).includes(1)) continue;
        const card = getCard(library, s.current!);
        for (const side of ["left", "right"] as const) {
          const after = resolve(library, s, card.id, side);
          if (!Object.values(after.dangerLeft ?? {}).includes(0)) continue;
          expect(sideEnds(library, s, card, side)).toBe(after.over!.endingId);
          return;
        }
      }
    }
    throw new Error("no side in sixty runs ran the clock out");
  });
});
