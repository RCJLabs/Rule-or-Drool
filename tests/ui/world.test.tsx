// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LANDMARKS_SHOWN, composeWorld } from "../../src/ui/world";
import { WorldAfter } from "../../src/ui/WorldAfter";

afterEach(() => cleanup());

const base = { band: "muddle" as const, drift: 0, align: "left" as const, flags: [] as string[], seed: 7, era: 3 };

/**
 * The world after a run (post-run histories). Where things land on screen is judged by eye
 * in a rendered gallery; what belongs here is that the picture is decided by what the run
 * did, and that it cannot put two things in one place.
 */
describe("the world after", () => {
  it("puts a landmark in the world for a decision the run made", () => {
    const w = composeWorld({ ...base, flags: ["seawall", "orbit_reached"] });
    expect(w.placed.map((p) => p.motif).sort()).toEqual(["seawall", "station"]);
  });

  it("gives the defining decision its place first, and never two landmarks one place", () => {
    const w = composeWorld({ ...base, flags: ["heir_named", "elections_abolished", "referendum_called"] });
    // All three want the monument; the most history-making one gets it and the others move.
    expect(w.placed.find((p) => p.slot === "monument")!.motif).toBe("statue");
    const slots = w.placed.map((p) => p.slot);
    expect(new Set(slots).size).toBe(slots.length);
  });

  it("leaves the habits out of a run that did bigger things", () => {
    // habit_skim is carried by 99.5% of runs; drawn every time, the gold tower would mean nothing.
    const busy = composeWorld({
      ...base,
      flags: ["long_ship", "orbit_reached", "ring_started", "seawall", "moonshot_funded", "housing_built", "habit_skim", "habit_bend"],
    });
    expect(busy.placed).toHaveLength(LANDMARKS_SHOWN);
    expect(busy.placed.map((p) => p.motif)).not.toContain("goldTower");
    // ...even when there would be room, because they are in nearly every run...
    const room = composeWorld({ ...base, flags: ["ring_started", "seawall", "housing_built", "habit_skim", "habit_bend"] });
    expect(room.placed.map((p) => p.motif)).toEqual(["ring", "seawall", "housing"]);
    // ...and keeps them when they are all the run did, which is when they are the story.
    const quiet = composeWorld({ ...base, flags: ["habit_skim", "habit_bend"] });
    expect(quiet.placed.map((p) => p.motif).sort()).toEqual(["goldTower", "mansion"]);
  });

  it("builds taller on the way up and breaks on the way down", () => {
    const up = composeWorld({ ...base, band: "ascent", drift: 60 });
    const down = composeWorld({ ...base, band: "decay", drift: -60 });
    const mean = (w: typeof up) => w.buildings.reduce((n, b) => n + b.h, 0) / w.buildings.length;
    expect(mean(up)).toBeGreaterThan(mean(down) * 2);
    expect(down.buildings.some((b) => b.broken)).toBe(true);
    expect(up.buildings.some((b) => b.broken)).toBe(false);
    expect(up.buildings.some((b) => b.spire)).toBe(true);
  });

  it("draws the same city for the same run and a different one for another", () => {
    const a = composeWorld({ ...base, seed: 1 });
    expect(composeWorld({ ...base, seed: 1 })).toEqual(a);
    expect(composeWorld({ ...base, seed: 2 }).buildings).not.toEqual(a.buildings);
  });

  it("is a labelled image, and describes what it shows", () => {
    const w = composeWorld({ ...base, band: "ascent", drift: 50, flags: ["ring_started", "housing_built"] });
    const { container } = render(<WorldAfter world={w} title="The Age of the Ring" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    // Named by the history, described by what is in it: two attributes, not one string.
    expect(svg.getAttribute("aria-labelledby")).toBe(svg.querySelector("title")!.id);
    expect(svg.getAttribute("aria-describedby")).toBe(svg.querySelector("desc")!.id);
    expect(svg.querySelector("title")!.textContent).toBe("The Age of the Ring");
    const desc = svg.querySelector("desc")!.textContent!;
    expect(desc).toContain("a ring across the sky");
    expect(desc).toContain("rows of housing blocks");
    expect(container.querySelectorAll("[data-motif]")).toHaveLength(2);
  });

  it("gives each picture its own gradient ids, so two on a page do not share a sky", () => {
    const w = composeWorld(base);
    const { container } = render(
      <>
        <WorldAfter world={w} title="a" />
        <WorldAfter world={w} title="b" />
      </>,
    );
    const ids = [...container.querySelectorAll("linearGradient")].map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
