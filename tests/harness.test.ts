import { describe, expect, it } from "vitest";
import { library } from "../src/content";
import { BOT_NAMES, evaluateTargets, playRun, simulate, summarize, type BotName, type BotSummary } from "../src/sim";

describe("harness", () => {
  it("terminates every run with a known ending inside the card budget", () => {
    const maxCards = library.config.eraCount * library.config.eraLength;
    const results = simulate(library, { runs: 150, seed: 1, bots: BOT_NAMES, align: "alternate", danger: 25, maxCards: 1000 });
    for (const bot of BOT_NAMES) {
      const runs = results.get(bot)!;
      expect(runs).toHaveLength(150);
      for (const r of runs) {
        expect(library.endings.has(r.endingId)).toBe(true);
        expect(r.cards).toBeGreaterThan(0);
        expect(r.cards).toBeLessThanOrEqual(maxCards);
        if (r.finale) expect(r.cards).toBe(maxCards);
        expect(r.relaxed.band).toBe(0);
      }
    }
  });

  it("is reproducible for a seed and bot", () => {
    for (const bot of BOT_NAMES) {
      const a = playRun(library, bot, 99, "right");
      const b = playRun(library, bot, 99, "right");
      expect(a).toEqual(b);
    }
  });

  it("bots behave as designed on aggregate", () => {
    const results = simulate(library, { runs: 200, seed: 7, bots: BOT_NAMES, align: "alternate", danger: 25, maxCards: 1000 });
    const s = new Map<BotName, BotSummary>();
    for (const bot of BOT_NAMES) s.set(bot, summarize(bot, results.get(bot)!));
    expect(s.get("saint")!.drift.median).toBeGreaterThan(s.get("random")!.drift.median);
    expect(s.get("greedy")!.drift.median).toBeLessThan(s.get("saint")!.drift.median);
    expect(s.get("greedy")!.cards.median).toBeGreaterThan(s.get("saint")!.cards.median);
    expect(s.get("saint")!.cheatsPerElection).toBe(0);
    expect(evaluateTargets(s).length).toBeGreaterThan(0);
  });
});

// Section 8 acceptance targets. Enable once phase 4 has tuned the content.
describe.skip("section 8 targets (phase 4)", () => {
  it("meets every target", () => {
    const results = simulate(library, { runs: 2000, seed: 1, bots: BOT_NAMES, align: "alternate", danger: 25, maxCards: 1000 });
    const s = new Map<BotName, BotSummary>();
    for (const bot of BOT_NAMES) s.set(bot, summarize(bot, results.get(bot)!));
    const misses = evaluateTargets(s).filter((t) => !t.info && !t.pass);
    expect(misses).toEqual([]);
  });
});
