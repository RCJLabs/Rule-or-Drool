import { beforeEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { EMPTY_STATS } from "../../src/engine/types";
import {
  ALL_HISTORY_KEYS,
  FIRST_DAILY,
  HISTORY_LENGTH,
  LEGACIES,
  OBJECTIVES,
  allUnlockTokens,
  codexProgress,
  dailyNumber,
  dailySeed,
  dailySeedFor,
  dayIndex,
  dayKey,
  daysOfMonth,
  emptyMeta,
  foldRun,
  longReignOpen,
  migrateMeta,
  shiftMonth,
  streakOf,
  todayKey,
  weekdayOf,
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

  it("credits a win, not a vote left to the count and lost (BACKLOG-11 phase 66)", () => {
    // Lost the count that sent it out, and never won one: nothing clean to its name.
    const out = finished({ endingId: "finale_muddle", epilogueKey: "muddle:left:3" }, { stats: { ...EMPTY_STATS, electionsHonest: 1, electionsLost: 1 } });
    expect(foldRun(library, emptyMeta(), out).newObjectives).not.toContain("obj_honest_election");
    // Three honest votes, one of them lost, is two clean votes.
    const two = finished({ endingId: "finale_muddle", epilogueKey: "muddle:left:3" }, { stats: { ...EMPTY_STATS, electionsHonest: 3, electionsLost: 1 } });
    const fold = foldRun(library, emptyMeta(), two);
    expect(fold.newObjectives).toContain("obj_honest_election");
    expect(fold.newObjectives).not.toContain("obj_three_honest");
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

  it("logs a daily only when the run was that day's daily, once a day, the first kept", () => {
    const run = finished({ endingId: "riots", epilogueKey: "decay:left:1" });
    expect(foldRun(library, emptyMeta(), run).meta.dailies).toEqual([]);
    // A run dealt from another seed is not that day's daily, whatever it was started as.
    expect(foldRun(library, emptyMeta(), run, { day: "2026-09-21", seed: run.seed + 1 }).daily).toBeNull();
    const one = foldRun(library, emptyMeta(), run, { day: "2026-09-21", seed: run.seed });
    // It keeps the deck the day's run was dealt from (BACKLOG-8 phase 49).
    expect(one.daily).toEqual({ day: "2026-09-21", history: one.history!.key, ending: "riots", cards: 40, deck: run.deck });
    expect(one.meta.dailies).toEqual([one.daily]);
    const again = foldRun(library, one.meta, { ...run, cardCount: 90 }, { day: "2026-09-21", seed: run.seed });
    expect(again.daily).toBeNull();
    expect(again.meta.dailies).toEqual(one.meta.dailies);
    // A daily left and finished after a later one goes in its own place.
    const earlier = foldRun(library, one.meta, run, { day: "2026-09-19", seed: run.seed });
    expect(earlier.meta.dailies.map((d) => d.day)).toEqual(["2026-09-19", "2026-09-21"]);
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

describe("the long reign (BACKLOG-5 phase 39)", () => {
  const long = (endingId: string, era = 5) =>
    finished({ endingId, epilogueKey: `muddle:left:${era}` }, { eraCount: library.config.longEraCount, era, cardCount: era * library.config.eraLength });

  it("is opened by the first finale, and by nothing short of one", () => {
    expect(longReignOpen(emptyMeta())).toBe(false);
    const ousted = foldRun(library, emptyMeta(), finished({ endingId: "riots", epilogueKey: "decay:left:2" }));
    expect(longReignOpen(ousted.meta)).toBe(false);
    const finale = foldRun(library, ousted.meta, finished({ endingId: "finale_muddle", epilogueKey: "muddle:left:3" }));
    expect(finale.newObjectives).toContain("obj_finale");
    expect(longReignOpen(finale.meta)).toBe(true);
    // It is a way to play, not content: it is no unlock token, so no run's code carries it.
    expect(finale.newUnlocks).toEqual([]);
    expect(finale.meta.unlocks).toEqual([]);
  });

  it("counts a long finale as a finale, and the long view as its own", () => {
    const fold = foldRun(library, emptyMeta(), long("finale_long_decay"));
    expect(fold.newObjectives).toEqual(expect.arrayContaining(["obj_finale", "obj_decay_finale", "obj_long_reign"]));
    const clean = foldRun(library, emptyMeta(), long("finale_long_ascent"));
    expect(clean.newObjectives).toContain("obj_orbit_clean");
    // An ordinary finale is not the end of a long reign, and a long reign ousted is not either.
    expect(foldRun(library, emptyMeta(), finished({ endingId: "finale_decay", epilogueKey: "decay:left:3" })).newObjectives).not.toContain("obj_long_reign");
    expect(foldRun(library, emptyMeta(), long("riots", 4)).newObjectives).not.toContain("obj_long_reign");
  });
});

describe("meta save", () => {
  beforeEach(() => emptyMeta());

  it("round-trips and fills in missing fields", () => {
    const m = emptyMeta();
    expect(migrateMeta(JSON.parse(JSON.stringify(m)))).toEqual(m);
    const sparse = migrateMeta({ v: 1, runs: 3 });
    expect(sparse).toMatchObject({ v: META_SAVE_VERSION, runs: 3, endings: {}, unlocks: [], dailies: [] });
  });

  it("brings the one daily a v5 profile kept into the log, and leaves out what is not a day", () => {
    const v5 = migrateMeta({ v: 5, runs: 2, daily: { day: "2026-09-22", seed: 9, cards: 61, endingId: "riots", band: "decay" } })!;
    expect(v5.dailies).toEqual([{ day: "2026-09-22", history: null, ending: "riots", cards: 61 }]);
    expect("daily" in v5).toBe(false);
    // A profile can arrive in a link anyone can send (phase 33).
    const junk = migrateMeta({
      v: 6,
      dailies: [
        null,
        3,
        { day: "2026-02-30", ending: "riots", cards: 1 },
        { day: "yesterday", ending: "riots", cards: 1 },
        { day: "2026-09-20", ending: 5, cards: 1 },
        { day: "2026-09-23", history: "x", ending: "riots", cards: 12 },
        { day: "2026-09-21", history: 7, ending: "coup", cards: 30 },
        { day: "2026-09-23", history: null, ending: "coup", cards: 99 },
      ],
    })!;
    expect(junk.dailies).toEqual([
      { day: "2026-09-21", history: null, ending: "coup", cards: 30 },
      { day: "2026-09-23", history: "x", ending: "riots", cards: 12 },
    ]);
    expect(migrateMeta({ v: 6, dailies: "lots" })!.dailies).toEqual([]);
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
        // A long reign's two eras too (BACKLOG-5 phase 39).
        for (let era = 1; era <= library.config.longEraCount; era++) {
          const e = findEpilogue(library, band, align, era);
          if (e) reachable.add(epilogueKey(e));
        }
      }
    }
    expect(reachable.size).toBe(codexProgress(library, emptyMeta()).epiloguesTotal);
  });
});

describe("mandate saves come forward", () => {
  it("gives a save from before promises the empty tallies and a history that promised nothing", () => {
    const old = {
      v: 3,
      runs: 2,
      endings: { riots: 1 },
      history: [{ align: "left", cards: 40, era: 2, endingId: "riots", band: "decay", rival: null, legacies: [] }],
    };
    const meta = migrateMeta(old)!;
    expect(meta.v).toBe(META_SAVE_VERSION);
    expect(meta.mandatesKept).toEqual({});
    expect(meta.mandatesBroken).toEqual({});
    expect(meta.history[0]!.mandates).toEqual([]);
    expect(meta.history[0]).not.toHaveProperty("mandate");
  });

  it("brings a v7 history's one promise forward as a list of one (BACKLOG-10 phase 62)", () => {
    const run = { align: "left", cards: 90, era: 3, endingId: "finale_muddle", band: "muddle", rival: null, legacies: [], history: null };
    const old = {
      ...emptyMeta(),
      v: 7,
      history: [
        { ...run, mandate: "m_broad", mandateKept: true },
        { ...run, mandate: "m_loyal", mandateKept: false },
        { ...run, mandate: null, mandateKept: false },
      ],
    };
    const meta = migrateMeta(old)!;
    expect(meta.v).toBe(META_SAVE_VERSION);
    expect(meta.history.map((r) => r.mandates)).toEqual([[{ id: "m_broad", kept: true }], [{ id: "m_loyal", kept: false }], []]);
    for (const r of meta.history) {
      expect(r).not.toHaveProperty("mandate");
      expect(r).not.toHaveProperty("mandateKept");
    }
    // And a v8 history is read as it was written.
    expect(migrateMeta(meta)).toEqual(meta);
  });
});

describe("codexProgress", () => {
  it("counts against the real content totals", () => {
    const p = codexProgress(library, emptyMeta());
    expect(p).toMatchObject({ endingsSeen: 0, objectivesDone: 0, objectivesTotal: OBJECTIVES.length });
    // Every ending but a first term's three (BACKLOG-10 phase 59).
    expect(p.endingsTotal).toBe(library.endings.size - 3);
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

  it("remembers the promise a run was taken on, and whether it survived it", () => {
    const kept = foldRun(library, emptyMeta(), withHistory({ mandates: ["m_broad"], mandatesBroken: {} }));
    expect(kept.meta.mandatesKept).toEqual({ m_broad: 1 });
    expect(kept.meta.mandatesBroken).toEqual({});
    expect(kept.meta.history[0]).toMatchObject({ mandates: [{ id: "m_broad", kept: true }] });

    const broken = foldRun(library, kept.meta, withHistory({ mandates: ["m_broad"], mandatesBroken: { m_broad: 31 } }));
    expect(broken.meta.mandatesKept).toEqual({ m_broad: 1 });
    expect(broken.meta.mandatesBroken).toEqual({ m_broad: 1 });
    expect(broken.meta.history[0]).toMatchObject({ mandates: [{ id: "m_broad", kept: false }] });

    // A run that promised nothing cannot have kept anything.
    const none = foldRun(library, emptyMeta(), withHistory());
    expect(none.meta.mandatesKept).toEqual({});
    expect(none.meta.history[0]).toMatchObject({ mandates: [] });
  });

  it("remembers each of a platform's two on its own (BACKLOG-10 phase 62)", () => {
    const fold = foldRun(library, emptyMeta(), withHistory({ mandates: ["m_broad", "m_loyal"], mandatesBroken: { m_loyal: 12 } }));
    expect(fold.meta.mandatesKept).toEqual({ m_broad: 1 });
    expect(fold.meta.mandatesBroken).toEqual({ m_loyal: 1 });
    expect(fold.meta.history[0]!.mandates).toEqual([
      { id: "m_broad", kept: true },
      { id: "m_loyal", kept: false },
    ]);
  });

  it("only counts the mandate objectives for a run that took one on, and kept every one it took", () => {
    const l = library;
    const plain = foldRun(l, emptyMeta(), withHistory());
    expect(plain.newObjectives).not.toContain("obj_mandate_kept");
    const kept = foldRun(l, emptyMeta(), withHistory({ mandates: ["m_loyal"], mandatesBroken: {} }));
    expect(kept.newObjectives).toContain("obj_mandate_kept");
    expect(kept.newObjectives).toContain("obj_mandate_finale");
    const broke = foldRun(l, emptyMeta(), withHistory({ mandates: ["m_loyal"], mandatesBroken: { m_loyal: 9 } }));
    expect(broke.newObjectives).not.toContain("obj_mandate_kept");
    // One of two broken is a promise broken, whatever became of the other.
    const half = foldRun(l, emptyMeta(), withHistory({ mandates: ["m_broad", "m_loyal"], mandatesBroken: { m_loyal: 9 } }));
    expect(half.newObjectives).not.toContain("obj_mandate_kept");
    expect(half.newObjectives).not.toContain("obj_mandate_finale");
    const both = foldRun(l, emptyMeta(), withHistory({ mandates: ["m_broad", "m_loyal"], mandatesBroken: {} }));
    expect(both.newObjectives).toContain("obj_mandate_kept");
  });

  it("counts any four promises kept toward the four", () => {
    const four = ["m_broad", "m_loyal", "m_clean", "m_decree"];
    const meta = { ...emptyMeta(), mandatesKept: Object.fromEntries(four.slice(0, 3).map((id) => [id, 1])) };
    expect(foldRun(library, meta, withHistory()).newObjectives).not.toContain("obj_mandate_all");
    const fourth = foldRun(library, meta, withHistory({ mandates: ["m_decree"], mandatesBroken: {} }));
    expect(fourth.newObjectives).toContain("obj_mandate_all");
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

  it("remembers what a run nearly was, but not what it was", () => {
    const run = finished(
      { endingId: "finale_muddle", epilogueKey: "muddle:left:3" },
      { meters: { base: 50, backers: 50, public: 50, money: 4, order: 50, inst: 50 } },
    );
    const fold = foldRun(library, emptyMeta(), run);
    expect(fold.meta.nearMissed).toContain("bankruptcy");
    // The ending it actually reached is a discovery, not a near miss.
    expect(fold.meta.nearMissed).not.toContain("finale_muddle");
  });

  it("counts stories against what the content actually offers", () => {
    const p = codexProgress(library, emptyMeta());
    expect(p.storiesTotal).toBeGreaterThan(p.endingsTotal);
    expect(p.legaciesTotal).toBe(Object.keys(LEGACIES).length);
    expect(p.storiesSeen).toBe(0);
  });
});

describe("the daily, day by day (BACKLOG-5 phase 38)", () => {
  const log = (...days: string[]) => days.map((day) => ({ day }));

  it("numbers each day from the first daily the game dealt", () => {
    expect(dailyNumber(FIRST_DAILY)).toBe(1);
    expect(dailyNumber("2026-09-23")).toBe(3);
    expect(dailyNumber("2027-09-21")).toBe(366);
    // No daily was dealt before the first, and a phone that has lost its clock says 1970.
    expect(dailyNumber("2026-09-20")).toBeNull();
    expect(dailyNumber("1970-01-01")).toBeNull();
    expect(dailyNumber("not a day")).toBeNull();
  });

  it("counts days in a row, alive through today while today's is still to play", () => {
    expect(streakOf([], "2026-09-23")).toEqual({ current: 0, best: 0 });
    expect(streakOf(log("2026-09-21", "2026-09-22", "2026-09-23"), "2026-09-23")).toEqual({ current: 3, best: 3 });
    expect(streakOf(log("2026-09-21", "2026-09-22"), "2026-09-23")).toEqual({ current: 2, best: 2 });
  });

  it("breaks the streak on a missed day", () => {
    expect(streakOf(log("2026-09-20", "2026-09-21"), "2026-09-23")).toEqual({ current: 0, best: 2 });
    expect(streakOf(log("2026-09-18", "2026-09-19", "2026-09-20", "2026-09-22", "2026-09-23"), "2026-09-23")).toEqual({ current: 2, best: 3 });
    expect(streakOf(log("2026-09-18", "2026-09-19", "2026-09-20", "2026-09-22"), "2026-09-23")).toEqual({ current: 1, best: 3 });
  });

  it("runs on across months, years and a leap day", () => {
    expect(streakOf(log("2026-09-30", "2026-10-01"), "2026-10-01").current).toBe(2);
    expect(streakOf(log("2026-12-31", "2027-01-01"), "2027-01-01").current).toBe(2);
    expect(streakOf(log("2028-02-28", "2028-02-29", "2028-03-01"), "2028-03-01").current).toBe(3);
    expect(streakOf(log("2027-02-28", "2027-03-01"), "2027-03-01").current).toBe(2);
  });

  it("lays a month out in weeks from a Monday", () => {
    expect(daysOfMonth("2026-09")).toHaveLength(30);
    expect(daysOfMonth("2028-02")).toHaveLength(29);
    expect(daysOfMonth("2026-09")[0]).toBe("2026-09-01");
    expect(weekdayOf("2026-09-21")).toBe(0);
    expect(weekdayOf("2026-09-27")).toBe(6);
    expect(weekdayOf("2026-09-01")).toBe(1);
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(dayIndex("2026-02-30")).toBeNaN();
    expect(dayKey(dayIndex("2028-02-29"))).toBe("2028-02-29");
  });

  it("keeps a year of dailies under 40 KB", () => {
    // Every day of a leap year, each carrying the longest history and ending the log can hold.
    const history = ALL_HISTORY_KEYS.reduce((a, b) => (b.length > a.length ? b : a));
    const ending = [...library.endings.keys()].reduce((a, b) => (b.length > a.length ? b : a));
    const first = dayIndex("2028-01-01");
    const dailies = Array.from({ length: 366 }, (_, i) => ({ day: dayKey(first + i), history, ending, cards: 105 }));
    const bytes = new TextEncoder().encode(JSON.stringify(dailies)).length;
    expect(bytes).toBeLessThan(40_000);
    // And it comes back whole through the migration a saved profile goes through.
    expect(migrateMeta(JSON.parse(JSON.stringify({ ...emptyMeta(), dailies })))!.dailies).toEqual(dailies);
  });
});
