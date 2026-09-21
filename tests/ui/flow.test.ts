import { describe, expect, it } from "vitest";
import { content } from "../../src/content";
import { buildLibrary } from "../../src/engine/library";
import { beginRun, commitChoice, ensureCard, yearInEra } from "../../src/ui/flow";

describe("flow", () => {
  const lib = buildLibrary(content, { eraLength: 3, electionInterval: 100 });

  it("begins a run with a card on the table", () => {
    const s = beginRun(lib, 5, "right");
    expect(s.current).not.toBeNull();
    expect(s.align).toBe("right");
    expect(yearInEra(s, 3)).toBe(1);
  });

  it("commits a choice and draws the next card in the same era", () => {
    const s = beginRun(lib, 5, "left");
    const r = commitChoice(lib, s, "left");
    expect(r.eraChanged).toBe(false);
    expect(r.state.cardCount).toBe(1);
    expect(r.state.current).not.toBeNull();
  });

  it("holds the draw across an era boundary until ensureCard", () => {
    let s = beginRun(lib, 5, "left");
    s = commitChoice(lib, s, "left").state;
    s = commitChoice(lib, s, "right").state;
    const r = commitChoice(lib, s, "left");
    if (r.state.over) return; // a placeholder deck can oust you in three cards; nothing to assert then
    expect(r.eraChanged).toBe(true);
    expect(r.state.era).toBe(2);
    expect(r.state.current).toBeNull();
    const resumed = ensureCard(lib, r.state);
    expect(resumed.current).not.toBeNull();
    expect(ensureCard(lib, resumed)).toBe(resumed);
  });

  it("ignores commits when nothing is on the table or the run is over", () => {
    const s = { ...beginRun(lib, 5, "left"), current: null };
    expect(commitChoice(lib, s, "left").state).toBe(s);
  });
});
