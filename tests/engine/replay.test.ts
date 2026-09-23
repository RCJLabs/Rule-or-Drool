import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { MANDATES } from "../../src/engine/mandates";
import { canRetrace, replays, replayTo } from "../../src/engine/replay";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign } from "../../src/engine/types";
import { allUnlockTokens } from "../../src/meta/objectives";
import { BOT_NAMES, BOTS, makeContext } from "../../src/sim";

/**
 * A run played the way the game plays one, keeping the state at every card: `states[k]` has
 * the k-th card on the table, and the last is the run as it ended.
 */
function playKeeping(seed: number): GameState[] {
  const align: PlayerAlign = seed % 2 ? "left" : "right";
  const unlocked = seed % 3 === 0 ? allUnlockTokens() : [];
  const mandate = seed % 4 === 0 ? MANDATES[seed % MANDATES.length]!.id : null;
  const bot = BOT_NAMES[seed % BOT_NAMES.length]!;
  const rng = makeRng(seed ^ 0x5bd1e995);
  let s = draw(library, newRun(library, seed, { ...rollSetup(library, seed, align, unlocked), mandate }));
  const states = [s];
  while (!s.over) {
    const side = BOTS[bot](makeContext(library, s, getCard(library, s.current!), rng, { danger: 25 }));
    s = draw(library, resolve(library, s, s.current!, side));
    states.push(s);
  }
  return states;
}

describe("going back to a card", () => {
  it("puts the run back exactly as it stood, at any card, across a thousand seeded runs", () => {
    // Every bot, both sides, with and without the unlocks and a promise, so the setup has to
    // be dealt again the same way too. Four cards a run: the first, the last and two between.
    let checked = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      const states = playKeeping(seed);
      const last = states[states.length - 1]!;
      expect(canRetrace(last)).toBe(true);
      // And the whole record, replayed, ends where the run ended, as saved and loaded back.
      if (seed % 10 === 0) expect(replays(library, JSON.parse(JSON.stringify(last)) as GameState), `seed ${seed}`).toBe(true);
      const n = last.cardCount;
      const r = makeRng(seed * 7919);
      for (const k of new Set([0, n, Math.floor(r() * n), Math.floor(r() * n)])) {
        const back = replayTo(library, last, k);
        if (JSON.stringify(back) !== JSON.stringify(states[k])) expect(back, `seed ${seed}, card ${k}`).toEqual(states[k]);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(3000);
  }, 60_000);

  it("refuses to hand back a run that parts from its record", () => {
    const last = playKeeping(12).at(-1)!;
    const tampered = { ...last, choices: last.choices!.map((c, i) => (i === 5 ? (["not_a_card", c[1]] as typeof c) : c)) };
    expect(replayTo(library, tampered, 4)).not.toBeNull();
    expect(replayTo(library, tampered, 6)).toBeNull();
    expect(replayTo(library, last, last.cardCount + 1)).toBeNull();
  });

  it("knows which runs it can retrace: a record of every card, and nothing less", () => {
    const last = playKeeping(13).at(-1)!;
    expect(canRetrace(last)).toBe(true);
    expect(canRetrace({ ...last, choices: null })).toBe(false);
    // What a run looks like when a save was edited to jump ahead, as the audits do.
    expect(canRetrace({ ...last, cardCount: last.cardCount + 40 })).toBe(false);
  });
});
