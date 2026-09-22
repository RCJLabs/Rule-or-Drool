import { beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { EMPTY_STATS } from "../../src/engine/types";
import {
  HISTORY_LENGTH,
  LEGACIES,
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
import { findEpilogue, epilogueKey } from "../../src/engine/endings";
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
    const run = finished({ endingId: "riots", epilogueKey: "decay:left:1" });
    const first = foldRun(library, emptyMeta(), run);
    expect(first.newEnding).toBe(true);
    expect(first.meta.runs).toBe(1);
    expect(first.meta.endings.riots).toBe(1);
    expect(first.meta.epilogues).toEqual(["decay:left:1"]);
    expect(first.meta.bestCards).toBe(40);
    expect(first.meta.alignsPlayed).toEqual(["left"]);

    const second = foldRun(library, first.meta, run);
    expect(second.newEnding).toBe(false);
    expect(second.meta.endings.riots).toBe(2);
    expect(second.meta.epilogues).toEqual(["decay:left:1"]);
  });

  it("ignores a run that has not ended", () => {
    const meta = emptyMeta();
    const open = { ...finished({ endingId: "riots", epilogueKey: "decay:left:1" }), over: null };
    expect(foldRun(library, meta, open).meta).toBe(meta);
  });

  it("completes objectives once and grants their unlocks", () => {
    const run = finished(
      { endingId: "finale_ascent", epilogueKey: "ascent:left:3" },
      { drift: 60, stats: { ...EMPTY_STATS, electionsHonest: 3, honest: 40 } },
    );
    const first = foldRun(library, emptyMeta(), run);
    expect(first.newObjectives).toContain("obj_first_run");
    expect(first.newObjectives).toContain("obj_three_honest");
    expect(first.newObjectives).toContain("obj_reach_ascent");
    expect(first.newObjectives).toContain("obj_orbit_clean");
    expect(first.newObjectives).toContain("obj_saint");
    expect(first.newUnlocks).toEqual(expect.arrayContaining(["u_referendum", "u_engineer"]));
    // Survival is no longer something one good run proves (BACKLOG item 9).
    expect(first.newUnlocks).not.toContain("u_survivor");

    // A second identical run earns nothing new.
    const second = foldRun(library, first.meta, run);
    expect(second.newObjectives).toEqual([]);
    expect(second.newUnlocks).toEqual([]);
    expect(Object.keys(second.meta.objectives).length).toBe(Object.keys(first.meta.objectives).length);
  });

  it("does not credit a cheated election toward the clean-elections objective", () => {
    const run = finished(
      { endingId: "riots", epilogueKey: "decay:left:1" },
      { stats: { ...EMPTY_STATS, electionsHonest: 3, electionsCheated: 1, tempting: 5 } },
    );
    const fold = foldRun(library, emptyMeta(), run);
    expect(fold.newObjectives).toContain("obj_honest_election");
    expect(fold.newObjectives).not.toContain("obj_three_honest");
    expect(fold.newObjectives).not.toContain("obj_saint");
  });

  it("earns every unlock from a plausible run of play", () => {
    // BACKLOG item 9: u_truth used to sit behind "discover ten endings", which a player who
    // keeps surviving never reaches, because most endings require losing a specific way.
    // No unlock may need anything more exotic than finishing runs on both sides, in each
    // band, with some clean elections.
    const bands = [
      { band: "decay", endingId: "finale_decay" },
      { band: "muddle", endingId: "finale_muddle" },
      { band: "ascent", endingId: "finale_ascent" },
    ] as const;
    let meta = emptyMeta();
    for (let i = 0; i < 10; i++) {
      const { band, endingId } = bands[i % bands.length]!;
      const align = i % 2 ? ("right" as const) : ("left" as const);
      meta = foldRun(
        library,
        meta,
        finished(
          { endingId, epilogueKey: `${band}:${align}:3` },
          { align, drift: band === "ascent" ? 60 : band === "decay" ? -60 : 0, stats: { ...EMPTY_STATS, electionsHonest: 3 } },
        ),
      ).meta;
    }
    expect([...meta.unlocks].sort()).toEqual(allUnlockTokens());
  });

  it("leaves the ending collection gating nothing", () => {
    // It stays as a long-tail goal, but a player who never loses on purpose must not be
    // locked out of content by it.
    const collectors = OBJECTIVES.filter((o) => o.id === "obj_ten_endings" || o.id === "obj_five_endings");
    expect(collectors.length).toBe(2);
    for (const o of collectors) expect(o.unlocks, o.id).toBeUndefined();
  });

  it("completes the cross-run objectives only once both sides have played", () => {
    const left = finished({ endingId: "riots", epilogueKey: "decay:left:1" });
    const right = { ...finished({ endingId: "coup", epilogueKey: "decay:left:1" }), align: "right" as const };
    const one = foldRun(library, emptyMeta(), left);
    expect(one.newObjectives).not.toContain("obj_both_sides");
    const two = foldRun(library, one.meta, right);
    expect(two.newObjectives).toContain("obj_both_sides");
    expect(two.meta.alignsPlayed.sort()).toEqual(["left", "right"]);
  });

  it("records a daily result only when the run was a daily one", () => {
    const run = finished({ endingId: "riots", epilogueKey: "decay:left:1" });
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

  it("gives a save from before the history existed empty collections, not undefined", () => {
    const v2 = migrateMeta({ v: 2, runs: 4, endings: { riots: 1 } })!;
    expect(v2.arcOutcomes).toEqual([]);
    expect(v2.legacies).toEqual({});
    expect(v2.advisorsKept).toEqual({});
    expect(v2.advisorsFired).toEqual({});
    expect(v2.history).toEqual([]);
    expect(v2.runs).toBe(4);
    expect(v2.v).toBe(META_SAVE_VERSION);
  });

  it("drops the shared epilogue keys a v1 save collected", () => {
    // Epilogues became side-specific in BACKLOG item 3, so a `band:any:era` key names a
    // text that no longer ships. Keeping it would inflate the codex past what is reachable.
    const v1 = migrateMeta({ v: 1, epilogues: ["decay:any:1", "ascent:left:2"] });
    expect(v1!.epilogues).toEqual(["ascent:left:2"]);
    expect(v1!.v).toBe(META_SAVE_VERSION);

    const current = migrateMeta({ v: META_SAVE_VERSION, epilogues: ["decay:left:1"] });
    expect(current!.epilogues).toEqual(["decay:left:1"]);
  });

  it("keeps the codex completable: every epilogue key can still be collected", () => {
    const reachable = new Set<string>();
    for (const band of ["decay", "muddle", "ascent"] as const) {
      for (const align of ["left", "right"] as const) {
        for (let era = 1; era <= library.config.eraCount; era++) {
          const e = findEpilogue(library, band, align, era);
          if (e) reachable.add(epilogueKey(e));
        }
      }
    }
    expect(reachable.size).toBe(codexProgress(library, emptyMeta()).epiloguesTotal);
  });
});

describe("codexProgress", () => {
  it("counts against the real content totals", () => {
    const p = codexProgress(library, emptyMeta());
    expect(p).toMatchObject({ endingsSeen: 0, objectivesDone: 0, objectivesTotal: OBJECTIVES.length });
    expect(p.endingsTotal).toBe(library.endings.size);
    expect(p.epiloguesTotal).toBeGreaterThan(0);

    const fold = foldRun(library, emptyMeta(), finished({ endingId: "riots", epilogueKey: "decay:left:1" }));
    const after = codexProgress(library, fold.meta);
    expect(after.endingsSeen).toBe(1);
    expect(after.epiloguesSeen).toBe(1);
    expect(after.objectivesDone).toBeGreaterThan(0);
  });
});

describe("the codex as a history", () => {
  const withHistory = (patch: Partial<GameState> = {}) =>
    finished(
      { endingId: "finale_muddle", epilogueKey: "muddle:left:3" },
      {
        flags: ["elections_abolished", "housing_built", "east_talks", "advisor_loyal"],
        cabinet: { chief: "c_a", rival: "adv_wrenne" },
        stats: { ...EMPTY_STATS, firedAdvisors: ["c_b", "c_b"], arcOutcomes: ["arc_su3:left"] },
        ...patch,
      },
    );

  it("records what the country was left with, and not the bookkeeping", () => {
    const fold = foldRun(library, emptyMeta(), withHistory());
    expect(fold.meta.legacies).toEqual({ elections_abolished: 1, housing_built: 1 });
    // east_talks is an arc's scratch flag and advisor_loyal is setup; neither is a legacy.
    expect(fold.meta.legacies.east_talks).toBeUndefined();
    expect(fold.meta.legacies.advisor_loyal).toBeUndefined();
  });

  it("records the branch of a story that was actually taken", () => {
    const fold = foldRun(library, emptyMeta(), withHistory());
    expect(fold.meta.arcOutcomes).toEqual(["arc_su3:left"]);
    // Twice through the same branch is still one outcome.
    const again = foldRun(library, fold.meta, withHistory());
    expect(again.meta.arcOutcomes).toEqual(["arc_su3:left"]);
  });

  it("counts who stayed and who was let go, and never counts the rival as kept", () => {
    const fold = foldRun(library, emptyMeta(), withHistory());
    expect(fold.meta.advisorsKept).toEqual({ c_a: 1 });
    expect(fold.meta.advisorsKept.adv_wrenne).toBeUndefined();
    expect(fold.meta.advisorsFired).toEqual({ c_b: 2 });
  });

  it("keeps a bounded history, newest first", () => {
    let meta = emptyMeta();
    for (let i = 0; i < HISTORY_LENGTH + 4; i++) {
      meta = foldRun(library, meta, withHistory({ cardCount: 10 + i })).meta;
    }
    expect(meta.history.length).toBe(HISTORY_LENGTH);
    expect(meta.history[0]!.cards).toBe(10 + HISTORY_LENGTH + 3);
    expect(meta.history[0]!.rival).toBe("adv_wrenne");
    expect(meta.history[0]!.legacies).toEqual(["elections_abolished", "housing_built"]);
  });

  it("counts stories against what the content actually offers", () => {
    const p = codexProgress(library, emptyMeta());
    expect(p.storiesTotal).toBeGreaterThan(p.endingsTotal);
    expect(p.legaciesTotal).toBe(Object.keys(LEGACIES).length);
    expect(p.storiesSeen).toBe(0);
  });
});
