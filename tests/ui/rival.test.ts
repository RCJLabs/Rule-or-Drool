import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { rivalPressure } from "../../src/engine/resolve";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { rivalReport } from "../../src/ui/rival";

const cfg = library.config;
const base = () => newRun(library, 7, rollSetup(library, 7, "left", []));
const at = (over: Partial<GameState>): GameState => ({ ...base(), ...over });

/**
 * The rival's standing was computed every card and shown nowhere (BACKLOG-3 phase 24). What
 * it reads at each rung is checked here; what it means is measured in the harness.
 */
describe("how the rival is doing", () => {
  it("starts as nobody, because at the starting standing they are costing nothing", () => {
    const s = at({ rivalStanding: cfg.rivalStart, drift: 0 });
    const r = rivalReport(library, s);
    expect(r.pressure).toBe(cfg.rivalStart);
    expect(r.rung).toBe(0);
    expect(r.somebody).toBe(false);
    expect(r.cost).toBe(STRINGS.rival.takingNone);
  });

  it("climbs through four rungs and never skips one", () => {
    const seen = new Set<number>();
    let last = -1;
    for (let standing = 0; standing <= 100; standing += 1) {
      const r = rivalReport(library, at({ rivalStanding: standing, drift: 0 }));
      expect(r.rung).toBeGreaterThanOrEqual(last);
      expect(r.rung - last).toBeLessThanOrEqual(1);
      last = r.rung;
      seen.add(r.rung);
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  it("says they could take the office exactly where the engine would hand it to them", () => {
    // The top rung is not a new threshold: it is rivalWinsAt, the standing at which losing a
    // vote is named as theirs rather than as a plain defeat.
    const below = rivalReport(library, at({ rivalStanding: cfg.rivalWinsAt - 1, drift: 0 }));
    const atIt = rivalReport(library, at({ rivalStanding: cfg.rivalWinsAt, drift: 0 }));
    expect(below.somebody).toBe(false);
    expect(atIt.somebody).toBe(true);
    expect(atIt.rung).toBe(3);
  });

  it("counts going too far either way, which nothing in the game says out loud", () => {
    // Pressure is standing plus |drift| x rivalDriftPull, so a run deep into Ascent feeds the
    // rival exactly as much as one deep into Decay.
    const up = rivalReport(library, at({ rivalStanding: 30, drift: 100 }));
    const down = rivalReport(library, at({ rivalStanding: 30, drift: -100 }));
    expect(up.pressure).toBe(down.pressure);
    expect(up.rung).toBe(down.rung);
    expect(up.pressure).toBeGreaterThan(rivalReport(library, at({ rivalStanding: 30, drift: 0 })).pressure);
  });

  it("reports the cost the engine is actually charging, not a made-up number", () => {
    const s = at({ rivalStanding: 60, drift: 0 });
    const over = rivalPressure(library, s) - cfg.rivalStart;
    expect(rivalReport(library, s).cost).toContain((over * cfg.rivalElectionPull).toFixed(1));
  });

  it("says so when the coalition is already under the bar", () => {
    const s = at({ rivalStanding: 70, drift: 0, meters: { ...base().meters, base: 5, backers: 5, public: 5 } });
    expect(rivalReport(library, s).cost).toContain(STRINGS.rival.costs.behind);
  });
});
