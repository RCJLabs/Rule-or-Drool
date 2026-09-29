import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { ALL_HISTORY_KEYS, CONSEQUENCES_SHOWN, HISTORIES, HISTORY_ORDER, LAST_ACTS, UNNAMED, historyOf, reachableHistoryKeys } from "../../src/meta/histories";
import { HEADLINE_LEGACIES } from "../../src/ui/paper";

/**
 * What a reckoning leaves in history (BACKLOG-13 phase 92). The sale renames a reign whose great
 * work it sold, and the decree one whose answer to a question it put beyond reach; sealed files are
 * told first in what became of it, and never name a reign.
 */

const finale = (flags: string[]): GameState => ({
  ...newRun(library, 1, { align: "left" }),
  cardCount: 105,
  era: 3,
  over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" },
  flags,
});
const rank = (f: string) => HISTORY_ORDER.indexOf(f);

describe("a reckoning in history", () => {
  it("renames a reign that sold what the state owned, and one that put its answer beyond the chamber's reach", () => {
    expect(historyOf(finale(["ring_started", "sold_off"]), "muddle").signature).toBe("sold_off");
    expect(historyOf(finale(["stayed_out", "put_beyond_reach"]), "muddle").signature).toBe("put_beyond_reach");
    // Each ranks just above what its card is written for, so it renames every reign that takes it.
    const sale = library.reckonings.find((c) => c.id === "rk_sale")!;
    const decree = library.reckonings.find((c) => c.id === "rk_decree")!;
    expect(Math.min(...sale.reckons!.map(rank))).toBe(rank("sold_off") + 1);
    expect(Math.min(...decree.reckons!.map(rank))).toBe(rank("put_beyond_reach") + 1);
  });

  it("tells sealed files first in what became of a reign, and never names it for them", () => {
    const h = historyOf(finale(["stayed_out", "files_sealed"]), "decay");
    expect(h.signature).toBe("stayed_out");
    expect(h.consequences[0]).toMatchObject({ flag: "files_sealed", after: HISTORIES.files_sealed!.after.decay });
    expect(UNNAMED.has("files_sealed")).toBe(true);
    expect(HISTORIES.files_sealed!.titles).toBeUndefined();
    // So the codex counts no name for them, and every name it counts can be given.
    expect(ALL_HISTORY_KEYS.some((k) => k.startsWith("files_sealed:"))).toBe(false);
    expect(reachableHistoryKeys(library).some((k) => k.startsWith("files_sealed:"))).toBe(false);
    expect(reachableHistoryKeys(library)).toContain("sold_off:decay:left");
    expect(reachableHistoryKeys(library)).toContain("put_beyond_reach:ascent:long");
  });

  it("rank below the great works and the powers seized, which keep a reign's name", () => {
    expect(historyOf(finale(["long_ship", "sold_off"]), "ascent").signature).toBe("long_ship");
    expect(historyOf(finale(["elections_abolished", "put_beyond_reach"]), "ascent").signature).toBe("elections_abolished");
  });

  it("tells what a reign did last besides the decisions history follows up on, and pushes none of them out", () => {
    // Every legacy a reckoning leaves is a last act.
    const left = library.reckonings.flatMap((c) => [...(c.left.setFlags ?? []), ...(c.right.setFlags ?? [])]);
    expect([...LAST_ACTS].sort()).toEqual([...new Set(left)].sort());
    // Decisions enough to fill the end screen, each ranked below every last act.
    const decisions = HISTORY_ORDER.slice(Math.max(...[...LAST_ACTS].map(rank)) + 1)
      .filter((f) => !LAST_ACTS.has(f))
      .slice(0, CONSEQUENCES_SHOWN);
    for (const act of LAST_ACTS) {
      const followed = historyOf(finale([...decisions, act]), "muddle").consequences.map((c) => c.flag);
      expect(followed).toEqual([act, ...decisions]);
    }
  });

  it("gives each a headline in every paper, the files as well", () => {
    for (const f of ["sold_off", "put_beyond_reach", "files_sealed"]) expect(HEADLINE_LEGACIES).toContain(f);
  });
});
