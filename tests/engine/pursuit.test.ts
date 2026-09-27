import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { carriersOf, pursuable, pursuedArcs, pursuitProblem, sideToward } from "../../src/engine/pursuit";
import { replayTo } from "../../src/engine/replay";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { GameState, PlayerAlign, RunSetup } from "../../src/engine/types";
import { endingKind, endingSides } from "../../src/meta/clues";
import { collectsEnding } from "../../src/meta/objectives";
import { BOTS, makeContext, pursue } from "../../src/sim";

/**
 * Endings you can go looking for (BACKLOG-13 phase 83): a run looking for one is dealt its story,
 * or its question, first of those that can start, and sooner; every other run deals as it did.
 */

const ordinary = (align: PlayerAlign, extra: Partial<Parameters<typeof pursuitProblem>[1]> = {}) => ({
  align,
  eraCount: library.config.eraCount,
  unlocked: [],
  ...extra,
});
/** Every ending a choice in a story takes, and the sides that can take it. */
const CHOSEN = [...library.endings.keys()].filter((id) => endingKind(library, id) === "chosen" && collectsEnding(id));

/** A run played to its end by a bot, looking for `ending` or for nothing: whether the ending was offered, and the run. */
function played(seed: number, align: PlayerAlign, ending: string, looking: boolean, setup: Partial<RunSetup> = {}): { offered: boolean; state: GameState } {
  const unlocked = [
    ...new Set(
      carriersOf(library, ending, align)
        .map((id) => library.arcs.get(id)!.requires)
        .filter((u): u is string => !!u),
    ),
  ];
  const rng = makeRng(seed ^ 0x5bd1e995);
  const bot = pursue(BOTS.eyes, ending);
  let s = draw(library, newRun(library, seed, { ...rollSetup(library, seed, align, unlocked), ...setup, ...(looking ? { pursuit: ending } : {}) }));
  let offered = false;
  while (!s.over) {
    const card = getCard(library, s.current!);
    if (card.left.ending === ending || card.right.ending === ending) offered = true;
    s = draw(library, resolve(library, s, card.id, bot(makeContext(library, s, card, rng, { danger: 25 }))));
  }
  return { offered, state: s };
}

describe("the endings a run can go looking for", () => {
  it("are every ending a choice in a story takes, on every side the codex says can reach it", () => {
    expect(CHOSEN.length).toBe(58);
    for (const id of CHOSEN) {
      expect(pursuable(library, id), id).toBe(true);
      for (const side of endingSides(library, id)) expect(carriersOf(library, id, side).length, `${id} for ${side}`).toBeGreaterThan(0);
    }
    // A finale, a meter's edge, a first term's end and a name that is no ending cannot be looked for.
    for (const id of ["finale_ascent", "bankruptcy", "coup", "first_term_muddle", "nonsense"]) expect(pursuable(library, id), id).toBe(false);
  });

  it("take the run along its story: the side that leads to the ending, and the ending when it comes", () => {
    const [sm1, sm2, sm3] = ["arc_sm1", "arc_sm2", "arc_sm3"].map((id) => getCard(library, id));
    expect(sideToward(library, sm1!, "leader_for_life", "right")).toBe("left");
    expect(sideToward(library, sm2!, "leader_for_life", "right")).toBe("left");
    // The general's last card ends the run either way: accepting the title is one ending, refusing it another.
    expect(sideToward(library, sm3!, "leader_for_life", "right")).toBe("left");
    expect(sideToward(library, sm3!, "assassination", "right")).toBe("right");
    // Off the way, and on a card of another story, there is nothing to follow.
    expect(sideToward(library, getCard(library, "arc_cp1"), "leader_for_life", "right")).toBeNull();
    // The strongman is the Right's story, so the Left cannot follow it anywhere.
    expect(sideToward(library, sm1!, "leader_for_life", "left")).toBeNull();
  });

  it("say why a run cannot look: the side, a term too short, a lock, or a country that settled it", () => {
    expect(pursuitProblem(library, ordinary("right"), "leader_for_life")).toBeNull();
    expect(pursuitProblem(library, ordinary("left"), "leader_for_life")).toBe("side");
    // Secession starts in the second era at the earliest.
    expect(pursuitProblem(library, ordinary("left", { eraCount: 1 }), "exile")).toBe("short");
    expect(pursuitProblem(library, ordinary("left", { eraCount: 1 }), "the_posters")).toBeNull();
    expect(pursuitProblem(library, ordinary("left"), "country_decided")).toBe("locked");
    expect(pursuitProblem(library, ordinary("left", { unlocked: ["u_referendum"] }), "country_decided")).toBeNull();
    // The purge already begun, taken over from the last reign, is not begun again (BACKLOG-10 phase 63).
    const took = { band: "decay" as const, line: 2, legacies: ["purge_begun"], rival: null, rivalStanding: 40 };
    expect(pursuitProblem(library, ordinary("left", { inheritance: took }), "purge_consumed")).toBe("settled");
    expect(pursuitProblem(library, ordinary("left"), "finale_ascent")).toBe("unknown");
  });

  it("go into a run only when its setup can reach them", () => {
    const setup = rollSetup(library, 7, "right", []);
    expect(newRun(library, 7, { ...setup, pursuit: "leader_for_life" }).pursuit).toBe("leader_for_life");
    expect(newRun(library, 7, setup).pursuit).toBeUndefined();
    expect(() => newRun(library, 7, { ...rollSetup(library, 7, "left", []), pursuit: "leader_for_life" })).toThrow(/side/);
    expect(() => newRun(library, 7, { ...setup, pursuit: "finale_ascent" })).toThrow(/unknown/);
    expect(() => newRun(library, 7, { ...setup, eraCount: 1, pursuit: "exile" })).toThrow(/short/);
  });
});

describe("a run looking for an ending", () => {
  it("is dealt its story first and sooner, and a player following the rumour is offered it most of the time", () => {
    // Twelve runs for each ending and side, the eyes bot following the rumour: measured over 200
    // a case, 93.4% of pursued runs were offered their ending, and 15.7% of the same runs not looking.
    let looking = 0;
    let not = 0;
    let runs = 0;
    for (const id of CHOSEN) {
      for (const side of endingSides(library, id)) {
        for (let k = 0; k < 12; k++) {
          const seed = 870_000 + k;
          if (played(seed, side, id, true).offered) looking++;
          if (played(seed, side, id, false).offered) not++;
          runs++;
        }
      }
    }
    expect(looking / runs).toBeGreaterThan(0.85);
    expect(not / runs).toBeLessThan(0.3);
  }, 240_000);

  it("finds a story with no country to wait on nearly every time, early", () => {
    for (const [id, side] of [
      ["the_posters", "left"],
      ["impeachment", "right"],
      ["honours_list", "right"],
    ] as const) {
      let offered = 0;
      for (let k = 0; k < 40; k++) if (played(880_000 + k, side, id, true).offered) offered++;
      expect(offered, id).toBeGreaterThanOrEqual(36);
    }
  });

  it("deals nothing differently until the story it looks for can start", () => {
    // The strongman waits for order above 52. Until the first card on which it could start, a run
    // looking for it meets the very cards a run not looking does.
    for (let seed = 1; seed <= 30; seed++) {
      const setup = rollSetup(library, seed, "right", []);
      let a = draw(library, newRun(library, seed, setup));
      let b = draw(library, newRun(library, seed, { ...setup, pursuit: "leader_for_life" }));
      const sought = pursuedArcs(library, b);
      for (let i = 0; i < 60 && !a.over && !b.over; i++) {
        if (a.current !== b.current) {
          // They part on the card where the pursued story starts, or after it began.
          expect(b.activeArcs.some((x) => sought.has(x.id)) || library.cards.get(b.current!)?.arc === "arc_strongman", `seed ${seed} card ${i}`).toBe(true);
          break;
        }
        a = draw(library, resolve(library, a, a.current!, "left"));
        b = draw(library, resolve(library, b, b.current!, "left"));
      }
    }
  });

  it("is put back card for card by its own record, the pursuit with it", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { state } = played(seed, "left", "the_posters", true);
      expect(state.pursuit).toBe("the_posters");
      const back = replayTo(library, state, state.cardCount - 1);
      expect(back?.current, `seed ${seed}`).toBe(state.choices![state.cardCount - 1]![0]);
      expect(back?.pursuit).toBe("the_posters");
    }
  });
});
