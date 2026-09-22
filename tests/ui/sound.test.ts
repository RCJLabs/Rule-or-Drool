// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buzz, newlyDangerous, play } from "../../src/ui/sound";
import { soundLevel, themeFor } from "../../src/ui/theme";
import { meters } from "../helpers";

describe("which meters just went bad", () => {
  it("fires on the crossing, not while a meter is already low", () => {
    const ok = meters();
    const low = meters({ money: 9 });
    expect(newlyDangerous(ok, low, 15)).toEqual(["money"]);
    // Still low next card, but it has already been said.
    expect(newlyDangerous(low, meters({ money: 7 }), 15)).toEqual([]);
    // And coming back up says nothing either.
    expect(newlyDangerous(low, ok, 15)).toEqual([]);
  });

  it("treats a bloc as dangerous only at the bottom, and a state meter at both ends", () => {
    // A bloc cannot end a run by adoring you, so a high one is not a warning.
    expect(newlyDangerous(meters(), meters({ base: 99 }), 15)).toEqual([]);
    expect(newlyDangerous(meters(), meters({ base: 5 }), 15)).toEqual(["base"]);
    expect(newlyDangerous(meters(), meters({ order: 99 }), 15)).toEqual(["order"]);
  });

  it("reports every meter that crossed, in meter order", () => {
    expect(newlyDangerous(meters(), meters({ base: 2, money: 3 }), 15)).toEqual(["base", "money"]);
  });
});

describe("what a swipe sounds like", () => {
  /**
   * The ladder itself. What it does to the cue is synthesis and is measured by rendering it
   * offline through a model of a phone speaker, not here; this pins the one number the two
   * halves agree on, so the sound cannot drift away from the frame without a test saying so
   * (BACKLOG-3 phase 22).
   */
  it("follows the same drift the frame does, and reaches both ends where the frame does", () => {
    expect(soundLevel(themeFor(0))).toBe(0);
    expect(soundLevel(themeFor(-60))).toBe(-1);
    expect(soundLevel(themeFor(60))).toBe(1);
    // The done-when is -60 against +60, and the ends are reached well before that.
    expect(soundLevel(themeFor(-42))).toBe(-1);
    expect(soundLevel(themeFor(42))).toBe(1);
  });

  it("is a signed version of the same value the two looks use", () => {
    for (const drift of [-50, -30, -9, 0, 9, 30, 50]) {
      const t = themeFor(drift);
      expect(soundLevel(t)).toBeCloseTo(t.ascent - t.decay, 10);
      expect(Math.sign(soundLevel(t))).toBe(Math.sign(t.stage));
    }
  });

  it("moves without a step: a card either side of a stage line is barely a change", () => {
    // The looks arrive in three stages; the sound does not, so nothing lurches at a boundary.
    expect(Math.abs(soundLevel(themeFor(-20)) - soundLevel(themeFor(-19)))).toBeLessThan(0.04);
  });
});

describe("making a noise where there is no audio", () => {
  const warn = vi.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => warn.mockClear());

  it("is a no-op rather than a crash when the browser has no AudioContext", () => {
    // jsdom has none, which is the same situation as a locked-down browser.
    expect(() => play("commit", "left")).not.toThrow();
    expect(() => play("endBadly")).not.toThrow();
    expect(() => play("danger", "money")).not.toThrow();
    expect(() => play("commit", "left", -1)).not.toThrow();
    expect(() => play("commit", "right", 1)).not.toThrow();
  });

  it("does not throw when vibrate is missing or refuses", () => {
    expect(() => buzz(12)).not.toThrow();
    const vibrate = vi.fn(() => {
      throw new Error("not allowed");
    });
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    expect(() => buzz([40, 60])).not.toThrow();
    expect(vibrate).toHaveBeenCalled();
  });

  it("buzzes with the pattern it was given where the device has it", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    buzz(12);
    expect(vibrate).toHaveBeenCalledWith(12);
  });
});
