import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { exitBand, newRun } from "../../src/engine/state";
import type { Band, GameState } from "../../src/engine/types";
import { HISTORY_ORDER, LEGACIES, emptyMeta, followUpKey, foldRun, historyOfRun, migrateMeta } from "../../src/meta";

/**
 * What a player has read on an end screen (BACKLOG-13 phase 86): the profile keeps the follow-ups
 * "What became of it" has told, as `flag:band`, beside the endings and epilogues it always kept.
 */

const three = HISTORY_ORDER.filter((f) => LEGACIES[f]).slice(0, 3);
/** A reign seen through in a band, having made these decisions. */
function reign(band: Band, flags: readonly string[]): GameState {
  const s = newRun(library, 7, { align: "left" });
  return {
    ...s,
    band,
    bandLocked: true,
    cardCount: 105,
    era: 3,
    flags: [...s.flags, ...flags],
    flagSince: { ...s.flagSince, ...Object.fromEntries(flags.map((f, i) => [f, 10 + i])) },
    over: { endingId: `finale_${band}`, epilogueKey: `${band}:left:3` },
  };
}

describe("the follow-ups read", () => {
  it("are kept as each end screen tells them, each once, and read back the next time", () => {
    const first = foldRun(library, emptyMeta(), reign("muddle", three.slice(0, 2)));
    expect(first.read.followUps).toEqual([]);
    expect(first.meta.followUpsRead).toEqual(three.slice(0, 2).map((f) => followUpKey(f, "muddle")));
    const second = foldRun(library, first.meta, reign("muddle", three));
    expect(second.read.followUps).toEqual(three.slice(0, 2).map((f) => followUpKey(f, "muddle")));
    expect(second.meta.followUpsRead).toEqual(three.map((f) => followUpKey(f, "muddle")));
  });

  it("are read in the band they were told in: the same decision ended elsewhere says something new", () => {
    const meta = foldRun(library, emptyMeta(), reign("muddle", three)).meta;
    const run = reign("ascent", three);
    expect(exitBand(library, run)).toBe("ascent");
    const fold = foldRun(library, meta, run);
    expect(fold.read.followUps).toEqual([]);
    expect(historyOfRun(library, run, "ascent").consequences.map((c) => c.after)).not.toEqual(
      historyOfRun(library, reign("muddle", three), "muddle").consequences.map((c) => c.after),
    );
  });

  it("say whether the ending's words and the epilogue were read, whatever else the run did", () => {
    const meta = foldRun(library, emptyMeta(), reign("decay", [])).meta;
    const fold = foldRun(library, meta, reign("decay", three));
    expect(fold.read.ending).toBe(true);
    expect(fold.read.epilogue).toBe(true);
    const elsewhere = foldRun(library, meta, reign("ascent", []));
    expect(elsewhere.read).toEqual({ ending: false, epilogue: false, followUps: [] });
  });

  it("are read back from a saved profile carefully, since one can arrive in a link", () => {
    const old = { ...emptyMeta(), v: 11 } as Record<string, unknown>;
    delete old.followUpsRead;
    expect(migrateMeta(old)!.followUpsRead).toEqual([]);
    const sent = {
      ...emptyMeta(),
      followUpsRead: ["seawall:ascent", "seawall:ascent", "seawall:sideways", 7, "Seawall:muddle", "none:decay", "x".repeat(70) + ":muddle"],
    };
    expect(migrateMeta(sent)!.followUpsRead).toEqual(["seawall:ascent", "none:decay"]);
  });
});
