import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { getCard } from "../../src/engine/library";
import { preview } from "../../src/engine/preview";
import { newRun } from "../../src/engine/state";
import { METER_KEYS } from "../../src/engine/types";
import { choiceSummary, lookChange, meterLevel, meterName, resultSummary, stepOf } from "../../src/ui/speech";
import { meterLabel, themeFor } from "../../src/ui/theme";

describe("what a screen reader is told", () => {
  it("names a meter plainly, never in the slang a deep look prints", () => {
    const decay3 = themeFor(-60);
    // On screen in deep Decay the treasury reads as slang, which is a joke for the eye.
    expect(meterLabel("money", decay3, "left")).not.toBe(STRINGS.meters.money);
    expect(meterName("money", "left")).toBe(STRINGS.meters.money);
    expect(meterName("base", "left")).toBe(STRINGS.blocNames.left.base);
    expect(meterName("base", "right")).toBe(STRINGS.blocNames.right.base);
  });

  it("gives a meter's level in words and never the number, which the screen hides", () => {
    const { levels } = STRINGS.speech;
    expect(meterLevel("money", 10, true)).toBe(levels.tooLow);
    expect(meterLevel("money", 92, true)).toBe(levels.tooHigh);
    // A bloc is only ever in danger at the bottom.
    expect(meterLevel("base", 8, true)).toBe(levels.danger);
    expect(meterLevel("order", 20, false)).toBe(levels.low);
    expect(meterLevel("order", 50, false)).toBe(levels.half);
    expect(meterLevel("order", 80, false)).toBe(levels.high);
    for (let v = 0; v <= 100; v += 5) expect(meterLevel("inst", v, v < 15 || v > 85)).not.toMatch(/\d/);
  });

  it("sizes a change the way the preview dots do", () => {
    expect([0, 2, 3, 5, 6, 30].map(stepOf)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(stepOf(-7)).toBe(3);
  });

  it("says what a choice would move and how much, but never which way", () => {
    const state = newRun(library, 42, { align: "left" });
    let said = 0;
    for (const card of library.content.cards.slice(0, 120)) {
      for (const side of ["left", "right"] as const) {
        const text = choiceSummary(preview(library, state, card, side), state.meters, "left");
        expect(text).not.toMatch(/\d/);
        expect(text).not.toMatch(new RegExp(`\\b(${STRINGS.speech.up}|${STRINGS.speech.down})\\b`));
        if (text !== STRINGS.speech.movesNothing) said++;
      }
    }
    expect(said).toBeGreaterThan(100);
    // And it names exactly the meters the dots would light.
    const card = getCard(library, library.content.cards.find((c) => c.left.fx && Object.keys(c.left.fx).length)!.id);
    const p = preview(library, state, card, "left");
    const text = choiceSummary(p, state.meters, "left");
    for (const k of METER_KEYS) expect(text.includes(meterName(k, "left"))).toBe(p.affected.includes(k));
  });

  it("says what a choice did: which meters moved, which way and how much", () => {
    const before = { base: 50, backers: 50, public: 50, money: 50, order: 50, inst: 50 };
    const after = { ...before, money: 41, order: 52 };
    expect(resultSummary(before, after, "left")).toBe(`Money ${STRINGS.speech.down} a lot, Order ${STRINGS.speech.up} a little.`);
    expect(resultSummary(before, before, "left")).toBe("");
  });

  it("describes the look in its own terms, deeper, easing back and plain again", () => {
    const { look } = STRINGS.speech;
    expect(lookChange(0, -1)).toBe(look.decay[0]);
    expect(lookChange(-1, -2)).toBe(look.decay[1]);
    expect(lookChange(-3, -2)).toBe(look.easeDecay);
    expect(lookChange(2, 3)).toBe(look.ascent[2]);
    expect(lookChange(3, 1)).toBe(look.easeAscent);
    expect(lookChange(-1, 0)).toBe(look.quiet);
    // Straight from one look to the other reads as arriving in the new one.
    expect(lookChange(-1, 1)).toBe(look.ascent[0]);
    expect(lookChange(2, 2)).toBeNull();
    // Never the drift behind it.
    for (const line of [...look.decay, ...look.ascent, look.easeDecay, look.easeAscent, look.quiet]) expect(line).not.toMatch(/drift|\d/i);
  });
});
