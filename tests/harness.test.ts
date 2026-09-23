import { describe, expect, it } from "vitest";
import { content, library } from "../src/content";
import { rollSetup } from "../src/engine/state";
import { allUnlockTokens } from "../src/meta/objectives";
import { BOT_NAMES, evaluateTargets, playRun, simulate, summarize, type BotName, type BotSummary } from "../src/sim";

// Simulations, so their time grows with the deck: the draw weighs every eligible card. On CI
// these two took 3.2–3.5s at 526 cards and 4.7–5.6s at 554, past vitest's 5s default, so they
// carry a budget like the file's other simulations (BACKLOG-5 phase 35).
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
  }, 60000);

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
  }, 60000);
});

// Section 8 acceptance targets, met in phase 4. Content changes that break these are
// balance regressions: re-tune with `npm run simulate` rather than deleting the test.
describe("section 8 targets", () => {
  it("meets every target", () => {
    const results = simulate(library, { runs: 2000, seed: 1, bots: BOT_NAMES, align: "alternate", danger: 25, maxCards: 1000 });
    const s = new Map<BotName, BotSummary>();
    for (const bot of BOT_NAMES) s.set(bot, summarize(bot, results.get(bot)!));
    const misses = evaluateTargets(s).filter((t) => !t.info && !t.pass);
    expect(misses.map((m) => `${m.bot} ${m.name}: ${m.actual} (want ${m.target})`)).toEqual([]);
  }, 60000);
});

// BACKLOG-5 phase 35: ten crises and a third face in every role. The first thing a run says
// is the crisis it inherits, and a player had met all four by their seventh run and all
// sixteen advisors by their fifth.
describe("who a run inherits", () => {
  it("deals no crisis to more than 15% of runs, for a new player or a fully unlocked one", () => {
    for (const unlocked of [[], allUnlockTokens()]) {
      const n = 20000;
      const count = new Map<string, number>();
      for (let seed = 1; seed <= n; seed++) {
        const setup = rollSetup(library, seed, seed % 2 ? "left" : "right", unlocked);
        const crisis = setup.modifiers!.find((id) => library.modifiers.get(id)?.kind === "crisis")!;
        count.set(crisis, (count.get(crisis) ?? 0) + 1);
      }
      expect(count.size).toBe(content.modifiers.filter((m) => m.kind === "crisis").length);
      expect(count.size).toBeGreaterThanOrEqual(10);
      for (const [id, c] of count) expect(c / n, id).toBeLessThanOrEqual(0.15);
    }
  });

  it("seats every cabinet advisor in 20–45% of a competent player's runs", () => {
    // Serving is holding the role at any point: the cabinet a run opens with and everyone
    // brought in when somebody was let go. Measured: 32–42% with three to a role, where two
    // to a role gave 47–75%.
    const mixed = summarize("mixed", simulate(library, { runs: 2000, seed: 1, bots: ["mixed"], align: "alternate", danger: 25, maxCards: 1000 }).get("mixed")!);
    const cabinet = content.advisors.filter((a) => a.role !== library.config.rivalRole);
    expect(cabinet.length).toBeGreaterThanOrEqual(24);
    const share = new Map(mixed.served);
    for (const a of cabinet) {
      expect(share.get(a.id) ?? 0, a.id).toBeGreaterThanOrEqual(0.2);
      expect(share.get(a.id) ?? 0, a.id).toBeLessThanOrEqual(0.45);
    }
  }, 60000);
});
