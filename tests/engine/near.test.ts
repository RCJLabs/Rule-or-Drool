import { describe, expect, it } from "vitest";
import { nearMisses } from "../../src/engine/endings";
import { coupRisk } from "../../src/engine/resolve";
import { lib, meters, start } from "../helpers";

describe("what a run is close to", () => {
  const l = lib();

  it("names an ending by how far the meter has left to go", () => {
    const s = start(l, { meters: meters({ money: 5 }) });
    expect(nearMisses(l, s, 12)).toEqual([{ endingId: "bankruptcy", away: 5 }]);
  });

  it("reads both ends of a state meter and only the bottom of a bloc", () => {
    expect(nearMisses(l, start(l, { meters: meters({ order: 96 }) }), 12)).toEqual([
      { endingId: "police_state", away: 4 },
    ]);
    // A bloc cannot end a run by adoring you, so a high one is not near anything.
    expect(nearMisses(l, start(l, { meters: meters({ base: 96 }) }), 12)).toEqual([]);
    expect(nearMisses(l, start(l, { meters: meters({ base: 3 }) }), 12)).toEqual([
      { endingId: "abandoned_base", away: 3 },
    ]);
  });

  it("sorts by nearest, so the UI can name the one that is actually about to happen", () => {
    const s = start(l, { meters: meters({ money: 9, order: 2 }) });
    expect(nearMisses(l, s, 12).map((n) => n.endingId)).toEqual(["anarchy", "bankruptcy"]);
  });

  it("measures the cult by whichever bloc is furthest from it", () => {
    const at = l.config.cultAt;
    const s = start(l, { meters: meters({ base: at, backers: at, public: at - 6 }) });
    expect(nearMisses(l, s, 12)).toContainEqual({ endingId: "personality_cult", away: 6 });
  });

  it("says nothing about a comfortable run", () => {
    expect(nearMisses(l, start(l), 12)).toEqual([]);
  });
});

describe("a coup needs somebody left to mount it", () => {
  it("stops being the risk once the institutions have gone too", () => {
    const l = lib();
    const collapsing = start(l, { meters: meters({ order: 5, inst: 5 }) });
    const orderly = start(l, { meters: meters({ order: 5, inst: 40 }) });
    // Same missing order; the difference is whether anything is organised enough to act.
    expect(coupRisk(l, collapsing)).toBe(0);
    expect(coupRisk(l, orderly)).toBeGreaterThan(0);
  });
});
