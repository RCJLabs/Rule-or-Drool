import { describe, expect, it } from "vitest";
import { degradeLevel, meterLabel, sponsorCount, sponsorFor, themeFor } from "../../src/ui/theme";

describe("themeFor", () => {
  it("is neutral near zero and stages before the band line", () => {
    expect(themeFor(0)).toMatchObject({ band: "muddle", stage: 0, name: "muddle", decay: 0, ascent: 0 });
    expect(themeFor(-9).stage).toBe(0);
    expect(themeFor(-10)).toMatchObject({ band: "muddle", stage: -1, name: "decay1" });
    expect(themeFor(10)).toMatchObject({ band: "muddle", stage: 1, name: "ascent1" });
    expect(themeFor(-25).band).toBe("decay");
    expect(themeFor(-30).name).toBe("decay2");
    expect(themeFor(-55).name).toBe("decay3");
    expect(themeFor(55).name).toBe("ascent3");
    expect(themeFor(-100)).toMatchObject({ stage: -3, decay: 1, ascent: 0 });
    expect(themeFor(100)).toMatchObject({ stage: 3, decay: 0, ascent: 1 });
  });

  it("grows continuously", () => {
    expect(themeFor(-20).decay).toBeGreaterThan(themeFor(-12).decay);
    expect(themeFor(-12).decay).toBeGreaterThan(0);
    expect(themeFor(40).ascent).toBeGreaterThan(themeFor(20).ascent);
  });
});

describe("labels, degradation and sponsors", () => {
  it("dumbs labels down only in deep decay", () => {
    expect(meterLabel("inst", themeFor(0))).toBe("Institutions");
    expect(meterLabel("inst", themeFor(-15))).toBe("Institutions");
    expect(meterLabel("inst", themeFor(-30))).toBe("Gov Stuff");
    expect(meterLabel("inst", themeFor(-60))).toBe("THE SYSTEM");
    expect(meterLabel("inst", themeFor(60))).toBe("Institutions");
  });

  it("degrades text only from stage 2 down", () => {
    expect(degradeLevel(themeFor(-15))).toBe(0);
    expect(degradeLevel(themeFor(-30))).toBe(0.3);
    expect(degradeLevel(themeFor(-60))).toBe(0.6);
    expect(degradeLevel(themeFor(60))).toBe(0);
  });

  it("adds sponsors one stage at a time, never in ascent", () => {
    expect(sponsorCount(themeFor(0))).toBe(0);
    expect(sponsorCount(themeFor(-10))).toBe(1);
    expect(sponsorCount(themeFor(-30))).toBe(2);
    expect(sponsorCount(themeFor(-70))).toBe(3);
    expect(sponsorCount(themeFor(70))).toBe(0);
  });

  it("names sponsors deterministically", () => {
    expect(sponsorFor(1, 2)).toBe(sponsorFor(1, 2));
    expect(sponsorFor(1, 2)).toMatch(/^\w+ .+/);
    const names = new Set(Array.from({ length: 20 }, (_, i) => sponsorFor(5, i)));
    expect(names.size).toBeGreaterThan(5);
  });
});
