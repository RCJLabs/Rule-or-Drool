import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { CLUES, RUMOURS_AT_ONCE, emptyMeta, rumours, withinReach, type MetaState } from "../../src/meta";

/**
 * A clue to every ending (BACKLOG-10 phase 58): what an ending is made of, never its name, and a
 * few at a time, so the codex gives a player something to aim at without a list to work down.
 */

const endings = [...library.endings.values()];
const LOCKED = ["country_decided", "clean_hands", "finale_long_decay", "finale_long_muddle", "finale_long_ascent"];
const meta = (patch: Partial<MetaState> = {}): MetaState => ({ ...emptyMeta(), ...patch });

describe("the clues", () => {
  it("cover every ending, and nothing else", () => {
    expect(Object.keys(CLUES).sort()).toEqual(endings.map((e) => e.id).sort());
  });

  it("never give the ending's name, and fit a line of the codex", () => {
    const words = (s: string) => s.toLowerCase().replace(/^the /, "");
    for (const e of endings) {
      const clue = CLUES[e.id]!;
      expect(clue.toLowerCase(), e.id).not.toContain(words(e.title));
      expect(clue.length, e.id).toBeLessThanOrEqual(80);
      expect(clue, e.id).toMatch(/^[A-Z].*\.$/);
    }
  });

  it("are all different", () => {
    expect(new Set(Object.values(CLUES)).size).toBe(Object.keys(CLUES).length);
  });
});

describe("the rumours", () => {
  it("offer a few clues to a new profile, from endings it can reach", () => {
    const r = rumours(library, meta());
    expect(r).toHaveLength(RUMOURS_AT_ONCE);
    for (const id of r) expect(withinReach(library, meta(), id), id).toBe(true);
  });

  it("move on by one with every run, and come round again", () => {
    const at = (runs: number) => rumours(library, meta({ runs }));
    expect(at(1).slice(0, -1)).toEqual(at(0).slice(1));
    expect(at(1)).not.toEqual(at(0));
    const open = rumours(library, meta(), library.endings.size);
    expect(at(open.length)).toEqual(at(0));
    // Every clue within reach turns up in time.
    const seen = new Set(Array.from({ length: open.length }, (_, runs) => at(runs)).flat());
    expect(seen.size).toBe(open.length);
  });

  it("leave out what is found and what the codex already names as near", () => {
    const [a, b, c] = rumours(library, meta());
    const next = rumours(library, meta({ endings: { [a!]: 1 }, nearMissed: [b!] }));
    expect(next).not.toContain(a);
    expect(next).not.toContain(b);
    expect(next[0]).toBe(c);
  });

  it("keep quiet about what waits on an unlock or the long reign until it opens", () => {
    const all = (m: MetaState) => rumours(library, m, library.endings.size);
    for (const id of LOCKED) expect(all(meta()), id).not.toContain(id);
    expect(all(meta()).length).toBe(library.endings.size - LOCKED.length);
    const opened = meta({ unlocks: ["u_referendum", "u_truth"], objectives: { obj_finale: 1 } });
    for (const id of LOCKED) expect(all(opened), id).toContain(id);
  });

  it("run out when everything is found", () => {
    const everything = Object.fromEntries(endings.map((e) => [e.id, 1]));
    expect(rumours(library, meta({ endings: everything }))).toEqual([]);
  });
});
