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
import { BOT_NAMES, BOTS, evaluateLongTargets, evaluateTargets, lookProfile, makeContext, playRun, quantiles, repeatProfile, simulate, summarize, type BotName, type BotSummary } from "../src/sim";

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
    // The mixed bot plays more of them: Decay is the hard place by about 5 points, measured
    // on the Decay-locked quarter of its reigns, and at 1,500 runs that quarter is small enough
    // that one sample put it at 1.9 and another of the same content at 5 (BACKLOG-6 phase 42).
    const results = new Map([
      ...simulate(library, { runs: 1500, seed: 1, bots: ["random", "greedy"], align: "alternate", danger: 25, maxCards: 1000, eraCount }),
      ...simulate(library, { runs: 4000, seed: 1, bots: ["mixed"], align: "alternate", danger: 25, maxCards: 1000, eraCount }),
    ]);
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
  }, 180000);
});

// BACKLOG-7 phase 45: the frame's look followed drift card by card, and over the mixed bot's
// first runs it changed 27 times a run, 53% of the changes undone within three cards. A look
// is now left only past a margin. Measured as the audit measured it, 2,000 runs from 900,000.
describe("the look settles", () => {
  it("undoes at most a quarter of its changes within three cards, and holds on at most 12% of cards", () => {
    const p = lookProfile(library, { runs: 2000 });
    expect(p.undone).toBeLessThanOrEqual(0.25);
    expect(p.held).toBeLessThanOrEqual(0.12);
    // Early signs keep their timing: no card shows a look shallower than drift alone.
    expect(p.late).toBe(0);
    expect(p.changes).toBeLessThanOrEqual(16);
  }, 120000);
});

// BACKLOG-5 phase 36: by their tenth run, 89% of a player's cards were ones they had played
// before, because a run draws about 100 cards and the deck held 554. Measured as the audit
// measured it: players each playing their runs in order, the median at the run in question.
// BACKLOG-6 measured it with forty players, from seed 300,000: 74% at run ten (era 1 74%) and
// 91% at run twenty, and phase 44 added 160 ordinary cards to bring those down.
describe("the deck by run ten and run twenty", () => {
  it("keeps a player's tenth run at most 65% cards already seen, and its first era at most 60%", () => {
    const { all, byEra } = repeatProfile(library, { players: 40, run: 10, seedBase: 300_000 });
    expect(quantiles(all).median).toBeLessThanOrEqual(0.65);
    // Every run starts in era 1, so it is the era a player has seen most of.
    expect(quantiles(byEra.get(1)!).median).toBeLessThanOrEqual(0.6);
  }, 60000);

  it("keeps a player's twentieth run at most 85% cards already seen", () => {
    const { all } = repeatProfile(library, { players: 40, run: 20, seedBase: 300_000 });
    expect(quantiles(all).median).toBeLessThanOrEqual(0.85);
  }, 120000);
});

// BACKLOG-5 phase 35: ten crises and a third face in every role. The first thing a run says
// is the crisis it inherits, and a player had met all four by their seventh run and all
// sixteen advisors by their fifth.
// BACKLOG-7 phase 48: stories repeated faster than anything else in the game. By a player's
// tenth run 82% of the story cards they met were ones they had met before, and by the twentieth
// all of them. Twenty-two more stories were sized to bring that to the ordinary deck's ceilings.
// Measured on 200 players: a run meets about ten story cards, so each player's share is a coarse
// fraction and the median is one player's share. The first 40 of these players read 87.5% at the
// twentieth run, where all 200 read 83.3%.
describe("the stories by run ten and run twenty", () => {
  it("keeps a player's story cards at most 65% already met by their tenth run, and 85% by their twentieth", () => {
    const med = (xs: number[]) => quantiles(xs).median;
    const tenth = repeatProfile(library, { players: 200, run: 10, seedBase: 300_000, cards: "stories" });
    const twentieth = repeatProfile(library, { players: 200, run: 20, seedBase: 300_000, cards: "stories" });
    expect(med(tenth.all)).toBeLessThanOrEqual(0.65);
    expect(med(twentieth.all)).toBeLessThanOrEqual(0.85);
  }, 240000);
});

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

// BACKLOG-6 phase 42: an answer comes back in the eras after it. Of the questions a competent
// run answered, in runs that reached era 2, 73% met a card that came of the answer (4,000 runs
// on two seed sets); the target is 60%.
describe("the answers come back", () => {
  it("meets something that came of an answer in at least 60% of the runs that reached era 2", () => {
    let pairs = 0;
    let met = 0;
    for (let i = 0; i < 2000; i++) {
      const seed = 500_000 + i;
      const rng = makeRng(seed ^ 0x5bd1e995);
      let s: GameState = newRun(library, seed, rollSetup(library, seed, i % 2 ? "left" : "right", []));
      const answered = new Set<string>();
      const seen = new Set<string>();
      while (!s.over) {
        s = draw(library, s);
        const card = getCard(library, s.current!);
        seen.add(card.id);
        const side = BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 }));
        if (questionOf(library, card) !== undefined && card.step === 1) for (const f of card[side].setFlags ?? []) answered.add(f);
        s = resolve(library, s, card.id, side);
      }
      if (s.era < 2) continue;
      for (const f of answered) {
        pairs++;
        if ([...seen].some((id) => library.cards.get(id)!.cond?.flags?.includes(f))) met++;
      }
    }
    expect(pairs).toBeGreaterThan(3000);
    expect(met / pairs).toBeGreaterThanOrEqual(0.6);
  }, 120000);
});

// BACKLOG-6 phase 43: endings a player can choose. Measured on 3,000 competent runs, 85% offer
// one (a card whose choice itself ends the run, not an election), and a player's first twenty
// runs offer 22 different ones (median of 60 players).
describe("endings you choose", () => {
  const offeredIn = (seed: number, align: PlayerAlign, unlocks: string[] = []) => {
    const rng = makeRng(seed ^ 0x5bd1e995);
    let s: GameState = newRun(library, seed, rollSetup(library, seed, align, unlocks));
    const offered = new Set<string>();
    while (!s.over) {
      s = draw(library, s);
      const card = getCard(library, s.current!);
      if (card.type !== "election") for (const side of ["left", "right"] as const) if (card[side].ending) offered.add(card[side].ending!);
      s = resolve(library, s, card.id, BOTS.mixed(makeContext(library, s, card, rng, { danger: 25 })));
    }
    return { s, offered };
  };

  it("offers an ending by choice in at least 75% of runs", () => {
    let offering = 0;
    const n = 2000;
    for (let i = 0; i < n; i++) if (offeredIn(700_000 + i, i % 2 ? "left" : "right").offered.size > 0) offering++;
    expect(offering / n).toBeGreaterThanOrEqual(0.75);
  }, 120000);

  it("offers a player at least twelve different endings by choice in their first twenty runs", () => {
    const players = 20;
    const distinct: number[] = [];
    for (let p = 0; p < players; p++) {
      let meta = emptyMeta();
      const seen = new Set<string>();
      for (let r = 1; r <= 20; r++) {
        const { s, offered } = offeredIn(100_000 + p * 1000 + r, (p + r) % 2 ? "left" : "right", meta.unlocks);
        for (const e of offered) seen.add(e);
        meta = foldRun(library, meta, s).meta;
      }
      distinct.push(seen.size);
    }
    expect(quantiles(distinct).median).toBeGreaterThanOrEqual(12);
  }, 120000);
});
