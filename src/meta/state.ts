import { arcOutcomes, epilogueKey, nearMisses } from "../engine/endings";
import { questionOf, type Library } from "../engine/library";
import { exitBand } from "../engine/state";
import type { GameState } from "../engine/types";
import { META_SAVE_VERSION } from "../version";
import { ALL_HISTORY_KEYS, historyOf, type History } from "./histories";
import { LEGACIES, LEGACY_FLAGS } from "./legacies";
import { contractsKept, keptIn, weekNumber, withKept } from "./contracts";
import { OBJECTIVES, collectsEnding } from "./objectives";
import { answeredQuestions } from "./questions";
import type { DailyEntry, MetaState, RunRecord } from "./types";

/** How many past runs the codex keeps. */
export const HISTORY_LENGTH = 12;
/** How close a finished run had to get for the codex to name what it nearly was. */
export const NEAR_MISS_WITHIN = 12;

export function emptyMeta(): MetaState {
  return {
    v: META_SAVE_VERSION,
    runs: 0,
    endings: {},
    epilogues: [],
    objectives: {},
    unlocks: [],
    bestCards: 0,
    alignsPlayed: [],
    arcOutcomes: [],
    legacies: {},
    histories: {},
    advisorsKept: {},
    advisorsFired: {},
    mandatesKept: {},
    mandatesBroken: {},
    history: [],
    nearMissed: [],
    dailies: [],
    contracts: [],
  };
}

export interface RunFold {
  meta: MetaState;
  /** Objectives completed for the first time by this run. */
  newObjectives: string[];
  /** Unlock tokens earned for the first time by this run. */
  newUnlocks: string[];
  /** True the first time this ending is seen. */
  newEnding: boolean;
  /** What history calls the run, and whether this is the first time it has been called that. */
  history: History | null;
  newHistory: boolean;
  /** The day this run went into the log as, when it was that day's daily. */
  daily: DailyEntry | null;
  /** This week's contracts the run kept that were not kept already (BACKLOG-10 phase 60). */
  newContracts: string[];
}

/**
 * Fold a finished run into meta state: record the ending and epilogue, then re-check every
 * objective against the updated meta. Pure, so the UI can show what a run earned. `today` is the
 * UTC day the run ended on, which says whose week's contracts it can keep; without one it keeps
 * none.
 */
export function foldRun(lib: Library, meta: MetaState, run: GameState, daily?: { day: string; seed: number }, today?: string): RunFold {
  if (!run.over) return { meta, newObjectives: [], newUnlocks: [], newEnding: false, history: null, newHistory: false, daily: null, newContracts: [] };
  const endingId = run.over.endingId;
  const band = exitBand(lib, run);

  // A first term's end is not one the codex collects, so it is never a new one for it.
  const newEnding = collectsEnding(endingId) && !(endingId in meta.endings);
  const history = historyOf(run, band);
  const newHistory = !(history.key in (meta.histories ?? {}));
  const next: MetaState = {
    ...meta,
    runs: meta.runs + 1,
    endings: { ...meta.endings, [endingId]: (meta.endings[endingId] ?? 0) + 1 },
    epilogues: meta.epilogues.includes(run.over.epilogueKey) ? meta.epilogues : [...meta.epilogues, run.over.epilogueKey],
    bestCards: Math.max(meta.bestCards, run.cardCount),
    alignsPlayed: meta.alignsPlayed.includes(run.align) ? meta.alignsPlayed : [...meta.alignsPlayed, run.align],
    objectives: { ...meta.objectives },
    unlocks: [...meta.unlocks],
    arcOutcomes: [...new Set([...meta.arcOutcomes, ...run.stats.arcOutcomes])],
    legacies: { ...meta.legacies },
    histories: { ...(meta.histories ?? {}), [history.key]: ((meta.histories ?? {})[history.key] ?? 0) + 1 },
    advisorsKept: { ...meta.advisorsKept },
    advisorsFired: { ...meta.advisorsFired },
    mandatesKept: { ...meta.mandatesKept },
    mandatesBroken: { ...meta.mandatesBroken },
    history: meta.history,
    nearMissed: [...meta.nearMissed],
  };

  // What this run came close to but did not reach. Recorded at the end rather than as it
  // happens, so it costs nothing per card and cannot be read back mid-run.
  for (const { endingId: nearId } of nearMisses(lib, run, NEAR_MISS_WITHIN)) {
    if (nearId !== endingId && !next.nearMissed.includes(nearId)) next.nearMissed.push(nearId);
  }

  // What the country was left carrying. Only the flags that name something durable count;
  // the rest are bookkeeping the player never sees (BACKLOG item 10).
  // The record keeps every legacy the country ends with, which is what the next reign of the line
  // takes over; the codex counts only what this reign left, not what it inherited (phase 63).
  const legacies = run.flags.filter((f) => LEGACY_FLAGS.has(f));
  const inherited = run.inherited?.legacies ?? [];
  for (const f of legacies) if (!inherited.includes(f)) next.legacies[f] = (next.legacies[f] ?? 0) + 1;

  // Whoever was still in the room at the end stayed; whoever you let go, you let go.
  for (const id of Object.values(run.cabinet)) {
    if (id === run.cabinet[lib.config.rivalRole]) continue; // the rival was never yours to keep
    next.advisorsKept[id] = (next.advisorsKept[id] ?? 0) + 1;
  }
  for (const id of run.stats.firedAdvisors) next.advisorsFired[id] = (next.advisorsFired[id] ?? 0) + 1;

  // A promise only counts as kept by a run that finished; a run cut short by an ouster
  // was still governed under it, which is the whole point of choosing one. Each of a
  // platform's two is kept or broken on its own (BACKLOG-10 phase 62).
  const promises = run.mandates.map((id) => ({ id, kept: !(id in run.mandatesBroken) }));
  for (const { id, kept } of promises) {
    const tally = kept ? next.mandatesKept : next.mandatesBroken;
    tally[id] = (tally[id] ?? 0) + 1;
  }

  const record: RunRecord = {
    align: run.align,
    cards: run.cardCount,
    era: run.era,
    endingId,
    band,
    rival: run.cabinet[lib.config.rivalRole] ?? null,
    legacies,
    history: history.key,
    mandates: promises,
  };
  // A second road counts like any run, and says what it is (BACKLOG-5 phase 34). It is
  // never the daily: that was the first road's, and the fold is only told so for the first.
  if (run.road) record.road = true;
  // A line of runs (BACKLOG-10 phase 63): which reign of it this was, and where the rival ended.
  if (run.inherited) record.line = run.inherited.line;
  record.rivalStanding = run.rivalStanding;
  next.history = [record, ...meta.history].slice(0, HISTORY_LENGTH);
  // One entry a day, and only for the run that was dealt as that day's daily: the first to
  // finish keeps the day (BACKLOG-5 phase 38).
  let entry: DailyEntry | null = null;
  if (daily && daily.seed === run.seed && !meta.dailies.some((d) => d.day === daily.day)) {
    entry = { day: daily.day, history: history.key, ending: endingId, cards: run.cardCount, ...(run.deck ? { deck: run.deck } : {}) };
    next.dailies = [...meta.dailies, entry].sort((a, b) => a.day.localeCompare(b.day));
  }

  // This week's contracts, each kept once (BACKLOG-10 phase 60).
  const week = today ? weekNumber(today) : null;
  const newContracts = week === null ? [] : contractsKept(run, band, week, keptIn(meta, week));
  if (week !== null) next.contracts = withKept(meta.contracts, week, newContracts);

  const newObjectives: string[] = [];
  const newUnlocks: string[] = [];
  for (const o of OBJECTIVES) {
    if (o.id in next.objectives) continue;
    if (!o.check({ run, meta: next, band })) continue;
    next.objectives[o.id] = next.runs;
    newObjectives.push(o.id);
    if (o.unlocks && !next.unlocks.includes(o.unlocks)) {
      next.unlocks.push(o.unlocks);
      newUnlocks.push(o.unlocks);
    }
  }
  return { meta: next, newObjectives, newUnlocks, newEnding, history, newHistory, daily: entry, newContracts };
}

/** Codex progress for the UI. */
export interface CodexProgress {
  endingsSeen: number;
  endingsTotal: number;
  /**
   * Story outcomes: the collectible that rewards playing an arc out (BACKLOG item 10). The
   * questions are arcs too, but they are counted apart, by how they were answered.
   */
  storiesSeen: number;
  storiesTotal: number;
  /** Questions answered at least once, of all the questions (BACKLOG-6 phase 42). */
  questionsAsked: number;
  questionsTotal: number;
  legaciesSeen: number;
  legaciesTotal: number;
  historiesSeen: number;
  historiesTotal: number;
  epiloguesSeen: number;
  epiloguesTotal: number;
  objectivesDone: number;
  objectivesTotal: number;
}

export function codexProgress(lib: Library, meta: MetaState): CodexProgress {
  const questions = answeredQuestions(lib, meta);
  return {
    endingsSeen: Object.keys(meta.endings).filter(collectsEnding).length,
    endingsTotal: [...lib.endings.keys()].filter(collectsEnding).length,
    epiloguesSeen: meta.epilogues.length,
    epiloguesTotal: new Set(lib.epilogues.map(epilogueKey)).size,
    // Only outcomes of stories this deck still has: a profile can carry one of a card an update
    // took out, as the left's last step of the war was in phase 42.
    storiesSeen: meta.arcOutcomes.filter((key) => {
      const card = lib.cards.get(key.split(":")[0]!);
      return card?.arc !== undefined && questionOf(lib, card) === undefined;
    }).length,
    storiesTotal: [...lib.arcs.values()].filter((a) => a.question === undefined).reduce((n, a) => n + arcOutcomes(lib, a.id).length, 0),
    questionsAsked: questions.filter((q) => q.asked > 0).length,
    questionsTotal: questions.length,
    legaciesSeen: Object.keys(meta.legacies).length,
    legaciesTotal: Object.keys(LEGACIES).length,
    historiesSeen: Object.keys(meta.histories ?? {}).length,
    historiesTotal: ALL_HISTORY_KEYS.length,
    objectivesDone: Object.keys(meta.objectives).length,
    objectivesTotal: OBJECTIVES.length,
  };
}
