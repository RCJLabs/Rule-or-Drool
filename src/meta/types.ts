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
  /** Result of the most recent daily-seed run, if any. */
  daily: DailyRecord | null;
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
