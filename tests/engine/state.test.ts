import { describe, expect, it } from "vitest";
import { bandOf, condMet, exitBand, newRun } from "../../src/engine/state";
import { lib, start } from "../helpers";

describe("newRun", () => {
  it("starts every meter at 50 with the spec defaults", () => {
    const l = lib();
    const s = newRun(l, 1, { align: "left" });
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
    expect(["c1", "c2"]).toContain(s.cabinet.chief);
    expect(s.cabinet.general).toBe("g1");
  });

  it("applies modifiers and rejects unknown ones", () => {
    const s = newRun(lib(), 1, { align: "left", modifiers: ["mod_crisis"] });
    expect(s.meters.money).toBe(30);
    expect(s.flags).toEqual(["crisis"]);
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
