import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { Side } from "../../src/engine/types";
import { allUnlockTokens } from "../../src/meta/objectives";
import { BOTS, makeContext } from "../../src/sim";

/**
 * The two endings no bot reached in the audit of v0.64.0 (BACKLOG-10 phase 58): `country_decided`
 * and `clean_hands`. Both end a story, `arc_referendum` and `arc_truth`, on its honest side; both
 * stories wait for an unlock the harness plays without, and the ending is a choice to go, which a
 * bot never takes while the other side lets it stay. A person who wants the ending can have it.
 */

/** The informed voter, except that it takes the honest side on every card of one story. */
function playFor(prefix: string, seed: number): string | undefined {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s = newRun(library, seed, rollSetup(library, seed, seed % 2 ? "left" : "right", allUnlockTokens()));
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    const honest: Side = (card.left.drift ?? 0) >= (card.right.drift ?? 0) ? "left" : "right";
    const side = card.id.startsWith(prefix) ? honest : BOTS.informed(makeContext(library, s, card, rng, { danger: 25 }));
    s = resolve(library, s, card.id, side);
  }
  return s.over?.endingId;
}

describe("the endings no bot takes", () => {
  it.each([
    ["arc_re", "country_decided", "u_referendum"],
    ["arc_tr", "clean_hands", "u_truth"],
  ])("%s's end, %s, is there for a player who chooses it", (prefix, ending, unlock) => {
    // Behind an unlock, and at the end of the story's honest road.
    const story = [...library.arcs.values()].find((a) => a.cards[0]!.startsWith(prefix))!;
    expect(story.requires).toBe(unlock);
    const last = getCard(library, story.cards.at(-1)!);
    const honest: Side = (last.left.drift ?? 0) >= (last.right.drift ?? 0) ? "left" : "right";
    expect(last[honest].ending).toBe(ending);
    // A player who follows the story to it gets there within a few dozen runs.
    let reached = 0;
    for (let seed = 1; seed <= 60 && reached === 0; seed++) if (playFor(prefix, seed) === ending) reached = seed;
    expect(reached, `no run of 60 reached ${ending}`).toBeGreaterThan(0);
  }, 60_000);
});
