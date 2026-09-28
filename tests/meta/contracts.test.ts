import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard, questionOf } from "../../src/engine/library";
import { MANDATES_BY_ID } from "../../src/engine/mandates";
import { WON_BACK_FLAG } from "../../src/engine/opposition";
import { resolve } from "../../src/engine/resolve";
import { RIVAL_POACHED_FLAG } from "../../src/engine/rival";
import { makeRng } from "../../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { BOTS, holdCabinet, honest, makeContext, raiseRival, type Bot } from "../../src/sim";
import {
  CONTRACTS_RETIERED_FROM,
  CONTRACT_TEMPLATES,
  FIRST_DAILY,
  LEGACIES,
  RIVAL_CONTRACTS_FROM,
  SAINT_CARDS,
  SAINT_ERA_UNTIL,
  TIERS,
  contractById,
  contractPool,
  contractStreak,
  contractsFor,
  contractsKept,
  emptyMeta,
  foldRun,
  keepsContract,
  keptIn,
  migrateMeta,
  weekNumber,
  weekStart,
  withKept,
  type ContractWeek,
} from "../../src/meta";
import { META_SAVE_VERSION } from "../../src/version";

/**
 * Weekly contracts (BACKLOG-10 phase 60): three a week, one of each tier, dealt from the week's
 * number so every device deals the same, and kept by a full reign that ends in the week.
 */

const every = CONTRACT_TEMPLATES.flatMap((t) => (t.params.length ? t.params.map((p) => `${t.key}:${p}`) : [t.key]));
/** A reign that ended in this finale, with these patches. */
const reign = (endingId: string, patch: Partial<GameState> = {}): GameState => ({
  ...newRun(library, 7, { align: "left" }),
  cardCount: 105,
  era: 3,
  over: { endingId, epilogueKey: "ascent:left:3" },
  ...patch,
});

describe("the weeks", () => {
  it("are numbered from the first daily's, a Monday, and turn over with it", () => {
    expect(new Date(`${FIRST_DAILY}T00:00:00Z`).getUTCDay()).toBe(1);
    expect(weekNumber(FIRST_DAILY)).toBe(1);
    expect(weekNumber("2026-09-27")).toBe(1);
    expect(weekNumber("2026-09-28")).toBe(2);
    expect(weekNumber("2026-09-20")).toBeNull();
    expect(weekNumber("not a day")).toBeNull();
    for (const week of [1, 2, 9, 52]) expect(weekNumber(weekStart(week))).toBe(week);
    expect(weekStart(2)).toBe("2026-09-28");
  });
});

describe("the week's contracts", () => {
  it("are three, one of each tier, the same every time a week is dealt", () => {
    for (let week = 1; week <= 30; week++) {
      const dealt = contractsFor(week);
      expect(dealt.map((c) => c.tier)).toEqual(TIERS);
      expect(contractsFor(week)).toEqual(dealt);
      for (const c of dealt) expect(contractById(c.id)).toEqual(c);
    }
  });

  it("change from week to week, and every one the pool deals comes up", () => {
    const seen = new Set(Array.from({ length: 400 }, (_, i) => contractsFor(CONTRACTS_RETIERED_FROM + i).map((c) => c.id)).flat());
    expect([...seen].sort()).toEqual(contractPool().map((c) => c.id).sort());
    const sets = new Set(Array.from({ length: 20 }, (_, i) => contractsFor(i + 1).map((c) => c.id).join()));
    expect(sets.size).toBeGreaterThan(15);
  });

  it("say what they ask in a line, with every name filled in", () => {
    for (const id of every) {
      const c = contractById(id)!;
      expect(c.text, id).not.toMatch(/[{}]/);
      expect(c.text.length, id).toBeLessThanOrEqual(90);
    }
    expect(contractById("ascent:middle")).toBeUndefined();
    expect(contractById("no_such")).toBeUndefined();
  });

  it("name only promises and legacies the game has, and never a question's answer: no contract scores a policy", () => {
    const answers = new Set(
      library.content.cards.filter((c) => questionOf(library, c) !== undefined).flatMap((c) => [...(c.left.setFlags ?? []), ...(c.right.setFlags ?? [])]),
    );
    expect(answers.size).toBeGreaterThan(10);
    for (const t of CONTRACT_TEMPLATES) {
      if (t.key === "promise") for (const m of t.params) expect(MANDATES_BY_ID.has(m), m).toBe(true);
      if (t.key.startsWith("legacy")) {
        for (const f of t.params) {
          expect(LEGACIES[f], f).toBeDefined();
          expect(answers.has(f), f).toBe(false);
        }
      }
    }
  });
});

describe("contracts added later", () => {
  const later = CONTRACT_TEMPLATES.filter((t) => t.since !== undefined);
  const keyOf = (id: string) => id.split(":")[0];

  it("are dealt only from a week that had not begun when they shipped: the weeks before keep theirs (BACKLOG-13 phase 85)", () => {
    expect(later.map((t) => [t.key, t.since])).toEqual([
      ["rivalKept", RIVAL_CONTRACTS_FROM],
      ["rivalBeaten", RIVAL_CONTRACTS_FROM],
    ]);
    // Week 1 and week 2 as v0.92.0 dealt them. Week 2 began before the rival's contracts shipped.
    expect(contractsFor(1).map((c) => c.id)).toEqual(["muddle:left", "muddleClean", "broad"]);
    expect(contractsFor(2).map((c) => c.id)).toEqual(["decay:right", "legacy:media_captured", "saintEra"]);
    expect(weekStart(RIVAL_CONTRACTS_FROM)).toBe("2026-10-05");
    for (let w = 1; w < RIVAL_CONTRACTS_FROM; w++) for (const c of contractsFor(w)) expect(later.map((t) => t.key)).not.toContain(keyOf(c.id));
    // From their week, each comes up in its tier.
    const after = Array.from({ length: 100 }, (_, i) => contractsFor(RIVAL_CONTRACTS_FROM + i)).flat();
    for (const t of later) expect(after.filter((c) => c.id === t.key && c.tier === t.tier).length, t.key).toBeGreaterThan(5);
  });
});

describe("contracts moved between tiers", () => {
  const dealt = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => contractsFor(from + i)).flat();

  it("leave the week under way and the next as v0.94.0 deals them: weeks 1 to 3 (BACKLOG-13 phase 87)", () => {
    expect(weekStart(CONTRACTS_RETIERED_FROM)).toBe("2026-10-12");
    expect(CONTRACTS_RETIERED_FROM).toBeGreaterThan(RIVAL_CONTRACTS_FROM);
    expect(contractsFor(1).map((c) => c.id)).toEqual(["muddle:left", "muddleClean", "broad"]);
    expect(contractsFor(2).map((c) => c.id)).toEqual(["decay:right", "legacy:media_captured", "saintEra"]);
    expect(contractsFor(3).map((c) => c.id)).toEqual(["rivalKept", "promiseBroad", "saintEra"]);
    expect(contractPool(CONTRACTS_RETIERED_FROM - 1).map((c) => c.id)).toContain("legacyHard:seawall");
    expect(contractPool(CONTRACTS_RETIERED_FROM - 1).map((c) => c.id)).not.toContain("legacyHard:schools_starved");
  });

  it("deal a whole era's clean run until week 4, and no more after it (BACKLOG-13 phase 91)", () => {
    expect(weekStart(SAINT_ERA_UNTIL)).toBe("2026-10-12");
    // The week under way and the next deal it, as every device already deals them.
    expect(contractsFor(2).map((c) => c.id)).toContain("saintEra");
    expect(contractsFor(3).map((c) => c.id)).toContain("saintEra");
    expect(dealt(SAINT_ERA_UNTIL, SAINT_ERA_UNTIL + 400).map((c) => c.id)).not.toContain("saintEra");
    expect(contractPool().map((c) => c.id)).not.toContain("saintEra");
    // The hard tier deals what is left of it, and a profile that kept it still reads it.
    expect(new Set(contractsFor(SAINT_ERA_UNTIL + 7).map((c) => c.tier))).toEqual(new Set(TIERS));
    expect(contractById("saintEra")?.tier).toBe("hard");
  });

  it("deal the seawall no more, and the schools as a hard contract in its place", () => {
    const ids = dealt(CONTRACTS_RETIERED_FROM, CONTRACTS_RETIERED_FROM + 400).map((c) => c.id);
    expect(ids).not.toContain("legacyHard:seawall");
    expect(ids).not.toContain("legacy:schools_starved");
    expect(ids.filter((id) => id === "legacyHard:schools_starved").length).toBeGreaterThan(10);
    const pool = contractPool();
    expect(pool.find((c) => c.id === "legacyHard:schools_starved")?.tier).toBe("hard");
    expect(pool.map((c) => c.id)).not.toContain("legacyHard:seawall");
    expect(pool.map((c) => c.id)).not.toContain("legacy:schools_starved");
  });

  it("ask a clean run for eighteen cards, as many as a player never serving themselves lasts in most runs", () => {
    const saint = CONTRACT_TEMPLATES.find((t) => t.key === "saint")!;
    const stats = reign("riots").stats;
    const run = (cardCount: number, tempting: number) => reign("riots", { cardCount, stats: { ...stats, tempting } });
    expect(SAINT_CARDS).toBe(18);
    expect(saint.keeps(run(SAINT_CARDS, 0), "decay", "")).toBe(true);
    expect(saint.keeps(run(SAINT_CARDS - 1, 0), "decay", "")).toBe(false);
    expect(saint.keeps(run(40, 1), "decay", "")).toBe(false);
    expect(contractById("saint")!.text).toContain("eighteen cards");
    // Week 9 is the first to deal it, so no profile kept it on twenty.
    for (let w = 1; w <= 8; w++) expect(contractsFor(w).map((c) => c.id)).not.toContain("saint");
  });

  it("still read as kept, in the tier they were dealt in, for a profile that kept them before", () => {
    const schools = contractById("legacy:schools_starved")!;
    const seawall = contractById("legacyHard:seawall")!;
    expect(schools.tier).toBe("fair");
    expect(seawall.tier).toBe("hard");
    expect(schools.text).toBe(contractById("legacyHard:schools_starved")!.text);
    expect(seawall.text).toContain(LEGACIES.seawall!);
    for (const [id, flag] of [
      ["legacy:schools_starved", "schools_starved"],
      ["legacyHard:seawall", "seawall"],
    ]) {
      expect(keepsContract(id!, reign("finale_muddle", { flags: [flag!] }), "muddle"), id).toBe(true);
      expect(keepsContract(id!, reign("finale_muddle"), "muddle"), id).toBe(false);
    }
  });
});

describe("the rival's contracts", () => {
  const kept = CONTRACT_TEMPLATES.find((t) => t.key === "rivalKept")!;
  const beaten = CONTRACT_TEMPLATES.find((t) => t.key === "rivalBeaten")!;
  const stats = reign("finale_muddle").stats;
  const reigned = (patch: Partial<GameState["stats"]>, flags: string[] = [], endingId = "finale_muddle") => reign(endingId, { stats: { ...stats, ...patch }, flags });

  it("ask for someone kept when the rival tried to hire them, and nobody lost to them", () => {
    expect(kept.keeps(reigned({ poachRefused: 1 }), "muddle", "")).toBe(true);
    // Never asked, someone gone over all the same, or the reign not seen through.
    expect(kept.keeps(reigned({ poachRefused: 0 }), "muddle", "")).toBe(false);
    expect(kept.keeps(reigned({ poachRefused: 2 }, [RIVAL_POACHED_FLAG]), "muddle", "")).toBe(false);
    expect(kept.keeps(reigned({ poachRefused: 1 }, [], "riots"), "decay", "")).toBe(false);
    // A run saved before the count keeps nothing it cannot show.
    expect(kept.keeps(reigned({ poachRefused: undefined }), "muddle", "")).toBe(false);
  });

  it("ask for a vote won honestly against the rival standing by name", () => {
    expect(beaten.keeps(reigned({ rivalBeaten: 1 }), "muddle", "")).toBe(true);
    expect(beaten.keeps(reigned({ rivalBeaten: 0, electionsHonest: 3 }), "muddle", "")).toBe(false);
    expect(beaten.keeps(reigned({ rivalBeaten: 1 }, [], "rival_wins"), "decay", "")).toBe(false);
    expect(beaten.keeps(reigned({ rivalBeaten: undefined }), "muddle", "")).toBe(false);
  });

  it("are kept by real reigns that aim at them, in a week that deals them", () => {
    const week = Array.from({ length: 50 }, (_, i) => RIVAL_CONTRACTS_FROM + i).find((w) => {
      const ids = contractsFor(w).map((c) => c.id);
      return ids.includes("rivalKept") && ids.includes("rivalBeaten");
    })!;
    const { mixed } = BOTS;
    const found = (bot: Bot, id: string) => {
      for (let seed = 900_000; seed < 900_040; seed++) {
        const rng = makeRng(seed ^ 0x5bd1e995);
        let s = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", []));
        while (!s.over) {
          s = draw(library, s);
          const card = getCard(library, s.current!);
          s = resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 })));
        }
        if (contractsKept(s, exitBand(library, s), week).includes(id)) return s;
      }
      return null;
    };
    const holding = found(holdCabinet(mixed), "rivalKept")!;
    expect(holding.stats.poachRefused).toBeGreaterThan(0);
    expect(holding.flags).not.toContain(RIVAL_POACHED_FLAG);
    const beating = found(honest(raiseRival(mixed)), "rivalBeaten")!;
    expect(beating.stats.rivalBeaten).toBeGreaterThan(0);
  });
});

describe("keeping a contract", () => {
  const week = 3;

  it("takes a full reign that meets it, once a week", () => {
    const ascent = CONTRACT_TEMPLATES.find((t) => t.key === "ascent")!;
    expect(ascent.keeps(reign("finale_ascent"), "ascent", "left")).toBe(true);
    expect(ascent.keeps(reign("finale_ascent"), "ascent", "right")).toBe(false);
    expect(ascent.keeps(reign("finale_muddle"), "muddle", "left")).toBe(false);
    const wonBack = CONTRACT_TEMPLATES.find((t) => t.key === "wonBackFinale")!;
    expect(wonBack.keeps(reign("finale_decay", { flags: [WON_BACK_FLAG] }), "decay", "")).toBe(true);
    expect(wonBack.keeps(reign("riots", { flags: [WON_BACK_FLAG] }), "decay", "")).toBe(false);
  });

  it("asks for a vote won honestly, not one left to the count and lost (BACKLOG-11 phase 66)", () => {
    const clean = CONTRACT_TEMPLATES.find((t) => t.key === "clean")!;
    const stats = reign("finale_muddle").stats;
    expect(clean.keeps(reign("finale_muddle", { stats: { ...stats, electionsHonest: 2, electionsLost: 1 } }), "muddle", "")).toBe(true);
    expect(clean.keeps(reign("finale_muddle", { stats: { ...stats, electionsHonest: 1, electionsLost: 1 } }), "muddle", "")).toBe(false);
  });

  it("asks for a legacy this reign left, not one it took over from the last of its line", () => {
    const legacy = CONTRACT_TEMPLATES.find((t) => t.key === "legacyHard")!;
    expect(legacy.keeps(reign("finale_muddle", { flags: ["ring_started"] }), "muddle", "ring_started")).toBe(true);
    const inherited = { band: "decay" as const, line: 2, legacies: ["ring_started"], rival: null, rivalStanding: 30 };
    expect(legacy.keeps(reign("finale_muddle", { flags: ["ring_started"], inherited }), "muddle", "ring_started")).toBe(false);
  });

  it("is never done by a first term, or by a run still going", () => {
    // Every week's contracts, against a first term that would keep any a full reign could.
    const term = { ...reign("first_term_ascent"), eraCount: library.config.firstTermEras, cardCount: 35, era: 1 };
    for (let w = 1; w <= 40; w++) expect(contractsKept(term, "ascent", w)).toEqual([]);
    expect(contractsKept({ ...reign("finale_ascent"), over: null }, "ascent", week)).toEqual([]);
  });

  it("is recorded under its week when the run is folded in, and only on the day's week", () => {
    // Find a week whose easy contract a plain clean Ascent keeps, and fold such a run in on a day of it.
    const w = Array.from({ length: 200 }, (_, i) => i + 1).find((n) => {
      const c = contractsFor(n)[0]!;
      return c.id === "clean" || c.id === "ascent:left";
    })!;
    const run = reign("finale_ascent", { stats: { ...reign("finale_ascent").stats, electionsHonest: 3 } });
    const day = weekStart(w);
    const fold = foldRun(library, emptyMeta(), run, undefined, day);
    expect(fold.newContracts).toContain(contractsFor(w)[0]!.id);
    expect(keptIn(fold.meta, w)).toEqual(fold.newContracts);
    // The same run again the same week keeps nothing new.
    expect(foldRun(library, fold.meta, run, undefined, day).newContracts).toEqual([]);
    // Without a day, nothing is kept.
    expect(foldRun(library, emptyMeta(), run).newContracts).toEqual([]);
  });
});

describe("the record of contracts", () => {
  it("merges a week's contracts in, oldest week first, each once", () => {
    let r: ContractWeek[] = [];
    r = withKept(r, 5, ["a"]);
    r = withKept(r, 2, ["b"]);
    r = withKept(r, 5, ["a", "c"]);
    expect(r).toEqual([
      { week: 2, kept: ["b"] },
      { week: 5, kept: ["a", "c"] },
    ]);
    expect(withKept(r, 9, [])).toEqual(r);
  });

  it("counts weeks in a row, alive through a week still open", () => {
    const meta = (weeks: number[]) => ({ contracts: weeks.map((week) => ({ week, kept: ["clean"] })) });
    expect(contractStreak(meta([]), 10)).toEqual({ current: 0, best: 0 });
    expect(contractStreak(meta([8, 9, 10]), 10)).toEqual({ current: 3, best: 3 });
    expect(contractStreak(meta([8, 9]), 10)).toEqual({ current: 2, best: 2 });
    expect(contractStreak(meta([3, 4, 5, 8]), 10)).toEqual({ current: 0, best: 3 });
  });

  it("is read back from a saved profile carefully, since one can arrive in a link", () => {
    // Contracts arrived in v7; a profile from before has none.
    expect(META_SAVE_VERSION).toBeGreaterThanOrEqual(7);
    const old = { ...emptyMeta(), v: 6 } as Record<string, unknown>;
    delete old.contracts;
    expect(migrateMeta(old)!.contracts).toEqual([]);
    const sent = {
      ...emptyMeta(),
      contracts: [
        { week: 4, kept: ["clean", "clean", 7, "broad"] },
        { week: 4, kept: ["decay:left"] },
        { week: 0, kept: ["clean"] },
        { week: 2.5, kept: ["clean"] },
        { week: 3, kept: [] },
        { week: 1, kept: ["a", "b", "c", "d"] },
        "junk",
      ],
    };
    expect(migrateMeta(sent)!.contracts).toEqual([
      { week: 1, kept: ["a", "b", "c"] },
      { week: 4, kept: ["clean", "broad"] },
    ]);
  });
});
