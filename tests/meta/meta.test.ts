import { beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { EMPTY_STATS } from "../../src/engine/types";
import {
  OBJECTIVES,
  allUnlockTokens,
  codexProgress,
  dailySeed,
  dailySeedFor,
  emptyMeta,
  foldRun,
  migrateMeta,
  todayKey,
} from "../../src/meta";
import { META_SAVE_VERSION } from "../../src/version";

/** A finished run with whatever stats a test needs. */
function finished(over: { endingId: string; epilogueKey: string }, patch: Partial<GameState> = {}): GameState {
  const base = newRun(library, 1, { align: "left" });
  return { ...base, cardCount: 40, over, ...patch };
}

describe("daily seed", () => {
  it("is one seed per UTC day, stable and different across days", () => {
    expect(todayKey(new Date("2026-09-21T23:59:00Z"))).toBe("2026-09-21");
    expect(todayKey(new Date("2026-09-22T00:01:00Z"))).toBe("2026-09-22");
    expect(dailySeed("2026-09-21")).toBe(dailySeed("2026-09-21"));
    expect(dailySeed("2026-09-21")).not.toBe(dailySeed("2026-09-22"));
    expect(dailySeed("2026-09-21")).toBeGreaterThanOrEqual(0);
    const d = dailySeedFor(new Date("2026-09-21T10:00:00Z"));
    expect(d).toEqual({ day: "2026-09-21", seed: dailySeed("2026-09-21") });
  });
});

describe("foldRun", () => {
  it("records the ending, the epilogue and the run, once each", () => {
    const run = finished({ endingId: "riots", epilogueKey: "decay:any:1" });
    const first = foldRun(library, emptyMeta(), run);
    expect(first.newEnding).toBe(true);
    expect(first.meta.runs).toBe(1);
    expect(first.meta.endings.riots).toBe(1);
    expect(first.meta.epilogues).toEqual(["decay:any:1"]);
    expect(first.meta.bestCards).toBe(40);
    expect(first.meta.alignsPlayed).toEqual(["left"]);

    const second = foldRun(library, first.meta, run);
    expect(second.newEnding).toBe(false);
    expect(second.meta.endings.riots).toBe(2);
    expect(second.meta.epilogues).toEqual(["decay:any:1"]);
  });

  it("ignores a run that has not ended", () => {
    const meta = emptyMeta();
    const open = { ...finished({ endingId: "riots", epilogueKey: "decay:any:1" }), over: null };
    expect(foldRun(library, meta, open).meta).toBe(meta);
  });

  it("completes objectives once and grants their unlocks", () => {
    const run = finished(
      { endingId: "finale_ascent", epilogueKey: "ascent:any:3" },
      { drift: 60, stats: { ...EMPTY_STATS, electionsHonest: 3, honest: 40 } },
    );
    const first = foldRun(library, emptyMeta(), run);
    expect(first.newObjectives).toContain("obj_first_run");
    expect(first.newObjectives).toContain("obj_three_honest");
    expect(first.newObjectives).toContain("obj_reach_ascent");
    expect(first.newObjectives).toContain("obj_orbit_clean");
    expect(first.newObjectives).toContain("obj_saint");
    expect(first.newUnlocks).toEqual(expect.arrayContaining(["u_referendum", "u_engineer", "u_survivor"]));

    // A second identical run earns nothing new.
    const second = foldRun(library, first.meta, run);
    expect(second.newObjectives).toEqual([]);
    expect(second.newUnlocks).toEqual([]);
    expect(Object.keys(second.meta.objectives).length).toBe(Object.keys(first.meta.objectives).length);
  });

  it("does not credit a cheated election toward the clean-elections objective", () => {
    const run = finished(
      { endingId: "riots", epilogueKey: "decay:any:1" },
      { stats: { ...EMPTY_STATS, electionsHonest: 3, electionsCheated: 1, tempting: 5 } },
    );
    const fold = foldRun(library, emptyMeta(), run);
    expect(fold.newObjectives).toContain("obj_honest_election");
    expect(fold.newObjectives).not.toContain("obj_three_honest");
    expect(fold.newObjectives).not.toContain("obj_saint");
  });

  it("completes the cross-run objectives only once both sides have played", () => {
    const left = finished({ endingId: "riots", epilogueKey: "decay:any:1" });
    const right = { ...finished({ endingId: "coup", epilogueKey: "decay:any:1" }), align: "right" as const };
    const one = foldRun(library, emptyMeta(), left);
    expect(one.newObjectives).not.toContain("obj_both_sides");
    const two = foldRun(library, one.meta, right);
    expect(two.newObjectives).toContain("obj_both_sides");
    expect(two.meta.alignsPlayed.sort()).toEqual(["left", "right"]);
  });

  it("records a daily result only when the run was a daily one", () => {
    const run = finished({ endingId: "riots", epilogueKey: "decay:any:1" });
    expect(foldRun(library, emptyMeta(), run).meta.daily).toBeNull();
    const daily = foldRun(library, emptyMeta(), run, { day: "2026-09-21", seed: 42 }).meta.daily;
    expect(daily).toMatchObject({ day: "2026-09-21", seed: 42, cards: 40, endingId: "riots" });
  });
});

describe("objectives and unlocks", () => {
  it("has unique ids and grants only tokens the content requires", () => {
    const ids = OBJECTIVES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    const tokens = allUnlockTokens();
    const required = new Set(
      [...library.content.modifiers.map((m) => m.requires), ...library.content.arcs.map((a) => a.requires)].filter(Boolean),
    );
    for (const t of tokens) expect([...required], t).toContain(t);
    for (const r of required) expect(tokens, String(r)).toContain(r);
  });

  it("keeps locked content out of a fresh run and lets it in once unlocked", () => {
    const locked = rollSetup(library, 7, "left", []);
    const gated = new Set(library.content.modifiers.filter((m) => m.requires).map((m) => m.id));
    for (const id of locked.modifiers ?? []) expect(gated.has(id)).toBe(false);

    // With every token in hand the gated pool is reachable at all.
    const anyGated = [...Array(200).keys()].some((i) =>
      (rollSetup(library, i, "left", allUnlockTokens()).modifiers ?? []).some((id) => gated.has(id)),
    );
    expect(anyGated).toBe(true);
  });
});

describe("meta save", () => {
  beforeEach(() => emptyMeta());

  it("round-trips and fills in missing fields", () => {
    const m = emptyMeta();
    expect(migrateMeta(JSON.parse(JSON.stringify(m)))).toEqual(m);
    const sparse = migrateMeta({ v: 1, runs: 3 });
    expect(sparse).toMatchObject({ v: META_SAVE_VERSION, runs: 3, endings: {}, unlocks: [], daily: null });
  });

  it("refuses junk and versions from the future", () => {
    expect(migrateMeta(null)).toBeNull();
    expect(migrateMeta({})).toBeNull();
    expect(migrateMeta({ v: META_SAVE_VERSION + 1 })).toBeNull();
  });
});

describe("codexProgress", () => {
  it("counts against the real content totals", () => {
    const p = codexProgress(library, emptyMeta());
    expect(p).toMatchObject({ endingsSeen: 0, objectivesDone: 0, objectivesTotal: OBJECTIVES.length });
    expect(p.endingsTotal).toBe(library.endings.size);
    expect(p.epiloguesTotal).toBeGreaterThan(0);

    const fold = foldRun(library, emptyMeta(), finished({ endingId: "riots", epilogueKey: "decay:any:1" }));
    const after = codexProgress(library, fold.meta);
    expect(after.endingsSeen).toBe(1);
    expect(after.epiloguesSeen).toBe(1);
    expect(after.objectivesDone).toBeGreaterThan(0);
  });
});
