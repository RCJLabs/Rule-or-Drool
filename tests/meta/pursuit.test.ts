import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState } from "../../src/engine/types";
import { canGoLooking, emptyMeta, foldRun, heardRumours, lookingFor, migrateMeta, pursuitFor, withPursuit, type MetaState } from "../../src/meta";

/**
 * Going looking for an ending (BACKLOG-13 phase 83), as the profile keeps it: one rumour at a time,
 * chosen in the codex, held from run to run until the ending is found or the player stops.
 */

const meta = (patch: Partial<MetaState> = {}): MetaState => ({ ...emptyMeta(), runs: 5, ...patch });
/** A rumour of a story's ending, one of a meter's edge, and one of a finale. */
const heard = ["the_posters", "bankruptcy", "finale_ascent"];
const ended = (endingId: string): GameState => ({
  ...newRun(library, 3, rollSetup(library, 3, "left", [])),
  cardCount: 20,
  over: { endingId, epilogueKey: "muddle:left:1" },
});

describe("the rumours a player can go looking for", () => {
  it("are the ones the codex has given, of endings a choice in a story takes", () => {
    const m = meta({ heard });
    for (const id of heard) expect(heardRumours(library, m)).toContain(id);
    expect(canGoLooking(library, m, "the_posters")).toBe(true);
    // No story ends a run at a meter's edge or at a finale: there is nothing to deal first.
    expect(canGoLooking(library, m, "bankruptcy")).toBe(false);
    expect(canGoLooking(library, m, "finale_ascent")).toBe(false);
    // A rumour not heard is not one to look for, nor an ending already found.
    expect(canGoLooking(library, meta(), "the_posters")).toBe(heardRumours(library, meta()).includes("the_posters"));
    expect(canGoLooking(library, meta({ heard, endings: { the_posters: 1 } }), "the_posters")).toBe(false);
  });

  it("are looked for one at a time, until the player stops", () => {
    const m = withPursuit(meta({ heard }), "the_posters");
    expect(lookingFor(library, m)).toBe("the_posters");
    expect(lookingFor(library, withPursuit(m, "impeachment"))).toBeNull();
    expect(withPursuit(m, null).pursuing).toBeUndefined();
    expect(lookingFor(library, withPursuit(m, null))).toBeNull();
  });

  it("are looked for no more once found, whichever run found them", () => {
    const m = withPursuit(meta({ heard }), "the_posters");
    const found = foldRun(library, m, ended("the_posters")).meta;
    expect(found.pursuing).toBeUndefined();
    expect(lookingFor(library, found)).toBeNull();
    // A run that ended another way leaves the looking as it was.
    const not = foldRun(library, m, ended("bankruptcy")).meta;
    expect(not.pursuing).toBe("the_posters");
    expect(lookingFor(library, not)).toBe("the_posters");
  });

  it("say, for the run about to start, whether it can look and why not", () => {
    const m = withPursuit(meta({ heard: ["leader_for_life"] }), "leader_for_life");
    const setup = { eraCount: library.config.eraCount, unlocked: [] };
    expect(pursuitFor(library, m, { ...setup, align: "right" })).toEqual({ id: "leader_for_life", problem: null });
    expect(pursuitFor(library, m, { ...setup, align: "left" })).toEqual({ id: "leader_for_life", problem: "side" });
    expect(pursuitFor(library, meta(), { ...setup, align: "left" })).toBeNull();
  });

  it("travel with the profile, and a name that is not one is dropped", () => {
    expect(migrateMeta(JSON.parse(JSON.stringify(withPursuit(meta({ heard }), "the_posters"))))!.pursuing).toBe("the_posters");
    for (const junk of [42, "The Posters", "", { id: "the_posters" }, "x".repeat(65)]) {
      expect(migrateMeta({ ...meta(), pursuing: junk })!.pursuing, String(junk)).toBeUndefined();
    }
    // A profile from before looked for nothing.
    expect(migrateMeta(meta())!.pursuing).toBeUndefined();
  });
});
