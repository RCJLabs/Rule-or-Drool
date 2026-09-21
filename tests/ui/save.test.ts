// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import { RUN_SAVE_VERSION } from "../../src/version";
import { EMPTY_STATS } from "../../src/engine/types";
import { clearRun, hintSeen, loadRun, markHintSeen, migrateRun, saveRun } from "../../src/ui/save";

describe("save", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a run", () => {
    const s = newRun(library, 42, { align: "right" });
    saveRun(s);
    expect(loadRun()).toEqual(s);
    clearRun();
    expect(loadRun()).toBeNull();
  });

  it("migrates a version 1 save forward instead of discarding it", () => {
    const s = newRun(library, 8, { align: "left" });
    const { stats: _stats, unlocked: _unlocked, ...v1 } = s;
    localStorage.setItem("rod.run", JSON.stringify({ v: 1, state: { ...v1, cardCount: 12 } }));
    const loaded = loadRun();
    expect(loaded).not.toBeNull();
    expect(loaded!.cardCount).toBe(12);
    expect(loaded!.stats).toEqual(EMPTY_STATS);
    expect(loaded!.unlocked).toEqual([]);
  });

  it("migrateRun refuses versions it does not know", () => {
    const s = newRun(library, 1, { align: "left" });
    expect(migrateRun(RUN_SAVE_VERSION + 1, s)).toBeNull();
    expect(migrateRun(0, s)).toBeNull();
    expect(migrateRun(RUN_SAVE_VERSION, s)).toEqual(s);
  });

  it("rejects other versions and junk", () => {
    localStorage.setItem("rod.run", JSON.stringify({ v: RUN_SAVE_VERSION + 1, state: newRun(library, 1, { align: "left" }) }));
    expect(loadRun()).toBeNull();
    localStorage.setItem("rod.run", "{not json");
    expect(loadRun()).toBeNull();
    localStorage.setItem("rod.run", JSON.stringify({ v: RUN_SAVE_VERSION, state: { seed: "x" } }));
    expect(loadRun()).toBeNull();
  });

  it("remembers the hint", () => {
    expect(hintSeen()).toBe(false);
    markHintSeen();
    expect(hintSeen()).toBe(true);
  });
});
