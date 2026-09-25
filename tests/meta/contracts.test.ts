import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { questionOf } from "../../src/engine/library";
import { MANDATES_BY_ID } from "../../src/engine/mandates";
import { WON_BACK_FLAG } from "../../src/engine/opposition";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import {
  CONTRACT_TEMPLATES,
  FIRST_DAILY,
  LEGACIES,
  TIERS,
  contractById,
  contractStreak,
  contractsFor,
  contractsKept,
  emptyMeta,
  foldRun,
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

  it("change from week to week, and every one of them comes up", () => {
    const seen = new Set(Array.from({ length: 400 }, (_, i) => contractsFor(i + 1).map((c) => c.id)).flat());
    expect([...seen].sort()).toEqual([...every].sort());
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
    expect(META_SAVE_VERSION).toBe(7);
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
