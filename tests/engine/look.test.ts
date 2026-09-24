import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { DEFAULT_CONFIG } from "../../src/engine/config";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { settleLook, stageOf } from "../../src/engine/look";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { BOTS, makeContext } from "../../src/sim";
import { lib, start, table } from "../helpers";

const cfg = DEFAULT_CONFIG;
const settle = (prev: number, drift: number) => settleLook(prev, drift, cfg);

describe("the look drift implies on its own", () => {
  it("begins each look at its line, on either side", () => {
    expect(cfg.lookAt).toEqual([8, 20, 36]);
    expect([0, 7, 8, 19, 20, 35, 36, 100].map((d) => stageOf(d, cfg))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect([-7, -8, -20, -36, -100].map((d) => stageOf(d, cfg))).toEqual([0, -1, -2, -3, -3]);
  });
});

// BACKLOG-7 phase 45: a look is entered on the card drift crosses its line, as before, and
// left only once drift is lookMargin (4) back past it.
describe("the look a run settles on", () => {
  it("enters a look on the card drift crosses its line, however far it goes", () => {
    expect(settle(0, 7)).toBe(0);
    expect(settle(0, 8)).toBe(1);
    expect(settle(1, 20)).toBe(2);
    expect(settle(0, 36)).toBe(3);
    expect(settle(0, -8)).toBe(-1);
    expect(settle(-1, -40)).toBe(-3);
  });

  it("leaves a look only once drift is the margin back past its line", () => {
    expect(cfg.lookMargin).toBe(4);
    expect([7, 5, 4, 3, 0].map((d) => settle(1, d))).toEqual([1, 1, 1, 0, 0]);
    expect([19, 16, 15, 12, 11, 3].map((d) => settle(2, d))).toEqual([2, 2, 1, 1, 1, 0]);
    expect([35, 32, 31].map((d) => settle(3, d))).toEqual([3, 3, 2]);
    expect([-7, -4, -3].map((d) => settle(-1, d))).toEqual([-1, -1, 0]);
    expect([-16, -15].map((d) => settle(-2, d))).toEqual([-2, -1]);
  });

  it("crosses to the other side at once", () => {
    expect(settle(2, -8)).toBe(-1);
    expect(settle(1, -20)).toBe(-2);
    expect(settle(-3, 8)).toBe(1);
    // Short of the other side's line it is the muddle, not a look held from the far side.
    expect(settle(1, -7)).toBe(0);
  });

  it("is never shallower than drift alone, and settling twice changes nothing", () => {
    for (let prev = -3; prev <= 3; prev++) {
      for (let drift = -100; drift <= 100; drift++) {
        const look = settle(prev, drift);
        const alone = stageOf(drift, cfg);
        if (alone !== 0) {
          expect(Math.sign(look)).toBe(Math.sign(alone));
          expect(Math.abs(look)).toBeGreaterThanOrEqual(Math.abs(alone));
        }
        expect(Math.abs(look - alone)).toBeLessThanOrEqual(1);
        expect(settle(look, drift)).toBe(look);
      }
    }
  });

  it("is the look drift implies when there is no margin", () => {
    const none = { ...cfg, lookMargin: 0 };
    for (let prev = -3; prev <= 3; prev++) {
      for (let drift = -60; drift <= 60; drift++) expect(settleLook(prev, drift, none)).toBe(stageOf(drift, none));
    }
  });
});

describe("a run keeps its look", () => {
  it("starts in the muddle and settles after each choice", () => {
    const l = lib();
    expect(newRun(l, 1, { align: "left" }).look).toBe(0);
    // ev_fx moves drift by 2 either way, and leaves the run going.
    const at = (drift: number, look: number, side: "left" | "right") => {
      const s = resolve(l, table(start(l, { drift, look }), "ev_fx"), "ev_fx", side);
      expect(s.over).toBeNull();
      return [s.drift, s.look];
    };
    expect(at(6, 0, "left")).toEqual([8, 1]);
    expect(at(7, 1, "right")).toEqual([5, 1]);
    expect(at(6, 1, "right")).toEqual([4, 1]);
    expect(at(5, 1, "right")).toEqual([3, 0]);
    expect(at(-6, 1, "right")).toEqual([-8, -1]);
  });

  it("changes nothing else a run does", () => {
    // Every choice of 60 runs, resolved again from a different look: only the look differs.
    for (let i = 0; i < 60; i++) {
      const seed = 4200 + i;
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s: GameState = newRun(library, seed, rollSetup(library, seed, i % 2 ? "left" : "right", []));
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        const side = BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 }));
        const next = resolve(library, s, card.id, side);
        const other = resolve(library, { ...s, look: s.look === 3 ? -3 : 3 }, card.id, side);
        const { look: _a, ...a } = next;
        const { look: _b, ...b } = other;
        expect(b).toEqual(a);
        s = next;
      }
    }
  }, 60000);
});
