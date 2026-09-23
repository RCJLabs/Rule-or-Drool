import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { buildLibrary, getCard } from "../../src/engine/library";
import { replays, replayTo } from "../../src/engine/replay";
import { applyChoice, applyEraPassive, resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { exitBand, isLongReign, newRun, rollSetup } from "../../src/engine/state";
import type { Band, GameState } from "../../src/engine/types";
import { decodeRunCode, encodeRunCode, runCodeOf, setupOf } from "../../src/meta";
import { BOT_NAMES, BOTS, makeContext, type BotName } from "../../src/sim";
import { ev, makeFixture } from "../fixtures/content";

/**
 * The long reign (BACKLOG-5 phase 39): the two eras 5.3 described and the MVP left out, two
 * centuries on and five centuries on, for a run that chooses them.
 */

const LONG = library.config.longEraCount;
const ORDINARY = library.config.eraCount;
const LEN = library.config.eraLength;

/** A bot's run to its end, from a setup; the same seed and bot make the same choices. */
function play(seed: number, bot: BotName, eraCount?: number): GameState {
  const rng = makeRng(seed ^ 0x5bd1e995);
  const setup = rollSetup(library, seed, seed % 2 ? "left" : "right", []);
  let s = draw(library, newRun(library, seed, eraCount === undefined ? setup : { ...setup, eraCount }));
  while (!s.over) {
    const card = getCard(library, s.current!);
    s = draw(library, resolve(library, s, card.id, BOTS[bot](makeContext(library, s, card, rng, { danger: 25 }))));
  }
  return s;
}

const sameRun = (s: GameState) => JSON.stringify({ ...s, eraCount: undefined });

describe("a long reign", () => {
  it("is the ordinary run on its setup, card for card, until its fourth era", () => {
    let outlasted = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const bot = BOT_NAMES[seed % BOT_NAMES.length]!;
      const ordinary = play(seed, bot);
      const long = play(seed, bot, LONG);
      if (ordinary.over!.endingId.startsWith(library.config.finalePrefix)) {
        // The ordinary run ended in its finale on card 105; the long one went on from there.
        outlasted++;
        expect(long.choices!.slice(0, ordinary.cardCount), `seed ${seed}`).toEqual(ordinary.choices);
        expect(long.cardCount).toBeGreaterThan(ordinary.cardCount);
      } else {
        // An ouster before the end of era 3 is the same ouster in both.
        expect(sameRun(long), `seed ${seed}`).toBe(sameRun(ordinary));
      }
    }
    expect(outlasted).toBeGreaterThan(40);
  });

  it("locks the direction as it enters its fourth era, and ends in a finale of its own", () => {
    let finales = 0;
    for (let seed = 200; seed < 260; seed++) {
      const run = play(seed, "mixed", LONG);
      expect(run.eraCount).toBe(LONG);
      expect(isLongReign(library, run)).toBe(true);
      if (run.era < ORDINARY + 1) continue;
      expect(run.bandLocked, `seed ${seed}`).toBe(true);
      // The band the first three eras set is the one it ends in, whatever drift did since.
      const at105 = replayTo(library, run, ORDINARY * LEN)!;
      expect(at105.era).toBe(ORDINARY + 1);
      expect(exitBand(library, run)).toBe(at105.band);
      if (run.over!.endingId.startsWith(library.config.longFinalePrefix)) {
        finales++;
        expect(run.cardCount).toBe(LONG * LEN);
        expect(run.over!.endingId).toBe(`${library.config.longFinalePrefix}${at105.band}`);
        expect(run.over!.epilogueKey.endsWith(`:${LONG}`)).toBe(true);
      }
    }
    expect(finales).toBeGreaterThan(20);
  });

  it("never ends an ordinary run in a long finale, or a long one in an ordinary finale", () => {
    for (let seed = 300; seed < 340; seed++) {
      const ordinary = play(seed, "greedy");
      expect(ordinary.over!.endingId.startsWith(library.config.longFinalePrefix)).toBe(false);
      expect(ordinary.era).toBeLessThanOrEqual(ORDINARY);
      const long = play(seed, "greedy", LONG);
      const id = long.over!.endingId;
      if (id.startsWith(library.config.finalePrefix)) expect(id.startsWith(library.config.longFinalePrefix)).toBe(true);
    }
  });

  it("is kept whole by its choices: it replays, and its code starts it again", () => {
    const run = play(17, "mixed", LONG);
    expect(run.cardCount).toBeGreaterThan(ORDINARY * LEN);
    expect(replays(library, run)).toBe(true);
    const code = encodeRunCode(runCodeOf(run));
    expect(code.startsWith("2.")).toBe(true);
    expect(code.split(".").at(-1)).toBe(String(LONG));
    const back = decodeRunCode(library, code);
    expect(back).toEqual({ ok: true, code: runCodeOf(run) });
    expect(newRun(library, run.seed, setupOf(runCodeOf(run))).eraCount).toBe(LONG);
    // An ordinary run's code is the code it always was: format 1, six parts, no era count.
    const ordinary = play(17, "mixed");
    expect(encodeRunCode(runCodeOf(ordinary)).split(".")).toHaveLength(6);
    expect(runCodeOf(ordinary).eraCount).toBeUndefined();
  });
});

describe("a draw that has to widen", () => {
  // A thin deck: era 1's only card is spent, era 2 has one, and era 4 has one. A draw in an
  // empty cell widens to other eras, and may only widen to eras the run can reach.
  const election = (id: string, eras: number[]) => ({
    ...ev(id, { eras }),
    type: "election" as const,
    left: { label: "honest", honest: true },
    right: { label: "cheat", drift: -5 },
  });
  const thin = buildLibrary(
    { ...makeFixture(), arcs: [], cards: [ev("a1", { eras: [1], oneShot: true }), ev("b2", { eras: [2] }), ev("late", { eras: [4] }), election("el2", [2]), election("el4", [4])] },
    { eraLength: 1000, electionInterval: 1000, arcEntryProb: 0 },
  );
  const at = (era: number, eraCount?: number, patch: Partial<GameState> = {}): GameState => ({
    ...newRun(thin, 1, { align: "left", eraCount }),
    era,
    seen: ["a1"],
    ...patch,
  });
  const drawn = (state: GameState) => new Set(Array.from({ length: 40 }, (_, i) => draw(thin, { ...state, rngState: i + 1 }).current));

  it("reaches only the eras the run can be in, cards and elections alike", () => {
    // An ordinary run, and a long reign still in its first three eras, never meet era 4.
    expect(drawn(at(1))).toEqual(new Set(["b2"]));
    expect(drawn(at(1, LONG))).toEqual(new Set(["b2"]));
    expect(drawn(at(1, undefined, { nextElectionAt: 0 }))).toEqual(new Set(["el2"]));
    expect(drawn(at(1, LONG, { nextElectionAt: 0 }))).toEqual(new Set(["el2"]));
    // A long reign in its fifth era, whose own cell is empty, may reach back to the fourth.
    expect(drawn(at(5, LONG)).has("late")).toBe(true);
    expect(drawn(at(5, LONG, { nextElectionAt: 0 })).has("el4")).toBe(true);
  });
});

describe("the long reign's eras", () => {
  /** A run standing in an era and a band, on a card with no condition. */
  const standing = (era: number, band: Band): GameState => ({ ...newRun(library, 5, { align: "left", eraCount: LONG }), era, band, bandLocked: era > ORDINARY });
  const plain = library.content.cards.find((c) => c.type === "event" && !c.cond && c.left.fx?.money && c.speaker === "chief")!;

  it("takes everything harder in Decay and softer on the Ascent in the fifth", () => {
    const moved = (s: GameState) => applyChoice(library, s, plain, "left").meters.money - s.meters.money;
    const rule = library.config.eraRules[LONG - 1]!;
    expect(rule.bandVolatility?.decay).toBeGreaterThan(1);
    expect(rule.bandVolatility?.ascent).toBeLessThan(1);
    expect(Math.abs(moved(standing(LONG, "decay")))).toBeGreaterThan(Math.abs(moved(standing(ORDINARY + 1, "decay"))));
    expect(Math.abs(moved(standing(LONG, "ascent")))).toBeLessThanOrEqual(Math.abs(moved(standing(ORDINARY + 1, "ascent"))));
  });

  it("presses on each direction in its own way in the fifth", () => {
    const rule = library.config.eraRules[LONG - 1]!;
    const every = rule.passiveEvery!;
    for (const band of ["decay", "muddle", "ascent"] as const) {
      const s = { ...standing(LONG, band), cardCount: every * 30 };
      const after = applyEraPassive(library, s);
      const pressed = rule.bandPassive![band]!;
      for (const [meter, delta] of Object.entries(pressed)) expect(after.meters[meter as "base"] - s.meters[meter as "base"], `${band} ${meter}`).toBe(delta);
      // Off the beat, nothing.
      expect(applyEraPassive(library, { ...s, cardCount: every * 30 + 1 }).meters).toEqual(s.meters);
    }
    expect(rule.bandPassive!.decay!.order).toBeLessThan(0);
    expect(rule.bandPassive!.ascent!.inst).toBeGreaterThan(0);
  });

  it("lets the party's own people drift away in the fourth", () => {
    const rule = library.config.eraRules[ORDINARY]!;
    const every = rule.passiveEvery!;
    const s = { ...standing(ORDINARY + 1, "muddle"), cardCount: every * 16 };
    const after = applyEraPassive(library, s);
    for (const [meter, delta] of Object.entries(rule.passive!)) {
      expect(after.meters[meter as "base"] - s.meters[meter as "base"], meter).toBe(delta);
    }
  });
});
