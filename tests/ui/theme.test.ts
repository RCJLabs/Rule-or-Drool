import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun } from "../../src/engine/state";
import { STAGE_AT, degradeLevel, holoLevel, meterLabel, sponsorCount, sponsorFor, streamLevel, themeFor, themeOf, viewersFor } from "../../src/ui/theme";

describe("themeFor", () => {
  it("is neutral near zero and stages before the band line", () => {
    expect(themeFor(0)).toMatchObject({ band: "muddle", stage: 0, name: "muddle", decay: 0, ascent: 0 });
    expect(themeFor(-7).stage).toBe(0);
    expect(themeFor(-8)).toMatchObject({ band: "muddle", stage: -1, name: "decay1" });
    expect(themeFor(8)).toMatchObject({ band: "muddle", stage: 1, name: "ascent1" });
    expect(themeFor(-25).band).toBe("decay");
    expect(themeFor(-20).name).toBe("decay2");
    expect(themeFor(-36).name).toBe("decay3");
    expect(themeFor(36).name).toBe("ascent3");
    expect(themeFor(-100)).toMatchObject({ stage: -3, decay: 1, ascent: 0 });
    expect(themeFor(100)).toMatchObject({ stage: 3, decay: 0, ascent: 1 });
  });

  it("grows continuously", () => {
    expect(themeFor(-20).decay).toBeGreaterThan(themeFor(-12).decay);
    expect(themeFor(-12).decay).toBeGreaterThan(0);
    expect(themeFor(40).ascent).toBeGreaterThan(themeFor(20).ascent);
    // Full strength has to arrive somewhere a run reaches, not at the clamp.
    expect(themeFor(-42).decay).toBe(1);
  });
});

// BACKLOG-7 phase 45: a run shows the look it has settled on, which can hold past drift.
describe("themeOf", () => {
  const run = (drift: number, look: number) => ({ ...newRun(library, 1, { align: "left" }), drift, look });

  it("shows the look a run has settled on, at the strength its drift gives", () => {
    expect(themeOf(run(5, 1))).toMatchObject({ stage: 1, name: "ascent1", ascent: 0, decay: 0, band: "muddle" });
    expect(themeOf(run(-17, -2))).toMatchObject({ stage: -2, name: "decay2" });
    expect(themeOf(run(-17, -2)).decay).toBeCloseTo(themeFor(-17).decay);
    expect(themeOf(run(30, 2))).toEqual(themeFor(30));
  });

  it("settles a look its drift has left by more than the margin", () => {
    expect(themeOf(run(3, 1)).name).toBe("muddle");
    expect(themeOf(run(-9, 1)).name).toBe("decay1");
    expect(themeOf(run(40, 0)).name).toBe("ascent3");
  });

  it("gives any stage it is handed", () => {
    expect(themeFor(5, undefined, 1)).toMatchObject({ stage: 1, name: "ascent1" });
    expect(STAGE_AT).toBe(library.config.lookAt);
  });
});

describe("labels, degradation and sponsors", () => {
  it("dumbs labels down only in deep decay", () => {
    expect(meterLabel("inst", themeFor(0), "left")).toBe("State");
    expect(meterLabel("inst", themeFor(-15), "left")).toBe("State");
    expect(meterLabel("inst", themeFor(-22), "left")).toBe("Gov Stuff");
    expect(meterLabel("inst", themeFor(-40), "left")).toBe("THE MAN");
    expect(meterLabel("inst", themeFor(60), "left")).toBe("State");
  });

  it("degrades text only from stage 2 down", () => {
    expect(degradeLevel(themeFor(-15))).toBe(0);
    expect(degradeLevel(themeFor(-22))).toBe(0.2);
    expect(degradeLevel(themeFor(-40))).toBe(0.4);
    expect(degradeLevel(themeFor(60))).toBe(0);
  });

  it("adds sponsors one stage at a time, never in ascent", () => {
    expect(sponsorCount(themeFor(0))).toBe(0);
    expect(sponsorCount(themeFor(-10))).toBe(1);
    expect(sponsorCount(themeFor(-22))).toBe(2);
    expect(sponsorCount(themeFor(-40))).toBe(3);
    expect(sponsorCount(themeFor(70))).toBe(0);
  });

  // The looks were decoration before the re-scale: the deepest Decay stage was 0.1% of a
  // competent run's cards. These guard the shape of the ladder, not the numbers themselves,
  // which belong to the harness (BACKLOG-3 phase 18).
  it("brings the stream on one stage at a time, and never on the way up", () => {
    expect(streamLevel(themeFor(0))).toBe(0);
    expect(streamLevel(themeFor(-STAGE_AT[0]))).toBe(1);
    expect(streamLevel(themeFor(-STAGE_AT[1]))).toBe(2);
    expect(streamLevel(themeFor(-STAGE_AT[2]))).toBe(3);
    expect(streamLevel(themeFor(-100))).toBe(3);
    expect(streamLevel(themeFor(60))).toBe(0);
  });

  it("deepens the projection the same way, and never on the way down", () => {
    expect(holoLevel(themeFor(0))).toBe(0);
    expect(holoLevel(themeFor(STAGE_AT[0]))).toBe(1);
    expect(holoLevel(themeFor(STAGE_AT[2]))).toBe(3);
    expect(holoLevel(themeFor(-60))).toBe(0);
  });

  it("gives the stream an audience that grows with how bad it is, and does not flicker", () => {
    const quiet = viewersFor(7, 12, 1);
    expect(viewersFor(7, 12, 1)).toBe(quiet);
    expect(viewersFor(7, 12, 3)).toBeGreaterThan(quiet * 4);
    expect(viewersFor(7, 12, 0)).toBe(0);
  });

  it("names sponsors deterministically", () => {
    expect(sponsorFor(1, 2)).toBe(sponsorFor(1, 2));
    expect(sponsorFor(1, 2)).toMatch(/^\w+ .+/);
    const names = new Set(Array.from({ length: 20 }, (_, i) => sponsorFor(5, i)));
    expect(names.size).toBeGreaterThan(5);
  });
});
