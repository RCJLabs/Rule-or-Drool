import { describe, expect, it } from "vitest";
import { makeRng, nextInt, nextRandom, pickWeighted, seedToState } from "../../src/engine/rng";

describe("rng", () => {
  it("is deterministic per seed and differs across seeds", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const c = makeRng(43);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    const seqC = Array.from({ length: 5 }, () => c());
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
  });

  it("produces values in [0, 1) and int32 states", () => {
    let state = seedToState(7);
    for (let i = 0; i < 1000; i++) {
      const r = nextRandom(state);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
      expect(Number.isInteger(r.state)).toBe(true);
      expect(r.state).toBe(r.state | 0);
      state = r.state;
    }
  });

  it("nextInt stays inclusive of both bounds", () => {
    let state = seedToState(3);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const r = nextInt(state, 4, 6);
      expect(r.value).toBeGreaterThanOrEqual(4);
      expect(r.value).toBeLessThanOrEqual(6);
      seen.add(r.value);
      state = r.state;
    }
    expect([...seen].sort()).toEqual([4, 5, 6]);
  });

  it("pickWeighted respects weights, ignores non-positive ones, and returns -1 on zero total", () => {
    let state = seedToState(9);
    const counts = [0, 0, 0];
    for (let i = 0; i < 2000; i++) {
      const r = pickWeighted(state, [1, 99, 0]);
      counts[r.index]!++;
      state = r.state;
    }
    expect(counts[2]).toBe(0);
    expect(counts[1]! / 2000).toBeGreaterThan(0.95);
    expect(pickWeighted(state, [0, 0]).index).toBe(-1);
    expect(pickWeighted(state, [-1, 0]).index).toBe(-1);
    expect(pickWeighted(state, []).index).toBe(-1);
  });

  it("seedToState mixes nearby seeds apart", () => {
    expect(seedToState(0)).not.toBe(seedToState(1));
    expect(seedToState(1)).not.toBe(seedToState(2));
  });
});
