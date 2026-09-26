import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import {
  ALL_HISTORY_KEYS,
  FALSE_AFTER,
  HISTORIES,
  HISTORY_ORDER,
  LEGACY_FLAGS,
  NO_LEGACY,
  codexProgress,
  emptyMeta,
  foldRun,
  historyOf,
  historyOfRun,
  historyTitle,
  migrateMeta,
  namesAgainst,
  reachableHistoryKeys,
} from "../../src/meta";
import type { PlayerAlign, Side } from "../../src/engine/types";

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

/**
 * A name its own ending shows to be false (BACKLOG-11 phase 73): a question's Ascent names are for
 * its answer carried out the honest way, and three story names are listed. Measured: no bot run in
 * 12,000 meets one; an informed voter that takes every story's and question's end when it comes
 * had 19 of 2,000 runs renamed.
 */
describe("a name its ending shows to be false", () => {
  /** A run ended on its last choice, with the flags these cards set, at this drift. */
  const ended = (align: PlayerAlign, drift: number, endingId: string, choices: [string, Side][], flagSince: Record<string, number>, also: string[] = []): GameState => {
    const s = newRun(library, 5, { align });
    return {
      ...s,
      drift,
      cardCount: choices.length,
      choices,
      flags: [...s.flags, ...Object.keys(flagSince), ...also],
      flagSince: { ...s.flagSince, ...flagSince },
      over: { endingId, epilogueKey: "ascent:left:1" },
    };
  };
  const sideSetting = (cardId: string, flag: string): Side => (["left", "right"] as const).find((side) => library.cards.get(cardId)![side].setFlags?.includes(flag))!;
  // Ranked below every name tested here, so a run carrying it is named by it only when they are not.
  const next = HISTORY_ORDER[HISTORY_ORDER.length - 1]!;

  it("does not name a run by its answer in the Ascent when the question ended it on its self-serving side", () => {
    const answer = "pension_age_raised";
    const asked = sideSetting("q_pensions_r_q", answer);
    const run = ended("right", 40, "grey_march", [["q_pensions_r_q", asked], ["x", "left"], ["q_pensions_r_a3", "right"]], { [answer]: 1 }, [next]);
    expect(historyOf(run, "ascent").signature).toBe(answer);
    expect(historyOfRun(library, run, "ascent").signature).toBe(next);
    // The Decay's name for it is not for an answer carried out honestly, and stands.
    expect(historyOfRun(library, { ...run, drift: -40 }, "decay").signature).toBe(answer);
    // With nothing else to name it by, it keeps the name.
    expect(historyOfRun(library, { ...run, flags: run.flags.filter((f) => f !== next) }, "ascent").signature).toBe(answer);
  });

  it("does not name a run by a story's listed name, and leaves the story names that fit", () => {
    const games = ended("left", 40, "the_games", [["arc_ga1", "right"], ["arc_ga3", "right"]], { stadium_built: 2 }, [next]);
    expect(namesAgainst(library, games).has("stadium_built:ascent:left")).toBe(true);
    expect(historyOfRun(library, games, "ascent").signature).toBe(next);
    // The crown signed back reads as what came after it: named so still.
    const crown = ended("right", 40, "first_minister", [["arc_cn1", "left"], ["arc_cn3", "right"]], { crown_restored: 2 }, [next]);
    expect(historyOfRun(library, crown, "ascent").signature).toBe("crown_restored");
  });

  it("lists only names a run ended that way could be given, each of which another run still can", () => {
    const reachable = new Set(reachableHistoryKeys(library));
    for (const [endingId, keys] of Object.entries(FALSE_AFTER)) {
      const ends = library.content.cards.flatMap((card) => (["left", "right"] as const).filter((side) => card[side].ending === endingId).map((side) => ({ card, side })));
      expect(ends.length, endingId).toBeGreaterThan(0);
      for (const key of keys) {
        const [flag, band, seen] = key.split(":");
        expect(HISTORIES[flag!], key).toBeTruthy();
        expect(band, key).toBe("ascent");
        expect(reachable.has(key), key).toBe(true);
        // A party that can play the ending's card, and a card that sets the legacy without ending the run.
        expect(ends.some(({ card }) => card.align === "any" || card.align === seen), key).toBe(true);
        const elsewhere = library.content.cards.some((card) => (["left", "right"] as const).some((side) => card[side].setFlags?.includes(flag!) && !card[side].ending));
        expect(elsewhere, key).toBe(true);
      }
    }
  });
});
