import { describe, expect, it } from "vitest";
import { library } from "../src/content";
import { DEFAULT_RULE_OPTIONS } from "../src/validate/rules";
import { fitPlacements, kindOf, shownText } from "./fit";

/**
 * The small-phone fit check puts each side's longest card of every kind on the table
 * (tests/browser/screens.test.ts, BACKLOG-8 phase 51). These hold it to that without a
 * browser: no card is of a kind it does not place, and none shows longer than the ceiling it
 * has measured. The validator reads the text as written, with `{rival}` nine characters long;
 * the table shows the name, and "Perpetua Mordaunt" is seventeen.
 */
describe("the cards the fit check places", () => {
  it("cover every kind of card there is", () => {
    const unknown = [...library.cards.values()].filter((c) => !kindOf(library, c)).map((c) => `${c.id} (${c.type})`);
    expect(unknown, "a kind of card the fit check does not place: add it to tests/fit.ts").toEqual([]);
    for (const party of ["left", "right"] as const) {
      const kinds = new Set(fitPlacements(library, party).map((p) => p.kind));
      expect([...kinds].sort(), party).toEqual(["campaign", "election", "event", "named", "question", "story"]);
    }
  });

  it("include the longest card each side can show, names and all, and none runs past the ceiling", () => {
    const ceiling = DEFAULT_RULE_OPTIONS.maxText;
    for (const party of ["left", "right"] as const) {
      const theirs = [...library.cards.values()].filter((c) => c.align === "any" || c.align === party);
      const longest = Math.max(...theirs.map((c) => shownText(library, c, party).length));
      const placed = Math.max(...fitPlacements(library, party).map((p) => p.text.length));
      expect(placed, party).toBe(longest);
      const over = theirs.filter((c) => shownText(library, c, party).length > ceiling).map((c) => c.id);
      expect(over, `${party}: longer on the table than the ${ceiling} characters the fit check has measured`).toEqual([]);
    }
  });

  it("fill a name with the longest the seat can hold, and only a seat the card can be dealt with", () => {
    // Written for one person, so only they can say it, whoever else could hold the seat.
    const orde = library.cards.get("v35_orde")!;
    expect(shownText(library, orde, "left")).toContain("Casimir Orde");
    const rival = [...library.cards.values()].find((c) => c.text.includes("{rival}"))!;
    expect(shownText(library, rival, "left")).not.toContain("{rival}");
  });
});
