import { describe, expect, it } from "vitest";
import { library } from "../src/content";
import { draw } from "../src/engine/draw";
import { survivedTo, withNames } from "../src/engine/endings";
import { getCard } from "../src/engine/library";
import { sideEnds } from "../src/engine/preview";
import { otherSide, replayTo } from "../src/engine/replay";
import { resolve } from "../src/engine/resolve";
import { makeRng } from "../src/engine/rng";
import { newRun, rollSetup } from "../src/engine/state";
import type { GameState, Side } from "../src/engine/types";
import { BOTS, makeContext, noisy, type Bot } from "../src/sim";
import { TURNING_FILLERS, pickTurningPoints, turningPoints, turningPointsOf } from "../src/sim/turning";

/**
 * Where a run turned (BACKLOG-14 phase 88): each decision taken the other way, the rest played as
 * the player played it where the same cards come, and carefully where new ones do.
 */

/** A run played to its end as a person-like player would: the eyes bot, one card in five its own way. */
function played(seed: number, eraCount?: number, bot: Bot = noisy(BOTS.eyes, 0.2)): GameState {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s = newRun(library, seed, { ...rollSetup(library, seed, seed % 2 ? "left" : "right", []), ...(eraCount ? { eraCount } : {}) });
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

/**
 * The other road from card k+1, worked out again here the long way: replayed to that card from
 * nothing, the other side taken, and the rest answered as the run answered the same cards after
 * it, a side marked as ending the reign passed over, and a filler on any card it never met.
 */
function roadAgain(run: GameState, k: number, filler: Bot, fillerIndex: number): string | null {
  const record = run.choices!;
  let s = replayTo(library, run, k)!;
  s = resolve(library, s, s.current!, otherSide(record[k]![1]));
  const used = new Set<number>();
  let rng: (() => number) | null = null;
  while (!s.over && s.cardCount < 400) {
    s = draw(library, s);
    const cardId = s.current!;
    const p = record.findIndex(([id], i) => i > k && id === cardId && !used.has(i));
    if (p >= 0) {
      used.add(p);
      let side: Side = record[p]![1];
      const card = getCard(library, cardId);
      const next = resolve(library, s, cardId, side);
      if (next.over && !survivedTo(library.config, next.over.endingId) && sideEnds(library, s, card, side) && !sideEnds(library, s, card, otherSide(side)))
        side = otherSide(side);
      s = resolve(library, s, cardId, side);
    } else {
      // The finder seeds the fillers' coin-flips where the roads first part.
      rng ??= makeRng((run.seed ^ Math.imul(s.cardCount + 1, 0x9e3779b1) ^ Math.imul(fillerIndex + 1, 0x85ebca6b)) >>> 0);
      s = resolve(library, s, cardId, filler(makeContext(library, s, getCard(library, cardId), rng, { danger: 25 })));
    }
  }
  return s.over?.endingId ?? null;
}

const runs = [3, 8, 21].map((seed) => played(seed));
const found = runs.map((r) => turningPoints(library, r)!);

describe("the turning points of a run", () => {
  it("are found in a run played to its end, the same every time", () => {
    expect(found.every((f) => f !== null)).toBe(true);
    expect(found.flat().length).toBeGreaterThan(0);
    expect(turningPoints(library, runs[0]!)).toEqual(found[0]);
  });

  it("each end the reign otherwise than it ended, the rest played as the player played it, whichever careful player fills in", () => {
    runs.forEach((run, i) => {
      for (const p of found[i]!) {
        expect(p.side).toBe(run.choices![p.k]![1]);
        expect(p.cardId).toBe(run.choices![p.k]![0]);
        expect(p.endingId).not.toBe(run.over!.endingId);
        TURNING_FILLERS.forEach((filler, f) => expect(roadAgain(run, p.k, filler, f), `card ${p.k + 1}`).toBe(p.endingId));
      }
    });
  });

  it("are never a side that ends the reign on the spot, which the card marks", () => {
    runs.forEach((run, i) => {
      for (const p of found[i]!) {
        const at = replayTo(library, run, p.k)!;
        expect(resolve(library, at, p.cardId, otherSide(p.side)).over).toBeNull();
      }
    });
  });

  it("name each side as the card named it, the people an appointment could seat filled in", () => {
    runs.forEach((run, i) => {
      for (const p of found[i]!) {
        const at = replayTo(library, run, p.k)!;
        const card = getCard(library, p.cardId);
        expect(p.chose).toBe(withNames(library, at, card[p.side].label, card.speaker));
        expect(p.other).toBe(withNames(library, at, card[otherSide(p.side)].label, card.speaker));
        expect(`${p.chose}${p.other}`).not.toMatch(/[{}]/);
      }
    });
  });

  it("tell a close run from one a decision set in motion: only the card's own weight on the direction, and no more", () => {
    runs.forEach((run, i) => {
      for (const p of found[i]!.filter((x) => !x.knockOn)) {
        const card = getCard(library, p.cardId);
        expect(p.band).not.toBeNull();
        expect(survivedTo(library.config, run.over!.endingId)).toBe(true);
        expect(p.moved).toBeLessThanOrEqual(Math.abs((card.left.drift ?? 0) - (card.right.drift ?? 0)) + 2);
      }
    });
  });

  it("are worked out a decision at a time, so a screen can do it in slices", () => {
    const run = runs[1]!;
    const it = turningPointsOf(library, run);
    let steps = 0;
    for (let r = it.next(); !r.done; r = it.next()) steps++;
    expect(steps).toBe(run.cardCount);
  });

  it("are not looked for in a run that cannot be retraced: no record, or one that deals otherwise", () => {
    const run = runs[0]!;
    expect(turningPoints(library, { ...run, choices: null })).toBeNull();
    const record = run.choices!.map(([id, side], i): [string, Side] => [i === 3 ? "no_such_card" : id, side]);
    expect(turningPoints(library, { ...run, choices: record })).toBeNull();
    expect(turningPoints(library, { ...run, over: null })).toBeNull();
  });

  it("are found in a first term too", () => {
    const terms = [1, 2, 3, 4, 5, 6].map((seed) => turningPoints(library, played(seed, library.config.firstTermEras))!);
    expect(terms.every((t) => t !== null)).toBe(true);
    expect(terms.flat().length).toBeGreaterThan(0);
  });
});

describe("the turning points shown", () => {
  it("are at most three that set something in motion, a reign kept or cut short first, in card order", () => {
    runs.forEach((run, i) => {
      const shown = pickTurningPoints(found[i]!, run, library);
      expect(shown.length).toBeLessThanOrEqual(3);
      expect(shown.every((p) => p.knockOn)).toBe(true);
      expect(shown.map((p) => p.k)).toEqual([...shown.map((p) => p.k)].sort((a, b) => a - b));
      const knockOn = found[i]!.filter((p) => p.knockOn);
      expect(shown.length).toBe(Math.min(3, knockOn.length));
      // A road that keeps or loses the reign is never passed over for one that only moves the band.
      const keptOrLost = (p: (typeof knockOn)[number]) => p.band === null || !survivedTo(library.config, run.over!.endingId);
      if (knockOn.filter(keptOrLost).length >= 3) expect(shown.every(keptOrLost)).toBe(true);
    });
  });

  it("are none for a run whose every turning point was only close", () => {
    const run = runs[0]!;
    const close = found[0]!.map((p) => ({ ...p, knockOn: false }));
    expect(pickTurningPoints(close, run, library)).toEqual([]);
  });
});
