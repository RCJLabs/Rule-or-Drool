import type { Band, GameState, PlayerAlign } from "../engine/types";
import { keepsContract } from "./contracts";
import table from "./scenario-weeks.json";
import type { MetaState, ScenarioResult, ScenarioTry } from "./types";

/**
 * The week's scenario (BACKLOG-12 phase 78): one run for everyone each week, a fixed seed, side
 * and promise, and a goal in the contracts' words. The daily gives everyone the same run and no
 * goal; the contracts give goals and no shared run. One try counts, and says whether the goal was
 * met, so a group can compare whether they did the same hard thing.
 *
 * A goal is only as hard as the run it is set on, so each week was measured before it was dealt
 * (`npm run scenarios`) and the table ships with the game.
 */
export interface ScenarioWeek {
  week: number;
  seed: number;
  align: PlayerAlign;
  /** The promise the goal names, or none. */
  mandates: string[];
  /** A contract's id, which gives the goal its words and says whether a run met it. */
  goal: string;
  /**
   * The share of runs the informed voter and the eyes bot met the goal in, each aiming at it and
   * deciding a card in five their own way.
   */
  rates: [number, number];
}

/**
 * How each week was measured: the share of cards a player decides otherwise than the bot, the
 * runs a candidate is screened on and then measured on, and the band both bots must meet the
 * goal within.
 */
export const SCENARIO_MEASURE = { eps: 0.2, screen: 30, trials: 100, band: [0.2, 0.5] } as const;

/** The deck the weeks were measured on: another deck deals other runs, which are not measured. */
export const SCENARIO_DECK: string = table.deck;

export const SCENARIO_WEEKS: readonly ScenarioWeek[] = table.weeks as ScenarioWeek[];

/** The week's scenario, or null for a week before the first or past the table's last. */
export function scenarioFor(week: number | null): ScenarioWeek | null {
  if (week === null) return null;
  return SCENARIO_WEEKS[week - 1]?.week === week ? SCENARIO_WEEKS[week - 1]! : null;
}

/** The profile's try at a week's scenario, if it has started one. */
export function scenarioTry(meta: Pick<MetaState, "scenarios">, week: number): ScenarioTry | undefined {
  return (meta.scenarios ?? []).find((t) => t.week === week);
}

/** The profile with a week's try started: starting it is the try (BACKLOG-12 phase 78). */
export function withTry(meta: MetaState, week: number): MetaState {
  if (scenarioTry(meta, week)) return meta;
  return { ...meta, scenarios: [...(meta.scenarios ?? []), { week }].sort((a, b) => a.week - b.week) };
}

/**
 * How a week's try went, for a run that has ended, or null when it does not count: a week the
 * table does not have, or a try that already has its result.
 */
export function scenarioResult(meta: Pick<MetaState, "scenarios">, week: number, run: GameState, band: Band, history: string): ScenarioResult | null {
  const s = scenarioFor(week);
  if (!s || !run.over || scenarioTry(meta, week)?.result) return null;
  return { met: keepsContract(s.goal, run, band), cards: run.cardCount, ending: run.over.endingId, history };
}

/** The profile's tries with a week's result in place, the week started if it was not. */
export function withResult(scenarios: readonly ScenarioTry[], week: number, result: ScenarioResult): ScenarioTry[] {
  return [...scenarios.filter((t) => t.week !== week), { week, result }].sort((a, b) => a.week - b.week);
}
