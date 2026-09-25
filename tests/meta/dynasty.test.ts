import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { TOOK_OVER_FLAG } from "../../src/engine/inherit";
import { advisorPool, newRun } from "../../src/engine/state";
import type { GameState, Inheritance } from "../../src/engine/types";
import {
  HISTORY_ORDER,
  LEGACY_FLAGS,
  RUN_BOUND,
  emptyMeta,
  foldRun,
  historyOf,
  inheritable,
  inheritanceFrom,
  lineOf,
  takeOverFrom,
  type MetaState,
  type RunRecord,
} from "../../src/meta";

/**
 * A line of runs in the profile (BACKLOG-10 phase 63): what a run takes over from the last one's
 * record, and how a run that took over is remembered.
 */

const cfg = library.config;
const rival = (n = 0) => advisorPool(library, cfg.rivalRole, "left")[n]!.id;
const record = (patch: Partial<RunRecord> = {}): RunRecord => ({
  align: "left",
  cards: 105,
  era: 3,
  endingId: "finale_decay",
  band: "decay",
  rival: rival(),
  legacies: [],
  history: null,
  mandates: [],
  ...patch,
});
/** A profile past its first term, with this run behind it. */
const after = (r: RunRecord): MetaState => ({ ...emptyMeta(), runs: 1, endings: { finale_decay: 1 }, history: [r] });

describe("what a run takes over", () => {
  it("is the last run's lean, its biggest legacies the country can hand on, and its rival halfway back", () => {
    // Out of history's order on purpose, and with what belongs to the reign mixed in.
    const legacies = ["habit_skim", "went_to_war", "cheated_election", "elections_abolished", "seawall", "ring_started"];
    const inh = inheritanceFrom(library, record({ legacies, rival: rival(1), rivalStanding: 50 }));
    const expected = HISTORY_ORDER.filter((f) => ["went_to_war", "seawall", "ring_started"].includes(f)).slice(0, 2);
    expect(inh).toEqual({ band: "decay", line: 2, legacies: expected, rival: rival(1), rivalStanding: (cfg.rivalStart + 50) / 2 });
    // A line goes on counting, and an old record with no standing is read from the start.
    expect(inheritanceFrom(library, record({ line: 4 })).line).toBe(5);
    expect(inheritanceFrom(library, record({ rivalStanding: undefined })).rivalStanding).toBe(cfg.rivalStart);
    // A rival this version's deck has no seat for is dealt fresh.
    expect(inheritanceFrom(library, record({ rival: "adv_nobody" })).rival).toBeNull();
    expect(inheritanceFrom(library, record({ rival: null })).rival).toBeNull();
  });

  it("hands on only the country's legacies: not how the reign governed, not what happened to it, not the abolished vote", () => {
    for (const f of RUN_BOUND) expect(LEGACY_FLAGS.has(f), `${f} is a legacy`).toBe(true);
    for (const f of RUN_BOUND) expect(inheritable(f), f).toBe(false);
    for (const f of ["seawall", "ring_started", "went_to_war", "media_captured", "long_ship"]) expect(inheritable(f), f).toBe(true);
    expect(inheritable("advisor_loyal")).toBe(false);
  });

  it("is offered once a profile is past its first term and has a run behind it", () => {
    expect(takeOverFrom(emptyMeta())).toBeNull();
    // Still due a first term: its runs are first terms until one is seen through.
    expect(takeOverFrom({ ...emptyMeta(), history: [record()] })).toBeNull();
    const last = record({ endingId: "riots" });
    expect(takeOverFrom(after(last))).toBe(last);
    expect(lineOf(record())).toBe(1);
    expect(lineOf(record({ line: 3 }))).toBe(3);
  });
});

describe("a run that took over, remembered", () => {
  const inh: Inheritance = { band: "decay", line: 2, legacies: ["seawall", "went_to_war"], rival: null, rivalStanding: 40 };
  const finished = (s: GameState, flags: string[]): GameState => ({
    ...s,
    flags: [...s.flags, ...flags],
    flagSince: { ...s.flagSince, ...Object.fromEntries(flags.map((f) => [f, 50])) },
    era: 3,
    cardCount: 105,
    rivalStanding: 57,
    over: { endingId: "finale_muddle", epilogueKey: "muddle:left:3" },
  });

  it("keeps every legacy the country ends with for the next of the line, and counts only its own", () => {
    const run = finished(newRun(library, 5, { align: "left", inheritance: inh }), ["long_ship"]);
    const fold = foldRun(library, emptyMeta(), run);
    const r = fold.meta.history[0]!;
    expect(r.legacies).toEqual(expect.arrayContaining(["seawall", "went_to_war", "long_ship"]));
    expect(fold.meta.legacies).toEqual({ long_ship: 1 });
    expect(r.line).toBe(2);
    expect(r.rivalStanding).toBe(57);
    expect(r.legacies).not.toContain(TOOK_OVER_FLAG);
    // The next of the line takes over from it: the long ship, above the seawall in history's order.
    expect(inheritanceFrom(library, r)).toMatchObject({ band: "muddle", line: 3, rivalStanding: Math.round((cfg.rivalStart + 57) / 2) });
    // A fresh start is the first of a line, and says nothing of one.
    const fresh = foldRun(library, emptyMeta(), finished(newRun(library, 5, { align: "left" }), ["long_ship"])).meta.history[0]!;
    expect(fresh.line).toBeUndefined();
  });

  it("is named by history for what it did, not for what it took over", () => {
    const heir = finished(newRun(library, 5, { align: "left", inheritance: inh }), []);
    const fresh = finished(newRun(library, 5, { align: "left" }), ["seawall", "went_to_war"]);
    expect(historyOf(heir, "muddle").signature).not.toBe(historyOf(fresh, "muddle").signature);
    expect(historyOf(heir, "muddle").consequences.map((c) => c.flag)).not.toContain("seawall");
  });

  it("counts toward a line of three, and toward a line redeemed", () => {
    const third = finished(newRun(library, 5, { align: "left", inheritance: { ...inh, line: 3 } }), []);
    expect(foldRun(library, emptyMeta(), third).newObjectives).toContain("obj_line_three");
    expect(foldRun(library, emptyMeta(), finished(newRun(library, 5, { align: "left", inheritance: inh }), [])).newObjectives).not.toContain("obj_line_three");
    const redeemed = { ...finished(newRun(library, 5, { align: "left", inheritance: inh }), []), over: { endingId: "finale_ascent", epilogueKey: "ascent:left:3" } };
    expect(foldRun(library, emptyMeta(), redeemed).newObjectives).toContain("obj_line_redeemed");
    const fromAscent = { ...redeemed, inherited: { ...inh, band: "ascent" as const } };
    expect(foldRun(library, emptyMeta(), fromAscent).newObjectives).not.toContain("obj_line_redeemed");
  });
});
