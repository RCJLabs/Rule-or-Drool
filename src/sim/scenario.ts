import { draw } from "../engine/draw";
import { getCard, type Library } from "../engine/library";
import { resolve } from "../engine/resolve";
import { makeRng } from "../engine/rng";
import { exitBand, newRun, rollSetup } from "../engine/state";
import { PLAYER_ALIGNS } from "../engine/types";
import { keepsContract } from "../meta/contracts";
import { SCENARIO_MEASURE, type ScenarioWeek } from "../meta/scenario";
import { honest, keep, leave, noisy } from "./aims";
import { BOTS, makeContext, type Bot } from "./bots";

/**
 * How a week's scenario is measured (BACKLOG-12 phase 78), shared by `npm run scenarios`, which
 * searches for each week's, and the test that measures a week again and expects the same.
 */

/** A kind of goal a week can set, from the contracts' wording, and how a player aims at it. */
export interface GoalKind {
  key: string;
  params: readonly string[];
  /** The goal names the side; otherwise the week deals one. */
  sided?: boolean;
  /** The promise the goal names. */
  promise?: (param: string) => string;
  aim: (b: Bot, param: string) => Bot;
}

const straight = (b: Bot) => b;

/**
 * The goals a week can set, in the order the weeks take turns at them. Left out: goals no week
 * fitted in a first sample of 24 seeds (a clean reign and the clean promise, which careful play
 * meets nearly always; most rare legacies, which it nearly never does), the Decay (which the two
 * bots do not aim at) and a run with no self-serving choice, which asks for a saint.
 */
export const GOAL_KINDS: readonly GoalKind[] = [
  { key: "ascent", params: PLAYER_ALIGNS, sided: true, aim: straight },
  { key: "promise", params: ["m_loyal", "m_decree"], promise: (m) => m, aim: keep },
  { key: "muddle", params: PLAYER_ALIGNS, sided: true, aim: straight },
  { key: "legacy", params: ["took_the_skim", "media_captured"], aim: leave },
  { key: "ascentClean", params: PLAYER_ALIGNS, sided: true, aim: honest },
  { key: "broad", params: [""], aim: straight },
  { key: "promiseBroad", params: [""], promise: () => "m_broad", aim: keep },
  { key: "muddleClean", params: [""], aim: honest },
  { key: "legacyHard", params: ["ring_started"], aim: leave },
];

export function goalKindOf(goal: string): { kind: GoalKind; param: string } {
  const [key, param = ""] = goal.split(/:(.*)/s);
  const kind = GOAL_KINDS.find((k) => k.key === key);
  if (!kind) throw new Error(`no kind for goal ${goal}`);
  return { kind, param };
}

export type Measured = Omit<ScenarioWeek, "rates">;

/**
 * The share of `n` runs of a week's run, from the `from`th, in which a bot aiming at the goal and
 * deciding a card in five its own way meets it.
 */
export function goalRate(lib: Library, w: Measured, aim: (b: Bot) => Bot, bot: "informed" | "eyes", n: number, from: number): number {
  const player = noisy(aim(BOTS[bot]), SCENARIO_MEASURE.eps);
  let met = 0;
  for (let i = from; i < from + n; i++) {
    const rng = makeRng((Math.imul(w.seed ^ 0x2545f491, 31) + Math.imul(i, 7919) + (bot === "eyes" ? 104_729 : 0)) | 0);
    let s = newRun(lib, w.seed, { ...rollSetup(lib, w.seed, w.align, []), mandates: w.mandates });
    while (!s.over) {
      s = draw(lib, s);
      const card = getCard(lib, s.current!);
      s = resolve(lib, s, card.id, player(makeContext(lib, s, card, rng, { danger: 25 })));
    }
    if (keepsContract(w.goal, s, exitBand(lib, s))) met++;
  }
  return met / n;
}

const round = (r: number) => Math.round(r * 100) / 100;

/** A week's rates on the full count, [informed, eyes], as the table keeps them. */
export function measureWeek(lib: Library, w: Measured): [number, number] {
  const { kind, param } = goalKindOf(w.goal);
  const aim = (b: Bot) => kind.aim(b, param);
  const { trials, screen } = SCENARIO_MEASURE;
  return [round(goalRate(lib, w, aim, "informed", trials, screen)), round(goalRate(lib, w, aim, "eyes", trials, screen))];
}
