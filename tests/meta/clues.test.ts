import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { CLUES, RUMOURS_AT_ONCE, collectsEnding, emptyMeta, rumours, withinReach, type MetaState } from "../../src/meta";

/**
 * A clue to every ending (BACKLOG-10 phase 58): what an ending is made of, never its name, and one
 * at a time, so the codex gives a player something to aim at without a list to work down.
 */

// A first term's end is not collected, so it has no clue (BACKLOG-10 phase 59).
const endings = [...library.endings.values()].filter((e) => collectsEnding(e.id));
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

  it("tell a long reign's length as its eras do (BACKLOG-11 phase 66)", () => {
    // Five eras, the last "Five centuries on": the clue said two centuries survived.
    const last = STRINGS.eras[library.config.longEraCount - 1]!.name.split(" ").slice(0, 2).join(" ");
    for (const band of ["decay", "muddle", "ascent"]) expect(CLUES[`finale_long_${band}`], band).toContain(last);
  });

  it("are all different", () => {
    expect(new Set(Object.values(CLUES)).size).toBe(Object.keys(CLUES).length);
  });
});

describe("the rumours", () => {
  it("offer one clue at a time, to an ending the profile can reach", () => {
    expect(RUMOURS_AT_ONCE).toBe(1);
    const r = rumours(library, meta());
    expect(r).toHaveLength(1);
    expect(withinReach(library, meta(), r[0]!)).toBe(true);
  });

  it("move on by one with every run, and come round again", () => {
    const at = (runs: number, n = RUMOURS_AT_ONCE) => rumours(library, meta({ runs }), n);
    expect(at(1, 3).slice(0, -1)).toEqual(at(0, 3).slice(1));
    expect(at(1)).not.toEqual(at(0));
    const open = rumours(library, meta(), library.endings.size);
    expect(at(open.length)).toEqual(at(0));
    // Every clue within reach turns up in time.
    const seen = new Set(Array.from({ length: open.length }, (_, runs) => at(runs)).flat());
    expect(seen.size).toBe(open.length);
  });

  it("leave out what is found and what the codex already names as near", () => {
    const [a, b, c] = rumours(library, meta(), 3);
    const next = rumours(library, meta({ endings: { [a!]: 1 }, nearMissed: [b!] }), 3);
    expect(next).not.toContain(a);
    expect(next).not.toContain(b);
    expect(next[0]).toBe(c);
  });

  it("keep quiet about what waits on an unlock or the long reign until it opens", () => {
    const all = (m: MetaState) => rumours(library, m, library.endings.size);
    for (const id of LOCKED) expect(all(meta()), id).not.toContain(id);
    expect(all(meta()).length).toBe(endings.length - LOCKED.length);
    const opened = meta({ unlocks: ["u_referendum", "u_truth"], objectives: { obj_finale: 1 } });
    for (const id of LOCKED) expect(all(opened), id).toContain(id);
  });

  it("run out when everything is found", () => {
    const everything = Object.fromEntries(endings.map((e) => [e.id, 1]));
    expect(rumours(library, meta({ endings: everything }))).toEqual([]);
  });
});
