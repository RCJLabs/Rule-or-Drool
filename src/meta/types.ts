import type { Band, GameState, PlayerAlign } from "../engine/types";

/**
 * Meta progression (TRANSFER.md 5.10). Stored separately from run state and versioned
 * separately, per the house conventions in section 12.
 */
export interface MetaState {
  v: number;
  /** Runs finished, ever. */
  runs: number;
  /** Ending id -> how many times it has ended a run. */
  endings: Record<string, number>;
  /** Epilogue keys (`band:align:era`) seen. */
  epilogues: string[];
  /** Objective id -> the run number on which it was first completed. */
  objectives: Record<string, number>;
  /** Unlock tokens earned; gates modifiers and arcs that name a `requires`. */
  unlocks: string[];
  /** Longest run in cards. */
  bestCards: number;
  alignsPlayed: PlayerAlign[];
  /**
   * The history half of the codex (BACKLOG item 10). Endings reward dying in creative ways;
   * these reward playing a story out, keeping a cabinet, and leaving something behind.
   */
  /** Arc outcomes reached, as `${cardId}:${side}`: which branch of a story you have seen. */
  arcOutcomes: string[];
  /** Legacy flag -> how many runs ended with the country still carrying it. */
  legacies: Record<string, number>;
  /**
   * History key (`decision:band:side`) -> how many runs history has called that
   * (post-run histories). The collectible a run gets for what it did, not how it stopped.
   */
  histories: Record<string, number>;
  /** Advisor id -> runs they served to the end. */
  advisorsKept: Record<string, number>;
  /** Advisor id -> times you let them go. */
  advisorsFired: Record<string, number>;
  /** Mandate id -> runs finished with that promise still intact (BACKLOG-2 phase 16). */
  mandatesKept: Record<string, number>;
  /** Mandate id -> runs that took it on and broke it. */
  mandatesBroken: Record<string, number>;
  /** The last few runs, newest first. */
  history: RunRecord[];
  /**
   * Endings the player has come within reach of but not reached. The codex names these
   * rather than hiding them, so an undiscovered ending is a target rather than a blank
   * (BACKLOG-2 phase 13).
   */
  nearMissed: string[];
  /** Result of the most recent daily-seed run, if any. */
  daily: DailyRecord | null;
}

/** One line of the history: enough to recognise the run, not enough to replay it. */
export interface RunRecord {
  align: PlayerAlign;
  cards: number;
  era: number;
  endingId: string;
  band: Band;
  /** The rival you faced, by advisor id. */
  rival: string | null;
  /** Legacy flags the country was left with. */
  legacies: string[];
  /** What history called the run, as a history key; null for runs recorded before histories. */
  history: string | null;
  /** The promise the run was taken on, if any, and whether it survived the run. */
  mandate: string | null;
  mandateKept: boolean;
}

export interface DailyRecord {
  /** UTC day, `YYYY-MM-DD`. */
  day: string;
  seed: number;
  cards: number;
  endingId: string;
  band: Band;
}

export interface ObjectiveContext {
  /** The finished run, or null when objectives are evaluated outside a run. */
  run: GameState | null;
  /** Meta state with this run already folded in. */
  meta: MetaState;
  /** Exit band of the finished run. */
  band: Band | null;
}

export interface Objective {
  id: string;
  title: string;
  hint: string;
  /** Unlock token granted the first time this is completed. */
  unlocks?: string;
  check: (ctx: ObjectiveContext) => boolean;
}
