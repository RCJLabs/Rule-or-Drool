import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { deckStamp } from "../../src/engine/deck";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { exitBand, newRun, rollSetup } from "../../src/engine/state";
import { PLAYER_ALIGNS, type GameState } from "../../src/engine/types";
import {
  SCENARIO_DECK,
  SCENARIO_MEASURE,
  SCENARIO_WEEKS,
  contractById,
  emptyMeta,
  foldRun,
  keepsContract,
  migrateMeta,
  scenarioFor,
  scenarioTry,
  weekNumber,
  withTry,
  type ScenarioWeek,
} from "../../src/meta";
import { BOTS, GOAL_KINDS, goalKindOf, makeContext, measureWeek } from "../../src/sim";

/**
 * The week's scenario (BACKLOG-12 phase 78): one run for everyone each week, measured before it
 * is dealt, and one try at it that counts.
 */

const [lo, hi] = SCENARIO_MEASURE.band;

/** A week's run, dealt as the game deals it, played to its end by the informed voter. */
function played(w: ScenarioWeek, seed = 1): GameState {
  const rng = makeRng(seed);
  let s = newRun(library, w.seed, { ...rollSetup(library, w.seed, w.align, []), mandates: w.mandates });
  while (!s.over) {
    s = draw(library, s);
    const card = getCard(library, s.current!);
    s = resolve(library, s, card.id, BOTS.informed(makeContext(library, s, card, rng, { danger: 25 })));
  }
  return s;
}

describe("the weeks' scenarios", () => {
  it("were measured on this deck, since another deck deals other runs (npm run scenarios -- --from <this week>)", () => {
    expect(SCENARIO_DECK).toBe(deckStamp(library));
  });

  it("run a week at a time from the first week, for three years", () => {
    expect(SCENARIO_WEEKS.map((w) => w.week)).toEqual(Array.from({ length: SCENARIO_WEEKS.length }, (_, i) => i + 1));
    expect(SCENARIO_WEEKS.length).toBeGreaterThanOrEqual(156);
    expect(scenarioFor(weekNumber("2026-09-21"))).toBe(SCENARIO_WEEKS[0]);
    expect(scenarioFor(weekNumber("2026-09-20"))).toBeNull();
    expect(scenarioFor(SCENARIO_WEEKS.length + 1)).toBeNull();
  });

  it("each deal a seed of their own, so a scenario's record names its week by its seed", () => {
    expect(new Set(SCENARIO_WEEKS.map((w) => w.seed)).size).toBe(SCENARIO_WEEKS.length);
  });

  it("each set a goal in the contracts' words, on the side and with the promise it names", () => {
    for (const w of SCENARIO_WEEKS) {
      expect(contractById(w.goal), w.goal).toBeDefined();
      const { kind, param } = goalKindOf(w.goal);
      if (kind.sided) expect(w.align, w.goal).toBe(param);
      expect(PLAYER_ALIGNS).toContain(w.align);
      expect(w.mandates, w.goal).toEqual(kind.promise ? [kind.promise(param)] : []);
      expect(Number.isInteger(w.seed) && w.seed >= 0 && w.seed < 1e9).toBe(true);
    }
    // The weeks take turns at the kinds of goal, so no one kind has the year.
    const kinds = new Set(SCENARIO_WEEKS.slice(0, 52).map((w) => goalKindOf(w.goal).kind.key));
    expect(kinds.size).toBeGreaterThanOrEqual(GOAL_KINDS.length - 2);
  });

  it("are met by the informed voter and the eyes bot in a fifth to a half of their runs", () => {
    for (const w of SCENARIO_WEEKS) for (const r of w.rates) expect(r >= lo && r <= hi, `week ${w.week}: ${w.rates}`).toBe(true);
  });

  it("measure the same again: the table is what the search found, on this engine and deck", () => {
    for (const w of SCENARIO_WEEKS.slice(0, 2)) {
      const { rates, ...run } = w;
      expect(measureWeek(library, run), `week ${w.week}`).toEqual(rates);
    }
  }, 60_000);

  it("deal a run a bot plays the same every time, which is why people are measured as bots that differ", () => {
    const w = SCENARIO_WEEKS[0]!;
    expect(played(w, 1).choices).toEqual(played(w, 2).choices);
  });
});

describe("a week's try", () => {
  const w = SCENARIO_WEEKS[0]!;
  const run = played(w);
  const met = keepsContract(w.goal, run, exitBand(library, run));

  it("is started once: starting it is the try", () => {
    const once = withTry(emptyMeta(), w.week);
    expect(once.scenarios).toEqual([{ week: w.week }]);
    expect(withTry(once, w.week)).toBe(once);
    expect(scenarioTry(once, w.week)).toEqual({ week: w.week });
  });

  it("says, once it ends, whether the goal was met, and counts only once", () => {
    const fold = foldRun(library, withTry(emptyMeta(), w.week), run, undefined, "2026-09-23", { week: w.week });
    expect(fold.scenario).toEqual({ week: w.week, result: { met, cards: run.cardCount, ending: run.over!.endingId, history: fold.history!.key } });
    expect(fold.meta.scenarios).toEqual([{ week: w.week, result: fold.scenario!.result }]);
    // A second run marked for the same week, which the game does not deal, changes nothing.
    const again = foldRun(library, fold.meta, played(w, 7), undefined, "2026-09-23", { week: w.week });
    expect(again.scenario).toBeNull();
    expect(again.meta.scenarios).toEqual(fold.meta.scenarios);
  });

  it("is left alone by a run that was not it, and counts when its start was not written", () => {
    const tried = withTry(emptyMeta(), w.week);
    const other = foldRun(library, tried, run, undefined, "2026-09-23");
    expect(other.scenario).toBeNull();
    expect(other.meta.scenarios).toEqual([{ week: w.week }]);
    // The mark came with the saved run, though the profile never said the try began.
    expect(foldRun(library, emptyMeta(), run, undefined, "2026-09-23", { week: w.week }).meta.scenarios).toEqual([
      { week: w.week, result: expect.objectContaining({ met }) },
    ]);
  });

  it("keeps the week's contracts as any full reign does", () => {
    expect(foldRun(library, withTry(emptyMeta(), w.week), run, undefined, "2026-09-23", { week: w.week }).newContracts).toEqual(
      foldRun(library, emptyMeta(), run, undefined, "2026-09-23").newContracts,
    );
  });
});

describe("a profile's tries, read back", () => {
  it("start with none for a profile from before", () => {
    expect(migrateMeta({ v: 10, runs: 3 })!.scenarios).toEqual([]);
  });

  it("come back from a save exactly", () => {
    const meta = foldRun(library, withTry(withTry(emptyMeta(), 2), 1), played(SCENARIO_WEEKS[0]!), undefined, "2026-09-23", { week: 1 }).meta;
    expect(migrateMeta(JSON.parse(JSON.stringify(meta)))).toEqual(meta);
  });

  it("are read week by week: once each, from the first, and a result the game could not have written is dropped", () => {
    const result = { met: true, cards: 105, ending: "finale_muddle", history: "x" };
    const meta = migrateMeta({
      v: 11,
      scenarios: [
        { week: 3, result },
        { week: 1 },
        { week: 3 },
        { week: 0 },
        { week: "2" },
        { week: 2, result: { ...result, met: "yes" } },
        "junk",
        { week: 4, result: { ...result, cards: -1 } },
      ],
    })!;
    expect(meta.scenarios).toEqual([{ week: 1 }, { week: 2 }, { week: 3, result }, { week: 4 }]);
  });
});

describe("a goal", () => {
  const run = played(SCENARIO_WEEKS[0]!);
  it("is kept only by an id the contracts deal, on a run that has ended", () => {
    expect(keepsContract("no_such_contract", run, "ascent")).toBe(false);
    expect(keepsContract("ascent:middle", run, "ascent")).toBe(false);
    expect(keepsContract("broad:left", run, "ascent")).toBe(false);
    expect(keepsContract(`ascent:${run.align}`, { ...run, over: null }, "ascent")).toBe(false);
  });
});
