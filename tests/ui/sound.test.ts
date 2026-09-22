// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buzz, newlyDangerous, play } from "../../src/ui/sound";
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

describe("making a noise where there is no audio", () => {
  const warn = vi.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => warn.mockClear());

  it("is a no-op rather than a crash when the browser has no AudioContext", () => {
    // jsdom has none, which is the same situation as a locked-down browser.
    expect(() => play("commit", "left")).not.toThrow();
    expect(() => play("endBadly")).not.toThrow();
    expect(() => play("danger", "money")).not.toThrow();
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
