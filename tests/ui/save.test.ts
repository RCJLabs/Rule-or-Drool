// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import { RUN_SAVE_VERSION } from "../../src/version";
import { EMPTY_STATS, type GameState } from "../../src/engine/types";
import { DEFAULT_CONFIG } from "../../src/engine/config";
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

  it("splits a pre-blocs save's Mood across the three coalition blocs", () => {
    const s = newRun(library, 8, { align: "left" });
    const legacy = { ...s, meters: { mood: 37, money: 61, order: 44, inst: 52 } };
    localStorage.setItem("rod.run", JSON.stringify({ v: 2, state: legacy }));
    const loaded = loadRun();
    expect(loaded).not.toBeNull();
    expect(loaded!.meters).toEqual({ base: 37, backers: 37, public: 37, money: 61, order: 44, inst: 52 });
    expect("mood" in loaded!.meters).toBe(false);
  });

  it("brings a v10 run forward as an ordinary one, and the first road a second road holds", () => {
    const { eraCount: _drop, ...v10 } = newRun(library, 3, { align: "left" });
    const first = { ...v10, cardCount: 105 };
    const s = migrateRun(10, { ...v10, road: { first, at: 12 } } as never)!;
    expect(s.eraCount).toBe(DEFAULT_CONFIG.eraCount);
    expect(s.road!.first.eraCount).toBe(DEFAULT_CONFIG.eraCount);
    expect(migrateRun(10, v10 as never)!.eraCount).toBe(DEFAULT_CONFIG.eraCount);
  });

  it("brings a v11 run forward in the look its drift implies, and the first road a second road holds", () => {
    // Before BACKLOG-7 phase 45 the look was drift's alone, so that is the look it was showing.
    const { look: _drop, ...v11 } = { ...newRun(library, 3, { align: "left" }), drift: -21 };
    const first = { ...v11, drift: 9, cardCount: 105 };
    const s = migrateRun(11, { ...v11, road: { first, at: 12 } } as never)!;
    expect(s.look).toBe(-2);
    expect(s.road!.first.look).toBe(1);
    expect(migrateRun(11, { ...v11, drift: 3 } as never)!.look).toBe(0);
    // A current save keeps the look it has, even one held past its drift.
    const held = { ...newRun(library, 3, { align: "left" }), drift: 5, look: 1 };
    expect(migrateRun(RUN_SAVE_VERSION, held)!.look).toBe(1);
    saveRun(held);
    expect(loadRun()!.look).toBe(1);
  });

  it("keeps a long reign long across a save", () => {
    const s = newRun(library, 42, { align: "right", eraCount: DEFAULT_CONFIG.longEraCount });
    saveRun(s);
    expect(loadRun()!.eraCount).toBe(DEFAULT_CONFIG.longEraCount);
  });

  it("brings a v8 run forward with its flags undated rather than dated wrongly", () => {
    // Dating every flag a run already had to card 0 would put them at the start of a
    // timeline they did not happen at the start of.
    const { flagSince: _drop, ...v8 } = newRun(library, 3, { align: "left" });
    const s = migrateRun(8, { ...v8, flags: ["seawall"] } as never)!;
    expect(s.flagSince).toEqual({});
    expect(s.flags).toContain("seawall");
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

describe("run save: the rival", () => {
  it("gives a run saved before the rival existed one to face", () => {
    const { rivalStanding: _gone, ...v3 } = newRun(library, 3, { align: "left" });
    const migrated = migrateRun(3, v3 as GameState)!;
    expect(migrated.rivalStanding).toBe(DEFAULT_CONFIG.rivalStart);
    // A current save is left as it is.
    const current = { ...newRun(library, 3, { align: "left" }), rivalStanding: 77 };
    expect(migrateRun(RUN_SAVE_VERSION, current)!.rivalStanding).toBe(77);
  });
});

describe("run save: the record a run keeps of itself", () => {
  it("starts one for a run saved before the codex kept a history", () => {
    const { stats: _gone, ...v4 } = newRun(library, 4, { align: "left" });
    const migrated = migrateRun(4, { ...v4, stats: { ...EMPTY_STATS, firedAdvisors: undefined, arcOutcomes: undefined } } as unknown as GameState)!;
    expect(migrated.stats.firedAdvisors).toEqual([]);
    expect(migrated.stats.arcOutcomes).toEqual([]);
  });
});

describe("run save: how long the cabinet has served", () => {
  it("credits a run saved before tenure was tracked from where it is", () => {
    const { cabinetSince: _gone, ...v5 } = newRun(library, 11, { align: "right" });
    const migrated = migrateRun(5, v5 as GameState)!;
    expect(Object.keys(migrated.cabinetSince).sort()).toEqual(Object.keys(v5.cabinet).sort());
    for (const role of Object.keys(migrated.cabinetSince)) expect(migrated.cabinetSince[role]).toBe(0);
  });
});

describe("run save: why the card on the table is there", () => {
  it("leaves a run saved before the draw recorded it unmarked, rather than guessing", () => {
    // Guessing from `weight === 0` would be right on shipped content and wrong on the one
    // thing this replaced it for: a habit card is weight 4 (BACKLOG-3 phase 19).
    const { currentFrom: _gone, ...v7 } = newRun(library, 12, { align: "left" });
    const migrated = migrateRun(7, v7 as GameState)!;
    expect(migrated.currentFrom).toBeNull();
  });
});
