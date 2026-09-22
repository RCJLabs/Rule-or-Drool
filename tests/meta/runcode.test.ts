import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign } from "../../src/engine/types";
import { allUnlockTokens, dailySeed, decodeRunCode, encodeRunCode, runCodeOf, type RunCode } from "../../src/meta";
import { BOTS, makeContext } from "../../src/sim";
import { beginRun, beginRunFromCode, dailyCode } from "../../src/ui/flow";

/** Play a run to the end with a fixed policy, and return every card it drew. */
function cardsOf(start: GameState): { cards: string[]; ending: string } {
  const rng = makeRng(start.seed ^ 0x5bd1e995);
  let s = start;
  const cards: string[] = [];
  while (!s.over && s.cardCount <= 1000) {
    if (!s.current) s = draw(library, s);
    cards.push(s.current!);
    s = resolve(library, s, s.current!, BOTS.mixed(makeContext(library, s, getCard(library, s.current!), rng, { danger: 25 })));
  }
  return { cards, ending: s.over!.endingId };
}

/**
 * A run is shared as its setup, not its seed (BACKLOG-2 phase 11). Measured before this: a
 * new player and a fully unlocked one playing the same daily with the same choices drew a
 * different card by card 10 in 98.3% of runs.
 */
describe("sharing a run", () => {
  it("round-trips through a readable code", () => {
    const code: RunCode = { seed: 123456789, align: "left", modifiers: ["crisis_war", "trait_orator", "flaw_vain"], unlocked: ["u_truth", "u_dissident"], mandate: "m_broad" };
    const text = encodeRunCode(code);
    expect(text).toBe("1.21i3v9.L.crisis_war~trait_orator~flaw_vain.u_dissident~u_truth.m_broad");
    expect(decodeRunCode(library, text)).toEqual({ ok: true, code: { ...code, unlocked: ["u_dissident", "u_truth"] } });
  });

  it("reproduces the whole run for someone whose profile is different", () => {
    const veteran = allUnlockTokens();
    for (const seed of [11, 222, 3333, 44444]) {
      for (const align of ["left", "right"] as PlayerAlign[]) {
        // The sender is fully unlocked; the code is all the receiver gets.
        const theirs = beginRun(library, seed, align, veteran, null);
        const decoded = decodeRunCode(library, encodeRunCode(runCodeOf(theirs)));
        expect(decoded.ok).toBe(true);
        const mine = beginRunFromCode(library, (decoded as { code: RunCode }).code);
        expect(cardsOf(mine)).toEqual(cardsOf(theirs));
      }
    }
  });

  it("makes the daily the same run for a new player and a veteran", () => {
    const seed = dailySeed("2026-09-22");
    for (const align of ["left", "right"] as PlayerAlign[]) {
      const code = dailyCode(library, seed, align, null);
      // It no longer matters what either of them has unlocked: both start from the code.
      expect(code.unlocked).toEqual([]);
      expect(cardsOf(beginRunFromCode(library, code))).toEqual(cardsOf(beginRunFromCode(library, dailyCode(library, seed, align, null))));
      // And it is the base game: the setup a profile with nothing unlocked would roll.
      expect(code.modifiers).toEqual(rollSetup(library, seed, align, []).modifiers);
    }
  });

  it("refuses a code it cannot reproduce rather than starting a different run", () => {
    expect(decodeRunCode(library, "nonsense")).toEqual({ ok: false, reason: "format" });
    expect(decodeRunCode(library, "2.abc.L.-.-.-")).toEqual({ ok: false, reason: "version" });
    expect(decodeRunCode(library, "1.abc.X.-.-.-")).toEqual({ ok: false, reason: "format" });
    expect(decodeRunCode(library, "1.abc.L.crisis_meteor.-.-")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.L.-.u_nothing.-")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.L.-.-.m_nothing")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.R.-.-.-").ok).toBe(true);
  });

  it("describes where a run started, not what it became", () => {
    const s = newRun(library, 5, { ...rollSetup(library, 5, "right", []), mandate: null });
    const later = { ...s, cardCount: 80, flags: [...s.flags, "seawall"] };
    expect(runCodeOf(later)).toEqual(runCodeOf(s));
  });
});
