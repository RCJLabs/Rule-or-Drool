import { epilogueKey } from "../engine/endings";
import type { Library } from "../engine/library";
import { exitBand } from "../engine/state";
import type { GameState } from "../engine/types";
import { META_SAVE_VERSION } from "../version";
import { OBJECTIVES } from "./objectives";
import type { DailyRecord, MetaState } from "./types";

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
    daily: null,
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
}

/**
 * Fold a finished run into meta state: record the ending and epilogue, then re-check every
 * objective against the updated meta. Pure, so the UI can show what a run earned.
 */
export function foldRun(lib: Library, meta: MetaState, run: GameState, daily?: { day: string; seed: number }): RunFold {
  if (!run.over) return { meta, newObjectives: [], newUnlocks: [], newEnding: false };
  const endingId = run.over.endingId;
  const band = exitBand(lib, run);

  const newEnding = !(endingId in meta.endings);
  const next: MetaState = {
    ...meta,
    runs: meta.runs + 1,
    endings: { ...meta.endings, [endingId]: (meta.endings[endingId] ?? 0) + 1 },
    epilogues: meta.epilogues.includes(run.over.epilogueKey) ? meta.epilogues : [...meta.epilogues, run.over.epilogueKey],
    bestCards: Math.max(meta.bestCards, run.cardCount),
    alignsPlayed: meta.alignsPlayed.includes(run.align) ? meta.alignsPlayed : [...meta.alignsPlayed, run.align],
    objectives: { ...meta.objectives },
    unlocks: [...meta.unlocks],
  };
  if (daily) {
    const record: DailyRecord = { day: daily.day, seed: daily.seed, cards: run.cardCount, endingId, band };
    next.daily = record;
  }

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
  return { meta: next, newObjectives, newUnlocks, newEnding };
}

/** Codex progress for the UI. */
export interface CodexProgress {
  endingsSeen: number;
  endingsTotal: number;
  epiloguesSeen: number;
  epiloguesTotal: number;
  objectivesDone: number;
  objectivesTotal: number;
}

export function codexProgress(lib: Library, meta: MetaState): CodexProgress {
  return {
    endingsSeen: Object.keys(meta.endings).length,
    endingsTotal: lib.endings.size,
    epiloguesSeen: meta.epilogues.length,
    epiloguesTotal: new Set(lib.epilogues.map(epilogueKey)).size,
    objectivesDone: Object.keys(meta.objectives).length,
    objectivesTotal: OBJECTIVES.length,
  };
}
