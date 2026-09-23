import { describe, expect, it } from "vitest";
import { content, library } from "../src/content";
import { draw } from "../src/engine/draw";
import { getCard, questionOf } from "../src/engine/library";
import { resolve } from "../src/engine/resolve";
import { makeRng } from "../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../src/engine/state";
import type { GameState, PlayerAlign } from "../src/engine/types";
import { historyOf } from "../src/meta/histories";
import { allUnlockTokens } from "../src/meta/objectives";
import { emptyMeta, foldRun } from "../src/meta/state";
import { BOT_NAMES, BOTS, evaluateLongTargets, evaluateTargets, makeContext, playRun, quantiles, repeatShares, simulate, summarize, type BotName, type BotSummary } from "../src/sim";

// Simulations, so their time grows with the deck: the draw checks every card in its pool.
// On CI these two took 3.2–3.5s at 526 cards and 4.7–5.6s at 554, past vitest's 5s default,
// so they carry a budget like the file's other simulations (BACKLOG-5 phase 35).
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

// BACKLOG-5 phase 39: the long reign has targets of its own, measured on runs of five eras.
// The bots offset any steady pressure an era applies, so these hold its shape rather than its
// difficulty for a person: a competent run usually sees it through, where the country ends up
// is what the first three eras made it, and Decay is the hardest place to spend it.
describe("the long reign's targets", () => {
  it("meets every target", () => {
    const eraCount = library.config.longEraCount;
    const bots: BotName[] = ["random", "greedy", "mixed"];
    const results = simulate(library, { runs: 1500, seed: 1, bots, align: "alternate", danger: 25, maxCards: 1000, eraCount });
    const s = new Map<BotName, BotSummary>();
    for (const bot of bots) s.set(bot, summarize(bot, results.get(bot)!));
    const misses = evaluateLongTargets(s, eraCount).filter((t) => !t.info && !t.pass);
    expect(misses.map((m) => `${m.bot} ${m.name}: ${m.actual} (want ${m.target})`)).toEqual([]);
    // Every run ends inside five eras, and a long finale only on the last card of the fifth.
    for (const bot of bots) {
      for (const r of results.get(bot)!) {
        expect(r.cards).toBeLessThanOrEqual(eraCount * library.config.eraLength);
        if (r.finale) expect([r.cards, r.endingId.startsWith(library.config.longFinalePrefix)]).toEqual([eraCount * library.config.eraLength, true]);
        expect(r.relaxed.band + r.relaxed.era).toBe(0);
      }
    }
  }, 120000);
});

// BACKLOG-5 phase 36: by their tenth run, 89% of a player's cards were ones they had played
// before, because a run draws about 100 cards and the deck held 554. Measured as the audit
// measured it: twenty players, each playing their runs in order, the median at run ten.
describe("the deck by run ten", () => {
  it("keeps a player's tenth run under 75% cards already seen", () => {
    const { median } = quantiles(repeatShares(library, { players: 20, run: 10 }));
    expect(median).toBeLessThan(0.75);
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

// What history calls a run is its defining decision: the first legacy it carries, ranked by
// how much history it makes. Three legacies are carried by 95-99% of runs, and the rule the
// ranking was built to keep is that no decision names more than 15% of them. The questions
// (BACKLOG-6 phase 40) are answered in nearly every run, so this is where they would break it:
// with four, ranked first among them just under the moonshot, a war for the ally named
// 15.0-15.5% of them on fresh samples. With sixteen (phase 41) each answer is rarer, and they
// rank in three tiers: the largest answers under the captured feed, the middling ones under
// the skim, and the status quo under the broken promises. The most any decision names is 9%.
describe("what history calls a run", () => {
  it("names no more than 15% of competent runs for any one decision", () => {
    const n = 6000;
    const named = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const seed = 600_000 + i;
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s = draw(library, newRun(library, seed, rollSetup(library, seed, i % 2 ? "left" : "right", [])));
      while (!s.over) {
        const card = getCard(library, s.current!);
        s = draw(library, resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 }))));
      }
      const { signature } = historyOf(s, exitBand(library, s));
      named.set(signature, (named.get(signature) ?? 0) + 1);
    }
    const most = [...named.entries()].sort((a, b) => b[1] - a[1])[0]!;
    expect(most[1] / n, most[0]).toBeLessThanOrEqual(0.15);
  }, 120000);
});

// BACKLOG-6 phase 41: sixteen questions, three a run, asked in the first two eras. A run meets
// three, each question is met in 17-19% of runs, and a player has met all sixteen by their
// fifteenth run (median; measured on 4,000 runs and 80 players).
describe("the questions", () => {
  const questions = [...new Set(content.arcs.filter((a) => a.question !== undefined).map((a) => a.question!))];
  const asked = (seed: number, align: PlayerAlign, unlocks: string[] = []) => {
    const rng = makeRng(seed ^ 0x5bd1e995);
    let s: GameState = newRun(library, seed, rollSetup(library, seed, align, unlocks));
    const met: string[] = [];
    while (!s.over) {
      s = draw(library, s);
      const card = getCard(library, s.current!);
      const q = questionOf(library, card);
      if (q && card.step === 1) met.push(q);
      s = resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 })));
    }
    return { s, met };
  };

  it("asks a run three, and every question in at least 15% of runs", () => {
    const n = 3000;
    const per: number[] = [];
    const met = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const run = asked(500_000 + i, i % 2 ? "left" : "right").met;
      per.push(run.length);
      for (const q of run) met.set(q, (met.get(q) ?? 0) + 1);
    }
    expect(questions.length).toBeGreaterThanOrEqual(16);
    expect(quantiles(per).median).toBeGreaterThanOrEqual(3);
    for (const q of questions) expect((met.get(q) ?? 0) / n, q).toBeGreaterThanOrEqual(0.15);
  }, 120000);

  it("has asked a player every question by their twentieth run (median)", () => {
    const players = 40;
    const by: number[] = [];
    for (let p = 0; p < players; p++) {
      let meta = emptyMeta();
      const seen = new Set<string>();
      let run = 0;
      while (seen.size < questions.length && run < 40) {
        run++;
        const { s, met } = asked(100_000 + p * 1000 + run, (p + run) % 2 ? "left" : "right", meta.unlocks);
        for (const q of met) seen.add(q);
        meta = foldRun(library, meta, s).meta;
      }
      by.push(seen.size === questions.length ? run : Infinity);
    }
    expect(quantiles(by).median).toBeLessThanOrEqual(20);
  }, 120000);
});
