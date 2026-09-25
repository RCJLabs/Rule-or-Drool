import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import {
  ALL_HISTORY_KEYS,
  HISTORIES,
  HISTORY_ORDER,
  LEGACY_FLAGS,
  NO_LEGACY,
  codexProgress,
  emptyMeta,
  foldRun,
  historyOf,
  historyTitle,
  migrateMeta,
  reachableHistoryKeys,
} from "../../src/meta";

const finale = (patch: Partial<GameState> = {}, epilogueKey = "muddle:left:3"): GameState => ({
  ...newRun(library, 1, { align: "left" }),
  cardCount: 105,
  era: 3,
  over: { endingId: "finale_muddle", epilogueKey },
  ...patch,
});

/**
 * Every run is named for what it did (post-run histories). A competent player saw a median
 * of 3 endings in twenty runs because 97% of competent runs survive to a finale; a history
 * is reached by winning as well as by failing, and measured over 6,000 competent runs a
 * player meets a median of 17 distinct ones in their first twenty.
 */
describe("what history calls a run", () => {
  it("has a written name for every legacy, direction and side, and no two alike", () => {
    // Two sides, and the long view, which names no side (BACKLOG-5 phase 39).
    expect(ALL_HISTORY_KEYS).toHaveLength((LEGACY_FLAGS.size + 1) * 3 * 3);
    const titles = ALL_HISTORY_KEYS.map(historyTitle);
    expect(titles.every(Boolean)).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("names a run that lived past its third era from the long view, which names no side", () => {
    const flags = ["seawall"];
    const at = (era: number, align: "left" | "right") => historyOf(finale({ flags, era, align, eraCount: library.config.longEraCount }), "ascent");
    for (const align of ["left", "right"] as const) {
      expect(at(3, align).key).toBe(`seawall:ascent:${align}`);
      expect(at(4, align)).toMatchObject({ key: "seawall:ascent:long", title: HISTORIES.seawall!.long.ascent, signature: "seawall" });
      expect(at(5, align).title).toBe(HISTORIES.seawall!.long.ascent);
    }
    expect(historyTitle("seawall:ascent:long")).toBe(HISTORIES.seawall!.long.ascent);
    expect(ALL_HISTORY_KEYS).toContain("seawall:ascent:long");
    // What became of the decision is the same either way; only the name takes the long view.
    expect(at(5, "left").consequences).toEqual(at(3, "left").consequences);
  });

  it("ranks every legacy exactly once", () => {
    expect(new Set(HISTORY_ORDER).size).toBe(HISTORY_ORDER.length);
    expect([...HISTORY_ORDER].sort()).toEqual([...LEGACY_FLAGS].sort());
  });

  it("is named for the most history-making thing the run did, not the most common", () => {
    // Three legacies are carried by 95-99% of runs. A run that also built the seawall is
    // remembered for the seawall.
    const s = finale({ flags: ["habit_skim", "habit_bend", "cheated_election", "seawall"] });
    const h = historyOf(s, "ascent");
    expect(h.signature).toBe("seawall");
    expect(h.title).toBe(HISTORIES.seawall!.titles.ascent.left);
    expect(h.key).toBe("seawall:ascent:left");
  });

  it("names the same decision differently by where the country went and who held it", () => {
    const flags = ["seawall"];
    const names = new Set([
      historyOf(finale({ flags }), "decay").title,
      historyOf(finale({ flags }), "ascent").title,
      historyOf(finale({ flags, align: "right" }), "ascent").title,
    ]);
    expect(names.size).toBe(3);
  });

  it("follows up on the run's biggest decisions, most history-making first, with when they were made", () => {
    const s = finale({
      flags: ["habit_skim", "housing_built", "long_ship", "cheated_election", "schools_starved", "seawall"],
      flagSince: { long_ship: 88, seawall: 40, housing_built: 22 },
    });
    const h = historyOf(s, "decay");
    expect(h.consequences.map((c) => c.flag)).toEqual(["long_ship", "seawall", "housing_built", "schools_starved"]);
    expect(h.consequences[0]!.at).toBe(88);
    expect(h.consequences[3]!.at).toBeNull();
    expect(h.consequences[0]!.after).toBe(HISTORIES.long_ship!.after.decay);
  });

  it("still names a run that left nothing behind", () => {
    const h = historyOf(finale({ flags: ["east_talks"] }), "muddle");
    expect(h.signature).toBe(NO_LEGACY);
    expect(h.title).toBe(HISTORIES[NO_LEGACY]!.titles.muddle.left);
    expect(h.consequences).toHaveLength(1);
  });
});

describe("histories in the codex", () => {
  it("records a history the first time and counts it after", () => {
    const run = finale({ flags: ["seawall"] });
    const first = foldRun(library, emptyMeta(), run);
    expect(first.newHistory).toBe(true);
    expect(first.history!.key).toBe("seawall:muddle:left");
    expect(first.meta.histories).toEqual({ "seawall:muddle:left": 1 });
    expect(first.meta.history[0]!.history).toBe("seawall:muddle:left");
    const again = foldRun(library, first.meta, run);
    expect(again.newHistory).toBe(false);
    expect(again.meta.histories["seawall:muddle:left"]).toBe(2);
    expect(codexProgress(library, again.meta)).toMatchObject({ historiesSeen: 1, historiesTotal: reachableHistoryKeys(library).length });
  });

  it("counts only the names a run of this deck can be given (BACKLOG-11 phase 66)", () => {
    const keys = reachableHistoryKeys(library);
    expect(keys.length).toBeLessThan(ALL_HISTORY_KEYS.length);
    for (const k of keys) expect(ALL_HISTORY_KEYS).toContain(k);
    // Each name left out is a side no card of which sets the legacy; the long view names no side.
    const setBy = (flag: string, side: string) =>
      library.content.cards.some((c) => (c.align === "any" || c.align === side) && [c.left, c.right].some((ch) => ch.setFlags?.includes(flag)));
    for (const k of ALL_HISTORY_KEYS.filter((k) => !keys.includes(k))) {
      const [sig, , side] = k.split(":");
      expect(side, k).not.toBe("long");
      expect(setBy(sig!, side!), k).toBe(false);
    }
    expect(keys).toContain("purge_begun:decay:left");
    expect(keys).toContain("purge_begun:decay:long");
    expect(keys).not.toContain("purge_begun:decay:right");
    expect(codexProgress(library, emptyMeta()).historiesTotal).toBe(keys.length);
    // A name a profile already has counts in the whole, so it is never more than the whole.
    const odd = { ...emptyMeta(), histories: { "purge_begun:decay:right": 1 } };
    expect(codexProgress(library, odd)).toMatchObject({ historiesSeen: 1, historiesTotal: keys.length + 1 });
  });

  it("brings a v4 profile forward with an empty collection and its old runs unnamed", () => {
    const v4 = { ...emptyMeta(), v: 4, histories: undefined, history: [{ align: "left", cards: 40, era: 2, endingId: "riots", band: "decay", rival: null, legacies: [], mandate: null, mandateKept: false }] };
    const m = migrateMeta(v4)!;
    expect(m.histories).toEqual({});
    expect(m.history[0]!.history).toBeNull();
  });
});
