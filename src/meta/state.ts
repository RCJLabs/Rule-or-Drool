import { arcOutcomes, epilogueKey, nearMisses } from "../engine/endings";
import type { Library } from "../engine/library";
import { exitBand } from "../engine/state";
import type { GameState } from "../engine/types";
import { META_SAVE_VERSION } from "../version";
import { LEGACIES, LEGACY_FLAGS } from "./legacies";
import { OBJECTIVES } from "./objectives";
import type { DailyRecord, MetaState , RunRecord } from "./types";

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
    advisorsKept: {},
    advisorsFired: {},
    mandatesKept: {},
    mandatesBroken: {},
    history: [],
    nearMissed: [],
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
    arcOutcomes: [...new Set([...meta.arcOutcomes, ...run.stats.arcOutcomes])],
    legacies: { ...meta.legacies },
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
  const legacies = run.flags.filter((f) => LEGACY_FLAGS.has(f));
  for (const f of legacies) next.legacies[f] = (next.legacies[f] ?? 0) + 1;

  // Whoever was still in the room at the end stayed; whoever you let go, you let go.
  for (const id of Object.values(run.cabinet)) {
    if (id === run.cabinet[lib.config.rivalRole]) continue; // the rival was never yours to keep
    next.advisorsKept[id] = (next.advisorsKept[id] ?? 0) + 1;
  }
  for (const id of run.stats.firedAdvisors) next.advisorsFired[id] = (next.advisorsFired[id] ?? 0) + 1;

  // A promise only counts as kept by a run that finished; a run cut short by an ouster
  // was still governed under it, which is the whole point of choosing one.
  const mandateKept = !!run.mandate && run.mandateBrokenAt === null;
  if (run.mandate) {
    const tally = mandateKept ? next.mandatesKept : next.mandatesBroken;
    tally[run.mandate] = (tally[run.mandate] ?? 0) + 1;
  }

  const record: RunRecord = {
    align: run.align,
    cards: run.cardCount,
    era: run.era,
    endingId,
    band,
    rival: run.cabinet[lib.config.rivalRole] ?? null,
    legacies,
    mandate: run.mandate,
    mandateKept,
  };
  next.history = [record, ...meta.history].slice(0, HISTORY_LENGTH);
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
  /** Story outcomes: the collectible that rewards playing an arc out (BACKLOG item 10). */
  storiesSeen: number;
  storiesTotal: number;
  legaciesSeen: number;
  legaciesTotal: number;
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
    storiesSeen: meta.arcOutcomes.length,
    storiesTotal: [...lib.arcs.keys()].reduce((n, id) => n + arcOutcomes(lib, id).length, 0),
    legaciesSeen: Object.keys(meta.legacies).length,
    legaciesTotal: Object.keys(LEGACIES).length,
    objectivesDone: Object.keys(meta.objectives).length,
    objectivesTotal: OBJECTIVES.length,
  };
}
