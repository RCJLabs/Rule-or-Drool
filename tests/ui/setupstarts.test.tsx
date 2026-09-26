// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { rollSetup } from "../../src/engine/state";
import { EDGE_FROM, edgesLine, startsLine, startsOf } from "../../src/ui/setup";
import { SetupSummary } from "../../src/ui/SetupSummary";

/**
 * What a dealt setup does, said on the setup screen (BACKLOG-11 phase 73): the meters each part
 * starts higher or lower, in words, and the edges that end a rule the whole setup starts nearer.
 */

afterEach(cleanup);

describe("what a setup starts", () => {
  it("says each part's starts in words, largest first, in the run's own names for its groups", () => {
    // The recession: the treasury much lower, the groups a touch lower, which is not worth a word.
    expect(startsLine(library, "crisis_recession", "left")).toBe(`${STRINGS.setupStarts.lead} Money much lower`);
    // The technocrat: the State much higher.
    expect(startsLine(library, "trait_technocrat", "left")).toBe(`${STRINGS.setupStarts.lead} State much higher`);
    // A group is named as the run's side names it.
    expect(startsLine(library, "flaw_paranoid", "left")).toContain("Movement a little lower");
    expect(startsLine(library, "flaw_paranoid", "right")).toContain("Faithful a little lower");
    // Never a number.
    for (const m of library.content.modifiers) expect(startsLine(library, m.id, "left") ?? "").not.toMatch(/\d/);
  });

  it("names the edges a whole setup starts nearer, from what its parts add up to", () => {
    // The war's order and the fixer's treasury: order high; the treasury's loss is made good.
    expect(edgesLine(library, ["crisis_war", "trait_fixer"], "left")).toBe(STRINGS.setupStarts.edges.replace("{list}", STRINGS.setupStarts.high.replace("{meter}", "Order")));
    // The academic and the naive flaw start the State high, which costs a careful run most.
    expect(edgesLine(library, ["trait_academic", "flaw_naive"], "left")).toContain(STRINGS.setupStarts.high.replace("{meter}", "State"));
    // A group raised is not nearer an edge: only a group gone ends a rule.
    expect(edgesLine(library, ["trait_orator"], "left")).toBeNull();
  });

  it("names an edge for the parts that move a meter far enough, and only those", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const align = seed % 2 ? "left" : "right";
      const mods = rollSetup(library, seed, align, []).modifiers ?? [];
      const line = edgesLine(library, mods, align);
      const net = new Map<string, number>();
      for (const id of mods) for (const [k, d] of startsOf(library, id)) net.set(k, (net.get(k) ?? 0) + d);
      const far = [...net].some(([k, d]) => d <= -EDGE_FROM || (d >= EDGE_FROM && ["money", "order", "inst"].includes(k)));
      expect(!!line, `seed ${seed}`).toBe(far);
    }
  });

  it("shows them on the setup screen, and not in the end screen's short form", () => {
    render(<SetupSummary lib={library} modifiers={["crisis_war", "trait_fixer", "flaw_naive"]} align="right" />);
    expect(document.querySelectorAll(".setup-starts")).toHaveLength(3);
    expect(document.querySelector(".setup-edges")?.textContent).toContain("Order, high");
    cleanup();
    render(<SetupSummary lib={library} modifiers={["crisis_war", "trait_fixer", "flaw_naive"]} align="right" compact />);
    expect(document.querySelector(".setup-starts")).toBeNull();
    expect(document.querySelector(".setup-edges")).toBeNull();
  });
});
