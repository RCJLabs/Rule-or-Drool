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
    const code: RunCode = { seed: 123456789, align: "left", modifiers: ["crisis_war", "trait_orator", "flaw_vain"], unlocked: ["u_truth", "u_dissident"], mandates: ["m_broad"] };
    const text = encodeRunCode(code);
    expect(text).toBe("1.21i3v9.L.crisis_war~trait_orator~flaw_vain.u_dissident~u_truth.m_broad");
    expect(decodeRunCode(library, text)).toEqual({ ok: true, code: { ...code, unlocked: ["u_dissident", "u_truth"] } });
  });

  it("reproduces the whole run for someone whose profile is different", () => {
    const veteran = allUnlockTokens();
    for (const seed of [11, 222, 3333, 44444]) {
      for (const align of ["left", "right"] as PlayerAlign[]) {
        // The sender is fully unlocked; the code is all the receiver gets.
        const theirs = beginRun(library, seed, align, veteran, []);
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
      const code = dailyCode(library, seed, align, []);
      // It no longer matters what either of them has unlocked: both start from the code.
      expect(code.unlocked).toEqual([]);
      expect(cardsOf(beginRunFromCode(library, code))).toEqual(cardsOf(beginRunFromCode(library, dailyCode(library, seed, align, []))));
      // And it is the base game: the setup a profile with nothing unlocked would roll.
      expect(code.modifiers).toEqual(rollSetup(library, seed, align, []).modifiers);
    }
  });

  it("refuses a code it cannot reproduce rather than starting a different run", () => {
    expect(decodeRunCode(library, "nonsense")).toEqual({ ok: false, reason: "format" });
    expect(decodeRunCode(library, "3.abc.L.-.-.-")).toEqual({ ok: false, reason: "version" });
    // Format 2 is a long reign's, with the era count as a seventh part (BACKLOG-5 phase 39).
    expect(decodeRunCode(library, "2.abc.L.-.-.-")).toEqual({ ok: false, reason: "format" });
    // Only this game's long reign is written in format 2, and an era count is a number.
    expect(decodeRunCode(library, "2.abc.L.-.-.-.4")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "2.abc.L.-.-.-.3")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "2.abc.L.-.-.-.x")).toEqual({ ok: false, reason: "format" });
    expect(decodeRunCode(library, "2.abc.L.-.-.-.5")).toMatchObject({ ok: true, code: { eraCount: 5 } });
    expect(decodeRunCode(library, "1.abc.X.-.-.-")).toEqual({ ok: false, reason: "format" });
    expect(decodeRunCode(library, "1.abc.L.crisis_meteor.-.-")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.L.-.u_nothing.-")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.L.-.-.m_nothing")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.R.-.-.-").ok).toBe(true);
  });

  it("describes where a run started, not what it became", () => {
    const s = newRun(library, 5, { ...rollSetup(library, 5, "right", []), mandates: [] });
    const later = { ...s, cardCount: 80, flags: [...s.flags, "seawall"], mandatesBroken: { m_broad: 12 } };
    expect(runCodeOf(later)).toEqual(runCodeOf(s));
  });

  it("carries a platform of two in the promise slot, in the catalog's order (BACKLOG-10 phase 62)", () => {
    const code: RunCode = { seed: 99, align: "right", modifiers: [], unlocked: [], mandates: ["m_loyal", "m_broad"] };
    const text = encodeRunCode(code);
    expect(text).toBe("1.2r.R.-.-.m_broad~m_loyal");
    expect(decodeRunCode(library, text)).toEqual({ ok: true, code: { ...code, mandates: ["m_broad", "m_loyal"] } });
    // Read in either order, it is one run.
    expect(decodeRunCode(library, "1.2r.R.-.-.m_loyal~m_broad")).toEqual(decodeRunCode(library, text));
    const run = beginRunFromCode(library, (decodeRunCode(library, text) as { code: RunCode }).code);
    expect(run.mandates).toEqual(["m_broad", "m_loyal"]);
    expect(encodeRunCode(runCodeOf(run))).toBe(text);
    // A code with one promise is the code it always was.
    expect(encodeRunCode({ ...code, mandates: ["m_broad"] })).toBe("1.2r.R.-.-.m_broad");
  });

  it("refuses a platform this game would not start", () => {
    expect(decodeRunCode(library, "1.abc.L.-.-.m_clean~m_decree")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.L.-.-.m_broad~m_broad")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.L.-.-.m_broad~m_loyal~m_clean")).toEqual({ ok: false, reason: "content" });
    expect(decodeRunCode(library, "1.abc.L.-.-.m_broad~m_nothing")).toEqual({ ok: false, reason: "content" });
  });
});
