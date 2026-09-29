import { easySide } from "./campaign";
import type { EngineConfig } from "./config";
import type { Library } from "./library";
import { fxDeltas } from "./state";
import type { BlocKey, Card, GameState, Side } from "./types";
import { BLOC_KEYS } from "./types";

/**
 * The deck notices how you rule (BACKLOG-13 phase 94). The six habit cards answered marks that
 * particular self-serving choices leave; these answer a way of ruling, read off every choice as it
 * is made: a bloc pleased time after time, one left out, the money first, the easy way taken, the
 * State cut, every vote arranged, every campaign won the easy way. When a run shows one, it is
 * marked, and a card written for it can be dealt, as a habit card is.
 *
 * Each is set where a tenth to a third of the runs of the players it is about show it, measured
 * on 1,000 runs a bot: the same bloc pleased five running, 11-12%; one hurt six running, 20-33%;
 * the money raised four running, 16-21%; six self-serving choices running, 6-32%; the State cut
 * six running, 2-20%; two campaigns won the easy way and none honestly, 13-28%; two votes
 * arranged and none left to the count, 18% of the mixed bot's runs and 32% of the greedy bot's.
 *
 * The cards are weighted 30, so one comes while the way still shows: the next card in half the
 * runs that show it and within 13-20 in nine in ten. At 4, as the six are, half the marks never
 * met their card, and a tenth of those that did came 50 or more cards on.
 */
export const HABIT_RUNS = { favoured: 5, leftOut: 6, money: 4, easy: 6, state: 6, votes: 2, campaigns: 2 } as const;

/** How the run has been ruling, choice by choice. */
export interface HabitTrack {
  /** The bloc the last choices pleased most, and how many running; null after one that pleased none. */
  pleased: { bloc: BlocKey | null; run: number };
  /** Choices running that cost each bloc something. */
  hurt: Record<BlocKey, number>;
  /** Choices running that raised money. */
  money: number;
  /** Self-serving choices running, of those that lean either way. */
  easy: number;
  /** Choices running that cut the State. */
  state: number;
  /** Campaigns fought the easy way, and honestly. */
  campaigns: { easy: number; clean: number };
}

export const EMPTY_HABITS: HabitTrack = {
  pleased: { bloc: null, run: 0 },
  hurt: { base: 0, backers: 0, public: 0 },
  money: 0,
  easy: 0,
  state: 0,
  campaigns: { easy: 0, clean: 0 },
};

/** The marks a way of ruling leaves, each read by the cards written for it. */
export function habitMarks(cfg: Pick<EngineConfig, "habitMarkPrefix">): {
  favoured: Record<BlocKey, string>;
  leftOut: Record<BlocKey, string>;
  money: string;
  easy: string;
  state: string;
  votes: string;
  campaigns: string;
} {
  const m = (name: string) => `${cfg.habitMarkPrefix}${name}`;
  const byBloc = (name: string) => Object.fromEntries(BLOC_KEYS.map((b) => [b, m(`${name}_${b}`)])) as Record<BlocKey, string>;
  return {
    favoured: byBloc("favoured"),
    leftOut: byBloc("left_out"),
    money: m("money_first"),
    easy: m("easy_way"),
    state: m("state_cut"),
    votes: m("every_vote"),
    campaigns: m("every_campaign"),
  };
}

/** Every mark a way of ruling can leave. */
export function allHabitMarks(cfg: Pick<EngineConfig, "habitMarkPrefix">): string[] {
  const m = habitMarks(cfg);
  return [...Object.values(m.favoured), ...Object.values(m.leftOut), m.money, m.easy, m.state, m.votes, m.campaigns];
}

/**
 * The choice just made, read into the run's ways, and any way it now shows marked. It reads the
 * side's effects as the card states them, and the run's votes as its stats have them, so it is
 * called once they count this card.
 */
export function noticeHabits(lib: Library, state: GameState, card: Card, side: Side): GameState {
  const choice = card[side];
  const d = fxDeltas(choice.fx);
  const was = state.habits ?? EMPTY_HABITS;
  // The bloc a choice pleases is the one it raises most, when one is raised more than the others.
  const up = BLOC_KEYS.filter((b) => (d[b] ?? 0) > 0).sort((a, b) => (d[b] ?? 0) - (d[a] ?? 0));
  const top = up[0] !== undefined && (up[1] === undefined || (d[up[0]] ?? 0) > (d[up[1]] ?? 0)) ? up[0] : null;
  const drift = choice.drift ?? 0;
  const campaign = card.campaign ? (easySide(card) === side ? "easy" : "clean") : null;
  const track: HabitTrack = {
    pleased: { bloc: top, run: top === null ? 0 : top === was.pleased.bloc ? was.pleased.run + 1 : 1 },
    hurt: Object.fromEntries(BLOC_KEYS.map((b) => [b, (d[b] ?? 0) < 0 ? was.hurt[b] + 1 : 0])) as Record<BlocKey, number>,
    money: (d.money ?? 0) > 0 ? was.money + 1 : 0,
    easy: drift < 0 ? was.easy + 1 : drift > 0 ? 0 : was.easy,
    state: (d.inst ?? 0) < 0 ? was.state + 1 : 0,
    campaigns: campaign ? { ...was.campaigns, [campaign]: was.campaigns[campaign] + 1 } : was.campaigns,
  };
  const marks = habitMarks(lib.config);
  const shown: string[] = [];
  if (track.pleased.bloc && track.pleased.run >= HABIT_RUNS.favoured) shown.push(marks.favoured[track.pleased.bloc]);
  for (const b of BLOC_KEYS) if (track.hurt[b] >= HABIT_RUNS.leftOut) shown.push(marks.leftOut[b]);
  if (track.money >= HABIT_RUNS.money) shown.push(marks.money);
  if (track.easy >= HABIT_RUNS.easy) shown.push(marks.easy);
  if (track.state >= HABIT_RUNS.state) shown.push(marks.state);
  if (state.stats.electionsCheated >= HABIT_RUNS.votes && state.stats.electionsHonest === 0) shown.push(marks.votes);
  if (track.campaigns.easy >= HABIT_RUNS.campaigns && track.campaigns.clean === 0) shown.push(marks.campaigns);
  const added = shown.filter((f) => !state.flags.includes(f));
  return { ...state, habits: track, ...(added.length ? { flags: [...state.flags, ...added] } : {}) };
}
