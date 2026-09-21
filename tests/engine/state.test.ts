import { describe, expect, it } from "vitest";
import { bandOf, cabinetTraitFlags, condMet, exitBand, newRun, replaceAdvisor, rollSetup } from "../../src/engine/state";
import { buildLibrary } from "../../src/engine/library";
import { makeFixture } from "../fixtures/content";
import { lib, start } from "../helpers";

describe("newRun", () => {
  it("starts every meter at 50 with the spec defaults", () => {
    const l = lib();
    const s = { ...newRun(l, 1, { align: "left" }), flags: [] };
    expect(s.meters).toEqual({ mood: 50, money: 50, order: 50, inst: 50 });
    expect(s).toMatchObject({
      seed: 1,
      align: "left",
      era: 1,
      cardCount: 0,
      drift: 0,
      band: "muddle",
      bandLocked: false,
      flags: [],
      queue: [],
      seen: [],
      cooldown: [],
      activeArcs: [],
      modifiers: [],
      over: null,
      current: null,
    });
    expect(s.nextElectionAt).toBe(l.config.electionInterval);
    expect(s.arcBudget).toBeGreaterThanOrEqual(l.config.arcBudgetMin);
    expect(s.arcBudget).toBeLessThanOrEqual(l.config.arcBudgetMax);
  });

  it("fills one advisor per role from the pool", () => {
    const s = newRun(lib(), 5, { align: "right" });
    expect(Object.keys(s.cabinet).sort()).toEqual(["chief", "general"]);
    expect(["c0", "c1", "c2"]).toContain(s.cabinet.chief);
    expect(["g0", "g1"]).toContain(s.cabinet.general);
  });

  it("flags every trait sitting in the cabinet, so arcs can gate on them", () => {
    const l = lib();
    const s = newRun(l, 1, { align: "left" });
    const expected = cabinetTraitFlags(l, s.cabinet);
    for (const f of expected) expect(s.flags).toContain(f);
    for (const f of s.flags) if (f.startsWith("advisor_")) expect(expected).toContain(f);
    expect(cabinetTraitFlags(l, { chief: "c0", general: "g0" })).toEqual([]);
    expect(cabinetTraitFlags(l, { chief: "c2", general: "g1" }).sort()).toEqual(["advisor_corrupt", "advisor_zealot"]);
  });

  it("applies modifiers and rejects unknown ones", () => {
    const s = newRun(lib(), 1, { align: "left", modifiers: ["mod_crisis"] });
    expect(s.meters.money).toBe(30);
    expect(s.flags).toContain("crisis");
    expect(s.modifiers).toEqual(["mod_crisis"]);
    expect(() => newRun(lib(), 1, { align: "left", modifiers: ["nope"] })).toThrow(/unknown modifier/);
  });

  it("is deterministic for a seed", () => {
    expect(newRun(lib(), 77, { align: "left" })).toEqual(newRun(lib(), 77, { align: "left" }));
    expect(newRun(lib(), 77, { align: "left" }).rngState).not.toBe(newRun(lib(), 78, { align: "left" }).rngState);
  });
});

describe("bands", () => {
  it("uses inclusive thresholds at ±25", () => {
    const l = lib();
    expect(bandOf(l, -25)).toBe("decay");
    expect(bandOf(l, -24)).toBe("muddle");
    expect(bandOf(l, 0)).toBe("muddle");
    expect(bandOf(l, 24)).toBe("muddle");
    expect(bandOf(l, 25)).toBe("ascent");
  });

  it("exitBand follows drift unless locked", () => {
    const l = lib();
    expect(exitBand(l, start(l, { drift: 40 }))).toBe("ascent");
    expect(exitBand(l, start(l, { drift: 40, band: "decay", bandLocked: true }))).toBe("decay");
  });
});

describe("condMet", () => {
  const l = lib();
  const s = start(l, { flags: ["a", "b"], meters: { mood: 30, money: 50, order: 70, inst: 50 } });

  it("treats a missing cond as true", () => {
    expect(condMet(undefined, s)).toBe(true);
  });

  it("requires all flags and forbids notFlags", () => {
    expect(condMet({ flags: ["a", "b"] }, s)).toBe(true);
    expect(condMet({ flags: ["a", "c"] }, s)).toBe(false);
    expect(condMet({ notFlags: ["c"] }, s)).toBe(true);
    expect(condMet({ notFlags: ["b"] }, s)).toBe(false);
  });

  it("compares meters strictly", () => {
    expect(condMet({ meters: { mood: { lt: 31 } } }, s)).toBe(true);
    expect(condMet({ meters: { mood: { lt: 30 } } }, s)).toBe(false);
    expect(condMet({ meters: { order: { gt: 69 } } }, s)).toBe(true);
    expect(condMet({ meters: { order: { gt: 70 } } }, s)).toBe(false);
    expect(condMet({ meters: { mood: { gt: 20, lt: 40 }, order: { gt: 60 } } }, s)).toBe(true);
  });
});

describe("rollSetup", () => {
  it("draws one crisis, one trait and one flaw, deterministically per seed", () => {
    const l = lib();
    const a = rollSetup(l, 4, "left");
    expect(a).toEqual(rollSetup(l, 4, "left"));
    expect(a.align).toBe("left");
    expect(a.modifiers).toEqual(["mod_crisis", "mod_trait", "mod_flaw"]);
    expect(rollSetup(l, 4, "right").align).toBe("right");
  });

  it("feeds straight into newRun", () => {
    const l = lib();
    const s = newRun(l, 4, rollSetup(l, 4, "left"));
    expect(s.meters).toEqual({ mood: 55, money: 30, order: 45, inst: 50 });
  });
});

describe("replaceAdvisor", () => {
  it("swaps in a different advisor of the same role and refreshes trait flags", () => {
    const l = lib();
    const s = start(l, { cabinet: { chief: "c2", general: "g0" }, flags: ["advisor_corrupt", "keep_me"] });
    const after = replaceAdvisor(l, s, "chief");
    expect(after.cabinet.chief).not.toBe("c2");
    expect(["c0", "c1"]).toContain(after.cabinet.chief);
    expect(after.flags).toContain("keep_me");
    expect(after.flags).not.toContain("advisor_corrupt");
    expect(after.cabinet.general).toBe("g0");
  });

  it("is a no-op for an unknown role or a role with no second advisor", () => {
    const l = lib();
    const s0 = start(l);
    expect(replaceAdvisor(l, s0, "nobody")).toBe(s0);

    const fx = makeFixture();
    const solo = buildLibrary({ ...fx, advisors: fx.advisors.filter((a) => a.id === "c0" || a.id === "g0") });
    const s = start(solo, { cabinet: { chief: "c0", general: "g0" } });
    expect(replaceAdvisor(solo, s, "chief")).toBe(s);
  });
});
